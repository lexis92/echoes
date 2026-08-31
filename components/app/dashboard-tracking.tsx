"use client";

import * as React from "react";
import { differenceInCalendarDays } from "date-fns";
import { identify, track } from "@/lib/analytics/provider";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

/**
 * Identifies the user and fires the one event that retention and DAU are
 * derived from. Rendered once per dashboard visit.
 */
export function DashboardTracking({
  userId,
  username,
  createdAt,
  totalMessages,
}: {
  userId: string;
  username: string;
  createdAt: string;
  totalMessages: number;
}) {
  React.useEffect(() => {
    identify(userId, { username });
    track(ANALYTICS_EVENTS.dashboardViewed, {
      days_since_signup: differenceInCalendarDays(new Date(), new Date(createdAt)),
      total_messages: totalMessages,
    });
  }, [userId, username, createdAt, totalMessages]);

  return null;
}
