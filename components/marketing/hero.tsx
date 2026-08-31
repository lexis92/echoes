"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lock, Mic, Sparkles } from "lucide-react";
import { ClaimField } from "./claim-field";
import { Button } from "@/components/ui/button";

const FLOATING_NOTES = [
  {
    body: "You changed the direction of my twenties with one conversation on a fire escape.",
    from: "Jules",
    className: "left-[-2rem] top-4 w-[19rem] rotate-[-5deg]",
    delay: 0.5,
  },
  {
    body: "Thank you for the airport run. And the one before that. And the one before that.",
    from: "Marisol",
    className: "right-[-1rem] top-32 w-[17rem] rotate-[4deg]",
    delay: 0.7,
  },
  {
    body: "I am not good at this sort of thing, so plainly: I am proud of you.",
    from: "Dad",
    className: "bottom-2 left-10 w-[16rem] rotate-[2.5deg]",
    delay: 0.9,
  },
];

export function Hero({ signedIn }: { signedIn: boolean }) {
  const reduce = useReducedMotion();

  return (
    <section className="relative grain overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-36 lg:pb-36 lg:pt-44">
      <div className="pointer-events-none absolute inset-0 press-grid" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] ember-bloom" aria-hidden />

      <div className="container relative">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          {/* ---- Copy column ---- */}
          <div className="max-w-xl">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="label inline-flex items-center gap-2 rounded-full bg-ember-soft px-3 py-1.5 text-ember-ink"
            >
              <Sparkles className="size-3" aria-hidden />
              No account needed to write to you
            </motion.p>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-6 font-display text-[2.75rem] leading-[1.02] tracking-tightest text-ink sm:text-6xl lg:text-[4.25rem]"
            >
              Every kind word
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">someone ever</span>
                <svg
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-ember/35"
                >
                  <path
                    d="M2 8c60-5 120-6 180-4s80 4 116 2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              meant to tell you.
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 max-w-lg text-pretty text-[1.0625rem] leading-relaxed text-quiet"
            >
              Echoes gives you one link. Share it anywhere and anyone —
              friends, family, people you have never met — can leave you a
              message. No sign-up, no app, no awkwardness. Every message is
              yours, kept forever, in a vault only you can open.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-9"
            >
              {signedIn ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Open my vault
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <ClaimField />
              )}
            </motion.div>

            <motion.ul
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-faint"
            >
              <li className="flex items-center gap-1.5">
                <Mic className="size-3.5" aria-hidden />
                Voice notes
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="size-3.5" aria-hidden />
                Sealed until a date you choose
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-sage" aria-hidden />
                Free to start
              </li>
            </motion.ul>
          </div>

          {/* ---- Letters column ---- */}
          <div className="relative hidden h-[30rem] lg:block" aria-hidden>
            {FLOATING_NOTES.map((note) => (
              <motion.figure
                key={note.from}
                initial={reduce ? false : { opacity: 0, y: 26, rotate: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: note.delay, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduce ? undefined : { rotate: 0, y: -6, scale: 1.02 }}
                className={`grain absolute rounded-xl border border-ink/[0.08] bg-surface p-6 shadow-lift ${note.className}`}
              >
                <blockquote className="font-display text-[1.0625rem] leading-relaxed text-ink">
                  &ldquo;{note.body}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-2 font-mono text-xs text-faint">
                  <span className="h-px w-5 bg-ink/20" />
                  {note.from}
                </figcaption>
              </motion.figure>
            ))}

            {/* The wax seal, resting in the clear space below the letters. */}
            <motion.div
              initial={reduce ? false : { scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute bottom-6 right-14 z-10 flex size-16 items-center justify-center rounded-full bg-ember text-white shadow-seal animate-ember-pulse"
            >
              <span className="font-display text-2xl font-semibold">E</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
