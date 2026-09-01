"use client";

import { motion } from "framer-motion";
import { ImageIcon, Lock, MicVocal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SealedMessage } from "@/lib/supabase/database.types";
import { countdownTo, hashIndex } from "@/lib/utils";
import { format } from "date-fns";

const TILTS = ["-0.6deg", "0.45deg", "-0.3deg", "0.7deg"];

/**
 * A sealed message shows only its shape. The text genuinely never reaches the
 * browser — the database withholds it — so there is nothing to inspect.
 */
export function SealedCard({ message, index = 0 }: { message: SealedMessage; index?: number }) {
  const tilt = TILTS[hashIndex(message.id, TILTS.length)]!;
  const opensOn = new Date(message.unlock_at);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      style={{ rotate: tilt }}
      className="group relative grain overflow-hidden rounded-xl border border-dusk/25 bg-surface p-5 shadow-card transition-all duration-300 ease-paper hover:rotate-0 hover:shadow-lift"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, currentColor 0 2px, transparent 2px 9px)",
        }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-dusk-soft text-dusk">
            <Lock className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">
              {message.from_someone ? "A signed message" : "An anonymous message"}
            </p>
            <p className="font-mono text-[11px] text-faint">
              Written <time dateTime={message.created_at}>{format(new Date(message.created_at), "d MMM yyyy")}</time>
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-display text-lg tracking-tightest text-dusk">
            {countdownTo(message.unlock_at)}
          </p>
          <p className="font-mono text-[11px] text-faint">
            {format(opensOn, "d MMM yyyy, HH:mm")}
          </p>
        </div>
      </div>

      <p className="relative mt-4 text-[15px] italic leading-relaxed text-quiet">
        Nobody can read this yet, including you.
      </p>

      {(message.has_image || message.has_voice) && (
        <div className="relative mt-4 flex gap-1.5">
          {message.has_image && (
            <Badge tone="dusk">
              <ImageIcon />
              Has a photo
            </Badge>
          )}
          {message.has_voice && (
            <Badge tone="dusk">
              <MicVocal />
              Has a voice note
            </Badge>
          )}
        </div>
      )}
    </motion.article>
  );
}
