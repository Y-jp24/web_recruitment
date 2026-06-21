"use client";

import { useState, useTransition } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import type { PostingFieldRow } from "@/lib/db/schema";
import { FIELD_TYPES } from "@/lib/postings";
import { buttonClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/submit-button";
import { updateField, deleteField, reorderFields } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500";
const labelClass = "text-xs font-medium text-slate-500";

function FieldCard({
  field,
  dragging,
  over,
  onHandleDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  field: PostingFieldRow;
  dragging: boolean;
  over: boolean;
  onHandleDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const postingId = field.postingId;
  const showOptions = field.type === "select" || field.type === "radio";

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition",
        dragging && "opacity-50",
        over && "ring-2 ring-accent-400",
      )}
    >
      {/* ヘッダ: ドラッグハンドル・削除 */}
      <div className="mb-3 flex items-center justify-between">
        <span
          draggable
          onDragStart={onHandleDragStart}
          className="flex cursor-grab items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 active:cursor-grabbing"
          aria-label="ドラッグして並び替え"
          title="ドラッグして並び替え"
        >
          <GripVertical className="h-4 w-4" />
          ドラッグで並び替え
        </span>
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

      <form action={updateField} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={field.id} />
        <input type="hidden" name="postingId" value={postingId} />

        <div className="flex flex-col gap-1">
          <label className={labelClass}>ラベル（表示名）</label>
          <input name="label" defaultValue={field.label} className={inputClass} />
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
            <label className={labelClass}>選択肢（改行またはカンマ区切り）</label>
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
    </div>
  );
}

export function FieldsEditor({
  postingId,
  fields,
}: {
  postingId: string;
  fields: PostingFieldRow[];
}) {
  const [items, setItems] = useState(fields);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // サーバ側の並び/件数が変わったら同期（保存・追加・削除・並び替え確定後）
  const serverKey = fields.map((f) => f.id).join(",");
  const [prevKey, setPrevKey] = useState(serverKey);
  if (prevKey !== serverKey) {
    setPrevKey(serverKey);
    setItems(fields);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setOverId(null);
      return;
    }
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragId(null);
    setOverId(null);
    startTransition(() => {
      reorderFields(
        postingId,
        next.map((i) => i.id),
      );
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((f) => (
        <FieldCard
          key={f.id}
          field={f}
          dragging={dragId === f.id}
          over={overId === f.id && dragId !== f.id}
          onHandleDragStart={() => setDragId(f.id)}
          onDragOver={(e) => {
            e.preventDefault();
            if (overId !== f.id) setOverId(f.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(f.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
        />
      ))}
    </div>
  );
}
