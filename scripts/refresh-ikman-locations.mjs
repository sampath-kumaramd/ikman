#!/usr/bin/env node
/**
 * Fetch official location tree from ikman.lk and write data/ikman-locations.json
 * Only Sri Lanka districts/towns — strips overseas buckets ikman adds (UAE, Saudi, …).
 * Usage: npm run areas:refresh
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'ikman-locations.json')
const URL = 'https://ikman.lk/data/locations'

/** Top-level regions that are not Sri Lankan geography (ikman still lists them). */
const EXCLUDED_ROOT_SLUGS = new Set([
  'united-arab-emirates',
  'saudi-arabia',
  'sri-lanka', // country root, not a useful scrape area
])

const POPULAR_CANDIDATES = [
  'Colombo', 'Nugegoda', 'Dehiwala', 'Mount Lavinia', 'Moratuwa',
  'Kandy', 'Galle', 'Negombo', 'Maharagama', 'Battaramulla',
  'Malabe', 'Kotte', 'Gampaha', 'Jaffna', 'Kurunegala', 'Matara',
]

function isExcludedSubtree(loc, byId) {
  if (!loc) return true
  if (EXCLUDED_ROOT_SLUGS.has(loc.slug)) return true
  // Walk parents: if any ancestor is an excluded root, drop it
  let pid = loc.parentId
  const seen = new Set()
  while (pid != null && pid !== -1 && !seen.has(pid)) {
    seen.add(pid)
    const parent = byId[String(pid)]
    if (!parent) break
    if (EXCLUDED_ROOT_SLUGS.has(parent.slug)) return true
    pid = parent.parentId
  }
  return false
}

const res = await fetch(URL, {
  headers: { 'User-Agent': 'ikman-rental-tracker/1.0 (location refresh)' },
})
if (!res.ok) {
  console.error('Failed to fetch', URL, res.status)
  process.exit(1)
}

const raw = await res.json()
const locs = raw.locations || {}
const byId = { ...locs }

const bySlug = new Map()
for (const loc of Object.values(locs)) {
  if (!loc?.slug || !loc?.name) continue
  if (isExcludedSubtree(loc, byId)) continue

  const parent =
    loc.parentId != null && loc.parentId !== -1 ? byId[String(loc.parentId)] : null
  bySlug.set(loc.slug, {
    name: loc.name,
    slug: loc.slug,
    parentId: loc.parentId ?? null,
    parentName: parent?.name ?? null,
    isDistrict: loc.parentId === -1 || loc.parentId == null,
  })
}

const nameCount = {}
for (const item of bySlug.values()) {
  nameCount[item.name] = (nameCount[item.name] || 0) + 1
}

const areas = []
for (const item of bySlug.values()) {
  let displayName = item.name
  if (nameCount[item.name] > 1 && item.parentName) {
    displayName = `${item.name} (${item.parentName})`
  }
  areas.push({
    name: displayName,
    slug: item.slug,
    district: item.isDistrict ? item.name : item.parentName || null,
  })
}

areas.sort((a, b) => {
  const d = (a.district || a.name).localeCompare(b.district || b.name)
  if (d !== 0) return d
  return a.name.localeCompare(b.name)
})

const nameSet = new Set(areas.map((a) => a.name))
const slugByBaseName = {}
for (const a of areas) {
  const base = a.name.replace(/ \(.+\)$/, '')
  if (!slugByBaseName[base]) slugByBaseName[base] = a.name
}
const popular = POPULAR_CANDIDATES.map((n) =>
  nameSet.has(n) ? n : slugByBaseName[n],
).filter(Boolean)

const out = {
  source: URL,
  version: raw.version || null,
  fetchedAt: new Date().toISOString(),
  count: areas.length,
  popular,
  areas,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
console.log(`Wrote ${areas.length} Sri Lanka areas → ${OUT}`)
console.log('(Excluded overseas regions: UAE, Saudi Arabia, country root)')
