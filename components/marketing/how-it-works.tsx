import { Link2, PenLine, Share2 } from "lucide-react";

const STEPS = [
  {
    n: "01",
    Icon: Link2,
    title: "Claim your link",
    body: "Pick a handle. You get a page with your name, your photo, and a line about what you'd like to hear.",
  },
  {
    n: "02",
    Icon: Share2,
    title: "Share it",
    body: "A bio, a story, a group chat, the bottom of an email. Anyone who opens it can write to you.",
  },
  {
    n: "03",
    Icon: PenLine,
    title: "Keep them",
    body: "Everything lands in your vault. Favourite the ones you'll reread, archive the rest, search all of them.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative border-t border-ink/[0.07] py-24 sm:py-32">
      <div className="container">
        <div className="max-w-2xl">
          <p className="label text-ember">How it works</p>
          <h2 className="mt-4 font-display text-[2.25rem] leading-[1.08] tracking-tightest text-ink sm:text-5xl">
            Set it up once.
          </h2>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-ink/[0.08] bg-ink/[0.07] sm:grid-cols-3">
          {STEPS.map(({ n, Icon, title, body }) => (
            <li key={n} className="group relative grain bg-surface p-8 transition-colors duration-300 hover:bg-raised sm:p-9">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-label text-faint">{n}</span>
                <span className="flex size-10 items-center justify-center rounded-full bg-ember-soft text-ember-ink transition-transform duration-500 ease-seal group-hover:-rotate-12">
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <h3 className="mt-8 font-display text-xl tracking-tightest text-ink">{title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-quiet">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
