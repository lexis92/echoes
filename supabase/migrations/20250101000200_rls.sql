-- =============================================================================
-- Echoes — row level security
--
-- Principles:
--   * A recipient can read and manage only their own rows.
--   * Nobody may INSERT a message through the public API. Submissions go
--     through the Next.js route handler with the service role, which is where
--     CAPTCHA, rate limiting and spam scoring live.
--   * Sealed (future-dated) messages are invisible — including their content
--     columns — until unlock_at passes.
-- =============================================================================

alter table public.profiles          enable row level security;
alter table public.folders           enable row level security;
alter table public.messages          enable row level security;
alter table public.message_reports   enable row level security;
alter table public.rate_limit_hits   enable row level security;
alter table public.notification_log  enable row level security;

-- Force RLS so even a table owner connecting over PostgREST obeys it.
alter table public.messages          force row level security;
alter table public.profiles          force row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
drop policy if exists "profiles: owner reads own row" on public.profiles;
create policy "profiles: owner reads own row"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "profiles: owner inserts own row" on public.profiles;
create policy "profiles: owner inserts own row"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "profiles: owner updates own row" on public.profiles;
create policy "profiles: owner updates own row"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "profiles: owner deletes own row" on public.profiles;
create policy "profiles: owner deletes own row"
  on public.profiles for delete
  to authenticated
  using (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- folders
-- -----------------------------------------------------------------------------
drop policy if exists "folders: owner reads" on public.folders;
create policy "folders: owner reads"
  on public.folders for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "folders: owner writes" on public.folders;
create policy "folders: owner writes"
  on public.folders for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "folders: owner updates" on public.folders;
create policy "folders: owner updates"
  on public.folders for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "folders: owner deletes" on public.folders;
create policy "folders: owner deletes"
  on public.folders for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
drop policy if exists "messages: recipient reads unsealed" on public.messages;
create policy "messages: recipient reads unsealed"
  on public.messages for select
  to authenticated
  using (
    recipient_id = (select auth.uid())
    and moderation_status <> 'removed'
    and (unlock_at is null or unlock_at <= now())
  );

drop policy if exists "messages: recipient updates own" on public.messages;
create policy "messages: recipient updates own"
  on public.messages for update
  to authenticated
  using (
    recipient_id = (select auth.uid())
    and (unlock_at is null or unlock_at <= now())
  )
  with check (recipient_id = (select auth.uid()));

drop policy if exists "messages: recipient deletes own" on public.messages;
create policy "messages: recipient deletes own"
  on public.messages for delete
  to authenticated
  using (recipient_id = (select auth.uid()));

-- Deliberately absent: any INSERT policy. Submissions are server-side only.

-- -----------------------------------------------------------------------------
-- message_reports — a recipient may report a message they can see
-- -----------------------------------------------------------------------------
drop policy if exists "reports: recipient files" on public.message_reports;
create policy "reports: recipient files"
  on public.message_reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.messages m
      where m.id = message_id and m.recipient_id = (select auth.uid())
    )
  );

drop policy if exists "reports: recipient reads own" on public.message_reports;
create policy "reports: recipient reads own"
  on public.message_reports for select
  to authenticated
  using (reporter_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- notification_log — readable by its owner, written only by the service role
-- -----------------------------------------------------------------------------
drop policy if exists "notifications: owner reads" on public.notification_log;
create policy "notifications: owner reads"
  on public.notification_log for select
  to authenticated
  using (user_id = (select auth.uid()));

-- rate_limit_hits: RLS on with no policies at all = service role only.

-- -----------------------------------------------------------------------------
-- Grants.
--
-- Supabase grants a permissive baseline to `anon` and `authenticated` on new
-- tables in `public`; we do not rely on it. Every privilege below is stated
-- explicitly, so the schema behaves identically on a plain PostgreSQL server
-- and cannot be widened by a change to the platform defaults.
--
-- `anon` gets nothing on any table. Everything anonymous — reading a public
-- profile, checking a username, submitting a message — goes through the
-- security-definer functions or the service role.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

revoke all on public.profiles         from anon, authenticated;
revoke all on public.messages         from anon, authenticated;
revoke all on public.folders          from anon, authenticated;
revoke all on public.message_reports  from anon, authenticated;
revoke all on public.rate_limit_hits  from anon, authenticated;
revoke all on public.notification_log from anon, authenticated;

-- Profiles: an owner manages their own row (RLS restricts it to that row).
grant select, insert, update, delete on public.profiles to authenticated;

-- Folders: same story.
grant select, insert, update, delete on public.folders to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Messages: read and delete freely; update only the five columns the UI owns.
-- The audit and abuse columns (spam_score, sender_ip_hash, moderation_status,
-- notified_at, …) are deliberately not grantable to a recipient, so a crafted
-- PostgREST call cannot launder a held message into a published one.
grant select, delete on public.messages to authenticated;
grant update (
  folder_id,
  is_favorite,
  is_archived,
  is_read,
  deleted_at
) on public.messages to authenticated;

-- Reports: file and read your own.
grant select, insert on public.message_reports to authenticated;

-- Notification log: read-only history of what we emailed you.
grant select on public.notification_log to authenticated;

-- The service role bypasses RLS, but still needs table privileges.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
