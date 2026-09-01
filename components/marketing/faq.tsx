const QUESTIONS = [
  {
    q: "Does the person writing to me need an account?",
    a: "No. They open your link, type, and send. No email, no password, no app. That is the whole point.",
  },
  {
    q: "Can I see who sent an anonymous message?",
    a: "No, and neither can we. Senders choose whether to sign. We store a scrambled version of their IP to block spam floods, which cannot be reversed and is never shown to you.",
  },
  {
    q: "What stops people being horrible?",
    a: "Spam checks, a CAPTCHA, and limits on how fast anyone can send. Suspicious messages are held for you to review rather than deleted. You can also pause new messages, require a name, or report anything that gets through.",
  },
  {
    q: "How do messages that open later work?",
    a: "The sender picks a date. Until then the text never reaches your browser, so there is nothing to peek at. You can see that something is waiting and when it opens.",
  },
  {
    q: "Do messages expire?",
    a: "Never. Deleting one puts it in Trash for 30 days first, in case you change your mind. Delete your account and everything goes at once.",
  },
  {
    q: "What does it cost?",
    a: "Nothing. Creating a vault, receiving messages and keeping them are all free. If we ever charge for anything, it will not be for messages you already have.",
  },
];

export function FAQ() {
  return (
    <section id="questions" className="relative border-t border-ink/[0.07] bg-raised/40 py-24 sm:py-32">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="label text-ember">Questions</p>
            <h2 className="mt-4 font-display text-[2.25rem] leading-[1.08] tracking-tightest text-ink sm:text-[2.75rem]">
              Common questions.
            </h2>
          </div>

          <div className="divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
            {QUESTIONS.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left font-display text-[1.125rem] tracking-tightest text-ink marker:hidden">
                  {q}
                  <span
                    aria-hidden
                    className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-ink/12 text-faint transition-transform duration-300 ease-paper group-open:rotate-45"
                  >
                    <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-quiet">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
