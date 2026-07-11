# ikman Rental Tracker

Multi-user tracker for ikman.lk boarding & rental listings (apartments, annexes, houses). Each user signs up, sets their own search requirements (areas, property types, budget, bedrooms), connects their own Telegram chat, and gets an instant alert whenever a new matching listing is posted.

**Stack:** Next.js 16 · **Clerk** (auth) · **Supabase** (PostgreSQL only) · Playwright · Telegram Bot · GitHub Actions · Vercel

**Going live?** Use the [Production go-live checklist](PRODUCTION.md).

---

## Architecture

```
GitHub Actions (every 15 min; see docs/SCRAPER-HOSTING.md)
  └── Playwright scrapes ikman.lk (window.initialData)
        — one scrape covering the UNION of every user's areas/types
  └── New listings → shared Supabase pool
  └── Each new listing matched against EACH user's criteria
        → Telegram alert to that user's linked chat
        → in-app notification row for that user

Vercel (Next.js)
  └── Clerk Auth (sign-in / sign-up) — proxy.ts guards pages
  └── Supabase service role for all DB access (no Supabase Auth)
  └── First sign-in → forced onboarding wizard
        Step 1: search requirements   Step 2: connect Telegram
  └── Dashboard shows only listings matching the user's criteria
  └── "Run Now" button → triggers GitHub Actions
  └── /api/telegram-webhook → handles /start <code> account linking + commands
```

---

## Setup Guide

### 1. Supabase (database only)

1. Create a project at [supabase.com](https://supabase.com)
2. **SQL Editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql)  
   (fresh install uses **TEXT** `user_id` for Clerk ids)
3. Upgrading an existing multi-user DB that still uses UUID + `auth.users`? run  
   [`supabase/migration-clerk-user-ids.sql`](supabase/migration-clerk-user-ids.sql)
4. You do **not** need Supabase Auth providers for the app (Clerk handles login)

### 1b. Clerk (authentication)

1. Create/link an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Add API keys to `.env` / Vercel (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
3. Or run `clerk init` in the project root after `clerk auth login`
4. Allowed redirect URLs should include your production domain + `/sign-in` / `/sign-up`

### 2. Telegram Bot (one bot for the whole app)

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → note the **bot token**
2. Users never touch BotFather — they link their chat from inside the app
   via a `t.me/yourbot?start=<code>` deep link during onboarding.
3. Generate two secrets (e.g. `openssl rand -hex 32` twice):
   - `TELEGRAM_WEBHOOK_SECRET` — Telegram sends this on every update
   - `ADMIN_SETUP_SECRET` — protects the one-time register endpoint
4. After deploying (step 4), register the webhook once:
   ```
   https://your-app.vercel.app/api/telegram-webhook/register?secret=YOUR_ADMIN_SETUP_SECRET
   ```
   Or with a header: `Authorization: Bearer YOUR_ADMIN_SETUP_SECRET`

### 3. GitHub Actions Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Project Settings → API) |
| `TELEGRAM_BOT_TOKEN` | Bot token from Step 2 |
| `TELEGRAM_ADMIN_CHAT_ID` | *(optional)* chat that receives scrape progress messages |

### 4. Vercel Deployment

1. Import the repo at **vercel.com/new**
2. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `TELEGRAM_BOT_TOKEN` | Bot token from Step 2 |
| `TELEGRAM_WEBHOOK_SECRET` | Random secret for webhook verification |
| `ADMIN_SETUP_SECRET` | Random secret for webhook registration |
| `GITHUB_PAT` | GitHub Personal Access Token (scope: `workflow`) |
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | `ikman` (or your repo name) |

3. Deploy, then register the webhook (requires `ADMIN_SETUP_SECRET`):
   ```
   https://your-app.vercel.app/api/telegram-webhook/register?secret=YOUR_ADMIN_SETUP_SECRET
   ```

### 5. Local Development

```bash
cp .env.example .env
# Fill in the values

npm run dev        # Start Next.js at http://localhost:3000
npm run scrape     # Run scraper manually (loads .env via --env-file)
```

> Telegram linking locally: the webhook must be reachable by Telegram, so either
> point the webhook at a tunnel (e.g. `ngrok`) or at your deployed app while
> developing other features.

---

## User flow

1. **Sign up / sign in** at `/sign-up` / `/sign-in` (Clerk). Password recovery is handled by Clerk.
2. **Onboarding (forced on first sign-in):**
   - Step 1 — pick supported areas, property types, max rent, bedrooms (required)
   - Step 2 — press **Connect Telegram**, hit **Start** in the chat that opens (optional; can finish later)
3. **Dashboard** — only listings matching *your* criteria, with per-user NEW/viewed state
4. **Settings** — change criteria, toggle alerts, test message, unlink/relink Telegram, delete account
5. **Telegram commands** (linked chats only): `/scrape`, `/status`, `/help`
6. **Public pages:** `/privacy`, `/terms`

---

## Files

```
proxy.ts                 Auth guard for all pages (Next 16 proxy, ex-middleware)

app/
  login/                 Sign in / create account
  onboarding/            Forced first-time setup wizard
  auth/callback/         Supabase email-confirmation redirect
  (app)/
    layout.tsx           Auth + onboarding gate, header, user menu
    page.tsx             Dashboard (per-user listings)
    settings/page.tsx    Settings
  api/
    listings/            GET per-user listings, PATCH viewed state
    settings/            GET/PUT the user's criteria
    notifications/       GET unread, POST mark-all-read (per user)
    onboarding/          POST — mark onboarding complete
    telegram/connect/    POST deep link · GET status · DELETE unlink
    telegram/test/       POST test message to the user's chat
    telegram-webhook/    Telegram updates: /start linking + commands
    trigger-scrape/      POST → triggers GitHub Actions (15 min cooldown)
    account/             DELETE → delete the signed-in user

components/
  AuthForm.tsx           Sign in / sign up form
  OnboardingWizard.tsx   Two-step forced setup
  CriteriaForm.tsx       Shared search-criteria editor
  TelegramConnect.tsx    Connect / test / unlink Telegram
  UserMenu.tsx           Account dropdown + sign out
  ListingCard.tsx        Individual listing card
  FilterBar.tsx          Area / type / price / bedrooms filters
  NotificationBell.tsx   Bell with unread count dropdown
  SettingsForm.tsx       Settings page form

lib/
  types.ts               Shared TypeScript types
  supabase.ts            Service-role client (server data access)
  supabase-server.ts     Cookie-bound auth client (RSC / route handlers)
  supabase-browser.ts    Browser auth client
  db.ts                  All database queries (per-user scoped)

scraper/
  scraper.ts             Playwright ikman.lk scraper
  telegram.ts            Telegram send + message builder
  progress.ts            Scrape run progress (DB + optional admin chat)
  index.ts               Entry point: union scrape → per-user match & notify

supabase/
  schema.sql                  Full schema for fresh installs
  migration-multi-user.sql    Upgrade script for existing databases

.github/workflows/
  scrape.yml             Cron job (every 15 min) + manual trigger
```
