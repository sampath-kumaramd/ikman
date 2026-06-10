export type ListingType = 'apartment' | 'annex' | 'house'

export interface Listing {
  id: string
  ikman_id: string
  title: string
  price: number | null
  location: string | null
  area: string | null
  bedrooms: number | null
  listing_type: ListingType | null
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
  user_id: string
  listing_id: string
  whatsapp_sent: boolean // legacy column name: true when the Telegram alert was sent
  read: boolean
  created_at: string
  listing?: Listing
}

export interface SearchCriteria {
  areas: string[]
  listing_types: ListingType[]
  max_price: number
  min_bedrooms: number
  max_bedrooms: number
}

export interface UserSettings extends SearchCriteria {
  user_id: string
  notifications_enabled: boolean
  telegram_chat_id: string | null
  telegram_connect_code: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

// Shape returned by /api/settings — never exposes chat id / connect code
export interface SettingsResponse extends SearchCriteria {
  notifications_enabled: boolean
  telegram_connected: boolean
  onboarding_completed: boolean
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
