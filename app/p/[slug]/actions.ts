"use server";

import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { pickDisplayName } from "@/lib/postings";
import { getPostingBySlug } from "@/lib/postings-db";
import { validateApplication } from "@/lib/validation";
import { screenApplication, recordBlockedClient } from "@/lib/screening";
import { findBlockingApplication } from "@/lib/applications";
import { getClientIp, getClientIdFromCookie } from "@/lib/request";
import { CLIENT_ID_FIELD, CLIENT_ID_COOKIE } from "@/lib/auth";
import { APPLICATION_STATUS } from "@/lib/constants";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { generateMeetingUrl } from "@/lib/meeting";

// 却下済みの応募元が再応募してきた場合に、サイレントで自動却下する際の理由。
const DUPLICATE_REJECT_REASON = "重複応募（却下済みの応募元）";

// 応募者識別 Cookie（rcid）の有効期間（秒）。1年。
const CLIENT_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ApplyState = {
  ok: boolean;
  errors?: Record<string, string>;
  formError?: string;
  // エラー時に入力値を返してフォームへ復元する（React 19 の自動リセット対策）
  values?: Record<string, string>;
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
    return { ok: false, errors, values: answers };
  }

  // 2) 応募者の識別（Cookie 優先、なければ localStorage 由来の hidden 値）
  const cookieCid = await getClientIdFromCookie();
  const formCid = (formData.get(CLIENT_ID_FIELD) as string | null) || null;
  const clientId = cookieCid || formCid;
  const ip = await getClientIp();

  // 応募者識別子を Cookie にも保存する。これにより次回フォームを開いたとき、
  // サーバー側で本人を判定して案内ページ（/a/[token]）へ誘導できる。
  if (clientId && !cookieCid) {
    const c = await cookies();
    c.set(CLIENT_ID_COOKIE, clientId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CLIENT_ID_COOKIE_MAX_AGE,
    });
  }

  // 3) 重複応募・再応募のチェック（同一人物 = clientId もしくは IP 一致で判定）
  const blocking = await findBlockingApplication(slug, clientId, ip);
  if (blocking === "reserved") {
    // 既に有効な予約がある場合は、明示エラーで変更導線を案内する。
    console.log("[apply] 重複予約をブロック", { slug, clientId, ip });
    return {
      ok: false,
      errors: {
        slot_id:
          "この募集にはすでにご予約いただいています。日程の変更・キャンセルは、予約時に発行された確認用URLから行えます。",
      },
      values: answers,
    };
  }
  // 却下済みの応募元の再応募は、サイレントで自動却下扱いにする（理由は伝えない）。
  const silentReject = blocking === "rejected";
  if (silentReject) {
    console.log("[apply] 却下済み応募元の再応募をサイレント却下", {
      slug,
      clientId,
      ip,
    });
  }

  // 4) 受付（insert）。slotId は UNIQUE なので二重予約は失敗する。
  const token = nanoid(24);
  // オンライン面談URLを応募ごとに自動発行する（サイレント却下時は発行しない）。
  const meetingUrl = silentReject ? null : generateMeetingUrl();
  let appId: string;
  try {
    const inserted = await db
      .insert(applications)
      .values({
        postingSlug: slug,
        // サイレント却下時は枠を確保しない（slotId は null）
        slotId: silentReject ? null : slotId,
        answers,
        displayName: pickDisplayName(posting, answers),
        token,
        meetingUrl,
        status: silentReject
          ? APPLICATION_STATUS.AUTO_REJECTED
          : APPLICATION_STATUS.NEW,
        autoReason: silentReject ? DUPLICATE_REJECT_REASON : null,
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
        values: answers,
      };
    }
    throw e;
  }

  // 5) 受付後にサイレント・スクリーニング（失敗しても応募受付は維持）。
  //    既にサイレント却下済みの再応募はスクリーニング不要。
  if (!silentReject) {
    try {
      const result = await screenApplication({ answers, clientId, ip });
      if (result.decision === "auto_reject") {
        await db
          .update(applications)
          .set({
            status: APPLICATION_STATUS.AUTO_REJECTED,
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
  }

  // 6) 応募者には常に完了ページ（ブロックは知らせない）
  redirect(`/p/${slug}/done?token=${token}`);
}
