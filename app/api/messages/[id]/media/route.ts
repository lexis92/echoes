import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, notFound, ok, unauthorized } from "@/lib/api";
import { BUCKET_MEDIA } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60 * 10;

/**
 * GET /api/messages/:id/media?kind=image|voice
 *
 * Attachments live in a private bucket. The recipient — and only the recipient
 * — gets a short-lived signed URL, minted per request.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kind = request.nextUrl.searchParams.get("kind");
  if (kind !== "image" && kind !== "voice") {
    return fail(400, "bad_request", "Ask for either an image or a voice note.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  // RLS keeps a sealed message out of this result until it unlocks.
  const { data: message } = await supabase
    .from("messages")
    .select("id, image_path, voice_path")
    .eq("id", id)
    .eq("recipient_id", user.id)
    .maybeSingle();

  if (!message) return notFound("That message is not in your vault.");

  const path = kind === "image" ? message.image_path : message.voice_path;
  if (!path) return notFound("There is no attachment of that kind here.");

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET_MEDIA)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error("[media] signing failed", error);
    return fail(500, "server_error", "That attachment could not be opened.");
  }

  return ok({ url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
}
