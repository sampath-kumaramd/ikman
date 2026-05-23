# ikman Rental Tracker

Monitors ikman.lk for apartment, annex, and house rentals along Galle Road (Moratuwa, Ratmalana, Mount Lavinia, Dehiwala). Sends WhatsApp alerts for new listings and shows them in a web dashboard.

**Stack:** Next.js 16 · Supabase (PostgreSQL) · Playwright · CallMeBot · GitHub Actions · Vercel

---

## Architecture

```
GitHub Actions (every 30 min)
  └── Playwright scrapes ikman.lk
  └── New listings → Supabase DB
  └── WhatsApp alert via CallMeBot

Vercel (Next.js)
  └── Dashboard shows listings from Supabase
  └── "Run Now" button → triggers GitHub Actions
  └── Settings page → configures all options
```

---

## Setup Guide

### 1. Supabase Database

1. Open your Supabase project → **SQL Editor**
2. Paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql)

### 2. WhatsApp (CallMeBot) — free

1. Add **+34 644 59 60 01** to your WhatsApp contacts (name it "CallMeBot")
2. Send the message: `I allow callmebot to send me messages`
3. You'll receive your **API key** in reply
4. Save it as the `CALLMEBOT_API_KEY` GitHub secret (see Step 4)

### 3. GitHub Repository

Push this code to a GitHub repo:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ikman.git
git push -u origin main
```

### 4. GitHub Actions Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (from Project Settings → API) |
| `CALLMEBOT_API_KEY` | Your CallMeBot API key from Step 2 |
| `WHATSAPP_NUMBER` | Your number with country code: `+94760937443` |

### 5. Vercel Deployment

1. Import the repo at **vercel.com/new**
2. Add these **Environment Variables** in Vercel:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GITHUB_PAT` | GitHub Personal Access Token (scope: `workflow`) |
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | `ikman` (or your repo name) |

3. Deploy — done!

### 6. Local Development

```bash
cp .env.local.example .env.local
# Fill in the values in .env.local

npm run dev        # Start Next.js at http://localhost:3000
npm run scrape     # Run scraper manually (needs Playwright Chromium)
```

Install Playwright browser once:
```bash
npx playwright install chromium
```

---

## Usage

| Feature | How |
|---------|-----|
| View listings | Open the dashboard at your Vercel URL |
| Filter by area, type, price | Use the filter bar |
| New listing alerts | Notification bell (top right) + WhatsApp |
| Run scrape immediately | Click **Run Now** button on dashboard |
| Change search areas / price / interval | Go to **Settings** (gear icon) |

---

## Changing the Scrape Interval

The default is every 30 minutes. To change it:

1. Edit `.github/workflows/scrape.yml` → `cron: '*/30 * * * *'`
2. Common values:
   - Every 15 min: `*/15 * * * *`
   - Every hour: `0 * * * *`
   - Every 2 hours: `0 */2 * * *`
3. Push the change — GitHub Actions updates automatically

---

## Files

```
app/
  page.tsx              Dashboard
  settings/page.tsx     Settings
  api/
    listings/           GET listings, PATCH mark-read
    settings/           GET/PUT settings
    notifications/      GET unread, POST mark-all-read
    trigger-scrape/     POST → triggers GitHub Actions

components/
  ListingCard.tsx       Individual listing card
  FilterBar.tsx         Area / type / price / bedrooms filters
  NotificationBell.tsx  Bell with unread count dropdown
  SettingsForm.tsx      Full settings editor

lib/
  types.ts              Shared TypeScript types
  supabase.ts           Supabase client (lazy)
  db.ts                 All database queries

scraper/
  scraper.ts            Playwright ikman.lk scraper
  whatsapp.ts           CallMeBot notification helper
  index.ts              Main entry point (run by GitHub Actions)

supabase/
  schema.sql            Database schema (run once in Supabase SQL editor)

.github/workflows/
  scrape.yml            Cron job + manual trigger
```
