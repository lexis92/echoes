"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function CopyField({
  value,
  label,
  className,
  onCopied,
}: {
  value: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API is unavailable on insecure origins and some in-app
      // browsers; fall back to a selection-based copy.
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        toast.error("Couldn't copy — select the link and copy manually.");
        document.body.removeChild(el);
        return;
      }
      document.body.removeChild(el);
    }
    setCopied(true);
    onCopied?.();
    toast.success("Link copied", { description: "Now share it with someone." });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="label text-faint">{label}</p>}
      <div className="flex items-center gap-2 rounded-xl border border-ink/12 bg-raised p-1.5 pl-3.5">
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink" title={value}>
          {value}
        </span>
        <Button
          type="button"
          size="sm"
          variant={copied ? "quiet" : "primary"}
          onClick={copy}
          className="shrink-0"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span className="sr-only sm:not-sr-only">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
    </div>
  );
}
