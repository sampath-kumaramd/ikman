export interface Listing {
  id: string
  ikman_id: string
  title: string
  price: number | null
  location: string | null
  area: string | null
  bedrooms: number | null
  listing_type: 'apartment' | 'annex' | 'house' | null
  description: string | null
  photos: string[]
  contact: string | null
  posted_at: string | null
  url: string
  is_new: boolean
  created_at: string
}

export interface Notification {
  id: string
  listing_id: string
  whatsapp_sent: boolean
  read: boolean
  created_at: string
  listing?: Listing
}

export interface AppSettings {
  areas: string[]
  listing_types: ('apartment' | 'annex' | 'house')[]
  max_price: number
  min_bedrooms: number
  max_bedrooms: number
  scrape_interval_minutes: number
  whatsapp_number: string
  notifications_enabled: boolean
}

export interface ScrapeRun {
  id:           string
  status:       'running' | 'done' | 'failed'
  current_step: string | null
  steps_log:    string[]
  new_count:    number
  total_count:  number
  error:        string | null
  started_at:   string
  finished_at:  string | null
}

export interface ListingFilters {
  area?: string
  listing_type?: string
  min_price?: number
  max_price?: number
  min_bedrooms?: number
  max_bedrooms?: number
  is_new?: boolean
  sort?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc'
  page?: number
  limit?: number
}
