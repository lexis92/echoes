import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ok, tooMany } from "@/lib/api";
import { usernameSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp, hashIp } from "@/lib/security/ip";
import { RATE_LIMITS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/username?u=maya — live availability for the setup screen. */
export async function GET(request: NextRequest) {
  const candidate = request.nextUrl.searchParams.get("u") ?? "";

  const limit = await rateLimit(
    "username_check",
    hashIp(clientIp(request.headers)),
    RATE_LIMITS.usernameCheckPerIp
  );
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const parsed = usernameSchema.safeParse(candidate);
  if (!parsed.success) {
    return ok({
      username: candidate.toLowerCase().trim(),
      available: false,
      reason: parsed.error.issues[0]?.message ?? "That username won't work.",
    });
  }

  // Ask as the signed-in user when there is one, so someone editing their
  // profile is not told their own current username is taken.
  const authed = await createClient();
  const {
    data: { user },
  } = await authed.auth.getUser();

  const client = user ? authed : createAdminClient();
  const { data, error } = await client.rpc("username_available", {
    candidate: parsed.data,
  });

  if (error) {
    console.error("[username] availability check failed", error);
    return ok({ username: parsed.data, available: false, reason: "Couldn't check right now." });
  }

  return ok({
    username: parsed.data,
    available: data === true,
    reason: data === true ? null : "Taken. Try another.",
  });
}
