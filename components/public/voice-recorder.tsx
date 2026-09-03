"use client";

import * as React from "react";
import { Loader2, Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VOICE_MAX_SECONDS } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/cn";

type Recording = { blob: Blob; url: string; seconds: number };

/**
 * Browser voice recording with MediaRecorder.
 *
 * Three things matter for a first-time, non-technical sender: the permission
 * prompt is explained before it appears, the limit is visible while recording,
 * and there is an obvious way to throw it away and start again.
 */
export function VoiceRecorder({
  onRecorded,
  disabled,
}: {
  onRecorded: (recording: Recording | null) => void;
  disabled?: boolean;
}) {
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const [supported, setSupported] = React.useState(true);
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [result, setResult] = React.useState<Recording | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [starting, setStarting] = React.useState(false);

  React.useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof window.MediaRecorder !== "undefined"
    );
  }, []);

  const cleanup = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  React.useEffect(() => cleanup, [cleanup]);

  const stop = React.useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  async function start() {
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) =>
        MediaRecorder.isTypeSupported(t)
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setSeconds((elapsed) => {
          const recorded = { blob, url, seconds: elapsed };
          setResult(recorded);
          onRecorded(recorded);
          return elapsed;
        });
        setRecording(false);
        cleanup();
      };

      recorder.start();
      setRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= VOICE_MAX_SECONDS) {
            stop();
            return VOICE_MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch (error) {
      const name = (error as Error).name;
      toast.error(
        name === "NotAllowedError"
          ? "Microphone access was declined. You can still write your message."
          : "We couldn't reach your microphone."
      );
    } finally {
      setStarting(false);
    }
  }

  function discard() {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setSeconds(0);
    onRecorded(null);
  }

  if (!supported) {
    return (
      <p className="rounded-lg bg-raised px-3.5 py-3 text-sm text-quiet">
        This browser can’t record audio. Everything else still works.
      </p>
    );
  }

  if (result) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-ink/[0.08] bg-raised p-3">
        <Button
          type="button"
          size="icon"
          variant="ember"
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (audio.paused) audio.play();
            else audio.pause();
          }}
          aria-label={playing ? "Pause your recording" : "Play your recording"}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">Voice note recorded</p>
          <p className="font-mono text-xs text-faint">{formatDuration(result.seconds)}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={discard} aria-label="Discard recording">
          <Trash2 />
        </Button>
        {/* No caption track: the user recorded this seconds ago and no transcript exists. */}
        <audio
          ref={audioRef}
          src={result.url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="sr-only"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink/[0.08] bg-raised p-3">
      <Button
        type="button"
        size="icon"
        variant={recording ? "danger" : "outline"}
        onClick={recording ? stop : start}
        disabled={disabled || starting}
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {starting ? <Loader2 className="animate-spin" /> : recording ? <Square /> : <Mic />}
      </Button>

      <div className="flex-1">
        <p className="text-sm font-medium text-ink">
          {recording ? "Recording…" : "Record a voice note"}
        </p>
        <p className="font-mono text-xs text-faint">
          {recording
            ? `${formatDuration(seconds)} / ${formatDuration(VOICE_MAX_SECONDS)}`
            : "Up to two minutes. Your browser will ask for microphone access."}
        </p>
      </div>

      {recording && (
        <div className="flex items-center gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-ember-pulse rounded-full bg-danger"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      )}

      {recording && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-0.5 bg-ember transition-all duration-1000"
          )}
          style={{ width: `${(seconds / VOICE_MAX_SECONDS) * 100}%` }}
          aria-hidden
        />
      )}
    </div>
  );
}
