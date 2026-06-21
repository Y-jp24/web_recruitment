import { listSlots } from "@/lib/admin-queries";
import { getPostingsMap } from "@/lib/postings-db";
import { formatTime, jstDateKey, todayJstKey } from "@/lib/datetime";
import { AdminSlots, type AdminSlotData } from "@/components/admin-slots";
import { addSlots, deleteSlot, deleteSlotsForDay } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SlotsPage() {
  const slots = await listSlots();
  const postingsMap = await getPostingsMap();
  const data: AdminSlotData[] = slots.map((s) => ({
    id: s.id,
    jstDate: jstDateKey(s.startAt),
    timeLabel: `${formatTime(s.startAt)}〜${formatTime(s.endAt)}`,
    startMs: s.startAt.getTime(),
    booked: !!s.bookedBy,
    bookedLabel: s.bookedBy
      ? `${s.bookedBy.displayName ?? "予約あり"}（${
          postingsMap[s.bookedBy.postingSlug]?.title ?? s.bookedBy.postingSlug
        }）`
      : null,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">面談枠</h1>
      <p className="mb-5 mt-2 text-sm text-slate-500">
        全案件共通の枠です。カレンダーで日付を選び、時間帯をまとめて登録すると
        1 時間単位の枠に分割されます。
      </p>
      <AdminSlots
        slots={data}
        todayJst={todayJstKey()}
        addSlots={addSlots}
        deleteSlot={deleteSlot}
        deleteSlotsForDay={deleteSlotsForDay}
      />
    </div>
  );
}
