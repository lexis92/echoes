"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";

let initialised = false;

function init() {
  if (initialised || !KEY || typeof window === "undefined") return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // captured manually below, App Router aware
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: false, // explicit events only — kinder to a privacy-first product
    // Message text must never leave the vault.
    mask_all_text: false,
    before_send: (event) => {
      if (!event) return null;
      if (event.properties?.$current_url) {
        // Strip one-time auth tokens out of URLs before they are recorded.
        try {
          const url = new URL(String(event.properties.$current_url));
          ["token", "token_hash", "code", "access_token", "refresh_token"].forEach((p) =>
            url.searchParams.delete(p)
          );
          event.properties.$current_url = url.toString();
        } catch {
          /* leave as-is */
        }
      }
      return event;
    },
  });
  initialised = true;
}

function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!KEY) return;
    const qs = searchParams?.toString();
    posthog.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`,
    });
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    init();
  }, []);

  if (!KEY) return <>{children}</>;

  return (
    <Provider client={posthog}>
      <React.Suspense fallback={null}>
        <PageViews />
      </React.Suspense>
      {children}
    </Provider>
  );
}

/** Fire-and-forget client event. No-ops when PostHog is not configured. */
export function track(event: string, properties?: Record<string, unknown>) {
  if (!KEY || typeof window === "undefined") return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* analytics must never break the UI */
  }
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!KEY || typeof window === "undefined") return;
  try {
    posthog.identify(userId, traits);
  } catch {
    /* ignore */
  }
}

export function resetAnalytics() {
  if (!KEY || typeof window === "undefined") return;
  try {
    posthog.reset();
  } catch {
    /* ignore */
  }
}
