import { SupabaseClient } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'
import { locationAllowedForUser } from './match-listing'
import type {
  Listing, ListingFilters, ListingType, Notification, ScrapeRun, SearchCriteria, UserSettings,
} from './types'

/** Postgrest errors are plain objects, not Error instances — rethrowing them
 *  raw renders as useless `{code, details, hint, message}` in error overlays
 *  and logs. Wrap them so the message and hint actually surface. */
function dbError(error: PostgrestError): Error {
  const hint = error.hint ? ` (hint: ${error.hint})` : ''
  const details = error.details ? ` — ${error.details}` : ''
  return new Error(`Database error [${error.code}]: ${error.message}${details}${hint}`)
}

export const LISTING_TYPES: ListingType[] = ['apartment', 'annex', 'house']

export const DEFAULT_CRITERIA: SearchCriteria = {
  areas: [],
  // Empty by default — user must pick property types (onboarding + settings).
  listing_types: [],
  max_price: 75_000,
  min_bedrooms: 1,
  max_bedrooms: 2,
}

// ── User settings ─────────────────────────────────────────────────────────────

export async function getUserSettings(
  client: SupabaseClient,
  userId: string,
): Promise<UserSettings | null> {
  const { data, error } = await client
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw dbError(error)
  return (data as UserSettings) ?? null
}

export async function upsertUserSettings(
  client: SupabaseClient,
  userId: string,
  patch: Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<UserSettings> {
  const { data, error } = await client
    .from('user_settings')
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select()
    .single()
  if (error) throw dbError(error)
  return data as UserSettings
}

/** All users who finished onboarding — the scraper works from this list. */
export async function getOnboardedUserSettings(client: SupabaseClient): Promise<UserSettings[]> {
  const { data, error } = await client
    .from('user_settings')
    .select('*')
    .eq('onboarding_completed', true)
  if (error) throw dbError(error)
  return (data ?? []) as UserSettings[]
}

export async function findUserByConnectCode(
  client: SupabaseClient,
  code: string,
): Promise<UserSettings | null> {
  const { data, error } = await client
    .from('user_settings')
    .select('*')
    .eq('telegram_connect_code', code)
    .maybeSingle()
  if (error) throw dbError(error)
  return (data as UserSettings) ?? null
}

export async function findUserByChatId(
  client: SupabaseClient,
  chatId: string,
): Promise<UserSettings | null> {
  const { data, error } = await client
    .from('user_settings')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .limit(1)
    .maybeSingle()
  if (error) throw dbError(error)
  return (data as UserSettings) ?? null
}

export async function linkTelegramChat(
  client: SupabaseClient,
  userId: string,
  chatId: string,
): Promise<void> {
  const { error } = await client
    .from('user_settings')
    .update({
      telegram_chat_id: chatId,
      telegram_connect_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  if (error) throw dbError(error)
}

// ── Listings ──────────────────────────────────────────────────────────────────

/**
 * Listings scoped to one user: rows are narrowed to the user's saved search
 * criteria first, then by any dashboard filters.
 *
 * `is_new` is **per user only** (via `user_listing_states`). A listing is new
 * until *this* user marks it viewed — signup time and other users' views do
 * not affect it. Legacy `listings.is_new` is ignored.
 */
export async function getListingsForUser(
  client: SupabaseClient,
  settings: UserSettings,
  filters: ListingFilters = {},
): Promise<{ listings: Listing[]; total: number }> {
  const viewed = await getViewedListingIds(client, settings.user_id)

  const {
    area, listing_type, min_price, max_price,
    min_bedrooms, max_bedrooms, is_new,
    sort = 'date_desc', page = 1, limit = 20,
  } = filters

  let query = client.from('listings').select('*', { count: 'exact' })

  // Base scope: the user's saved criteria (null fields pass — "price on request" etc.)
  if (settings.areas.length)         query = query.in('area', settings.areas)
  if (settings.listing_types.length) {
    query = query.or(`listing_type.is.null,listing_type.in.(${settings.listing_types.join(',')})`)
  }
  query = query.or(`price.is.null,price.lte.${settings.max_price}`)
  query = query.or(
    `bedrooms.is.null,and(bedrooms.gte.${settings.min_bedrooms},bedrooms.lte.${settings.max_bedrooms})`,
  )

  // Dashboard filter bar
  if (area)          query = query.eq('area', area)
  if (listing_type)  query = query.eq('listing_type', listing_type)
  if (min_price)     query = query.gte('price', min_price)
  if (max_price)     query = query.lte('price', max_price)
  if (min_bedrooms)  query = query.gte('bedrooms', min_bedrooms)
  if (max_bedrooms)  query = query.lte('bedrooms', max_bedrooms)

  // New / viewed filters use only this user's viewed set (not listing age)
  if (is_new === true) {
    if (viewed.size) query = query.not('id', 'in', `(${[...viewed].join(',')})`)
  } else if (is_new === false) {
    if (!viewed.size) return { listings: [], total: 0 }
    query = query.in('id', [...viewed])
  }

  // date sorts: prefer posted_at (ikman post date), fall back to created_at (scrape time)
  // nullsFirst: false keeps NULL posted_at rows at the bottom
  if (sort === 'date_desc') {
    query = query
      .order('posted_at',   { ascending: false, nullsFirst: false })
      .order('created_at',  { ascending: false })
  } else if (sort === 'date_asc') {
    query = query
      .order('posted_at',   { ascending: true,  nullsFirst: false })
      .order('created_at',  { ascending: true  })
  } else if (sort === 'price_asc') {
    query = query.order('price', { ascending: true,  nullsFirst: false })
  } else {
    // price_desc
    query = query.order('price', { ascending: false, nullsFirst: false })
  }

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query
  if (error) throw dbError(error)

  // Drop ads whose pin is a different known place the user never selected
  // (same rule as Telegram matching). Unknown neighborhoods still pass.
  const listings = ((data ?? []) as Listing[])
    .filter((l) => locationAllowedForUser(l.location, settings.areas))
    .map((l) => ({
      ...l,
      is_new: !viewed.has(l.id),
    }))

  return { listings, total: count ?? 0 }
}

export async function upsertListings(
  client: SupabaseClient,
  listings: Omit<Listing, 'id' | 'created_at'>[],
): Promise<Listing[]> {
  const { data, error } = await client
    .from('listings')
    .upsert(listings, { onConflict: 'ikman_id', ignoreDuplicates: false })
    .select()
  if (error) throw dbError(error)
  return (data ?? []) as Listing[]
}

/**
 * Which of the given ikman_ids already exist in the DB.
 *
 * Prefer this over loading every listing: Supabase/PostgREST caps rows
 * (~1000 by default), so a full-table select silently misses older ads and
 * the scraper re-alerts them every run.
 */
export async function getExistingIkmanIdsAmong(
  client: SupabaseClient,
  candidateIds: string[],
): Promise<Set<string>> {
  const existing = new Set<string>()
  if (!candidateIds.length) return existing

  // .in() URL size limit — keep batches modest
  const chunkSize = 200
  for (let i = 0; i < candidateIds.length; i += chunkSize) {
    const chunk = candidateIds.slice(i, i + chunkSize)
    const { data, error } = await client
      .from('listings')
      .select('ikman_id')
      .in('ikman_id', chunk)
    if (error) throw dbError(error)
    for (const row of data ?? []) {
      existing.add((row as { ikman_id: string }).ikman_id)
    }
  }
  return existing
}

/** @deprecated Prefer getExistingIkmanIdsAmong — full table scan hits the row cap. */
export async function getExistingIkmanIds(client: SupabaseClient): Promise<Set<string>> {
  const ids = new Set<string>()
  const pageSize = 1000
  let from = 0
  for (;;) {
    const { data, error } = await client
      .from('listings')
      .select('ikman_id')
      .range(from, from + pageSize - 1)
    if (error) throw dbError(error)
    const rows = (data ?? []) as { ikman_id: string }[]
    for (const r of rows) ids.add(r.ikman_id)
    if (rows.length < pageSize) break
    from += pageSize
  }
  return ids
}

// ── Per-user viewed state ─────────────────────────────────────────────────────

async function getViewedListingIds(client: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await client
    .from('user_listing_states')
    .select('listing_id')
    .eq('user_id', userId)
  if (error) throw dbError(error)
  return new Set((data ?? []).map((r: { listing_id: string }) => r.listing_id))
}

export async function markListingsViewed(
  client: SupabaseClient,
  userId: string,
  listingIds: string[],
): Promise<void> {
  if (!listingIds.length) return
  const rows = listingIds.map((id) => ({ user_id: userId, listing_id: id }))
  const { error } = await client
    .from('user_listing_states')
    .upsert(rows, { onConflict: 'user_id,listing_id', ignoreDuplicates: true })
  if (error) throw dbError(error)
}

export async function setListingViewed(
  client: SupabaseClient,
  userId: string,
  listingId: string,
  viewed: boolean,
): Promise<void> {
  if (viewed) {
    await markListingsViewed(client, userId, [listingId])
    return
  }
  const { error } = await client
    .from('user_listing_states')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId)
  if (error) throw dbError(error)
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(
  client: SupabaseClient,
  userId: string,
  unreadOnly = true,
): Promise<Notification[]> {
  let query = client
    .from('notifications')
    .select('*, listing:listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (unreadOnly) query = query.eq('read', false)

  const { data, error } = await query
  if (error) throw dbError(error)
  return (data ?? []) as Notification[]
}

/** True if this user was already alerted about this listing (any prior scrape). */
export async function hasNotificationForListing(
  client: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle()
  if (error) throw dbError(error)
  return !!data
}

/**
 * Insert a notification for (user, listing). No-op if one already exists
 * (unique constraint or race). Returns whether a new row was created.
 */
export async function createNotification(
  client: SupabaseClient,
  userId: string,
  listingId: string,
  telegramSent: boolean,
): Promise<boolean> {
  if (await hasNotificationForListing(client, userId, listingId)) {
    return false
  }

  const { error } = await client.from('notifications').insert({
    user_id: userId,
    listing_id: listingId,
    whatsapp_sent: telegramSent,
  })
  // 23505 = unique_violation — another worker won the race
  if (error) {
    if (error.code === '23505') return false
    throw dbError(error)
  }
  return true
}

export async function markNotificationsRead(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw dbError(error)
}

// ── Scrape runs ───────────────────────────────────────────────────────────────

export async function getLatestScrapeRun(client: SupabaseClient): Promise<ScrapeRun | null> {
  const { data } = await client
    .from('scrape_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()
  return (data as ScrapeRun) ?? null
}
