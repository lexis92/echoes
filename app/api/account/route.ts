import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, serverError, unauthorized } from "@/lib/api";
import { BUCKET_AVATARS, BUCKET_MEDIA } from "@/lib/constants";
import { captureServer } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * DELETE /api/account — irreversible account deletion.
 *
 * Requires the user to type their username as confirmation. Removes storage
 * objects first (they are not covered by the database cascade), then the auth
 * user, which cascades to the profile, messages and folders.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const confirmation = request.nextUrl.searchParams.get("confirm")?.trim().toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return serverError("We could not find your profile.");
  if (confirmation !== profile.username) {
    return fail(
      400,
      "confirmation_mismatch",
      "Type your username exactly to confirm deletion."
    );
  }

  const admin = createAdminClient();

  for (const bucket of [BUCKET_MEDIA, BUCKET_AVATARS]) {
    const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
    if (files?.length) {
      await admin.storage
        .from(bucket)
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }
  }

  await captureServer(user.id, ANALYTICS_EVENTS.accountDeleted, {});

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account] delete failed", error);
    return serverError("We could not delete the account. Please contact support.");
  }

  await supabase.auth.signOut();
  return ok({ deleted: true });
}
