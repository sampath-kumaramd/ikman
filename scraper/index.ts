import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright'
import { runScraper, enrichListingsWithDetails, sanitizeListingForDb } from './scraper'
import type { ScrapedListing } from './scraper'
import { sendTelegram, buildListingMessage } from './telegram'
import {
  getOnboardedUserSettings,
  upsertListings,
  getExistingIkmanIdsAmong,
  hasNotificationForListing,
  createNotification,
} from '../lib/db'
import { matchesUser } from '../lib/match-listing'
import { ScrapeProgress } from './progress'
import type { Listing } from '../lib/types'

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
    // Public progress must NOT expose user counts, area unions, or other users' criteria.
    await progress.step('Preparing search…')
    const users = await getOnboardedUserSettings(db)
    console.log(`Active onboarded users: ${users.length}`)

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

    await progress.step(
      'Scanning ikman.lk…',
      `${users.length} users · ${areas.length} area(s) × ${listingTypes.length} type(s)`,
    )

    // ── Scrape ────────────────────────────────────────────────────────────────
    const browser = await chromium.launch()

    try {
      const scraped = await runScraper({
        areas,
        listing_types: listingTypes,
        max_price:     maxPrice,
        min_bedrooms:  minBedrooms,
        max_bedrooms:  maxBedrooms,
      }, browser)

      await progress.step(
        'Checking for new listings…',
        `Scraped ${scraped.length} listings matching union filters`,
      )

      // ── New listings ────────────────────────────────────────────────────────
      // Only ask the DB about IDs we just scraped (avoids PostgREST row cap on
      // a full-table select, which re-treated known ads as "new" every run).
      const scrapedIds = scraped
        .map((l) => l.ikman_id)
        .filter((id): id is string => !!id)
      const existingIds = await getExistingIkmanIdsAmong(db, scrapedIds)
      const newListings = scraped.filter((l) => l.ikman_id && !existingIds.has(l.ikman_id))
      await progress.step(
        newListings.length ? 'Found new listings…' : 'Checking for new listings…',
        `${newListings.length} new listing(s) to save (${existingIds.size} already known)`,
      )

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
        'Loading listing details…',
        `Fetching details for ${toEnrich.length}/${newListings.length} listings`,
      )

      let detailsDone = 0
      const onDetailFetched = async () => {
        detailsDone++
        if (detailsDone % 5 === 0 || detailsDone === toEnrich.length) {
          // Public stays generic; only admin sees n/N
          await progress.step(
            'Loading listing details…',
            `Details ${detailsDone}/${toEnrich.length}`,
          )
        }
      }

      await enrichListingsWithDetails(browser, toEnrich, {
        onProgress: onDetailFetched,
      })

      // ── Save ─────────────────────────────────────────────────────────────────
      // Save all new listings (even those without detail enrichment this run).
      await progress.step('Saving results…', `Upserting ${newListings.length} listings`)

      const saved = await upsertListings(
        db,
        newListings.map((l) => sanitizeListingForDb(l)) as Omit<Listing, 'id' | 'created_at'>[],
      )

      await progress.step(
        'Sending your alerts…',
        `Saved ${saved.length}; matching per user…`,
      )

      // ── Per-user matching + notifications ───────────────────────────────────
      // Re-attach foundInAreas from the scrape (DB only stores a single `area`).
      const foundAreasByIkman = new Map<string, string[]>()
      for (const l of newListings as ScrapedListing[]) {
        if (!l.ikman_id) continue
        foundAreasByIkman.set(
          l.ikman_id,
          l.foundInAreas?.length ? l.foundInAreas : l.area ? [l.area] : [],
        )
      }

      const telegramToken = process.env.TELEGRAM_BOT_TOKEN ?? ''
      if (!telegramToken) {
        console.warn('Telegram skipped — add TELEGRAM_BOT_TOKEN to env')
      }

      let alertsSent = 0
      for (const user of users) {
        const matches = saved.filter((l) =>
          matchesUser(
            {
              ...l,
              foundInAreas: foundAreasByIkman.get(l.ikman_id) ?? (l.area ? [l.area] : []),
            },
            user,
          ),
        )
        if (!matches.length) continue

        const canNotify =
          !!telegramToken && user.notifications_enabled && !!user.telegram_chat_id

        for (const listing of matches) {
          // Never re-alert the same listing to the same user
          if (await hasNotificationForListing(db, user.user_id, listing.id)) {
            continue
          }

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

      await progress.step(
        'Almost done…',
        `Sent ${alertsSent} Telegram alert(s) across all users`,
      )
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
