import FirecrawlApp from '@mendable/firecrawl-js'
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

const MAX_PAGES = 5 // cap at 5 pages (~125 ads) per category/area combo

export interface ScrapeConfig {
  areas: string[]
  listing_types: string[]
  max_price: number
  min_bedrooms: number
  max_bedrooms: number
  firecrawlApiKey: string
}

interface IkmanAd {
  slug?:        string
  title?:       string
  money?:       { price?: number }
  locations?:   { slug?: string; name?: string }[]
  thumbnails?:  { cdn_url?: string }[]
  images?:      { cdn_url?: string }[]
  created_at?:  string
  posted_at?:   string
  contact?:     { chat_phone_number?: string; phone?: string }
  description?: string
  attributes?:  { name?: string; value?: string }[]
}

// Extract window.initialData JSON from raw HTML using brace counting
function extractInitialData(html: string): Record<string, unknown> | null {
  const marker = 'window.initialData = '
  const start  = html.indexOf(marker)
  if (start === -1) return null

  const rest  = html.slice(start + marker.length)
  let depth = 0
  let i     = 0

  for (; i < rest.length; i++) {
    if      (rest[i] === '{') depth++
    else if (rest[i] === '}') { depth--; if (depth === 0) { i++; break } }
  }

  try {
    return JSON.parse(rest.slice(0, i))
  } catch {
    return null
  }
}

function extractAdsList(data: Record<string, unknown>): IkmanAd[] {
  // Log top-level keys to help debug any future structure changes
  console.log('  initialData keys:', Object.keys(data).join(', '))

  const serp    = data.serp    as Record<string, unknown> | undefined
  const listing = data.listing as Record<string, unknown> | undefined

  const ads =
    (serp?.ads    as IkmanAd[] | undefined) ??
    (serp?.list   as IkmanAd[] | undefined) ??
    (listing?.list as IkmanAd[] | undefined) ??
    (listing?.ads  as IkmanAd[] | undefined) ??
    (data.ads      as IkmanAd[] | undefined) ??
    []

  console.log(`  Ads in initialData: ${ads.length}`)
  return ads
}

function parseAd(ad: IkmanAd, area: string, categorySlug: string): Partial<Listing> | null {
  if (!ad.slug) return null

  const slug     = ad.slug
  const ikmanId  = slug.split('-').pop() ?? slug
  const title    = ad.title ?? ''
  const price    = ad.money?.price ?? null
  const location = ad.locations?.[0]?.name ?? area

  // Bedrooms from attributes first, then title
  let bedrooms: number | null = null
  for (const attr of ad.attributes ?? []) {
    if (attr.name?.toLowerCase().includes('bedroom') || attr.name?.toLowerCase().includes('room')) {
      const n = parseInt(attr.value ?? '', 10)
      if (!isNaN(n)) { bedrooms = n; break }
    }
  }
  if (bedrooms === null) {
    const m = title.match(/(\d+)\s*(?:bed(?:room)?s?|BR)/i)
    if (m) bedrooms = parseInt(m[1], 10)
  }

  const photos: string[] = [
    ...(ad.thumbnails ?? []).map((t) => t.cdn_url ?? ''),
    ...(ad.images     ?? []).map((i) => i.cdn_url ?? ''),
  ].filter(Boolean)

  let listing_type: Listing['listing_type'] = null
  if (categorySlug.includes('apartment'))                      listing_type = 'apartment'
  else if (categorySlug.includes('house'))                     listing_type = 'house'
  else if (categorySlug.includes('room') || categorySlug.includes('annex')) listing_type = 'annex'
  else {
    const t = title.toLowerCase()
    if (t.includes('apartment') || t.includes('flat'))  listing_type = 'apartment'
    else if (t.includes('annex') || t.includes('room')) listing_type = 'annex'
    else if (t.includes('house') || t.includes('villa'))listing_type = 'house'
  }

  const contact     = ad.contact?.chat_phone_number ?? ad.contact?.phone ?? null
  const description = ad.description ?? null
  const posted_at   = ad.posted_at ?? ad.created_at ?? null

  return {
    ikman_id: ikmanId,
    title,
    price,
    location,
    area,
    bedrooms,
    listing_type,
    description,
    photos,
    contact,
    posted_at,
    url: `https://ikman.lk/en/ad/${slug}`,
    is_new: true,
  }
}

async function scrapeDetailPage(
  app: FirecrawlApp,
  url: string,
): Promise<{ description: string | null; contact: string | null; photos: string[] }> {
  try {
    const res = await app.scrapeUrl(url, {
      formats: ['rawHtml'],
      onlyMainContent: false,
      waitFor: 2000,
    })
    if (!res.success || !res.rawHtml) return { description: null, contact: null, photos: [] }

    const data = extractInitialData(res.rawHtml)
    if (!data) return { description: null, contact: null, photos: [] }

    const ad = data.ad as IkmanAd | undefined
    if (!ad) return { description: null, contact: null, photos: [] }

    const photos: string[] = [
      ...(ad.thumbnails ?? []).map((t) => t.cdn_url ?? ''),
      ...(ad.images     ?? []).map((i) => i.cdn_url ?? ''),
    ].filter(Boolean)

    const contact     = ad.contact?.chat_phone_number ?? ad.contact?.phone ?? null
    const description = ad.description?.slice(0, 1000) ?? null

    return { description, contact, photos }
  } catch (err) {
    console.error(`  Detail scrape failed for ${url}:`, (err as Error).message)
    return { description: null, contact: null, photos: [] }
  }
}

export async function runScraper(config: ScrapeConfig): Promise<Partial<Listing>[]> {
  const app = new FirecrawlApp({ apiKey: config.firecrawlApiKey })
  const allListings: Partial<Listing>[] = []

  for (const area of config.areas) {
    const areaSlug = AREA_SLUGS[area] ?? area.toLowerCase().replace(/\s+/g, '-')

    for (const type of config.listing_types) {
      const categorySlug = TYPE_SLUGS[type] ?? 'apartment-rentals'

      for (let page = 1; page <= MAX_PAGES; page++) {
        const params = new URLSearchParams({
          'money.price.maximum': String(config.max_price),
          sort:  'date',
          order: 'desc',
          page:  String(page),
        })
        const url = `https://ikman.lk/en/ads/${areaSlug}/${categorySlug}?${params}`
        console.log(`Scraping (page ${page}): ${url}`)

        try {
          const res = await app.scrapeUrl(url, {
            formats: ['rawHtml'],
            onlyMainContent: false,
            waitFor: 2000,
          })

          if (!res.success || !res.rawHtml) {
            console.log(`  Firecrawl failed or returned no HTML`)
            break
          }

          const data = extractInitialData(res.rawHtml)
          if (!data) {
            console.log(`  window.initialData not found in HTML`)
            break
          }

          const ads = extractAdsList(data)

          // No more ads = no more pages
          if (ads.length === 0) {
            console.log(`  No ads on page ${page}, stopping pagination`)
            break
          }

          const parsed: Partial<Listing>[] = []

          for (const ad of ads) {
            const listing = parseAd(ad, area, categorySlug)
            if (!listing) continue

            if (listing.price && listing.price > config.max_price) continue
            if (listing.bedrooms != null) {
              if (listing.bedrooms < config.min_bedrooms) continue
              if (listing.bedrooms > config.max_bedrooms) continue
            }

            parsed.push(listing)
          }

          console.log(`  Kept ${parsed.length} of ${ads.length} listings after filtering`)
          allListings.push(...parsed)
        } catch (err) {
          console.error(`  Error: ${(err as Error).message}`)
          break
        }

        // Polite delay between pages
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique = allListings.filter((l) => {
    if (!l.ikman_id || seen.has(l.ikman_id)) return false
    seen.add(l.ikman_id)
    return true
  })

  // Enrich with detail pages for listings missing contact/description
  const needsDetail = unique.filter((l) => !l.contact || !l.description)
  console.log(`\nFetching details for ${needsDetail.length} listings...`)

  for (const listing of needsDetail) {
    if (!listing.url) continue
    const detail = await scrapeDetailPage(app, listing.url)
    if (detail.description) listing.description = detail.description
    if (detail.contact)     listing.contact     = detail.contact
    if (detail.photos.length > (listing.photos?.length ?? 0)) listing.photos = detail.photos
    await new Promise((r) => setTimeout(r, 500))
  }

  return unique
}
