// 管理ログインのフォーム（クライアントコンポーネント）。
// パスワード送信に加え、ログイン試行のロック状態を扱う。
// ロック中はボタンを無効化し、残り時間をカウントダウン表示して、
// 解除されたら自動で再び押せるようにする。
"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { login, type LoginState } from "../actions";
import { buttonClass } from "@/components/ui";

// 残り秒数を「N分N秒」表記にする（1分未満は秒のみ）
function formatRemaining(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

export function LoginForm({
  // ページ表示時点でロック中なら、サーバーから残り秒数が渡る
  initialRetryAfterSec,
}: {
  initialRetryAfterSec?: number;
}) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  // ロック解除時刻（epoch ms）。初期値はサーバー判定、以降はアクション結果で更新。
  const [lockedUntilMs, setLockedUntilMs] = useState<number | null>(
    initialRetryAfterSec ? Date.now() + initialRetryAfterSec * 1000 : null,
  );
  // カウントダウン表示のための現在時刻
  const [now, setNow] = useState<number>(() => Date.now());

  // アクション結果にロック情報があれば解除時刻を更新
  useEffect(() => {
    if (state.retryAfterSec) {
      setLockedUntilMs(Date.now() + state.retryAfterSec * 1000);
    }
  }, [state]);

  // ロック中は1秒ごとに残り時間を更新。解除後はタイマーを止める。
  useEffect(() => {
    if (lockedUntilMs === null) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      setNow(Date.now());
      if (Date.now() >= lockedUntilMs && id) {
        clearInterval(id);
        id = null;
      }
    };
    tick();
    id = setInterval(tick, 1000);
    return () => {
      if (id) clearInterval(id);
    };
  }, [lockedUntilMs]);

  const remainingSec = lockedUntilMs
    ? Math.max(0, Math.ceil((lockedUntilMs - now) / 1000))
    : 0;
  const isLocked = remainingSec > 0;

  // ロック中はカウントダウン付きの文言を優先表示する
  const errorText = isLocked
    ? `ログイン試行が多すぎます。あと${formatRemaining(remainingSec)}で再度お試しください。`
    : state.error;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <input
        type="password"
        name="password"
        autoFocus
        placeholder="パスワード"
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
      />
      {errorText && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {errorText}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || isLocked}
        className={buttonClass("primary", "md", "w-full")}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "ログイン"
        )}
      </button>
    </form>
  );
}
