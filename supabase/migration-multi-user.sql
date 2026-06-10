-- ============================================================
-- Multi-user migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (for existing databases created from the original schema.sql)
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

-- Notifications become per-user
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, read);

-- Rows from the single-user era have no owner — remove them
DELETE FROM notifications WHERE user_id IS NULL;

-- Per-user viewed state for listings (replaces the global listings.is_new flag)
CREATE TABLE IF NOT EXISTS user_listing_states (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID        NOT NULL REFERENCES listings(id)   ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- Scrape runs table (in case it was never created on this database)
CREATE TABLE IF NOT EXISTS scrape_runs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  status       TEXT,
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

DROP POLICY IF EXISTS user_settings_own       ON user_settings;
DROP POLICY IF EXISTS user_listing_states_own ON user_listing_states;
DROP POLICY IF EXISTS notifications_own       ON notifications;
DROP POLICY IF EXISTS listings_read           ON listings;
DROP POLICY IF EXISTS scrape_runs_read        ON scrape_runs;

CREATE POLICY user_settings_own       ON user_settings       FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY user_listing_states_own ON user_listing_states FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY notifications_own       ON notifications       FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY listings_read           ON listings            FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY scrape_runs_read        ON scrape_runs         FOR SELECT USING (auth.role() = 'authenticated');

-- The old global key/value settings table is no longer used by the app.
-- It is intentionally left in place; drop it manually once you're confident:
--   DROP TABLE settings;
