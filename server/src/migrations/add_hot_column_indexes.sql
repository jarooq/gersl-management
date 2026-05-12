-- ============================================================================
-- add_hot_column_indexes.sql
--
-- Adds indexes on columns we filter or join by on every page load. These are
-- the same indexes intended by add_critical_indexes.sql, but that earlier
-- file referenced quoted camelCase column names (e.g. "projectId",
-- "requestedBy") which don't exist — every model in this codebase is
-- declared with `underscored: true`, so the real columns are snake_case
-- (project_id, submitted_by, approved_by, etc.).
--
-- All statements are IF NOT EXISTS so this is idempotent. Run it once via
-- Supabase SQL Editor (or psql). No application changes are required after.
-- ============================================================================

-- --- expenses ------------------------------------------------------------
-- /api/finance/expenses filters by status; the mobile and admin views filter
-- by submitted_by; project pages aggregate by project_id; approval queues
-- look up approved_by. Composite (status, project_id) helps the
-- budget-vs-actual report.
CREATE INDEX IF NOT EXISTS idx_expenses_status        ON expenses (status);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id    ON expenses (project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by  ON expenses (submitted_by);
CREATE INDEX IF NOT EXISTS idx_expenses_approved_by   ON expenses (approved_by);
CREATE INDEX IF NOT EXISTS idx_expenses_date          ON expenses (date);
CREATE INDEX IF NOT EXISTS idx_expenses_status_proj   ON expenses (status, project_id);

-- --- visits --------------------------------------------------------------
-- visit.controller.js list endpoint scopes by user_id and project_id.
-- The visits table has no status column — visits are append-only event rows
-- (occurred_at is the relevant timeline column), so no status index here.
CREATE INDEX IF NOT EXISTS idx_visits_user_id     ON visits (user_id);
CREATE INDEX IF NOT EXISTS idx_visits_project_id  ON visits (project_id);
CREATE INDEX IF NOT EXISTS idx_visits_occurred_at ON visits (occurred_at);

-- --- users ---------------------------------------------------------------
-- /api/users list filters by status; auth lookups filter by username/email
-- (already unique-indexed but make role filters fast for getRoleEmails()).
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role);

-- --- leave_requests / salary_advances ------------------------------------
-- Mobile approval queues filter by status; user lists scope by user_id.
CREATE INDEX IF NOT EXISTS idx_leave_requests_status   ON leave_requests (status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id  ON leave_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_salary_advances_status  ON salary_advances (status);
CREATE INDEX IF NOT EXISTS idx_salary_advances_user_id ON salary_advances (user_id);

-- --- donations -----------------------------------------------------------
-- Donations page filters by payment_status and campaign_id; the new
-- id-derived receipt logic doesn't change query shape.
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations (payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id    ON donations (campaign_id);

-- --- cash_transactions ---------------------------------------------------
-- Cash book + activity-summary reports scope by cash_account_id and
-- reference_type, and filter by status.
CREATE INDEX IF NOT EXISTS idx_cash_tx_account_id     ON cash_transactions (cash_account_id);
CREATE INDEX IF NOT EXISTS idx_cash_tx_status         ON cash_transactions (status);
CREATE INDEX IF NOT EXISTS idx_cash_tx_reference      ON cash_transactions (reference_type, reference_id);

-- Refresh planner stats so the new indexes get picked up.
ANALYZE expenses;
ANALYZE visits;
ANALYZE users;
ANALYZE leave_requests;
ANALYZE salary_advances;
ANALYZE donations;
ANALYZE cash_transactions;
