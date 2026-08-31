-- =============================================================================
-- Echoes — core schema
-- Tables: profiles, folders, messages, message_reports, rate_limit_hits,
--         notification_log
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.digest_frequency as enum ('instant', 'daily', 'weekly', 'off');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.profile_visibility as enum ('public', 'unlisted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.moderation_status as enum ('published', 'held', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.folder_color as enum ('ember', 'dusk', 'sage', 'neutral');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- profiles — one row per authenticated recipient, created by trigger on signup
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  name                text        not null default '' check (char_length(name) <= 60),
  username            text        not null,
  email               text        not null,
  avatar_url          text,
  bio                 text        check (char_length(bio) <= 280),

  -- What the public page allows
  visibility          public.profile_visibility not null default 'public',
  accepting_messages  boolean     not null default true,
  allow_images        boolean     not null default true,
  allow_voice         boolean     not null default true,
  allow_scheduled     boolean     not null default true,
  require_sender_name boolean     not null default false,
  welcome_note        text        check (char_length(welcome_note) <= 200),

  -- Safety + delivery preferences
  profanity_filter    boolean     not null default true,
  notify_email        boolean     not null default true,
  digest_frequency    public.digest_frequency not null default 'instant',

  onboarded_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint profiles_username_format
    check (username ~ '^[a-z0-9](?:[a-z0-9_]{1,22}[a-z0-9])$')
);

create unique index if not exists profiles_username_key on public.profiles (username);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

comment on table public.profiles is
  'Recipient profiles. The username is the public share handle (echoes.app/u/<username>).';

-- -----------------------------------------------------------------------------
-- folders — optional user-defined collections for organising messages
-- -----------------------------------------------------------------------------
create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (char_length(trim(name)) between 1 and 40),
  color      public.folder_color not null default 'neutral',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists folders_owner_name_key
  on public.folders (owner_id, lower(trim(name)));
create index if not exists folders_owner_position_idx
  on public.folders (owner_id, position, created_at);

-- -----------------------------------------------------------------------------
-- messages — the vault itself
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  folder_id    uuid references public.folders (id) on delete set null,

  sender_name  text check (char_length(sender_name) <= 60),
  sender_email text check (char_length(sender_email) <= 254),
  content      text not null check (char_length(content) between 1 and 5000),

  image_path            text,
  voice_path            text,
  voice_duration_seconds integer check (voice_duration_seconds between 0 and 600),

  -- null = deliver immediately; a future timestamp = sealed until then
  unlock_at    timestamptz,

  is_favorite  boolean not null default false,
  is_archived  boolean not null default false,
  is_read      boolean not null default false,
  read_at      timestamptz,
  deleted_at   timestamptz,

  -- AI enrichment (opt-in, generated on demand)
  ai_summary       text,
  ai_tone          text,
  ai_generated_at  timestamptz,

  -- Abuse signals, written server-side only
  moderation_status public.moderation_status not null default 'published',
  spam_score        numeric(4, 3) not null default 0,
  spam_reasons      text[] not null default '{}',
  sender_ip_hash    text,
  sender_country    text,
  user_agent        text,

  notified_at  timestamptz,
  created_at   timestamptz not null default now(),

  -- Full-text search over the words a recipient would actually search for.
  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(sender_name, '')), 'A') ||
    setweight(to_tsvector('english', content), 'B')
  ) stored
);

create index if not exists messages_recipient_created_idx
  on public.messages (recipient_id, created_at desc);
create index if not exists messages_recipient_state_idx
  on public.messages (recipient_id, is_archived, deleted_at, created_at desc);
create index if not exists messages_favorite_idx
  on public.messages (recipient_id, created_at desc) where is_favorite;
create index if not exists messages_unlock_idx
  on public.messages (unlock_at) where unlock_at is not null;
create index if not exists messages_folder_idx
  on public.messages (folder_id) where folder_id is not null;
create index if not exists messages_search_idx
  on public.messages using gin (search_tsv);
create index if not exists messages_content_trgm_idx
  on public.messages using gin (content extensions.gin_trgm_ops);

comment on column public.messages.unlock_at is
  'When set in the future the message is sealed: RLS hides its content until this moment.';

-- -----------------------------------------------------------------------------
-- message_reports — recipients flag abuse; reviewed out of band
-- -----------------------------------------------------------------------------
create table if not exists public.message_reports (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references public.messages (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason      text not null check (reason in ('abuse', 'harassment', 'spam', 'explicit', 'other')),
  note        text check (char_length(note) <= 1000),
  created_at  timestamptz not null default now()
);

create index if not exists message_reports_message_idx on public.message_reports (message_id);

-- -----------------------------------------------------------------------------
-- rate_limit_hits — durable rate limiting for anonymous endpoints
-- -----------------------------------------------------------------------------
create table if not exists public.rate_limit_hits (
  id         bigserial primary key,
  bucket     text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on public.rate_limit_hits (bucket, identifier, created_at desc);

-- -----------------------------------------------------------------------------
-- notification_log — one row per email we send, for idempotency + audit
-- -----------------------------------------------------------------------------
create table if not exists public.notification_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  message_id  uuid references public.messages (id) on delete set null,
  kind        text not null check (kind in ('new_message', 'daily_digest', 'weekly_digest', 'unlocked')),
  provider_id text,
  sent_at     timestamptz not null default now()
);

create index if not exists notification_log_user_idx on public.notification_log (user_id, sent_at desc);
create unique index if not exists notification_log_message_kind_key
  on public.notification_log (message_id, kind) where message_id is not null;
