import { notFound } from "next/navigation";
import { CalendarClock, Clock, Info } from "lucide-react";
import { getApplicationByToken } from "@/lib/applications";
import { getPostingBySlug } from "@/lib/postings-db";
import { formatSlotRange } from "@/lib/datetime";
import { Container, Card, Badge, SentenceLines } from "@/components/ui";
import { MeetingLink } from "@/components/meeting-link";

export const dynamic = "force-dynamic";

export default async function StatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const app = await getApplicationByToken(token);
  if (!app) notFound();

  const posting = await getPostingBySlug(app.postingSlug);
  const declined = app.status === "auto_rejected" || app.status === "rejected";

  return (
    <Container className="py-14">
      <Card className="p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          選考状況
        </p>
        <h1 className="mt-1 text-lg font-bold text-slate-900">
          {posting?.title ?? "ご応募"}
        </h1>

        {declined ? (
          <div className="mt-6">
            <Badge variant="neutral">選考終了</Badge>
            <SentenceLines
              text="この度はご応募いただき、誠にありがとうございました。慎重に検討させていただきました結果、今回はご縁を見送らせていただくことになりました。貴重なお時間をいただきましたこと、心より感謝申し上げます。"
              className="mt-4 text-sm leading-relaxed text-slate-600"
            />
          </div>
        ) : (
          <div className="mt-6">
            <Badge variant="accent">
              <Clock className="h-3.5 w-3.5" />
              選考中
            </Badge>
            <SentenceLines
              text="応募を受け付けています。面談の可否はこのページに反映されます。必ずしも個別にご連絡するとは限りませんので、ときどきご確認ください。"
              className="mt-4 text-sm leading-relaxed text-slate-600"
            />

            {app.slot && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <CalendarClock className="h-4 w-4 text-accent-600" />
                <span>
                  面談希望日時：
                  {formatSlotRange(app.slot.startAt, app.slot.endAt)}
                </span>
              </div>
            )}

            {app.meetingUrl && (
              <MeetingLink
                url={app.meetingUrl}
                message={posting?.afterApplyMessage}
              />
            )}
          </div>
        )}

        <div className="mt-8 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>このページはご本人のみがアクセスできる専用URLです。</p>
        </div>
      </Card>
    </Container>
  );
}
