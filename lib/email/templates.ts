import { absoluteUrl } from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const INK = "#191512";
const PAPER = "#F6F1E8";
const SURFACE = "#FFFDF9";
const EMBER = "#C74F23";
const QUIET = "#5B5148";
const FAINT = "#8D8174";

function shell(body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;background:${PAPER};font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:${SURFACE};border:1px solid rgba(25,21,18,0.08);border-radius:18px;overflow:hidden;">
      <tr><td style="padding:28px 28px 0;">
        <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:${EMBER};">Echoes</div>
      </td></tr>
      <tr><td style="padding:16px 28px 28px;">${body}</td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid rgba(25,21,18,0.07);background:#FBF6EE;font-size:12px;color:${FAINT};line-height:1.6;">
        You are getting this because you have an Echoes vault.
        <a href="${absoluteUrl("/settings")}" style="color:${EMBER};text-decoration:underline;">Change what we email you</a>.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${INK};color:${PAPER};text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:500;">${label}</a>`;
}

export function newMessageEmail(args: {
  recipientName: string;
  senderName: string | null;
  content: string;
  messageId: string;
}) {
  const from = args.senderName ? escapeHtml(args.senderName) : "Someone";
  const preview = escapeHtml(args.content.slice(0, 180));
  const truncated = args.content.length > 180 ? "…" : "";
  const url = absoluteUrl(`/messages/${args.messageId}`);

  return {
    subject: `${args.senderName ?? "Someone"} left you a message`,
    text: `${from} left you a message on Echoes.\n\n"${args.content}"\n\nRead it: ${url}`,
    html: shell(
      `<h1 style="margin:0 0 6px;font-size:25px;font-weight:600;letter-spacing:-0.02em;">A new message</h1>
       <p style="margin:0 0 20px;color:${QUIET};line-height:1.6;">From <strong>${from}</strong></p>
       <blockquote style="margin:0 0 26px;padding:16px 18px;background:#FBF6EE;border-left:3px solid ${EMBER};border-radius:0 12px 12px 0;line-height:1.7;font-style:italic;">${preview}${truncated}</blockquote>
       ${button(url, "Read the whole thing")}`
    ),
  };
}

export function sealedMessageEmail(args: {
  recipientName: string;
  senderName: string | null;
  unlockAt: string;
}) {
  const when = new Date(args.unlockAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const from = args.senderName ? escapeHtml(args.senderName) : "Someone";

  return {
    subject: `${args.senderName ?? "Someone"} sealed a message for you`,
    text: `${from} left you a message sealed until ${when}. We will let you know the moment it opens.\n\n${absoluteUrl("/scheduled")}`,
    html: shell(
      `<h1 style="margin:0 0 6px;font-size:25px;font-weight:600;letter-spacing:-0.02em;">Something is waiting for you</h1>
       <p style="margin:0 0 22px;color:${QUIET};line-height:1.7;"><strong>${from}</strong> left you a message sealed until <strong>${when}</strong>. We will not show you a word of it before then — and we will email you the moment it opens.</p>
       ${button(absoluteUrl("/scheduled"), "See what is sealed")}`
    ),
  };
}

export function welcomeEmail(args: { name: string; username: string }) {
  const link = absoluteUrl(`/u/${args.username}`);
  return {
    subject: "Your Echoes link is ready",
    text: `Welcome to Echoes, ${args.name}.\n\nYour link: ${link}\n\nShare it anywhere. Anyone can leave you a message — no account needed — and it is yours to keep forever.`,
    html: shell(
      `<h1 style="margin:0 0 6px;font-size:25px;font-weight:600;letter-spacing:-0.02em;">Welcome, ${escapeHtml(args.name)}</h1>
       <p style="margin:0 0 18px;color:${QUIET};line-height:1.7;">Your vault is open. This is your link — share it anywhere, and anyone can leave you a message without making an account.</p>
       <p style="margin:0 0 26px;padding:14px 16px;background:#FBF6EE;border-radius:12px;font-family:ui-monospace,SFMono-Regular,monospace;font-size:14px;word-break:break-all;">${link}</p>
       ${button(absoluteUrl("/dashboard"), "Open your vault")}`
    ),
  };
}
