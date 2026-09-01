import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { MessageBoard, type BoardSearchParams } from "@/components/app/message-board";

export const metadata: Metadata = { title: "Trash", robots: { index: false } };

export default async function TrashPage({
  searchParams,
}: {
  searchParams: Promise<BoardSearchParams>;
}) {
  const params = await searchParams;
  return (
    <MessageBoard
      view="trash"
      basePath="/trash"
      eyebrow="30 days to change your mind"
      title="Trash"
      description="Deleted messages wait here for 30 days before they go for good. You can put any of them back."
      emptyIcon={<Trash2 />}
      emptyTitle="Trash is empty"
      emptyDescription="Nothing in here. Deleted messages land in Trash first, so a mistap is never final."
      searchParams={params}
    />
  );
}
