# Production go-live checklist

Use this before pointing real users at the app. Code-side publish work (areas, password reset, webhook secrets, scrape cooldown, legal pages, SEO, account delete) is already in the repo. What’s left is mostly **configuration and smoke-testing**.

Mark items as you complete them.

## Status snapshot (local verification)

Last checked from this machine (secrets not stored here):

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| `npm run check:prod-env` (required keys) | Pass — secrets generated into local `.env` |
| Supabase Auth health | Reachable |
| Schema tables (`listings`, `user_settings`, `scrape_runs`) | Present (`listings` has data; scrapes have completed) |
| Telegram `getMe` | Bot token valid |
| GitHub `scrape.yml` via PAT | Workflow active |
| `TELEGRAM_WEBHOOK_SECRET` / `ADMIN_SETUP_SECRET` | Set **locally** — still must set on **Vercel** |
| Production webhook | Registered at `https://ikman-iota.vercel.app/api/telegram-webhook` **with secret** |
| Vercel env secrets | `TELEGRAM_WEBHOOK_SECRET`, `ADMIN_SETUP_SECRET`, `NEXT_PUBLIC_APP_URL` on Production |
| Latest prod deploy | Live at https://ikman-iota.vercel.app (publish-readiness code) |
| Public pages `/`, `/privacy`, `/terms`, `/login` | HTTP 200 |
| Register / webhook without secret | HTTP 401 (as expected) |
| Full production smoke test (§6) | **Pending — do this in the browser** |

### Done via CLI

1. Vercel CLI installed + logged in as `sampath-kumaramd`
2. Project linked: `sampathkumaramds-projects/ikman`
3. Production env vars added (webhook secrets + app URL)
4. `vercel deploy --prod` succeeded
5. Telegram webhook re-registered with secret

### Still do manually (browser)

1. Supabase **Site URL** + redirect: `https://ikman-iota.vercel.app` and `…/auth/callback`
2. Full §6 smoke test (signup → Telegram → Run Now → password reset → delete account)
3. (Optional) set `TELEGRAM_ADMIN_CHAT_ID` in GitHub Actions for scrape progress

---

## 0. Pre-flight (local)

- [ ] `npm run build` succeeds
- [ ] `.env` has all required keys (see §1)
- [ ] `npm run check:prod-env` reports required keys **OK**
- [ ] You can run `npm run scrape` once against your Supabase project
- [ ] Repo does not commit `.env` (check `.gitignore`)

```bash
npm run check:prod-env          # report only
npm run check:prod-env:strict   # exit 1 if missing keys
```

---

## 1. Environment variables

### Vercel (Production)

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only — never expose to the browser |
| `TELEGRAM_BOT_TOKEN` | Yes | From @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Yes | Random (`openssl rand -hex 32`) |
| `ADMIN_SETUP_SECRET` | Yes | Random (`openssl rand -hex 32`) — webhook register only |
| `GITHUB_PAT` | Yes | PAT with `workflow` scope |
| `GITHUB_OWNER` | Yes | GitHub username/org |
| `GITHUB_REPO` | Yes | e.g. `ikman` |
| `GITHUB_BRANCH` | Recommended | Default `master` |
| `NEXT_PUBLIC_APP_URL` | Recommended | `https://your-domain.com` (OG, sitemap, robots) |
| `TELEGRAM_ADMIN_CHAT_ID` | Optional | On Vercel only if you need it in app routes; scraper uses Actions |

### GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**

| Secret | Required |
|--------|----------|
| `SUPABASE_URL` | Yes (same as project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `TELEGRAM_BOT_TOKEN` | Yes |
| `TELEGRAM_ADMIN_CHAT_ID` | Optional (scrape progress messages) |

### Local `.env`

Copy from [`.env.example`](.env.example). Generate secrets:

```bash
openssl rand -hex 32   # → TELEGRAM_WEBHOOK_SECRET
openssl rand -hex 32   # → ADMIN_SETUP_SECRET
```

- [ ] Vercel Production env complete
- [ ] GitHub Actions secrets complete
- [ ] Local `.env` has webhook + admin secrets
- [ ] Redeploy Vercel after adding/changing env vars

---

## 2. Supabase

- [ ] Schema applied: run [`supabase/schema.sql`](supabase/schema.sql) (or migration if upgrading)
- [ ] **Authentication → Providers → Email** enabled
- [ ] Confirm-email policy decided:
  - Production: usually **on** (users confirm before use)
  - Soft test: off is OK; turn on before wide launch
- [ ] **Authentication → URL configuration**
  - Site URL = `https://your-domain.com`
  - Redirect URLs include:
    - `https://your-domain.com/auth/callback`
    - `http://localhost:3000/auth/callback` (dev)
- [ ] Service role key only in server envs (Vercel / Actions), not in client code
- [ ] (Optional) Enable point-in-time recovery / backups on paid plan

---

## 3. Telegram

1. Bot exists via [@BotFather](https://t.me/BotFather); token in Vercel + Actions.
2. After **production** deploy with secrets set, register the webhook **once**:

```bash
# Replace domain + secret
curl -sS "https://YOUR-DOMAIN.com/api/telegram-webhook/register?secret=YOUR_ADMIN_SETUP_SECRET"
```

Expected: `{ "ok": true, "message": "Webhook registered at …" }`

3. Security checks:

```bash
# Must return 401
curl -sS -o /dev/null -w "%{http_code}\n" "https://YOUR-DOMAIN.com/api/telegram-webhook/register"

# Must return 401 without secret header
curl -sS -o /dev/null -w "%{http_code}\n" -X POST "https://YOUR-DOMAIN.com/api/telegram-webhook" \
  -H "Content-Type: application/json" -d '{}'
```

- [ ] Webhook registered with secret
- [ ] Register without secret → 401
- [ ] Webhook POST without secret → 401
- [ ] In-app Connect Telegram → Start → “connected”
- [ ] Settings → send test message works
- [ ] `/status`, `/help`, `/scrape` work for linked chat

---

## 4. GitHub Actions (scraper)

- [ ] Workflow file present: [`.github/workflows/scrape.yml`](.github/workflows/scrape.yml)
- [ ] Manual run: Actions → **Scrape ikman.lk** → Run workflow → green
- [ ] Logs show users scraped / listings processed (or clean skip if no onboarded users)
- [ ] Cron every 5 minutes is acceptable for your Actions minutes budget
- [ ] `GITHUB_PAT` can dispatch workflows on this repo
- [ ] `GITHUB_BRANCH` matches the default branch name

---

## 5. Vercel / domain

- [ ] Production deployment is green
- [ ] Custom domain + HTTPS
- [ ] Env vars applied to **Production** environment
- [ ] `NEXT_PUBLIC_APP_URL` matches the public URL
- [ ] `/robots.txt` and `/sitemap.xml` resolve and list public routes only
- [ ] Favicon / OG look correct when sharing a link

---

## 6. End-to-end smoke test (production URL)

Use a **throwaway** account.

| # | Step | Pass? |
|---|------|-------|
| 1 | Landing loads; Privacy + Terms open logged out | ☐ |
| 2 | Sign up (confirm email if enabled) | ☐ |
| 3 | Onboarding: pick supported areas → finish | ☐ |
| 4 | Connect Telegram + test message | ☐ |
| 5 | Dashboard loads; filters work | ☐ |
| 6 | **Run Now** once → wait ~2 min → data or scrape_runs update | ☐ |
| 7 | **Run Now** again immediately → rate-limit error | ☐ |
| 8 | Forgot password → email → new password → sign in | ☐ |
| 9 | Delete account → cannot sign in | ☐ |
| 10 | Second user: criteria/alerts isolated from first | ☐ |

If step 6 fails: GitHub Actions logs → Supabase tables (`scrape_runs`, `listings`) → env secrets.

---

## 7. Scraper health

- [ ] At least one successful scrape against live ikman.lk
- [ ] Supported areas only ([`lib/areas.ts`](lib/areas.ts))
- [ ] New matching listing creates `notifications` row and Telegram (if connected)
- [ ] You know how you’ll notice breakage: failed Actions, empty scrapes, or admin chat

**Known risk:** ikman HTML / `window.initialData` can change. Plan to re-check the scraper after site updates.

---

## 8. Security pass

- [ ] Webhook and register endpoints reject unauthorized callers
- [ ] Scrape trigger has 5-minute cooldown
- [ ] Service role never appears in browser Network tab
- [ ] GitHub PAT least-privilege; rotate if exposed
- [ ] Don’t paste `ADMIN_SETUP_SECRET` into public chats; use private notes
- [ ] (Optional later) CAPTCHA / rate limit on signup if spam appears

---

## 9. Legal / product

- [ ] You accept scraping / ToS risk for your launch type (portfolio vs public product)
- [ ] [`/privacy`](app/privacy/page.tsx) and [`/terms`](app/terms/page.tsx) match real behavior
- [ ] Support path clear (GitHub Issues or email)
- [ ] Marketing only claims supported areas and realistic scrape cadence
- [ ] (If open source) add a `LICENSE` file

---

## 10. Soft-launch ops (first 24–48 hours)

- [ ] Watch Vercel runtime logs for 5xx
- [ ] Watch GitHub Actions for failed scrapes
- [ ] Know how to pause: disable workflow schedule or unregister/stop bot
- [ ] Supabase usage within free/paid limits
- [ ] Actions minutes not burning unexpectedly

---

## Ship bar (minimum)

You are ready for a careful public soft launch when:

1. Production deploy has full env (including both new secrets)
2. Telegram webhook registered with secret
3. At least one green Actions scrape on production data
4. Throwaway user completes signup → criteria → Telegram → one real alert
5. Password reset and account delete verified once
6. You know where logs live (Vercel + Actions + Supabase)

---

## Quick commands

```bash
# Local
npm run build
npm run dev
npm run scrape
npm run check:prod-env

# Generate secrets
openssl rand -hex 32

# Register Telegram webhook (production)
curl -sS "https://YOUR-DOMAIN.com/api/telegram-webhook/register?secret=YOUR_ADMIN_SETUP_SECRET"

# Trigger scrape workflow (requires gh CLI + auth)
gh workflow run scrape.yml
# or: GitHub → Actions → Scrape ikman.lk → Run workflow
```

---

## Related docs

- Setup overview: [README.md](README.md)
- Schema: [supabase/schema.sql](supabase/schema.sql)
- Env template: [.env.example](.env.example)
- Scraper entry: [scraper/index.ts](scraper/index.ts)
