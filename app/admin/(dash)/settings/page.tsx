import { Settings } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

/** 管理画面の設定ページ。アプリ全体の挙動を切り替える。 */
export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Settings className="h-5 w-5 text-slate-400" />
          設定
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          応募者向けの予約確認ページ（専用URL）に表示する操作を切り替えます。
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
