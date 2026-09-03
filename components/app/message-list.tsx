"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowDownUp, Check, Filter, Paperclip, Mail } from "lucide-react";
import { MessageCard } from "./message-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import type { FolderRow, MessageRow } from "@/lib/supabase/database.types";
import { dayLabel, pluralize } from "@/lib/utils";
import { cn } from "@/lib/cn";

function groupByDay(messages: MessageRow[]) {
  const groups: { label: string; items: MessageRow[] }[] = [];
  for (const message of messages) {
    const label = dayLabel(message.created_at);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(message);
    else groups.push({ label, items: [message] });
  }
  return groups;
}

export function FilterBar({
  showFolders,
  folders,
  total,
}: {
  showFolders?: boolean;
  folders: FolderRow[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const unreadOnly = params.get("unread") === "1";
  const withMedia = params.get("media") === "1";
  const sort = params.get("sort") === "oldest" ? "oldest" : "newest";
  const folderId = params.get("folder");
  const activeFolder = folders.find((f) => f.id === folderId);
  const filterCount = [unreadOnly, withMedia, Boolean(folderId)].filter(Boolean).length;

  const update = React.useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
    },
    [params, pathname, router]
  );

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={filterCount ? "quiet" : "outline"} size="sm">
            <Filter className="size-4" />
            Filter
            {filterCount > 0 && (
              <span className="ml-0.5 rounded-full bg-ember px-1.5 font-mono text-[10px] text-white">
                {filterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onSelect={() => update("unread", unreadOnly ? null : "1")}>
            <Mail />
            Unread only
            {unreadOnly && <Check className="ml-auto size-4 text-ember" />}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => update("media", withMedia ? null : "1")}>
            <Paperclip />
            With a photo or voice
            {withMedia && <Check className="ml-auto size-4 text-ember" />}
          </DropdownMenuItem>

          {showFolders && folders.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Collections</DropdownMenuLabel>
              {folders.map((f) => (
                <DropdownMenuItem
                  key={f.id}
                  onSelect={() => update("folder", folderId === f.id ? null : f.id)}
                >
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      f.color === "ember" && "bg-ember",
                      f.color === "dusk" && "bg-dusk",
                      f.color === "sage" && "bg-sage",
                      f.color === "neutral" && "bg-ink/30"
                    )}
                  />
                  {f.name}
                  {folderId === f.id && <Check className="ml-auto size-4 text-ember" />}
                </DropdownMenuItem>
              ))}
            </>
          )}

          {filterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  const next = new URLSearchParams(params.toString());
                  ["unread", "media", "folder", "page"].forEach((k) => next.delete(k));
                  router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, {
                    scroll: false,
                  });
                }}
              >
                Clear filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={() => update("sort", sort === "newest" ? "oldest" : null)}
      >
        <ArrowDownUp className="size-4" />
        {sort === "newest" ? "Newest first" : "Oldest first"}
      </Button>

      {activeFolder && (
        <Button variant="quiet" size="sm" onClick={() => update("folder", null)}>
          {activeFolder.name} ×
        </Button>
      )}

      <span className="ml-auto font-mono text-xs text-faint">
        {pluralize(total, "message")}
      </span>
    </div>
  );
}

export function MessageList({
  messages,
  folders,
  filterProfanity,
  grouped = true,
}: {
  messages: MessageRow[];
  folders: FolderRow[];
  filterProfanity: boolean;
  grouped?: boolean;
}) {
  if (!grouped) {
    return (
      <div className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((m, i) => (
            <MessageCard
              key={m.id}
              message={m}
              folders={folders}
              filterProfanity={filterProfanity}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  const groups = groupByDay(messages);
  // Each group's first card continues the numbering from the groups above it.
  // Derived up front rather than by mutating a counter mid-render, which is not
  // safe once React is free to re-render parts of a tree independently.
  const groupOffsets: number[] = [];
  groups.reduce((offset, group) => {
    groupOffsets.push(offset);
    return offset + group.items.length;
  }, 0);

  return (
    <div className="space-y-8">
      {groups.map((group, groupIndex) => (
        <section key={group.label} aria-label={group.label}>
          <h2 className="label sticky top-16 z-10 mb-3 w-fit rounded-full bg-paper/90 px-3 py-1.5 text-faint backdrop-blur lg:top-0">
            {group.label}
          </h2>
          <div className="space-y-3">
            <AnimatePresence initial={false} mode="popLayout">
              {group.items.map((m, itemIndex) => (
                <MessageCard
                  key={m.id}
                  message={m}
                  folders={folders}
                  filterProfanity={filterProfanity}
                  index={groupOffsets[groupIndex] + itemIndex}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  hasMore,
  basePath,
}: {
  page: number;
  hasMore: boolean;
  basePath: string;
}) {
  const params = useSearchParams();

  function href(target: number) {
    const next = new URLSearchParams(params.toString());
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    return `${basePath}${next.toString() ? `?${next}` : ""}`;
  }

  if (page <= 1 && !hasMore) return null;

  return (
    <nav className="mt-10 flex items-center justify-between gap-3" aria-label="Pagination">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page - 1)}>← Newer</Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="font-mono text-xs text-faint">Page {page}</span>
      {hasMore ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page + 1)}>Older →</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
