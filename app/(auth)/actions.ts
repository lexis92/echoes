"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema, emailSchema, passwordSchema } from "@/lib/validation";
import { fieldErrors } from "@/lib/validation";
import { absoluteUrl } from "@/lib/utils";
import { captureServer } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

// `AuthState` and `initialAuthState` live in ./auth-state — a "use server"
// file may only export async functions.
import type { AuthState } from "./auth-state";

/** Where Supabase should send people back to after clicking an email link. */
async function callbackUrl(next?: string) {
  const origin = (await headers()).get("origin") ?? absoluteUrl("/");
  const url = new URL("/auth/confirm", origin);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Check the details below.", fields: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
        // Seeds `handle_new_user`, which reserves the closest free username.
        username: String(formData.get("handle") ?? "").trim().toLowerCase() || undefined,
      },
      emailRedirectTo: await callbackUrl("/setup"),
    },
  });

  if (error) {
    // Supabase deliberately does not reveal whether an address is registered.
    return {
      status: "error",
      message:
        error.message.toLowerCase().includes("already")
          ? "There is already an account with that email. Try signing in."
          : error.message,
    };
  }

  if (data.user) {
    await captureServer(data.user.id, ANALYTICS_EVENTS.signupCompleted, {
      method: "password",
    });
  }

  // With email confirmation on, there is no session yet — send them to the
  // "check your inbox" screen rather than a protected route.
  redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Check the details below.", fields: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    }
    return {
      status: "error",
      message: "That email and password do not match an account.",
    };
  }

  await captureServer(data.user.id, ANALYTICS_EVENTS.loginCompleted, { method: "password" });

  const next = String(formData.get("next") ?? "") || "/dashboard";
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function resendVerificationAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: "Enter the email you signed up with." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: await callbackUrl("/setup") },
  });

  if (error) {
    return {
      status: "error",
      message:
        error.status === 429
          ? "We just sent one — give it a minute before asking again."
          : error.message,
    };
  }

  return { status: "success", message: "Sent. It should land within a minute." };
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address.", fields: { email: "Enter a valid email address." } };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: await callbackUrl("/settings?reset=1"),
  });

  // Always the same answer, so this cannot be used to discover who has an account.
  return {
    status: "success",
    message: "If that address has an account, a reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "That password will not do.",
      fields: { password: parsed.error.issues[0]?.message ?? "" },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });

  if (error) return { status: "error", message: error.message };
  return { status: "success", message: "Password updated." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
