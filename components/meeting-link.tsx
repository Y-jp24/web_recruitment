/**
 * オンライン面談URLの案内ブロック。
 *
 * 応募完了ページ（/p/[slug]/done）と応募者の状況確認ページ（/a/[token]）の
 * 両方で使う。案内文（message）は案件ごとに管理画面で設定でき、未設定なら
 * 既定文を表示する。
 */

import { Video } from "lucide-react";
import { SentenceLines } from "@/components/ui";
import { DEFAULT_AFTER_APPLY_MESSAGE } from "@/lib/postings";

export function MeetingLink({
  url,
  message,
}: {
  url: string;
  message?: string | null;
}) {
  // 案件ごとの案内文。未設定なら既定文にフォールバックする。
  const text = (message && message.trim()) || DEFAULT_AFTER_APPLY_MESSAGE;

  return (
    <div className="mt-6 rounded-xl border border-accent-100 bg-accent-50 p-4 text-left">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <Video className="h-4 w-4 text-accent-600" />
        オンライン面談
      </div>
      <SentenceLines
        text={text}
        className="mt-1.5 text-xs leading-relaxed text-slate-600"
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2.5 block break-all rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-accent-700 hover:bg-slate-50"
      >
        {url}
      </a>
    </div>
  );
}
