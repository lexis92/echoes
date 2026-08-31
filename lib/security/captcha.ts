import "server-only";

/**
 * Cloudflare Turnstile verification.
 *
 * Chosen over reCAPTCHA because it is free, needs no cookie banner in the EU
 * and is usually invisible — which matters when the person solving it is a
 * grandparent leaving a message from a phone.
 *
 * When no secret is configured (local development, preview branches) the check
 * is skipped and reported as such, rather than silently passing in production.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type CaptchaResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
};

export async function verifyCaptcha(
  token: string | undefined | null,
  remoteIp?: string
): Promise<CaptchaResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[captcha] TURNSTILE_SECRET_KEY is not set in production");
    }
    return { ok: true, skipped: true, reason: "not_configured" };
  }

  if (!token) return { ok: false, skipped: false, reason: "missing_token" };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(6000),
    });

    const json = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    return {
      ok: json.success === true,
      skipped: false,
      reason: json["error-codes"]?.join(",") ?? undefined,
    };
  } catch (error) {
    console.error("[captcha] verification error", error);
    // A Turnstile outage should not silently open the door in production.
    return {
      ok: process.env.NODE_ENV !== "production",
      skipped: false,
      reason: "verification_unavailable",
    };
  }
}

export const captchaEnabled = () => Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
