-- Migration: Add critical database indexes for performance (CORRECTED)
-- Purpose: Optimize query performance and prevent DoS via slow queries

-- ============================================
-- ORPHANS TABLE INDEXES
-- ============================================

-- Index for coordinator lookups (frequently queried)
CREATE INDEX IF NOT EXISTS idx_orphans_coordinator ON orphans(coordinator_id);

-- Index for approver lookups
CREATE INDEX IF NOT EXISTS idx_orphans_approver ON orphans(approved_by);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_orphans_approval_status ON orphans(approval_status);

-- Composite index for common queries (coordinator + status)
CREATE INDEX IF NOT EXISTS idx_orphans_coordinator_approval ON orphans(coordinator_id, approval_status);

-- Index for orphan status
CREATE INDEX IF NOT EXISTS idx_orphans_status ON orphans(status);

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

ANALYZE users;
ANALYZE orphans;

SELECT 'Indexes created successfully!' AS status;
