-- ============================================================
-- ikman.lk scraper – Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Settings: key/value store for all configurable options
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB        NOT NULL,
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('areas',       '["Moratuwa","Ratmalana","Mount Lavinia","Dehiwala"]'),
  ('listing_types','["apartment","annex","house"]'),
  ('max_price',   '75000'),
  ('min_bedrooms','1'),
  ('max_bedrooms','2'),
  ('scrape_interval_minutes', '30'),
  ('whatsapp_number', '"+94760937443"'),
  ('notifications_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Listings scraped from ikman.lk
CREATE TABLE IF NOT EXISTS listings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ikman_id     TEXT        UNIQUE NOT NULL,
  title        TEXT,
  price        INTEGER,
  location     TEXT,
  area         TEXT,
  bedrooms     INTEGER,
  listing_type TEXT,          -- 'apartment' | 'annex' | 'house'
  description  TEXT,
  photos       TEXT[]     DEFAULT '{}',
  contact      TEXT,
  posted_at    TIMESTAMPTZ,
  url          TEXT,
  is_new       BOOLEAN    DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listings_area_idx       ON listings (area);
CREATE INDEX IF NOT EXISTS listings_price_idx      ON listings (price);
CREATE INDEX IF NOT EXISTS listings_is_new_idx     ON listings (is_new);
CREATE INDEX IF NOT EXISTS listings_created_at_idx ON listings (created_at DESC);

-- Notifications: one row per new listing found
CREATE TABLE IF NOT EXISTS notifications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     UUID        REFERENCES listings(id) ON DELETE CASCADE,
  whatsapp_sent  BOOLEAN     DEFAULT FALSE,
  read           BOOLEAN     DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications (read);
