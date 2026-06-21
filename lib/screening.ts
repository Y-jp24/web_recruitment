import { db } from "@/lib/db";
import { blockTerms, blockedClients } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

/**
 * スクリーニング（サイレント自動仕分け）。
 *
 * 位置づけ: 応募者は門前払いしない（常に「応募完了」を表示）。受付後にここで
 * 募集者自身のルール（ブロック/注意ワード・既知クライアント）に照らして仕分けし、
 * ブロック該当はサイレントに自動却下する。プラットフォームのBANではなく、
 * 募集者の自動判断という建て付け。
 */

/** 全角/半角・大小文字・空白を正規化 */
export function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** haystack（応募の入力全文）に含まれる term を返す（部分一致） */
export function matchTerms(
  haystack: string,
  terms: { term: string }[],
): string[] {
  const h = normalize(haystack);
  const matched: string[] = [];
  for (const t of terms) {
    const needle = normalize(t.term);
    if (needle && h.includes(needle)) matched.push(t.term);
  }
  return matched;
}

export type ScreenResult =
  | { decision: "auto_reject"; reason: string }
  | { decision: "warn"; terms: string[] }
  | { decision: "ok" };

type ScreenInput = {
  answers: Record<string, string>;
  clientId?: string | null;
  ip?: string | null;
};

/** 応募の入力値をすべて連結してスクリーニング対象テキストにする */
export function answersToText(answers: Record<string, string>): string {
  return Object.values(answers).join("\n");
}

export async function screenApplication(
  input: ScreenInput,
): Promise<ScreenResult> {
  const { answers, clientId, ip } = input;

  // 1) 既知のブロック済みクライアント（clientId か IP の一致）
  const clientConds = [];
  if (clientId) clientConds.push(eq(blockedClients.clientId, clientId));
  if (ip) clientConds.push(eq(blockedClients.ip, ip));
  if (clientConds.length > 0) {
    const hit = await db
      .select({ id: blockedClients.id })
      .from(blockedClients)
      .where(clientConds.length === 1 ? clientConds[0] : or(...clientConds))
      .limit(1);
    if (hit.length > 0) {
      return { decision: "auto_reject", reason: "既知のブロック済み応募元" };
    }
  }

  // 2) ブロック/注意ワード（小さなテーブルなので一括取得して JS で照合）
  const terms = await db
    .select({
      term: blockTerms.term,
      type: blockTerms.type,
    })
    .from(blockTerms);

  const text = answersToText(answers);
  const blockMatched = matchTerms(
    text,
    terms.filter((t) => t.type === "block"),
  );
  if (blockMatched.length > 0) {
    return {
      decision: "auto_reject",
      reason: `ブロックワード一致: ${blockMatched.join(", ")}`,
    };
  }

  const warnMatched = matchTerms(
    text,
    terms.filter((t) => t.type === "warn"),
  );
  if (warnMatched.length > 0) {
    return { decision: "warn", terms: warnMatched };
  }

  return { decision: "ok" };
}

/** ブロック済みクライアントとして記録 */
export async function recordBlockedClient(args: {
  clientId?: string | null;
  ip?: string | null;
  reason?: string;
}): Promise<void> {
  if (!args.clientId && !args.ip) return;
  await db.insert(blockedClients).values({
    clientId: args.clientId ?? null,
    ip: args.ip ?? null,
    reason: args.reason ?? null,
  });
}
