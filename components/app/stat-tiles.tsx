import { Archive, Heart, Inbox, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import type { InboxCounts } from "@/lib/supabase/database.types";

/**
 * Five numbers, no charts. A vault is not a dashboard to optimise — these are
 * here to answer "is there anything new?" and nothing more.
 */
export function StatTiles({ counts, last30Days }: { counts: InboxCounts; last30Days: number }) {
  const tiles = [
    { href: "/inbox", label: "Kept", value: counts.total, Icon: Inbox, accent: "text-ink" },
    { href: "/inbox?unread=1", label: "Unread", value: counts.unread, Icon: Sparkles, accent: "text-ember" },
    { href: "/favorites", label: "Favourites", value: counts.favorites, Icon: Heart, accent: "text-ink" },
    { href: "/scheduled", label: "Locked", value: counts.scheduled, Icon: Lock, accent: "text-dusk" },
    { href: "/archive", label: "Archived", value: counts.archived, Icon: Archive, accent: "text-ink" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/[0.08] bg-ink/[0.07] sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(({ href, label, value, Icon, accent }) => (
        <Link
          key={label}
          href={href}
          className="group grain bg-surface p-4 transition-colors duration-200 hover:bg-raised sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="label text-faint">{label}</span>
            <Icon className="size-3.5 text-faint transition-colors group-hover:text-quiet" aria-hidden />
          </div>
          <p className={`mt-3 font-display text-3xl tabular-nums tracking-tightest ${accent}`}>
            {value.toLocaleString()}
          </p>
        </Link>
      ))}

      <div className="grain col-span-2 bg-surface p-4 sm:col-span-3 lg:col-span-5">
        <p className="text-sm text-quiet">
          <span className="font-display text-lg text-ink">{last30Days.toLocaleString()}</span>{" "}
          {last30Days === 1 ? "message arrived" : "messages arrived"} in the last 30 days.
        </p>
      </div>
    </div>
  );
}
