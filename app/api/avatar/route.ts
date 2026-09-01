import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { ACCEPTED_IMAGE_TYPES, AVATAR_MAX_BYTES, BUCKET_AVATARS } from "@/lib/constants";
import { processImage } from "@/lib/media/process-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};

/** POST /api/avatar — the signed-in user replaces their own avatar. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "bad_request", "That upload could not be read.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "bad_request", "No file was attached.");

  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return fail(415, "unsupported_type", "Use a JPG, PNG, WebP, GIF or HEIC.");
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return fail(413, "file_too_large", "Keep your photo under 3 MB.");
  }

  // Avatars are public, so stripping EXIF matters even more here.
  const processed = await processImage(await file.arrayBuffer());
  if (!processed) {
    return fail(422, "unreadable_image", "We couldn't read that image. Try a JPG or PNG.");
  }

  const path = `${user.id}/avatar-${Date.now()}.${processed.extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_AVATARS)
    .upload(path, processed.buffer, {
      contentType: processed.contentType,
      upsert: true,
    });

  if (error) {
    console.error("[avatar] upload failed", error);
    return serverError("That photo could not be uploaded. Try again?");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(path);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profileError) {
    console.error("[avatar] profile update failed", profileError);
    return serverError("The photo uploaded but we could not save it to your profile.");
  }

  return ok({ avatarUrl: publicUrl }, { status: 201 });
}

/** DELETE /api/avatar — go back to initials. */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return serverError();
  return ok({ avatarUrl: null });
}
