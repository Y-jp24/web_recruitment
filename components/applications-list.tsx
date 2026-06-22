"use client";

import { useEffect, useState } from "react";
import {
  X,
  TriangleAlert,
  CalendarClock,
  Ban,
  RotateCcw,
  ShieldX,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Badge, buttonClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/submit-button";
import { APPLICATION_STATUS } from "@/lib/constants";
import {
  saveNote,
  rejectApplication,
  unrejectApplication,
  deleteApplication,
  blockApplicationClient,
  getIpLocation,
} from "@/app/admin/actions";

export type AnswerView = { label: string; value: string };
export type AppView = {
  id: string;
  token: string;
  title: string;
  postingTitle: string;
  status: string;
  warnedTerms: string[];
  autoReason: string | null;
  note: string;
  clientIp: string | null;
  createdLabel: string;
  slotLabel: string | null;
  answers: AnswerView[];
};

// 回答テキスト内の URL を新しいタブで開くリンク（外部リンクアイコン付き）にする
function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-0.5 break-all text-accent-700 underline underline-offset-2 hover:text-accent-800"
          >
            {part}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function statusBadge(status: string) {
  if (status === APPLICATION_STATUS.AUTO_REJECTED)
    return <Badge variant="danger">自動却下</Badge>;
  if (status === APPLICATION_STATUS.REJECTED)
    return <Badge variant="neutral">却下</Badge>;
  if (status === APPLICATION_STATUS.CANCELLED)
    return <Badge variant="neutral">キャンセル</Badge>;
  return <Badge variant="accent">新規</Badge>;
}

export function ApplicationsList({ apps }: { apps: AppView[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = apps.find((a) => a.id === selectedId) ?? null;

  // IP の所在地（モーダルを開いたとき取得・IP ごとにキャッシュ）
  const [ipLocations, setIpLocations] = useState<Record<string, string | null>>(
    {},
  );
  const selectedIp = selected?.clientIp ?? null;
  useEffect(() => {
    if (!selectedIp || selectedIp in ipLocations) return;
    let cancelled = false;
    getIpLocation(selectedIp).then((loc) => {
      if (!cancelled) {
        setIpLocations((m) => ({ ...m, [selectedIp]: loc }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedIp, ipLocations]);

  const ipLocation = selectedIp ? ipLocations[selectedIp] : undefined;

  return (
    <>
      {/* 一覧（コンパクト） */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-4 py-2.5 font-medium">応募者</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                募集
              </th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                面談日時
              </th>
              <th className="px-4 py-2.5 font-medium">状態</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                応募日
              </th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">
                      {a.title}
                    </span>
                    {a.warnedTerms.length > 0 && (
                      <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400 sm:hidden">
                    {a.postingTitle}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                  {a.postingTitle}
                </td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                  {a.slotLabel ?? "—"}
                </td>
                <td className="px-4 py-3">{statusBadge(a.status)}</td>
                <td className="hidden px-4 py-3 text-xs text-slate-400 sm:table-cell">
                  {a.createdLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 詳細モーダル */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selected.title}
                  </h2>
                  {statusBadge(selected.status)}
                  {selected.warnedTerms.length > 0 && (
                    <Badge variant="warn">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      注意: {selected.warnedTerms.join(", ")}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.postingTitle} ・ 応募 {selected.createdLabel}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                aria-label="閉じる"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selected.slotLabel && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                <CalendarClock className="h-3.5 w-3.5 text-accent-600" />
                {selected.slotLabel}
              </div>
            )}

            {selected.autoReason && (
              <p className="mt-2 text-xs text-red-600">
                自動判定: {selected.autoReason}
              </p>
            )}

            {/* メモ */}
            <form
              action={saveNote}
              className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4"
            >
              <input type="hidden" name="id" value={selected.id} />
              <label className="text-xs font-medium text-slate-500">メモ</label>
              <textarea
                name="note"
                rows={2}
                defaultValue={selected.note}
                key={selected.id}
                placeholder="この応募者についてのメモ"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
              <SubmitButton
                className={buttonClass("secondary", "sm", "self-start")}
              >
                メモを保存
              </SubmitButton>
            </form>

            {/* 回答 */}
            <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
              {selected.answers.map((ans, i) => (
                <div key={i} className="py-3">
                  <dt className="text-xs font-semibold text-accent-700">
                    {ans.label}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-slate-900">
                    {ans.value ? <Linkify text={ans.value} /> : "—"}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <Link
                href={`/a/${selected.token}`}
                target="_blank"
                className="inline-flex items-center gap-1 hover:text-slate-600"
              >
                <ExternalLink className="h-3 w-3" />
                応募者ページ
              </Link>
              {selected.clientIp && (
                <span>
                  IP: {selected.clientIp}
                  {ipLocation === undefined
                    ? "（所在地を取得中…）"
                    : ipLocation
                      ? `（${ipLocation}）`
                      : "（所在地不明）"}
                </span>
              )}
            </div>

            {/* 操作 */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {selected.status === "new" ? (
                <form action={rejectApplication}>
                  <input type="hidden" name="id" value={selected.id} />
                  <ConfirmSubmit
                    message="この応募を却下します（予約枠は空きに戻ります）。よろしいですか？"
                    className={buttonClass("dangerGhost", "sm")}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    却下
                  </ConfirmSubmit>
                </form>
              ) : (
                <form action={unrejectApplication}>
                  <input type="hidden" name="id" value={selected.id} />
                  <SubmitButton className={buttonClass("secondary", "sm")}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    却下を取り消す
                  </SubmitButton>
                </form>
              )}

              <form action={blockApplicationClient}>
                <input type="hidden" name="id" value={selected.id} />
                <ConfirmSubmit
                  message="この応募元（IP / 識別子）を今後ブロックし、この応募も却下します。よろしいですか？"
                  className={buttonClass("dangerGhost", "sm")}
                >
                  <ShieldX className="h-3.5 w-3.5" />
                  応募元をブロック
                </ConfirmSubmit>
              </form>

              <form action={deleteApplication} className="ml-auto">
                <input type="hidden" name="id" value={selected.id} />
                <ConfirmSubmit
                  message="この応募を完全に削除します。元に戻せません。よろしいですか？"
                  className={buttonClass("ghost", "sm")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  削除
                </ConfirmSubmit>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
