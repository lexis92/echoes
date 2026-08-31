import { Link2, PenLine, Share2 } from "lucide-react";

const STEPS = [
  {
    n: "01",
    Icon: Link2,
    title: "Claim your link",
    body: "Pick a handle and you get a page of your own — your name, your photo, a line about what you would like people to write.",
  },
  {
    n: "02",
    Icon: Share2,
    title: "Share it anywhere",
    body: "A story, a bio, a group chat, the bottom of an email. Anyone who has the link can write to you. They never make an account.",
  },
  {
    n: "03",
    Icon: PenLine,
    title: "Keep every one",
    body: "Messages land in your vault. Favourite the ones that catch you off guard, tuck the rest away, and find any of them again in a search.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative border-t border-ink/[0.07] py-24 sm:py-32">
      <div className="container">
        <div className="max-w-2xl">
          <p className="label text-ember">How it works</p>
          <h2 className="mt-4 font-display text-[2.25rem] leading-[1.08] tracking-tightest text-ink sm:text-5xl">
            Three steps, and then you stop thinking about it.
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
