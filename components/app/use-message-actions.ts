"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type { MessageRow } from "@/lib/supabase/database.types";

type Patch = Partial<Pick<MessageRow, "is_favorite" | "is_archived" | "is_read" | "folder_id">> & {
  restore?: boolean;
};

/**
 * Every message mutation in one place, with optimistic UI and a real undo.
 *
 * Undo matters here more than in most products: these are irreplaceable
 * messages, and an accidental tap on Delete should never feel final.
 */
export function useMessageActions(onLocalChange?: (id: string, patch: Patch) => void) {
  const router = useRouter();
  const [pending, setPending] = React.useState<Set<string>>(new Set());

  const mark = React.useCallback((id: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const patch = React.useCallback(
    async (id: string, body: Patch, options?: { silent?: boolean }) => {
      onLocalChange?.(id, body);
      mark(id, true);
      try {
        const res = await fetch(`/api/messages/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message ?? "That change didn't save.");
        }
        if (!options?.silent) router.refresh();
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        router.refresh();
        return false;
      } finally {
        mark(id, false);
      }
    },
    [mark, onLocalChange, router]
  );

  const toggleFavorite = React.useCallback(
    async (message: Pick<MessageRow, "id" | "is_favorite">) => {
      const next = !message.is_favorite;
      const okay = await patch(message.id, { is_favorite: next });
      if (okay) {
        track(ANALYTICS_EVENTS.messageFavorited, { on: next });
        toast.success(next ? "Added to Favourites" : "Removed from Favourites");
      }
    },
    [patch]
  );

  const toggleArchive = React.useCallback(
    async (message: Pick<MessageRow, "id" | "is_archived">) => {
      const next = !message.is_archived;
      const okay = await patch(message.id, { is_archived: next });
      if (okay) {
        track(ANALYTICS_EVENTS.messageArchived, { on: next });
        toast.success(next ? "Archived" : "Back in your inbox", {
          action: {
            label: "Undo",
            onClick: () => patch(message.id, { is_archived: !next }),
          },
        });
      }
    },
    [patch]
  );

  const moveToFolder = React.useCallback(
    async (id: string, folderId: string | null, folderName?: string) => {
      const okay = await patch(id, { folder_id: folderId });
      if (okay) {
        toast.success(folderId ? `Moved to ${folderName ?? "collection"}` : "Removed from collection");
      }
    },
    [patch]
  );

  /** Soft delete — recoverable from Trash for 30 days, with an instant undo. */
  const remove = React.useCallback(
    async (id: string) => {
      mark(id, true);
      try {
        const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Couldn't delete that message.");
        track(ANALYTICS_EVENTS.messageDeleted, { permanent: false });
        toast.success("Moved to Trash", {
          description: "You have 30 days to change your mind.",
          action: {
            label: "Undo",
            onClick: async () => {
              await patch(id, { restore: true }, { silent: true });
              track(ANALYTICS_EVENTS.messageRestored, {});
              toast.success("Restored");
              router.refresh();
            },
          },
        });
        router.refresh();
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        mark(id, false);
      }
    },
    [mark, patch, router]
  );

  const restore = React.useCallback(
    async (id: string) => {
      const okay = await patch(id, { restore: true });
      if (okay) {
        track(ANALYTICS_EVENTS.messageRestored, {});
        toast.success("Back in your inbox");
      }
    },
    [patch]
  );

  /** Irreversible. Only offered from Trash, always behind a confirmation. */
  const destroy = React.useCallback(
    async (id: string) => {
      mark(id, true);
      try {
        const res = await fetch(`/api/messages/${id}?permanent=1`, { method: "DELETE" });
        if (!res.ok) throw new Error("That message could not be deleted.");
        track(ANALYTICS_EVENTS.messageDeleted, { permanent: true });
        toast.success("Deleted");
        router.refresh();
        return true;
      } catch (error) {
        toast.error((error as Error).message);
        return false;
      } finally {
        mark(id, false);
      }
    },
    [mark, router]
  );

  return {
    isPending: (id: string) => pending.has(id),
    patch,
    toggleFavorite,
    toggleArchive,
    moveToFolder,
    remove,
    restore,
    destroy,
  };
}
