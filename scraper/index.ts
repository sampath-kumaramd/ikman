import { createClient } from '@supabase/supabase-js'
import FirecrawlApp from '@mendable/firecrawl-js'
import { runScraper, enrichListingsWithDetails, sanitizeListingForDb } from './scraper'
import { sendTelegram, buildListingMessage } from './telegram'
import { getSettings, upsertListings, getExistingIkmanIds, createNotification } from '../lib/db'
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
    // ── Settings ──────────────────────────────────────────────────────────────
    const settings = await getSettings(db)
    await progress.step('Settings loaded')

    if (!settings.notifications_enabled) {
      await progress.done(0, 0)
      console.log('Notifications disabled — skipping scrape.')
      return
    }

    // ── Existing IDs ──────────────────────────────────────────────────────────
    const existingIds = await getExistingIkmanIds(db)
    await progress.step(`${existingIds.size} existing listings in DB`)

    // ── Scrape ────────────────────────────────────────────────────────────────
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY ?? ''
    if (!firecrawlApiKey) {
      throw new Error('Missing FIRECRAWL_API_KEY')
    }

    await progress.step(`Scraping ${settings.areas.length} area(s) × ${settings.listing_types.length} type(s)…`)

    const scraped = await runScraper({
      areas:           settings.areas,
      listing_types:   settings.listing_types,
      max_price:       settings.max_price,
      min_bedrooms:    settings.min_bedrooms,
      max_bedrooms:    settings.max_bedrooms,
      firecrawlApiKey,
    })

    await progress.step(`Scraped ${scraped.length} listings matching filters`)

    // ── New listings ──────────────────────────────────────────────────────────
    const newListings = scraped.filter((l) => l.ikman_id && !existingIds.has(l.ikman_id))
    await progress.step(`${newListings.length} new listing${newListings.length !== 1 ? 's' : ''} to save`)

    if (!newListings.length) {
      await progress.done(0, scraped.length)
      return
    }

    // ── Detail pages ──────────────────────────────────────────────────────────
    await progress.step(`Fetching details for ${newListings.length} listings…`)

    const app = new FirecrawlApp({ apiKey: firecrawlApiKey })

    let detailsDone = 0
    const onDetailFetched = async () => {
      detailsDone++
      if (detailsDone % 3 === 0 || detailsDone === newListings.length) {
        await progress.step(`Fetching details… ${detailsDone}/${newListings.length}`)
      }
    }

    await enrichListingsWithDetails(app, newListings, {
      onProgress: onDetailFetched,
    })

    // ── Save ──────────────────────────────────────────────────────────────────
    await progress.step('Saving to database…')

    const saved = await upsertListings(
      db,
      newListings.map((l) => sanitizeListingForDb(l)) as Omit<Listing, 'id' | 'created_at'>[],
    )

    await progress.step(`Saved ${saved.length} listing${saved.length !== 1 ? 's' : ''}`)

    // ── Notifications ─────────────────────────────────────────────────────────
    const telegramToken  = process.env.TELEGRAM_BOT_TOKEN ?? ''
    const telegramChatId = process.env.TELEGRAM_CHAT_ID   ?? ''
    const telegramReady  = !!(telegramToken && telegramChatId)

    if (!telegramReady) {
      console.warn('Telegram skipped — add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to env')
    }

    for (const listing of saved) {
      let notified = false
      if (telegramReady) {
        const msg = buildListingMessage(listing)
        notified = await sendTelegram(telegramToken, telegramChatId, msg)
        await new Promise((r) => setTimeout(r, 300))
      }
      await createNotification(db, listing.id, notified)
    }

    await progress.done(saved.length, scraped.length)
    console.log(`Done. Processed ${saved.length} new listings.`)

  } catch (err) {
    const msg = (err as Error).message
    console.error('Fatal error:', err)
    await progress.fail(msg)
    process.exit(1)
  }
}

main()
