import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The Echoes mark: a sealed letter with two echo arcs radiating from it —
 * a message that keeps sounding after it arrives.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-7", className)}
    >
      <path
        d="M5 11.5 16 5l11 6.5v11A2.5 2.5 0 0 1 24.5 25h-17A2.5 2.5 0 0 1 5 22.5v-11Z"
        className="fill-ember-soft stroke-ink"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 11.5 16 19l11-7.5"
        className="stroke-ink"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="18.2" r="2.6" className="fill-ember" />
      <path
        d="M21.6 15.2a6.6 6.6 0 0 1 0 6"
        className="stroke-ember"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M10.4 15.2a6.6 6.6 0 0 0 0 6"
        className="stroke-ember"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  showWord = true,
}: {
  className?: string;
  href?: string;
  showWord?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80",
        className
      )}
      aria-label="Echoes — home"
    >
      <LogoMark className="size-7 transition-transform duration-500 ease-seal group-hover:-rotate-6" />
      {showWord && (
        <span className="font-display text-[1.35rem] font-semibold tracking-tightest text-ink">
          Echoes
        </span>
      )}
    </Link>
  );
}
