"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prettyProfileUrl } from "@/lib/utils";
import { cn } from "@/lib/cn";

/**
 * The hero's handle field. Availability is not checked here; the handle is
 * handed to signup, where the real check happens. Making someone clear an
 * availability check before they have an account is a needless wall.
 */
export function ClaimField({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const prefix = prettyProfileUrl("").replace(/\/$/, "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const handle = value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    router.push(handle ? `/signup?handle=${encodeURIComponent(handle)}` : "/signup");
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "group flex w-full items-center gap-2 rounded-full border border-ink/12 bg-surface p-1.5 pl-4 shadow-card transition-all duration-300 ease-paper focus-within:border-ember/60 focus-within:shadow-seal sm:pl-5",
        className
      )}
    >
      <label htmlFor="claim-handle" className="sr-only">
        Choose your Echoes handle
      </label>
      <span
        className="hidden shrink-0 select-none font-mono text-sm text-faint sm:inline"
        aria-hidden
      >
        {prefix}/
      </span>
      <input
        id="claim-handle"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\s/g, ""))}
        placeholder="yourname"
        maxLength={24}
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent py-2.5 font-mono text-[15px] text-ink outline-none placeholder:text-faint/70"
      />
      <Button type="submit" size="md" className="shrink-0">
        Claim it
        <ArrowRight className="size-4 transition-transform duration-300 group-focus-within:translate-x-0.5" />
      </Button>
    </form>
  );
}
