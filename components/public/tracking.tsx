"use client";

import * as React from "react";
import { track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

/** Counts profile views, which is how "shares" turn into a measurable funnel. */
export function PublicPageTracking({ username }: { username: string }) {
  React.useEffect(() => {
    track(ANALYTICS_EVENTS.publicProfileViewed, {
      username,
      referrer: typeof document !== "undefined" ? document.referrer || "direct" : "unknown",
    });
  }, [username]);

  return null;
}
