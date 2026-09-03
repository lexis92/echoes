import "server-only";

import { createHash } from "node:crypto";

/**
 * Best-effort client IP. Vercel sets `x-forwarded-for`; we take the first
 * entry, which is the closest thing to the real client behind the edge.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "0.0.0.0"
  );
}

export function clientCountry(headers: Headers): string | null {
  return headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? null;
}

/**
 * We never store a sender's raw IP. A salted hash is enough to rate limit and
 * to spot a repeat abuser, and it cannot be turned back into an address.
 */
let warnedAboutSalt = false;

export function hashIp(ip: string): string {
  // Trimmed, not ??: a hosting dashboard stores an empty value happily, and ??
  // would pass "" through as the salt. An unsalted hash of an IPv4 address is
  // reversible by brute force in seconds, which would defeat the whole point of
  // not storing the address.
  const configured = process.env.IP_HASH_SALT?.trim();
  if (!configured && process.env.NODE_ENV === "production" && !warnedAboutSalt) {
    warnedAboutSalt = true;
    console.warn(
      "[security] IP_HASH_SALT is not set. Sender IP hashes are using the " +
        "development salt, which is public in the source, so they can be " +
        "reversed. Set it in the hosting environment."
    );
  }
  const salt = configured || "echoes-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
