# TripSplit

Split group trip expenses without the spreadsheet. The organiser creates a trip and adds who's going. Each person gets a private link to add what they paid, and TripSplit works out the fewest transfers to settle up.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Supabase Auth · PostgreSQL via Prisma 7

## Features

- Trips with dates, currency (AED, USD, EUR, GBP, INR, AUD, CAD) and members
- Per-expense splits: choose exactly who shared each cost
- **Member links:** each member gets a private `/m/<token>` link to add and edit only the expenses they paid, and to view the settlement. No account is needed. The organiser can reset any link.
- The organiser can also enter or edit everyone's expenses. Saves only change the rows that were edited, so the organiser and members never overwrite each other.
- Settlement view (who pays whom), expense ledger and per-person stats
- Copy a WhatsApp-ready summary, or print/save as PDF
- Mark a trip completed to lock it
- Email/password auth with confirmation, password reset and password change

## Run locally

Requires Node.js 20.9+ (22.6+ to run the tests).

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run db:push              # create/update tables in your database
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check |
| `npm test` | Unit tests for the settlement maths |
| `npm run db:push` | Sync `prisma/schema.prisma` to the database (uses `DIRECT_URL`) |

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo. The framework is detected as Next.js automatically.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` and `NEXT_PUBLIC_SITE_URL` (see `.env.example`). `DIRECT_URL` is only needed where you run `db:push`.
4. Deploy.
5. In Supabase, go to **Authentication → URL Configuration**. Set **Site URL** to your Vercel URL (live: `https://trip-split-peach.vercel.app`), and add these to **Redirect URLs**:
   - `https://trip-split-peach.vercel.app/**`
   - `http://localhost:3000/**` (for local development)

   The **Site URL** is what `{{ .SiteURL }}` becomes in the email templates, so email links always open the live site.
6. In Vercel, set `NEXT_PUBLIC_SITE_URL=https://trip-split-peach.vercel.app` and redeploy (it's read at build time). Member links shared on WhatsApp use it.

## Emails (sign-up confirmation and password reset)

Supabase sends these emails. Out of the box it uses its built-in sender, which:

- only delivers to the email addresses of your Supabase team members (other people never receive anything),
- is limited to a few emails per hour, and
- shows the sender as **"Supabase Auth"**.

To make emails reach real users and show **TripSplit** as the sender, connect your own SMTP service once:

1. **Pick a provider.** Two that need no domain of your own:
   - **Brevo** (free, 300 emails/day): sign up, verify the address you'll send from under *Senders*, then create an SMTP key under *SMTP & API*. Host `smtp-relay.brevo.com`, port `587`.
   - **Gmail** (free, about 500/day): turn on 2-step verification, create an *App password*, then use host `smtp.gmail.com`, port `465`, your Gmail address as the username and the app password as the password.
2. In Supabase, go to **Authentication → Emails → SMTP Settings** and turn on *Enable custom SMTP*:
   - **Sender email:** the address you verified (e.g. `tripsplit.app@gmail.com`)
   - **Sender name:** `TripSplit`
   - Host, port, username and password from step 1.
3. Under **Authentication → Emails → Templates**, paste the branded templates from this repo. Their links go to `/auth/confirm`, which works on any device (a reset requested on a laptop can be finished on a phone); the default `{{ .ConfirmationURL }}` links only work in the browser that asked for them:
   - *Confirm signup*: subject `Confirm your TripSplit account`, body from `supabase/templates/confirm-signup.html`
   - *Reset password*: subject `Reset your TripSplit password`, body from `supabase/templates/reset-password.html`
4. Under **Authentication → Rate Limits**, raise *Emails sent per hour* (e.g. to 30) now that you use your own SMTP.
5. Check **Authentication → URL Configuration** (see Deploy step 5) so the links in these emails are allowed.

If an email still doesn't arrive, **Authentication → Logs** in Supabase shows the exact error. The app also shows Supabase's error message on screen.

## Database changes

Schema changes are applied with `npm run db:push`. The member-links feature adds one nullable column:

```sql
ALTER TABLE "Member" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "Member_shareToken_key" ON "Member"("shareToken");
```

Existing trips keep working. Links are created the first time the organiser opens **Let members add their own expenses**.

### Lock down Supabase's auto-generated API (important)

Supabase exposes every table in the `public` schema through its REST API, and the anon key is public in the browser. This app only talks to the database through Prisma on the server, so turn on Row Level Security with **no policies**. That blocks the REST API while Prisma, which connects as the `postgres` role, keeps working. Run this once in the Supabase SQL editor:

```sql
ALTER TABLE "User"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Member"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Split"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
```

## Project structure

```
app/
  page.tsx                 Landing page (with a live, interactive split demo)
  dashboard/               Trip list
  wizard/                  Create/edit trip → expenses → settlement (owner only)
  m/[token]/               Member page reached through a personal link
  auth/callback/           Exchanges Supabase email-link codes for a session
  actions/                 Server actions (all check ownership or the member token)
  components/              Shared UI (ExpenseEditor, SharePanel, AppShell, …)
lib/
  settlement.ts            Pure balance and settlement maths (unit-tested)
  access.ts                Ownership and share-token checks
  auth.ts, db.ts           Supabase user lookup and Prisma client
proxy.ts                   Route protection (Next.js 16's replacement for middleware)
prisma/schema.prisma       Database schema
```

## Security notes

- Every trip page and server action checks that the signed-in user owns the trip. Other users get a 404.
- Member links are 24-character random tokens. A link can only edit the expenses of the member it belongs to, and stops working once the organiser resets it or marks the trip completed.
- Member pages send `Referrer-Policy: no-referrer` and `noindex`, so tokens don't leak to other sites or search engines.
- Sign-up and forgot-password tell people whether an email is already registered (a deliberate choice for clarity). Supabase's own rate limits apply to these forms.
