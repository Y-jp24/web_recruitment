"use server";

import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { pickDisplayName } from "@/lib/postings";
import { getPostingBySlug } from "@/lib/postings-db";
import { validateApplication } from "@/lib/validation";
import { screenApplication, recordBlockedClient } from "@/lib/screening";
import { getClientIp, getClientIdFromCookie } from "@/lib/request";
import { CLIENT_ID_FIELD } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

export type ApplyState = {
  ok: boolean;
  errors?: Record<string, string>;
  formError?: string;
};

function isUniqueViolation(e: unknown): boolean {
  // Drizzle はエラーを DrizzleQueryError でラップするので cause を辿る
  let cur: unknown = e;
  for (let i = 0; i < 5 && cur; i++) {
    const err = cur as { code?: string; message?: string; cause?: unknown };
    if (err.code === "23505") return true;
    if (
      typeof err.message === "string" &&
      err.message.toLowerCase().includes("duplicate key")
    ) {
      return true;
    }
    cur = err.cause;
  }
  return false;
}

export async function submitApplication(
  slug: string,
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const posting = await getPostingBySlug(slug);
  if (!posting || !posting.active) {
    return { ok: false, formError: "この募集は現在受け付けていません。" };
  }

  // 1) 入力検証
  const { answers, errors } = validateApplication(posting, formData);

  const slotId = (formData.get("slot_id") as string | null) ?? "";
  if (!slotId) {
    errors["slot_id"] = "面談希望の枠を選択してください";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // 2) 応募者の識別（Cookie 優先、なければ localStorage 由来の hidden 値）
  const cookieCid = await getClientIdFromCookie();
  const formCid = (formData.get(CLIENT_ID_FIELD) as string | null) || null;
  const clientId = cookieCid || formCid;
  const ip = await getClientIp();

  // 3) 受付（insert）。slotId は UNIQUE なので二重予約は失敗する。
  const token = nanoid(24);
  let appId: string;
  try {
    const inserted = await db
      .insert(applications)
      .values({
        postingSlug: slug,
        slotId,
        answers,
        displayName: pickDisplayName(posting, answers),
        token,
        clientId,
        clientIp: ip,
      })
      .returning({ id: applications.id });
    appId = inserted[0].id;
  } catch (e) {
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        errors: {
          slot_id:
            "申し訳ありません。その枠はちょうど埋まりました。別の枠を選んでください。",
        },
      };
    }
    throw e;
  }

  // 4) 受付後にサイレント・スクリーニング（失敗しても応募受付は維持）
  try {
    const result = await screenApplication({ answers, clientId, ip });
    if (result.decision === "auto_reject") {
      await db
        .update(applications)
        .set({
          status: "auto_rejected",
          autoReason: result.reason,
          slotId: null, // 枠を解放
        })
        .where(eq(applications.id, appId));
      await recordBlockedClient({ clientId, ip, reason: result.reason });
    } else if (result.decision === "warn") {
      await db
        .update(applications)
        .set({ warnedTerms: result.terms })
        .where(eq(applications.id, appId));
    }
  } catch (e) {
    console.error("screening failed", e);
  }

  // 5) 応募者には常に完了ページ（ブロックは知らせない）
  redirect(`/p/${slug}/done?token=${token}`);
}
