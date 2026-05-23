import { chromium } from 'playwright'
import type { Listing } from '../lib/types'

const AREA_SLUGS: Record<string, string> = {
  'Moratuwa':      'moratuwa',
  'Ratmalana':     'ratmalana',
  'Mount Lavinia': 'mount-lavinia',
  'Dehiwala':      'dehiwala',
  'Colombo':       'colombo',
  'Panadura':      'panadura',
  'Piliyandala':   'piliyandala',
  'Maharagama':    'maharagama',
  'Nugegoda':      'nugegoda',
}

const TYPE_SLUGS: Record<string, string> = {
  apartment: 'apartment-rentals',
  house:     'house-rentals',
  annex:     'room-annex-rentals',
}

export interface ScrapeConfig {
  areas: string[]
  listing_types: string[]
  max_price: number
  min_bedrooms: number
  max_bedrooms: number
}

// Shape of ads inside window.initialData on ikman.lk
interface IkmanAd {
  slug?:        string
  title?:       string
  money?:       { price?: number; currency?: string }
  locations?:   { slug?: string; name?: string }[]
  thumbnails?:  { cdn_url?: string }[]
  images?:      { cdn_url?: string }[]
  created_at?:  string
  posted_at?:   string
  contact?:     { chat_phone_number?: string; phone?: string }
  description?: string
  attributes?:  { name?: string; value?: string }[]
}

function extractIkmanId(slug: string): string {
  // slug looks like "2-bedroom-apartment-mount-lavinia-abc123"
  const parts = slug.split('-')
  return parts[parts.length - 1] || slug
}

function parseBedrooms(title: string, attributes: IkmanAd['attributes']): number | null {
  // Try attributes first (most reliable)
  if (attributes) {
    for (const attr of attributes) {
      if (attr.name?.toLowerCase().includes('bedroom') || attr.name?.toLowerCase().includes('room')) {
        const n = parseInt(attr.value ?? '', 10)
        if (!isNaN(n)) return n
      }
    }
  }
  // Fall back to title
  const m = title.match(/(\d+)\s*(?:bed(?:room)?s?|BR)/i)
  return m ? parseInt(m[1], 10) : null
}

function inferListingType(categorySlug: string, title: string): Listing['listing_type'] {
  if (categorySlug.includes('apartment')) return 'apartment'
  if (categorySlug.includes('house'))     return 'house'
  if (categorySlug.includes('room') || categorySlug.includes('annex')) return 'annex'
  const t = title.toLowerCase()
  if (t.includes('apartment') || t.includes('flat'))  return 'apartment'
  if (t.includes('annex')     || t.includes('room'))  return 'annex'
  if (t.includes('house')     || t.includes('villa')) return 'house'
  return null
}

function parseAdFromInitialData(
  ad: IkmanAd,
  area: string,
  categorySlug: string,
): Partial<Listing> | null {
  const slug = ad.slug ?? ''
  if (!slug) return null

  const ikmanId    = extractIkmanId(slug)
  const title      = ad.title ?? ''
  const price      = ad.money?.price ?? null
  const location   = ad.locations?.[0]?.name ?? area
  const bedrooms   = parseBedrooms(title, ad.attributes)
  const photos     = [
    ...(ad.thumbnails ?? []).map((t) => t.cdn_url ?? ''),
    ...(ad.images     ?? []).map((i) => i.cdn_url ?? ''),
  ].filter(Boolean)
  const postedAt   = ad.posted_at ?? ad.created_at ?? null
  const contact    = ad.contact?.chat_phone_number ?? ad.contact?.phone ?? null
  const description = ad.description ?? null
  const url        = `https://ikman.lk/en/ad/${slug}`

  return {
    ikman_id:     ikmanId,
    title,
    price,
    location,
    area,
    bedrooms,
    listing_type: inferListingType(categorySlug, title),
    description,
    photos,
    contact,
    posted_at:    postedAt,
    url,
    is_new:       true,
  }
}

async function scrapeListingDetail(
  page: import('playwright').Page,
  url: string,
): Promise<{ description: string | null; contact: string | null; photos: string[] }> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(2000)

    const detail = await page.evaluate(() => {
      const w     = window as Window & { initialData?: Record<string, unknown> }
      const data  = w.initialData as Record<string, unknown> | undefined
      if (!data) return null

      // The detail page initialData has an "ad" key
      const ad = data.ad as IkmanAd | undefined
      if (!ad) return null

      const photos = [
        ...((ad.thumbnails ?? []) as { cdn_url?: string }[]).map((t) => t.cdn_url ?? ''),
        ...((ad.images     ?? []) as { cdn_url?: string }[]).map((i) => i.cdn_url ?? ''),
      ].filter(Boolean) as string[]

      const contact = (ad.contact as { chat_phone_number?: string; phone?: string } | undefined)
        ?.chat_phone_number ??
        (ad.contact as { chat_phone_number?: string; phone?: string } | undefined)?.phone ??
        null

      return {
        description: (ad.description as string | undefined) ?? null,
        contact,
        photos,
      }
    })

    return detail ?? { description: null, contact: null, photos: [] }
  } catch {
    return { description: null, contact: null, photos: [] }
  }
}

export async function runScraper(config: ScrapeConfig): Promise<Partial<Listing>[]> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
  })

  const allListings: Partial<Listing>[] = []

  try {
    const page = await context.newPage()
    page.setDefaultTimeout(30000)

    for (const area of config.areas) {
      const areaSlug     = AREA_SLUGS[area] ?? area.toLowerCase().replace(/\s+/g, '-')

      for (const type of config.listing_types) {
        const categorySlug = TYPE_SLUGS[type] ?? 'apartment-rentals'
        const params       = new URLSearchParams({
          'money.price.maximum': String(config.max_price),
          sort:  'date',
          order: 'desc',
        })
        const url = `https://ikman.lk/en/ads/${areaSlug}/${categorySlug}?${params}`
        console.log(`Scraping: ${url}`)

        try {
          // domcontentloaded is enough — data is in window.initialData set by SSR
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
          await page.waitForTimeout(1500)

          // Extract listings directly from window.initialData
          const ads = await page.evaluate(() => {
            const w    = window as Window & { initialData?: Record<string, unknown> }
            const data = w.initialData
            if (!data) return null

            // Log top-level keys to help debug structure on first run
            console.log('[ikman] initialData keys:', Object.keys(data).join(', '))

            // ikman.lk SSR puts listings under data.listing.list or data.ads.list
            const listing = data.listing as Record<string, unknown> | undefined
            const adsList =
              (listing?.list  as unknown[]) ??
              (listing?.ads   as unknown[]) ??
              (data.ads       as unknown[]) ??
              []

            console.log('[ikman] ads found:', adsList.length)
            return adsList
          })

          if (!ads || !Array.isArray(ads)) {
            console.log('  No ads array found in initialData — skipping')
            continue
          }

          console.log(`  Raw ads in initialData: ${ads.length}`)

          const parsed: Partial<Listing>[] = []
          for (const ad of ads as IkmanAd[]) {
            const listing = parseAdFromInitialData(ad, area, categorySlug)
            if (!listing) continue

            // Filter by price and bedrooms
            if (listing.price && listing.price > config.max_price) continue
            if (listing.bedrooms !== null && listing.bedrooms !== undefined) {
              if (listing.bedrooms < config.min_bedrooms) continue
              if (listing.bedrooms > config.max_bedrooms) continue
            }

            parsed.push(listing)
          }

          console.log(`  Kept ${parsed.length} listings after filtering`)
          allListings.push(...parsed)
        } catch (err) {
          console.error(`  Error: ${(err as Error).message}`)
        }

        await page.waitForTimeout(1000)
      }
    }

    // Enrich with detail page data (better photos, contact, description)
    console.log(`\nFetching details for ${allListings.length} listings...`)
    const detailPage = await context.newPage()
    for (const listing of allListings) {
      if (!listing.url) continue
      const detail = await scrapeListingDetail(detailPage, listing.url)
      if (detail.description) listing.description = detail.description
      if (detail.contact)     listing.contact     = detail.contact
      if (detail.photos.length > (listing.photos?.length ?? 0)) {
        listing.photos = detail.photos
      }
      await detailPage.waitForTimeout(800)
    }
  } finally {
    await browser.close()
  }

  // Deduplicate by ikman_id
  const seen = new Set<string>()
  return allListings.filter((l) => {
    if (!l.ikman_id || seen.has(l.ikman_id)) return false
    seen.add(l.ikman_id)
    return true
  })
}
