import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, invalid, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { messagePatchSchema } from "@/lib/validation";
import { BUCKET_MEDIA } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/messages/:id — favourite, archive, read, move, restore. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await readJson(request);
  const parsed = messagePatchSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  const { restore, ...fields } = parsed.data;
  const patch = restore ? { ...fields, deleted_at: null } : fields;

  const { data, error } = await supabase
    .from("messages")
    .update(patch)
    .eq("id", id)
    .eq("recipient_id", user.id)
    .select("id, is_favorite, is_archived, is_read, folder_id, deleted_at")
    .maybeSingle();

  if (error) {
    console.error("[messages] patch failed", error);
    return serverError("That change did not stick. Try again?");
  }
  if (!data) return notFound("That message is not in your vault.");

  return ok(data);
}

/**
 * DELETE /api/messages/:id
 *
 * Soft-deletes by default: the message goes to Trash for 30 days, because
 * "delete" on something irreplaceable should be undoable. `?permanent=1`
 * removes the row and its attachments for good.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const permanent = request.nextUrl.searchParams.get("permanent") === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  if (!permanent) {
    const { data, error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) return serverError();
    if (!data) return notFound("That message is not in your vault.");
    return ok({ id, deleted: "soft" });
  }

  // Permanent: clear the attachments first, then the row.
  const { data: message } = await supabase
    .from("messages")
    .select("id, image_path, voice_path")
    .eq("id", id)
    .eq("recipient_id", user.id)
    .maybeSingle();

  if (!message) return notFound("That message is not in your vault.");

  const paths = [message.image_path, message.voice_path].filter(Boolean) as string[];
  if (paths.length) {
    const admin = createAdminClient();
    const { error: storageError } = await admin.storage.from(BUCKET_MEDIA).remove(paths);
    if (storageError) {
      console.error("[messages] attachment removal failed", storageError);
    }
  }

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) {
    console.error("[messages] permanent delete failed", error);
    return fail(500, "server_error", "We could not delete that. Try again?");
  }

  return ok({ id, deleted: "permanent" });
}
