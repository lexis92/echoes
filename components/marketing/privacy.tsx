import { EyeOff, Fingerprint, ShieldCheck, Trash2 } from "lucide-react";

const PROMISES = [
  {
    Icon: EyeOff,
    title: "Only you can read them",
    body: "Your messages are locked to your account in the database itself, not just in the app. There is no admin view.",
  },
  {
    Icon: Fingerprint,
    title: "Senders stay anonymous",
    body: "We never store a sender's IP address. We keep a scrambled version to block spam floods, and it cannot be turned back.",
  },
  {
    Icon: ShieldCheck,
    title: "Locked means locked",
    body: "A message set to open later never reaches your browser until the date arrives. It is held back by the database, not hidden by the page.",
  },
  {
    Icon: Trash2,
    title: "Leaving is easy",
    body: "Delete your account and every message, photo and recording goes with it. No waiting period, no retention copy.",
  },
];

export function Privacy() {
  return (
    <section id="privacy" className="relative border-t border-ink/[0.07] py-24 sm:py-32">
      <div className="container">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="label text-ember">Privacy first</p>
            <h2 className="mt-4 font-display text-[2.25rem] leading-[1.08] tracking-tightest text-ink sm:text-5xl">
              Private by default.
            </h2>
            <p className="mt-5 text-pretty text-[1.0625rem] leading-relaxed text-quiet">
              People say things here they have not said out loud. That only works
              if the vault is private, so here is how we handle it.
            </p>
          </div>

          <dl className="space-y-px overflow-hidden rounded-2xl border border-ink/[0.08] bg-ink/[0.07]">
            {PROMISES.map(({ Icon, title, body }) => (
              <div key={title} className="grain bg-surface p-7 sm:p-8">
                <dt className="flex items-center gap-3 font-display text-lg tracking-tightest text-ink">
                  <Icon className="size-5 shrink-0 text-ember" aria-hidden />
                  {title}
                </dt>
                <dd className="mt-2.5 text-[15px] leading-relaxed text-quiet">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
