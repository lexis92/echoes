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
      description="Everything people have sent you, newest first."
      showFolders
      emptyIcon={<Inbox />}
      emptyTitle="No messages yet"
      emptyDescription="Nothing arrives until someone has your link. Put it somewhere people will actually see it: a bio, a story, a group chat."
      emptyAction={
        <Button asChild>
          <Link href="/dashboard">Get your link</Link>
        </Button>
      }
      searchParams={params}
    />
  );
}
