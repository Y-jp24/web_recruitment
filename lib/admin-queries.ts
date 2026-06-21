import { db } from "@/lib/db";
import {
  applications,
  slots,
  blockTerms,
  blockedClients,
  type Application,
  type Slot,
  type BlockTerm,
  type BlockedClient,
} from "@/lib/db/schema";
import { and, desc, eq, asc, sql } from "drizzle-orm";

export type AppRow = Application & { slot: Slot | null };

export async function listApplications(filter: {
  posting?: string;
  status?: string;
}): Promise<AppRow[]> {
  const conds = [];
  if (filter.posting) conds.push(eq(applications.postingSlug, filter.posting));
  if (filter.status) conds.push(eq(applications.status, filter.status));

  const rows = await db
    .select()
    .from(applications)
    .leftJoin(slots, eq(applications.slotId, slots.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(applications.createdAt));

  return rows.map((r) => ({ ...r.applications, slot: r.slots }));
}

/** 募集 slug ごとの応募数 */
export async function countByPosting(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      slug: applications.postingSlug,
      count: sql<number>`count(*)::int`,
    })
    .from(applications)
    .groupBy(applications.postingSlug);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.slug] = r.count;
  return map;
}

export type SlotRow = Slot & {
  bookedBy: { id: string; displayName: string | null; postingSlug: string } | null;
};

/** 全ての枠を予約状況つきで返す（未来→過去） */
export async function listSlots(): Promise<SlotRow[]> {
  const rows = await db
    .select()
    .from(slots)
    .leftJoin(applications, eq(applications.slotId, slots.id))
    .orderBy(asc(slots.startAt));

  return rows.map((r) => ({
    ...r.slots,
    bookedBy: r.applications
      ? {
          id: r.applications.id,
          displayName: r.applications.displayName,
          postingSlug: r.applications.postingSlug,
        }
      : null,
  }));
}

export async function listBlockTerms(): Promise<BlockTerm[]> {
  return db.select().from(blockTerms).orderBy(desc(blockTerms.createdAt));
}

export async function listBlockedClients(): Promise<BlockedClient[]> {
  return db
    .select()
    .from(blockedClients)
    .orderBy(desc(blockedClients.createdAt));
}
