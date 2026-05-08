-- ============================================================================
-- add_visits_orphan_columns.sql
--
-- Adds the orphan_id (FK → orphans.id) and visit_type columns to the visits
-- table that were defined on the Sequelize Visit model when the orphan-visit
-- unification feature was added, but were never applied to the database.
--
-- WHY: the model defines these columns, so every default Visit.findAll/findByPk
-- selects them — and PostgreSQL responds with `column visits.orphan_id does
-- not exist`, returning HTTP 500 on /api/visits and any related list endpoints.
--
-- Until this migration runs, visit.controller.js explicitly excludes these
-- columns to keep the endpoints alive. Once you've applied this script (Supabase
-- SQL editor → New query → paste → Run), drop the SAFE_VISIT_ATTRIBUTES exclude
-- in src/controllers/visit.controller.js so mobile-logged orphan visits start
-- showing in the orphan dossier again.
--
-- Idempotent: safe to run on a database that already has the columns.
-- ============================================================================

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS orphan_id INTEGER
    REFERENCES orphans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visit_type VARCHAR(20) DEFAULT 'general';

CREATE INDEX IF NOT EXISTS visits_orphan_id_idx ON visits(orphan_id);
