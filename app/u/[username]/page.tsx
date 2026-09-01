import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PauseCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicProfile } from "@/lib/supabase/database.types";
import { PublicProfileHeader } from "@/components/public/profile-header";
import { ComposeForm } from "@/components/public/compose-form";
import { PublicPageTracking } from "@/components/public/tracking";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

async function loadProfile(username: string): Promise<PublicProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_public_profile", { handle: username });
  if (error) {
    console.error("[public profile] lookup failed", error);
    return null;
  }
  return data?.[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username);

  if (!profile) return { title: "Not found", robots: { index: false, follow: false } };

  return {
    title: `Write to ${profile.name}`,
    description:
      profile.welcome_note ??
      `Write to ${profile.name} on Echoes. No account needed, and they keep it forever.`,
    // A share link belongs to the people it is given to, not to search engines.
    robots: { index: false, follow: false },
    openGraph: {
      title: `Write to ${profile.name}`,
      description: profile.welcome_note ?? `Write to ${profile.name}. No account needed.`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await loadProfile(username);

  if (!profile) notFound();

  return (
    <div className="relative grain min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[50vh] ember-bloom" aria-hidden />
      <div className="pointer-events-none absolute inset-0 press-grid" aria-hidden />

      <PublicPageTracking username={profile.username} />

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <main id="main" className="relative mx-auto w-full max-w-xl px-5 py-14 sm:px-6 sm:py-20">
        <PublicProfileHeader profile={profile} />

        <div className="mt-10 grain rounded-2xl border border-ink/[0.08] bg-surface p-5 shadow-lift sm:p-7">
          {profile.accepting_messages ? (
            <ComposeForm profile={profile} />
          ) : (
            <EmptyState
              icon={<PauseCircle />}
              title="Messages are paused"
              description={`${profile.name} has turned off new messages for now. The link will keep working, so try again another time.`}
              className="border-0 bg-transparent py-8"
            />
          )}
        </div>

        <footer className="mt-12 text-center">
          <p className="text-sm text-quiet">
            Want one of these?{" "}
            <Link
              href="/"
              className="font-medium text-ember underline-offset-4 hover:underline"
            >
              Echoes is free
            </Link>
            .
          </p>
          <p className="mt-2 text-xs text-faint">
            Messages are private to {profile.name.split(" ")[0]}. Nothing you write here is
            published anywhere.
          </p>
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link href="/signup">Create my own</Link>
          </Button>
        </footer>
      </main>
    </div>
  );
}
