import { SupabaseClient } from '@supabase/supabase-js'
import type { AppSettings, Listing, ListingFilters, Notification } from './types'

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(client: SupabaseClient): Promise<AppSettings> {
  const { data, error } = await client.from('settings').select('key, value')
  if (error) throw error

  const map = Object.fromEntries(data.map((r: { key: string; value: unknown }) => [r.key, r.value]))
  return {
    areas:                    (map.areas                   as string[])  ?? ['Moratuwa', 'Ratmalana', 'Mount Lavinia', 'Dehiwala'],
    listing_types:            (map.listing_types           as AppSettings['listing_types']) ?? ['apartment', 'annex', 'house'],
    max_price:                Number(map.max_price)        || 75000,
    min_bedrooms:             Number(map.min_bedrooms)     || 1,
    max_bedrooms:             Number(map.max_bedrooms)     || 2,
    scrape_interval_minutes:  Number(map.scrape_interval_minutes) || 30,
    whatsapp_number:          (map.whatsapp_number         as string)    ?? '',
    notifications_enabled:    Boolean(map.notifications_enabled ?? true),
  }
}

export async function updateSetting(
  client: SupabaseClient,
  key: string,
  value: unknown,
): Promise<void> {
  const { error } = await client
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ── Listings ──────────────────────────────────────────────────────────────────

export async function getListings(
  client: SupabaseClient,
  filters: ListingFilters = {},
): Promise<{ listings: Listing[]; total: number }> {
  const {
    area, listing_type, min_price, max_price,
    min_bedrooms, max_bedrooms, is_new,
    sort = 'date_desc', page = 1, limit = 20,
  } = filters

  let query = client.from('listings').select('*', { count: 'exact' })

  if (area)          query = query.eq('area', area)
  if (listing_type)  query = query.eq('listing_type', listing_type)
  if (min_price)     query = query.gte('price', min_price)
  if (max_price)     query = query.lte('price', max_price)
  if (min_bedrooms)  query = query.gte('bedrooms', min_bedrooms)
  if (max_bedrooms)  query = query.lte('bedrooms', max_bedrooms)
  if (is_new !== undefined) query = query.eq('is_new', is_new)

  const orderMap: Record<string, { column: string; ascending: boolean }> = {
    price_asc:  { column: 'price',      ascending: true  },
    price_desc: { column: 'price',      ascending: false },
    date_desc:  { column: 'created_at', ascending: false },
    date_asc:   { column: 'created_at', ascending: true  },
  }
  const { column, ascending } = orderMap[sort]
  query = query.order(column, { ascending })

  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query
  if (error) throw error

  return { listings: (data ?? []) as Listing[], total: count ?? 0 }
}

export async function upsertListings(
  client: SupabaseClient,
  listings: Omit<Listing, 'id' | 'created_at'>[],
): Promise<Listing[]> {
  const { data, error } = await client
    .from('listings')
    .upsert(listings, { onConflict: 'ikman_id', ignoreDuplicates: false })
    .select()
  if (error) throw error
  return (data ?? []) as Listing[]
}

export async function markListingsRead(client: SupabaseClient, ids: string[]): Promise<void> {
  if (!ids.length) return
  const { error } = await client
    .from('listings')
    .update({ is_new: false })
    .in('id', ids)
  if (error) throw error
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(
  client: SupabaseClient,
  unreadOnly = true,
): Promise<Notification[]> {
  let query = client
    .from('notifications')
    .select('*, listing:listings(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (unreadOnly) query = query.eq('read', false)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function createNotification(
  client: SupabaseClient,
  listingId: string,
  whatsappSent: boolean,
): Promise<void> {
  const { error } = await client.from('notifications').insert({
    listing_id: listingId,
    whatsapp_sent: whatsappSent,
  })
  if (error) throw error
}

export async function markNotificationsRead(client: SupabaseClient): Promise<void> {
  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
  if (error) throw error
}

export async function getExistingIkmanIds(client: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await client.from('listings').select('ikman_id')
  if (error) throw error
  return new Set((data ?? []).map((r: { ikman_id: string }) => r.ikman_id))
}
