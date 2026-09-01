"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema, emailSchema, passwordSchema } from "@/lib/validation";
import { fieldErrors } from "@/lib/validation";
import { absoluteUrl } from "@/lib/utils";
import { captureServer } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

// `AuthState` and `initialAuthState` live in ./auth-state — a "use server"
// file may only export async functions.
import type { AuthState } from "./auth-state";

/**
 * Where Supabase should send people back to after clicking an email link.
 *
 * Built from the configured origin, not the request's Origin header. This link
 * is emailed, so it has to be the canonical address rather than whichever host
 * the request arrived on, and a header the client controls has no business
 * deciding where a confirmation link points. resolveSiteOrigin already handles
 * the local case, so there is nothing left for the header to cover.
 *
 * Supabase must also allow this exact URL under Authentication > URL
 * Configuration. An address that is not on that list is discarded silently and
 * the link falls back to Site URL, which is how these end up on localhost.
 */
function callbackUrl(next?: string) {
  const url = new URL("/auth/confirm", absoluteUrl("/"));
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

/**
 * Supabase reports every mail failure as "Error sending confirmation email",
 * which tells the person nothing they can act on and looks like their mistake.
 *
 * The cause is almost always the built-in email service: it is capped at two
 * messages an hour for the whole project and refuses any address that is not on
 * the project team. Custom SMTP is what lifts both limits.
 *
 * Returns a message for the screen, and logs the operator-facing detail. Null
 * when the error is not about sending mail.
 */
function describeMailFailure(message: string): string | null {
  const reason = message.toLowerCase();
  const isMailFailure =
    reason.includes("sending confirmation email") ||
    reason.includes("sending email") ||
    reason.includes("error sending") ||
    reason.includes("email address not authorized") ||
    reason.includes("smtp");

  if (!isMailFailure) return null;

  console.error(
    `[auth] Supabase could not send the confirmation email: "${message}". ` +
      `Its built-in sender allows 2 messages an hour across the project and ` +
      `only delivers to project team members. Configure custom SMTP under ` +
      `Authentication > Emails > SMTP Settings (smtp.resend.com:465, user ` +
      `"resend", password = RESEND_API_KEY). Note this is Supabase's own mail, ` +
      `separate from RESEND_API_KEY in this app, which only covers notifications.`
  );

  if (reason.includes("not authorized")) {
    return "We could not send your confirmation email, so sign-up did not finish. The mail service is not set up to reach that address yet.";
  }
  return "We could not send your confirmation email, so sign-up did not finish. This is a problem on our end, not something you did. Try again in an hour, or tell the person running this vault.";
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
      emailRedirectTo: callbackUrl("/setup"),
    },
  });

  if (error) {
    // Supabase deliberately does not reveal whether an address is registered.
    if (error.message.toLowerCase().includes("already")) {
      return { status: "error", message: "There is already an account with that email. Try signing in." };
    }
    return { status: "error", message: describeMailFailure(error.message) ?? error.message };
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
    const reason = error.message.toLowerCase();

    if (reason.includes("email not confirmed")) {
      redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    }

    // Genuine bad credentials. Deliberately generic: saying "no such account"
    // would let anyone test whether an address is registered here.
    if (reason.includes("invalid login credentials") || error.status === 400) {
      return {
        status: "error",
        message: "That email and password do not match an account.",
      };
    }

    if (error.status === 429 || reason.includes("rate limit")) {
      return {
        status: "error",
        message: "Too many attempts. Wait a minute and try again.",
      };
    }

    // Anything else is our problem, not a wrong password. Previously every
    // failure — including database and configuration errors — was reported as
    // bad credentials, which made real faults impossible to diagnose.
    console.error("[auth] sign-in failed", {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message: `Sign-in is failing on our side, not yours (${error.message}). This has been logged.`,
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
    options: { emailRedirectTo: callbackUrl("/setup") },
  });

  if (error) {
    if (error.status === 429) {
      return { status: "error", message: "We just sent one. Give it a minute before asking again." };
    }
    return { status: "error", message: describeMailFailure(error.message) ?? error.message };
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
    redirectTo: callbackUrl("/settings?reset=1"),
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
