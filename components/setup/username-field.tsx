"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";
import { prettyProfileUrl } from "@/lib/utils";
import { cn } from "@/lib/cn";

type Status =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken"; reason: string };

/**
 * Live availability. Debounced, abortable, and it never blocks typing — the
 * server action re-checks on submit, so this is a convenience, not a gate.
 */
export function UsernameField({
  value,
  onChange,
  error,
  initial,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  initial?: string;
}) {
  const [status, setStatus] = React.useState<Status>({ state: "idle" });
  const prefix = prettyProfileUrl("").replace(/\/$/, "");

  React.useEffect(() => {
    const handle = value.trim().toLowerCase();
    if (!handle || handle === initial) {
      setStatus({ state: "idle" });
      return;
    }
    if (handle.length < 3) {
      setStatus({ state: "taken", reason: "At least 3 characters." });
      return;
    }

    const controller = new AbortController();
    setStatus({ state: "checking" });

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username?u=${encodeURIComponent(handle)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setStatus(
          data.available
            ? { state: "available" }
            : { state: "taken", reason: data.reason ?? "Not available." }
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") setStatus({ state: "idle" });
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, initial]);

  const invalid = Boolean(error) || status.state === "taken";

  return (
    <div className="space-y-1.5">
      <label htmlFor="username" className="block text-sm font-medium text-ink">
        Your link
      </label>

      <div
        className={cn(
          "flex items-center rounded-lg border bg-surface shadow-inset transition-colors duration-200 focus-within:ring-4",
          invalid
            ? "border-danger focus-within:ring-danger/15"
            : status.state === "available"
              ? "border-sage focus-within:ring-sage/15"
              : "border-ink/12 focus-within:border-ember focus-within:ring-ember/15"
        )}
      >
        <span className="shrink-0 select-none py-2.5 pl-3.5 font-mono text-sm text-faint">
          {prefix}/
        </span>
        <input
          id="username"
          name="username"
          value={value}
          onChange={(e) =>
            onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24))
          }
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          aria-invalid={invalid || undefined}
          aria-describedby="username-status"
          className="min-w-0 flex-1 bg-transparent py-2.5 font-mono text-[15px] text-ink outline-none placeholder:text-faint/70"
          placeholder="yourname"
        />
        <span className="flex w-10 shrink-0 items-center justify-center">
          {status.state === "checking" && (
            <Loader2 className="size-4 animate-spin text-faint" aria-hidden />
          )}
          {status.state === "available" && <Check className="size-4 text-sage" aria-hidden />}
          {status.state === "taken" && <X className="size-4 text-danger" aria-hidden />}
        </span>
      </div>

      <p
        id="username-status"
        aria-live="polite"
        className={cn(
          "text-xs leading-relaxed",
          error || status.state === "taken" ? "font-medium text-danger" : "text-faint",
          status.state === "available" && "font-medium text-sage"
        )}
      >
        {error
          ? error
          : status.state === "taken"
            ? status.reason
            : status.state === "available"
              ? "Available."
              : "Letters, numbers and underscores. This is the link you'll share."}
      </p>
    </div>
  );
}
