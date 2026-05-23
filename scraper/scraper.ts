import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import type { Listing } from '../lib/types'

// ikman.lk area slug mapping
const AREA_SLUGS: Record<string, string> = {
  'Moratuwa':       'moratuwa',
  'Ratmalana':      'ratmalana',
  'Mount Lavinia':  'mount-lavinia',
  'Dehiwala':       'dehiwala',
}

// ikman.lk category slug mapping (property for rent subcategories)
const TYPE_SLUGS: Record<string, string> = {
  apartment: 'apartments-for-rent',
  house:     'houses-for-rent',
  annex:     'rooms-annexes-for-rent',
}

export interface ScrapeConfig {
  areas: string[]
  listing_types: string[]
  max_price: number
  min_bedrooms: number
  max_bedrooms: number
}

function extractIkmanId(url: string): string {
  // ikman.lk URLs end with a numeric ID: /en/ad/title-here-12345678
  const match = url.match(/[^-]+$/)
  return match ? match[0] : url
}

function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[^0-9]/g, '')
  const n = parseInt(cleaned, 10)
  return isNaN(n) ? null : n
}

function parseBedrooms(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:bed|bedroom|BR)/i)
  if (match) return parseInt(match[1], 10)
  // fallback: single digit in title
  const single = text.match(/\b([12])\s*(?:room|bed)/i)
  return single ? parseInt(single[1], 10) : null
}

function inferListingType(title: string, categorySlug: string): Listing['listing_type'] {
  const t = title.toLowerCase()
  if (categorySlug.includes('apartment') || t.includes('apartment') || t.includes('flat')) return 'apartment'
  if (categorySlug.includes('room') || categorySlug.includes('annex') || t.includes('annex') || t.includes('room')) return 'annex'
  if (categorySlug.includes('house') || t.includes('house') || t.includes('villa') || t.includes('bungalow')) return 'house'
  return null
}

function parseListingCards(
  html: string,
  area: string,
  categorySlug: string,
  baseUrl: string,
): Partial<Listing>[] {
  const $ = cheerio.load(html)
  const results: Partial<Listing>[] = []

  // ikman.lk listing cards – try multiple selector patterns for resilience
  const cardSelectors = [
    'li[class*="item"]',
    'div[class*="listing"]',
    'article[class*="ad"]',
    '.normal-ad',
    '[data-testid="listing-card"]',
  ]

  let cards = $('')
  for (const sel of cardSelectors) {
    const found = $(sel)
    if (found.length > 0) {
      cards = found
      break
    }
  }

  cards.each((_, el) => {
    const card = $(el)

    // Link + ikman_id
    const linkEl = card.find('a[href*="/en/ad/"]').first()
    const href = linkEl.attr('href') ?? card.find('a').first().attr('href') ?? ''
    if (!href) return

    const fullUrl = href.startsWith('http') ? href : `https://ikman.lk${href}`
    const ikmanId = extractIkmanId(href)

    // Title
    const title = (
      card.find('h2, h3, [class*="title"]').first().text() ||
      linkEl.text()
    ).trim()

    // Price
    const priceText = card.find('[class*="price"], strong').first().text()
    const price = parsePrice(priceText)

    // Location
    const location = card.find('[class*="location"], [class*="town"]').first().text().trim() || area

    // Photos
    const photos: string[] = []
    card.find('img').each((_, img) => {
      const src = $(img).attr('src') ?? $(img).attr('data-src') ?? ''
      if (src && !src.includes('placeholder') && !src.includes('no-image')) {
        photos.push(src.startsWith('http') ? src : `https://ikman.lk${src}`)
      }
    })

    // Posted date
    const dateText = card.find('[class*="date"], time').first().text().trim()
    let posted_at: string | null = null
    if (dateText) {
      const parsed = new Date(dateText)
      if (!isNaN(parsed.getTime())) {
        posted_at = parsed.toISOString()
      }
    }

    const listing_type = inferListingType(title, categorySlug)
    const bedrooms = parseBedrooms(title)

    results.push({
      ikman_id: ikmanId,
      title,
      price,
      location,
      area,
      bedrooms,
      listing_type,
      description: null,
      photos,
      contact: null,
      posted_at,
      url: fullUrl,
      is_new: true,
    })
  })

  return results
}

async function scrapeListingDetail(
  page: import('playwright').Page,
  url: string,
): Promise<{ description: string | null; contact: string | null; photos: string[] }> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    const html = await page.content()
    const $ = cheerio.load(html)

    const description = (
      $('[class*="description"], [class*="detail-content"]').first().text() ||
      $('p').slice(0, 3).text()
    ).trim().slice(0, 1000) || null

    // Phone number patterns common in Sri Lanka
    const pageText = $('body').text()
    const phoneMatch = pageText.match(/(?:\+94|0)(?:7[0-9]|11)[0-9]{7}/)
    const contact = phoneMatch ? phoneMatch[0] : null

    const photos: string[] = []
    $('img[src*="ikman"], img[data-src*="ikman"], .gallery img, [class*="photo"] img').each((_, img) => {
      const src = $(img).attr('src') ?? $(img).attr('data-src') ?? ''
      if (src && !src.includes('placeholder') && photos.length < 8) {
        photos.push(src.startsWith('http') ? src : `https://ikman.lk${src}`)
      }
    })

    return { description, contact, photos }
  } catch {
    return { description: null, contact: null, photos: [] }
  }
}

export async function runScraper(config: ScrapeConfig): Promise<Partial<Listing>[]> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
  })

  const allListings: Partial<Listing>[] = []

  try {
    const page = await context.newPage()
    page.setDefaultTimeout(30000)

    for (const area of config.areas) {
      const areaSlug = AREA_SLUGS[area] ?? area.toLowerCase().replace(/\s+/g, '-')

      for (const type of config.listing_types) {
        const categorySlug = TYPE_SLUGS[type] ?? 'property-for-rent'
        const url = `https://ikman.lk/en/ads/${areaSlug}/${categorySlug}?sort=date&order=desc`

        console.log(`Scraping: ${url}`)

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
          // Wait for listing cards to render
          await page.waitForTimeout(2000)

          const html = await page.content()
          const cards = parseListingCards(html, area, categorySlug, url)

          // Filter by price and bedrooms
          const filtered = cards.filter((c) => {
            if (c.price && c.price > config.max_price) return false
            if (c.bedrooms) {
              if (c.bedrooms < config.min_bedrooms) return false
              if (c.bedrooms > config.max_bedrooms) return false
            }
            return true
          })

          console.log(`  Found ${filtered.length} listings after filtering (from ${cards.length} total)`)
          allListings.push(...filtered)
        } catch (err) {
          console.error(`  Error scraping ${url}:`, (err as Error).message)
        }

        // Polite delay between requests
        await page.waitForTimeout(1500)
      }
    }

    // Fetch details (description + contact + better photos) for each listing
    const detailPage = await context.newPage()
    for (const listing of allListings) {
      if (!listing.url) continue
      const detail = await scrapeListingDetail(detailPage, listing.url)
      listing.description = detail.description
      listing.contact = detail.contact
      if (detail.photos.length > listing.photos!.length) {
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
