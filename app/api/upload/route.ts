import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, serverError, tooMany } from "@/lib/api";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp, hashIp } from "@/lib/security/ip";
import { usernameSchema } from "@/lib/validation";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_IMAGE_TYPES,
  BUCKET_MEDIA,
  IMAGE_MAX_BYTES,
  RATE_LIMITS,
  VOICE_MAX_BYTES,
} from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
};

/**
 * POST /api/upload — anonymous attachment upload from the public page.
 *
 * The file goes straight into the private bucket under the recipient's prefix
 * using the service role; the browser never receives a storage credential. The
 * returned path is then attached to the message on submit, and the submit
 * endpoint re-checks that the prefix matches the recipient.
 */
export async function POST(request: NextRequest) {
  const ipHash = hashIp(clientIp(request.headers));
  const limit = await rateLimit("upload_ip", ipHash, RATE_LIMITS.uploadPerIp);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "bad_request", "That upload could not be read.");
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  const usernameRaw = String(form.get("username") ?? "");

  if (!(file instanceof File)) return fail(400, "bad_request", "No file was attached.");
  if (kind !== "image" && kind !== "voice") {
    return fail(400, "bad_request", "Unsupported attachment type.");
  }

  const username = usernameSchema.safeParse(usernameRaw);
  if (!username.success) return fail(400, "bad_request", "Unknown profile.");

  const allowedTypes: readonly string[] =
    kind === "image" ? ACCEPTED_IMAGE_TYPES : ACCEPTED_AUDIO_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return fail(
      415,
      "unsupported_type",
      kind === "image"
        ? "Photos need to be a JPG, PNG, WebP, GIF or HEIC."
        : "Voice notes need to be a WebM, OGG, MP3, M4A or WAV."
    );
  }

  const maxBytes = kind === "image" ? IMAGE_MAX_BYTES : VOICE_MAX_BYTES;
  if (file.size > maxBytes) {
    return fail(
      413,
      "file_too_large",
      `That file is too big. Keep it under ${Math.round(maxBytes / 1024 / 1024)} MB.`
    );
  }

  const supabase = createAdminClient();

  const { data: profiles } = await supabase.rpc("get_public_profile", {
    handle: username.data,
  });
  const profile = profiles?.[0];
  if (!profile) return fail(404, "profile_not_found", "That link does not belong to anyone.");
  if (!profile.accepting_messages) {
    return fail(403, "not_accepting", `${profile.name} has paused new messages for now.`);
  }
  if (kind === "image" && !profile.allow_images) {
    return fail(403, "images_disabled", "This profile is not accepting photos.");
  }
  if (kind === "voice" && !profile.allow_voice) {
    return fail(403, "voice_disabled", "This profile is not accepting voice notes.");
  }

  const extension = EXTENSIONS[file.type] ?? "bin";
  const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_MEDIA)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[upload] storage write failed", error);
    return serverError("That file could not be uploaded. Try again?");
  }

  return ok({ path, kind, size: file.size, contentType: file.type }, { status: 201 });
}
