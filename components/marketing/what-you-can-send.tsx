import { CalendarClock, ImageIcon, Mic, Type, UserRound } from "lucide-react";

const THINGS = [
  {
    Icon: Type,
    title: "Words",
    body: "The whole point. Up to five thousand characters — enough for the long one you have been meaning to write.",
    span: "sm:col-span-2",
  },
  {
    Icon: UserRound,
    title: "A name — or not",
    body: "Sign it, or stay anonymous. Some of the most affecting messages people receive have no name on them at all.",
    span: "",
  },
  {
    Icon: Mic,
    title: "Your voice",
    body: "Record up to two minutes right in the page. Hearing someone say it is a different thing entirely.",
    span: "",
  },
  {
    Icon: ImageIcon,
    title: "A photo",
    body: "The picture from that day, the recipe card, the ticket stub you kept.",
    span: "",
  },
  {
    Icon: CalendarClock,
    title: "A date to open it",
    body: "Seal a message until a birthday, a graduation, a first day. It stays unreadable — even to us in the interface — until the moment arrives.",
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
            More than a text box.
          </h2>
          <p className="mt-5 text-pretty text-[1.0625rem] leading-relaxed text-quiet">
            You decide which of these your page accepts. Turn any of them off in
            settings and the option disappears for senders too.
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
