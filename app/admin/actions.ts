"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, gte, lt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  slots,
  blockTerms,
  blockedClients,
  postings,
  postingFields,
} from "@/lib/db/schema";
import {
  ADMIN_COOKIE,
  checkPassword,
  expectedSessionToken,
} from "@/lib/auth";
import { assertAdmin } from "@/lib/auth-server";
import { jstDateTimeToUTC } from "@/lib/datetime";
import { getClientIp } from "@/lib/request";
import {
  checkLock,
  registerFailure,
  clearAttempts,
  throttleDelay,
} from "@/lib/login-throttle";

export type LoginState = { error?: string };

function lockMessage(retryAfterSec: number): string {
  const min = Math.ceil(retryAfterSec / 60);
  return `ログイン試行が多すぎます。約${min}分後に再度お試しください。`;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = (formData.get("password") as string | null) ?? "";
  const ip = (await getClientIp()) ?? "unknown";

  // 1) ロック中か確認
  const lock = await checkLock(ip);
  if (!lock.allowed) {
    return { error: lockMessage(lock.retryAfterSec) };
  }

  // 2) 照合（固定時間比較）。失敗時は遅延を挟む。
  if (!checkPassword(password)) {
    await throttleDelay();
    const result = await registerFailure(ip);
    if (!result.allowed) {
      return { error: lockMessage(result.retryAfterSec) };
    }
    return { error: "パスワードが正しくありません。" };
  }

  // 3) 成功 → 記録をクリアしてセッション発行
  await clearAttempts(ip);
  const token = await expectedSessionToken();
  const c = await cookies();
  c.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await assertAdmin();
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

// --- 応募の操作 ---

export async function rejectApplication(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  await db
    .update(applications)
    .set({ status: "rejected", slotId: null })
    .where(eq(applications.id, id));
  revalidatePath("/admin");
}

export async function unrejectApplication(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  await db
    .update(applications)
    .set({ status: "new", autoReason: null })
    .where(eq(applications.id, id));
  revalidatePath("/admin");
}

export async function deleteApplication(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  await db.delete(applications).where(eq(applications.id, id));
  revalidatePath("/admin");
}

export async function saveNote(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  const note = ((formData.get("note") as string | null) ?? "").trim();
  await db
    .update(applications)
    .set({ note: note || null })
    .where(eq(applications.id, id));
  revalidatePath("/admin");
}

/** この応募元（clientId + IP）をブロックし、応募も却下する */
export async function blockApplicationClient(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  const rows = await db
    .select({
      clientId: applications.clientId,
      clientIp: applications.clientIp,
    })
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);
  if (rows.length > 0) {
    const { clientId, clientIp } = rows[0];
    if (clientId || clientIp) {
      await db.insert(blockedClients).values({
        clientId: clientId ?? null,
        ip: clientIp ?? null,
        reason: "管理画面から手動ブロック",
      });
    }
  }
  await db
    .update(applications)
    .set({ status: "rejected", slotId: null })
    .where(eq(applications.id, id));
  revalidatePath("/admin");
}

// --- 募集案件（フォームビルダー） ---

function normalizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createPosting(formData: FormData): Promise<void> {
  await assertAdmin();
  const title = ((formData.get("title") as string | null) ?? "").trim();
  const slug = normalizeSlug((formData.get("slug") as string | null) ?? "");
  if (!title || !slug) return;

  const maxRow = await db
    .select({ max: sql<number>`coalesce(max(${postings.sortOrder}), 0)` })
    .from(postings);
  const sortOrder = (maxRow[0]?.max ?? 0) + 1;

  let created;
  try {
    created = await db
      .insert(postings)
      .values({ slug, title, active: true, sortOrder })
      .returning({ id: postings.id });
  } catch {
    // slug 重複など
    redirect("/admin/postings?error=slug");
  }
  revalidatePath("/admin/postings");
  redirect(`/admin/postings/${created[0].id}`);
}

export async function updatePostingMeta(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  const title = ((formData.get("title") as string | null) ?? "").trim();
  const slug = normalizeSlug((formData.get("slug") as string | null) ?? "");
  const active = formData.get("active") === "on";
  const intro = ((formData.get("intro") as string | null) ?? "").trim();
  const note = ((formData.get("note") as string | null) ?? "").trim();
  const afterApplyMessage = (
    (formData.get("afterApplyMessage") as string | null) ?? ""
  ).trim();
  if (!id || !title || !slug) return;
  await db
    .update(postings)
    .set({
      title,
      slug,
      active,
      intro: intro || null,
      note: note || null,
      afterApplyMessage: afterApplyMessage || null,
    })
    .where(eq(postings.id, id));
  revalidatePath("/admin/postings");
  revalidatePath(`/admin/postings/${id}`);
}

/** 応募完了後の案内文を既定文（未設定）に戻す */
export async function resetAfterApplyMessage(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  // null に戻すと表示側で DEFAULT_AFTER_APPLY_MESSAGE にフォールバックする
  await db
    .update(postings)
    .set({ afterApplyMessage: null })
    .where(eq(postings.id, id));
  revalidatePath(`/admin/postings/${id}`);
}

export async function deletePosting(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  await db.delete(postings).where(eq(postings.id, id));
  revalidatePath("/admin/postings");
  redirect("/admin/postings");
}

export async function addField(formData: FormData): Promise<void> {
  await assertAdmin();
  const postingId = formData.get("postingId") as string;
  if (!postingId) return;
  const maxRow = await db
    .select({ max: sql<number>`coalesce(max(${postingFields.sortOrder}), 0)` })
    .from(postingFields)
    .where(eq(postingFields.postingId, postingId));
  const sortOrder = (maxRow[0]?.max ?? 0) + 1;
  // データ名（回答キー）は内部用に自動生成して安定させる（UIには出さない）
  await db.insert(postingFields).values({
    postingId,
    name: `f_${crypto.randomUUID().slice(0, 8)}`,
    label: "新しい項目",
    type: "text",
    required: false,
    sortOrder,
  });
  revalidatePath(`/admin/postings/${postingId}`);
}

export type FieldSaveState = { savedAt: number };

/** 項目の保存（useActionState 用。保存時刻を返してUIにフィードバックする） */
export async function updateField(
  _prev: FieldSaveState,
  formData: FormData,
): Promise<FieldSaveState> {
  await assertAdmin();
  const id = formData.get("id") as string;
  const postingId = formData.get("postingId") as string;
  const label = ((formData.get("label") as string | null) ?? "").trim();
  const type = (formData.get("type") as string | null) ?? "text";
  const required = formData.get("required") === "on";
  const isName = formData.get("isName") === "on";
  const minLengthRaw = (formData.get("minLength") as string | null) ?? "";
  const minLength = minLengthRaw ? Number(minLengthRaw) : null;
  const placeholder = ((formData.get("placeholder") as string | null) ?? "").trim();
  const help = ((formData.get("help") as string | null) ?? "").trim();
  const optionsRaw = ((formData.get("options") as string | null) ?? "").trim();
  const options = optionsRaw
    ? optionsRaw
        .split(/[\n,]/)
        .map((o) => o.trim())
        .filter(Boolean)
    : null;
  if (!id) return { savedAt: 0 };

  // name（回答キー）は内部用のため UI から変更しない
  await db
    .update(postingFields)
    .set({
      label: label || "（無題）",
      type,
      required,
      isName,
      minLength:
        minLength !== null && !Number.isNaN(minLength) ? minLength : null,
      placeholder: placeholder || null,
      help: help || null,
      options,
    })
    .where(eq(postingFields.id, id));
  if (postingId) revalidatePath(`/admin/postings/${postingId}`);
  return { savedAt: Date.now() };
}

export async function deleteField(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  const postingId = formData.get("postingId") as string;
  await db.delete(postingFields).where(eq(postingFields.id, id));
  if (postingId) revalidatePath(`/admin/postings/${postingId}`);
}

/** ドラッグ&ドロップ後の並び順を保存（orderedIds の順に sortOrder を振り直す） */
export async function reorderFields(
  postingId: string,
  orderedIds: string[],
): Promise<void> {
  await assertAdmin();
  if (!postingId || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return;
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(postingFields)
      .set({ sortOrder: i + 1 })
      .where(
        and(
          eq(postingFields.id, orderedIds[i]),
          eq(postingFields.postingId, postingId),
        ),
      );
  }
  revalidatePath(`/admin/postings/${postingId}`);
}

// --- ブロック/注意ワード ---

export async function addBlockTerm(formData: FormData): Promise<void> {
  await assertAdmin();
  const term = ((formData.get("term") as string | null) ?? "").trim();
  const type = (formData.get("type") as string | null) ?? "block";
  if (!term) return;
  await db.insert(blockTerms).values({
    term,
    type: type === "warn" ? "warn" : "block",
    scope: "private",
  });
  revalidatePath("/admin/blocklist");
}

export async function deleteBlockTerm(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  await db.delete(blockTerms).where(eq(blockTerms.id, id));
  revalidatePath("/admin/blocklist");
}

export async function unblockClient(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  await db.delete(blockedClients).where(eq(blockedClients.id, id));
  revalidatePath("/admin/blocklist");
}

// --- 面談枠 ---

/** 日付 + 開始〜終了（JST）から 1 時間枠を生成して登録 */
export async function addSlots(formData: FormData): Promise<void> {
  await assertAdmin();
  const date = (formData.get("date") as string | null) ?? "";
  const start = (formData.get("start") as string | null) ?? "";
  const end = (formData.get("end") as string | null) ?? "";
  if (!date || !start || !end) return;

  const startH = Number(start.split(":")[0]);
  const endH = Number(end.split(":")[0]);
  if (Number.isNaN(startH) || Number.isNaN(endH) || endH <= startH) return;

  const candidates: { startAt: Date; endAt: Date }[] = [];
  for (let h = startH; h < endH; h++) {
    const startAt = jstDateTimeToUTC(date, `${String(h).padStart(2, "0")}:00`);
    const endAt = jstDateTimeToUTC(
      date,
      `${String(h + 1).padStart(2, "0")}:00`,
    );
    candidates.push({ startAt, endAt });
  }

  // 同じ開始時刻の重複を避ける
  const existing = await db
    .select({ startAt: slots.startAt })
    .from(slots)
    .where(
      and(
        gte(slots.startAt, candidates[0].startAt),
        inArray(
          slots.startAt,
          candidates.map((c) => c.startAt),
        ),
      ),
    );
  const existingSet = new Set(existing.map((e) => e.startAt.getTime()));
  const toInsert = candidates.filter(
    (c) => !existingSet.has(c.startAt.getTime()),
  );

  if (toInsert.length > 0) {
    await db.insert(slots).values(toInsert);
  }
  revalidatePath("/admin/slots");
}

export async function deleteSlot(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id") as string;
  await db.delete(slots).where(eq(slots.id, id));
  revalidatePath("/admin/slots");
}

/** 指定した JST 日付の枠をすべて削除 */
export async function deleteSlotsForDay(formData: FormData): Promise<void> {
  await assertAdmin();
  const date = (formData.get("date") as string | null) ?? "";
  if (!date) return;
  const dayStart = jstDateTimeToUTC(date, "00:00");
  const dayEnd = jstDateTimeToUTC(date, "24:00"); // 翌日 0:00 JST
  await db
    .delete(slots)
    .where(and(gte(slots.startAt, dayStart), lt(slots.startAt, dayEnd)));
  revalidatePath("/admin/slots");
}
