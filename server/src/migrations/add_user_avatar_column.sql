-- =============================================================================
-- Add avatar_url to users (2026-05-15).
--
-- Profile photo support. Staff set their own photo from the mobile app;
-- admins can set/replace it from web User Management. Null = render initials.
-- Idempotent — safe to run repeatedly.
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000);
