-- =============================================================================
-- Add orphan_code column to orphans (2026-05-15).
--
-- The Orphan model and several controllers (getMyOrphans, map.controller,
-- mobile UI) expected an `orphan_code` field, but the column was never
-- created. Querying it 500'd with "column orphan_code does not exist".
--
-- This migration:
--   1. Adds the column (nullable, no FK).
--   2. Backfills existing rows with ORP-{YEAR}-{padded id}, using the
--      created_at year so codes are stable across re-runs.
--   3. Adds a unique index so future inserts can't collide.
--
-- Idempotent (IF NOT EXISTS). Safe to apply against production.
-- =============================================================================

BEGIN;

ALTER TABLE orphans
  ADD COLUMN IF NOT EXISTS orphan_code VARCHAR(50);

-- Backfill: ORP-2026-0001 style. Only updates rows where the column is null,
-- so re-runs are safe and previously generated codes are preserved.
UPDATE orphans
   SET orphan_code = 'ORP-' || EXTRACT(YEAR FROM COALESCE(created_at, NOW()))::text
                            || '-' || LPAD(id::text, 4, '0')
 WHERE orphan_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orphans_orphan_code_uniq
  ON orphans (orphan_code) WHERE orphan_code IS NOT NULL;

COMMIT;
