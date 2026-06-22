import { notFound } from "next/navigation";
import { getPostingBySlug } from "@/lib/postings-db";
import { getApplicationByToken } from "@/lib/applications";
import { getAvailableSlots } from "@/lib/slots";
import { formatTime, jstDateKey, todayJstKey } from "@/lib/datetime";
import { RESCHEDULE_FROM_PARAM } from "@/lib/constants";
import { Container, Card } from "@/components/ui";
import { ApplyForm } from "./apply-form";
import { submitApplication } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [RESCHEDULE_FROM_PARAM]?: string }>;
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

  // 日程変更（from=旧トークン）の場合は、旧応募の回答をフォームに初期表示する。
  // 同じ募集の応募のときだけ採用する（別案件のデータ流用を防ぐ）。
  const { [RESCHEDULE_FROM_PARAM]: fromToken } = await searchParams;
  let initialValues: Record<string, string> | undefined;
  if (fromToken) {
    const previous = await getApplicationByToken(fromToken);
    if (previous && previous.postingSlug === slug) {
      initialValues = previous.answers;
    }
  }

  const boundAction = submitApplication.bind(null, slug);

  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {posting.title}
        </h1>
        {posting.intro && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {posting.intro}
          </p>
        )}
      </div>

      <Card className="p-6 sm:p-8">
        <ApplyForm
          fields={posting.fields}
          slots={slotData}
          todayJst={todayJstKey()}
          action={boundAction}
          initialValues={initialValues}
        />
      </Card>
    </Container>
  );
}
