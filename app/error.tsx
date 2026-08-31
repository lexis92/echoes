"use client";

import * as React from "react";
import Link from "next/link";
import { Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[echoes] unhandled error", error);
  }, [error]);

  return (
    <main
      id="main"
      className="relative grain flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[50vh] ember-bloom" aria-hidden />
      <div className="relative w-full max-w-md">
        <Logo className="mx-auto mb-12" />
        <p className="label text-ember">Something broke</p>
        <h1 className="mt-4 font-display text-4xl tracking-tightest text-ink">
          The ink smudged
        </h1>
        <p className="mt-4 text-pretty leading-relaxed text-quiet">
          An unexpected error stopped this page from loading. Your messages are
          safe — this is a display problem, not a storage one.
        </p>
        {error.digest && (
          <p className="mt-5 font-mono text-xs text-faint">Reference: {error.digest}</p>
        )}
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            <RotateCw className="size-4" />
            Try again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="size-4" />
              Back to Echoes
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
