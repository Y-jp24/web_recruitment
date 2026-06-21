import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CalendarClock, Link2 } from "lucide-react";
import { getApplicationByToken, getOrigin } from "@/lib/applications";
import { formatSlotRange } from "@/lib/datetime";
import { Container, Card, SentenceLines } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DonePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) notFound();

  const app = await getApplicationByToken(token);
  if (!app) notFound();

  const origin = await getOrigin();
  const statusUrl = `${origin}/a/${token}`;

  return (
    <Container className="py-14">
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">
          ご応募ありがとうございました
        </h1>
        <SentenceLines
          text="応募を受け付けました。内容を確認のうえ、面談の可否をご案内します。"
          className="mt-2 text-sm leading-relaxed text-slate-600"
        />

        {app.slot && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <CalendarClock className="h-4 w-4 text-accent-600" />
            <span>
              面談希望日時：
              {formatSlotRange(app.slot.startAt, app.slot.endAt)}
            </span>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Link2 className="h-4 w-4 text-accent-600" />
            状況確認用URL
          </div>
          <SentenceLines
            text="選考状況はこちらのURLでご確認ください。必ずしも個別にご連絡するとは限りません。ブックマークをおすすめします。"
            className="mt-1.5 text-xs leading-relaxed text-slate-500"
          />
          <Link
            href={`/a/${token}`}
            className="mt-2.5 block break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-accent-700 hover:bg-slate-100"
          >
            {statusUrl}
          </Link>
        </div>
      </Card>
    </Container>
  );
}
