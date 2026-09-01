import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Routes that require a signed-in, fully onboarded account. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/messages",
  "/favorites",
  "/archive",
  "/scheduled",
  "/trash",
  "/settings",
];

/** Routes a signed-in user should not see again. */
const AUTH_ONLY_PREFIXES = ["/login", "/signup", "/reset-password"];

export async function updateSession(request: NextRequest) {
  // Without these the Supabase client constructor throws, and Vercel reports
  // the whole thing as an opaque MIDDLEWARE_INVOCATION_FAILED on every route
  // with no clue as to the cause. Say what is actually missing.
  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (missing.length) {
    console.error(
      `[config] Echoes cannot start: ${missing.join(" and ")} ${
        missing.length > 1 ? "are" : "is"
      } not set. Add ${missing.length > 1 ? "them" : "it"} in your hosting provider's environment variables and redeploy.`
    );
    return new NextResponse(
      `Echoes is not configured.\n\nMissing: ${missing.join(", ")}\n\n` +
        `Add these environment variables and redeploy.`,
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth token and keeps cookies in sync. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!user && (isProtected || pathname === "/setup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user) {
    if (AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Someone who has not claimed a username cannot use the vault yet, and
    // someone who has should not be sent back through setup.
    if (isProtected || pathname === "/setup") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", user.id)
        .maybeSingle();

      const onboarded = Boolean(profile?.onboarded_at);

      if (!onboarded && pathname !== "/setup") {
        const url = request.nextUrl.clone();
        url.pathname = "/setup";
        url.search = "";
        return NextResponse.redirect(url);
      }
      if (onboarded && pathname === "/setup" && !request.nextUrl.searchParams.has("edit")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
