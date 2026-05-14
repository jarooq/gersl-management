-- ============================================================================
-- add_programme_composite_indexes.sql
--
-- Composite indexes for hot WASH/IGP queries that scan by (stage AND deadline):
--   - The daily deadline-reminder cron filters items where
--       stage NOT IN terminal AND planned_completion <= today+7
--     which without a composite index goes wide-then-narrow.
--   - The "My items" mobile endpoint sorts by planned_completion within a
--     supervisor's open items — also benefits from this index.
--
-- Idempotent (CREATE INDEX IF NOT EXISTS).
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wash_items_stage_deadline
  ON wash_items (stage, planned_completion);

CREATE INDEX IF NOT EXISTS idx_igp_items_stage_deadline
  ON igp_items (stage, planned_completion);

ANALYZE wash_items;
ANALYZE igp_items;
