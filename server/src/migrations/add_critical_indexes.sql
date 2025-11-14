-- Migration: Add critical database indexes for performance
-- Purpose: Optimize query performance and prevent DoS via slow queries

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_users_reporting_to ON users("reportingTo");

-- ============================================
-- ORPHANS TABLE INDEXES
-- ============================================

-- Index for coordinator lookups (frequently queried)
CREATE INDEX IF NOT EXISTS idx_orphans_coordinator ON orphans("coordinatorId");

-- Index for approver lookups
CREATE INDEX IF NOT EXISTS idx_orphans_approver ON orphans("approverId");

-- Index for district searches
CREATE INDEX IF NOT EXISTS idx_orphans_district ON orphans(district);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_orphans_status ON orphans("approvalStatus");

-- Index for project assignment
CREATE INDEX IF NOT EXISTS idx_orphans_project ON orphans("projectId");

-- Composite index for common queries (coordinator + status)
CREATE INDEX IF NOT EXISTS idx_orphans_coordinator_status ON orphans("coordinatorId", "approvalStatus");

-- ============================================
-- PROJECTS TABLE INDEXES
-- ============================================

-- Index for status filtering (very common)
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Index for dates (reporting and filtering)
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects("startDate");
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects("endDate");

-- Index for manager lookups
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects("projectManager");

-- ============================================
-- EXPENSES TABLE INDEXES
-- ============================================

-- Index for status filtering (approval workflow)
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- Index for project association
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses("projectId");

-- Index for date filtering (financial reports)
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses("expenseDate");

-- Index for requester lookups
CREATE INDEX IF NOT EXISTS idx_expenses_requester ON expenses("requestedBy");

-- Composite index for approval workflow queries
CREATE INDEX IF NOT EXISTS idx_expenses_status_project ON expenses(status, "projectId");

-- ============================================
-- STAFF TABLE INDEXES
-- ============================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- Index for department filtering
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);

-- Index for supervisor lookups
CREATE INDEX IF NOT EXISTS idx_staff_supervisor ON staff("supervisorId");

-- ============================================
-- CBO PARTNERS TABLE INDEXES
-- ============================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_cbo_partners_status ON cbo_partners(status);

-- Index for district (geographical queries)
CREATE INDEX IF NOT EXISTS idx_cbo_partners_district ON cbo_partners(district);

-- ============================================
-- PARTNERS TABLE INDEXES
-- ============================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

-- Index for partner type filtering
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners("partnerType");

-- ============================================
-- INDICATORS TABLE INDEXES
-- ============================================

-- Index for project association
CREATE INDEX IF NOT EXISTS idx_indicators_project ON indicators("projectId");

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_indicators_status ON indicators(status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_indicators_project_status ON indicators("projectId", status);

-- ============================================
-- ORPHAN NEEDS TABLE INDEXES (if table exists)
-- ============================================

-- Index for orphan association
CREATE INDEX IF NOT EXISTS idx_orphan_needs_orphan ON orphan_needs("orphanId");

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_orphan_needs_status ON orphan_needs(status);

-- Index for urgency filtering
CREATE INDEX IF NOT EXISTS idx_orphan_needs_urgency ON orphan_needs(urgency);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_orphan_needs_category ON orphan_needs("needCategory");

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_orphan_needs_status_urgency ON orphan_needs(status, urgency);

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

ANALYZE users;
ANALYZE orphans;
ANALYZE projects;
ANALYZE expenses;
ANALYZE staff;
ANALYZE cbo_partners;
ANALYZE partners;
ANALYZE indicators;
