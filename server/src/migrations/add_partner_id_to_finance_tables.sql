-- ============================================================================
-- add_partner_id_to_finance_tables.sql
--
-- Closes the partner-wise finance reporting gap. Today `projects.donor`,
-- `expenses.*`, and `bills.*` only carry the donor name as a free-text
-- string, which means finance can't reliably aggregate spending by partner
-- without fragile string matching (typos, case, renames all break it).
--
-- Adds a real foreign key on each table, backfills from the existing donor
-- strings by matching against partners.name, and leaves the original
-- string columns intact for display continuity.
--
-- Idempotent: IF NOT EXISTS guards on the ALTERs + indexes; backfill uses
-- WHERE NULL so re-runs only touch rows that haven't been linked yet.
-- ============================================================================

-- --- Add partner_id columns ------------------------------------------------
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;

-- --- Indexes ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_partner_id ON projects (partner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_partner_id ON expenses (partner_id);
CREATE INDEX IF NOT EXISTS idx_bills_partner_id    ON bills    (partner_id);

-- --- Backfill Project.partner_id from Project.donor (string match) --------
-- Case-insensitive, trimmed match. Skip rows already linked. This is a
-- one-off catch-up; new rows should set partner_id directly via the API.
UPDATE projects p
   SET partner_id = pt.id
  FROM partners pt
 WHERE p.partner_id IS NULL
   AND p.donor      IS NOT NULL
   AND lower(trim(p.donor)) = lower(trim(pt.name));

-- --- Backfill Expense.partner_id from its Project ------------------------
-- After Project is linked, expenses inherit through their project. Future
-- expenses get this on insert via the application-layer hook (see
-- meExpense.controller.js / finance.controller.js after this migration).
UPDATE expenses e
   SET partner_id = p.partner_id
  FROM projects p
 WHERE e.partner_id IS NULL
   AND e.project_id = p.id
   AND p.partner_id IS NOT NULL;

-- --- Backfill Bill.partner_id from its Project ---------------------------
UPDATE bills b
   SET partner_id = p.partner_id
  FROM projects p
 WHERE b.partner_id IS NULL
   AND b.project_id = p.id
   AND p.partner_id IS NOT NULL;

ANALYZE projects;
ANALYZE expenses;
ANALYZE bills;
