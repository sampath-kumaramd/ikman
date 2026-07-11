-- ============================================================
-- Clerk auth migration
-- user_id was UUID → auth.users; Clerk ids are strings like user_xxx.
-- Run in Supabase SQL Editor once before using Clerk in production.
-- ============================================================

-- 1) Drop policies that reference user_id (blocks ALTER TYPE otherwise)
DROP POLICY IF EXISTS user_settings_own       ON user_settings;
DROP POLICY IF EXISTS user_listing_states_own ON user_listing_states;
DROP POLICY IF EXISTS notifications_own       ON notifications;
DROP POLICY IF EXISTS listings_read           ON listings;
DROP POLICY IF EXISTS scrape_runs_read        ON scrape_runs;

-- 2) Drop FKs to auth.users (no longer used for app identity)
ALTER TABLE IF EXISTS user_settings
  DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

ALTER TABLE IF EXISTS notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE IF EXISTS user_listing_states
  DROP CONSTRAINT IF EXISTS user_listing_states_user_id_fkey;

-- Optional: clear rows that used Supabase Auth UUIDs (new Clerk users get fresh ids)
-- Uncomment if you want a clean slate:
-- TRUNCATE user_listing_states, notifications, user_settings;

-- 3) Convert user_id columns to TEXT for Clerk ids
ALTER TABLE user_settings
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE notifications
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE user_listing_states
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4) Keep RLS enabled; no permissive policies for anon/authenticated.
--    The app uses the service role key from API routes (bypasses RLS).
--    Without policies, the anon key cannot read/write these tables.
ALTER TABLE user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_listing_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_runs         ENABLE ROW LEVEL SECURITY;
