import { z } from "zod";
import {
  BIO_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  NAME_MAX_LENGTH,
  RESERVED_USERNAMES,
  SENDER_NAME_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "./constants";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN_LENGTH, `At least ${USERNAME_MIN_LENGTH} characters.`)
  .max(USERNAME_MAX_LENGTH, `At most ${USERNAME_MAX_LENGTH} characters.`)
  .regex(
    /^[a-z0-9](?:[a-z0-9_]{1,22}[a-z0-9])$/,
    "Letters, numbers and underscores. Must start and end with a letter or number."
  )
  .refine((v) => !RESERVED_USERNAMES.has(v), "That one is reserved — try another.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .email("That does not look like an email address.");

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters.")
  .max(72, "Passwords are limited to 72 characters.")
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), "Include at least one letter and one number.");

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "What should we call you?").max(NAME_MAX_LENGTH),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const profileSetupSchema = z.object({
  name: z.string().trim().min(1, "What should we call you?").max(NAME_MAX_LENGTH),
  username: usernameSchema,
  bio: z.string().trim().max(BIO_MAX_LENGTH).optional().or(z.literal("")),
  avatar_url: z.string().url().nullish().or(z.literal("")),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH).optional(),
  username: usernameSchema.optional(),
  bio: z.string().trim().max(BIO_MAX_LENGTH).nullish(),
  welcome_note: z.string().trim().max(200).nullish(),
  avatar_url: z.string().url().nullish(),
  visibility: z.enum(["public", "unlisted"]).optional(),
  accepting_messages: z.boolean().optional(),
  allow_images: z.boolean().optional(),
  allow_voice: z.boolean().optional(),
  allow_scheduled: z.boolean().optional(),
  require_sender_name: z.boolean().optional(),
  profanity_filter: z.boolean().optional(),
  notify_email: z.boolean().optional(),
  digest_frequency: z.enum(["instant", "daily", "weekly", "off"]).optional(),
});

/** What an anonymous sender submits from the public profile page. */
export const submitMessageSchema = z.object({
  username: usernameSchema,
  content: z
    .string()
    .trim()
    .min(MESSAGE_MIN_LENGTH, "Say a little more.")
    .max(MESSAGE_MAX_LENGTH, `Keep it under ${MESSAGE_MAX_LENGTH.toLocaleString()} characters.`),
  senderName: z
    .string()
    .trim()
    .max(SENDER_NAME_MAX_LENGTH)
    .optional()
    .or(z.literal("")),
  senderEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("That does not look like an email address.")
    .optional()
    .or(z.literal("")),
  imagePath: z.string().max(400).optional().or(z.literal("")),
  voicePath: z.string().max(400).optional().or(z.literal("")),
  voiceDurationSeconds: z.number().int().min(0).max(600).optional(),
  unlockAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || new Date(v).getTime() > Date.now(),
      "Choose a moment in the future."
    )
    .refine(
      (v) => !v || new Date(v).getTime() < Date.now() + 20 * 365 * 24 * 3600_000,
      "That is further out than we can promise to keep — 20 years is the limit."
    ),
  /** Cloudflare Turnstile token. */
  captchaToken: z.string().max(4096).optional().or(z.literal("")),
  /** Honeypot: real people never fill this in. */
  website: z.string().max(200).optional().or(z.literal("")),
  /** Milliseconds the form was open, used as a bot signal. */
  elapsedMs: z.number().int().min(0).max(86_400_000).optional(),
});

export type SubmitMessageInput = z.infer<typeof submitMessageSchema>;

export const messagePatchSchema = z
  .object({
    is_favorite: z.boolean().optional(),
    is_archived: z.boolean().optional(),
    is_read: z.boolean().optional(),
    folder_id: z.string().uuid().nullable().optional(),
    restore: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to change.");

export const folderSchema = z.object({
  name: z.string().trim().min(1, "Give it a name.").max(40),
  color: z.enum(["ember", "dusk", "sage", "neutral"]).default("neutral"),
});

export const reportSchema = z.object({
  reason: z.enum(["abuse", "harassment", "spam", "explicit", "other"]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const uploadIntentSchema = z.object({
  username: usernameSchema,
  kind: z.enum(["image", "voice"]),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
});

/** Turns a ZodError into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
