import { db } from "@/lib/db";
import { slots, applications, type Slot } from "@/lib/db/schema";
import { asc, gt, isNotNull } from "drizzle-orm";

/** 未来の空き枠（予約されていない枠）を時刻順で返す */
export async function getAvailableSlots(): Promise<Slot[]> {
  const now = new Date();
  const future = await db
    .select()
    .from(slots)
    .where(gt(slots.startAt, now))
    .orderBy(asc(slots.startAt));

  const bookedRows = await db
    .select({ slotId: applications.slotId })
    .from(applications)
    .where(isNotNull(applications.slotId));
  const booked = new Set(bookedRows.map((r) => r.slotId));

  return future.filter((s) => !booked.has(s.id));
}
