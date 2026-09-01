import "server-only";

import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Sends through Resend. Email is never on the critical path of a request — a
 * failure is logged and swallowed so a sender's message is still saved.
 */
export async function sendEmail(args: SendEmailArgs): Promise<string | null> {
  const resend = getClient();
  // Resend gives every account this address to send from without owning a
  // domain. It only delivers to the address that owns the Resend account,
  // which is enough for a personal vault. Point EMAIL_FROM at your own domain
  // once you have verified one, and mail can reach anybody.
  // A blank EMAIL_FROM is treated as unset: hosting dashboards happily store an
  // empty value, and "" is not a sender Resend can do anything with.
  const from = process.env.EMAIL_FROM?.trim() || "Echoes <onboarding@resend.dev>";

  if (!resend) {
    console.info("[email] RESEND_API_KEY not set — would have sent:", args.subject, "→", args.to);
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
    });
    if (error) {
      const detail = String(error.message ?? error);
      // The two failures that account for almost every broken email setup.
      if (/domain is not verified|not verified/i.test(detail)) {
        console.error(
          `[email] ${from} is not a verified sender on this Resend account. ` +
            `Either verify the domain at resend.com/domains, or unset EMAIL_FROM ` +
            `to fall back to onboarding@resend.dev.`
        );
      } else if (/testing emails|own email address/i.test(detail)) {
        console.error(
          `[email] Resend refused delivery to ${args.to}. Sending from ` +
            `onboarding@resend.dev only reaches the address that owns the Resend ` +
            `account. Verify a domain to email anyone else.`
        );
      } else {
        console.error("[email] send failed", detail);
      }
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.error("[email] send threw", error);
    return null;
  }
}
