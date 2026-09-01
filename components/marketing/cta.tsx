import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimField } from "./claim-field";

export function FinalCTA({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative grain overflow-hidden border-t border-ink/[0.07] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full ember-bloom [transform:rotate(180deg)]" aria-hidden />

      <div className="container relative text-center">
        <div
          className="mx-auto mb-10 flex size-14 items-center justify-center rounded-full bg-ember text-white shadow-seal animate-ember-pulse"
          aria-hidden
        >
          <span className="font-display text-xl font-semibold">E</span>
        </div>

        <h2 className="mx-auto max-w-2xl text-balance font-display text-[2.25rem] leading-[1.06] tracking-tightest text-ink sm:text-5xl lg:text-[3.5rem]">
          Somebody has something to tell you.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-[1.0625rem] leading-relaxed text-quiet">
          Two minutes to set up. Free to use.
        </p>

        <div className="mx-auto mt-10 max-w-lg">
          {signedIn ? (
            <Button asChild size="lg">
              <Link href="/dashboard">
                Open my vault
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <ClaimField />
          )}
        </div>
      </div>
    </section>
  );
}
