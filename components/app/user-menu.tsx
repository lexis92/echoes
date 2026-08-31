"use client";

import Link from "next/link";
import { ExternalLink, LogOut, Settings, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { resetAnalytics } from "@/lib/analytics/provider";
import { profileUrl } from "@/lib/utils";

export function UserMenu({
  name,
  username,
  email,
  avatarUrl,
}: {
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-ink/[0.05]"
          aria-label="Account menu"
        >
          <Avatar src={avatarUrl} name={name} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{name}</span>
            <span className="block truncate font-mono text-[11px] text-faint">@{username}</span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={profileUrl(username)} target="_blank" rel="noreferrer">
            <ExternalLink />
            View my public page
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/setup?edit=1">
            <UserRound />
            Edit profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild tone="danger">
          <form action="/auth/signout" method="post" onSubmit={() => resetAnalytics()}>
            <button type="submit" className="flex w-full items-center gap-2.5">
              <LogOut />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
