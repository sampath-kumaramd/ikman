/**
 * Areas for scraping + UI — sourced from ikman.lk's official locations feed.
 * Refresh with: npm run areas:refresh
 */
import locationsData from '@/data/ikman-locations.json'

export interface IkmanArea {
  name: string
  slug: string
  district: string | null
}

/** Hard cap so one user can't explode scrape cost. */
export const MAX_AREAS_PER_USER = 15

type LocationsFile = {
  source: string
  version: string | null
  fetchedAt: string
  count: number
  popular: string[]
  areas: IkmanArea[]
}

const data = locationsData as LocationsFile

/** All ikman locations (331+), same names as the site. */
export const IKMAN_AREAS: IkmanArea[] = data.areas

/** Display name → ikman slug */
export const AREA_SLUGS: Record<string, string> = Object.fromEntries(
  data.areas.map((a) => [a.name, a.slug]),
)

/** All known display names (sorted as in the data file). */
export const AVAILABLE_AREAS: string[] = data.areas.map((a) => a.name)

/** Popular quick picks that exist in the ikman feed. */
export const POPULAR_AREAS: string[] = (data.popular ?? []).filter((n) =>
  Object.prototype.hasOwnProperty.call(AREA_SLUGS, n),
)

/** District → area names for grouped UI. */
export const AREAS_BY_DISTRICT: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {}
  for (const a of data.areas) {
    const d = a.district || 'Other'
    if (!map[d]) map[d] = []
    map[d].push(a.name)
  }
  for (const d of Object.keys(map)) {
    map[d].sort((x, y) => x.localeCompare(y))
  }
  return map
})()

export const DISTRICTS: string[] = Object.keys(AREAS_BY_DISTRICT).sort((a, b) =>
  a.localeCompare(b),
)

/** Metadata about the feed snapshot. */
export const LOCATIONS_META = {
  source: data.source,
  version: data.version,
  fetchedAt: data.fetchedAt,
  count: data.count,
}

/** ikman-style slug from free text (fallback for unknown custom names). */
export function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''′]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

/**
 * Resolve ikman.lk location slug.
 * Prefer official map; otherwise slugify a custom place name.
 */
export function areaToSlug(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return null

  if (Object.prototype.hasOwnProperty.call(AREA_SLUGS, trimmed)) {
    return AREA_SLUGS[trimmed]
  }

  const exactKey = Object.keys(AREA_SLUGS).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase(),
  )
  if (exactKey) return AREA_SLUGS[exactKey]

  // Match without district qualifier: "Homagama" vs "Homagama (Colombo)"
  const bare = Object.keys(AREA_SLUGS).find((k) => {
    const base = k.replace(/ \(.+\)$/, '')
    return base.toLowerCase() === trimmed.toLowerCase()
  })
  if (bare) return AREA_SLUGS[bare]

  const slug = nameToSlug(trimmed)
  return slug.length >= 2 ? slug : null
}

/** Accept known ikman places or any reasonable custom place name. */
export function isSupportedArea(name: string): boolean {
  if (typeof name !== 'string') return false
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 80) return false
  return areaToSlug(trimmed) != null
}

/** Normalize for storage (canonical casing when known). */
export function normalizeAreaName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (Object.prototype.hasOwnProperty.call(AREA_SLUGS, trimmed)) return trimmed

  const exactKey = Object.keys(AREA_SLUGS).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase(),
  )
  if (exactKey) return exactKey

  const bare = Object.keys(AREA_SLUGS).find((k) => {
    const base = k.replace(/ \(.+\)$/, '')
    return base.toLowerCase() === trimmed.toLowerCase()
  })
  if (bare) return bare

  return trimmed
}

/** Deduplicate + validate + cap list length. */
export function sanitizeAreas(areas: unknown): string[] {
  if (!Array.isArray(areas)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of areas) {
    if (typeof raw !== 'string') continue
    if (!isSupportedArea(raw)) continue
    const name = normalizeAreaName(raw)
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
    if (out.length >= MAX_AREAS_PER_USER) break
  }
  return out
}
