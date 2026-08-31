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
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "echoes-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
