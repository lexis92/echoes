import { NextRequest } from "next/server";
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
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
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
