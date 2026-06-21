import { headers, cookies } from "next/headers";
import { CLIENT_ID_COOKIE } from "@/lib/auth";

/** リクエスト元 IP（Vercel等のプロキシ想定） */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip");
}

/** Cookie に保存された応募者識別子 */
export async function getClientIdFromCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(CLIENT_ID_COOKIE)?.value ?? null;
}
