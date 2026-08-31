# Echoes

> Every kind word someone ever meant to tell you.

Echoes is a personal message vault. You create an account and get one link.
Anyone with that link — friends, family, colleagues, strangers — can leave you
a message without signing up for anything. Every message is yours, kept
forever, in a vault only you can open.

Built with Next.js (App Router) + TypeScript + Tailwind on Supabase.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Start Supabase locally (needs Docker + the Supabase CLI)
supabase start

# 3. Copy the printed API URL / anon key / service_role key into your env
cp .env.example .env.local
$EDITOR .env.local

# 4. Apply migrations and seed data
supabase db reset

# 5. Run it
npm run dev            # → http://localhost:3000
```

Local auth emails (confirmation, password reset) are caught by Inbucket at
<http://localhost:54324> — nothing leaves your machine.

### Seeded accounts

| Email | Password | Handle | What it exercises |
|---|---|---|---|
| `maya@echoes.test` | `password123` | `/u/maya` | A full vault: unread, favourites, archive, trash, two sealed messages, one held-for-review spam sample |
| `theo@echoes.test` | `password123` | `/u/theo` | A handful of messages, daily digest, a "birthday capsule" collection |
| `newbie@echoes.test` | `password123` | — | Signed up but not onboarded: exercises `/setup` and every empty state |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | Drop, re-migrate and re-seed the local database |
| `npm run db:types` | Regenerate `lib/supabase/database.types.ts` from the live schema |
| `npm run functions:deploy` | Deploy both Supabase edge functions |
| `PGURL=… supabase/tests/run.sh` | Apply migrations + seed to any Postgres and run the RLS assertions |

---

## Every screen

| Route | Who sees it | What it is |
|---|---|---|
| `/` | Everyone | Landing page |
| `/signup` | Signed out | Create an account (carries a handle claimed on the landing page) |
| `/login` | Signed out | Sign in |
| `/verify-email` | Signed out | "Check your inbox", with a rate-limited resend |
| `/reset-password` | Signed out | Request a reset link |
| `/auth/confirm`, `/auth/callback` | — | One-time link handlers |
| `/setup` | New account | Three-step profile setup; `?edit=1` reuses it for later edits |
| `/dashboard` | Recipient | Overview: share card, setup checklist, stats, latest messages |
| `/inbox` | Recipient | The vault, grouped by day, with search and filters |
| `/messages/[id]` | Recipient | One message in full, with attachments, AI summary and actions |
| `/favorites` | Recipient | Hearted messages |
| `/scheduled` | Recipient | Sealed messages — shape only, never content |
| `/archive` | Recipient | Put away, still searchable |
| `/trash` | Recipient | 30-day recovery window |
| `/settings` | Recipient | Profile, receiving, safety, notifications, collections, danger zone |
| `/u/[username]` | Anyone with the link | The composer — no account required |
| `/u/[username]/sent` | Sender | Success screen, wax-seal animation |
| `404` / `error` | Everyone | Return-to-sender and smudged-ink states |

Empty states exist for every list (inbox, favourites, archive, trash, sealed,
and a distinct "nothing matches that" for filtered searches), plus loading
skeletons for the whole app shell.

---

## API

Every route validates with Zod and returns `{ error, message, fields? }` on
failure.

| Method | Route | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/messages` | None | The public submit. CAPTCHA → rate limits → spam score → insert → email |
| `PATCH` | `/api/messages/:id` | Recipient | Favourite, archive, read, move, restore |
| `DELETE` | `/api/messages/:id` | Recipient | Soft delete; `?permanent=1` also removes attachments |
| `GET` | `/api/messages/:id/media` | Recipient | Mints a 10-minute signed URL for a private attachment |
| `POST` | `/api/messages/:id/summary` | Recipient | Opt-in OpenAI summary, cached on the row |
| `POST` | `/api/messages/:id/report` | Recipient | Files a report and archives the message |
| `POST` | `/api/upload` | None | Anonymous attachment upload, service-role write into the recipient's prefix |
| `POST`/`DELETE` | `/api/avatar` | Owner | Avatar upload / removal |
| `GET` | `/api/username?u=` | Optional | Live availability |
| `GET`/`POST` | `/api/folders` | Owner | Collections |
| `PATCH`/`DELETE` | `/api/folders/:id` | Owner | Rename, recolour, remove (never deletes messages) |
| `DELETE` | `/api/account?confirm=` | Owner | Irreversible deletion, storage first |
| `GET` | `/api/health` | None | Dependency probe for uptime checks |
| `GET` | `/api/cron/deliver` | `CRON_SECRET` | Notification sweep + trash purge |

---

## Degradation

Every integration is optional. The app runs, and messages still arrive, with
none of them configured:

| Missing | Effect |
|---|---|
| `RESEND_API_KEY` | Emails are logged to the console instead of sent. Messages still save. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Every `track()` is a no-op. |
| `OPENAI_API_KEY` | The summary button is not rendered; the endpoint returns 503. |
| `TURNSTILE_SECRET_KEY` | CAPTCHA is skipped, and a warning is logged in production. |
| `IP_HASH_SALT` | Falls back to a development salt — **set this in production.** |

Rate limiting fails *open*: if the limiter itself errors, the message is still
delivered and the failure is logged. An outage in spam defence must never cost
someone their message.

---

## Deployment

**Vercel + Supabase** is the intended pairing.

1. Create a Supabase project; run `supabase link` then `supabase db push`.
2. Deploy the edge functions: `npm run functions:deploy`.
3. In Supabase → Authentication → URL configuration, set the site URL to your
   domain and add `https://<domain>/auth/confirm` and `/auth/callback` as
   redirect URLs.
4. Import the repo into Vercel with **Root Directory = `echoes`**. Set every
   variable from `.env.example`. `vercel.json` registers the 15-minute cron and
   the API cache/robots headers; `next.config.js` sets HSTS, `X-Frame-Options`,
   `Referrer-Policy` and the rest.
5. Point `NEXT_PUBLIC_SITE_URL` at the production domain — share links, emails
   and auth redirects are all derived from it.

Scheduled work can run from either side and both paths are idempotent
(`notified_at` is the guard): Vercel Cron hitting `/api/cron/deliver`, or
`pg_cron`/the Supabase scheduler invoking `deliver-scheduled` and
`weekly-digest`. Pick one; running both is harmless.

---

## Further reading

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the pieces fit, and why the
  security model is where it is.
- [`DECISIONS.md`](./DECISIONS.md) — every product decision made beyond the
  brief, and the assumptions behind them.
