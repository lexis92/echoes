// Shared email helpers for Echoes edge functions (Deno runtime).
// Kept deliberately dependency-free: one fetch to the Resend REST API.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail(args: SendArgs): Promise<string | null> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  // onboarding@resend.dev needs no domain setup but only delivers to the address
  // that owns the Resend account. A blank EMAIL_FROM counts as unset.
  const from = Deno.env.get("EMAIL_FROM")?.trim() || "Echoes <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing — logging instead of sending", args.subject);
    return null;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      reply_to: args.replyTo,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    // The two failures that account for almost every broken email setup.
    if (/domain is not verified|not verified/i.test(detail)) {
      console.error(
        `[email] ${from} is not a verified sender on this Resend account. ` +
          `Verify the domain at resend.com/domains, or unset EMAIL_FROM to fall ` +
          `back to onboarding@resend.dev.`,
      );
    } else if (/testing emails|own email address/i.test(detail)) {
      console.error(
        `[email] Resend refused delivery to ${args.to}. onboarding@resend.dev ` +
          `only reaches the address that owns the Resend account. Verify a domain ` +
          `to email anyone else.`,
      );
    } else {
      console.error("[email] send failed", res.status, detail);
    }
    return null;
  }
  const json = await res.json();
  return json?.id ?? null;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The one email shell, so every message from Echoes looks like Echoes. */
export function layout(body: string, siteUrl: string) {
  return `<!doctype html><html><body style="margin:0;padding:32px 16px;background:#F6F1E8;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#191512;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#FFFDF9;border:1px solid rgba(25,21,18,0.08);border-radius:18px;overflow:hidden;">
      <tr><td style="padding:28px 28px 0;">
        <div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;color:#C74F23;">Echoes</div>
      </td></tr>
      <tr><td style="padding:16px 28px 28px;">${body}</td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid rgba(25,21,18,0.07);background:#FBF6EE;font-size:12px;color:#8D8174;">
        You are receiving this because someone left you a message on Echoes.
        <a href="${siteUrl}/settings" style="color:#C74F23;">Manage notifications</a>.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
