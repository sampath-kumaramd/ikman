import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import type { Listing } from '../lib/types'

// Correct ikman.lk area slugs
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

// Correct ikman.lk rental category slugs (confirmed from live site)
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

function extractIkmanId(url: string): string {
  // URLs look like /en/ad/some-title-12345678
  const match = url.match(/[^-\/]+$/)
  return match ? match[0] : url
}

function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[^0-9]/g, '')
  const n = parseInt(cleaned, 10)
  return isNaN(n) || n === 0 ? null : n
}

function parseBedrooms(text: string): number | null {
  const m = text.match(/(\d+)\s*(?:bed(?:room)?s?|BR|room)/i)
  return m ? parseInt(m[1], 10) : null
}

function inferListingType(categorySlug: string, title: string): Listing['listing_type'] {
  if (categorySlug.includes('apartment')) return 'apartment'
  if (categorySlug.includes('house'))     return 'house'
  if (categorySlug.includes('room') || categorySlug.includes('annex')) return 'annex'
  const t = title.toLowerCase()
  if (t.includes('apartment') || t.includes('flat')) return 'apartment'
  if (t.includes('annex') || t.includes('room'))     return 'annex'
  if (t.includes('house') || t.includes('villa'))    return 'house'
  return null
}

function parseListingCards(
  html: string,
  area: string,
  categorySlug: string,
): Partial<Listing>[] {
  const $ = cheerio.load(html)
  const results: Partial<Listing>[] = []

  // Log page title and card count attempts for debugging
  console.log(`  Page title: "${$('title').text().trim()}"`)

  // ikman.lk uses CSS modules — class names are generated but contain keywords.
  // Try progressively broader selectors until we find listing cards.
  const selectors = [
    'li[class*="item--item"]',
    'li[class*="item"]',
    '[class*="listing-item"]',
    '[class*="ad-item"]',
    'article',
    // Broadest fallback: any <li> containing a link to /en/ad/
    'li:has(a[href*="/en/ad/"])',
    // Even broader: any element containing ad links
    'div:has(> a[href*="/en/ad/"])',
  ]

  let cards = $('')
  for (const sel of selectors) {
    try {
      const found = $(sel)
      if (found.length > 0) {
        console.log(`  Matched selector "${sel}" → ${found.length} cards`)
        cards = found
        break
      }
    } catch {
      // invalid selector — skip
    }
  }

  if (cards.length === 0) {
    // Last resort: collect all unique /en/ad/ links directly
    console.log('  No card selector matched — falling back to link extraction')
    const seen = new Set<string>()
    $('a[href*="/en/ad/"]').each((_, el) => {
      const href = $(el).attr('href') ?? ''
      if (!href || seen.has(href)) return
      seen.add(href)
      const fullUrl = href.startsWith('http') ? href : `https://ikman.lk${href}`
      const text    = $(el).text().trim()
      results.push({
        ikman_id:     extractIkmanId(href),
        title:        text || 'Listing',
        price:        null,
        location:     area,
        area,
        bedrooms:     null,
        listing_type: inferListingType(categorySlug, text),
        description:  null,
        photos:       [],
        contact:      null,
        posted_at:    null,
        url:          fullUrl,
        is_new:       true,
      })
    })
    return results
  }

  cards.each((_, el) => {
    const card = $(el)

    const linkEl = card.find('a[href*="/en/ad/"]').first()
    const href   = linkEl.attr('href') ?? card.closest('a[href*="/en/ad/"]').attr('href') ?? ''
    if (!href) return

    const fullUrl = href.startsWith('http') ? href : `https://ikman.lk${href}`
    const ikmanId = extractIkmanId(href)

    // Title — try multiple patterns
    const title = (
      card.find('h2, h3').first().text() ||
      card.find('[class*="title"]').first().text() ||
      card.find('[class*="heading"]').first().text() ||
      linkEl.text()
    ).trim()

    // Price
    const priceText = (
      card.find('[class*="price"]').first().text() ||
      card.find('strong').first().text()
    )
    const price = parsePrice(priceText)

    // Location
    const location = (
      card.find('[class*="location"]').first().text() ||
      card.find('[class*="town"]').first().text() ||
      card.find('[class*="place"]').first().text()
    ).trim() || area

    // Photos
    const photos: string[] = []
    card.find('img').each((_, img) => {
      const src = $(img).attr('src') ?? $(img).attr('data-src') ?? $(img).attr('data-lazy-src') ?? ''
      if (src && !src.includes('placeholder') && !src.includes('no-image') && !src.includes('data:image')) {
        photos.push(src.startsWith('http') ? src : `https://ikman.lk${src}`)
      }
    })

    // Date posted
    const dateText = (
      card.find('time').first().attr('datetime') ||
      card.find('[class*="date"]').first().text()
    ).trim()
    let posted_at: string | null = null
    if (dateText) {
      const parsed = new Date(dateText)
      if (!isNaN(parsed.getTime())) posted_at = parsed.toISOString()
    }

    const listing_type = inferListingType(categorySlug, title)
    const bedrooms     = parseBedrooms(title)

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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(1500)
    const html = await page.content()
    const $ = cheerio.load(html)

    const description = (
      $('[class*="description"]').first().text() ||
      $('[class*="detail"]').first().text() ||
      $('p').slice(0, 4).text()
    ).trim().slice(0, 1000) || null

    // Sri Lanka phone number pattern
    const pageText = $('body').text()
    const phoneMatch = pageText.match(/(?:\+94|0)(?:7[0-9]|11)\s?[0-9]{3}\s?[0-9]{4}/)
    const contact = phoneMatch ? phoneMatch[0].replace(/\s/g, '') : null

    const photos: string[] = []
    $('img').each((_, img) => {
      const src = $(img).attr('src') ?? $(img).attr('data-src') ?? ''
      if (
        src &&
        (src.includes('ikman') || src.includes('amazonaws') || src.includes('cloudfront')) &&
        !src.includes('placeholder') &&
        photos.length < 6
      ) {
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
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })

  const allListings: Partial<Listing>[] = []

  try {
    const page = await context.newPage()
    page.setDefaultTimeout(30000)

    for (const area of config.areas) {
      const areaSlug = AREA_SLUGS[area] ?? area.toLowerCase().replace(/\s+/g, '-')

      for (const type of config.listing_types) {
        const categorySlug = TYPE_SLUGS[type] ?? 'apartment-rentals'

        // Use ikman.lk's confirmed price filter query param format
        const params = new URLSearchParams({
          'money.price.maximum': String(config.max_price),
          'sort': 'date',
          'order': 'desc',
        })
        const url = `https://ikman.lk/en/ads/${areaSlug}/${categorySlug}?${params}`

        console.log(`Scraping: ${url}`)

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
          await page.waitForTimeout(2000)

          const html = await page.content()

          // Debug: log first 500 chars to see what we're getting
          const bodyText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300)
          console.log(`  HTML preview: ${bodyText}`)

          const cards = parseListingCards(html, area, categorySlug)

          // Filter by bedrooms (price already filtered by URL param)
          const filtered = cards.filter((c) => {
            if (c.bedrooms !== null && c.bedrooms !== undefined) {
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

        await page.waitForTimeout(1500)
      }
    }

    // Enrich listings with detail page data (description, contact, photos)
    console.log(`\nFetching details for ${allListings.length} listings...`)
    const detailPage = await context.newPage()
    for (const listing of allListings) {
      if (!listing.url) continue
      const detail = await scrapeListingDetail(detailPage, listing.url)
      listing.description = detail.description
      listing.contact     = detail.contact
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
