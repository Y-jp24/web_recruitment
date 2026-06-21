import { Code2, Sparkles } from "lucide-react";
import { Container, Card, Badge } from "@/components/ui";

const REPO_URL = "https://github.com/Y-jp24/web_recruitment";

export default function Home() {
  return (
    <Container className="flex min-h-screen max-w-lg items-center py-16">
      <Card className="w-full p-8 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
          <Sparkles className="h-6 w-6 text-accent-600" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
          採用応募 + 面談予約フォーム
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          指定フォーマットでの応募と面談予約をまとめて行える、
          自己ホスト型のフォームです。
          <br />
          ご応募は、お送りしたURLからお願いします。
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Badge variant="accent">オープンソース (MIT)</Badge>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Code2 className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </Card>
    </Container>
  );
}
