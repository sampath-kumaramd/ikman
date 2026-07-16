/**
 * Per-user listing relevance.
 *
 * Scrape runs use the UNION of every user's areas, so each listing is tagged
 * with the search area(s) it was found under. Alerts must still respect *this*
 * user's criteria — including rejecting ads whose pin location is a different
 * known place the user never selected.
 */
import { AREA_SLUGS, normalizeAreaName } from './areas'
import type { Listing, ListingType, SearchCriteria } from './types'

/** Known ikman place names, longest first (so "Colombo 10" wins over "Colombo"). */
const KNOWN_AREAS_BY_LENGTH: string[] = Object.keys(AREA_SLUGS).sort(
  (a, b) => b.length - a.length,
)

export interface MatchableListing {
  area?: string | null
  /** All scrape search areas this ad was seen under in the current run. */
  foundInAreas?: string[] | null
  location?: string | null
  listing_type?: ListingType | string | null
  price?: number | null
  bedrooms?: number | null
}

/** True if `candidate` is the same place as `selected`, or a numbered child (Colombo 3 ⊂ Colombo). */
export function areaCovers(selected: string, candidate: string): boolean {
  const a = selected.trim().toLowerCase()
  const b = candidate.trim().toLowerCase()
  if (!a || !b) return false
  if (a === b) return true
  // "Colombo 3" / "Colombo 10" under parent "Colombo"
  if (b.startsWith(a + ' ')) return true
  return false
}

/**
 * Resolve free-text ikman pin location to a known area name when possible.
 * Prefers the longest known name contained in the string (word-ish boundaries).
 */
export function resolveKnownAreaFromLocation(location: string | null | undefined): string | null {
  if (!location || typeof location !== 'string') return null
  const raw = location.trim().replace(/\s+/g, ' ')
  if (raw.length < 2) return null

  // Exact / case-insensitive / bare-name normalization first
  const normalized = normalizeAreaName(raw)
  if (Object.prototype.hasOwnProperty.call(AREA_SLUGS, normalized)) {
    return normalized
  }

  const lower = raw.toLowerCase()
  for (const name of KNOWN_AREAS_BY_LENGTH) {
    const n = name.toLowerCase()
    // Whole-string or as a token / comma-separated part
    if (lower === n) return name
    // "Nugegoda, Colombo" / "High Level Road Nugegoda"
    const re = new RegExp(
      `(?:^|[^a-z0-9])${escapeRegExp(n)}(?:[^a-z0-9]|$)`,
      'i',
    )
    if (re.test(raw)) return name
  }

  return null
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Does the ad's pin location conflict with the user's selected areas?
 * Unknown neighborhoods pass (we trust the scrape search area).
 * Known places must be covered by at least one selected area.
 */
export function locationAllowedForUser(
  location: string | null | undefined,
  userAreas: string[],
): boolean {
  if (!userAreas.length) return false
  const resolved = resolveKnownAreaFromLocation(location)
  if (!resolved) return true
  return userAreas.some((selected) => areaCovers(selected, resolved))
}

/** Scrape buckets that count for this listing. */
export function listingSearchAreas(listing: MatchableListing): string[] {
  if (listing.foundInAreas?.length) {
    return [...new Set(listing.foundInAreas.filter(Boolean))]
  }
  if (listing.area) return [listing.area]
  return []
}

/**
 * True when the listing was found under at least one of the user's areas
 * and its pin location (when known) is also one of those areas.
 */
export function areaMatchesUser(listing: MatchableListing, userAreas: string[]): boolean {
  if (!userAreas.length) return false

  const searchAreas = listingSearchAreas(listing)
  if (!searchAreas.length) return false

  const foundUnderUserArea = searchAreas.some((a) =>
    userAreas.some((u) => areaCovers(u, a) || a.toLowerCase() === u.toLowerCase()),
  )
  if (!foundUnderUserArea) return false

  return locationAllowedForUser(listing.location, userAreas)
}

/** Full criteria match used for Telegram alerts (and shared with the dashboard). */
export function matchesUserCriteria(
  listing: MatchableListing,
  criteria: Pick<
    SearchCriteria,
    'areas' | 'listing_types' | 'max_price' | 'min_bedrooms' | 'max_bedrooms'
  >,
): boolean {
  if (!areaMatchesUser(listing, criteria.areas)) return false

  if (
    listing.listing_type &&
    criteria.listing_types.length &&
    !criteria.listing_types.includes(listing.listing_type as ListingType)
  ) {
    return false
  }

  if (listing.price != null && listing.price > criteria.max_price) return false

  if (listing.bedrooms != null) {
    if (listing.bedrooms < criteria.min_bedrooms) return false
    if (listing.bedrooms > criteria.max_bedrooms) return false
  }

  return true
}

/** Convenience for full Listing rows from the DB. */
export function matchesUser(
  listing: Pick<Listing, 'area' | 'location' | 'listing_type' | 'price' | 'bedrooms'> & {
    foundInAreas?: string[] | null
  },
  criteria: Pick<
    SearchCriteria,
    'areas' | 'listing_types' | 'max_price' | 'min_bedrooms' | 'max_bedrooms'
  >,
): boolean {
  return matchesUserCriteria(listing, criteria)
}
