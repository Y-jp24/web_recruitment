// 管理ログインページ。
// ページ表示時点でログイン試行がロックされていればそれを判定し、
// フォーム（クライアント側）へ残り時間を渡して最初からボタンを無効化する。
import { Lock } from "lucide-react";
import { Container, Card } from "@/components/ui";
import { getClientIp } from "@/lib/request";
import { checkLock } from "@/lib/login-throttle";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // 表示時点でロック中なら、その残り秒数をフォームに渡す
  const ip = (await getClientIp()) ?? "unknown";
  const lock = await checkLock(ip);
  const initialRetryAfterSec = lock.allowed ? undefined : lock.retryAfterSec;

  return (
    <Container className="flex min-h-screen max-w-sm items-center py-16">
      <Card className="w-full p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
          <Lock className="h-5 w-5 text-accent-600" />
        </div>
        <h1 className="mt-4 text-center text-lg font-bold text-slate-900">
          管理ログイン
        </h1>

        <LoginForm initialRetryAfterSec={initialRetryAfterSec} />
      </Card>
    </Container>
  );
}
