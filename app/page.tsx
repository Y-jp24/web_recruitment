import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { postings } from "@/lib/postings";
import { Container, Card } from "@/components/ui";

export default function Home() {
  const active = postings.filter((p) => p.active);
  return (
    <Container className="py-16">
      <h1 className="text-xl font-bold text-slate-900">募集一覧</h1>
      <p className="mt-2 text-sm text-slate-500">
        ご案内したURLからご応募ください。
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {active.length === 0 ? (
          <Card className="p-6 text-sm text-slate-500">
            現在公開中の募集はありません。
          </Card>
        ) : (
          active.map((p) => (
            <Link key={p.slug} href={`/p/${p.slug}`}>
              <Card className="flex items-center justify-between p-5 transition hover:border-accent-300 hover:shadow">
                <span className="font-medium text-slate-800">{p.title}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Card>
            </Link>
          ))
        )}
      </div>
    </Container>
  );
}
