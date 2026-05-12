-- ============================================================================
-- extend_staff_columns.sql
--
-- Add the HR-profile columns the Edit Staff form already collects but the
-- Staff model didn't define. Previously the form sent these fields, Sequelize
-- silently dropped them (instance.update filters to declared attributes), and
-- users saw nothing on reload. This migration plus the matching model fields
-- closes that loop.
--
-- Columns are nullable + free-form so we don't fail on existing rows.
-- Idempotent (IF NOT EXISTS).
-- ============================================================================

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS employee_id        VARCHAR(50),
  ADD COLUMN IF NOT EXISTS date_of_birth      DATE,
  ADD COLUMN IF NOT EXISTS gender             VARCHAR(20),
  ADD COLUMN IF NOT EXISTS address            TEXT,
  ADD COLUMN IF NOT EXISTS bio                TEXT,
  ADD COLUMN IF NOT EXISTS contract_type      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS work_hours         VARCHAR(50),
  ADD COLUMN IF NOT EXISTS emergency_contact  VARCHAR(200),
  ADD COLUMN IF NOT EXISTS leave_balance      INTEGER DEFAULT 21;

-- Optional uniqueness on employee_id (only when present).
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_employee_id
  ON staff (employee_id) WHERE employee_id IS NOT NULL;

ANALYZE staff;
