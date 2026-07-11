#!/usr/bin/env node
/**
 * Non-destructive production env check.
 * Loads .env if present (does not print secret values).
 * Usage: node scripts/check-prod-env.mjs
 *        node scripts/check-prod-env.mjs --strict   # exit 1 if anything missing
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const strict = process.argv.includes('--strict')

function loadDotEnv(path) {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

loadDotEnv(resolve(process.cwd(), '.env'))

const REQUIRED_APP = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'ADMIN_SETUP_SECRET',
  'GITHUB_PAT',
  'GITHUB_OWNER',
  'GITHUB_REPO',
]

const REQUIRED_ACTIONS = [
  'SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL', // either name works for scraper
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
]

const RECOMMENDED = [
  'NEXT_PUBLIC_APP_URL',
  'GITHUB_BRANCH',
  'TELEGRAM_ADMIN_CHAT_ID',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
]

function present(keyExpr) {
  const keys = keyExpr.split('|')
  return keys.some((k) => {
    const v = process.env[k]
    return typeof v === 'string' && v.trim().length > 0
  })
}

function status(keyExpr) {
  return present(keyExpr) ? 'OK' : 'MISSING'
}

console.log('Production env check (values hidden)\n')
console.log('── App / Vercel (required) ──')
let missing = 0
for (const k of REQUIRED_APP) {
  const s = status(k)
  if (s === 'MISSING') missing++
  console.log(`  [${s}] ${k}`)
}

console.log('\n── Scraper / GitHub Actions (required) ──')
for (const k of REQUIRED_ACTIONS) {
  const s = status(k)
  // Don't double-count SUPABASE_SERVICE_ROLE_KEY / TELEGRAM_BOT_TOKEN
  if (s === 'MISSING' && !REQUIRED_APP.includes(k) && !k.includes('|')) missing++
  if (k.includes('|') && s === 'MISSING') missing++
  console.log(`  [${s}] ${k}`)
}

console.log('\n── Recommended ──')
for (const k of RECOMMENDED) {
  console.log(`  [${status(k)}] ${k}`)
}

console.log('\n── Notes ──')
console.log('  • After deploy: register Telegram webhook (see PRODUCTION.md §3)')
console.log('  • Set the same secrets on Vercel Production + GitHub Actions')
console.log('  • NEXT_PUBLIC_APP_URL should be your public https URL')

if (missing > 0) {
  console.log(`\nResult: ${missing} required key(s) missing`)
  if (strict) process.exit(1)
  process.exit(0)
}

console.log('\nResult: all required keys present in this environment')
