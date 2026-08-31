# Decisions and assumptions

The brief left room in a number of places. Every choice made in that room is
recorded here, with the reasoning, so it can be argued with.

---

## Product

### 1. Deleting is reversible; the account is not

The brief says "archive or delete". Delete now means *soft* delete: 30 days in
Trash, with an undo in the toast that appears the moment you do it. Permanent
deletion exists, but only from Trash and only after a second confirmation.

These messages are irreplaceable and often arrive on a phone. A mis-tap that
destroys the last thing a grandparent wrote is not a recoverable product
failure. Account deletion, by contrast, is immediate and total — someone
leaving should not have to trust a retention timer.

### 2. A "sealed" message is announced, but not readable

The brief allows a sender to choose a future delivery date. Two readings were
possible: hide the message's existence entirely until then, or reveal that
something is waiting.

We reveal the *shape* — that a message exists, whether it has a name on it,
whether it has a photo or a recording, and exactly when it opens — and nothing
else. Anticipation is most of the gift; a message that appears from nowhere
loses the months of knowing it is coming. The content is withheld by the
database, not by the UI (see `ARCHITECTURE.md`), so "no peeking" is a technical
guarantee rather than a promise.

Bounds: no earlier than tomorrow, no later than twenty years out. Twenty years
is roughly the longest horizon over which promising to keep something is
honest.

### 3. Held, never dropped

Spam scoring holds a suspicious message for review instead of discarding it.
The recipient sees it, marked, with the specific reasons listed. A false
positive that silently eats a heartfelt message is a far worse outcome than a
spam message sitting in an inbox with a warning on it.

### 4. The profanity filter softens; it never censors

Made opt-out (on by default) and scoped to *previews only*. Flagged words are
masked in list views, with "show the words exactly as they were written" one
click away in the detail view.

Heartfelt messages swear. "That was a hell of a year and you got me through it"
is not abuse, and an aggressive filter would mangle real sentiment far more
often than it would spare anyone. Genuine abuse is a job for reporting, not
word lists.

### 5. Anonymous is the default, and that is a feature

Sender name is optional, and the placeholder literally reads "Anonymous". Some
of the most affecting messages people receive are unsigned — the person on the
bus, the colleague who never said it. Recipients who would rather know can
switch on "require a name" in settings, which the API enforces too.

Senders may optionally leave an email so the recipient can reply. It is stored
on the message and shown only to the recipient.

### 6. Public pages are never indexed

Not in the sitemap, `noindex` in metadata, `X-Robots-Tag` at the edge,
disallowed in `robots.txt`. A share link is for the people you give it to. The
brief called for a shareable URL, not a discoverable directory, and the
difference matters for anyone who does not want their name and face turning up
in a search result.

The `unlisted` visibility setting goes further and hides the public message
count.

### 7. A prompt for senders, not just a bio

Added `welcome_note` — one line shown prominently on the public page ("Tell me
something you have never said out loud"). In testing thinking about this
product, the difference between "leave a message" and a specific question is
the difference between "happy birthday!" and something worth keeping. It is the
highest-leverage field on the whole page.

The composer also offers four one-tap prompts for senders staring at a blank
box.

### 8. Folders became "collections", and are optional

The brief said "folders table if needed". Implemented, but deliberately
peripheral: no folder appears in the sidebar until you make one, and deleting a
collection never deletes the messages in it (a database trigger also stops a
message being filed into someone else's collection). Most people will never
create one, and the product is complete without them.

### 9. Notification cadence is a choice, not a setting nobody finds

Four options — instant, daily, weekly, off — surfaced as cards rather than a
select. A vault that emails you every time it fills is a notification tower;
one that never emails you is forgotten. Sealed messages are always announced
twice regardless of cadence: once when they arrive, once when they open.

### 10. Extra screens beyond the brief

`/scheduled` (sealed), `/trash`, and a `?edit=1` mode on `/setup`. The brief
implies all three (future delivery, delete, edit profile) without naming them
as screens.

---

## Technical

### 11. Cloudflare Turnstile rather than reCAPTCHA

Free, no cookie banner implications in the EU, and in `interaction-only` mode
the overwhelming majority of senders never see a challenge. The person leaving
a message may well be a 78-year-old on a borrowed phone; a grid of traffic
lights is where they give up.

### 12. Database-backed rate limiting

Serverless functions share no memory, so an in-process counter resets on every
cold start. `check_rate_limit()` records the hit and decides in one round trip.
Limits are enforced per sender IP hash *and* per recipient, so a profile cannot
be flooded from many IPs each staying under its own limit.

If the limiter itself errors, it **fails open** and logs loudly. A limiter
outage must not cost someone their message.

### 13. Passwords, not magic links

Magic links are lovely until someone opens the email in a webview and the
session lands in the wrong browser. Password sign-up with email confirmation is
duller and more predictable, and password reset is a one-time link, so the
recovery path is still passwordless.

### 14. A profile row exists from the moment of signup

`handle_new_user()` creates a `profiles` row with a generated placeholder
username derived from the email (or the handle claimed on the landing page).
`onboarded_at` stays null until setup completes, and middleware routes to
`/setup` until it does.

Every downstream query can therefore assume a profile exists. The alternative —
creating the profile at the end of setup — leaves a window where a signed-in
user has no row, and every query has to handle it.

### 15. Reserved usernames live in the database

`is_reserved_username()` is a SQL function called from a trigger, not just an
app-layer check, so the constraint cannot be bypassed by writing directly
through the API. The list covers route names, support identities and obvious
impersonation bait.

### 16. Grants are explicit, not inherited

Supabase grants a permissive baseline to `anon` and `authenticated` on new
tables in `public`. The migrations revoke that and re-grant every privilege
explicitly. The schema then behaves identically on a plain PostgreSQL server —
which is how the test suite runs — and cannot be silently widened by a change
to platform defaults. This was caught by the test suite, not by inspection.

### 17. Hand-written database types

`lib/supabase/database.types.ts` is authored rather than generated, so the repo
type-checks without a running database. `npm run db:types` regenerates it from
a live schema when the two drift.

(A note for anyone editing it: the schema must be `type` aliases, not
`interface`. Interfaces get no implicit index signature, so an interface-based
schema silently fails Supabase's `Record<string, …>` constraint and every query
degrades to `never`.)

### 18. Analytics carry no message content

`autocapture` off, manual pageviews, auth tokens stripped from recorded URLs.
Events carry lengths, booleans and ids. For a product whose entire promise is
"nobody else reads this", shipping message text to a third-party analytics
vendor would be a contradiction, not a trade-off.

### 19. AI summaries are a button, never a background job

The brief asked for OpenAI summaries. Sending every incoming message to a third
party the moment it arrives would break the same promise as above, so a summary
runs only when the recipient presses "Sum this up for me", and the result is
cached so it happens at most once per message. The prompt asks for a warm
sentence addressed to the recipient — a clinical abstract of a loving message
is worse than no summary.

### 20. Built as `echoes/` beside the existing site

This repository already contains the Reinfora marketing site at its root, and
both applications want `/`. Echoes is therefore a self-contained application in
`echoes/` with its own `package.json`, rather than something that overwrites
unrelated work. Deploy it with **Root Directory = `echoes`**. The root
`tsconfig.json` excludes it so the two type-check independently.

---

## Known limitations

- **Voice recording** uses `MediaRecorder`, which is unavailable in a few older
  mobile browsers. The recorder detects this and says so; everything else on
  the page still works.
- **Image handling** stores the original. No server-side resizing or EXIF
  stripping yet — worth adding before real traffic, both for bandwidth and
  because EXIF can carry a sender's location.
- **Moderation review** has no admin UI. Held messages and reports are visible
  to the recipient and queryable in the database; a reviewer console is the
  obvious next build.
- **Search** is Postgres full-text with an English configuration. Good for
  English prose, weaker for other languages. A trigram index is in place for
  fuzzy matching but is not yet wired into the query.
- **Testing** covers the database layer thoroughly (see
  `supabase/tests/rls_test.sql`) and the application layer through
  `tsc --noEmit` and a production build. There is no end-to-end browser suite;
  that is the first thing to add.
