// =============================================================================
// deliver-scheduled
//
// Runs on a schedule (every 15 minutes). Three jobs:
//   1. Notify recipients about messages that have arrived or just unsealed,
//      for anyone on "instant" notifications.
//   2. Purge messages that have sat in the trash past the retention window.
//   3. Report how many seals are still pending, for observability.
//
// Invoke with the service-role key or a matching CRON_SECRET.
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { escapeHtml, layout, sendEmail } from "../_shared/email.ts";

const SITE_URL = Deno.env.get("SITE_URL")?.trim() || "http://localhost:3000";
// Number("") is 0, and retention 0 deletes everything currently in the trash
// rather than nothing, so an empty or junk value must not reach the purge.
const TRASH_RETENTION_DAYS = (() => {
  const raw = Deno.env.get("TRASH_RETENTION_DAYS")?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    if (raw) console.warn(`[cron] ignoring TRASH_RETENTION_DAYS="${raw}", using 30`);
    return 30;
  }
  return Math.floor(parsed);
})();

function authorised(req: Request) {
  const secret = Deno.env.get("CRON_SECRET");
  const header = req.headers.get("authorization") ?? "";
  // Guarded against empty: otherwise this compares against the literal
  // "Bearer " and anyone sending exactly that header is let straight in.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (serviceKey && header === `Bearer ${serviceKey}`) return true;
  return Boolean(secret) && header === `Bearer ${secret}`;
}

Deno.serve(async (req) => {
  if (!authorised(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: pending, error } = await supabase.rpc("messages_pending_notification");
  if (error) {
    console.error("[deliver-scheduled] rpc failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  for (const row of pending ?? []) {
    const from = row.sender_name ? escapeHtml(row.sender_name) : "Someone";
    const preview = escapeHtml(String(row.content).slice(0, 140));
    const heading = row.unlocked ? "A locked message just opened" : "You have a new message";

    const providerId = await sendEmail({
      to: row.email,
      subject: row.unlocked
        ? `A locked message from ${row.sender_name ?? "someone"} just opened`
        : `${row.sender_name ?? "Someone"} left you a message`,
      text: `${heading}\n\n${from}: ${row.content}\n\nRead it: ${SITE_URL}/messages/${row.message_id}`,
      html: layout(
        `<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;">${heading}</h1>
         <p style="margin:0 0 20px;color:#5B5148;line-height:1.6;">From <strong>${from}</strong></p>
         <blockquote style="margin:0 0 24px;padding:16px 18px;background:#FBF6EE;border-left:3px solid #C74F23;border-radius:0 10px 10px 0;color:#191512;line-height:1.65;font-style:italic;">${preview}${String(row.content).length > 140 ? "…" : ""}</blockquote>
         <a href="${SITE_URL}/messages/${row.message_id}" style="display:inline-block;background:#191512;color:#F6F1E8;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:500;">Read the whole thing</a>`,
        SITE_URL,
      ),
    });

    await supabase
      .from("messages")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", row.message_id);

    await supabase.from("notification_log").insert({
      user_id: row.recipient_id,
      message_id: row.message_id,
      kind: row.unlocked ? "unlocked" : "new_message",
      provider_id: providerId,
    });

    sent += 1;
  }

  const { data: purged } = await supabase.rpc("purge_expired_trash", {
    retention_days: TRASH_RETENTION_DAYS,
  });

  return new Response(JSON.stringify({ ok: true, notified: sent, purged: purged ?? 0 }), {
    headers: { "content-type": "application/json" },
  });
});
