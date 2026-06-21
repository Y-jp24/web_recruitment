import { ShieldBan, Plus, Trash2, TriangleAlert, Ban } from "lucide-react";
import { listBlockTerms, listBlockedClients } from "@/lib/admin-queries";
import { formatDate, formatTime } from "@/lib/datetime";
import { Card, Badge, buttonClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { addBlockTerm, deleteBlockTerm, unblockClient } from "../../actions";

export const dynamic = "force-dynamic";

export default async function BlocklistPage() {
  const terms = await listBlockTerms();
  const clients = await listBlockedClients();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          ブロック / 注意ワード
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          応募の入力内容を機械的に照合します。
          <strong>ブロック</strong>に一致した応募はサイレントに自動却下、
          <strong>注意</strong>は受け付けたうえで一覧に印を付けます。
          クラウドワークスのユーザー名やプロフィールURLなどを登録すると判別しやすくなります。
        </p>

        {/* 追加フォーム */}
        <Card className="mt-4 p-5">
          <form action={addBlockTerm} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                ワード（ユーザー名・プロフィールURL等）
              </label>
              <input
                type="text"
                name="term"
                required
                placeholder="例: yamada_taro または https://crowdworks.jp/public/employees/xxxx"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">種別</label>
              <select
                name="type"
                defaultValue="block"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="block">ブロック（自動却下）</option>
                <option value="warn">注意（印を付ける）</option>
              </select>
            </div>
            <button className={buttonClass("primary", "md")}>
              <Plus className="h-4 w-4" />
              追加
            </button>
          </form>
        </Card>

        {/* 一覧 */}
        <div className="mt-4 flex flex-col gap-2">
          {terms.length === 0 ? (
            <Card className="p-6 text-center text-sm text-slate-500">
              登録されたワードはありません。
            </Card>
          ) : (
            terms.map((t) => (
              <Card
                key={t.id}
                className="flex items-center justify-between gap-3 p-3.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {t.type === "warn" ? (
                    <Badge variant="warn">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      注意
                    </Badge>
                  ) : (
                    <Badge variant="danger">
                      <Ban className="h-3.5 w-3.5" />
                      ブロック
                    </Badge>
                  )}
                  <span className="truncate font-mono text-sm text-slate-800">
                    {t.term}
                  </span>
                </div>
                <form action={deleteBlockTerm}>
                  <input type="hidden" name="id" value={t.id} />
                  <ConfirmSubmit
                    message="このワードを削除します。よろしいですか？"
                    className={buttonClass("ghost", "sm")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </ConfirmSubmit>
                </form>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ブロック済みクライアント */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <ShieldBan className="h-5 w-5 text-slate-400" />
          ブロック済みの応募元
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          自動却下や手動ブロックで記録された応募元（IP / 識別子）。誤りは解除できます。
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {clients.length === 0 ? (
            <Card className="p-6 text-center text-sm text-slate-500">
              ブロック済みの応募元はありません。
            </Card>
          ) : (
            clients.map((c) => (
              <Card
                key={c.id}
                className="flex items-center justify-between gap-3 p-3.5"
              >
                <div className="min-w-0 text-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {c.ip && (
                      <span className="text-slate-700">IP: {c.ip}</span>
                    )}
                    {c.clientId && (
                      <span className="truncate font-mono text-xs text-slate-500">
                        {c.clientId}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {c.reason} ・ {formatDate(c.createdAt)}{" "}
                    {formatTime(c.createdAt)}
                  </p>
                </div>
                <form action={unblockClient}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmit
                    message="この応募元のブロックを解除します。よろしいですか？"
                    className={buttonClass("secondary", "sm")}
                  >
                    解除
                  </ConfirmSubmit>
                </form>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
