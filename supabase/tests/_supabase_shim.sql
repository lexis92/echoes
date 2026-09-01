-- Minimal stand-in for the parts of a Supabase database that the Echoes
-- migrations depend on. Used only by `supabase/tests/run.sh` so the schema can
-- be verified against a plain PostgreSQL instance; Supabase provides all of
-- this for real.

create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists graphql_public;

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

grant usage on schema public, extensions to anon, authenticated, service_role;

create table if not exists auth.users (
  instance_id        uuid,
  id                 uuid primary key,
  aud                text,
  role               text,
  email              text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data  jsonb,
  raw_user_meta_data jsonb,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  -- Supabase's auth service reads these into non-nullable strings. Modelled
  -- here so the seed is exercised against the same shape it meets in
  -- production; leaving them NULL breaks sign-in and user deletion.
  confirmation_token     varchar(255),
  recovery_token         varchar(255),
  email_change           varchar(255),
  email_change_token_new varchar(255)
);

create table if not exists auth.identities (
  id              uuid primary key,
  user_id         uuid references auth.users (id) on delete cascade,
  provider_id     text,
  identity_data   jsonb,
  provider        text,
  last_sign_in_at timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (provider_id, provider)
);

-- Supabase derives this from the request JWT. Tests set it with
-- `set local request.jwt.claim.sub`.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean default false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  created_at         timestamptz default now()
);

create table if not exists storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets (id),
  name       text,
  owner      uuid,
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$
  select string_to_array(name, '/');
$$;
