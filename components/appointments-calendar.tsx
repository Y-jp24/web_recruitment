"use client";

/**
 * 面談予約（応募）をカレンダーで一覧するコンポーネント。
 * 月カレンダーで日付ごとの予約件数を表示し、選択した日の予約明細を
 * 既存の応募一覧（ApplicationsList、詳細モーダル付き）で表示する。
 */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  WEEKDAYS,
  monthMatrix,
  addMonth,
  parseKey,
  type YearMonth,
} from "@/lib/calendar";
import { formatDateKeyJa } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { Card, buttonClass } from "@/components/ui";
import { ApplicationsList, type AppView } from "@/components/applications-list";

// 応募一覧の表示データに、カレンダー振り分け用の面談日時情報を加えた型
export type CalendarAppView = AppView & {
  jstDate: string; // 面談日（JST, "YYYY-MM-DD"）
  startMs: number; // 面談開始時刻（ソート用）
};

export function AppointmentsCalendar({
  apps,
  todayJst,
  tomorrowJst,
}: {
  apps: CalendarAppView[];
  todayJst: string;
  tomorrowJst: string;
}) {
  // 日付キー → その日の予約（面談開始の昇順）
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarAppView[]>();
    for (const a of apps) {
      if (!map.has(a.jstDate)) map.set(a.jstDate, []);
      map.get(a.jstDate)!.push(a);
    }
    for (const list of map.values()) list.sort((a, b) => a.startMs - b.startMs);
    return map;
  }, [apps]);

  const todayParts = parseKey(todayJst);
  const [view, setView] = useState<YearMonth>({
    year: todayParts.year,
    month: todayParts.month,
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayJst);

  const weeks = useMemo(() => monthMatrix(view.year, view.month), [view]);
  const dayApps = byDate.get(selectedDate) ?? [];

  // 指定日へジャンプ（その日が属する月にカレンダーも移動）
  function jumpTo(dateKey: string) {
    const p = parseKey(dateKey);
    setView({ year: p.year, month: p.month });
    setSelectedDate(dateKey);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* カレンダー */}
      <Card className="p-4 lg:w-[360px] lg:shrink-0">
        {/* 今日・明日へのクイックジャンプ */}
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => jumpTo(todayJst)}
            className={buttonClass(
              selectedDate === todayJst ? "primary" : "secondary",
              "sm",
            )}
          >
            今日
            {(byDate.get(todayJst)?.length ?? 0) > 0 &&
              `（${byDate.get(todayJst)!.length}）`}
          </button>
          <button
            type="button"
            onClick={() => jumpTo(tomorrowJst)}
            className={buttonClass(
              selectedDate === tomorrowJst ? "primary" : "secondary",
              "sm",
            )}
          >
            明日
            {(byDate.get(tomorrowJst)?.length ?? 0) > 0 &&
              `（${byDate.get(tomorrowJst)!.length}）`}
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView(addMonth(view, -1))}
            aria-label="前の月"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-800">
            {view.year}年 {view.month}月
          </span>
          <button
            type="button"
            onClick={() => setView(addMonth(view, 1))}
            aria-label="次の月"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "py-1 text-xs font-medium",
                i === 0
                  ? "text-red-400"
                  : i === 6
                    ? "text-blue-400"
                    : "text-slate-400",
              )}
            >
              {w}
            </div>
          ))}

          {weeks.flat().map((key, idx) => {
            if (!key) return <div key={idx} />;
            const count = byDate.get(key)?.length ?? 0;
            const selected = key === selectedDate;
            const isToday = key === todayJst;
            const dayNum = parseKey(key).day;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center rounded-lg text-sm transition",
                  selected
                    ? "bg-accent-600 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                  isToday && !selected && "ring-1 ring-accent-300",
                )}
              >
                <span>{dayNum}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] leading-none",
                      selected ? "text-white/90" : "text-accent-600",
                    )}
                  >
                    {count}件
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 選択日の予約明細 */}
      <div className="flex-1">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CalendarDays className="h-4 w-4 text-accent-600" />
          {formatDateKeyJa(selectedDate)}
          <span className="font-normal text-slate-500">
            の面談予約 {dayApps.length} 件
          </span>
        </div>

        {dayApps.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            この日の面談予約はありません。
          </Card>
        ) : (
          <ApplicationsList apps={dayApps} />
        )}
      </div>
    </div>
  );
}
