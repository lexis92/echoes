import { Archive, Heart, Inbox, Lock, Search, Star } from "lucide-react";

/**
 * A static, honest depiction of the dashboard. It is markup rather than a
 * screenshot so it stays sharp, themes correctly and never goes stale.
 */
export function VaultPreview() {
  return (
    <section className="relative border-t border-ink/[0.07] py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label text-ember">Your vault</p>
          <h2 className="mt-4 font-display text-[2.25rem] leading-[1.08] tracking-tightest text-ink sm:text-5xl">
            A quiet place to keep them.
          </h2>
          <p className="mt-5 text-pretty text-[1.0625rem] leading-relaxed text-quiet">
            Not a feed. Not a notification tower. Somewhere you go on purpose,
            once in a while, when you need to remember something true.
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="pointer-events-none absolute -inset-x-8 -top-8 bottom-0 ember-bloom" aria-hidden />

          <div className="relative grain overflow-hidden rounded-2xl border border-ink/[0.08] bg-surface shadow-lift">
            <div className="flex items-center gap-2 border-b border-ink/[0.07] bg-raised px-5 py-3">
              <span className="size-2.5 rounded-full bg-ink/12" aria-hidden />
              <span className="size-2.5 rounded-full bg-ink/12" aria-hidden />
              <span className="size-2.5 rounded-full bg-ink/12" aria-hidden />
              <span className="ml-3 font-mono text-xs text-faint">echoes.app/inbox</span>
            </div>

            <div className="grid sm:grid-cols-[13rem_minmax(0,1fr)]">
              <nav className="hidden border-r border-ink/[0.07] bg-raised/60 p-4 sm:block" aria-hidden>
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-ink/[0.05] px-3 py-2 text-xs text-faint">
                  <Search className="size-3.5" />
                  Search everything
                </div>
                {[
                  { Icon: Inbox, label: "Inbox", count: "12", active: true },
                  { Icon: Star, label: "Favourites", count: "4" },
                  { Icon: Lock, label: "Sealed", count: "2" },
                  { Icon: Archive, label: "Archive", count: "31" },
                ].map(({ Icon, label, count, active }) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      active ? "bg-ink/[0.06] text-ink" : "text-quiet"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4 text-faint" />
                      {label}
                    </span>
                    <span className="font-mono text-[11px] text-faint">{count}</span>
                  </div>
                ))}
              </nav>

              <div className="space-y-3 p-5 sm:p-6">
                {[
                  {
                    from: "Nana Grace",
                    time: "3h",
                    body: "You will not remember this, but when you were six you told me the sea was “the sky lying down”.",
                    fav: true,
                    unread: true,
                  },
                  {
                    from: "Anonymous",
                    time: "9h",
                    body: "I sat next to you on the 728 when I was having the worst day of my life and you offered me half a pastry.",
                    unread: true,
                  },
                  {
                    from: "Sealed until 14 March",
                    time: "5d",
                    body: null,
                  },
                ].map((m) => (
                  <article
                    key={m.from}
                    className="rounded-xl border border-ink/[0.08] bg-paper/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {m.unread && (
                          <span className="size-1.5 shrink-0 rounded-full bg-ember" aria-hidden />
                        )}
                        <span className="text-sm font-medium text-ink">{m.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.fav && <Heart className="size-3.5 fill-ember text-ember" aria-hidden />}
                        <span className="font-mono text-[11px] text-faint">{m.time}</span>
                      </div>
                    </div>
                    {m.body ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-quiet">
                        {m.body}
                      </p>
                    ) : (
                      <p className="mt-2 flex items-center gap-2 text-sm italic text-dusk">
                        <Lock className="size-3.5" aria-hidden />
                        Sealed. Opens in 38 days.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
