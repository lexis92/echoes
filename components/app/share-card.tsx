"use client";

import * as React from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/ui/copy-field";
import { track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { prettyProfileUrl, profileUrl } from "@/lib/utils";
import { cn } from "@/lib/cn";

/**
 * The single most important control in the product: a vault with no shared
 * link never fills up. It appears on the dashboard and in the sidebar.
 */
export function ShareCard({
  username,
  name,
  compact = false,
  className,
}: {
  username: string;
  name: string;
  compact?: boolean;
  className?: string;
}) {
  const url = profileUrl(username);
  const pretty = prettyProfileUrl(username);
  const [canShare, setCanShare] = React.useState(false);

  React.useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function share() {
    try {
      await navigator.share({
        title: `Write to ${name} on Echoes`,
        text: "Leave me a message. You don't need an account.",
        url,
      });
      track(ANALYTICS_EVENTS.profileLinkShared, { method: "web_share" });
    } catch (error) {
      // AbortError just means they closed the sheet.
      if ((error as Error)?.name !== "AbortError") {
        toast.error("Couldn't open the share sheet. Copy the link instead.");
      }
    }
  }

  if (compact) {
    return (
      <div className={cn("rounded-xl border border-ink/[0.08] bg-raised p-3", className)}>
        <p className="label mb-2 text-faint">Your link</p>
        <p className="truncate font-mono text-xs text-ink" title={pretty}>
          {pretty}
        </p>
        <div className="mt-2.5 flex gap-1.5">
          <Button
            size="sm"
            variant="quiet"
            className="flex-1"
            onClick={() => {
              navigator.clipboard?.writeText(url);
              toast.success("Link copied");
              track(ANALYTICS_EVENTS.profileLinkCopied, { surface: "sidebar" });
            }}
          >
            Copy
          </Button>
          {canShare && (
            <Button size="icon-sm" variant="quiet" onClick={share} aria-label="Share link">
              <Share2 />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative grain overflow-hidden rounded-2xl border border-ink/[0.08] bg-surface p-6 shadow-card sm:p-7",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 ember-bloom opacity-70" aria-hidden />
      <div className="relative">
        <p className="label text-ember">Your link</p>
        <h2 className="mt-3 font-display text-2xl tracking-tightest text-ink">
          Your link
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-quiet">
          Anyone who opens this can write to you. They won&rsquo;t be asked to
          make an account.
        </p>

        <CopyField
          value={url}
          className="mt-5"
          onCopied={() => track(ANALYTICS_EVENTS.profileLinkCopied, { surface: "dashboard" })}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {canShare && (
            <Button variant="outline" size="sm" onClick={share}>
              <Share2 className="size-4" />
              Share
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <a href={url} target="_blank" rel="noreferrer">
              See my page
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
