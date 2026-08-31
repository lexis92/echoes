import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function FormHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="label mb-3 text-ember">{eyebrow}</p>}
      <h1 className="font-display text-[2rem] leading-[1.1] tracking-tightest text-ink sm:text-[2.25rem]">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-quiet">{description}</p>
      )}
    </div>
  );
}

/** Inline status banner used by every auth form. */
export function FormAlert({
  tone,
  children,
  className,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm leading-relaxed",
        tone === "error" && "bg-danger-soft text-danger",
        tone === "success" && "bg-sage-soft text-sage",
        tone === "info" && "bg-dusk-soft text-dusk",
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
