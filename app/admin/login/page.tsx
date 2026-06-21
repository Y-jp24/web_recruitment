"use client";

import { useActionState } from "react";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { login, type LoginState } from "../actions";
import { Container, Card, buttonClass } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <Container className="flex min-h-screen max-w-sm items-center py-16">
      <Card className="w-full p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
          <Lock className="h-5 w-5 text-accent-600" />
        </div>
        <h1 className="mt-4 text-center text-lg font-bold text-slate-900">
          管理ログイン
        </h1>

        <form action={formAction} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            name="password"
            autoFocus
            placeholder="パスワード"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          {state.error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className={buttonClass("primary", "md", "w-full")}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "ログイン"
            )}
          </button>
        </form>
      </Card>
    </Container>
  );
}
