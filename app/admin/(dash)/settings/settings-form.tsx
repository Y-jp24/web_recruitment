"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import type { AppSettings } from "@/lib/settings";
import { Card, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { updateSettings } from "../../actions";

// 設定項目の定義（フォームの name と表示文言を一元管理）
const TOGGLES = [
  {
    name: "reservationCancelEnabled" as const,
    label: "キャンセルボタンを表示する",
    help: "予約確認ページに、応募者本人が予約をキャンセルできるボタンを表示します。",
  },
  {
    name: "reservationRescheduleEnabled" as const,
    label: "日程変更ボタンを表示する",
    help: "予約確認ページに、日程を選び直すボタンを表示します（現在の予約をキャンセルし、入力内容を引き継いで予約し直します）。",
  },
];

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction] = useActionState(updateSettings, { savedAt: 0 });

  return (
    <Card className="p-6">
      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          {TOGGLES.map((t) => (
            <label
              key={t.name}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                name={t.name}
                defaultChecked={settings[t.name]}
                className="mt-0.5 h-4 w-4 accent-accent-600"
              />
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-800">
                  {t.label}
                </span>
                <span className="text-xs leading-relaxed text-slate-500">
                  {t.help}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton className={buttonClass("primary", "md")}>
            保存する
          </SubmitButton>
          {state.savedAt > 0 && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <Check className="h-3.5 w-3.5" />
              保存しました
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
