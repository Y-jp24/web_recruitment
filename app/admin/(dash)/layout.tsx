import Link from "next/link";
import {
  Inbox,
  Megaphone,
  CalendarClock,
  ShieldBan,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "../actions";

const nav = [
  { href: "/admin", label: "応募", icon: Inbox },
  { href: "/admin/postings", label: "募集案件", icon: Megaphone },
  { href: "/admin/slots", label: "面談枠", icon: CalendarClock },
  { href: "/admin/blocklist", label: "ブロックリスト", icon: ShieldBan },
  { href: "/admin/settings", label: "設定", icon: Settings },
];

export default function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
