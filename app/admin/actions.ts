"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  slots,
  blockTerms,
  blockedClients,
  postingNotes,
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

// --- 案件ごとの管理者メモ ---

export async function savePostingNote(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = (formData.get("slug") as string | null) ?? "";
  const note = ((formData.get("note") as string | null) ?? "").trim();
  if (!slug) return;
  await db
    .insert(postingNotes)
    .values({ slug, note })
    .onConflictDoUpdate({
      target: postingNotes.slug,
      set: { note, updatedAt: new Date() },
    });
  revalidatePath("/admin/postings");
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
