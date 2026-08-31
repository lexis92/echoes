"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema, folderSchema } from "@/lib/validation";
import { captureServer } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type { ProfileRow } from "@/lib/supabase/database.types";

export type SettingsResult = { ok: boolean; message?: string };

/**
 * Single entry point for every toggle and select on the settings screen.
 * Zod decides what is settable, so a crafted request cannot flip a column the
 * UI does not expose.
 */
export async function updateSettingsAction(
  patch: Partial<ProfileRow>
): Promise<SettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session expired. Sign in again." };

  const parsed = profileUpdateSchema.safeParse(patch);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That value is not allowed." };
  }

  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);

  if (error) {
    console.error("[settings] update failed", error);
    return { ok: false, message: "That did not save. Try again?" };
  }

  await captureServer(user.id, ANALYTICS_EVENTS.settingsUpdated, {
    keys: Object.keys(parsed.data),
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createFolderAction(formData: FormData): Promise<SettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session expired." };

  const parsed = folderSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? "neutral",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Give it a name." };
  }

  const { count } = await supabase
    .from("folders")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { error } = await supabase.from("folders").insert({
    owner_id: user.id,
    name: parsed.data.name,
    color: parsed.data.color,
    position: count ?? 0,
  });

  if (error) {
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "You already have a collection with that name."
          : "That collection could not be created.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/inbox");
  return { ok: true };
}

/** Deletes the collection only — the messages inside it stay in the vault. */
export async function deleteFolderAction(id: string): Promise<SettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session expired." };

  const { error } = await supabase.from("folders").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return { ok: false, message: "That collection could not be removed." };

  revalidatePath("/settings");
  revalidatePath("/inbox");
  return { ok: true };
}
