import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Info, CalendarX2, CalendarSync } from "lucide-react";
import { getApplicationByToken } from "@/lib/applications";
import { getPostingBySlug } from "@/lib/postings-db";
import { getSettings } from "@/lib/settings";
import { formatSlotRange } from "@/lib/datetime";
import { APPLICATION_STATUS } from "@/lib/constants";
import { Container, Card, buttonClass } from "@/components/ui";
import { MeetingLink } from "@/components/meeting-link";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { cancelReservation, rescheduleReservation } from "./actions";

export const dynamic = "force-dynamic";

export default async function StatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const app = await getApplicationByToken(token);
  if (!app) notFound();

  const posting = await getPostingBySlug(app.postingSlug);
  const settings = await getSettings();

  // 状態の判定
  const declined =
    app.status === APPLICATION_STATUS.AUTO_REJECTED ||
    app.status === APPLICATION_STATUS.REJECTED;
  const cancelled = app.status === APPLICATION_STATUS.CANCELLED;
  const active = app.status === APPLICATION_STATUS.NEW;

  // 有効な予約のときだけ、設定に応じて操作ボタンを出す
  const showCancel = active && settings.reservationCancelEnabled;
  const showReschedule = active && settings.reservationRescheduleEnabled;

  return (
    <Container className="py-14">
      <Card className="p-8">
        <h1 className="text-lg font-bold text-slate-900">
          {posting?.title ?? "ご応募"}
        </h1>

        {declined ? (
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            応募内容を鑑みて、今回は見送りとなりました。
          </p>
        ) : cancelled ? (
          <div className="mt-5">
            <p className="text-sm leading-relaxed text-slate-600">
              この面談のご予約はキャンセルされました。
            </p>
            {/* 日程変更が許可されている場合は、再予約への導線を出す */}
            {settings.reservationRescheduleEnabled && posting?.active && (
              <Link
                href={`/p/${app.postingSlug}`}
                className={buttonClass("primary", "md", "mt-5")}
              >
                <CalendarClock className="h-4 w-4" />
                改めて予約する
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-5">
            {app.slot && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <CalendarClock className="h-4 w-4 text-accent-600" />
                <span>
                  面談日時：{formatSlotRange(app.slot.startAt, app.slot.endAt)}
                </span>
              </div>
            )}

            {app.meetingUrl && (
              <MeetingLink
                url={app.meetingUrl}
                message={posting?.afterApplyMessage}
              />
            )}

            {/* キャンセル / 日程変更（管理画面の設定で表示を制御） */}
            {(showCancel || showReschedule) && (
              <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                {showReschedule && (
                  <form action={rescheduleReservation}>
                    <input type="hidden" name="token" value={token} />
                    <ConfirmSubmit
                      message="現在のご予約をキャンセルし、日程の選び直しに進みます。よろしいですか？"
                      className={buttonClass("secondary", "md")}
                    >
                      <CalendarSync className="h-4 w-4" />
                      日程を変更する
                    </ConfirmSubmit>
                  </form>
                )}
                {showCancel && (
                  <form action={cancelReservation}>
                    <input type="hidden" name="token" value={token} />
                    <ConfirmSubmit
                      message="このご予約をキャンセルします。よろしいですか？"
                      className={buttonClass("dangerGhost", "md")}
                    >
                      <CalendarX2 className="h-4 w-4" />
                      予約をキャンセルする
                    </ConfirmSubmit>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>このページはご本人のみがアクセスできる専用URLです。</p>
        </div>
      </Card>
    </Container>
  );
}
