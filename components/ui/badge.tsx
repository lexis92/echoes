import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "bg-ink/[0.06] text-quiet",
        ember: "bg-ember-soft text-ember-ink",
        dusk: "bg-dusk-soft text-dusk",
        sage: "bg-sage-soft text-sage",
        danger: "bg-danger-soft text-danger",
        outline: "border border-ink/12 text-quiet",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
