/**
 * Canonical area list for scraping + UI.
 * Only these names map to known ikman.lk location slugs.
 * Keep UI, API validation, and the scraper in sync via this module.
 */
export const AREA_SLUGS: Record<string, string> = {
  Moratuwa: 'moratuwa',
  Ratmalana: 'ratmalana',
  'Mount Lavinia': 'mount-lavinia',
  Dehiwala: 'dehiwala',
  Colombo: 'colombo',
  Panadura: 'panadura',
  Piliyandala: 'piliyandala',
  Maharagama: 'maharagama',
  Nugegoda: 'nugegoda',
}

export const AVAILABLE_AREAS: string[] = Object.keys(AREA_SLUGS)

export function isSupportedArea(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(AREA_SLUGS, name)
}

/** Resolve ikman.lk location slug, or null if the area is not supported. */
export function areaToSlug(name: string): string | null {
  return AREA_SLUGS[name] ?? null
}
