-- =============================================================================
-- Echoes — storage buckets and policies
--
--   avatars       public read, owner writes under `<uid>/…`
--   message-media private; anonymous senders never touch it directly, and
--                 recipients read through short-lived signed URLs minted by
--                 the API. Writes are service-role only.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  3145728, -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-media',
  'message-media',
  false,
  12582912, -- 12 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- --------------------------------------------------------------------------
-- avatars
-- --------------------------------------------------------------------------
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars: owner uploads" on storage.objects;
create policy "avatars: owner uploads"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: owner updates" on storage.objects;
create policy "avatars: owner updates"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars: owner deletes" on storage.objects;
create policy "avatars: owner deletes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- --------------------------------------------------------------------------
-- message-media — recipients may delete their own attachments (e.g. when
-- deleting a message for good). Everything else is service-role only.
-- --------------------------------------------------------------------------
drop policy if exists "media: recipient deletes own" on storage.objects;
create policy "media: recipient deletes own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'message-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
