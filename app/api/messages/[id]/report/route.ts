import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invalid, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { reportSchema } from "@/lib/validation";
import { captureServer } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/messages/:id/report — flag abuse. Filing a report also archives
 * the message, so the recipient does not have to see it again while it is
 * being looked at.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const parsed = reportSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { data: message } = await supabase
    .from("messages")
    .select("id")
    .eq("id", id)
    .eq("recipient_id", user.id)
    .maybeSingle();
  if (!message) return notFound("That message is not in your vault.");

  const { error } = await supabase.from("message_reports").insert({
    message_id: id,
    reporter_id: user.id,
    reason: parsed.data.reason,
    note: parsed.data.note || null,
  });

  if (error) {
    console.error("[report] insert failed", error);
    return serverError("We could not file that report. Try again?");
  }

  await supabase
    .from("messages")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("recipient_id", user.id);

  await captureServer(user.id, ANALYTICS_EVENTS.messageReported, {
    message_id: id,
    reason: parsed.data.reason,
  });

  return ok({ reported: true });
}
