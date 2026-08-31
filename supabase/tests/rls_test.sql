-- =============================================================================
-- Echoes — row-level security assertions
--
-- Run after the migrations and seed. Every check raises an exception on
-- failure, so a non-zero psql exit means a policy regressed.
-- =============================================================================

\set ON_ERROR_STOP on

do $$
declare
  maya uuid := '11111111-1111-1111-1111-111111111111';
  theo uuid := '22222222-2222-2222-2222-222222222222';
  visible          integer;
  sealed_visible   integer;
  others           integer;
  sealed_total     integer;
  counts           json;
  ok               boolean;
begin
  -- ---------------------------------------------------------------------
  -- 1. A recipient sees their own unsealed messages, and only those.
  -- ---------------------------------------------------------------------
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', maya::text, true);

  select count(*) into visible from public.messages;
  select count(*) into sealed_visible
    from public.messages where unlock_at is not null and unlock_at > now();
  select count(*) into others from public.messages where recipient_id <> maya;

  if visible = 0 then
    raise exception 'RLS: Maya should be able to read her own messages';
  end if;
  if sealed_visible <> 0 then
    raise exception 'RLS: sealed messages leaked into a recipient read (% rows)', sealed_visible;
  end if;
  if others <> 0 then
    raise exception 'RLS: another recipient''s messages were visible (% rows)', others;
  end if;

  -- ---------------------------------------------------------------------
  -- 2. Sealed messages are still *countable* through the definer function,
  --    without exposing a single character of their content.
  -- ---------------------------------------------------------------------
  select count(*) into sealed_total from public.sealed_messages();
  if sealed_total = 0 then
    raise exception 'sealed_messages(): expected Maya to have sealed messages waiting';
  end if;

  counts := public.inbox_counts();
  if (counts ->> 'scheduled')::int <> sealed_total then
    raise exception 'inbox_counts(): scheduled count % does not match sealed_messages() %',
      counts ->> 'scheduled', sealed_total;
  end if;

  -- ---------------------------------------------------------------------
  -- 3. Nobody may insert a message through the API — submissions are
  --    service-role only, behind CAPTCHA and rate limiting.
  -- ---------------------------------------------------------------------
  begin
    insert into public.messages (recipient_id, content) values (maya, 'forged');
    raise exception 'RLS: an authenticated user was able to insert a message';
  exception
    when insufficient_privilege or check_violation then null;
  end;

  -- ---------------------------------------------------------------------
  -- 4. A recipient cannot rewrite the abuse/audit columns on their own rows.
  -- ---------------------------------------------------------------------
  begin
    update public.messages set spam_score = 0 where recipient_id = maya;
    raise exception 'RLS: spam_score should not be updatable by a recipient';
  exception
    when insufficient_privilege then null;
  end;

  -- The columns they *should* control still work.
  update public.messages set is_favorite = is_favorite where recipient_id = maya;

  -- ---------------------------------------------------------------------
  -- 5. Profiles are owner-only; the public surface is the definer function.
  -- ---------------------------------------------------------------------
  select count(*) into others from public.profiles where id <> maya;
  if others <> 0 then
    raise exception 'RLS: another user''s profile row was readable (% rows)', others;
  end if;

  -- ---------------------------------------------------------------------
  -- 6. Theo sees his own vault, not Maya's.
  -- ---------------------------------------------------------------------
  perform set_config('request.jwt.claim.sub', theo::text, true);
  select count(*) into others from public.messages where recipient_id = maya;
  if others <> 0 then
    raise exception 'RLS: Theo could read Maya''s messages';
  end if;

  reset role;

  -- ---------------------------------------------------------------------
  -- 7. Anonymous visitors get nothing from the tables, but the public
  --    profile function works and hides un-onboarded accounts.
  -- ---------------------------------------------------------------------
  set local role anon;
  begin
    perform 1 from public.messages limit 1;
    raise exception 'RLS: anon was able to select from messages';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.profiles limit 1;
    raise exception 'RLS: anon was able to select from profiles';
  exception
    when insufficient_privilege then null;
  end;

  if not exists (select 1 from public.get_public_profile('maya')) then
    raise exception 'get_public_profile(): anon should be able to read Maya''s public profile';
  end if;

  -- Sam has not finished setup, so his page must not resolve yet.
  if exists (select 1 from public.get_public_profile('newcomer')) then
    raise exception 'get_public_profile(): an un-onboarded profile was exposed';
  end if;

  select public.username_available('maya') into ok;
  if ok then raise exception 'username_available(): a taken username was reported free'; end if;

  select public.username_available('settings') into ok;
  if ok then raise exception 'username_available(): a reserved username was reported free'; end if;

  select public.username_available('brand_new_handle') into ok;
  if not ok then raise exception 'username_available(): a free username was reported taken'; end if;

  reset role;

  raise notice 'RLS assertions passed';
end $$;

-- ---------------------------------------------------------------------------
-- 8. Rate limiting counts and then refuses.
-- ---------------------------------------------------------------------------
do $$
declare
  allowed boolean;
begin
  for i in 1..3 loop
    select public.check_rate_limit('test_bucket', 'tester', 3, 600) into allowed;
    if not allowed then
      raise exception 'check_rate_limit(): refused request % of 3', i;
    end if;
  end loop;

  select public.check_rate_limit('test_bucket', 'tester', 3, 600) into allowed;
  if allowed then
    raise exception 'check_rate_limit(): allowed a 4th request past a limit of 3';
  end if;

  delete from public.rate_limit_hits where bucket = 'test_bucket';
  raise notice 'Rate limit assertions passed';
end $$;

-- ---------------------------------------------------------------------------
-- 9. Username rules are enforced by the database, not only the app.
-- ---------------------------------------------------------------------------
do $$
declare
  maya uuid := '11111111-1111-1111-1111-111111111111';
begin
  begin
    update public.profiles set username = 'settings' where id = maya;
    raise exception 'a reserved username was accepted';
  exception
    when check_violation then null;
  end;

  begin
    update public.profiles set username = 'no' where id = maya;
    raise exception 'a too-short username was accepted';
  exception
    when check_violation then null;
  end;

  -- Casing is normalised rather than rejected.
  update public.profiles set username = '  MaYa  ' where id = maya;
  if (select username from public.profiles where id = maya) <> 'maya' then
    raise exception 'username was not normalised to lowercase';
  end if;

  raise notice 'Username rule assertions passed';
end $$;

-- ---------------------------------------------------------------------------
-- 10. A folder can only ever hold its owner's messages.
-- ---------------------------------------------------------------------------
do $$
declare
  theos_folder uuid := 'aaaaaaa1-0000-4000-8000-000000000003';
  mayas_message uuid;
begin
  select id into mayas_message
  from public.messages
  where recipient_id = '11111111-1111-1111-1111-111111111111'
  limit 1;

  begin
    update public.messages set folder_id = theos_folder where id = mayas_message;
    raise exception 'a message was filed into another user''s folder';
  exception
    when check_violation then null;
  end;

  raise notice 'Folder ownership assertions passed';
end $$;

-- ---------------------------------------------------------------------------
-- 11. Full-text search finds what a recipient would actually type.
-- ---------------------------------------------------------------------------
do $$
declare hits integer;
begin
  select count(*) into hits from public.messages
   where search_tsv @@ websearch_to_tsquery('english', 'pastry');
  if hits <> 1 then
    raise exception 'search: expected 1 hit for "pastry", got %', hits;
  end if;

  select count(*) into hits from public.messages
   where search_tsv @@ websearch_to_tsquery('english', 'grandmother recipe');
  if hits < 1 then
    raise exception 'search: a multi-word query found nothing';
  end if;

  raise notice 'Search assertions passed';
end $$;

-- ---------------------------------------------------------------------------
-- 12. Trash is purged only after the retention window. Destructive — this is
--     the last check in the file.
-- ---------------------------------------------------------------------------
do $$
declare removed integer;
begin
  select public.purge_expired_trash(30) into removed;
  if removed <> 0 then
    raise exception 'purge: removed % rows still inside the retention window', removed;
  end if;

  update public.messages set deleted_at = now() - interval '45 days'
   where deleted_at is not null;

  select public.purge_expired_trash(30) into removed;
  if removed < 1 then
    raise exception 'purge: expected to remove the expired row, removed %', removed;
  end if;

  raise notice 'Trash retention assertions passed';
end $$;
