"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { CalendarClock, Loader2, AlertCircle } from "lucide-react";
import type { Field } from "@/lib/postings";
import { CLIENT_ID_FIELD } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui";
import { SlotPicker, type SlotData } from "@/components/slot-picker";
import type { ApplyState } from "./actions";

const LS_KEY = "rcid";

const inputBase =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition";

function FieldControl({
  field,
  error,
}: {
  field: Field;
  error?: string;
}) {
  const borderClass = error ? "border-red-300" : "border-slate-300";
  const common = cn(inputBase, borderClass);

  if (field.type === "textarea") {
    return (
      <textarea
        name={field.name}
        rows={5}
        placeholder={field.placeholder}
        className={cn(common, "resize-y leading-relaxed")}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select name={field.name} className={common} defaultValue="">
        <option value="" disabled>
          選択してください
        </option>
        {field.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "radio") {
    return (
      <div className="flex flex-col gap-2">
        {field.options?.map((o) => (
          <label
            key={o}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm hover:bg-slate-50 cursor-pointer"
          >
            <input
              type="radio"
              name={field.name}
              value={o}
              className="h-4 w-4 accent-accent-600"
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  }

  const inputType =
    field.type === "email"
      ? "email"
      : field.type === "tel"
        ? "tel"
        : field.type === "number"
          ? "number"
          : "text";

  return (
    <input
      type={inputType}
      name={field.name}
      placeholder={field.placeholder}
      className={common}
    />
  );
}

export function ApplyForm({
  fields,
  slots,
  todayJst,
  action,
}: {
  fields: Field[];
  slots: SlotData[];
  todayJst: string;
  action: (prev: ApplyState, formData: FormData) => Promise<ApplyState>;
}) {
  const [state, formAction, isPending] = useActionState<ApplyState, FormData>(
    action,
    { ok: false },
  );
  const [clientId, setClientId] = useState("");
  const formId = useId();

  // 応募者識別子を localStorage に保持（Cookie と相互補完）
  useEffect(() => {
    let id = "";
    try {
      id = localStorage.getItem(LS_KEY) ?? "";
      if (!id) {
        id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);
        localStorage.setItem(LS_KEY, id);
      }
    } catch {
      // localStorage 不可の環境では無視
    }
    setClientId(id);
  }, []);

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name={CLIENT_ID_FIELD} value={clientId} />

      {state.formError && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.formError}
        </p>
      )}

      {/* 入力項目 */}
      <div className="flex flex-col gap-5">
        {fields.map((field) => {
          const fid = `${formId}-${field.name}`;
          const err = errors[field.name];
          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label
                htmlFor={fid}
                className="text-sm font-medium text-slate-800"
              >
                {field.label}
                {field.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
                {!field.required && (
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    任意
                  </span>
                )}
              </label>
              {field.help && (
                <p className="text-xs text-slate-500">{field.help}</p>
              )}
              <div id={fid}>
                <FieldControl field={field} error={err} />
              </div>
              {err && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 面談枠の選択 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <CalendarClock className="h-4 w-4 text-accent-600" />
          面談希望の日時<span className="text-red-500">*</span>
        </div>
        <SlotPicker
          slots={slots}
          todayJst={todayJst}
          error={errors["slot_id"]}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || slots.length === 0}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            送信中…
          </>
        ) : (
          "この内容で応募する"
        )}
      </button>
      <p className="text-center text-xs text-slate-400">
        ＊ は必須項目です。送信後に専用URLで状況をご確認いただけます。
      </p>
    </form>
  );
}
