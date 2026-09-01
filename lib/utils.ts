import { format, formatDistanceToNowStrict, isThisYear, isToday, isYesterday } from "date-fns";

/** Relative for anything recent, absolute once it stops being "recent". */
export function timeAgo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 7 * 24 * 3600_000) return `${formatDistanceToNowStrict(d)} ago`;
  return isThisYear(d) ? format(d, "d MMM") : format(d, "d MMM yyyy");
}

export function fullDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEEE d MMMM yyyy 'at' HH:mm");
}

export function dayLabel(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return isThisYear(d) ? format(d, "d MMMM") : format(d, "d MMMM yyyy");
}

export function countdownTo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return "unlocking now";
  return `in ${formatDistanceToNowStrict(d)}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** First N characters on a word boundary, for previews. */
export function excerpt(text: string, max = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max)}…`;
}

export function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${n.toLocaleString()} ${n === 1 ? singular : plural}`;
}

/** Deterministic 0..n-1 bucket from a string — used for card tilt/colour. */
export function hashIndex(input: string, buckets: number) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h) % buckets;
}

/**
 * The origin every absolute link is built from.
 *
 * Deliberately defensive. `??` is not enough here: an environment variable that
 * is *defined but empty* — which is what an unset `NEXT_PUBLIC_*` can inline to
 * at build time, and what an empty box in a hosting dashboard produces — passes
 * a null-check and then yields a relative "/" that throws `ERR_INVALID_URL`
 * inside `new URL()`. That failure surfaces during `next build` as an opaque
 * "Failed to collect configuration", so it is worth handling properly.
 *
 * Each candidate is trimmed, given a scheme if it lacks one, and parsed before
 * being accepted; anything unusable is skipped rather than propagated.
 */
function resolveSiteOrigin(): string {
  const candidates = [
    // An explicit setting always wins, and because it is NEXT_PUBLIC_* it is
    // inlined into the browser bundle too, so server and client agree.
    process.env.NEXT_PUBLIC_SITE_URL,

    // In the browser, the address bar is the truth. This matters: the two
    // variables below are server-only — Next.js inlines nothing but
    // NEXT_PUBLIC_* into the client bundle — so without this every URL built
    // inside a client component (share links, the profile preview, the handle
    // picker) fell back to localhost in production.
    typeof window !== "undefined" ? window.location.origin : undefined,

    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    // Set on every Vercel build, including previews, where the production
    // domain does not exist yet.
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      // Malformed value — try the next candidate rather than failing the build.
    }
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path = "") {
  const origin = resolveSiteOrigin();
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function profileUrl(username: string) {
  return absoluteUrl(`/u/${username}`);
}

/** The share link as a human reads it, without the scheme. */
export function prettyProfileUrl(username: string) {
  return profileUrl(username).replace(/^https?:\/\//, "");
}
