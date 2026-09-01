import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { SentCelebration } from "@/components/public/sent-celebration";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sent",
  robots: { index: false, follow: false },
};

export default async function SentPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ sealed?: string; from?: string }>;
}) {
  const { username } = await params;
  const { sealed, from } = await searchParams;

  const supabase = createAdminClient();
  const { data } = await supabase.rpc("get_public_profile", { handle: username });
  const profile = data?.[0];
  if (!profile) notFound();

  const firstName = profile.name.split(" ")[0] || profile.name;
  const sealedDate = sealed ? new Date(sealed) : null;
  const validSeal = sealedDate && !Number.isNaN(sealedDate.getTime()) ? sealedDate : null;

  return (
    <div className="relative grain flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] ember-bloom" aria-hidden />
      <div className="pointer-events-none absolute inset-0 press-grid" aria-hidden />

      <main
        id="main"
        className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center"
      >
        <SentCelebration sealed={Boolean(validSeal)} />

        <h1 className="mt-9 font-display text-[2.25rem] leading-[1.06] tracking-tightest text-ink sm:text-[2.75rem]">
          {validSeal ? "Locked and delivered." : "Sent."}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-pretty text-[1.0625rem] leading-relaxed text-quiet">
          {validSeal ? (
            <>
              {firstName} knows something is waiting, but can&rsquo;t read it
              until{" "}
              <strong className="font-medium text-ink">
                {format(validSeal, "EEEE d MMMM yyyy")}
              </strong>
              .
            </>
          ) : (
            <>
              {firstName} has it. It&rsquo;s in their vault now, for as long as
              they want to keep it.
              {from ? ` They&rsquo;ll see it came from ${from}.` : " You sent it anonymously."}
            </>
          )}
        </p>

        <div className="mt-10 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/u/${profile.username}`}>Write another</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signup">Get my own link</Link>
          </Button>
        </div>

        <p className="mt-10 max-w-sm text-pretty text-xs leading-relaxed text-faint">
          There&rsquo;s no copy of this in your browser and no account tied to
          it. If you want to say something else, you&rsquo;ll need to write it
          again.
        </p>
      </main>
    </div>
  );
}
