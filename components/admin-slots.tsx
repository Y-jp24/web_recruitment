"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CalendarClock,
} from "lucide-react";
import {
  WEEKDAYS,
  monthMatrix,
  addMonth,
  parseKey,
  type YearMonth,
} from "@/lib/calendar";
import { formatDateKeyJa } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { Card, Badge, buttonClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/submit-button";

export type AdminSlotData = {
  id: string;
  jstDate: string;
  timeLabel: string;
  startMs: number;
  booked: boolean;
  bookedLabel: string | null;
};

// 開始は 0〜23時、終了は 1〜24時（深夜帯も含めて隙間なく選べる）
const START_HOURS = Array.from({ length: 24 }, (_, i) => i); // 0:00〜23:00
const END_HOURS = Array.from({ length: 24 }, (_, i) => i + 1); // 1:00〜24:00

function hhmm(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

export function AdminSlots({
  slots,
  todayJst,
  addSlots,
  deleteSlot,
  deleteSlotsForDay,
}: {
  slots: AdminSlotData[];
  todayJst: string;
  addSlots: (formData: FormData) => Promise<void>;
  deleteSlot: (formData: FormData) => Promise<void>;
  deleteSlotsForDay: (formData: FormData) => Promise<void>;
}) {
  const byDate = useMemo(() => {
    const map = new Map<string, AdminSlotData[]>();
    for (const s of slots) {
      if (!map.has(s.jstDate)) map.set(s.jstDate, []);
      map.get(s.jstDate)!.push(s);
    }
    for (const list of map.values()) list.sort((a, b) => a.startMs - b.startMs);
    return map;
  }, [slots]);

  const todayParts = parseKey(todayJst);
  const [view, setView] = useState<YearMonth>({
    year: todayParts.year,
    month: todayParts.month,
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayJst);

  const weeks = useMemo(() => monthMatrix(view.year, view.month), [view]);
  const daySlots = byDate.get(selectedDate) ?? [];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* カレンダー */}
      <Card className="p-4 lg:w-[360px] lg:shrink-0">
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
            const list = byDate.get(key) ?? [];
            const count = list.length;
            const bookedCount = list.filter((s) => s.booked).length;
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
                    {bookedCount > 0
                      ? `${count}枠 / ${bookedCount}予約`
                      : `${count}枠`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 選択日の枠 + 追加 */}
      <div className="flex-1">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CalendarClock className="h-4 w-4 text-accent-600" />
            {formatDateKeyJa(selectedDate)}
          </div>
          {daySlots.length > 0 && (
            <form action={deleteSlotsForDay}>
              <input type="hidden" name="date" value={selectedDate} />
              <ConfirmSubmit
                message={`${formatDateKeyJa(selectedDate)} の枠を${daySlots.length}件すべて削除します。予約が入っている枠も削除され、予約は枠なしになります。よろしいですか？`}
                className={buttonClass("dangerGhost", "sm")}
              >
                <Trash2 className="h-3.5 w-3.5" />
                この日の枠を一括削除
              </ConfirmSubmit>
            </form>
          )}
        </div>

        {/* 一括追加フォーム */}
        <Card className="mb-4 p-4">
          <form action={addSlots} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="date" value={selectedDate} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                開始
              </label>
              <select
                name="start"
                defaultValue="13:00"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                {START_HOURS.map((h) => (
                  <option key={h} value={hhmm(h)}>
                    {hhmm(h)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                終了
              </label>
              <select
                name="end"
                defaultValue="17:00"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                {END_HOURS.map((h) => (
                  <option key={h} value={hhmm(h)}>
                    {hhmm(h)}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton className={buttonClass("primary", "md")}>
              <Plus className="h-4 w-4" />
              この日に枠を追加
            </SubmitButton>
          </form>
          <p className="mt-2 text-xs text-slate-400">
            1時間単位の枠に分割して追加されます（日本時間）。
          </p>
        </Card>

        {/* 選択日の枠一覧 */}
        {daySlots.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            この日の枠はまだありません。
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {daySlots.map((s) => (
              <Card
                key={s.id}
                className="flex items-center justify-between gap-3 p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm text-slate-800">{s.timeLabel}</span>
                  {s.booked ? (
                    <Badge variant="accent">{s.bookedLabel ?? "予約あり"}</Badge>
                  ) : (
                    <Badge variant="neutral">空き</Badge>
                  )}
                </div>
                <form action={deleteSlot}>
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmSubmit
                    message={
                      s.booked
                        ? "予約が入っている枠です。削除すると予約も枠なしになります。よろしいですか？"
                        : "この枠を削除します。よろしいですか？"
                    }
                    className={buttonClass("ghost", "sm")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </ConfirmSubmit>
                </form>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
