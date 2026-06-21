"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarClock, Clock } from "lucide-react";
import {
  WEEKDAYS,
  monthMatrix,
  addMonth,
  compareYM,
  parseKey,
  type YearMonth,
} from "@/lib/calendar";
import { formatDateKeyJa } from "@/lib/datetime";
import { cn } from "@/lib/utils";

export type SlotData = {
  id: string;
  jstDate: string; // "YYYY-MM-DD"
  timeLabel: string; // "14:00〜15:00"
  sortKey: number; // startAt の epoch ms
};

export function SlotPicker({
  slots,
  todayJst,
  error,
}: {
  slots: SlotData[];
  todayJst: string;
  error?: string;
}) {
  const byDate = useMemo(() => {
    const map = new Map<string, SlotData[]>();
    for (const s of slots) {
      if (!map.has(s.jstDate)) map.set(s.jstDate, []);
      map.get(s.jstDate)!.push(s);
    }
    for (const list of map.values()) list.sort((a, b) => a.sortKey - b.sortKey);
    return map;
  }, [slots]);

  const dates = useMemo(
    () => [...byDate.keys()].sort(),
    [byDate],
  );

  const minYM: YearMonth | null = dates.length
    ? (() => {
        const p = parseKey(dates[0]);
        return { year: p.year, month: p.month };
      })()
    : null;
  const maxYM: YearMonth | null = dates.length
    ? (() => {
        const p = parseKey(dates[dates.length - 1]);
        return { year: p.year, month: p.month };
      })()
    : null;

  const initialDate = dates[0] ?? null;
  const initialYM: YearMonth = initialDate
    ? (() => {
        const p = parseKey(initialDate);
        return { year: p.year, month: p.month };
      })()
    : (() => {
        const p = parseKey(todayJst);
        return { year: p.year, month: p.month };
      })();

  const [view, setView] = useState<YearMonth>(initialYM);
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const weeks = useMemo(
    () => monthMatrix(view.year, view.month),
    [view],
  );

  const canPrev = minYM ? compareYM(view, minYM) > 0 : false;
  const canNext = maxYM ? compareYM(view, maxYM) < 0 : false;

  const daySlots = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  if (slots.length === 0) {
    return (
      <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
        現在、予約可能な枠がありません。しばらくしてから再度お試しください。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="slot_id" value={selectedSlot ?? ""} />

      {/* カレンダー */}
      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => canPrev && setView(addMonth(view, -1))}
            disabled={!canPrev}
            aria-label="前の月"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-slate-800">
            {view.year}年 {view.month}月
          </span>
          <button
            type="button"
            onClick={() => canNext && setView(addMonth(view, 1))}
            disabled={!canNext}
            aria-label="次の月"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
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
            const available = count > 0 && key >= todayJst;
            const selected = key === selectedDate;
            const dayNum = parseKey(key).day;
            return (
              <button
                key={key}
                type="button"
                disabled={!available}
                onClick={() => {
                  setSelectedDate(key);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "relative flex h-11 flex-col items-center justify-center rounded-lg text-sm transition",
                  available
                    ? "text-slate-800 hover:bg-accent-50 cursor-pointer"
                    : "text-slate-300 cursor-default",
                  selected && "bg-accent-600 text-white hover:bg-accent-600",
                )}
              >
                <span>{dayNum}</span>
                {available && (
                  <span
                    className={cn(
                      "mt-0.5 h-1 w-1 rounded-full",
                      selected ? "bg-white" : "bg-accent-500",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 選択した日の時間枠 */}
      {selectedDate && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <CalendarClock className="h-4 w-4 text-accent-600" />
            {formatDateKeyJa(selectedDate)}
          </div>
          {daySlots.length === 0 ? (
            <p className="text-sm text-slate-400">この日は空き枠がありません。</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {daySlots.map((s) => {
                const picked = s.id === selectedSlot;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSlot(s.id)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition",
                      picked
                        ? "border-accent-500 bg-accent-50 text-accent-700 ring-1 ring-accent-500"
                        : "border-slate-200 text-slate-700 hover:border-accent-300 hover:bg-accent-50",
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {s.timeLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
