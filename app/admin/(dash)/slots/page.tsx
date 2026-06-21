import { CalendarClock, Plus, Trash2, User } from "lucide-react";
import { listSlots, type SlotRow } from "@/lib/admin-queries";
import { getPosting } from "@/lib/postings";
import { formatDate, formatTime, dateKey } from "@/lib/datetime";
import { Card, buttonClass, Badge } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { addSlots, deleteSlot } from "../../actions";

export const dynamic = "force-dynamic";

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00〜23:00

export default async function SlotsPage() {
  const slots = await listSlots();
  const now = Date.now();

  // 日付ごとにグルーピング
  const groups = new Map<string, SlotRow[]>();
  for (const s of slots) {
    const key = dateKey(s.startAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">面談枠</h1>
      <p className="mt-2 text-sm text-slate-500">
        全案件共通の枠です。時間帯をまとめて登録すると 1 時間単位の枠に分割されます。
      </p>

      {/* 一括登録 */}
      <Card className="mt-5 p-5">
        <form
          action={addSlots}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">日付</label>
            <input
              type="date"
              name="date"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              開始（時）
            </label>
            <select
              name="start"
              defaultValue="13:00"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              {HOURS.map((h) => (
                <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              終了（時）
            </label>
            <select
              name="end"
              defaultValue="17:00"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              {HOURS.map((h) => (
                <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
          <button className={buttonClass("primary", "md")}>
            <Plus className="h-4 w-4" />
            枠を追加
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          例: 13:00〜17:00 → 13–14 / 14–15 / 15–16 / 16–17 の 4 枠（時刻は日本時間）
        </p>
      </Card>

      {/* 一覧 */}
      <div className="mt-6 flex flex-col gap-5">
        {groups.size === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            まだ枠がありません。
          </Card>
        ) : (
          [...groups.entries()].map(([key, daySlots]) => (
            <div key={key}>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">
                {formatDate(daySlots[0].startAt)}
              </h2>
              <div className="flex flex-col gap-2">
                {daySlots.map((s) => {
                  const past = s.startAt.getTime() < now;
                  return (
                    <Card
                      key={s.id}
                      className="flex items-center justify-between gap-3 p-3.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarClock className="h-4 w-4 text-slate-400" />
                        <span
                          className={
                            past ? "text-sm text-slate-400" : "text-sm text-slate-800"
                          }
                        >
                          {formatTime(s.startAt)}〜{formatTime(s.endAt)}
                        </span>
                        {s.bookedBy ? (
                          <Badge variant="accent">
                            <User className="h-3.5 w-3.5" />
                            {s.bookedBy.displayName || "予約あり"}（
                            {getPosting(s.bookedBy.postingSlug)?.title ??
                              s.bookedBy.postingSlug}
                            ）
                          </Badge>
                        ) : (
                          <Badge variant="neutral">空き</Badge>
                        )}
                      </div>
                      <form action={deleteSlot}>
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmSubmit
                          message={
                            s.bookedBy
                              ? "予約が入っている枠です。削除すると予約も枠なしになります。よろしいですか？"
                              : "この枠を削除します。よろしいですか？"
                          }
                          className={buttonClass("ghost", "sm")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </ConfirmSubmit>
                      </form>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
