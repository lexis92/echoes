import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessage, getMessageNeighbours, listFolders, markRead } from "@/lib/data/messages";
import { getProfile } from "@/lib/supabase/server";
import { MessageDetail } from "@/components/app/message-detail";

export const metadata: Metadata = {
  title: "Message",
  robots: { index: false, follow: false },
};

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const message = await getMessage(id);

  // A sealed message is filtered out by RLS, so this is also the "not open
  // yet" path — deliberately indistinguishable from "does not exist".
  if (!message) notFound();

  const [profile, folders, neighbours] = await Promise.all([
    getProfile(),
    listFolders(),
    getMessageNeighbours(message),
  ]);

  if (!message.is_read) {
    await markRead(message.id);
  }

  return (
    <MessageDetail
      message={message}
      folders={folders}
      filterProfanity={profile?.profanity_filter ?? true}
      aiAvailable={Boolean(process.env.OPENAI_API_KEY)}
      neighbours={neighbours}
    />
  );
}
