import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright'
import { runScraper, enrichListingsWithDetails, sanitizeListingForDb } from './scraper'
import { sendTelegram, buildListingMessage } from './telegram'
import {
  getOnboardedUserSettings, upsertListings, getExistingIkmanIds, createNotification,
} from '../lib/db'
import { ScrapeProgress } from './progress'
import type { Listing, UserSettings } from '../lib/types'

/** Does a saved listing match one user's criteria? Null fields pass (price on request etc.). */
function matchesUser(listing: Listing, user: UserSettings): boolean {
  if (!listing.area || !user.areas.includes(listing.area)) return false
  if (listing.listing_type && !user.listing_types.includes(listing.listing_type)) return false
  if (listing.price != null && listing.price > user.max_price) return false
  if (listing.bedrooms != null) {
    if (listing.bedrooms < user.min_bedrooms) return false
    if (listing.bedrooms > user.max_bedrooms) return false
  }
  return true
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const db       = createClient(supabaseUrl, serviceKey)
  const progress = new ScrapeProgress(db)

  await progress.start()

  try {
    // ── Users ─────────────────────────────────────────────────────────────────
    const users = await getOnboardedUserSettings(db)
    await progress.step(`${users.length} active user${users.length !== 1 ? 's' : ''}`)

    if (!users.length) {
      await progress.done(0, 0)
      console.log('No onboarded users yet — skipping scrape.')
      return
    }

    // ── Union of all users' criteria — one scrape covers everyone ─────────────
    const areas         = [...new Set(users.flatMap((u) => u.areas))]
    const listingTypes  = [...new Set(users.flatMap((u) => u.listing_types))]
    const maxPrice      = Math.max(...users.map((u) => u.max_price))
    const minBedrooms   = Math.min(...users.map((u) => u.min_bedrooms))
    const maxBedrooms   = Math.max(...users.map((u) => u.max_bedrooms))

    // ── Existing IDs ──────────────────────────────────────────────────────────
    const existingIds = await getExistingIkmanIds(db)
    await progress.step(`${existingIds.size} existing listings in DB`)

    // ── Scrape ────────────────────────────────────────────────────────────────
    await progress.step(`Scraping ${areas.length} area(s) × ${listingTypes.length} type(s)…`)

    const browser = await chromium.launch()

    try {
      const scraped = await runScraper({
        areas,
        listing_types: listingTypes,
        max_price:     maxPrice,
        min_bedrooms:  minBedrooms,
        max_bedrooms:  maxBedrooms,
      }, browser)

      await progress.step(`Scraped ${scraped.length} listings matching filters`)

      // ── New listings ────────────────────────────────────────────────────────
      const newListings = scraped.filter((l) => l.ikman_id && !existingIds.has(l.ikman_id))
      await progress.step(`${newListings.length} new listing${newListings.length !== 1 ? 's' : ''} to save`)

      if (!newListings.length) {
        await progress.done(0, scraped.length)
        return
      }

      // First multi-user runs can discover hundreds of "new" ads. Cap detail
      // fetches so one job finishes before the next cron (default 10 min).
      const maxDetailsRaw = parseInt(process.env.MAX_DETAIL_FETCHES ?? '40', 10)
      const maxDetails =
        Number.isFinite(maxDetailsRaw) && maxDetailsRaw > 0 ? maxDetailsRaw : 40
      const toEnrich = newListings.slice(0, maxDetails)
      if (newListings.length > toEnrich.length) {
        console.log(
          `Capping detail fetches: ${toEnrich.length}/${newListings.length} (set MAX_DETAIL_FETCHES to raise)`,
        )
      }

      // ── Detail pages ────────────────────────────────────────────────────────
      await progress.step(
        `Fetching details for ${toEnrich.length} listing${toEnrich.length !== 1 ? 's' : ''}…`,
      )

      let detailsDone = 0
      const onDetailFetched = async () => {
        detailsDone++
        if (detailsDone % 3 === 0 || detailsDone === toEnrich.length) {
          await progress.step(`Fetching details… ${detailsDone}/${toEnrich.length}`)
        }
      }

      await enrichListingsWithDetails(browser, toEnrich, {
        onProgress: onDetailFetched,
      })

      // ── Save ─────────────────────────────────────────────────────────────────
      // Save all new listings (even those without detail enrichment this run).
      await progress.step('Saving to database…')

      const saved = await upsertListings(
        db,
        newListings.map((l) => sanitizeListingForDb(l)) as Omit<Listing, 'id' | 'created_at'>[],
      )

      await progress.step(`Saved ${saved.length} listing${saved.length !== 1 ? 's' : ''}`)

      // ── Per-user matching + notifications ───────────────────────────────────
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN ?? ''
      if (!telegramToken) {
        console.warn('Telegram skipped — add TELEGRAM_BOT_TOKEN to env')
      }

      let alertsSent = 0
      for (const user of users) {
        const matches = saved.filter((l) => matchesUser(l, user))
        if (!matches.length) continue

        const canNotify =
          !!telegramToken && user.notifications_enabled && !!user.telegram_chat_id

        for (const listing of matches) {
          let notified = false
          if (canNotify) {
            const msg = buildListingMessage(listing)
            notified = await sendTelegram(telegramToken, user.telegram_chat_id!, msg)
            if (notified) alertsSent++
            await new Promise((r) => setTimeout(r, 300))
          }
          await createNotification(db, user.user_id, listing.id, notified)
        }
      }

      await progress.step(`Sent ${alertsSent} Telegram alert${alertsSent !== 1 ? 's' : ''}`)
      await progress.done(saved.length, scraped.length)
      console.log(`Done. Processed ${saved.length} new listings, sent ${alertsSent} alerts.`)

    } finally {
      await browser.close()
    }

  } catch (err) {
    const msg = (err as Error).message
    console.error('Fatal error:', err)
    await progress.fail(msg)
    process.exit(1)
  }
}

main()
