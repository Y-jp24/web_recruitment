import { db } from "@/lib/db";
import { applications, slots, type Application, type Slot } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export type ApplicationWithSlot = Application & { slot: Slot | null };

/** トークンから応募を取得（予約枠つき） */
export async function getApplicationByToken(
  token: string,
): Promise<ApplicationWithSlot | null> {
  const rows = await db
    .select()
    .from(applications)
    .leftJoin(slots, eq(applications.slotId, slots.id))
    .where(eq(applications.token, token))
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];
  return { ...row.applications, slot: row.slots };
}

/** リクエストの Origin（専用URLの全文表示用） */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
