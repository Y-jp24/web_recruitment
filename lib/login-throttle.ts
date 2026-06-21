import { db } from "@/lib/db";
import { loginAttempts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// しきい値（OSS なのでコードは公開前提。総当たりを実用的に不可能にする）
const THRESHOLD = 5; // この回数連続で失敗するとロック
const LOCK_MS = 15 * 60 * 1000; // ロック時間 15分
const WINDOW_MS = 15 * 60 * 1000; // この時間内の失敗のみ連続カウント

export type ThrottleCheck =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

/** ログイン試行前のロック確認 */
export async function checkLock(ip: string): Promise<ThrottleCheck> {
  const rows = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.ip, ip))
    .limit(1);
  const row = rows[0];
  if (row?.lockedUntil) {
    const remaining = row.lockedUntil.getTime() - Date.now();
    if (remaining > 0) {
      return { allowed: false, retryAfterSec: Math.ceil(remaining / 1000) };
    }
  }
  return { allowed: true };
}

/** 失敗を記録。ロックに達したら lockedUntil を設定して返す。 */
export async function registerFailure(ip: string): Promise<ThrottleCheck> {
  const now = new Date();
  const rows = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.ip, ip))
    .limit(1);
  const row = rows[0];

  const withinWindow =
    row?.lastFailedAt && now.getTime() - row.lastFailedAt.getTime() < WINDOW_MS;
  const count = withinWindow ? row!.failedCount + 1 : 1;
  const locked = count >= THRESHOLD;
  const lockedUntil = locked ? new Date(now.getTime() + LOCK_MS) : null;

  await db
    .insert(loginAttempts)
    .values({
      ip,
      failedCount: count,
      lastFailedAt: now,
      lockedUntil,
    })
    .onConflictDoUpdate({
      target: loginAttempts.ip,
      set: { failedCount: count, lastFailedAt: now, lockedUntil },
    });

  return locked
    ? { allowed: false, retryAfterSec: Math.ceil(LOCK_MS / 1000) }
    : { allowed: true };
}

/** ログイン成功時に記録をクリア */
export async function clearAttempts(ip: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip));
}

/** タイミング攻撃・自動化を鈍らせるための小さな遅延 */
export async function throttleDelay(): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
}
