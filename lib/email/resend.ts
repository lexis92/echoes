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
  const from = process.env.EMAIL_FROM ?? "Echoes <hello@echoes.app>";

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
      console.error("[email] send failed", error);
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.error("[email] send threw", error);
    return null;
  }
}
