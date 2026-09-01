import { createAdminClient } from "@/lib/supabase/admin";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health — dependency probe for uptime checks and deploy gates. */
export async function GET() {
  const checks: Record<string, "ok" | "down" | "not_configured"> = {
    database: "down",
    email: process.env.RESEND_API_KEY ? "ok" : "not_configured",
    analytics: process.env.NEXT_PUBLIC_POSTHOG_KEY ? "ok" : "not_configured",
    ai: process.env.OPENAI_API_KEY ? "ok" : "not_configured",
    captcha: process.env.TURNSTILE_SECRET_KEY ? "ok" : "not_configured",
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" });
    checks.database = error ? "down" : "ok";
  } catch {
    checks.database = "down";
  }

  // Which sender mail actually leaves from, so you can tell a working setup from
  // one that will silently only reach your own inbox.
  const from = process.env.EMAIL_FROM?.trim();
  const email_sender = !process.env.RESEND_API_KEY
    ? "none"
    : from
      ? "custom_domain"
      : "resend_sandbox";

  const healthy = checks.database === "ok";
  return ok(
    { status: healthy ? "ok" : "degraded", checks, email_sender, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
