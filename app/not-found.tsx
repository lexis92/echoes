import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main
      id="main"
      className="relative grain flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
    >
      <div className="pointer-events-none absolute inset-0 press-grid" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] ember-bloom" aria-hidden />

      <div className="relative w-full max-w-lg">
        <Logo className="mx-auto mb-14" />

        {/* An envelope that arrived at the wrong address. */}
        <div className="relative mx-auto mb-10 w-fit" aria-hidden>
          <div className="animate-drift rounded-2xl border border-ink/10 bg-surface px-10 py-8 shadow-card [transform:rotate(-4deg)]">
            <div className="space-y-2.5">
              <div className="h-2 w-28 rounded-full bg-ink/10" />
              <div className="h-2 w-40 rounded-full bg-ink/[0.07]" />
              <div className="h-2 w-20 rounded-full bg-ink/[0.07]" />
            </div>
            <div className="mt-6 inline-flex rotate-[8deg] items-center rounded border-2 border-danger/50 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-label text-danger/80">
              Return to sender
            </div>
          </div>
        </div>

        <p className="label text-ember">Error 404</p>
        <h1 className="mt-4 font-display text-4xl tracking-tightest text-ink sm:text-5xl">
          This page never arrived
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-quiet">
          The link might be mistyped, or the profile behind it may have been
          closed. Nothing in anyone&rsquo;s vault has been lost.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to Echoes
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <Search className="size-4" />
              Go to my vault
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
