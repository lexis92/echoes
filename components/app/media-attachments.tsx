"use client";

import * as React from "react";
import { ImageIcon, Loader2, Pause, Play } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/cn";

async function fetchSignedUrl(messageId: string, kind: "image" | "voice") {
  const res = await fetch(`/api/messages/${messageId}/media?kind=${kind}`);
  if (!res.ok) throw new Error("That attachment could not be opened.");
  const data = (await res.json()) as { url: string };
  return data.url;
}

/** Attachments live in a private bucket, so the URL is minted on demand. */
export function MessageImage({ messageId }: { messageId: string }) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchSignedUrl(messageId, "image")
      .then((u) => !cancelled && setUrl(u))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [messageId]);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-ink/[0.08] bg-raised p-4 text-sm text-quiet">
        <ImageIcon className="size-4" aria-hidden />
        {error}
      </div>
    );
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-ink/[0.08] bg-raised">
      {url ? (
        // A sender's photo has no reliable alt text; the caption below carries
        // the context a screen-reader user needs.
        <img
          src={url}
          alt="Photo attached to this message"
          className="w-full animate-fade-in object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-faint" aria-hidden />
          <span className="sr-only">Loading the attached photo</span>
        </div>
      )}
      <figcaption className="border-t border-ink/[0.07] px-4 py-2.5 text-xs text-faint">
        Sent with this message
      </figcaption>
    </figure>
  );
}

/** A voice note player with a static bar pattern — no waveform decoding. */
export function VoiceNote({
  messageId,
  durationSeconds,
}: {
  messageId: string;
  durationSeconds: number | null;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const bars = React.useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => 22 + Math.round(52 * Math.abs(Math.sin(i * 1.37)))),
    []
  );

  async function toggle() {
    if (error) return;
    const audio = audioRef.current;

    if (!url) {
      setLoading(true);
      try {
        const signed = await fetchSignedUrl(messageId, "voice");
        setUrl(signed);
        // Play once the src has actually been attached.
        requestAnimationFrame(() => {
          audioRef.current?.play().catch(() => setError("Playback was blocked."));
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setError("Playback was blocked."));
    else audio.pause();
  }

  const total = durationSeconds ?? 0;

  return (
    <div className="rounded-xl border border-ink/[0.08] bg-raised p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={Boolean(error)}
          aria-label={playing ? "Pause voice note" : "Play voice note"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ember text-white shadow-press transition-transform duration-200 ease-seal hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : playing ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4 translate-x-px" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex h-9 items-center gap-[3px]" aria-hidden>
            {bars.map((height, i) => {
              const active = (i / bars.length) * 100 <= progress;
              return (
                <span
                  key={i}
                  style={{ height: `${height}%` }}
                  className={cn(
                    "w-[3px] shrink-0 rounded-full transition-colors duration-150",
                    active ? "bg-ember" : "bg-ink/15"
                  )}
                />
              );
            })}
          </div>
          <p className="mt-1 font-mono text-[11px] text-faint">
            {error ? error : `${formatDuration(elapsed)}${total ? ` / ${formatDuration(total)}` : ""}`}
          </p>
        </div>
      </div>

      {url && (
        // No caption track: this is user-recorded audio with no transcript available.
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
            setElapsed(0);
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            setElapsed(el.currentTime);
            if (el.duration) setProgress((el.currentTime / el.duration) * 100);
          }}
          className="sr-only"
        />
      )}
    </div>
  );
}
