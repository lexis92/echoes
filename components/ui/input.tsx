import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-11 w-full rounded-lg border border-ink/12 bg-surface px-3.5 text-[15px] text-ink shadow-inset transition-colors duration-200",
      "placeholder:text-faint",
      "hover:border-ink/22 focus:border-ember focus:outline-none focus:ring-4 focus:ring-ember/15",
      "disabled:cursor-not-allowed disabled:opacity-60",
      "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-ink/12 bg-surface px-3.5 py-3 text-[15px] leading-relaxed text-ink shadow-inset transition-colors duration-200",
      "placeholder:text-faint",
      "hover:border-ink/22 focus:border-ember focus:outline-none focus:ring-4 focus:ring-ember/15",
      "disabled:cursor-not-allowed disabled:opacity-60",
      "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
