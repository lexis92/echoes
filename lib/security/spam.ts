/**
 * Heuristic spam scoring for anonymous submissions.
 *
 * Deliberately transparent rather than clever: every signal is explainable, so
 * a recipient reviewing a held message can see exactly why it was held. Scores
 * land in [0, 1]; >= 0.7 holds the message for review instead of dropping it,
 * because a false positive on a heartfelt message is much worse than a spam
 * message sitting in a review queue.
 */
export const SPAM_HOLD_THRESHOLD = 0.7;

const URL_RE = /\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+/gi;
const SHOUTY_RE = /[A-Z]{6,}/;
const REPEATED_CHARS_RE = /(.)\1{6,}/;

const BAIT_PHRASES = [
  "click here", "free money", "crypto", "bitcoin", "forex", "investment opportunity",
  "seo services", "buy followers", "make money fast", "limited offer", "act now",
  "viagra", "casino", "betting", "loan approved", "work from home", "telegram me",
  "whatsapp me", "guaranteed income", "double your", "gift card", "wire transfer",
];

export type SpamAssessment = {
  score: number;
  reasons: string[];
  hold: boolean;
};

export function assessSpam(input: {
  content: string;
  senderName?: string | null;
  elapsedMs?: number;
  honeypotFilled?: boolean;
  hasAttachment?: boolean;
}): SpamAssessment {
  const reasons: string[] = [];
  let score = 0;

  const text = input.content ?? "";
  const lower = text.toLowerCase();

  // A filled honeypot is decisive on its own.
  if (input.honeypotFilled) {
    return { score: 1, reasons: ["honeypot"], hold: true };
  }

  const urls = text.match(URL_RE) ?? [];
  if (urls.length === 1) {
    score += 0.2;
    reasons.push("contains_link");
  } else if (urls.length > 1) {
    score += 0.4;
    reasons.push("multiple_links");
  }

  const baitHits = BAIT_PHRASES.filter((p) => lower.includes(p));
  if (baitHits.length) {
    score += Math.min(0.5, 0.25 * baitHits.length);
    reasons.push(`bait:${baitHits.slice(0, 3).join("|")}`);
  }

  if (SHOUTY_RE.test(text) && text.length > 40) {
    const caps = text.replace(/[^A-Z]/g, "").length / Math.max(1, text.replace(/\s/g, "").length);
    if (caps > 0.5) {
      score += 0.2;
      reasons.push("shouting");
    }
  }

  if (REPEATED_CHARS_RE.test(text)) {
    score += 0.15;
    reasons.push("repeated_characters");
  }

  // Submitted implausibly fast for something that had to be typed.
  if (typeof input.elapsedMs === "number" && input.elapsedMs < 2500 && text.length > 120) {
    score += 0.35;
    reasons.push("submitted_too_fast");
  }

  // Very short and link-only.
  if (text.trim().length < 25 && urls.length > 0) {
    score += 0.25;
    reasons.push("link_only");
  }

  // A name that is itself a URL or an email address.
  if (input.senderName && (URL_RE.test(input.senderName) || input.senderName.includes("@"))) {
    score += 0.3;
    reasons.push("name_looks_like_contact");
  }

  // Warmth is a genuine negative signal — real messages talk to a person.
  if (/\b(you|your|thank|thanks|miss|love|remember|proud)\b/i.test(text) && urls.length === 0) {
    score -= 0.15;
  }

  const clamped = Math.max(0, Math.min(1, Number(score.toFixed(3))));
  return {
    score: clamped,
    reasons,
    hold: clamped >= SPAM_HOLD_THRESHOLD,
  };
}
