import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, invalid, ok, readJson, serverError, tooMany } from "@/lib/api";
import { submitMessageSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyCaptcha } from "@/lib/security/captcha";
import { assessSpam } from "@/lib/security/spam";
import { clientCountry, clientIp, hashIp } from "@/lib/security/ip";
import { sendEmail } from "@/lib/email/resend";
import { newMessageEmail, sealedMessageEmail } from "@/lib/email/templates";
import { captureServer } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { RATE_LIMITS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/messages — the one endpoint an anonymous sender touches.
 *
 * Order matters: cheap local checks first, then the network round trips, then
 * the write. Nothing that fails after the insert (email, analytics) is allowed
 * to lose the message.
 */
export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const parsed = submitMessageSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  const input = parsed.data;
  const ip = clientIp(request.headers);
  const ipHash = hashIp(ip);

  // 1. Rate limit by sender IP.
  const ipLimit = await rateLimit("submit_ip", ipHash, RATE_LIMITS.submitMessagePerIp);
  if (!ipLimit.allowed) return tooMany(ipLimit.retryAfterSeconds);

  const supabase = createAdminClient();

  // 2. Resolve the recipient through the public view of a profile.
  const { data: profiles, error: profileError } = await supabase.rpc("get_public_profile", {
    handle: input.username,
  });
  if (profileError) {
    console.error("[messages] profile lookup failed", profileError);
    return serverError();
  }

  const profile = profiles?.[0];
  if (!profile) {
    return fail(404, "profile_not_found", "That link does not belong to anyone.");
  }
  if (!profile.accepting_messages) {
    return fail(
      403,
      "not_accepting",
      `${profile.name} has paused new messages for now.`
    );
  }
  if (profile.require_sender_name && !input.senderName?.trim()) {
    return fail(422, "name_required", `${profile.name} asks senders to leave a name.`);
  }
  if (input.imagePath && !profile.allow_images) {
    return fail(403, "images_disabled", "This profile is not accepting photos.");
  }
  if (input.voicePath && !profile.allow_voice) {
    return fail(403, "voice_disabled", "This profile is not accepting voice notes.");
  }
  if (input.unlockAt && !profile.allow_scheduled) {
    return fail(403, "scheduling_disabled", "This profile is not accepting locked messages.");
  }

  // 3. Rate limit per recipient, so one profile cannot be flooded from many IPs.
  const recipientLimit = await rateLimit(
    "submit_recipient",
    profile.id,
    RATE_LIMITS.submitMessagePerRecipient
  );
  if (!recipientLimit.allowed) return tooMany(recipientLimit.retryAfterSeconds);

  // 4. Uploaded media must live under this recipient's prefix — a sender
  //    cannot attach someone else's file by guessing a path.
  for (const path of [input.imagePath, input.voicePath]) {
    if (path && !path.startsWith(`${profile.id}/`)) {
      return fail(400, "invalid_attachment", "That attachment could not be verified.");
    }
  }

  // 5. CAPTCHA.
  const captcha = await verifyCaptcha(input.captchaToken, ip);
  if (!captcha.ok) {
    return fail(400, "captcha_failed", "That check did not pass. Please try again.");
  }

  // 6. Spam assessment. High scores are held for review, never silently dropped.
  const spam = assessSpam({
    content: input.content,
    senderName: input.senderName,
    elapsedMs: input.elapsedMs,
    honeypotFilled: Boolean(input.website?.trim()),
    hasAttachment: Boolean(input.imagePath || input.voicePath),
  });

  const unlockAt = input.unlockAt ? new Date(input.unlockAt).toISOString() : null;

  const { data: inserted, error: insertError } = await supabase
    .from("messages")
    .insert({
      recipient_id: profile.id,
      sender_name: input.senderName?.trim() || null,
      sender_email: input.senderEmail?.trim() || null,
      content: input.content,
      image_path: input.imagePath || null,
      voice_path: input.voicePath || null,
      voice_duration_seconds: input.voiceDurationSeconds ?? null,
      unlock_at: unlockAt,
      moderation_status: spam.hold ? "held" : "published",
      spam_score: spam.score,
      spam_reasons: spam.reasons,
      sender_ip_hash: ipHash,
      sender_country: clientCountry(request.headers),
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    })
    .select("id, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("[messages] insert failed", insertError);
    return serverError("We could not save that message. Please try again.");
  }

  // --- Past the point of no loss. Everything below is best effort. ---

  const shouldEmailNow =
    !spam.hold && !unlockAt && profile.accepting_messages;

  if (shouldEmailNow || (unlockAt && !spam.hold)) {
    // Only fetch the private fields we need for delivery, and only now.
    const { data: recipient } = await supabase
      .from("profiles")
      .select("email, name, notify_email, digest_frequency")
      .eq("id", profile.id)
      .single();

    if (recipient?.notify_email && recipient.digest_frequency !== "off") {
      if (unlockAt) {
        // A sealed message is announced immediately — the anticipation is the
        // point — but its contents stay sealed.
        const mail = sealedMessageEmail({
          recipientName: recipient.name,
          senderName: input.senderName?.trim() || null,
          unlockAt,
        });
        const providerId = await sendEmail({ to: recipient.email, ...mail });
        await supabase.from("notification_log").insert({
          user_id: profile.id,
          message_id: inserted.id,
          kind: "new_message",
          provider_id: providerId,
        });
      } else if (recipient.digest_frequency === "instant") {
        const mail = newMessageEmail({
          recipientName: recipient.name,
          senderName: input.senderName?.trim() || null,
          content: input.content,
          messageId: inserted.id,
        });
        const providerId = await sendEmail({ to: recipient.email, ...mail });
        await supabase
          .from("messages")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", inserted.id);
        await supabase.from("notification_log").insert({
          user_id: profile.id,
          message_id: inserted.id,
          kind: "new_message",
          provider_id: providerId,
        });
      }
    }
  }

  await captureServer(`anon:${ipHash.slice(0, 12)}`, ANALYTICS_EVENTS.messageSubmitted, {
    recipient_id: profile.id,
    recipient_username: profile.username,
    has_name: Boolean(input.senderName?.trim()),
    has_image: Boolean(input.imagePath),
    has_voice: Boolean(input.voicePath),
    is_scheduled: Boolean(unlockAt),
    content_length: input.content.length,
    spam_score: spam.score,
    held: spam.hold,
    captcha_skipped: captcha.skipped,
  });

  return ok(
    {
      id: inserted.id,
      status: spam.hold ? "held" : "delivered",
      scheduled: Boolean(unlockAt),
      unlockAt,
      recipientName: profile.name,
    },
    { status: 201 }
  );
}
