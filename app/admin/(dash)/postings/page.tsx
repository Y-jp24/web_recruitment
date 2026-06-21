import { Megaphone, FileText, StickyNote } from "lucide-react";
import { postings } from "@/lib/postings";
import { countByPosting, getPostingNotes } from "@/lib/admin-queries";
import { getOrigin } from "@/lib/applications";
import { Card, Badge, buttonClass } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { savePostingNote } from "../../actions";

export const dynamic = "force-dynamic";

export default async function PostingsPage() {
  const counts = await countByPosting();
  const notes = await getPostingNotes();
  const origin = await getOrigin();

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">募集案件</h1>
      <p className="mt-2 text-sm text-slate-500">
        案件は <code className="rounded bg-slate-100 px-1">lib/postings.ts</code>{" "}
        で定義します。応募者には下記URLを送ってください。
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {postings.map((p) => {
          const url = `${origin}/p/${p.slug}`;
          return (
            <Card key={p.slug} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-accent-600" />
                    <h2 className="font-semibold text-slate-900">{p.title}</h2>
                    {p.active ? (
                      <Badge variant="success">受付中</Badge>
                    ) : (
                      <Badge variant="neutral">停止中</Badge>
                    )}
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate font-mono text-xs text-accent-700 hover:underline"
                  >
                    {url}
                  </a>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                    <FileText className="h-4 w-4 text-slate-400" />
                    {counts[p.slug] ?? 0} 件
                  </span>
                  <CopyButton value={url} label="URLをコピー" />
                </div>
              </div>

              {/* 管理者用メモ（応募者には非表示） */}
              <form
                action={savePostingNote}
                className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4"
              >
                <input type="hidden" name="slug" value={p.slug} />
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <StickyNote className="h-3.5 w-3.5" />
                  管理メモ（応募者には表示されません）
                </label>
                <textarea
                  name="note"
                  rows={2}
                  defaultValue={notes[p.slug] ?? ""}
                  placeholder="例: クラウドワークスの募集URL https://crowdworks.jp/public/jobs/xxxxxxx"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
                <button
                  type="submit"
                  className={buttonClass("secondary", "sm", "self-start")}
                >
                  メモを保存
                </button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
