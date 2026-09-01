"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Share2, X } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/cn";

/**
 * Search lives in the header on every list screen. It writes to the URL so a
 * search is shareable, bookmarkable and survives a refresh.
 */
export function SearchField({
  basePath,
  className,
  autoFocus,
}: {
  basePath: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [value, setValue] = React.useState(initial);

  React.useEffect(() => setValue(initial), [initial]);

  React.useEffect(() => {
    if (value === initial) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) {
        next.set("q", value.trim());
        track(ANALYTICS_EVENTS.searchPerformed, { length: value.trim().length });
      } else {
        next.delete("q");
      }
      next.delete("page");
      router.replace(`${basePath}${next.toString() ? `?${next}` : ""}`, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
    // `params` identity changes on every render; the URL string is the real dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, initial, basePath, router]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search messages…"
        aria-label="Search messages"
        className="h-11 w-full rounded-full border border-ink/12 bg-surface pl-10 pr-10 text-[15px] text-ink shadow-inset transition-colors placeholder:text-faint hover:border-ink/22 focus:border-ember focus:outline-none focus:ring-4 focus:ring-ember/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-faint transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/** Mobile top bar. Desktop uses the sidebar instead. */
export function MobileHeader({
  name,
  avatarUrl,
  shareUrl,
}: {
  name: string;
  avatarUrl: string | null;
  shareUrl: string;
}) {
  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Write to me on Echoes", url: shareUrl });
        track(ANALYTICS_EVENTS.profileLinkShared, { method: "web_share" });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard?.writeText(shareUrl);
      track(ANALYTICS_EVENTS.profileLinkCopied, { surface: "mobile_header" });
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/[0.07] bg-paper/90 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="Echoes home">
          <LogoMark className="size-6" />
          <span className="font-display text-lg tracking-tightest">Echoes</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Button size="icon-sm" variant="quiet" onClick={share} aria-label="Share my link">
            <Share2 />
          </Button>
          <Link href="/settings" aria-label="Settings">
            <Avatar src={avatarUrl} name={name} size="xs" />
          </Link>
        </div>
      </div>
    </header>
  );
}
