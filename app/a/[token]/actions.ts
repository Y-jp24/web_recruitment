"use server";

/**
 * 予約確認ページ（/a/[token]）から応募者本人が行う操作。
 * - キャンセル: 予約を論理削除（status=cancelled）して枠を解放する
 * - 日程変更: キャンセルしたうえで、旧入力をプリフィルした応募ページへ遷移する
 *
 * 表示と同様、各操作は管理画面の設定（getSettings）で有効な場合のみ実行する。
 */

import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getApplicationByToken } from "@/lib/applications";
import { getSettings } from "@/lib/settings";
import { APPLICATION_STATUS, RESCHEDULE_FROM_PARAM } from "@/lib/constants";

/**
 * 予約をキャンセルする（論理削除）。
 * 有効な予約（status=new）のときだけ、status を cancelled にし枠を解放する。
 * @returns キャンセルできたら対象応募の postingSlug、できなければ null
 */
async function cancelByToken(token: string): Promise<string | null> {
  const app = await getApplicationByToken(token);
  // 存在しない、または有効な予約でない場合は何もしない（二重実行対策）
  if (!app || app.status !== APPLICATION_STATUS.NEW) {
    console.log("[reservation] キャンセル対象外", {
      token,
      status: app?.status,
    });
    return null;
  }
  await db
    .update(applications)
    .set({ status: APPLICATION_STATUS.CANCELLED, slotId: null })
    .where(eq(applications.id, app.id));
  console.log("[reservation] 予約をキャンセル", { id: app.id });
  return app.postingSlug;
}

/** 予約をキャンセルする（フォームアクション） */
export async function cancelReservation(formData: FormData): Promise<void> {
  const token = (formData.get("token") as string | null) ?? "";
  if (!token) return;

  const settings = await getSettings();
  if (!settings.reservationCancelEnabled) {
    console.log("[reservation] キャンセル機能が無効のため拒否", { token });
    return;
  }

  await cancelByToken(token);
  revalidatePath(`/a/${token}`);
}

/**
 * 日程変更（フォームアクション）。
 * 一旦キャンセルしてから、旧入力をプリフィルした応募ページへ遷移する。
 */
export async function rescheduleReservation(
  formData: FormData,
): Promise<void> {
  const token = (formData.get("token") as string | null) ?? "";
  if (!token) return;

  const settings = await getSettings();
  if (!settings.reservationRescheduleEnabled) {
    console.log("[reservation] 日程変更機能が無効のため拒否", { token });
    return;
  }

  const slug = await cancelByToken(token);
  if (!slug) {
    // 既にキャンセル/却下済みなどで変更できない場合は、確認ページへ戻す
    redirect(`/a/${token}`);
  }

  // 旧入力をプリフィルするため、from に元のトークンを付けて応募ページへ
  redirect(`/p/${slug}?${RESCHEDULE_FROM_PARAM}=${token}`);
}
