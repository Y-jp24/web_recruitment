import { notFound } from "next/navigation";
import { getPosting } from "@/lib/postings";
import { getAvailableSlots } from "@/lib/slots";
import { formatSlotRange } from "@/lib/datetime";
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
  const posting = getPosting(slug);
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
  const slotOptions = slots.map((s) => ({
    id: s.id,
    label: formatSlotRange(s.startAt, s.endAt),
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
          slots={slotOptions}
          action={boundAction}
        />
      </Card>
    </Container>
  );
}
