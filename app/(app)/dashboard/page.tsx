import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Inbox } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import { getVaultStats, listFolders, listMessages } from "@/lib/data/messages";
import { ShareCard } from "@/components/app/share-card";
import { StatTiles } from "@/components/app/stat-tiles";
import { DashboardNudges } from "@/components/app/dashboard-nudges";
import { MessageList } from "@/components/app/message-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DashboardTracking } from "@/components/app/dashboard-tracking";

export const metadata: Metadata = { title: "Overview", robots: { index: false } };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const [stats, folders, recent] = await Promise.all([
    getVaultStats(),
    listFolders(),
    listMessages({ view: "inbox", limit: 4 }),
  ]);

  const firstName = profile.name.split(" ")[0] || profile.name;

  return (
    <div className="space-y-10">
      <DashboardTracking
        userId={profile.id}
        username={profile.username}
        createdAt={profile.created_at}
        totalMessages={stats.counts.total}
      />

      <header>
        <p className="label text-ember">{greeting()}</p>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.1] tracking-tightest text-ink sm:text-[2.75rem]">
          {stats.counts.unread > 0 ? (
            <>
              {firstName}, {stats.counts.unread}{" "}
              {stats.counts.unread === 1 ? "message is" : "messages are"} waiting.
            </>
          ) : stats.counts.total > 0 ? (
            <>You&rsquo;re all caught up, {firstName}.</>
          ) : (
            <>Your vault is ready, {firstName}.</>
          )}
        </h1>
      </header>

      <div id="share" className="scroll-mt-24">
        <ShareCard username={profile.username} name={profile.name} />
      </div>

      <DashboardNudges profile={profile} totalMessages={stats.counts.total} />

      {stats.counts.total > 0 && (
        <StatTiles counts={stats.counts} last30Days={stats.last30Days} />
      )}

      <section aria-labelledby="recent-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="recent-heading" className="font-display text-xl tracking-tightest text-ink">
            Latest
          </h2>
          {recent.messages.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/inbox">
                See all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {recent.messages.length === 0 ? (
          <EmptyState
            icon={<Inbox />}
            title="No messages yet"
            description="Share your link and this fills up fast. Most people get their first message within a day."
          />
        ) : (
          <MessageList
            messages={recent.messages}
            folders={folders}
            filterProfanity={profile.profanity_filter}
            grouped={false}
          />
        )}
      </section>
    </div>
  );
}
