import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getSealedMessages } from "@/lib/data/messages";
import { PageHeader } from "@/components/app/page-header";
import { SealedCard } from "@/components/app/sealed-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Locked", robots: { index: false } };

export default async function ScheduledPage() {
  const sealed = await getSealedMessages();

  return (
    <>
      <PageHeader
        eyebrow="Not open yet"
        title="Locked"
        description={
          sealed.length
            ? `${pluralize(sealed.length, "message")} waiting. We'll email you when each one opens.`
            : undefined
        }
      />

      {sealed.length === 0 ? (
        <EmptyState
          icon={<Lock />}
          title="Nothing locked yet"
          description="Senders can pick a date for their message to open: a birthday, a first day, an anniversary. Until then nobody can read it, including you."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard">Share your link</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sealed.map((message, i) => (
            <SealedCard key={message.id} message={message} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
