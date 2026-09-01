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
| `RESEND_API_KEY` | Notification emails are logged to the console instead of sent. Messages still save. Supabase's own auth mail is unaffected. |
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

### 1. The database

Either `supabase link && supabase db push` with the CLI, or — if you have no
local Docker — paste the migrations and `seed.sql` into the dashboard's SQL
Editor in filename order. Both produce the same schema; the SQL Editor route
needs no tooling at all.

Optionally deploy the scheduled jobs: `npm run functions:deploy`.

### 2. The app

Import the repo at [vercel.com/new](https://vercel.com/new).

**Set Root Directory to `echoes`.** This is the step that bites: the repository
root holds a different application, so leaving Root Directory blank builds the
wrong project and every Echoes route 404s. There is no error message — it just
serves something else.

Then add the environment variables. Vercel's *Environment Variables* panel
parses a pasted `.env`, so the fastest route is to fill in a copy of
`.env.example` and paste the whole file into the first **Key** box rather than
typing each row. Only four are required:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The publishable key. Vercel warns that a `NEXT_PUBLIC_*KEY*` may leak — for this key that is expected and safe; it ships in the client bundle by design, and RLS is what protects the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Bypasses RLS entirely — set it here, never in git. |
| `IP_HASH_SALT` | Any long random string. Without it, sender-IP hashing falls back to a development salt. |

**Set `NEXT_PUBLIC_SITE_URL` to your deployed address.** It is tempting to skip
it, because `absoluteUrl()` does fall back to `VERCEL_PROJECT_PRODUCTION_URL` —
but that variable is server-only. Next.js exposes nothing but `NEXT_PUBLIC_*`
to client components, and the share card, profile preview and handle picker all
build URLs there, so without it they render `localhost:3000` in production.
`window.location.origin` covers the browser once hydrated; this keeps the
server-rendered pass correct too.

`vercel.json` registers the delivery cron and the API cache/robots headers;
`next.config.js` sets HSTS, `X-Frame-Options`, `Referrer-Policy` and the rest.

**Cron frequency is plan-dependent.** Vercel's Hobby plan permits at most one
cron run per day, and a more frequent `schedule` fails the deployment outright
with a cron error — so `vercel.json` ships with a daily `0 9 * * *`. This is
less limiting than it sounds: new messages are emailed inline by
`/api/messages`, so the cron only covers sealed messages whose unlock time has
passed, plus the trash purge. If you want sealed messages announced promptly,
run the `deliver-scheduled` edge function on a tighter Supabase schedule
instead — it does the same work and is not subject to Vercel's plan limits. On
a paid Vercel plan you can restore `*/15 * * * *` here.

### 3. Close the loop

Environment variables only take effect on a build, so a project that has never
deployed reports *"No production deployments found; create one to apply these
changes"* after you save them. That message means the variables saved — deploy
once and it clears.

Finally, in Supabase → Authentication → URL Configuration, set **Site URL** to
your deployed address and add `https://<domain>/auth/confirm` as a redirect URL
(plus `/auth/callback` if you add an OAuth provider later). Skip this and
everything works except new sign-ups, whose confirmation email would point at
the wrong host.

### 4. Email

Echoes sends two kinds of mail, and they travel by different routes. Wiring one
does not wire the other.

**Notifications** (a message arrived, a locked message unlocked, the weekly
digest) go through Resend, from this codebase. Create a key at
[resend.com/api-keys](https://resend.com/api-keys) and set `RESEND_API_KEY` in
Vercel. Leave `EMAIL_FROM` unset and mail goes out from `onboarding@resend.dev`,
which Resend gives every account with no domain setup. The catch is that it only
delivers to the address that owns the Resend account. Your own vault works;
nobody else's does. Verify a domain at
[resend.com/domains](https://resend.com/domains) and set `EMAIL_FROM` to
something like `Echoes <hello@yourdomain.com>` to lift that.

**Auth mail** (confirm your address, reset your password) is sent by Supabase,
not by this code, so a Resend API key does nothing for it. Supabase's built-in
sender is rate-limited to a couple of messages an hour and is documented as
being for development only, which is enough to stall real sign-ups. Point it at
Resend under Supabase → Authentication → Emails → SMTP Settings:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key |
| Sender email | matches `EMAIL_FROM`, or `onboarding@resend.dev` |

The same free-sender restriction applies here: until a domain is verified, the
confirmation email only reaches the address that owns the Resend account.

Sign-up failing with **"Error sending confirmation email"** is this setting and
nothing else. Supabase's built-in sender allows two messages an hour across the
whole project and refuses any address that is not on the project team, so it
runs out almost immediately once real people try to sign up. Configuring SMTP
above is the fix; the app logs the same diagnosis when it happens.

`GET /api/health` reports which of these is live. `email_sender` reads `none`
with no key, `resend_sandbox` on the shared address, and `custom_domain` once
`EMAIL_FROM` is set.

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
