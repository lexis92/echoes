import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fail, invalid, ok, readJson, serverError, unauthorized } from "@/lib/api";
import { folderSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/folders — the signed-in user's collections. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("owner_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return serverError();
  return ok({ folders: data ?? [] });
}

/** POST /api/folders — create a collection. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const parsed = folderSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);

  const { count } = await supabase
    .from("folders")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if ((count ?? 0) >= 30) {
    return fail(400, "too_many_folders", "Thirty collections is plenty — tidy up first?");
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      color: parsed.data.color,
      position: count ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return fail(409, "duplicate_folder", "You already have a collection with that name.");
    }
    console.error("[folders] insert failed", error);
    return serverError();
  }

  return ok(data, { status: 201 });
}
