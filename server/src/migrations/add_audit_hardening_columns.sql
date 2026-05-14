-- =============================================================================
-- Audit hardening migration (2026-05-14).
--
-- Adds the schema pieces required by the audit-driven controller changes:
--   * proposals: budget_currency, committed_quantity, approval/rejection trail,
--                deleted_at (paranoid soft delete), converted_order_id index.
--   * orphans:   deleted_at (paranoid soft delete).
--   * wash_orders / igp_orders: completed_at timestamp for auto-completion.
--
-- All statements use IF NOT EXISTS / OR REPLACE so it can be run repeatedly
-- without harm. Safe to apply against production via the same SQL runner
-- the team uses for the other migration files in this directory.
-- =============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- proposals: currency, committed_quantity, approval/rejection trail, deleted_at
-- --------------------------------------------------------------------------
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS budget_currency      VARCHAR(3)  DEFAULT 'LKR' NOT NULL;
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS committed_quantity   INTEGER     DEFAULT 0     NOT NULL;
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS approved_by          INTEGER     REFERENCES users(id);
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS approval_date        TIMESTAMPTZ;
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS rejected_by          INTEGER     REFERENCES users(id);
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS rejection_date       TIMESTAMPTZ;
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS deleted_at           TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS proposals_converted_order_id_idx
  ON proposals (converted_order_id);
CREATE INDEX IF NOT EXISTS proposals_deleted_at_idx
  ON proposals (deleted_at) WHERE deleted_at IS NULL;

-- --------------------------------------------------------------------------
-- orphans: deleted_at (paranoid soft delete)
-- --------------------------------------------------------------------------
ALTER TABLE orphans
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS orphans_deleted_at_idx
  ON orphans (deleted_at) WHERE deleted_at IS NULL;

-- --------------------------------------------------------------------------
-- wash_orders / igp_orders: completed_at (set by auto-complete trigger in
-- transitionStage when all items reach Reported/Cancelled)
-- --------------------------------------------------------------------------
ALTER TABLE wash_orders
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE igp_orders
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMIT;
