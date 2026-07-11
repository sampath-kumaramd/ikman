-- Feedback / feature requests from signed-in users
-- Run in Supabase SQL Editor once.

CREATE TABLE IF NOT EXISTS feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  email       TEXT,
  category    TEXT        NOT NULL DEFAULT 'feature',
  -- 'feature' | 'bug' | 'question' | 'other'
  message     TEXT        NOT NULL,
  page        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback (user_id);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- No anon policies: only service role (API) can write/read.
