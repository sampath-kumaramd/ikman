/**
 * Scraper entry point – runs in GitHub Actions every 30 minutes.
 * Required env vars (set as GitHub Actions secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   CALLMEBOT_API_KEY, WHATSAPP_NUMBER (optional override)
 */

import { createClient } from '@supabase/supabase-js'
import { runScraper } from './scraper'
import { sendWhatsApp, buildListingMessage } from './whatsapp'
import { getSettings, upsertListings, getExistingIkmanIds, createNotification } from '../lib/db'
import type { Listing } from '../lib/types'

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const db = createClient(supabaseUrl, serviceKey)

  console.log('Loading settings from Supabase…')
  const settings = await getSettings(db)
  console.log('Settings:', JSON.stringify(settings, null, 2))

  if (!settings.notifications_enabled) {
    console.log('Notifications disabled – skipping scrape.')
    return
  }

  console.log('Fetching existing listing IDs…')
  const existingIds = await getExistingIkmanIds(db)
  console.log(`${existingIds.size} listings already in DB`)

  console.log('Starting scrape…')
  const scraped = await runScraper({
    areas:         settings.areas,
    listing_types: settings.listing_types,
    max_price:     settings.max_price,
    min_bedrooms:  settings.min_bedrooms,
    max_bedrooms:  settings.max_bedrooms,
  })
  console.log(`Scraped ${scraped.length} listings matching filters`)

  // Only process genuinely new listings
  const newListings = scraped.filter((l) => l.ikman_id && !existingIds.has(l.ikman_id))
  console.log(`${newListings.length} new listings to save`)

  if (!newListings.length) {
    console.log('No new listings found.')
    return
  }

  // Upsert into DB
  const saved = await upsertListings(
    db,
    newListings as Omit<Listing, 'id' | 'created_at'>[],
  )

  // Send WhatsApp + create notification rows
  const waPhone = process.env.WHATSAPP_NUMBER ?? settings.whatsapp_number
  const waApiKey = process.env.CALLMEBOT_API_KEY ?? ''

  for (const listing of saved) {
    let whatsappSent = false

    if (waApiKey && waPhone) {
      const msg = buildListingMessage(listing)
      whatsappSent = await sendWhatsApp(waPhone, waApiKey, msg)
      // CallMeBot rate limit: 1 message / 5 seconds
      await new Promise((r) => setTimeout(r, 5500))
    }

    await createNotification(db, listing.id, whatsappSent)
    console.log(`✓ Saved & notified: ${listing.title}`)
  }

  console.log(`Done. Processed ${saved.length} new listings.`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
