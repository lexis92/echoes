/**
 * The analytics contract. Every event the product emits is named here so the
 * success metrics in the PRD map to something concrete:
 *
 *   Registrations        → `signup_completed`, `profile_setup_completed`
 *   Messages received    → `message_submitted`
 *   Shares               → `profile_link_shared`, `profile_link_copied`
 *   Returning users      → `dashboard_viewed` (with `days_since_signup`)
 *   Msgs per user        → `message_submitted` grouped by `recipient_id`
 *   DAU / retention      → PostHog derives these from any identified event
 */
export const ANALYTICS_EVENTS = {
  landingViewed: "landing_viewed",
  signupStarted: "signup_started",
  signupCompleted: "signup_completed",
  emailVerified: "email_verified",
  loginCompleted: "login_completed",
  profileSetupStarted: "profile_setup_started",
  profileSetupCompleted: "profile_setup_completed",
  profileLinkCopied: "profile_link_copied",
  profileLinkShared: "profile_link_shared",
  dashboardViewed: "dashboard_viewed",
  publicProfileViewed: "public_profile_viewed",
  messageComposeStarted: "message_compose_started",
  messageSubmitted: "message_submitted",
  messageSubmitFailed: "message_submit_failed",
  messageOpened: "message_opened",
  messageFavorited: "message_favorited",
  messageArchived: "message_archived",
  messageDeleted: "message_deleted",
  messageRestored: "message_restored",
  messageReported: "message_reported",
  messageSummarised: "message_summarised",
  searchPerformed: "search_performed",
  settingsUpdated: "settings_updated",
  accountDeleted: "account_deleted",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
