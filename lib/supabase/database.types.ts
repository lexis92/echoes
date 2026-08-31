/**
 * Database types for Echoes.
 *
 * Hand-maintained to mirror `supabase/migrations`. Regenerate with:
 *   npm run db:types
 */

export type DigestFrequency = "instant" | "daily" | "weekly" | "off";
export type ProfileVisibility = "public" | "unlisted";
export type ModerationStatus = "published" | "held" | "removed";
export type FolderColor = "ember" | "dusk" | "sage" | "neutral";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  visibility: ProfileVisibility;
  accepting_messages: boolean;
  allow_images: boolean;
  allow_voice: boolean;
  allow_scheduled: boolean;
  require_sender_name: boolean;
  welcome_note: string | null;
  profanity_filter: boolean;
  notify_email: boolean;
  digest_frequency: DigestFrequency;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageRow = {
  id: string;
  recipient_id: string;
  folder_id: string | null;
  sender_name: string | null;
  sender_email: string | null;
  content: string;
  image_path: string | null;
  voice_path: string | null;
  voice_duration_seconds: number | null;
  unlock_at: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  is_read: boolean;
  read_at: string | null;
  deleted_at: string | null;
  ai_summary: string | null;
  ai_tone: string | null;
  ai_generated_at: string | null;
  moderation_status: ModerationStatus;
  spam_score: number;
  spam_reasons: string[];
  sender_ip_hash: string | null;
  sender_country: string | null;
  user_agent: string | null;
  notified_at: string | null;
  created_at: string;
}

export type FolderRow = {
  id: string;
  owner_id: string;
  name: string;
  color: FolderColor;
  position: number;
  created_at: string;
}

export type MessageReportRow = {
  id: string;
  message_id: string;
  reporter_id: string | null;
  reason: "abuse" | "harassment" | "spam" | "explicit" | "other";
  note: string | null;
  created_at: string;
}

export type NotificationLogRow = {
  id: string;
  user_id: string;
  message_id: string | null;
  kind: "new_message" | "daily_digest" | "weekly_digest" | "unlocked";
  provider_id: string | null;
  sent_at: string;
}

export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  welcome_note: string | null;
  accepting_messages: boolean;
  allow_images: boolean;
  allow_voice: boolean;
  allow_scheduled: boolean;
  require_sender_name: boolean;
  message_count: number;
  member_since: string;
}

export type SealedMessage = {
  id: string;
  unlock_at: string;
  created_at: string;
  has_image: boolean;
  has_voice: boolean;
  from_someone: boolean;
}

export type InboxCounts = {
  inbox: number;
  unread: number;
  favorites: number;
  archived: number;
  scheduled: number;
  trash: number;
  total: number;
}

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insert<ProfileRow, Exclude<keyof ProfileRow, "id" | "username" | "email">>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Insert<
          MessageRow,
          Exclude<keyof MessageRow, "recipient_id" | "content">
        >;
        Update: Partial<MessageRow>;
        Relationships: [];
      };
      folders: {
        Row: FolderRow;
        Insert: Insert<FolderRow, Exclude<keyof FolderRow, "owner_id" | "name">>;
        Update: Partial<FolderRow>;
        Relationships: [];
      };
      message_reports: {
        Row: MessageReportRow;
        Insert: Insert<MessageReportRow, "id" | "created_at" | "note" | "reporter_id">;
        Update: Partial<MessageReportRow>;
        Relationships: [];
      };
      notification_log: {
        Row: NotificationLogRow;
        Insert: Insert<NotificationLogRow, "id" | "sent_at" | "message_id" | "provider_id">;
        Update: Partial<NotificationLogRow>;
        Relationships: [];
      };
      rate_limit_hits: {
        Row: { id: number; bucket: string; identifier: string; created_at: string };
        Insert: { bucket: string; identifier: string };
        Update: Partial<{ bucket: string; identifier: string }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_profile: {
        Args: { handle: string };
        Returns: PublicProfile[];
      };
      username_available: {
        Args: { candidate: string };
        Returns: boolean;
      };
      inbox_counts: {
        Args: Record<string, never>;
        Returns: InboxCounts;
      };
      sealed_messages: {
        Args: Record<string, never>;
        Returns: SealedMessage[];
      };
      check_rate_limit: {
        Args: {
          p_bucket: string;
          p_identifier: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      purge_expired_trash: {
        Args: { retention_days: number };
        Returns: number;
      };
      messages_pending_notification: {
        Args: Record<string, never>;
        Returns: {
          message_id: string;
          recipient_id: string;
          email: string;
          name: string;
          username: string;
          sender_name: string | null;
          content: string;
          unlocked: boolean;
        }[];
      };
    };
    Enums: {
      digest_frequency: DigestFrequency;
      profile_visibility: ProfileVisibility;
      moderation_status: ModerationStatus;
      folder_color: FolderColor;
    };
    CompositeTypes: Record<string, never>;
  };
}
