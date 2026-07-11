import { type Browser } from 'playwright'
import { areaToSlug } from '../lib/areas'
import type { Listing } from '../lib/types'

const TYPE_SLUGS: Record<string, string> = {
  apartment: 'apartment-rentals',
  house:     'house-rentals',
  annex:     'room-annex-rentals',
}

const MAX_PAGES = 5 // cap at 5 pages (~125 ads) per category/area combo
const DEFAULT_DETAIL_CONCURRENCY = 3
const MIN_SCRAPE_INTERVAL_MS = 700 // ~100 req/min, be polite to ikman.lk

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

let lastScrapeAt = 0

async function throttleScrape(): Promise<void> {
  const now = Date.now()
  const wait = lastScrapeAt + MIN_SCRAPE_INTERVAL_MS - now
  if (wait > 0) await sleep(wait)
  lastScrapeAt = Date.now()
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (!items.length) return
  let next = 0
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (true) {
        const i = next++
        if (i >= items.length) break
        await fn(items[i], i)
      }
    },
  )
  await Promise.all(workers)
}

export interface ScrapeConfig {
  areas: string[]
  listing_types: string[]
  max_price: number
  min_bedrooms: number
  max_bedrooms: number
}

interface IkmanAd {
  id?:          string
  slug?:        string
  title?:       string
  details?:     string
  price?:       string | number
  location?:    string
  imgUrl?:      string
  images?:      IkmanImages
  money?:       { price?: number; amount?: string }
  locations?:   { slug?: string; name?: string }[]
  thumbnails?:  { cdn_url?: string }[]
  created_at?:  string
  posted_at?:   string
  postedDate?:  string
  adDate?:      string
  timeStamp?:   string
  lastBumpUpDate?: string
  contact?:     { chat_phone_number?: string; phone?: string }
  contactCard?: { phoneNumbers?: { number?: string }[] }
  description?: string
  attributes?:  { name?: string; value?: string }[]
  properties?:  { label?: string; value?: string; key?: string }[]
}

type IkmanImages =
  | {
      ids?:      string[]
      base_uri?: string
      meta?:     { src?: string }[]
      cdn_url?:  string
    }
  | { cdn_url?: string }[]

function isSerpImages(imgs: IkmanImages): imgs is { ids?: string[]; base_uri?: string; meta?: { src?: string }[] } {
  return !Array.isArray(imgs)
}

function hasDetailMeta(imgs: IkmanImages): imgs is { meta: { src?: string }[] } {
  return !Array.isArray(imgs) && Array.isArray((imgs as { meta?: unknown }).meta)
}

/** ikman RemoteData wrapper: { type: "Success", data: T } */
function unwrapSuccessData<T extends Record<string, unknown>>(node: unknown): T | null {
  if (!node || typeof node !== 'object') return null
  const o = node as Record<string, unknown>
  if (o.type === 'Success' && o.data && typeof o.data === 'object') {
    return o.data as T
  }
  return null
}

function parsePrice(value: string | number | undefined | null): number | null {
  if (typeof value === 'number' && !isNaN(value)) return value
  if (!value) return null
  const m = String(value).replace(/,/g, '').match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

const MIN_POSTED_YEAR = 2015

function isPlausiblePostedDate(d: Date): boolean {
  if (isNaN(d.getTime())) return false
  const y = d.getFullYear()
  return y >= MIN_POSTED_YEAR && y <= new Date().getFullYear() + 1
}

/** ikman SERP/detail: "5 hours", "1 day", "just now", bump_up. */
function parseRelativePostedAt(label: string): Date | null {
  const s = label.trim()
  if (!s || /^bump_up$/i.test(s)) return null
  if (/^just now$/i.test(s)) return new Date()

  const m = s.match(/^(\d+)\s*(second|minute|hour|day|week|month|year)s?\b/i)
  if (!m) return null

  const n = parseInt(m[1], 10)
  const unit = m[2].toLowerCase()
  const d = new Date()
  switch (unit) {
    case 'second':
      d.setSeconds(d.getSeconds() - n)
      break
    case 'minute':
      d.setMinutes(d.getMinutes() - n)
      break
    case 'hour':
      d.setHours(d.getHours() - n)
      break
    case 'day':
      d.setDate(d.getDate() - n)
      break
    case 'week':
      d.setDate(d.getDate() - n * 7)
      break
    case 'month':
      d.setMonth(d.getMonth() - n)
      break
    case 'year':
      d.setFullYear(d.getFullYear() - n)
      break
    default:
      return null
  }
  return isPlausiblePostedDate(d) ? d : null
}

/**
 * Normalize ikman date fields to ISO for Postgres.
 * - adDate: real ISO posted time (preferred on detail pages)
 * - timeStamp / lastBumpUpDate: relative labels on SERP
 * - postedDate: small integer month index on detail — NOT a unix timestamp
 */
export function parsePostedAt(
  ...candidates: (string | number | undefined | null)[]
): string | null {
  for (const raw of candidates) {
    if (raw == null || raw === '') continue

    if (typeof raw === 'number') {
      // ikman postedDate is often 0–31 (month/days enum), not epoch ms
      if (raw >= 1e12) {
        const ms = new Date(raw)
        if (isPlausiblePostedDate(ms)) return ms.toISOString()
      } else if (raw >= 1e9) {
        const sec = new Date(raw * 1000)
        if (isPlausiblePostedDate(sec)) return sec.toISOString()
      }
      continue
    }

    const s = String(raw).trim()
    if (!s) continue

    const relative = parseRelativePostedAt(s)
    if (relative) return relative.toISOString()

    // Avoid "4" / "29" being parsed as bogus calendar dates
    if (/^\d{1,2}$/.test(s)) continue

    const d = new Date(s)
    if (isPlausiblePostedDate(d)) return d.toISOString()
  }
  return null
}

/**
 * Remove lone Unicode surrogates (U+D800–U+DFFF) that are not part of a valid
 * surrogate pair. PostgreSQL's JSON parser rejects them with error 22P02.
 * This can occur in Sinhala text and emoji scraped from ikman.
 */
function stripLoneSurrogates(s: string): string {
  return s.replace(
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
    '',
  )
}

function cleanStr(v: string | null | undefined): string | null {
  if (v == null) return null
  return stripLoneSurrogates(v)
}

export function sanitizeListingForDb(listing: Partial<Listing>): Partial<Listing> {
  return {
    ...listing,
    title:       cleanStr(listing.title)       ?? listing.title,
    description: cleanStr(listing.description),
    location:    cleanStr(listing.location)    ?? listing.location,
    contact:     cleanStr(listing.contact),
    photos:      listing.photos?.map((p) => stripLoneSurrogates(p)),
    posted_at:   parsePostedAt(listing.posted_at ?? undefined),
  }
}

async function scrapeRawHtml(browser: Browser, url: string): Promise<string | null> {
  const maxAttempts = 5
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const page = await browser.newPage()
    try {
      await throttleScrape()
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2000)
      return await page.content()
    } catch (err) {
      const msg = (err as Error).message
      if (attempt < maxAttempts) {
        const waitMs = 5000 * attempt
        console.log(
          `  Error, waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt}/${maxAttempts})...`,
        )
        await sleep(waitMs)
        continue
      }
      throw err
    } finally {
      await page.close()
    }
  }
  return null
}

function buildSerpPhotos(ad: IkmanAd): string[] {
  const photos: string[] = []
  if (ad.imgUrl) photos.push(ad.imgUrl)

  const imgs = ad.images
  if (imgs && isSerpImages(imgs) && imgs.ids && imgs.base_uri && ad.slug) {
    for (const id of imgs.ids) {
      photos.push(`${imgs.base_uri}/${ad.slug}/${id}/142/107/cropped.jpg`)
    }
  }

  for (const t of ad.thumbnails ?? []) {
    if (t.cdn_url) photos.push(t.cdn_url)
  }
  if (Array.isArray(imgs)) {
    for (const i of imgs) {
      if (i.cdn_url) photos.push(i.cdn_url)
    }
  }

  return [...new Set(photos.filter(Boolean))]
}

function buildDetailPhotos(ad: IkmanAd): string[] {
  const imgs = ad.images
  if (imgs && hasDetailMeta(imgs)) {
    return [...new Set(imgs.meta.map((m) => m.src ?? '').filter(Boolean))]
  }
  return buildSerpPhotos(ad)
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
  console.log('  initialData keys:', Object.keys(data).join(', '))

  const serp    = data.serp    as Record<string, unknown> | undefined
  const listing = data.listing as Record<string, unknown> | undefined

  if (serp) console.log('  serp keys:', Object.keys(serp).join(', '))

  const serpAdsData = unwrapSuccessData<{ ads?: IkmanAd[] }>(serp?.ads)

  let source = 'none'
  const ads: unknown =
    serpAdsData?.ads ??
    (Array.isArray(serp?.ads) ? serp.ads : undefined) ??
    (Array.isArray(serp?.list) ? serp.list : undefined) ??
    (Array.isArray(listing?.list) ? listing.list : undefined) ??
    (Array.isArray(listing?.ads) ? listing.ads : undefined) ??
    (Array.isArray(data.ads) ? data.ads : undefined) ??
    []

  if (serpAdsData?.ads) source = 'serp.ads.data.ads'
  else if (Array.isArray(serp?.ads)) source = 'serp.ads'
  else if (Array.isArray(serp?.list)) source = 'serp.list'

  const list = Array.isArray(ads) ? ads : []
  console.log(`  Resolved ${list.length} ads from ${source}`)
  return list
}

function parseBedrooms(ad: IkmanAd, title: string): number | null {
  const detailsMatch = ad.details?.match(/Beds:\s*(\d+)/i)
  if (detailsMatch) return parseInt(detailsMatch[1], 10)

  for (const prop of ad.properties ?? []) {
    if (prop.key === 'bedrooms' || prop.label?.toLowerCase().includes('bed')) {
      const n = parseInt(prop.value ?? '', 10)
      if (!isNaN(n)) return n
    }
  }

  for (const attr of ad.attributes ?? []) {
    if (attr.name?.toLowerCase().includes('bedroom') || attr.name?.toLowerCase().includes('room')) {
      const n = parseInt(attr.value ?? '', 10)
      if (!isNaN(n)) return n
    }
  }

  const m = title.match(/(\d+)\s*(?:bed(?:room)?s?|BR)/i)
  return m ? parseInt(m[1], 10) : null
}

function parseAd(ad: IkmanAd, area: string, categorySlug: string): Partial<Listing> | null {
  if (!ad.slug) return null

  const slug     = ad.slug
  const ikmanId  = ad.id ?? slug.split('-').pop() ?? slug
  const title    = ad.title ?? ''
  const price    = parsePrice(ad.price ?? ad.money?.price ?? ad.money?.amount)
  const location = ad.location ?? ad.locations?.[0]?.name ?? area
  const bedrooms = parseBedrooms(ad, title)
  const photos   = buildSerpPhotos(ad)

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
  const posted_at = parsePostedAt(
    ad.adDate,
    ad.timeStamp,
    ad.lastBumpUpDate,
    ad.posted_at,
  )

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

function extractDetailAd(data: Record<string, unknown>): IkmanAd | null {
  const wrapped = unwrapSuccessData<{ ad?: IkmanAd }>(data.adDetail)
  if (wrapped?.ad) return wrapped.ad
  if (wrapped && !('ad' in wrapped)) return wrapped as IkmanAd

  const legacy = data.ad as IkmanAd | undefined
  return legacy ?? null
}

/** Fetch phone + description from ad detail pages (parallel, with progress logs). */
export async function enrichListingsWithDetails(
  browser: Browser,
  listings: Partial<Listing>[],
  options?: { concurrency?: number; onProgress?: () => Promise<void> },
): Promise<void> {
  const toFetch = listings.filter((l) => l.url && !l.contact)
  const total = toFetch.length
  if (!total) return

  const fromEnv = parseInt(process.env.DETAIL_CONCURRENCY ?? '', 10)
  const concurrency =
    options?.concurrency ??
    (Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_DETAIL_CONCURRENCY)

  console.log(
    `\nFetching contact/details for ${total} listings (${concurrency} at a time, ~${Math.ceil(total / concurrency) * 4}s estimated)...`,
  )

  let done = 0

  const fetchOne = async (listing: Partial<Listing>, index: number, totalCount: number) => {
    const label = listing.title?.slice(0, 45) ?? listing.url
    console.log(`  Detail ${index + 1}/${totalCount}: ${label}`)

    const detail = await scrapeDetailPage(browser, listing.url!)
    if (detail.description) listing.description = detail.description
    if (detail.contact) listing.contact = detail.contact
    if (detail.posted_at) listing.posted_at = detail.posted_at
    if (detail.photos.length > (listing.photos?.length ?? 0)) {
      listing.photos = detail.photos
    }

    done++
    if (done % 10 === 0 || done === totalCount) {
      console.log(`  Progress: ${done}/${totalCount} detail pages fetched`)
    }
    await options?.onProgress?.()
  }

  await runWithConcurrency(toFetch, concurrency, (listing, i) =>
    fetchOne(listing, i, total),
  )

  const retry = listings.filter((l) => l.url && !l.contact)
  if (retry.length) {
    console.log(`\nRetrying ${retry.length} listings still missing contact...`)
    await runWithConcurrency(retry, 2, (listing, i) => fetchOne(listing, i, retry.length))
  }
}

async function scrapeDetailPage(
  browser: Browser,
  url: string,
): Promise<{
  description: string | null
  contact: string | null
  photos: string[]
  posted_at: string | null
}> {
  try {
    const rawHtml = await scrapeRawHtml(browser, url)
    if (!rawHtml) return { description: null, contact: null, photos: [], posted_at: null }

    const data = extractInitialData(rawHtml)
    if (!data) return { description: null, contact: null, photos: [], posted_at: null }

    const ad = extractDetailAd(data)
    if (!ad) return { description: null, contact: null, photos: [], posted_at: null }

    const photos = buildDetailPhotos(ad)
    const contact =
      ad.contactCard?.phoneNumbers?.[0]?.number ??
      ad.contact?.chat_phone_number ??
      ad.contact?.phone ??
      null
    const description = ad.description?.slice(0, 1000) ?? null
    const posted_at = parsePostedAt(
      ad.adDate,
      ad.timeStamp,
      ad.lastBumpUpDate,
      ad.posted_at,
    )

    return { description, contact, photos, posted_at }
  } catch (err) {
    console.error(`  Detail scrape failed for ${url}:`, (err as Error).message)
    return { description: null, contact: null, photos: [], posted_at: null }
  }
}

export async function runScraper(config: ScrapeConfig, browser: Browser): Promise<Partial<Listing>[]> {
  const allListings: Partial<Listing>[] = []

  for (const area of config.areas) {
    const areaSlug = areaToSlug(area)
    if (!areaSlug) {
      console.warn(`  Skipping area with no slug: ${area}`)
      continue
    }

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
          const rawHtml = await scrapeRawHtml(browser, url)

          if (!rawHtml) {
            console.log(`  Playwright returned no HTML`)
            break
          }

          const data = extractInitialData(rawHtml)
          if (!data) {
            console.log(`  window.initialData not found in HTML`)
            break
          }

          const ads = extractAdsList(data)

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

        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  const seen = new Set<string>()
  const unique = allListings.filter((l) => {
    if (!l.ikman_id || seen.has(l.ikman_id)) return false
    seen.add(l.ikman_id)
    return true
  })

  // Detail pages are fetched in index.ts for *new* listings only (saves time on repeat runs)
  return unique
}
