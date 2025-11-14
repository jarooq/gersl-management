-- SQL Script to Create All Remaining Tables in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/otgxqyoqapsqjlwafdwl/sql

-- ============================================
-- 1. ORPHANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orphans (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  gender VARCHAR(20),
  guardian_name VARCHAR(200),
  guardian_relationship VARCHAR(100),
  guardian_contact VARCHAR(50),
  address TEXT,
  province VARCHAR(100),
  district VARCHAR(100),
  ds_division VARCHAR(150),
  gn_division VARCHAR(150),
  enrollment_date DATE,
  status VARCHAR(50) DEFAULT 'Active',
  school_name VARCHAR(200),
  grade VARCHAR(20),
  health_condition TEXT,
  special_needs TEXT,
  monthly_support_amount DECIMAL(10,2),
  support_type VARCHAR(100),
  notes TEXT,
  photo_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS orphans_status_idx ON orphans(status);
CREATE INDEX IF NOT EXISTS orphans_province_idx ON orphans(province);
CREATE INDEX IF NOT EXISTS orphans_district_idx ON orphans(district);
CREATE INDEX IF NOT EXISTS orphans_ds_division_idx ON orphans(ds_division);

-- ============================================
-- 2. EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'LKR',
  payment_method VARCHAR(50),
  receipt_number VARCHAR(100),
  receipt_url VARCHAR(500),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS expenses_project_idx ON expenses(project_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);

-- ============================================
-- 3. STAFF TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(50),
  position VARCHAR(150) NOT NULL,
  department VARCHAR(100),
  hire_date DATE,
  employment_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active',
  salary DECIMAL(12,2),
  address TEXT,
  emergency_contact VARCHAR(200),
  emergency_phone VARCHAR(50),
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS staff_status_idx ON staff(status);
CREATE INDEX IF NOT EXISTS staff_department_idx ON staff(department);

-- ============================================
-- 4. CBO PARTNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cbo_partners (
  id SERIAL PRIMARY KEY,
  cbo_name VARCHAR(200) NOT NULL,
  registration_number VARCHAR(100),
  contact_person VARCHAR(150),
  contact_email VARCHAR(150),
  contact_phone VARCHAR(50),
  address TEXT,
  province VARCHAR(100),
  district VARCHAR(100),
  partnership_start_date DATE,
  partnership_status VARCHAR(50) DEFAULT 'Active',
  areas_of_focus TEXT,
  capacity_level VARCHAR(50),
  mou_signed BOOLEAN DEFAULT false,
  mou_expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cbo_partners_status_idx ON cbo_partners(partnership_status);
CREATE INDEX IF NOT EXISTS cbo_partners_province_idx ON cbo_partners(province);

-- ============================================
-- 5. PARTNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(100),
  country VARCHAR(100),
  contact_person VARCHAR(150),
  contact_email VARCHAR(150),
  contact_phone VARCHAR(50),
  website VARCHAR(300),
  partnership_start_date DATE,
  partnership_status VARCHAR(50) DEFAULT 'Active',
  focus_areas TEXT,
  funding_capacity VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS partners_status_idx ON partners(partnership_status);
CREATE INDEX IF NOT EXISTS partners_type_idx ON partners(type);

-- ============================================
-- 6. INDICATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS indicators (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  indicator_name VARCHAR(255) NOT NULL,
  indicator_type VARCHAR(100),
  baseline_value DECIMAL(15,2),
  target_value DECIMAL(15,2),
  current_value DECIMAL(15,2),
  unit VARCHAR(50),
  measurement_frequency VARCHAR(50),
  last_measured_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS indicators_project_idx ON indicators(project_id);

-- ============================================
-- 7. PROPOSALS TABLE
-- ============================================
DO $$ BEGIN
  CREATE TYPE enum_proposals_status AS ENUM('Draft', 'Under Review', 'Submitted', 'Approved', 'Rejected', 'Withdrawn');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  proposal_title VARCHAR(255) NOT NULL,
  donor_name VARCHAR(200),
  proposal_type VARCHAR(100),
  project_area VARCHAR(150),
  total_budget DECIMAL(15,2),
  requested_amount DECIMAL(15,2),
  submission_deadline DATE,
  submission_date DATE,
  status enum_proposals_status DEFAULT 'Draft',
  priority VARCHAR(50),
  narrative TEXT,
  budget_details JSONB,
  attachments JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  created_by INTEGER REFERENCES users(id),
  last_edited_by INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals(status);
CREATE INDEX IF NOT EXISTS proposals_donor_idx ON proposals(donor_name);
CREATE INDEX IF NOT EXISTS proposals_deadline_idx ON proposals(submission_deadline);

-- ============================================
-- 8. ORPHAN VISIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orphan_visit_logs (
  id SERIAL PRIMARY KEY,
  orphan_id INTEGER REFERENCES orphans(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_type VARCHAR(100),
  conducted_by VARCHAR(200),
  staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  location VARCHAR(255),
  duration_minutes INTEGER,
  purpose TEXT,
  findings TEXT,
  recommendations TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS orphan_visit_logs_orphan_idx ON orphan_visit_logs(orphan_id);
CREATE INDEX IF NOT EXISTS orphan_visit_logs_date_idx ON orphan_visit_logs(visit_date);

-- ============================================
-- 9. ORPHAN PROGRESS RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orphan_progress_ratings (
  id SERIAL PRIMARY KEY,
  orphan_id INTEGER REFERENCES orphans(id) ON DELETE CASCADE,
  visit_log_id INTEGER REFERENCES orphan_visit_logs(id) ON DELETE CASCADE,
  rating_date DATE NOT NULL,
  health_rating INTEGER CHECK (health_rating BETWEEN 1 AND 5),
  education_rating INTEGER CHECK (education_rating BETWEEN 1 AND 5),
  social_behavior_rating INTEGER CHECK (social_behavior_rating BETWEEN 1 AND 5),
  family_situation_rating INTEGER CHECK (family_situation_rating BETWEEN 1 AND 5),
  overall_wellbeing_rating INTEGER CHECK (overall_wellbeing_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS orphan_progress_ratings_orphan_idx ON orphan_progress_ratings(orphan_id);
CREATE INDEX IF NOT EXISTS orphan_progress_ratings_visit_idx ON orphan_progress_ratings(visit_log_id);

-- ============================================
-- 10. GENERATED ORPHAN REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS generated_orphan_reports (
  id SERIAL PRIMARY KEY,
  orphan_id INTEGER REFERENCES orphans(id) ON DELETE CASCADE,
  report_type VARCHAR(100) NOT NULL,
  report_title VARCHAR(255),
  reporting_period VARCHAR(150),
  generated_content TEXT,
  sections JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  generated_by INTEGER REFERENCES users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS generated_orphan_reports_orphan_idx ON generated_orphan_reports(orphan_id);
CREATE INDEX IF NOT EXISTS generated_orphan_reports_type_idx ON generated_orphan_reports(report_type);

-- ============================================
-- GRANT PERMISSIONS (if needed)
-- ============================================
-- Grant all privileges to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify all tables are created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
