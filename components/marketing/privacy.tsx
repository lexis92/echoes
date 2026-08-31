import { EyeOff, Fingerprint, ShieldCheck, Trash2 } from "lucide-react";

const PROMISES = [
  {
    Icon: EyeOff,
    title: "Nobody browses your vault",
    body: "Your messages are readable by exactly one account: yours. Row-level security enforces it in the database itself, not just in the app.",
  },
  {
    Icon: Fingerprint,
    title: "Senders stay anonymous",
    body: "We never store a sender's IP address. We keep a salted hash so we can stop a flood of spam, and that hash cannot be turned back into an address.",
  },
  {
    Icon: ShieldCheck,
    title: "Sealed means sealed",
    body: "A message scheduled for the future is withheld by the database until its moment. Not hidden by CSS — genuinely not sent to your browser.",
  },
  {
    Icon: Trash2,
    title: "Leaving is easy",
    body: "Delete your account whenever you like and every message, photo and recording goes with it. No retention period, no dark pattern.",
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
              People will tell you things they have not told anyone.
            </h2>
            <p className="mt-5 text-pretty text-[1.0625rem] leading-relaxed text-quiet">
              That only works if the vault is genuinely private. Here is exactly
              what we do about it.
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
