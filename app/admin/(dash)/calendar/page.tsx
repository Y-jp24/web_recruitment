import { CalendarDays } from "lucide-react";
import { listBookedApplications } from "@/lib/admin-queries";
import { getPostingsMap } from "@/lib/postings-db";
import { fallbackTitle } from "@/lib/postings";
import {
  formatDate,
  formatTime,
  formatSlotRange,
  jstDateKey,
  todayJstKey,
  dateKeyToDate,
} from "@/lib/datetime";
import {
  AppointmentsCalendar,
  type CalendarAppView,
} from "@/components/appointments-calendar";

export const dynamic = "force-dynamic";

// 1日（ミリ秒）。明日の日付キー算出に使う。
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** 面談予約をカレンダーで確認する管理ページ */
export default async function CalendarPage() {
  const apps = await listBookedApplications();
  const postingsMap = await getPostingsMap();

  // 応募一覧コンポーネント用の表示データに、面談日時情報を付与する
  const appViews: CalendarAppView[] = apps.map((app) => {
    const p = postingsMap[app.postingSlug];
    return {
      id: app.id,
      token: app.token,
      title: app.displayName || fallbackTitle(app.id),
      postingTitle: p?.title ?? app.postingSlug,
      status: app.status,
      warnedTerms: app.warnedTerms ?? [],
      autoReason: app.autoReason ?? null,
      note: app.note ?? "",
      clientIp: app.clientIp ?? null,
      createdLabel: `${formatDate(app.createdAt)} ${formatTime(app.createdAt)}`,
      // モーダルではフル表示、一覧テーブルでは日付が自明なので時刻だけ表示する
      slotLabel: formatSlotRange(app.slot.startAt, app.slot.endAt),
      slotTimeLabel: `${formatTime(app.slot.startAt)}〜${formatTime(app.slot.endAt)}`,
      answers: (p?.fields ?? []).map((f) => ({
        label: f.label,
        value: app.answers[f.name] || "",
      })),
      // カレンダー振り分け用
      jstDate: jstDateKey(app.slot.startAt),
      startMs: app.slot.startAt.getTime(),
    };
  });

  const today = todayJstKey();
  const tomorrow = jstDateKey(new Date(dateKeyToDate(today).getTime() + ONE_DAY_MS));

  return (
    <div>
      <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <CalendarDays className="h-5 w-5 text-slate-400" />
        面談カレンダー
      </h1>
      <p className="mb-5 mt-2 text-sm text-slate-500">
        予約が入っている面談を日付ごとに確認できます。日付を選ぶと、その日の予約一覧が表示されます。
      </p>
      <AppointmentsCalendar
        apps={appViews}
        todayJst={today}
        tomorrowJst={tomorrow}
      />
    </div>
  );
}
