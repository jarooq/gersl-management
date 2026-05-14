-- ============================================================================
-- add_fuel_claim_fraud_flags.sql
--
-- Adds fraud-detection columns to fuel_claims. Auto-populated on submit by
-- the new validation in fuelClaim.controller.js — hard-block conditions
-- throw and never reach this column; soft-flag conditions land here for HR
-- review.
--
-- flag_reasons is a JSONB array of objects, e.g.
--   [
--     { "kind": "route_overlap_other_user",
--       "otherClaimId": 42, "otherUserName": "Jane",
--       "overlapPct": 92 },
--     { "kind": "not_primary_rider",
--       "vehiclePlateNo": "KE-1234", "primaryRiderId": 7 }
--   ]
--
-- Idempotent (IF NOT EXISTS).
-- ============================================================================

ALTER TABLE fuel_claims
  ADD COLUMN IF NOT EXISTS flag_reasons  JSONB,
  ADD COLUMN IF NOT EXISTS flagged_at    TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reviewed_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_notes  TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at   TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_fuel_claims_flagged_at
  ON fuel_claims (flagged_at) WHERE flagged_at IS NOT NULL;

ANALYZE fuel_claims;
