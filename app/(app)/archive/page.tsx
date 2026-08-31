import type { Metadata } from "next";
import { Archive } from "lucide-react";
import { MessageBoard, type BoardSearchParams } from "@/components/app/message-board";

export const metadata: Metadata = { title: "Archive", robots: { index: false } };

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<BoardSearchParams>;
}) {
  const params = await searchParams;
  return (
    <MessageBoard
      view="archive"
      basePath="/archive"
      eyebrow="Put away"
      title="Archive"
      description="Out of your inbox, still in your vault. Nothing here is deleted."
      showFolders
      emptyIcon={<Archive />}
      emptyTitle="Archive is empty"
      emptyDescription="Archiving tidies a message out of the inbox without losing it. Everything you archive stays searchable forever."
      searchParams={params}
    />
  );
}
