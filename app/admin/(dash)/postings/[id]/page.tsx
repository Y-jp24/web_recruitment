import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { getPostingRowsById } from "@/lib/postings-db";
import { getOrigin } from "@/lib/applications";
import { FIELD_TYPES, DEFAULT_AFTER_APPLY_MESSAGE } from "@/lib/postings";
import type { PostingFieldRow } from "@/lib/db/schema";
import { Card, buttonClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/submit-button";
import {
  updatePostingMeta,
  resetAfterApplyMessage,
  deletePosting,
  addField,
  updateField,
  deleteField,
  moveField,
} from "../../../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500";
const labelClass = "text-xs font-medium text-slate-500";

function FieldEditor({ field }: { field: PostingFieldRow }) {
  const postingId = field.postingId;
  const showOptions = field.type === "select" || field.type === "radio";

  return (
    <Card className="p-4">
      {/* ヘッダ: 並び替え・削除（updateField フォームの外） */}
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <GripVertical className="h-3.5 w-3.5" />
          項目
        </span>
        <div className="flex items-center gap-1">
          <form action={moveField}>
            <input type="hidden" name="id" value={field.id} />
            <input type="hidden" name="postingId" value={postingId} />
            <input type="hidden" name="dir" value="up" />
            <SubmitButton
              aria-label="上へ"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ChevronUp className="h-4 w-4" />
            </SubmitButton>
          </form>
          <form action={moveField}>
            <input type="hidden" name="id" value={field.id} />
            <input type="hidden" name="postingId" value={postingId} />
            <input type="hidden" name="dir" value="down" />
            <SubmitButton
              aria-label="下へ"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ChevronDown className="h-4 w-4" />
            </SubmitButton>
          </form>
          <form action={deleteField}>
            <input type="hidden" name="id" value={field.id} />
            <input type="hidden" name="postingId" value={postingId} />
            <ConfirmSubmit
              message="この項目を削除します。よろしいですか？"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      <form action={updateField} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={field.id} />
        <input type="hidden" name="postingId" value={postingId} />

        <div className="flex flex-col gap-1">
          <label className={labelClass}>ラベル（表示名）</label>
          <input
            name="label"
            defaultValue={field.label}
            className={inputClass}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>種別</label>
            <select name="type" defaultValue={field.type} className={inputClass}>
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>最低文字数（任意）</label>
            <input
              name="minLength"
              type="number"
              min={0}
              defaultValue={field.minLength ?? ""}
              placeholder="例: 200"
              className={inputClass}
            />
          </div>
        </div>

        {showOptions && (
          <div className="flex flex-col gap-1">
            <label className={labelClass}>
              選択肢（改行またはカンマ区切り）
            </label>
            <textarea
              name="options"
              rows={3}
              defaultValue={(field.options ?? []).join("\n")}
              className={inputClass}
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>プレースホルダ（任意）</label>
            <input
              name="placeholder"
              defaultValue={field.placeholder ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>補足説明（任意）</label>
            <input
              name="help"
              defaultValue={field.help ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="required"
              defaultChecked={field.required}
              className="h-4 w-4 accent-accent-600"
            />
            必須
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isName"
              defaultChecked={field.isName}
              className="h-4 w-4 accent-accent-600"
            />
            一覧のタイトルとして使う
          </label>
          <SubmitButton className={buttonClass("secondary", "sm", "ml-auto")}>
            保存
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

export default async function PostingEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPostingRowsById(id);
  if (!data) notFound();
  const { posting, fields } = data;
  const origin = await getOrigin();
  const url = `${origin}/p/${posting.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/postings"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          募集一覧へ
        </Link>
      </div>

      {/* 案件メタ情報 */}
      <Card className="p-5">
        <form action={updatePostingMeta} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={posting.id} />
          <div className="flex flex-col gap-1">
            <label className={labelClass}>募集タイトル</label>
            <input name="title" defaultValue={posting.title} className={inputClass} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>URL識別子（slug）</label>
              <input
                name="slug"
                defaultValue={posting.slug}
                className={`${inputClass} font-mono`}
              />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent-700 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {url}
              </a>
            </div>
            <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="active"
                defaultChecked={posting.active}
                className="h-4 w-4 accent-accent-600"
              />
              受付中（オフで応募停止）
            </label>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>応募ページの説明文（任意）</label>
            <textarea
              name="intro"
              rows={3}
              defaultValue={posting.intro ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>
              管理メモ（応募者には表示されません。例: クラウドワークスの募集URL）
            </label>
            <textarea
              name="note"
              rows={2}
              defaultValue={posting.note ?? ""}
              placeholder="https://crowdworks.jp/public/jobs/xxxxxxx"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>
              応募完了後の案内文（応募者に表示。オンライン面談URLの上に表示されます）
            </label>
            <textarea
              name="afterApplyMessage"
              rows={3}
              defaultValue={posting.afterApplyMessage ?? ""}
              placeholder={DEFAULT_AFTER_APPLY_MESSAGE}
              className={inputClass}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                未入力の場合は既定の案内文が表示されます。
              </p>
              {posting.afterApplyMessage && (
                // 既定文（未設定）に戻す。フォーム内だが formAction で専用アクションへ送る。
                <SubmitButton
                  formAction={resetAfterApplyMessage}
                  className={buttonClass("ghost", "sm")}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  既定に戻す
                </SubmitButton>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <SubmitButton className={buttonClass("primary", "md")}>
              保存
            </SubmitButton>
          </div>
        </form>
      </Card>

      {/* 項目（フォームビルダー） */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">入力項目</h2>
          <form action={addField}>
            <input type="hidden" name="postingId" value={posting.id} />
            <SubmitButton className={buttonClass("secondary", "sm")}>
              <Plus className="h-4 w-4" />
              項目を追加
            </SubmitButton>
          </form>
        </div>
        {fields.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            項目がありません。「項目を追加」で作成してください。
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {fields.map((f) => (
              <FieldEditor key={f.id} field={f} />
            ))}
          </div>
        )}
      </div>

      {/* 危険操作 */}
      <Card className="border-red-100 p-5">
        <h3 className="text-sm font-semibold text-slate-800">この募集を削除</h3>
        <p className="mt-1 text-xs text-slate-500">
          応募データは残りますが、この募集ページと項目定義は削除されます。
        </p>
        <form action={deletePosting} className="mt-3">
          <input type="hidden" name="id" value={posting.id} />
          <ConfirmSubmit
            message="この募集を削除します。元に戻せません。よろしいですか？"
            className={buttonClass("dangerGhost", "sm")}
          >
            <Trash2 className="h-3.5 w-3.5" />
            募集を削除
          </ConfirmSubmit>
        </form>
      </Card>
    </div>
  );
}
