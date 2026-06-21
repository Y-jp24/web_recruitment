import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  CLIENT_ID_COOKIE,
  verifySessionToken,
} from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- 管理画面の保護 ---
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const ok = await verifySessionToken(token);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // --- 公開応募ページ: clientId Cookie を未発行なら付与 ---
  if (pathname.startsWith("/p/")) {
    if (!req.cookies.get(CLIENT_ID_COOKIE)?.value) {
      const res = NextResponse.next();
      res.cookies.set(CLIENT_ID_COOKIE, crypto.randomUUID(), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1年
      });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/p/:path*"],
};
