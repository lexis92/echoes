/**
 * A deliberately small, opt-in profanity filter.
 *
 * Echoes is a place for heartfelt messages, and heartfelt messages sometimes
 * swear. So this never blocks a message — when a recipient turns the filter on
 * we mask the word in previews and mark the message, and the full text is
 * always one click away. Aggressive filtering would mangle real sentiment
 * ("that was a hell of a year for me") far more often than it would help.
 */
const TERMS = [
  "arse", "arsehole", "asshole", "bastard", "bitch", "bollocks", "bullshit",
  "cock", "cunt", "dickhead", "douche", "fag", "faggot", "fuck", "fucker",
  "fucking", "goddamn", "jackass", "motherfucker", "nigga", "nigger", "prick",
  "pussy", "retard", "shit", "shithead", "slut", "twat", "wanker", "whore",
];

/** Leet-speak folding so `f*ck` and `fu3k` are still caught. */
function normalise(word: string) {
  return word
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[3€]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z]/g, "");
}

const TERM_SET = new Set(TERMS);

export function containsProfanity(text: string): boolean {
  return text
    .split(/\s+/)
    .some((word) => TERM_SET.has(normalise(word)));
}

export function profanityHits(text: string): string[] {
  const hits = new Set<string>();
  for (const word of text.split(/\s+/)) {
    const n = normalise(word);
    if (TERM_SET.has(n)) hits.add(n);
  }
  return [...hits];
}

/** Masks the middle of each flagged word: `fuck` → `f••k`. */
export function maskProfanity(text: string): string {
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (!TERM_SET.has(normalise(token))) return token;
      const letters = token.replace(/[^\p{L}\p{N}]/gu, "");
      if (letters.length < 3) return "•".repeat(token.length);
      return `${letters[0]}${"•".repeat(letters.length - 2)}${letters[letters.length - 1]}`;
    })
    .join("");
}
