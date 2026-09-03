"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, FolderPlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SwitchRow } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingsDivider } from "./settings-section";
import {
  createFolderAction,
  deleteFolderAction,
  updateSettingsAction,
} from "@/app/(app)/settings/actions";
import type { FolderRow, ProfileRow } from "@/lib/supabase/database.types";
import { DIGEST_FREQUENCIES, FOLDER_COLORS } from "@/lib/constants";
import { resetAnalytics } from "@/lib/analytics/provider";
import { cn } from "@/lib/cn";

/** Optimistic toggle that rolls back and explains itself when the save fails. */
function useSetting<T extends Partial<ProfileRow>>(initial: ProfileRow) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);

  const set = React.useCallback(
    async (patch: T) => {
      const previous = values;
      setValues((v) => ({ ...v, ...patch }));
      const result = await updateSettingsAction(patch);
      if (!result.ok) {
        setValues(previous);
        toast.error(result.message ?? "That did not save.");
        return;
      }
      router.refresh();
    },
    [router, values]
  );

  return { values, set };
}

export function ReceivingPanel({ profile }: { profile: ProfileRow }) {
  const { values, set } = useSetting(profile);

  return (
    <div className="divide-y divide-ink/[0.07]">
      <SwitchRow
        id="accepting"
        title="Accept new messages"
        description="Turn this off and your page tells visitors you've paused. Nothing already in your vault changes."
        checked={values.accepting_messages}
        onCheckedChange={(v) => set({ accepting_messages: v })}
      />
      <SwitchRow
        id="allow-images"
        title="Allow photos"
        description="Senders can attach one image, up to 8 MB."
        checked={values.allow_images}
        onCheckedChange={(v) => set({ allow_images: v })}
      />
      <SwitchRow
        id="allow-voice"
        title="Allow voice notes"
        description="Senders can record up to two minutes in their browser."
        checked={values.allow_voice}
        onCheckedChange={(v) => set({ allow_voice: v })}
      />
      <SwitchRow
        id="allow-scheduled"
        title="Allow scheduled messages"
        description="Senders can pick a date for a message to open."
        checked={values.allow_scheduled}
        onCheckedChange={(v) => set({ allow_scheduled: v })}
      />
      <SwitchRow
        id="require-name"
        title="Require a name"
        description="Anonymous messages are often the most honest. Turn this on if you'd rather know who's writing."
        checked={values.require_sender_name}
        onCheckedChange={(v) => set({ require_sender_name: v })}
      />
    </div>
  );
}

export function SafetyPanel({ profile }: { profile: ProfileRow }) {
  const { values, set } = useSetting(profile);

  return (
    <div className="divide-y divide-ink/[0.07]">
      <SwitchRow
        id="profanity"
        title="Hide strong language in previews"
        description="Hides swearing in list views. The full wording is always one tap away. We never change what someone wrote."
        checked={values.profanity_filter}
        onCheckedChange={(v) => set({ profanity_filter: v })}
      />

      <div className="py-4">
        <p className="text-[15px] font-medium text-ink">Who can find your page</p>
        <p className="mt-0.5 text-sm leading-relaxed text-quiet">
          Your messages stay private either way. This only affects search engines.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { value: "public", label: "Anyone with the link", hint: "Never indexed" },
              { value: "unlisted", label: "Link only", hint: "Hides your message count" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set({ visibility: option.value })}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                values.visibility === option.value
                  ? "border-ember/40 bg-ember-soft/50"
                  : "border-ink/10 hover:border-ink/25"
              )}
            >
              <span className="block text-sm font-medium text-ink">{option.label}</span>
              <span className="mt-0.5 block text-xs text-faint">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const DIGEST_LABELS: Record<string, { title: string; hint: string }> = {
  instant: { title: "Straight away", hint: "One email per message." },
  daily: { title: "Once a day", hint: "One summary each morning." },
  weekly: { title: "Once a week", hint: "One summary every Monday." },
  off: { title: "Never", hint: "No emails. Check whenever you like." },
};

export function NotificationsPanel({ profile }: { profile: ProfileRow }) {
  const { values, set } = useSetting(profile);

  return (
    <div className="divide-y divide-ink/[0.07]">
      <SwitchRow
        id="notify"
        title="Email me about new messages"
        description="We only email you about your own vault."
        checked={values.notify_email}
        onCheckedChange={(v) => set({ notify_email: v })}
      />

      <div className={cn("py-4 transition-opacity", !values.notify_email && "opacity-50")}>
        <p className="text-[15px] font-medium text-ink">How often</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DIGEST_FREQUENCIES.map((freq) => (
            <button
              key={freq}
              type="button"
              disabled={!values.notify_email}
              onClick={() => set({ digest_frequency: freq })}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed",
                values.digest_frequency === freq
                  ? "border-ember/40 bg-ember-soft/50"
                  : "border-ink/10 hover:border-ink/25"
              )}
            >
              <span className="block text-sm font-medium text-ink">
                {DIGEST_LABELS[freq]!.title}
              </span>
              <span className="mt-0.5 block text-xs text-faint">{DIGEST_LABELS[freq]!.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FoldersPanel({ folders }: { folders: FolderRow[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState<(typeof FOLDER_COLORS)[number]>("neutral");
  const [busy, setBusy] = React.useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const data = new FormData();
    data.set("name", name.trim());
    data.set("color", color);
    const result = await createFolderAction(data);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message ?? "That did not work.");
      return;
    }
    setName("");
    toast.success("Collection created");
    router.refresh();
  }

  return (
    <div className="py-5">
      {folders.length > 0 && (
        <ul className="mb-5 space-y-2">
          {folders.map((folder) => (
            <li
              key={folder.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink/[0.08] px-3.5 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    folder.color === "ember" && "bg-ember",
                    folder.color === "dusk" && "bg-dusk",
                    folder.color === "sage" && "bg-sage",
                    folder.color === "neutral" && "bg-ink/30"
                  )}
                  aria-hidden
                />
                <span className="truncate text-sm text-ink">{folder.name}</span>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete the ${folder.name} collection`}
                onClick={async () => {
                  const result = await deleteFolderAction(folder.id);
                  if (result.ok) {
                    toast.success("Collection removed", {
                      description: "The messages in it are still in your vault.",
                    });
                    router.refresh();
                  } else {
                    toast.error(result.message ?? "That did not work.");
                  }
                }}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={create} className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Hard days, Studio, Birthday capsule…"
            aria-label="New collection name"
          />
          <Button type="submit" disabled={!name.trim() || busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FolderPlus className="size-4" />}
            <span className="sr-only sm:not-sr-only">Add</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-faint">Colour</span>
          {FOLDER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className={cn(
                "size-6 rounded-full ring-offset-2 ring-offset-surface transition-all",
                c === "ember" && "bg-ember",
                c === "dusk" && "bg-dusk",
                c === "sage" && "bg-sage",
                c === "neutral" && "bg-ink/30",
                color === c && "ring-2 ring-ink/40"
              )}
            />
          ))}
        </div>
      </form>
    </div>
  );
}

export function DangerPanel({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function destroy() {
    setBusy(true);
    try {
      const res = await fetch(`/api/account?confirm=${encodeURIComponent(confirmation)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "That did not work.");
      resetAnalytics();
      // A hard navigation, not router.push: the account is gone, and a full
      // load is the only thing that reliably drops cached client state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    } catch (error) {
      toast.error((error as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <p className="text-[15px] font-medium text-ink">Delete your account</p>
          <p className="mt-1 text-sm leading-relaxed text-quiet">
            Every message, photo and recording is removed immediately and
            can&rsquo;t be recovered. Your username becomes available to someone
            else.
          </p>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          <AlertTriangle className="size-4" />
          Delete account
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your vault?</DialogTitle>
            <DialogDescription>
              This can&rsquo;t be undone. There&rsquo;s no grace period and no
              backup to restore from.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <Badge tone="danger">
              Save anything you want to keep first.
            </Badge>
            <div className="space-y-1.5">
              <label htmlFor="confirm-username" className="block text-sm font-medium text-ink">
                Type <span className="font-mono text-ember">{username}</span> to confirm
              </label>
              <Input
                id="confirm-username"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep my vault
            </Button>
            <Button
              variant="danger"
              disabled={confirmation.trim().toLowerCase() !== username}
              loading={busy}
              onClick={destroy}
            >
              Delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PasswordPanel() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-5">
      <div className="max-w-md">
        <p className="text-[15px] font-medium text-ink">Password</p>
        <p className="mt-1 text-sm leading-relaxed text-quiet">
          We send a one-time link instead of asking for your current password.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/reset-password">Send me a reset link</Link>
      </Button>
    </div>
  );
}

export { SettingsDivider };
