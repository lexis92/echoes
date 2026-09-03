import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, serverError } from "@/lib/api";
import { sendEmail } from "@/lib/email/resend";
import { newMessageEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/deliver — Vercel Cron entry point.
 *
 * Does the same job as the `deliver-scheduled` Supabase edge function; the two
 * are interchangeable, so a deployment can pick whichever scheduler it already
 * runs. Both are idempotent: `notified_at` is the guard.
 */
/** Compares without leaking the secret's length or a prefix match via timing. */
function matchesSecret(header: string, expected: string) {
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";

  // Fails closed. This endpoint sends mail to every pending recipient and
  // purges trash, so an unset secret must not mean "open to anyone" — that
  // lets a stranger drain the mail quota and replay deliveries at will. The
  // Supabase edge functions guard themselves the same way.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[cron] CRON_SECRET is not set, refusing to run. Set it in the hosting " +
          "environment; Vercel Cron sends it automatically as a bearer token."
      );
      return fail(503, "not_configured", "Scheduled delivery is not configured.");
    }
    console.warn("[cron] CRON_SECRET is not set — allowed only outside production.");
  } else if (!matchesSecret(auth, `Bearer ${secret}`)) {
    return fail(401, "unauthorized", "Bad cron credentials.");
  }

  try {
    const supabase = createAdminClient();

    const { data: pending, error } = await supabase.rpc("messages_pending_notification");
    if (error) {
      console.error("[cron] pending lookup failed", error);
      return serverError();
    }

    let notified = 0;
    for (const row of pending ?? []) {
      const mail = newMessageEmail({
        recipientName: row.name,
        senderName: row.sender_name,
        content: row.content,
        messageId: row.message_id,
      });

      const providerId = await sendEmail({ to: row.email, ...mail });

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

      notified += 1;
    }

    const { data: purged } = await supabase.rpc("purge_expired_trash", { retention_days: 30 });

    return ok({ notified, purged: purged ?? 0 });
  } catch (error) {
    console.error("[cron] deliver failed", error);
    return serverError();
  }
}
