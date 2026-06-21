import { notFound } from "next/navigation";
import { CalendarClock, Info } from "lucide-react";
import { getApplicationByToken } from "@/lib/applications";
import { getPostingBySlug } from "@/lib/postings-db";
import { formatSlotRange } from "@/lib/datetime";
import { Container, Card } from "@/components/ui";
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
        <h1 className="text-lg font-bold text-slate-900">
          {posting?.title ?? "ご応募"}
        </h1>

        {declined ? (
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            ご応募内容を慎重に検討させていただきましたが、誠に残念ながら、今回はお見送りとさせていただくことになりました。
          </p>
        ) : (
          <div className="mt-5">
            {app.slot && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <CalendarClock className="h-4 w-4 text-accent-600" />
                <span>
                  面談日時：{formatSlotRange(app.slot.startAt, app.slot.endAt)}
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
