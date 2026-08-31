import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fail, invalid, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { folderSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/folders/:id — rename or recolour. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const parsed = folderSchema.partial().safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await supabase
    .from("folders")
    .update(parsed.data)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return fail(409, "duplicate_folder", "You already have a collection with that name.");
    }
    return serverError();
  }
  if (!data) return notFound("That collection is not yours.");
  return ok(data);
}

/**
 * DELETE /api/folders/:id — removes the collection only. Messages inside it
 * fall back to the inbox; deleting a shelf must never delete the letters.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return serverError();
  return ok({ id, deleted: true });
}
