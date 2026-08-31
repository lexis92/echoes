"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock } from "lucide-react";

/**
 * The one true flourish in the product: the seal is pressed. It runs once, it
 * is short, and it respects `prefers-reduced-motion`.
 */
export function SentCelebration({ sealed }: { sealed: boolean }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex size-28 items-center justify-center" aria-hidden>
      {!reduce &&
        [0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            initial={{ scale: 0.6, opacity: 0.5 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{
              duration: 1.8,
              delay: 0.25 + ring * 0.28,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: 1.2,
            }}
            className="absolute inset-0 rounded-full border border-ember/40"
          />
        ))}

      <motion.div
        initial={reduce ? false : { scale: 0, rotate: -35 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative flex size-20 items-center justify-center rounded-full bg-ember text-white shadow-seal"
      >
        {sealed ? <Lock className="size-8" /> : <Check className="size-9" strokeWidth={2.5} />}
      </motion.div>
    </div>
  );
}
