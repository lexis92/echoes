/** Product-wide constants. Keep limits in one place — API, UI and DB agree. */

export const APP_NAME = "Echoes";
export const APP_TAGLINE = "Every kind word, kept.";
export const APP_DESCRIPTION =
  "Echoes is a personal message vault. Share one link and anyone — no account needed — can leave you a message you keep forever.";

export const MESSAGE_MIN_LENGTH = 2;
export const MESSAGE_MAX_LENGTH = 5000;
export const SENDER_NAME_MAX_LENGTH = 60;
export const BIO_MAX_LENGTH = 280;
export const NAME_MAX_LENGTH = 60;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

export const AVATAR_MAX_BYTES = 3 * 1024 * 1024; // 3 MB
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const VOICE_MAX_BYTES = 12 * 1024 * 1024; // 12 MB
export const VOICE_MAX_SECONDS = 120;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
] as const;

export const ACCEPTED_AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-m4a",
] as const;

export const BUCKET_AVATARS = "avatars";
export const BUCKET_MEDIA = "message-media";

/** Usernames we never hand out — routes, support identities, abuse bait. */
export const RESERVED_USERNAMES = new Set([
  "about", "account", "admin", "api", "archive", "auth", "billing", "blog",
  "callback", "contact", "dashboard", "docs", "echoes", "favorites", "folder",
  "folders", "help", "home", "inbox", "legal", "login", "logout", "mail",
  "me", "message", "messages", "new", "null", "privacy", "profile", "public",
  "root", "scheduled", "search", "security", "settings", "setup", "share",
  "signin", "signup", "static", "support", "system", "team", "terms", "trash",
  "u", "undefined", "user", "users", "verify", "www",
]);

/** Rate limits, expressed as {limit} requests per {windowSeconds}. */
export const RATE_LIMITS = {
  /** Public message submission, per IP. */
  submitMessagePerIp: { limit: 5, windowSeconds: 60 * 10 },
  /** Public message submission, per recipient profile. */
  submitMessagePerRecipient: { limit: 30, windowSeconds: 60 * 10 },
  /** Anonymous media uploads, per IP. */
  uploadPerIp: { limit: 10, windowSeconds: 60 * 10 },
  /** Username availability checks, per IP. */
  usernameCheckPerIp: { limit: 60, windowSeconds: 60 },
  /** AI summary generation, per user. */
  summaryPerUser: { limit: 20, windowSeconds: 60 * 60 },
} as const;

export const DIGEST_FREQUENCIES = ["instant", "daily", "weekly", "off"] as const;
export type DigestFrequency = (typeof DIGEST_FREQUENCIES)[number];

export const FOLDER_COLORS = [
  "ember",
  "dusk",
  "sage",
  "neutral",
] as const;
export type FolderColor = (typeof FOLDER_COLORS)[number];
