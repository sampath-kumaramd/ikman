#!/usr/bin/env bash
# Scheduled scrape runner for EC2/VPS.
# - One scrape at a time (flock)
# - Hard time limit so a hung/long first run cannot block forever
#
# Crontab example (every 10 min):
#   */10 * * * * /opt/ikman/scripts/run-scrape.sh >> /home/ubuntu/scrape.log 2>&1

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ikman}"
LOCK_FILE="${LOCK_FILE:-/tmp/ikman-scrape.lock}"
# Kill scrape after this many seconds (default 12 min — leave room before next 10-min tick)
SCRAPE_TIMEOUT_SEC="${SCRAPE_TIMEOUT_SEC:-720}"

cd "$APP_DIR"

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "$(date -Is) ERROR: missing $APP_DIR/.env"
  exit 1
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  # Who holds the lock? (best-effort)
  holder="$(fuser "$LOCK_FILE" 2>/dev/null || true)"
  echo "$(date -Is) scrape already running — skip${holder:+ (pids:${holder})}"
  exit 0
fi

set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a

echo "$(date -Is) scrape start (timeout ${SCRAPE_TIMEOUT_SEC}s, pid $$)"
start_ts=$(date +%s)

# timeout sends SIGTERM, then SIGKILL; flock is released when this shell exits
set +e
if command -v timeout >/dev/null 2>&1; then
  timeout --signal=TERM --kill-after=30s "$SCRAPE_TIMEOUT_SEC" \
    npx tsx scraper/index.ts
  code=$?
else
  npx tsx scraper/index.ts
  code=$?
fi
set -e

end_ts=$(date +%s)
elapsed=$((end_ts - start_ts))

if [[ $code -eq 124 ]] || [[ $code -eq 137 ]]; then
  echo "$(date -Is) scrape KILLED after ${elapsed}s (timeout ${SCRAPE_TIMEOUT_SEC}s) — next cron can run"
  exit 1
fi

if [[ $code -ne 0 ]]; then
  echo "$(date -Is) scrape FAILED exit=$code after ${elapsed}s"
  exit "$code"
fi

echo "$(date -Is) scrape end ok after ${elapsed}s"
