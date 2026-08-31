import * as React from "react";
import { listFolders, listMessages, type MessageView } from "@/lib/data/messages";
import { getProfile } from "@/lib/supabase/server";
import { FilterBar, MessageList, Pagination } from "./message-list";
import { SearchField } from "./app-header";
import { PageHeader } from "./page-header";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE = 24;

export type BoardSearchParams = {
  q?: string;
  unread?: string;
  media?: string;
  folder?: string;
  sort?: string;
  page?: string;
};

/**
 * Inbox, Favourites, Archive and Trash are the same board with different
 * filters and different words around it. Keeping them one component means the
 * search, filter and pagination behaviour cannot drift between them.
 */
export async function MessageBoard({
  view,
  basePath,
  eyebrow,
  title,
  description,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  showFolders = false,
  searchParams,
}: {
  view: MessageView;
  basePath: string;
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: React.ReactNode;
  emptyAction?: React.ReactNode;
  showFolders?: boolean;
  searchParams: BoardSearchParams;
}) {
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const search = searchParams.q?.trim();

  const [profile, folders, result] = await Promise.all([
    getProfile(),
    listFolders(),
    listMessages({
      view,
      search,
      folderId: searchParams.folder,
      unreadOnly: searchParams.unread === "1",
      withMedia: searchParams.media === "1",
      sort: searchParams.sort === "oldest" ? "oldest" : "newest",
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
  ]);

  const isFiltered =
    Boolean(search) ||
    searchParams.unread === "1" ||
    searchParams.media === "1" ||
    Boolean(searchParams.folder);

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <React.Suspense fallback={<div className="mb-5 h-11" />}>
        <SearchField basePath={basePath} className="mb-4" />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <FilterBar showFolders={showFolders} folders={folders} total={result.total} />
      </React.Suspense>

      {result.messages.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={emptyIcon}
            title="Nothing matches that"
            description={
              search
                ? `No message contains “${search}”. Try a different word, or clear the filters.`
                : "No message matches those filters. Try clearing one."
            }
          />
        ) : (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )
      ) : (
        <>
          <MessageList
            messages={result.messages}
            folders={folders}
            filterProfanity={profile?.profanity_filter ?? true}
            grouped={view === "inbox" && !search}
          />
          <React.Suspense fallback={null}>
            <Pagination page={page} hasMore={result.hasMore} basePath={basePath} />
          </React.Suspense>
        </>
      )}
    </>
  );
}
