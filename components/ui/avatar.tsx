"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/cn";

const sizes = {
  xs: "size-7 text-[11px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
} as const;

export function initialsOf(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * Wax-seal avatar. The ring reads as an impressed seal on the letter —
 * `seal` gives it the ember ring used for the profile owner.
 */
export function Avatar({
  src,
  name,
  size = "md",
  seal = false,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizes;
  seal?: boolean;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        seal
          ? "ring-2 ring-ember/45 ring-offset-2 ring-offset-paper"
          : "ring-1 ring-ink/10",
        sizes[size],
        className
      )}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        delayMs={src ? 300 : 0}
        className="flex size-full items-center justify-center bg-ember-soft font-display font-semibold text-ember-ink"
      >
        {initialsOf(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
