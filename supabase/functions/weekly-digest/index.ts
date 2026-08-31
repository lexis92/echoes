// =============================================================================
// weekly-digest
//
// Sends the batched digest for recipients who chose "daily" or "weekly"
// instead of instant notifications. Scheduled daily; the weekly cohort is only
// included on Mondays.
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";
import { escapeHtml, layout, sendEmail } from "../_shared/email.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

function authorised(req: Request) {
  const secret = Deno.env.get("CRON_SECRET");
  const header = req.headers.get("authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (header === `Bearer ${serviceKey}`) return true;
  return Boolean(secret) && header === `Bearer ${secret}`;
}

Deno.serve(async (req) => {
  if (!authorised(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const isMonday = new Date().getUTCDay() === 1;
  const cohorts = isMonday ? ["daily", "weekly"] : ["daily"];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, email, digest_frequency")
    .eq("notify_email", true)
    .in("digest_frequency", cohorts);

  if (error) {
    console.error("[weekly-digest] profile query failed", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  for (const profile of profiles ?? []) {
    const since = new Date(
      Date.now() - (profile.digest_frequency === "weekly" ? 7 : 1) * 86_400_000,
    ).toISOString();

    const { data: messages } = await supabase
      .from("messages")
      .select("id, sender_name, content, created_at")
      .eq("recipient_id", profile.id)
      .is("deleted_at", null)
      .is("notified_at", null)
      .eq("moderation_status", "published")
      .or(`unlock_at.is.null,unlock_at.lte.${new Date().toISOString()}`)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(12);

    if (!messages?.length) continue;

    const items = messages
      .map(
        (m) =>
          `<li style="margin:0 0 14px;padding:14px 16px;background:#FBF6EE;border-radius:12px;list-style:none;">
             <div style="font-size:13px;color:#8D8174;margin-bottom:6px;">${escapeHtml(m.sender_name ?? "Someone")}</div>
             <div style="line-height:1.6;">${escapeHtml(String(m.content).slice(0, 160))}${String(m.content).length > 160 ? "…" : ""}</div>
           </li>`,
      )
      .join("");

    const count = messages.length;
    const providerId = await sendEmail({
      to: profile.email,
      subject: `${count} new ${count === 1 ? "message" : "messages"} in your vault`,
      text: messages
        .map((m) => `${m.sender_name ?? "Someone"}: ${m.content}`)
        .join("\n\n") + `\n\nRead them: ${SITE_URL}/inbox`,
      html: layout(
        `<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;">${count} new ${count === 1 ? "message" : "messages"}</h1>
         <p style="margin:0 0 20px;color:#5B5148;line-height:1.6;">Here is what arrived while you were away, ${escapeHtml(profile.name || "friend")}.</p>
         <ul style="margin:0 0 24px;padding:0;">${items}</ul>
         <a href="${SITE_URL}/inbox" style="display:inline-block;background:#191512;color:#F6F1E8;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:500;">Open your vault</a>`,
        SITE_URL,
      ),
    });

    await supabase
      .from("messages")
      .update({ notified_at: new Date().toISOString() })
      .in("id", messages.map((m) => m.id));

    await supabase.from("notification_log").insert({
      user_id: profile.id,
      kind: profile.digest_frequency === "weekly" ? "weekly_digest" : "daily_digest",
      provider_id: providerId,
    });

    sent += 1;
  }

  return new Response(JSON.stringify({ ok: true, digests: sent }), {
    headers: { "content-type": "application/json" },
  });
});
