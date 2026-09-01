import { CalendarClock, ImageIcon, Mic, Type, UserRound } from "lucide-react";

const THINGS = [
  {
    Icon: Type,
    title: "Words",
    body: "Up to 5,000 characters. Enough for the long one someone has been putting off.",
    span: "sm:col-span-2",
  },
  {
    Icon: UserRound,
    title: "A name, or not",
    body: "Signing is optional. A lot of people leave it blank, and those are often the ones that land hardest.",
    span: "",
  },
  {
    Icon: Mic,
    title: "Your voice",
    body: "Two minutes, recorded right in the page. Hearing someone say it is different from reading it.",
    span: "",
  },
  {
    Icon: ImageIcon,
    title: "A photo",
    body: "The picture from that day. The recipe card. The ticket stub someone kept.",
    span: "",
  },
  {
    Icon: CalendarClock,
    title: "A date to open it",
    body: "Lock a message until a birthday or a first day. Nobody can read it before then, including you.",
    span: "sm:col-span-2",
  },
];

export function WhatYouCanSend() {
  return (
    <section id="send" className="relative border-t border-ink/[0.07] bg-raised/40 py-24 sm:py-32">
      <div className="container">
        <div className="max-w-2xl">
          <p className="label text-ember">What people can send</p>
          <h2 className="mt-4 font-display text-[2.25rem] leading-[1.08] tracking-tightest text-ink sm:text-5xl">
            Not just text.
          </h2>
          <p className="mt-5 text-pretty text-[1.0625rem] leading-relaxed text-quiet">
            You choose which of these your page accepts. Turn one off and it
            disappears for senders too.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {THINGS.map(({ Icon, title, body, span }) => (
            <article
              key={title}
              className={`group relative grain overflow-hidden rounded-xl border border-ink/[0.08] bg-surface p-7 transition-all duration-300 ease-paper hover:-translate-y-0.5 hover:shadow-lift ${span}`}
            >
              <Icon className="size-5 text-ember" aria-hidden />
              <h3 className="mt-5 font-display text-lg tracking-tightest text-ink">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-quiet">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
