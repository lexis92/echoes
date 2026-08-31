"use client";

import { cn } from "@/lib/cn";

const EXCERPTS = [
  { body: "The mug you made me is still my favourite thing I own. Still slightly wonky.", from: "Old flatmate" },
  { body: "You defended my idea in a meeting when I was too nervous to.", from: "A colleague" },
  { body: "Read this on the days it feels pointless.", from: "Jules" },
  { body: "I have wanted to say this for eleven years.", from: "Anonymous" },
  { body: "Your grandmother's recipe card turned up behind the dresser.", from: "Mum" },
  { body: "You covered my shift the week my dad was in hospital. It mattered.", from: "Anonymous" },
  { body: "The kiln is not the enemy. The rush is. Your words, back at you.", from: "Rui" },
  { body: "Sealed until your birthday. No peeking, I know you.", from: "Sealed" },
];

function Row({ reverse = false }: { reverse?: boolean }) {
  const items = [...EXCERPTS, ...EXCERPTS];
  return (
    <div
      className={cn(
        "flex w-max gap-4 animate-marquee",
        reverse && "[animation-direction:reverse]"
      )}
      style={{ animationDuration: reverse ? "58s" : "46s" }}
    >
      {items.map((item, i) => (
        <figure
          key={`${item.from}-${i}`}
          className="grain w-[19rem] shrink-0 rounded-xl border border-ink/[0.08] bg-surface p-5 shadow-card"
        >
          <blockquote className="font-display text-[15px] leading-relaxed text-ink">
            &ldquo;{item.body}&rdquo;
          </blockquote>
          <figcaption className="mt-3 font-mono text-xs text-faint">— {item.from}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/**
 * A quiet wall of excerpts. These are illustrative, not real user messages —
 * publishing someone's vault would defeat the entire product.
 */
export function Wall() {
  return (
    <section
      aria-label="Examples of the kinds of messages people send"
      className="relative overflow-hidden border-t border-ink/[0.07] py-20 sm:py-24"
    >
      <div className="container mb-12">
        <p className="label text-ember">The shape of it</p>
        <h2 className="mt-4 max-w-xl font-display text-[2rem] leading-[1.1] tracking-tightest text-ink sm:text-[2.5rem]">
          This is the sort of thing that arrives.
        </h2>
      </div>

      <div
        className="space-y-4 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
        aria-hidden
      >
        <div className="overflow-hidden">
          <Row />
        </div>
        <div className="overflow-hidden">
          <Row reverse />
        </div>
      </div>

      <p className="container mt-10 text-xs text-faint">
        Illustrative examples. Real messages are never shown to anyone but their
        recipient.
      </p>
    </section>
  );
}
