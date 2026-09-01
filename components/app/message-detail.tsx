"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import type { FolderRow, MessageRow } from "@/lib/supabase/database.types";
import { fullDate, timeAgo } from "@/lib/utils";
import { maskProfanity } from "@/lib/security/profanity";
import { track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/cn";
import { useMessageActions } from "./use-message-actions";
import { MessageImage, VoiceNote } from "./media-attachments";

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "abuse", label: "Abuse or threats" },
  { value: "explicit", label: "Sexually explicit content" },
  { value: "spam", label: "Spam or advertising" },
  { value: "other", label: "Something else" },
] as const;

export function MessageDetail({
  message,
  folders,
  filterProfanity,
  aiAvailable,
  neighbours,
}: {
  message: MessageRow;
  folders: FolderRow[];
  filterProfanity: boolean;
  aiAvailable: boolean;
  neighbours: { newerId: string | null; olderId: string | null };
}) {
  const router = useRouter();
  const actions = useMessageActions();
  const [favorite, setFavorite] = React.useState(message.is_favorite);
  const [archived, setArchived] = React.useState(message.is_archived);
  const [summary, setSummary] = React.useState(message.ai_summary);
  const [tone, setTone] = React.useState(message.ai_tone);
  const [summarising, setSummarising] = React.useState(false);
  const [showRaw, setShowRaw] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const masked = filterProfanity && !showRaw;
  const body = masked ? maskProfanity(message.content) : message.content;
  const inTrash = Boolean(message.deleted_at);

  React.useEffect(() => {
    track(ANALYTICS_EVENTS.messageOpened, {
      message_id: message.id,
      has_image: Boolean(message.image_path),
      has_voice: Boolean(message.voice_path),
      was_sealed: Boolean(message.unlock_at),
    });
  }, [message.id, message.image_path, message.voice_path, message.unlock_at]);

  // Left/right move through the vault, like flipping through a box of letters.
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft" && neighbours.newerId) {
        router.push(`/messages/${neighbours.newerId}`);
      }
      if (event.key === "ArrowRight" && neighbours.olderId) {
        router.push(`/messages/${neighbours.olderId}`);
      }
      if (event.key === "Escape") router.push("/inbox");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [neighbours, router]);

  async function summarise() {
    setSummarising(true);
    try {
      const res = await fetch(`/api/messages/${message.id}/summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "That did not work.");
      setSummary(data.summary);
      setTone(data.tone);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSummarising(false);
    }
  }

  return (
    <article className="mx-auto max-w-2xl">
      {/* --- Top bar --- */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={inTrash ? "/trash" : archived ? "/archive" : "/inbox"}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          <Tooltip content="Newer message (←)">
            <span>
              <Button
                asChild={Boolean(neighbours.newerId)}
                variant="ghost"
                size="icon-sm"
                disabled={!neighbours.newerId}
                aria-label="Newer message"
              >
                {neighbours.newerId ? (
                  <Link href={`/messages/${neighbours.newerId}`}>
                    <ChevronLeft />
                  </Link>
                ) : (
                  <ChevronLeft />
                )}
              </Button>
            </span>
          </Tooltip>
          <Tooltip content="Older message (→)">
            <span>
              <Button
                asChild={Boolean(neighbours.olderId)}
                variant="ghost"
                size="icon-sm"
                disabled={!neighbours.olderId}
                aria-label="Older message"
              >
                {neighbours.olderId ? (
                  <Link href={`/messages/${neighbours.olderId}`}>
                    <ChevronRight />
                  </Link>
                ) : (
                  <ChevronRight />
                )}
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>

      {/* --- The letter --- */}
      <motion.div
        initial={{ opacity: 0, rotateX: -10, y: 12 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformPerspective: 1200, transformOrigin: "top center" }}
        className="relative grain overflow-hidden rounded-2xl border border-ink/[0.08] bg-surface shadow-lift"
      >
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/[0.07] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3.5">
            <Avatar name={message.sender_name} size="md" seal={Boolean(message.sender_name)} />
            <div>
              <p className="font-display text-lg tracking-tightest text-ink">
                {message.sender_name ?? <span className="italic text-quiet">Someone anonymous</span>}
              </p>
              <p className="font-mono text-xs text-faint">
                <time dateTime={message.created_at} title={fullDate(message.created_at)}>
                  {timeAgo(message.created_at)}
                </time>
                {message.unlock_at && " · was locked"}
              </p>
            </div>
          </div>

          {!inTrash && (
            <button
              type="button"
              onClick={() => {
                setFavorite((f) => !f);
                actions.toggleFavorite({ id: message.id, is_favorite: favorite });
              }}
              aria-pressed={favorite}
              aria-label={favorite ? "Remove from Favourites" : "Add to Favourites"}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-all duration-300 ease-seal active:scale-95",
                favorite
                  ? "border-ember/30 bg-ember-soft text-ember-ink"
                  : "border-ink/12 text-quiet hover:border-ink/25 hover:text-ink"
              )}
            >
              <Heart className={cn("size-4", favorite && "fill-current")} />
              {favorite ? "Favourited" : "Favourite"}
            </button>
          )}
        </header>

        <div className="ruled px-6 py-8 sm:px-8 sm:py-10">
          <p className="whitespace-pre-wrap font-display text-[1.1875rem] leading-[2rem] tracking-[-0.01em] text-ink">
            {body}
          </p>

          {filterProfanity && masked && maskProfanity(message.content) !== message.content && (
            <button
              type="button"
              onClick={() => setShowRaw(true)}
              className="mt-5 text-sm text-ember underline-offset-4 hover:underline"
            >
              Show the original wording
            </button>
          )}

          {(message.image_path || message.voice_path) && (
            <div className="mt-8 space-y-4">
              {message.voice_path && (
                <VoiceNote
                  messageId={message.id}
                  durationSeconds={message.voice_duration_seconds}
                />
              )}
              {message.image_path && <MessageImage messageId={message.id} />}
            </div>
          )}

          {/* --- AI summary, always opt-in --- */}
          {aiAvailable && (
            <div className="mt-8 border-t border-ink/[0.07] pt-6">
              {summary ? (
                <div className="rounded-xl bg-sage-soft/60 p-4">
                  <p className="label mb-2 flex items-center gap-1.5 text-sage">
                    <Sparkles className="size-3" />
                    In short {tone && `· ${tone}`}
                  </p>
                  <p className="text-[15px] leading-relaxed text-ink">{summary}</p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" onClick={summarise} loading={summarising}>
                    <Sparkles className="size-4" />
                    Summarise this
                  </Button>
                  <p className="text-xs text-faint">
                    Sends this message to OpenAI once, only when you ask.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-ink/[0.07] bg-raised/60 px-6 py-4 sm:px-8">
          {inTrash ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await actions.restore(message.id);
                  router.push("/inbox");
                }}
              >
                <Undo2 className="size-4" />
                Put back
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  const okay = await actions.destroy(message.id);
                  if (okay) router.push("/trash");
                }}
              >
                <Trash2 className="size-4" />
                Delete forever
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setArchived((a) => !a);
                  actions.toggleArchive({ id: message.id, is_archived: archived });
                }}
              >
                {archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                {archived ? "Move to inbox" : "Archive"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const okay = await actions.remove(message.id);
                  if (okay) router.push("/inbox");
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-faint"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="size-4" />
                Report
              </Button>
            </>
          )}
        </footer>
      </motion.div>

      {message.moderation_status === "held" && (
        <div className="mt-4 rounded-xl bg-danger-soft p-4 text-sm leading-relaxed text-danger">
          <p className="font-medium">This message was held for review.</p>
          <p className="mt-1">
            Our spam checks flagged this
            {message.spam_reasons.length > 0 && (
              <>
                {" "}
                (<span className="font-mono text-xs">{message.spam_reasons.join(", ")}</span>)
              </>
            )}
            . Only you can see it. Report it if it shouldn&rsquo;t have arrived
            at all.
          </p>
        </div>
      )}

      {folders.length > 0 && !inTrash && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="label text-faint">Collection</span>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() =>
                actions.moveToFolder(
                  message.id,
                  message.folder_id === folder.id ? null : folder.id,
                  folder.name
                )
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                message.folder_id === folder.id
                  ? "border-ember/30 bg-ember-soft text-ember-ink"
                  : "border-ink/12 text-quiet hover:border-ink/25 hover:text-ink"
              )}
            >
              {folder.name}
            </button>
          ))}
        </div>
      )}

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} messageId={message.id} />
    </article>
  );
}

function ReportDialog({
  open,
  onOpenChange,
  messageId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  messageId: string;
}) {
  const router = useRouter();
  const [reason, setReason] = React.useState<string>("harassment");
  const [note, setNote] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function submit() {
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${messageId}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, note }),
      });
      if (!res.ok) throw new Error("That report could not be filed.");
      toast.success("Reported and archived", {
        description: "It's out of your inbox. We'll take a look.",
      });
      onOpenChange(false);
      router.push("/inbox");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this message</DialogTitle>
          <DialogDescription>
            Reporting archives it straight away, so you don&rsquo;t have to see
            it again while we look.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-ink">What is wrong with it?</legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors",
                  reason === r.value
                    ? "border-ember/40 bg-ember-soft/50 text-ink"
                    : "border-ink/10 text-quiet hover:border-ink/20"
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="size-4 accent-[rgb(var(--ember))]"
                />
                {r.label}
              </label>
            ))}
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="report-note" className="block text-sm font-medium text-ink">
              Anything to add? <span className="font-normal text-faint">(optional)</span>
            </label>
            <Textarea
              id="report-note"
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Context helps us act faster."
            />
          </div>

          <Badge tone="neutral">
            The sender is never told.
          </Badge>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={sending}>
            Report and archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
