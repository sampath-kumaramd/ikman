# Scraper hosting & GitHub Actions limits

The Playwright scrape runs in **GitHub Actions** (`.github/workflows/scrape.yml`).

## Why it stops

On **private** repos, Free GitHub accounts get about **2,000 Actions minutes / month**.

Rough cost of this workflow:

| Schedule | Runs / month | If each job is ~3 min | Fits Free 2k min? |
|----------|--------------|------------------------|-------------------|
| Every 5 min | ~8,600 | ~25,000 min | No |
| Every 15 min | ~2,900 | ~8,700 min | No (unless jobs are ~1 min) |
| Every 30 min | ~1,440 | ~4,300 min | Borderline |
| Every 60 min | ~720 | ~2,160 min | Usually yes |

Playwright + `npm ci` often takes **2–8 minutes** per run, so a **5-minute cron** burns the quota quickly.

When minutes are exhausted, scheduled runs are skipped until the next billing cycle (or you add paid minutes).

**Public** repositories: standard GitHub-hosted runners are **not billed by minutes** the same way (free for public repos, subject to GitHub fair use). Making the repo public is the simplest “unlimited” option if that fits your product.

## What we already do

- Cron default: **every 15 minutes** (was every 5)
- **Concurrency** so scrapes don’t stack
- **Cache** npm + Playwright browsers (shorter jobs → fewer minutes)
- Manual **Run Now** / Telegram `/scrape` still use `workflow_dispatch`
- UI cooldown matches the 15-minute interval

## How to stay under Free private quota

### Option A — Slower cron (easiest)

In `.github/workflows/scrape.yml`:

```yaml
# every 30 minutes
- cron: '*/30 * * * *'

# or once per hour
- cron: '0 * * * *'
```

Commit and push. Update marketing copy if you change this.

### Option B — Public repository

If the code can be open source:

1. GitHub → repo **Settings → Change visibility → Public**
2. Keep secrets in Actions secrets (they stay private)
3. Scheduled scrapes no longer eat the Free private minutes pool

### Option C — Paid Actions minutes

GitHub → **Settings → Billing → Actions** and enable spending or upgrade plan.

### Option D — Run the scraper outside GitHub

Same command as CI, on a cheap always-on box or free-tier host with a cron:

```bash
npm ci
npx playwright install chromium --with-deps
# set env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN

# cron every 15 min
*/15 * * * * cd /path/to/ikman && npx tsx scraper/index.ts >> /var/log/ikman-scrape.log 2>&1
```

Then change “Run Now” to call that host (or keep GHA only for manual dispatch).

Examples: a $5 VPS, Railway/Render cron, a home always-on machine.

## Check usage

1. GitHub profile → **Settings → Billing → Plans and usage → Actions**
2. Repo → **Actions** tab → failed/skipped runs often say quota exceeded

## “Run Now” when Actions is out of minutes

If the quota is empty, **dashboard Run Now and `/scrape` will also fail** (they dispatch the same workflow). Fix minutes or run `npm run scrape` from a machine that has the env vars.

## Recommended setup for this product

| Goal | Recommendation |
|------|----------------|
| Lowest friction, open code OK | **Public repo** + 15 min cron |
| Private free | Cron **`*/30`** or **`0 * * * *`** + Playwright cache |
| Near real-time alerts | Small VPS + cron every 10–15 min (not Free private GHA) |
