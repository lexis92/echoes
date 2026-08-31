import { Archive, Heart, Inbox, Lock, Settings, Trash2 } from "lucide-react";
import type { InboxCounts } from "@/lib/supabase/database.types";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  Icon: typeof Inbox;
  countKey?: keyof InboxCounts;
  /** Shown in the mobile tab bar. */
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/inbox", label: "Inbox", shortLabel: "Inbox", Icon: Inbox, countKey: "inbox", primary: true },
  { href: "/favorites", label: "Favourites", shortLabel: "Loved", Icon: Heart, countKey: "favorites", primary: true },
  { href: "/scheduled", label: "Sealed", shortLabel: "Sealed", Icon: Lock, countKey: "scheduled", primary: true },
  { href: "/archive", label: "Archive", shortLabel: "Archive", Icon: Archive, countKey: "archived" },
  { href: "/trash", label: "Trash", shortLabel: "Trash", Icon: Trash2, countKey: "trash" },
  { href: "/settings", label: "Settings", shortLabel: "Settings", Icon: Settings },
];
