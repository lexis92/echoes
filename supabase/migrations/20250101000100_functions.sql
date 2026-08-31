-- =============================================================================
-- Echoes — functions, triggers and views
-- =============================================================================

-- -----------------------------------------------------------------------------
-- updated_at bookkeeping
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Reserved usernames — kept in the database so the constraint cannot be
-- bypassed by writing directly through the API.
-- -----------------------------------------------------------------------------
create or replace function public.is_reserved_username(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(candidate) = any (array[
    'about','account','admin','api','archive','auth','billing','blog','callback',
    'contact','dashboard','docs','echoes','favorites','folder','folders','help',
    'home','inbox','legal','login','logout','mail','me','message','messages',
    'new','null','privacy','profile','public','root','scheduled','search',
    'security','settings','setup','share','signin','signup','static','support',
    'system','team','terms','trash','u','undefined','user','users','verify','www'
  ]);
$$;

create or replace function public.enforce_username_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.username := lower(trim(new.username));
  if public.is_reserved_username(new.username) then
    raise exception 'username_reserved' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_username on public.profiles;
create trigger profiles_enforce_username
  before insert or update of username on public.profiles
  for each row execute function public.enforce_username_rules();

-- -----------------------------------------------------------------------------
-- A folder can only ever hold its owner's messages.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_folder_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  folder_owner uuid;
begin
  if new.folder_id is null then
    return new;
  end if;
  select owner_id into folder_owner from public.folders where id = new.folder_id;
  if folder_owner is null or folder_owner <> new.recipient_id then
    raise exception 'folder_not_owned_by_recipient' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_enforce_folder on public.messages;
create trigger messages_enforce_folder
  before insert or update of folder_id on public.messages
  for each row execute function public.enforce_folder_ownership();

-- -----------------------------------------------------------------------------
-- Keep read_at honest with is_read.
-- -----------------------------------------------------------------------------
create or replace function public.sync_read_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_read and not coalesce(old.is_read, false) then
    new.read_at := now();
  elsif not new.is_read then
    new.read_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_sync_read_at on public.messages;
create trigger messages_sync_read_at
  before update of is_read on public.messages
  for each row execute function public.sync_read_at();

-- -----------------------------------------------------------------------------
-- Provision a profile the moment someone signs up. The username is a
-- placeholder derived from their email; profile setup lets them claim a real
-- one before they can share their link.
-- -----------------------------------------------------------------------------
create or replace function public.generate_username_candidate(seed text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  base      text;
  candidate text;
  n         integer := 0;
begin
  base := lower(regexp_replace(coalesce(seed, ''), '[^a-zA-Z0-9]', '', 'g'));
  base := left(base, 16);
  if char_length(base) < 3 then
    base := 'friend';
  end if;

  loop
    candidate := case
      when n = 0 then base
      else base || n::text
    end;
    exit when char_length(candidate) <= 24
      and not public.is_reserved_username(candidate)
      and not exists (select 1 from public.profiles where username = candidate);
    n := n + 1;
    if n > 5000 then
      candidate := 'friend' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
      exit;
    end if;
  end loop;

  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, username, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    public.generate_username_candidate(
      coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1))
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the profile email in step with the auth email after a change.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- Public read surface. `profiles` itself is owner-only under RLS; anonymous
-- visitors reach exactly these columns, for exactly these profiles, and only
-- through these security-definer functions.
-- -----------------------------------------------------------------------------
create or replace function public.get_public_profile(handle text)
returns table (
  id                 uuid,
  name               text,
  username           text,
  avatar_url         text,
  bio                text,
  welcome_note       text,
  accepting_messages boolean,
  allow_images       boolean,
  allow_voice        boolean,
  allow_scheduled    boolean,
  require_sender_name boolean,
  message_count      bigint,
  member_since       timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.name,
    p.username,
    p.avatar_url,
    p.bio,
    p.welcome_note,
    p.accepting_messages,
    p.allow_images,
    p.allow_voice,
    p.allow_scheduled,
    p.require_sender_name,
    (
      select count(*)
      from public.messages m
      where m.recipient_id = p.id
        and m.deleted_at is null
        and m.moderation_status = 'published'
    ) as message_count,
    p.created_at as member_since
  from public.profiles p
  where p.username = lower(trim(handle))
    and p.onboarded_at is not null;
$$;

create or replace function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    lower(trim(candidate)) ~ '^[a-z0-9](?:[a-z0-9_]{1,22}[a-z0-9])$'
    and not public.is_reserved_username(candidate)
    and not exists (
      select 1 from public.profiles
      where username = lower(trim(candidate))
        and id is distinct from auth.uid()
    );
$$;

-- -----------------------------------------------------------------------------
-- Counts for the sidebar badges — one round trip instead of six.
-- -----------------------------------------------------------------------------
create or replace function public.inbox_counts()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'inbox',     count(*) filter (where not is_archived and deleted_at is null and visible),
    'unread',    count(*) filter (where not is_archived and deleted_at is null and visible and not is_read),
    'favorites', count(*) filter (where is_favorite and deleted_at is null and visible),
    'archived',  count(*) filter (where is_archived and deleted_at is null and visible),
    'scheduled', count(*) filter (where deleted_at is null and not visible),
    'trash',     count(*) filter (where deleted_at is not null),
    'total',     count(*) filter (where deleted_at is null)
  )
  from (
    select
      is_archived,
      is_favorite,
      is_read,
      deleted_at,
      (unlock_at is null or unlock_at <= now()) as visible
    from public.messages
    where recipient_id = auth.uid()
      and moderation_status <> 'removed'
  ) s;
$$;

-- -----------------------------------------------------------------------------
-- Sealed messages: the recipient may know one exists and when it opens, but
-- not a single word of it until then.
-- -----------------------------------------------------------------------------
create or replace function public.sealed_messages()
returns table (
  id           uuid,
  unlock_at    timestamptz,
  created_at   timestamptz,
  has_image    boolean,
  has_voice    boolean,
  from_someone boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id,
    m.unlock_at,
    m.created_at,
    m.image_path is not null,
    m.voice_path is not null,
    m.sender_name is not null
  from public.messages m
  where m.recipient_id = auth.uid()
    and m.deleted_at is null
    and m.moderation_status <> 'removed'
    and m.unlock_at is not null
    and m.unlock_at > now()
  order by m.unlock_at asc;
$$;

-- -----------------------------------------------------------------------------
-- Rate limiting for anonymous endpoints. Called with the service role.
-- Returns true when the request is allowed (and records the hit).
-- -----------------------------------------------------------------------------
create or replace function public.check_rate_limit(
  p_bucket text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  hits integer;
begin
  delete from public.rate_limit_hits
  where created_at < now() - interval '1 day';

  select count(*) into hits
  from public.rate_limit_hits
  where bucket = p_bucket
    and identifier = p_identifier
    and created_at > now() - make_interval(secs => p_window_seconds);

  if hits >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket, identifier) values (p_bucket, p_identifier);
  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- Maintenance, driven by scheduled edge functions.
-- -----------------------------------------------------------------------------
create or replace function public.purge_expired_trash(retention_days integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  with gone as (
    delete from public.messages
    where deleted_at is not null
      and deleted_at < now() - make_interval(days => retention_days)
    returning 1
  )
  select count(*) into removed from gone;
  return removed;
end;
$$;

-- Messages whose seal has just broken and whose recipient has not been told.
create or replace function public.messages_pending_notification()
returns table (
  message_id   uuid,
  recipient_id uuid,
  email        text,
  name         text,
  username     text,
  sender_name  text,
  content      text,
  unlocked     boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    m.id,
    m.recipient_id,
    p.email,
    p.name,
    p.username,
    m.sender_name,
    m.content,
    m.unlock_at is not null
  from public.messages m
  join public.profiles p on p.id = m.recipient_id
  where m.notified_at is null
    and m.deleted_at is null
    and m.moderation_status = 'published'
    and (m.unlock_at is null or m.unlock_at <= now())
    and p.notify_email
    and p.digest_frequency = 'instant'
  order by m.created_at asc
  limit 200;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from anon, authenticated;
revoke all on function public.purge_expired_trash(integer) from anon, authenticated;
revoke all on function public.messages_pending_notification() from anon, authenticated;

grant execute on function public.get_public_profile(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.inbox_counts() to authenticated;
grant execute on function public.sealed_messages() to authenticated;
