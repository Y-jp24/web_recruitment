import { notFound } from "next/navigation";
import { getPostingBySlug } from "@/lib/postings-db";
import { getAvailableSlots } from "@/lib/slots";
import { formatTime, jstDateKey, todayJstKey } from "@/lib/datetime";
import { Container, Card, SentenceLines } from "@/components/ui";
import { ApplyForm } from "./apply-form";
import { submitApplication } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posting = await getPostingBySlug(slug);
  if (!posting) notFound();

  if (!posting.active) {
    return (
      <Container className="py-16">
        <Card className="p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-800">
            {posting.title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            この募集は現在受け付けを終了しています。
          </p>
        </Card>
      </Container>
    );
  }

  const slots = await getAvailableSlots();
  const slotData = slots.map((s) => ({
    id: s.id,
    jstDate: jstDateKey(s.startAt),
    timeLabel: `${formatTime(s.startAt)}〜${formatTime(s.endAt)}`,
    sortKey: s.startAt.getTime(),
  }));

  const boundAction = submitApplication.bind(null, slug);

  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {posting.title}
        </h1>
        {posting.intro && (
          <SentenceLines
            text={posting.intro}
            className="mt-3 text-sm leading-relaxed text-slate-600"
          />
        )}
      </div>

      <Card className="p-6 sm:p-8">
        <ApplyForm
          fields={posting.fields}
          slots={slotData}
          todayJst={todayJstKey()}
          action={boundAction}
        />
      </Card>
    </Container>
  );
}
