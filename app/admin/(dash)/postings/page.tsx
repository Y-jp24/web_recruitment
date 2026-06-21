import Link from "next/link";
import { Megaphone, FileText, Plus, Pencil, AlertCircle } from "lucide-react";
import { listPostingRows } from "@/lib/postings-db";
import { countByPosting } from "@/lib/admin-queries";
import { getOrigin } from "@/lib/applications";
import { Card, Badge, buttonClass } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { SubmitButton } from "@/components/submit-button";
import { createPosting } from "../../actions";

export const dynamic = "force-dynamic";

export default async function PostingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const list = await listPostingRows();
  const counts = await countByPosting();
  const origin = await getOrigin();

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">募集案件</h1>
      <p className="mt-2 text-sm text-slate-500">
        案件と入力項目は管理画面で編集できます。応募者には各案件のURLを送ってください。
      </p>

      {/* 新規作成 */}
      <Card className="mt-5 p-5">
        <h2 className="text-sm font-semibold text-slate-800">新しい募集を作成</h2>
        {error === "slug" && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            そのURL識別子(slug)は既に使われています。別の値にしてください。
          </p>
        )}
        <form
          action={createPosting}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              募集タイトル
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="例: 業務委託ライター募集"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              URL識別子（半角英数字）
            </label>
            <input
              type="text"
              name="slug"
              required
              placeholder="writer-2026"
              className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <SubmitButton className={buttonClass("primary", "md")}>
            <Plus className="h-4 w-4" />
            作成して編集
          </SubmitButton>
        </form>
      </Card>

      {/* 一覧 */}
      <div className="mt-5 flex flex-col gap-3">
        {list.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            まだ募集がありません。上のフォームから作成してください。
          </Card>
        ) : (
          list.map((p) => {
            const url = `${origin}/p/${p.slug}`;
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-accent-600" />
                      <h2 className="font-semibold text-slate-900">
                        {p.title}
                      </h2>
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
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                  <Link
                    href={`/admin/postings/${p.id}`}
                    className={buttonClass("secondary", "sm")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    項目・内容を編集
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
