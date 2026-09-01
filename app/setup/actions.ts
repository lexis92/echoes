"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSetupSchema, fieldErrors } from "@/lib/validation";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";
import { captureServer } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

// `SetupState` and `initialSetupState` live in ./setup-state — a "use server"
// file may only export async functions.
import type { SetupState } from "./setup-state";

/**
 * Claims the username and marks onboarding complete. Runs for both the first
 * setup and later profile edits; the welcome email only goes out once.
 */
export async function completeSetupAction(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Your session expired. Sign in again." };

  const parsed = profileSetupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    bio: formData.get("bio") ?? "",
    avatar_url: formData.get("avatar_url") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Almost. Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  const firstTime = !existing?.onboarded_at;

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      username: parsed.data.username,
      bio: parsed.data.bio?.trim() || null,
      welcome_note: (formData.get("welcome_note") as string)?.trim() || null,
      avatar_url: parsed.data.avatar_url || null,
      onboarded_at: existing?.onboarded_at ?? new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Someone claimed that username a moment ago.",
        fields: { username: "Taken. Try another." },
      };
    }
    if (error.message.includes("username_reserved")) {
      return {
        status: "error",
        message: "That username is reserved.",
        fields: { username: "Reserved. Try another." },
      };
    }
    console.error("[setup] profile update failed", error);
    return { status: "error", message: "That did not save. Try again?" };
  }

  if (firstTime) {
    const mail = welcomeEmail({ name: parsed.data.name, username: parsed.data.username });
    await sendEmail({ to: user.email!, ...mail });
    await captureServer(user.id, ANALYTICS_EVENTS.profileSetupCompleted, {
      has_avatar: Boolean(parsed.data.avatar_url),
      has_bio: Boolean(parsed.data.bio?.trim()),
    });
  }

  revalidatePath("/", "layout");
  return { status: "success", username: parsed.data.username };
}
