-- ============================================================
-- ikman.lk scraper – Supabase schema (multi-user)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- For upgrading an older single-user database, run
-- migration-multi-user.sql instead.
-- ============================================================

-- Per-user settings: search criteria + Telegram link + onboarding state
CREATE TABLE IF NOT EXISTS user_settings (
  user_id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  areas                 TEXT[]      NOT NULL DEFAULT '{}',
  listing_types         TEXT[]      NOT NULL DEFAULT '{apartment,annex,house}',
  max_price             INTEGER     NOT NULL DEFAULT 75000,
  min_bedrooms          INTEGER     NOT NULL DEFAULT 1,
  max_bedrooms          INTEGER     NOT NULL DEFAULT 2,
  notifications_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
  telegram_chat_id      TEXT,
  telegram_connect_code TEXT        UNIQUE,
  onboarding_completed  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_settings_connect_code_idx ON user_settings (telegram_connect_code);
CREATE INDEX IF NOT EXISTS user_settings_chat_id_idx      ON user_settings (telegram_chat_id);

-- Listings scraped from ikman.lk (shared pool across all users)
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
  is_new       BOOLEAN    DEFAULT TRUE,  -- legacy global flag; per-user state lives in user_listing_states
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listings_area_idx       ON listings (area);
CREATE INDEX IF NOT EXISTS listings_price_idx      ON listings (price);
CREATE INDEX IF NOT EXISTS listings_created_at_idx ON listings (created_at DESC);

-- Per-user viewed state for listings
CREATE TABLE IF NOT EXISTS user_listing_states (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID        NOT NULL REFERENCES listings(id)   ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- Notifications: one row per (user, new matching listing)
CREATE TABLE IF NOT EXISTS notifications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id     UUID        REFERENCES listings(id)   ON DELETE CASCADE,
  whatsapp_sent  BOOLEAN     DEFAULT FALSE,  -- legacy name: true when the Telegram alert was sent
  read           BOOLEAN     DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, read);

-- Scrape runs: status tracking for the dashboard banner (global)
CREATE TABLE IF NOT EXISTS scrape_runs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  status       TEXT,        -- 'running' | 'done' | 'failed'
  current_step TEXT,
  steps_log    JSONB       DEFAULT '[]',
  new_count    INTEGER     DEFAULT 0,
  total_count  INTEGER     DEFAULT 0,
  error        TEXT,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  finished_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS scrape_runs_started_at_idx ON scrape_runs (started_at DESC);

-- Row Level Security: the app talks to the DB through API routes using the
-- service role key (which bypasses RLS); these policies lock down the anon key.
ALTER TABLE user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_listing_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_runs         ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_own       ON user_settings       FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY user_listing_states_own ON user_listing_states FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY notifications_own       ON notifications       FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY listings_read           ON listings            FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY scrape_runs_read        ON scrape_runs         FOR SELECT USING (auth.role() = 'authenticated');
