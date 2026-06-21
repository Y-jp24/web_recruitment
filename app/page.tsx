import { ClipboardList } from "lucide-react";
import { Container, Card, Badge } from "@/components/ui";

export default function Home() {
  return (
    <Container className="flex min-h-screen max-w-lg items-center py-16">
      <Card className="w-full p-8 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
          <ClipboardList className="h-6 w-6 text-accent-600" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
          採用応募 + 面談予約フォーム
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          ご応募は、お送りしたURLからお願いします。
        </p>

        <div className="mt-6 flex items-center justify-center">
          <Badge variant="accent">オープンソース (MIT)</Badge>
        </div>
      </Card>
    </Container>
  );
}
