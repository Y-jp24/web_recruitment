import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CalendarClock, Link2 } from "lucide-react";
import { getApplicationByToken, getOrigin } from "@/lib/applications";
import { getPostingBySlug } from "@/lib/postings-db";
import { formatSlotRange } from "@/lib/datetime";
import { Container, Card } from "@/components/ui";
import { MeetingLink } from "@/components/meeting-link";
import { CopyButton } from "@/components/copy-button";

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

  // オンライン面談URLは却下扱いでない応募にのみ表示する（自動却下はサイレント）。
  const posting = await getPostingBySlug(app.postingSlug);
  const showMeeting = app.status === "new" && !!app.meetingUrl;

  return (
    <Container className="py-14">
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">
          面談のご予約を受け付けました
        </h1>

        {app.slot && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <CalendarClock className="h-4 w-4 text-accent-600" />
            <span>
              面談日時：
              {formatSlotRange(app.slot.startAt, app.slot.endAt)}
            </span>
          </div>
        )}

        {showMeeting && (
          <MeetingLink
            url={app.meetingUrl!}
            message={posting?.afterApplyMessage}
          />
        )}

        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <Link2 className="h-4 w-4 text-accent-600" />
            状況確認用URL（変更・ご連絡はこちらに反映されます）
          </div>
          <div className="mt-2.5 flex items-stretch gap-2">
            <Link
              href={`/a/${token}`}
              className="flex min-w-0 flex-1 items-center break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-accent-700 hover:bg-slate-100"
            >
              {statusUrl}
            </Link>
            <CopyButton value={statusUrl} iconOnly />
          </div>
        </div>
      </Card>
    </Container>
  );
}
