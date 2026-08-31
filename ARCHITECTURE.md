# Architecture

## The shape of it

```
                 anonymous sender                    recipient
                        │                                │
                        ▼                                ▼
        ┌───────────────────────────┐      ┌──────────────────────────┐
        │  /u/[username]            │      │  /dashboard /inbox  …    │
        │  Server Component + form  │      │  Server Components       │
        └────────────┬──────────────┘      └────────────┬─────────────┘
                     │ fetch                            │ supabase-js (anon key)
                     ▼                                  │ + user's JWT
        ┌───────────────────────────┐                   │
        │ POST /api/messages        │                   │
        │  1 rate limit (IP)        │                   │
        │  2 resolve recipient      │                   │
        │  3 rate limit (recipient) │                   │
        │  4 verify attachment path │                   │
        │  5 CAPTCHA                │                   │
        │  6 spam score             │                   │
        │  7 insert (service role)  │                   │
        │  8 email + analytics      │                   │
        └────────────┬──────────────┘                   │
                     │ service role                     │ RLS
                     ▼                                  ▼
        ┌──────────────────────────────────────────────────────────┐
        │                    Supabase Postgres                     │
        │  profiles · messages · folders · reports · rate_limits   │
        │  RLS on every table · security-definer public functions  │
        └──────────────────────────────────────────────────────────┘
                     │                                  │
             storage: avatars (public)          storage: message-media (private,
                                                signed URLs minted per request)
```

## The one decision everything else follows from

**There is no INSERT policy on `messages`.** Not for `anon`, not for
`authenticated`. The only way a message enters the vault is through
`POST /api/messages` using the service role.

This matters because the sender is anonymous. If anonymous inserts were
possible through PostgREST, every abuse control — CAPTCHA, rate limits, spam
scoring, per-profile settings like "photos off" — would be a suggestion that a
`curl` command could skip. Routing the write through one server-side handler
makes those controls the *only* path, not the polite one.

The cost is that message submission cannot be a direct-to-database call. That
is the right trade for the one endpoint on the internet that accepts unattested
writes.

## Trust boundaries

| Actor | Credential | Can reach |
|---|---|---|
| Anonymous visitor | Anon key, no session | `get_public_profile()`, `username_available()`. **Zero** table privileges — explicitly revoked, not merely policy-restricted. |
| Recipient | Anon key + their JWT | Their own rows, through RLS. `SELECT`/`DELETE` on their messages; `UPDATE` on exactly five columns. |
| Server route handler | Service role | Everything. Only ever constructed inside `app/api/**` and server actions that have already authorised the caller. |

`lib/supabase/admin.ts` imports `server-only`, so a stray client-side import is
a build error rather than a leaked key.

## How sealed messages actually stay sealed

The RLS `SELECT` policy on `messages` carries `(unlock_at is null or unlock_at
<= now())`. A future-dated message is not filtered in the UI, is not hidden
with CSS, and is not returned-then-blanked. Postgres does not include the row
in the result at all, so its text never reaches the Next.js server, let alone
the browser.

To make the waiting visible without leaking anything, `sealed_messages()` is a
security-definer function that returns only `id`, `unlock_at`, `created_at`,
and three booleans (has an image, has a voice note, has a name on it). The
`/messages/[id]` route for a sealed message renders exactly the same
`not-found` state as an id that does not exist — the difference is not
observable.

This is verified rather than asserted: `supabase/tests/rls_test.sql` fails the
build if a sealed row ever appears in a recipient read.

## Column-level grants

RLS decides *which rows*. It does not decide *which columns*. A recipient who
could `UPDATE` any column on their own message could flip
`moderation_status` from `held` to `published`, rewrite `spam_score`, or clear
`sender_ip_hash`.

So `UPDATE` is revoked wholesale and re-granted on five columns:
`folder_id`, `is_favorite`, `is_archived`, `is_read`, `deleted_at`. Everything
else on the row is server-owned. The test suite asserts a `spam_score` update
is refused.

## Storage

Two buckets, deliberately different:

- **`avatars`** — public read. An avatar appears on a page anyone with the link
  can open, so a signed URL would buy nothing and cost a round trip. Writes are
  restricted by policy to `<uid>/…`.
- **`message-media`** — private. Anonymous senders never receive a storage
  credential; `POST /api/upload` writes on their behalf with the service role,
  into the *recipient's* prefix. On submit, `/api/messages` re-checks that each
  attachment path starts with that recipient's id, so a sender cannot attach a
  file belonging to someone else by guessing a path. Recipients read through
  10-minute signed URLs minted per request.

## Anti-abuse, in order

1. **Honeypot** — a visually hidden `website` field. Filled in ⇒ score 1.0.
2. **Timing** — a long message submitted in under 2.5 s is a strong bot signal.
3. **Rate limits** — per sender IP hash *and* per recipient, so a profile
   cannot be flooded from a botnet even though each IP stays under its own
   limit. Backed by a table, because serverless functions share no memory.
4. **CAPTCHA** — Cloudflare Turnstile in `interaction-only` mode, so the
   grandparent leaving a message on a phone almost never sees a challenge.
5. **Spam score** — transparent, explainable heuristics in
   `lib/security/spam.ts`. Warmth (second-person pronouns, "thank", "miss",
   "remember") is a *negative* signal, because real messages talk to a person.

A score at or above 0.7 sets `moderation_status = 'held'`. **Held is not
dropped.** The recipient still sees it, flagged, with the reasons listed, and
can report it. Silently discarding a message on a heuristic is the one failure
mode this product cannot afford.

## Privacy of the sender

We never store a raw IP address. `hashIp()` keeps a salted SHA-256 prefix,
which is enough to rate limit and to recognise a repeat abuser, and is not
reversible. It is never shown to the recipient. `IP_HASH_SALT` rotation resets
that history by design.

## Rendering strategy

Server Components do the reading; Client Components do the interacting.

- List and detail screens are Server Components that query through the
  request-scoped Supabase client, so RLS applies with the user's own JWT.
- Mutations go through `useMessageActions`, which updates optimistically, calls
  the API, and then `router.refresh()`es to reconcile with the server. Failures
  roll the UI back and say why.
- Every destructive action has a real undo. Delete is soft by default (30 days
  in Trash) with an undo in the toast; permanent deletion exists only in Trash
  and asks twice.
- Search, filters, sort and pagination all live in the URL, so a search is
  shareable, bookmarkable and survives a refresh.

## Session handling

`middleware.ts` runs `updateSession` on every non-asset request. It refreshes
the auth token, keeps cookies in sync, and enforces three redirects:

- signed out on a protected route → `/login?next=…`
- signed in on `/login` or `/signup` → `/dashboard`
- signed in but no `onboarded_at` → `/setup` (and back out again once done)

`app/(app)/layout.tsx` re-checks both conditions server-side. Middleware is a
routing convenience; the layout check and RLS are the actual guarantees.

## Scheduled work

`messages_pending_notification()` returns messages that are published, not
deleted, past their unlock time, not yet notified, and whose recipient wants
instant email. Two interchangeable runners consume it — `/api/cron/deliver`
(Vercel Cron) and the `deliver-scheduled` edge function — and both write
`notified_at` and a `notification_log` row, so running both is harmless.
`weekly-digest` handles the daily and weekly cohorts, and includes the weekly
cohort only on Mondays.

## Analytics

`autocapture` is off and `$pageview` is captured manually, App-Router-aware.
Auth tokens are stripped from recorded URLs in a `before_send` hook. **No
message content is ever sent to PostHog** — events carry lengths, booleans and
ids only. The event list in `lib/analytics/events.ts` maps one-to-one onto the
success metrics in the brief.

## AI summaries

Opt-in, per message, on an explicit button press. The prompt asks for one warm
sentence addressed to the recipient plus a tone label from a fixed vocabulary,
and the result is cached on the row so a message is sent to OpenAI at most
once. If `OPENAI_API_KEY` is unset the button is not rendered at all.

## Testing

`supabase/tests/run.sh` applies every migration and the seed to any Postgres
(a small shim stands in for Supabase's `auth` and `storage` schemas), then runs
assertions covering: cross-user isolation, sealed-message invisibility, the
absence of an insert path, column-level update restrictions, anonymous access,
reserved and malformed usernames, rate limiting, folder ownership, full-text
search and trash retention. It exits non-zero on the first regression.
