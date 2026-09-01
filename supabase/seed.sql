-- =============================================================================
-- Echoes — seed data for local development and testing
--
-- Creates three signed-in recipients and a realistic vault of messages:
-- read and unread, favourited, archived, trashed, sealed-for-the-future,
-- with attachments, and one held-for-review spam sample.
--
--   maya@echoes.test   / password123   → /u/maya       (busy vault)
--   theo@echoes.test   / password123   → /u/theo       (a handful)
--   newbie@echoes.test / password123   → /u/newcomer   (empty states)
-- =============================================================================

-- --------------------------------------------------------------------------
-- Auth users. The handle_new_user trigger creates the matching profiles.
-- --------------------------------------------------------------------------
-- The token columns matter: Supabase's auth service reads them into plain text
-- fields and cannot handle NULL. Omitting them produces accounts that exist but
-- cannot be signed in to or deleted — "Database error loading user".
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'maya@echoes.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now() - interval '120 days',
   '{"provider":"email","providers":["email"]}',
   '{"name":"Maya Okonkwo"}', now() - interval '120 days', now() - interval '120 days',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'theo@echoes.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now() - interval '40 days',
   '{"provider":"email","providers":["email"]}',
   '{"name":"Theo Lindqvist"}', now() - interval '40 days', now() - interval '40 days',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'newbie@echoes.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now() - interval '1 day',
   '{"provider":"email","providers":["email"]}',
   '{"name":"Sam Reyes"}', now() - interval '1 day', now() - interval '1 day',
   '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  json_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true)::jsonb,
  'email', now(), now(), now()
from auth.users u
where u.email in ('maya@echoes.test', 'theo@echoes.test', 'newbie@echoes.test')
on conflict do nothing;

-- --------------------------------------------------------------------------
-- Profiles — claim real usernames and finish onboarding for two of the three.
-- --------------------------------------------------------------------------
update public.profiles set
  name = 'Maya Okonkwo',
  username = 'maya',
  bio = 'Ceramicist in Lisbon. Collecting kind words like sea glass.',
  welcome_note = 'Tell me something you have never said out loud.',
  avatar_url = null,
  onboarded_at = now() - interval '119 days',
  digest_frequency = 'instant'
where id = '11111111-1111-1111-1111-111111111111';

update public.profiles set
  name = 'Theo Lindqvist',
  username = 'theo',
  bio = 'Turning 30 this spring. Building a time capsule, one note at a time.',
  welcome_note = 'Seal something for my birthday — I promise not to peek.',
  onboarded_at = now() - interval '39 days',
  digest_frequency = 'daily'
where id = '22222222-2222-2222-2222-222222222222';

-- Sam has an account but has not finished profile setup: exercises /setup and
-- every empty state in the product.
update public.profiles set
  name = 'Sam Reyes',
  username = 'newcomer',
  onboarded_at = null
where id = '33333333-3333-3333-3333-333333333333';

-- --------------------------------------------------------------------------
-- Folders
-- --------------------------------------------------------------------------
insert into public.folders (id, owner_id, name, color, position) values
  ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Hard days', 'ember', 0),
  ('aaaaaaa1-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Studio', 'sage', 1),
  ('aaaaaaa1-0000-4000-8000-000000000003', '22222222-2222-2222-2222-222222222222', 'Birthday capsule', 'dusk', 0)
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- Messages
-- --------------------------------------------------------------------------
insert into public.messages (
  id, recipient_id, folder_id, sender_name, content, unlock_at,
  is_favorite, is_archived, is_read, deleted_at, created_at, notified_at,
  moderation_status, spam_score
) values
  -- Maya — unread, recent
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, 'Nana Grace',
   'You will not remember this, but when you were six you told me the sea was "the sky lying down". I have thought about that sentence every summer since. Whatever you are making this week, it is enough.',
   null, true, false, false, null, now() - interval '3 hours', now() - interval '3 hours', 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, null,
   'I sat next to you on the 728 last winter when I was having the worst day of my life and you offered me half a pastry without saying anything. I never got to say thank you. So: thank you.',
   null, false, false, false, null, now() - interval '9 hours', now() - interval '9 hours', 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000002', 'Rui from the studio',
   'The blue glaze cracked again and I laughed out loud because I could hear you saying "the kiln is not the enemy, the rush is". Come back soon, the wheel misses you.',
   null, false, false, true, null, now() - interval '2 days', now() - interval '2 days', 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-4000-8000-000000000001', 'Jules',
   'Read this on the days it feels pointless: you changed the entire direction of my twenties with one conversation on a fire escape. You do not get to decide that your work does not matter.',
   null, true, false, true, null, now() - interval '11 days', now() - interval '11 days', 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, 'Mum',
   'Your grandmother''s recipe card turned up behind the dresser. I have copied it out for you in her handwriting as best I could. Ring me when you can, no rush, no reason.',
   null, true, false, true, null, now() - interval '26 days', now() - interval '26 days', 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, 'A colleague',
   'You defended my idea in a meeting when I was too nervous to. I have never forgotten it and I try to do the same for someone else every time I can.',
   null, false, false, true, null, now() - interval '48 days', now() - interval '48 days', 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, 'Old flatmate',
   'Found the mug you made me at the back of a box. Still my favourite thing I own. Still slightly wonky. Still perfect.',
   null, false, true, true, null, now() - interval '70 days', now() - interval '70 days', 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, null,
   'Just wanted to say the workshop you ran changed how I think about making things with my hands. Sorry for the anonymity — I get shy.',
   null, false, true, true, null, now() - interval '85 days', now() - interval '85 days', 'published', 0),

  -- Maya — sealed until the future
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, 'Jules',
   'Open this on the morning of your exhibition. I wrote it months in advance because I already know exactly how it is going to go, and I want to be the first voice you hear.',
   now() + interval '38 days', false, false, false, null, now() - interval '5 days', null, 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, null,
   'For your next birthday. No peeking, I know you.',
   now() + interval '96 days', false, false, false, null, now() - interval '1 day', null, 'published', 0),

  -- Maya — in the trash, and one held for review
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, 'Wrong Maya',
   'Hi! I think I have the wrong person — I was looking for Maya from the tennis club. Sorry!',
   null, false, false, true, now() - interval '4 days', now() - interval '20 days', now() - interval '20 days', 'published', 0),

  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', null, null,
   'CLICK HERE to claim your FREE crypto bonus!!! limited offer visit http://definitely-not-a-scam.example now now now',
   null, false, false, false, null, now() - interval '6 hours', null, 'held', 0.940),

  -- Theo
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'aaaaaaa1-0000-4000-8000-000000000003', 'Ingrid',
   'Thirty looks good on you already and you are not even there yet. I am sealing this so you get it on the actual morning. Make the coffee properly. Sit outside. Read it twice.',
   now() + interval '52 days', false, false, false, null, now() - interval '12 days', null, 'published', 0),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', null, 'Dad',
   'I am not good at this sort of thing so I will just say it plainly: I am proud of you, and I have been for a very long time.',
   null, true, false, false, null, now() - interval '5 hours', now() - interval '5 hours', 'published', 0),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', null, null,
   'You probably do not remember me but you covered my shift the week my dad was in hospital. It mattered more than you know.',
   null, false, false, true, null, now() - interval '14 days', now() - interval '14 days', 'published', 0),

  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', null, 'Marisol',
   'Filing this under things I should say more often: you are the friend who actually turns up. Thank you for the airport run, and the one before that, and the one before that.',
   null, false, false, true, null, now() - interval '31 days', now() - interval '31 days', 'published', 0);

-- Give a couple of Maya's messages an AI summary, as if she had asked for one.
update public.messages
set ai_summary = 'A grandmother recalls a phrase you said as a child and tells you your work is enough.',
    ai_tone = 'tender',
    ai_generated_at = now() - interval '2 hours'
where sender_name = 'Nana Grace';

-- Mark everything already delivered as notified so the seed does not trigger
-- a burst of emails on first run.
update public.messages
set notified_at = coalesce(notified_at, created_at)
where unlock_at is null and moderation_status = 'published';
