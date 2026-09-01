import { LogoMark } from "@/components/logo";

const NOTES = [
  {
    body: "You will not remember this, but when you were six you told me the sea was “the sky lying down”. I have thought about that sentence every summer since.",
    from: "Nana Grace",
    tilt: "-2.2deg",
  },
  {
    body: "I sat next to you on the 728 when I was having the worst day of my life and you offered me half a pastry without saying anything.",
    from: "Anonymous",
    tilt: "1.6deg",
  },
  {
    body: "Open this on the morning of your exhibition. I wrote it months in advance because I already know how it is going to go.",
    from: "Opens 14 March",
    tilt: "-1.1deg",
  },
];

/**
 * The left half of every auth screen. It is doing product work, not decoration:
 * it shows a newcomer what the thing they are signing up for actually contains.
 */
export function AuthAside() {
  return (
    <aside className="relative hidden grain overflow-hidden bg-raised lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="pointer-events-none absolute inset-0 press-grid" aria-hidden />
      <div className="pointer-events-none absolute -left-24 top-1/3 size-[28rem] rounded-full bg-ember/[0.07] blur-3xl" aria-hidden />

      <div className="relative flex items-center gap-2.5">
        <LogoMark className="size-8" />
        <span className="font-display text-2xl tracking-tightest">Echoes</span>
      </div>

      <div className="relative my-12 space-y-5 stagger">
        {NOTES.map((note) => (
          <figure
            key={note.from}
            style={{ ["--tilt" as string]: note.tilt, transform: `rotate(${note.tilt})` }}
            className="grain max-w-md rounded-xl border border-ink/[0.08] bg-surface p-6 shadow-card transition-transform duration-500 ease-paper hover:rotate-0"
          >
            <blockquote className="font-display text-[1.0625rem] leading-relaxed text-ink">
              &ldquo;{note.body}&rdquo;
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-2 font-mono text-xs text-faint">
              <span className="h-px w-6 bg-ink/20" aria-hidden />
              {note.from}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="relative max-w-sm text-pretty text-sm leading-relaxed text-quiet">
        One link. Anyone can write to you without an account, and everything
        they send is yours to keep.
      </p>
    </aside>
  );
}
