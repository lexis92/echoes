"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ImagePlus,
  Loader2,
  Lock,
  MicVocal,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { FormAlert } from "@/components/auth/form-shell";
import { Turnstile, turnstileConfigured } from "./turnstile";
import { VoiceRecorder } from "./voice-recorder";
import { track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  IMAGE_MAX_BYTES,
  MESSAGE_MAX_LENGTH,
  SENDER_NAME_MAX_LENGTH,
} from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import type { PublicProfile } from "@/lib/supabase/database.types";
import { cn } from "@/lib/cn";

type Attachment = { path: string; previewUrl?: string; name: string; size: number };

const PROMPTS = [
  "Something you've never said out loud",
  "A moment you still think about",
  "Thank them for something small",
  "What you'd say with one minute",
];

export function ComposeForm({ profile }: { profile: PublicProfile }) {
  const router = useRouter();
  const openedAt = React.useRef(Date.now());
  const startedTyping = React.useRef(false);

  const [content, setContent] = React.useState("");
  const [senderName, setSenderName] = React.useState("");
  const [senderEmail, setSenderEmail] = React.useState("");
  const [website, setWebsite] = React.useState(""); // honeypot
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);

  const [image, setImage] = React.useState<Attachment | null>(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [voice, setVoice] = React.useState<Attachment | null>(null);
  const [voiceSeconds, setVoiceSeconds] = React.useState<number | null>(null);
  const [uploadingVoice, setUploadingVoice] = React.useState(false);

  const [showVoice, setShowVoice] = React.useState(false);
  const [unlockAt, setUnlockAt] = React.useState("");
  const [showSchedule, setShowSchedule] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldError, setFieldError] = React.useState<Record<string, string>>({});

  const imageInput = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow, so a long message never types into a tiny window.
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 560)}px`;
  }, [content]);

  function onFirstType() {
    if (startedTyping.current) return;
    startedTyping.current = true;
    track(ANALYTICS_EVENTS.messageComposeStarted, { username: profile.username });
  }

  async function uploadFile(file: File, kind: "image" | "voice") {
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    body.set("username", profile.username);

    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "That file would not upload.");
    return data.path as string;
  }

  async function onPickImage(file: File) {
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error(`That photo is ${formatBytes(file.size)}. Keep it under 8 MB.`);
      return;
    }
    setUploadingImage(true);
    const previewUrl = URL.createObjectURL(file);
    try {
      const path = await uploadFile(file, "image");
      setImage({ path, previewUrl, name: file.name, size: file.size });
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      toast.error((err as Error).message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function onRecorded(recording: { blob: Blob; url: string; seconds: number } | null) {
    if (!recording) {
      setVoice(null);
      setVoiceSeconds(null);
      return;
    }
    setUploadingVoice(true);
    try {
      const file = new File([recording.blob], "voice-note", {
        type: recording.blob.type || "audio/webm",
      });
      const path = await uploadFile(file, "voice");
      setVoice({ path, name: "Voice note", size: file.size });
      setVoiceSeconds(recording.seconds);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadingVoice(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldError({});

    if (content.trim().length < 2) {
      setFieldError({ content: "Write a little more." });
      return;
    }
    if (profile.require_sender_name && !senderName.trim()) {
      setFieldError({ senderName: `${profile.name} asks senders to leave a name.` });
      return;
    }
    if (turnstileConfigured && !captchaToken) {
      setError("Finishing a quick spam check. Try again in a second.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          content: content.trim(),
          senderName: senderName.trim(),
          senderEmail: senderEmail.trim(),
          imagePath: image?.path ?? "",
          voicePath: voice?.path ?? "",
          voiceDurationSeconds: voiceSeconds ?? undefined,
          unlockAt: unlockAt ? new Date(unlockAt).toISOString() : "",
          captchaToken: captchaToken ?? "",
          website,
          elapsedMs: Date.now() - openedAt.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.fields) setFieldError(data.fields);
        setError(data?.message ?? "That did not send. Try again?");
        track(ANALYTICS_EVENTS.messageSubmitFailed, { reason: data?.error ?? "unknown" });
        return;
      }

      const params = new URLSearchParams();
      if (data.scheduled && data.unlockAt) params.set("sealed", data.unlockAt);
      if (senderName.trim()) params.set("from", senderName.trim());
      router.push(`/u/${profile.username}/sent${params.toString() ? `?${params}` : ""}`);
    } catch {
      setError("Something interrupted the send. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = MESSAGE_MAX_LENGTH - content.length;
  const busy = submitting || uploadingImage || uploadingVoice;

  // Sensible bounds for the seal date: tomorrow, up to twenty years out.
  const minDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
  const maxDate = new Date(Date.now() + 20 * 365 * 86_400_000).toISOString().slice(0, 16);

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <FormAlert tone="error">{error}</FormAlert>}

      {/* Honeypot: hidden from people, irresistible to naive bots. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this empty</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="content" className="sr-only">
          Your message to {profile.name}
        </label>
        <Textarea
          id="content"
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value.slice(0, MESSAGE_MAX_LENGTH));
            onFirstType();
          }}
          rows={6}
          required
          aria-invalid={fieldError.content ? true : undefined}
          placeholder="Say the thing you've been meaning to say…"
          className="min-h-[11rem] resize-none font-display text-[1.0625rem] leading-relaxed"
        />
        <div className="flex items-center justify-between gap-3">
          {fieldError.content ? (
            <p role="alert" className="text-xs font-medium text-danger">
              {fieldError.content}
            </p>
          ) : (
            <p className="text-xs text-faint">
              {content.length === 0 ? "No account needed. Nobody sees this but them." : " "}
            </p>
          )}
          <span
            className={cn(
              "shrink-0 font-mono text-xs tabular-nums",
              remaining < 200 ? "text-ember" : "text-faint"
            )}
          >
            {remaining < 500 ? remaining.toLocaleString() : ""}
          </span>
        </div>
      </div>

      {content.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setContent(`${prompt}: `);
                textareaRef.current?.focus();
                onFirstType();
              }}
              className="rounded-full border border-ink/10 px-3 py-1.5 text-xs text-quiet transition-colors hover:border-ink/25 hover:text-ink"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* --- Attachments --- */}
      {image && (
        <div className="relative overflow-hidden rounded-xl border border-ink/[0.08]">
          {image.previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={image.previewUrl} alt="" className="max-h-72 w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => {
              if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
              setImage(null);
            }}
            aria-label="Remove photo"
            className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-paper backdrop-blur transition-colors hover:bg-ink"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {showVoice && profile.allow_voice && (
        <div className="relative overflow-hidden">
          <VoiceRecorder onRecorded={onRecorded} disabled={uploadingVoice} />
          {uploadingVoice && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-faint">
              <Loader2 className="size-3 animate-spin" />
              Saving your recording…
            </p>
          )}
        </div>
      )}

      {showSchedule && profile.allow_scheduled && (
        <div className="rounded-xl border border-dusk/25 bg-dusk-soft/40 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-4 shrink-0 text-dusk" aria-hidden />
            <div className="min-w-0 flex-1">
              <label htmlFor="unlock" className="block text-sm font-medium text-ink">
                Open it on
              </label>
              <p className="mt-0.5 text-xs leading-relaxed text-quiet">
                {profile.name} will know something is waiting, but won&rsquo;t be
                able to read it until then.
              </p>
              <input
                id="unlock"
                type="datetime-local"
                value={unlockAt}
                min={minDate}
                max={maxDate}
                onChange={(e) => setUnlockAt(e.target.value)}
                className="mt-2.5 h-11 w-full rounded-lg border border-ink/12 bg-surface px-3 text-[15px] text-ink focus:border-ember focus:outline-none focus:ring-4 focus:ring-ember/15"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowSchedule(false);
                setUnlockAt("");
              }}
              aria-label="Do not seal this message"
              className="rounded-full p-1.5 text-faint hover:bg-ink/[0.06] hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- Attachment toolbar --- */}
      <div className="flex flex-wrap gap-2">
        {profile.allow_images && (
          <>
            <input
              ref={imageInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickImage(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingImage || Boolean(image)}
              onClick={() => imageInput.current?.click()}
            >
              {uploadingImage ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              Photo
            </Button>
          </>
        )}

        {profile.allow_voice && !showVoice && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowVoice(true)}>
            <MicVocal className="size-4" />
            Voice note
          </Button>
        )}

        {profile.allow_scheduled && !showSchedule && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowSchedule(true)}>
            <CalendarClock className="size-4" />
            Open later
          </Button>
        )}
      </div>

      {/* --- Who is this from --- */}
      <div className="grid gap-4 border-t border-ink/[0.07] pt-5 sm:grid-cols-2">
        <Field
          label="Your name"
          htmlFor="senderName"
          optional={!profile.require_sender_name}
          error={fieldError.senderName}
          hint={
            profile.require_sender_name
              ? undefined
              : "Leave it blank to stay completely anonymous."
          }
        >
          <Input
            name="senderName"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            maxLength={SENDER_NAME_MAX_LENGTH}
            autoComplete="name"
            placeholder={profile.require_sender_name ? "Your name" : "Anonymous"}
          />
        </Field>

        <Field
          label="Your email"
          htmlFor="senderEmail"
          optional
          error={fieldError.senderEmail}
          hint="Shared only with them, and only if you want a reply."
        >
          <Input
            name="senderEmail"
            type="email"
            inputMode="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
      </div>

      <Turnstile onToken={setCaptchaToken} />

      <Button type="submit" size="lg" className="w-full" loading={busy}>
        <Send className="size-4" />
        {unlockAt ? "Schedule it" : `Send to ${profile.name.split(" ")[0]}`}
      </Button>

      <p className="text-center text-xs leading-relaxed text-faint">
        This goes straight into {profile.name.split(" ")[0]}&rsquo;s private vault.
        We never publish it, and we don&rsquo;t store your IP address.
      </p>
    </form>
  );
}
