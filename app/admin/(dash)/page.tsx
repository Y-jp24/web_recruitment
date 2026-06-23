import Link from "next/link";
import { Search } from "lucide-react";
import { listApplications } from "@/lib/admin-queries";
import { getPostingsMap, listPostingRows } from "@/lib/postings-db";
import { fallbackTitle } from "@/lib/postings";
import { formatDate, formatTime, formatSlotRange } from "@/lib/datetime";
import { buttonClass } from "@/components/ui";
import { ApplicationsList, type AppView } from "@/components/applications-list";
import { APPLICATION_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { key: "", label: "すべて" },
  { key: APPLICATION_STATUS.NEW, label: "新規" },
  { key: APPLICATION_STATUS.AUTO_REJECTED, label: "自動却下" },
  { key: APPLICATION_STATUS.REJECTED, label: "却下" },
  { key: APPLICATION_STATUS.CANCELLED, label: "キャンセル" },
];

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ posting?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const posting = sp.posting ?? "";
  const status = sp.status ?? "";
  const q = (sp.q ?? "").trim();

  const apps = await listApplications({
    posting: posting || undefined,
    status: status || undefined,
    q: q || undefined,
  });
  const postingList = await listPostingRows();
  const postingsMap = await getPostingsMap();

  const appViews: AppView[] = apps.map((app) => {
    const p = postingsMap[app.postingSlug];
    return {
      id: app.id,
      token: app.token,
      title: app.displayName || fallbackTitle(app.id),
      postingTitle: p?.title ?? app.postingSlug,
      status: app.status,
      warnedTerms: app.warnedTerms ?? [],
      autoReason: app.autoReason ?? null,
      note: app.note ?? "",
      clientIp: app.clientIp ?? null,
      createdLabel: `${formatDate(app.createdAt)} ${formatTime(app.createdAt)}`,
      slotLabel: app.slot
        ? formatSlotRange(app.slot.startAt, app.slot.endAt)
        : null,
      meetingUrl: app.meetingUrl ?? null,
      answers: (p?.fields ?? []).map((f) => ({
        label: f.label,
        value: app.answers[f.name] || "",
      })),
    };
  });

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500";

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">応募一覧</h1>

      {/* フィルタ（GET フォーム） */}
      <form method="get" className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">募集</label>
          <select name="posting" defaultValue={posting} className={selectClass}>
            <option value="">全案件</option>
            {postingList.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">状態</label>
          <select name="status" defaultValue={status} className={selectClass}>
            {STATUS_TABS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            検索（メモ・回答内容・氏名など）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="キーワード"
              className={`${selectClass} min-w-0 flex-1`}
            />
            <button className={buttonClass("primary", "md")}>
              <Search className="h-4 w-4" />
              絞り込む
            </button>
            {(posting || status || q) && (
              <Link href="/admin" className={buttonClass("ghost", "md")}>
                クリア
              </Link>
            )}
          </div>
        </div>
      </form>

      <p className="mt-4 text-sm text-slate-500">{appViews.length} 件</p>

      <div className="mt-3">
        {appViews.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            該当する応募はありません。
          </div>
        ) : (
          <ApplicationsList apps={appViews} />
        )}
      </div>
    </div>
  );
}
