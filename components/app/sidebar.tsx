"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/logo";
import { NAV_ITEMS } from "./nav-config";
import { ShareCard } from "./share-card";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { InboxCounts } from "@/lib/supabase/database.types";
import { cn } from "@/lib/cn";

type Props = {
  counts: InboxCounts;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop rail. Hidden below `lg`, where the tab bar takes over. */
export function Sidebar({ counts, name, username, email, avatarUrl }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[16.5rem] flex-col border-r border-ink/[0.07] bg-raised/60 lg:flex">
      <div className="px-5 py-6">
        <Logo />
      </div>

      <nav aria-label="Vault" className="flex-1 overflow-y-auto px-3">
        <Link
          href="/dashboard"
          className={cn(
            "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
            isActive(pathname, "/dashboard")
              ? "bg-ink/[0.07] font-medium text-ink"
              : "text-quiet hover:bg-ink/[0.04] hover:text-ink"
          )}
          aria-current={isActive(pathname, "/dashboard") ? "page" : undefined}
        >
          <LayoutDashboard className="size-4 text-faint" aria-hidden />
          Overview
        </Link>

        <div className="my-3 h-px bg-ink/[0.07]" />

        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, Icon, countKey }) => {
            const active = isActive(pathname, href);
            const count = countKey ? counts[countKey] : undefined;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-ink/[0.07] font-medium text-ink"
                      : "text-quiet hover:bg-ink/[0.04] hover:text-ink"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "size-4 transition-colors",
                        active ? "text-ember" : "text-faint group-hover:text-quiet"
                      )}
                      aria-hidden
                    />
                    {label}
                  </span>
                  {typeof count === "number" && count > 0 && (
                    <span
                      className={cn(
                        "font-mono text-[11px] tabular-nums",
                        href === "/inbox" && counts.unread > 0
                          ? "rounded-full bg-ember px-1.5 py-0.5 text-white"
                          : "text-faint"
                      )}
                    >
                      {href === "/inbox" && counts.unread > 0 ? counts.unread : count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-ink/[0.07] p-3">
        <ShareCard username={username} name={name} compact />
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <UserMenu name={name} username={username} email={email} avatarUrl={avatarUrl} />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

/** Mobile bottom tab bar — thumb-reachable, four destinations plus overview. */
export function TabBar({ counts }: { counts: InboxCounts }) {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "Home", Icon: LayoutDashboard, countKey: undefined },
    ...NAV_ITEMS.filter((i) => i.primary),
    NAV_ITEMS[NAV_ITEMS.length - 1]!, // Settings
  ];

  return (
    <nav
      aria-label="Vault"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/[0.07] bg-paper/90 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const count =
            "countKey" in item && item.countKey
              ? counts[item.countKey as keyof InboxCounts]
              : undefined;
          const showBadge =
            item.href === "/inbox" ? counts.unread > 0 : Boolean(count && count > 0 && active);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-ink" : "text-faint"
                )}
              >
                <span className="relative">
                  <item.Icon
                    className={cn("size-5", active && "text-ember")}
                    aria-hidden
                  />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1 min-w-[1rem] rounded-full bg-ember px-1 text-center font-mono text-[9px] leading-4 text-white">
                      {item.href === "/inbox" ? counts.unread : count}
                    </span>
                  )}
                </span>
                {"shortLabel" in item ? item.shortLabel : item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
