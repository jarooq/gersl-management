-- ============================================================================
-- add_movement_deviation_flags.sql
--
-- Adds anti-abuse columns to movement_log so the daily analyzer can flag
-- trips that look like personal use:
--   - extended stops within the movement window (> 30 min in one ~200m
--     spot, not at origin/destination)
--   - detour ratio (actual GPS path length / first-to-last straight-line
--     distance) above 1.5
--   - planned vs actual distance mismatch (actual > planned × 1.5)
--
-- Supervisor disposition via review_status / review_notes / reviewed_by.
--
-- Idempotent (IF NOT EXISTS everywhere).
-- ============================================================================

ALTER TABLE movement_log
  ADD COLUMN IF NOT EXISTS deviation_pct      DECIMAL(6, 2),
  ADD COLUMN IF NOT EXISTS extended_stops     JSONB,
  ADD COLUMN IF NOT EXISTS actual_distance_km DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS analyzed_at        TIMESTAMP,
  ADD COLUMN IF NOT EXISTS flag_reasons       JSONB,
  ADD COLUMN IF NOT EXISTS flagged_at         TIMESTAMP,
  ADD COLUMN IF NOT EXISTS review_status      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS reviewed_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_notes       TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at        TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_movement_log_flagged
  ON movement_log (flagged_at) WHERE flagged_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movement_log_review_status
  ON movement_log (review_status) WHERE review_status IS NOT NULL;

ANALYZE movement_log;
