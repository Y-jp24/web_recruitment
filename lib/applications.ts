import { db } from "@/lib/db";
import { applications, slots, type Application, type Slot } from "@/lib/db/schema";
import { and, desc, eq, inArray, ne, or } from "drizzle-orm";
import { headers } from "next/headers";
import {
  APPLICATION_STATUS,
  BLOCKING_APPLICATION_STATUSES,
} from "@/lib/constants";

export type ApplicationWithSlot = Application & { slot: Slot | null };

/**
 * 応募ページを開いた訪問者（Cookie の clientId で特定）が、その募集に
 * 既に応募済みなら、案内ページ /a/[token] へ飛ばすためのトークンを返す。
 * - 有効な予約（new）があればそれを優先
 * - 無ければ却下系など直近の応募を返す
 * - キャンセル済みのみの場合は null（再予約のためフォームを表示する）
 */
export async function findVisitorApplicationToken(
  slug: string,
  clientId: string | null,
): Promise<string | null> {
  if (!clientId) return null;

  const rows = await db
    .select({
      token: applications.token,
      status: applications.status,
    })
    .from(applications)
    .where(
      and(
        eq(applications.postingSlug, slug),
        eq(applications.clientId, clientId),
        // キャンセル済みは対象外（再予約できるようフォームを見せる）
        ne(applications.status, APPLICATION_STATUS.CANCELLED),
      ),
    )
    .orderBy(desc(applications.createdAt));

  if (rows.length === 0) return null;

  // 有効な予約（new）を最優先、無ければ直近（createdAt 降順の先頭）
  const active = rows.find((r) => r.status === APPLICATION_STATUS.NEW);
  return (active ?? rows[0]).token;
}

/**
 * 同一人物による重複応募・再応募のブロック判定結果。
 * - "reserved": 既に有効な予約（new）がある → 複数予約を防ぐ
 * - "rejected": 却下済み（rejected / auto_rejected）→ 再応募を防ぐ
 * - null: ブロック対象なし（未応募 or キャンセル済みのみ）
 */
export type BlockingKind = "reserved" | "rejected" | null;

/**
 * 同じ募集（slug）に対し、同一人物（clientId もしくは IP が一致）による
 * ブロック対象の応募が既に存在するか判定する。
 * cancelled は対象外なので、キャンセル後の再予約（日程変更）は通過する。
 */
export async function findBlockingApplication(
  slug: string,
  clientId: string | null,
  ip: string | null,
): Promise<BlockingKind> {
  // 識別子が一切ない場合は判定不能（ブロックしない）
  if (!clientId && !ip) return null;

  const identityConditions = [];
  if (clientId) identityConditions.push(eq(applications.clientId, clientId));
  if (ip) identityConditions.push(eq(applications.clientIp, ip));

  const rows = await db
    .select({ status: applications.status })
    .from(applications)
    .where(
      and(
        eq(applications.postingSlug, slug),
        inArray(applications.status, [...BLOCKING_APPLICATION_STATUSES]),
        or(...identityConditions),
      ),
    );

  if (rows.length === 0) return null;

  // 有効な予約（new）があれば「予約済み」を優先（変更導線を案内するため）
  const hasReserved = rows.some((r) => r.status === APPLICATION_STATUS.NEW);
  if (hasReserved) return "reserved";
  return "rejected";
}

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
