import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { MessageBoard, type BoardSearchParams } from "@/components/app/message-board";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Favourites", robots: { index: false } };

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<BoardSearchParams>;
}) {
  const params = await searchParams;
  return (
    <MessageBoard
      view="favorites"
      basePath="/favorites"
      eyebrow="Kept close"
      title="Favourites"
      description="The ones you come back to."
      emptyIcon={<Heart />}
      emptyTitle="No favourites yet"
      emptyDescription="Tap the heart on any message and it shows up here. Handy on the days you need one."
      emptyAction={
        <Button asChild variant="outline">
          <Link href="/inbox">Go to inbox</Link>
        </Button>
      }
      searchParams={params}
    />
  );
}
