import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitRule = { limit: number; windowSeconds: number };

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

/**
 * Durable, database-backed rate limiting.
 *
 * Serverless functions have no shared memory, so an in-process counter would
 * reset on every cold start. `check_rate_limit` records the hit and decides in
 * one round trip. If the check itself fails we fail open — an outage in the
 * limiter must not take down message delivery — but we log it loudly.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_identifier: identifier,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });

    if (error) {
      console.error("[rate-limit] check failed, failing open", bucket, error.message);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    return {
      allowed: data === true,
      retryAfterSeconds: data === true ? 0 : rule.windowSeconds,
    };
  } catch (error) {
    console.error("[rate-limit] unavailable, failing open", bucket, error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
