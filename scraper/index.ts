/**
 * Scraper entry point - runs in GitHub Actions every 30 minutes.
 * Required env vars (set as GitHub Actions secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER,
 *   WHATSAPP_NUMBER
 */

import { createClient } from '@supabase/supabase-js'
import { runScraper } from './scraper'
import { sendWhatsApp, buildListingMessage } from './whatsapp'
import { getSettings, upsertListings, getExistingIkmanIds, createNotification } from '../lib/db'
import type { Listing } from '../lib/types'

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const db = createClient(supabaseUrl, serviceKey)

  console.log('Loading settings from Supabase...')
  const settings = await getSettings(db)
  console.log('Settings:', JSON.stringify(settings, null, 2))

  if (!settings.notifications_enabled) {
    console.log('Notifications disabled - skipping scrape.')
    return
  }

  console.log('Fetching existing listing IDs...')
  const existingIds = await getExistingIkmanIds(db)
  console.log(`${existingIds.size} listings already in DB`)

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY ?? ''
  if (!firecrawlApiKey) {
    console.error('Missing FIRECRAWL_API_KEY')
    process.exit(1)
  }

  console.log('Starting scrape...')
  const scraped = await runScraper({
    areas:           settings.areas,
    listing_types:   settings.listing_types,
    max_price:       settings.max_price,
    min_bedrooms:    settings.min_bedrooms,
    max_bedrooms:    settings.max_bedrooms,
    firecrawlApiKey,
  })
  console.log(`Scraped ${scraped.length} listings matching filters`)

  const newListings = scraped.filter((l) => l.ikman_id && !existingIds.has(l.ikman_id))
  console.log(`${newListings.length} new listings to save`)

  if (!newListings.length) {
    console.log('No new listings found.')
    return
  }

  const saved = await upsertListings(
    db,
    newListings as Omit<Listing, 'id' | 'created_at'>[],
  )

  // Twilio credentials
  const accountSid  = process.env.TWILIO_ACCOUNT_SID  ?? ''
  const authToken   = process.env.TWILIO_AUTH_TOKEN    ?? ''
  const fromNumber  = process.env.TWILIO_FROM_NUMBER   ?? ''
  const toNumber    = process.env.WHATSAPP_NUMBER ?? settings.whatsapp_number
  const twilioReady = !!(accountSid && authToken && fromNumber && toNumber)

  for (const listing of saved) {
    let whatsappSent = false

    if (twilioReady) {
      const msg = buildListingMessage(listing)
      whatsappSent = await sendWhatsApp(accountSid, authToken, fromNumber, toNumber, msg)
      // Brief delay between messages to avoid rate limits
      await new Promise((r) => setTimeout(r, 1000))
    }

    await createNotification(db, listing.id, whatsappSent)
    console.log(`Saved & notified: ${listing.title}`)
  }

  console.log(`Done. Processed ${saved.length} new listings.`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
