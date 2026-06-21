import Link from "next/link";
import {
  CalendarClock,
  TriangleAlert,
  Ban,
  Trash2,
  RotateCcw,
  ShieldX,
  ExternalLink,
} from "lucide-react";
import { listApplications, type AppRow } from "@/lib/admin-queries";
import type { Posting } from "@/lib/postings";
import { getPostingsMap, listPostingRows } from "@/lib/postings-db";
import { formatSlotRange, formatDate, formatTime } from "@/lib/datetime";
import { Card, Badge, buttonClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-submit";
import {
  rejectApplication,
  unrejectApplication,
  deleteApplication,
  saveNote,
  blockApplicationClient,
} from "../actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { key: "", label: "すべて" },
  { key: "new", label: "選考中" },
  { key: "auto_rejected", label: "自動却下" },
  { key: "rejected", label: "却下" },
];

function statusBadge(status: string) {
  if (status === "auto_rejected")
    return <Badge variant="danger">自動却下</Badge>;
  if (status === "rejected") return <Badge variant="neutral">却下</Badge>;
  return <Badge variant="accent">選考中</Badge>;
}

function FilterTab({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
      )}
    >
      {children}
    </Link>
  );
}

function ApplicationItem({
  app,
  posting,
}: {
  app: AppRow;
  posting?: Posting;
}) {
  const rejected = app.status === "auto_rejected" || app.status === "rejected";
  const idField = (
    <input type="hidden" name="id" value={app.id} />
  );

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">
              {app.displayName || "（無名）"}
            </h3>
            {statusBadge(app.status)}
            {app.warnedTerms && app.warnedTerms.length > 0 && (
              <Badge variant="warn">
                <TriangleAlert className="h-3.5 w-3.5" />
                注意: {app.warnedTerms.join(", ")}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {posting?.title ?? app.postingSlug} ・ 応募{" "}
            {formatDate(app.createdAt)} {formatTime(app.createdAt)}
          </p>
        </div>
        <div className="text-right">
          {app.slot ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
              <CalendarClock className="h-3.5 w-3.5 text-accent-600" />
              {formatSlotRange(app.slot.startAt, app.slot.endAt)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">枠なし</span>
          )}
        </div>
      </div>

      {app.autoReason && (
        <p className="mt-2 text-xs text-red-600">自動判定: {app.autoReason}</p>
      )}

      {/* 回答 */}
      <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-1">
        {(posting?.fields ?? []).map((f) => (
          <div key={f.name} className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-slate-500">{f.label}</dt>
            <dd className="whitespace-pre-wrap break-words text-slate-800">
              {app.answers[f.name] || "—"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <Link
          href={`/a/${app.token}`}
          className="inline-flex items-center gap-1 hover:text-slate-600"
        >
          <ExternalLink className="h-3 w-3" />
          応募者ページ
        </Link>
        {app.clientIp && <span>IP: {app.clientIp}</span>}
      </div>

      {/* メモ */}
      <form
        action={saveNote}
        className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4"
      >
        {idField}
        <label className="text-xs font-medium text-slate-500">メモ</label>
        <textarea
          name="note"
          rows={2}
          defaultValue={app.note ?? ""}
          placeholder="この応募者についてのメモ"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
        <button
          type="submit"
          className={buttonClass("secondary", "sm", "self-start")}
        >
          メモを保存
        </button>
      </form>

      {/* 操作 */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {rejected ? (
          <form action={unrejectApplication}>
            {idField}
            <button className={buttonClass("secondary", "sm")}>
              <RotateCcw className="h-3.5 w-3.5" />
              却下を取り消す
            </button>
          </form>
        ) : (
          <form action={rejectApplication}>
            {idField}
            <ConfirmSubmit
              message="この応募を却下します（予約枠は空きに戻ります）。よろしいですか？"
              className={buttonClass("dangerGhost", "sm")}
            >
              <Ban className="h-3.5 w-3.5" />
              却下
            </ConfirmSubmit>
          </form>
        )}

        <form action={blockApplicationClient}>
          {idField}
          <ConfirmSubmit
            message="この応募元（IP / 識別子）を今後ブロックし、この応募も却下します。よろしいですか？"
            className={buttonClass("dangerGhost", "sm")}
          >
            <ShieldX className="h-3.5 w-3.5" />
            応募元をブロック
          </ConfirmSubmit>
        </form>

        <form action={deleteApplication} className="ml-auto">
          {idField}
          <ConfirmSubmit
            message="この応募を完全に削除します。元に戻せません。よろしいですか？"
            className={buttonClass("ghost", "sm")}
          >
            <Trash2 className="h-3.5 w-3.5" />
            削除
          </ConfirmSubmit>
        </form>
      </div>
    </Card>
  );
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ posting?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const posting = sp.posting ?? "";
  const status = sp.status ?? "";

  const apps = await listApplications({
    posting: posting || undefined,
    status: status || undefined,
  });
  const postingList = await listPostingRows();
  const postingsMap = await getPostingsMap();

  const makeHref = (next: { posting?: string; status?: string }) => {
    const p = next.posting ?? posting;
    const s = next.status ?? status;
    const params = new URLSearchParams();
    if (p) params.set("posting", p);
    if (s) params.set("status", s);
    const q = params.toString();
    return q ? `/admin?${q}` : "/admin";
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">応募一覧</h1>

      {/* 案件フィルタ */}
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterTab active={!posting} href={makeHref({ posting: "" })}>
          全案件
        </FilterTab>
        {postingList.map((p) => (
          <FilterTab
            key={p.slug}
            active={posting === p.slug}
            href={makeHref({ posting: p.slug })}
          >
            {p.title}
          </FilterTab>
        ))}
      </div>

      {/* ステータスフィルタ */}
      <div className="mt-2 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <FilterTab
            key={t.key}
            active={status === t.key}
            href={makeHref({ status: t.key })}
          >
            {t.label}
          </FilterTab>
        ))}
      </div>

      <p className="mt-4 text-sm text-slate-500">{apps.length} 件</p>

      <div className="mt-3 flex flex-col gap-4">
        {apps.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            該当する応募はありません。
          </Card>
        ) : (
          apps.map((app) => (
            <ApplicationItem
              key={app.id}
              app={app}
              posting={postingsMap[app.postingSlug]}
            />
          ))
        )}
      </div>
    </div>
  );
}
