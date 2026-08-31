import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Email confirmation and recovery links land here with a `token_hash`.
 * Verifying it establishes the session, then we forward to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/setup";
  const safeNext = next.startsWith("/") ? next : "/setup";

  // Supabase also returns `code` for some flows — hand those to /auth/callback.
  const code = searchParams.get("code");
  if (!tokenHash && code) {
    const url = new URL("/auth/callback", origin);
    url.searchParams.set("code", code);
    url.searchParams.set("next", safeNext);
    return NextResponse.redirect(url);
  }

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error("[auth] otp verification failed", error.message);
    return NextResponse.redirect(`${origin}/verify-email?error=link_expired`);
  }

  const url = new URL(safeNext, origin);
  if (type === "signup" || type === "email") url.searchParams.set("verified", "1");
  return NextResponse.redirect(url);
}
