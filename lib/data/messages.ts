import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { FolderRow, InboxCounts, MessageRow, SealedMessage } from "@/lib/supabase/database.types";

export type MessageView = "inbox" | "favorites" | "archive" | "trash";

export type MessageQuery = {
  view: MessageView;
  search?: string;
  folderId?: string;
  unreadOnly?: boolean;
  withMedia?: boolean;
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
};

export type MessageListResult = {
  messages: MessageRow[];
  total: number;
  hasMore: boolean;
};

const DEFAULT_LIMIT = 24;

/**
 * One query powers Inbox, Favourites, Archive and Trash. RLS already scopes
 * every row to the signed-in recipient and hides sealed messages, so the
 * filters here are about presentation, not permission.
 */
export async function listMessages(query: MessageQuery): Promise<MessageListResult> {
  const supabase = await createClient();
  const limit = query.limit ?? DEFAULT_LIMIT;
  const offset = query.offset ?? 0;

  let builder = supabase.from("messages").select("*", { count: "exact" });

  switch (query.view) {
    case "inbox":
      builder = builder.is("deleted_at", null).eq("is_archived", false);
      break;
    case "favorites":
      builder = builder.is("deleted_at", null).eq("is_favorite", true);
      break;
    case "archive":
      builder = builder.is("deleted_at", null).eq("is_archived", true);
      break;
    case "trash":
      builder = builder.not("deleted_at", "is", null);
      break;
  }

  if (query.folderId) builder = builder.eq("folder_id", query.folderId);
  if (query.unreadOnly) builder = builder.eq("is_read", false);
  if (query.withMedia) {
    builder = builder.or("image_path.not.is.null,voice_path.not.is.null");
  }

  const term = query.search?.trim();
  if (term) {
    // websearch_to_tsquery handles quotes and OR the way a person expects,
    // and falls back gracefully on a single word.
    builder = builder.textSearch("search_tsv", term, {
      type: "websearch",
      config: "english",
    });
  }

  const { data, count, error } = await builder
    .order("created_at", { ascending: query.sort === "oldest" })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[messages] list failed", error);
    return { messages: [], total: 0, hasMore: false };
  }

  const total = count ?? 0;
  return {
    messages: data ?? [],
    total,
    hasMore: offset + (data?.length ?? 0) < total,
  };
}

export async function getMessage(id: string): Promise<MessageRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("messages").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

/** The next and previous message in the inbox, for keyboard-friendly reading. */
export async function getMessageNeighbours(message: MessageRow) {
  const supabase = await createClient();

  const [{ data: newer }, { data: older }] = await Promise.all([
    supabase
      .from("messages")
      .select("id")
      .is("deleted_at", null)
      .gt("created_at", message.created_at)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id")
      .is("deleted_at", null)
      .lt("created_at", message.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return { newerId: newer?.id ?? null, olderId: older?.id ?? null };
}

export async function getInboxCounts(): Promise<InboxCounts> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inbox_counts");

  if (error || !data) {
    return { inbox: 0, unread: 0, favorites: 0, archived: 0, scheduled: 0, trash: 0, total: 0 };
  }
  return data as InboxCounts;
}

export async function getSealedMessages(): Promise<SealedMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sealed_messages");
  if (error) {
    console.error("[messages] sealed lookup failed", error);
    return [];
  }
  return (data ?? []) as SealedMessage[];
}

export async function listFolders(): Promise<FolderRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("folders")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Marks a message read on open. Deliberately fire-and-forget. */
export async function markRead(id: string) {
  const supabase = await createClient();
  await supabase.from("messages").update({ is_read: true }).eq("id", id).eq("is_read", false);
}

/** Small stats block for the dashboard. */
export async function getVaultStats() {
  const supabase = await createClient();
  const [counts, { data: recent }, { data: firstMessage }] = await Promise.all([
    getInboxCounts(),
    supabase
      .from("messages")
      .select("created_at")
      .is("deleted_at", null)
      .gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString()),
    supabase
      .from("messages")
      .select("created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    counts,
    last30Days: recent?.length ?? 0,
    firstMessageAt: firstMessage?.created_at ?? null,
  };
}
