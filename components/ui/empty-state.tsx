import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Empty states carry a lot of the emotional weight in Echoes — an empty
 * inbox is the most common first experience, so it gets an illustration
 * rather than a shrug.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grain flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink/15 bg-raised/50 px-6 py-16 text-center",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 ember-bloom opacity-60" />
      {icon && (
        <div className="relative mb-5 flex size-16 items-center justify-center rounded-full bg-ember-soft text-ember-ink [&_svg]:size-7">
          {icon}
        </div>
      )}
      <h3 className="relative font-display text-2xl tracking-tightest text-ink">{title}</h3>
      {description && (
        <p className="relative mt-2 max-w-sm text-pretty text-sm leading-relaxed text-quiet">
          {description}
        </p>
      )}
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}
