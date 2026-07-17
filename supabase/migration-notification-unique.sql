-- ============================================================
-- One notification (and thus one Telegram alert) per user+listing.
-- Run in Supabase SQL Editor if you already have a live database.
-- ============================================================

-- Drop duplicate rows, keeping the earliest notification per pair
DELETE FROM notifications a
USING notifications b
WHERE a.user_id = b.user_id
  AND a.listing_id = b.listing_id
  AND a.created_at > b.created_at;

-- Also drop exact ties on created_at by keeping lowest id
DELETE FROM notifications a
USING notifications b
WHERE a.user_id = b.user_id
  AND a.listing_id = b.listing_id
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_listing_uidx
  ON notifications (user_id, listing_id);
