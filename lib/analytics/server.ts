import "server-only";

import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/**
 * Server-side capture, used for events that happen without a browser —
 * anonymous message submissions, cron deliveries, moderation decisions.
 * Never send message content.
 */
export async function captureServer(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const posthog = getClient();
  if (!posthog) return;
  try {
    posthog.capture({ distinctId, event, properties });
    await posthog.flush();
  } catch (error) {
    console.error("[analytics] server capture failed", error);
  }
}
