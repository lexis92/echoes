import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { MessageBoard, type BoardSearchParams } from "@/components/app/message-board";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Inbox", robots: { index: false } };

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<BoardSearchParams>;
}) {
  const params = await searchParams;
  return (
    <MessageBoard
      view="inbox"
      basePath="/inbox"
      eyebrow="Your vault"
      title="Inbox"
      description="Everything anyone has sent you, newest first."
      showFolders
      emptyIcon={<Inbox />}
      emptyTitle="Nothing here yet"
      emptyDescription="Your vault fills up the moment someone opens your link. Share it somewhere people will see it — a story, a bio, a group chat."
      emptyAction={
        <Button asChild>
          <Link href="/dashboard">Get my link</Link>
        </Button>
      }
      searchParams={params}
    />
  );
}
