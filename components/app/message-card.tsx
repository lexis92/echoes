"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  FolderInput,
  Heart,
  ImageIcon,
  MicVocal,
  MoreHorizontal,
  ShieldAlert,
  Trash2,
  Undo2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import type { FolderRow, MessageRow } from "@/lib/supabase/database.types";
import { excerpt, hashIndex, timeAgo } from "@/lib/utils";
import { maskProfanity } from "@/lib/security/profanity";
import { cn } from "@/lib/cn";
import { useMessageActions } from "./use-message-actions";

/** A hint of hand-placement — every card sits a fraction off square. */
const TILTS = ["-0.55deg", "0.4deg", "-0.25deg", "0.65deg"];

export function MessageCard({
  message,
  folders,
  filterProfanity,
  index = 0,
}: {
  message: MessageRow;
  folders: FolderRow[];
  filterProfanity: boolean;
  index?: number;
}) {
  const actions = useMessageActions();
  const [confirmingDestroy, setConfirmingDestroy] = React.useState(false);
  const inTrash = Boolean(message.deleted_at);
  const held = message.moderation_status === "held";

  const preview = React.useMemo(() => {
    const text = excerpt(message.content, 240);
    return filterProfanity ? maskProfanity(text) : text;
  }, [message.content, filterProfanity]);

  const tilt = TILTS[hashIndex(message.id, TILTS.length)]!;
  const folder = folders.find((f) => f.id === message.folder_id);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.24), ease: [0.22, 1, 0.36, 1] }}
      style={{ rotate: tilt }}
      className={cn(
        "group relative grain rounded-xl border bg-surface p-4 shadow-card transition-all duration-300 ease-paper hover:rotate-0 hover:shadow-lift sm:p-5",
        held ? "border-danger/25" : "border-ink/[0.08]",
        actions.isPending(message.id) && "opacity-60",
        inTrash && "opacity-75"
      )}
    >
      {/* Unread marker, in the margin like a pencil tick. */}
      {!message.is_read && !inTrash && (
        <span
          className="absolute -left-1 top-6 size-2 rounded-full bg-ember shadow-seal"
          aria-label="Unread"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={message.sender_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {message.sender_name ?? (
                <span className="italic text-quiet">Someone anonymous</span>
              )}
            </p>
            <p className="font-mono text-[11px] text-faint">
              <time dateTime={message.created_at}>{timeAgo(message.created_at)}</time>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {!inTrash && (
            <Tooltip content={message.is_favorite ? "Remove from Favourites" : "Add to Favourites"}>
              <button
                type="button"
                onClick={() => actions.toggleFavorite(message)}
                aria-pressed={message.is_favorite}
                aria-label={message.is_favorite ? "Remove from Favourites" : "Add to Favourites"}
                className={cn(
                  "rounded-full p-2 transition-all duration-300 ease-seal hover:bg-ink/[0.06] active:scale-90",
                  message.is_favorite ? "text-ember" : "text-faint hover:text-ink"
                )}
              >
                <Heart className={cn("size-4", message.is_favorite && "fill-current")} />
              </button>
            </Tooltip>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className="rounded-full p-2 text-faint transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {inTrash ? (
                <>
                  <DropdownMenuItem onSelect={() => actions.restore(message.id)}>
                    <Undo2 />
                    Put back
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    tone="danger"
                    onSelect={(e) => {
                      e.preventDefault();
                      if (confirmingDestroy) {
                        actions.destroy(message.id);
                      } else {
                        setConfirmingDestroy(true);
                        setTimeout(() => setConfirmingDestroy(false), 4000);
                      }
                    }}
                  >
                    <Trash2 />
                    {confirmingDestroy ? "Really delete forever?" : "Delete forever"}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onSelect={() => actions.toggleArchive(message)}>
                    {message.is_archived ? <ArchiveRestore /> : <Archive />}
                    {message.is_archived ? "Move to inbox" : "Archive"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => actions.patch(message.id, { is_read: !message.is_read })}
                  >
                    <span className="flex size-4 items-center justify-center">
                      <span className="size-2 rounded-full bg-current" />
                    </span>
                    Mark as {message.is_read ? "unread" : "read"}
                  </DropdownMenuItem>

                  {folders.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Move to</DropdownMenuLabel>
                      {folders.map((f) => (
                        <DropdownMenuItem
                          key={f.id}
                          disabled={f.id === message.folder_id}
                          onSelect={() => actions.moveToFolder(message.id, f.id, f.name)}
                        >
                          <FolderInput />
                          {f.name}
                        </DropdownMenuItem>
                      ))}
                      {message.folder_id && (
                        <DropdownMenuItem onSelect={() => actions.moveToFolder(message.id, null)}>
                          <FolderInput />
                          Remove from collection
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem tone="danger" onSelect={() => actions.remove(message.id)}>
                    <Trash2 />
                    Move to Trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Link
        href={`/messages/${message.id}`}
        className="mt-3.5 block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ember/40"
      >
        <p
          className={cn(
            "font-display text-[1.0625rem] leading-relaxed text-ink",
            !message.is_read && "font-medium"
          )}
        >
          {preview}
        </p>
      </Link>

      {(message.image_path ||
        message.voice_path ||
        folder ||
        held ||
        message.ai_tone) && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {held && (
            <Badge tone="danger">
              <ShieldAlert />
              Held for review
            </Badge>
          )}
          {message.image_path && (
            <Badge>
              <ImageIcon />
              Photo
            </Badge>
          )}
          {message.voice_path && (
            <Badge>
              <MicVocal />
              Voice note
            </Badge>
          )}
          {folder && <Badge tone="dusk">{folder.name}</Badge>}
          {message.ai_tone && <Badge tone="sage">{message.ai_tone}</Badge>}
        </div>
      )}
    </motion.article>
  );
}
