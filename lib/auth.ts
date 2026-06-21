/**
 * 管理画面の簡易セッション。
 * 単一ユーザー想定。Cookie 値 = HMAC(SESSION_SECRET, "admin:" + ADMIN_PASSWORD)。
 * Web Crypto を使うので middleware（Edge）でも検証できる。
 */

export const ADMIN_COOKIE = "admin_session";
export const CLIENT_ID_COOKIE = "rcid"; // 応募者識別用
export const CLIENT_ID_FIELD = "__cid"; // フォーム hidden field 名

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(sig);
}

/** 一致時に Cookie に入れる期待トークン */
export async function expectedSessionToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || !password) {
    throw new Error("SESSION_SECRET / ADMIN_PASSWORD is not set");
  }
  return hmac(secret, "admin:" + password);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Cookie のセッショントークンが正しいか検証 */
export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const expected = await expectedSessionToken();
  return timingSafeEqual(token, expected);
}

/** ログイン時のパスワード照合 */
export function checkPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return timingSafeEqual(input, password);
}
