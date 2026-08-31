import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fail, notFound, ok, serverError, tooMany, unauthorized } from "@/lib/api";
import { aiEnabled, summariseMessage } from "@/lib/ai/summarize";
import { rateLimit } from "@/lib/security/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";
import { captureServer } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/messages/:id/summary
 *
 * Opt-in only: a recipient presses "Sum this up for me". Nothing is sent to
 * OpenAI in the background.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!aiEnabled()) {
    return fail(503, "ai_unavailable", "Summaries are switched off on this deployment.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const limit = await rateLimit("summary_user", user.id, RATE_LIMITS.summaryPerUser);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const { data: message } = await supabase
    .from("messages")
    .select("id, content, ai_summary, ai_tone")
    .eq("id", id)
    .eq("recipient_id", user.id)
    .maybeSingle();

  if (!message) return notFound("That message is not in your vault.");
  if (message.ai_summary) {
    return ok({ summary: message.ai_summary, tone: message.ai_tone, cached: true });
  }

  const result = await summariseMessage(message.content);
  if (!result) return serverError("The summary did not come back. Try again in a moment.");

  const { error } = await supabase
    .from("messages")
    .update({
      ai_summary: result.summary,
      ai_tone: result.tone,
      ai_generated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) {
    // The summary is still useful even if we could not cache it.
    console.error("[summary] cache write failed", error);
  }

  await captureServer(user.id, ANALYTICS_EVENTS.messageSummarised, { message_id: id });

  return ok({ ...result, cached: false });
}
