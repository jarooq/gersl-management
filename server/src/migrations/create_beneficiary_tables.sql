-- ============================================================================
-- BENEFICIARY MANAGEMENT SYSTEM - Database Schema
-- ============================================================================
-- Purpose: Universal beneficiary database to track all beneficiaries across
--          all projects and departments, with NIC-based unique identification,
--          duplicate detection, and comprehensive support history tracking.
-- ============================================================================

-- ======================
-- 1. BENEFICIARIES TABLE
-- ======================
CREATE TABLE IF NOT EXISTS beneficiaries (
  id SERIAL PRIMARY KEY,

  -- Personal Information
  nic VARCHAR(20) UNIQUE NOT NULL,  -- National Identity Card - unique identifier
  full_name VARCHAR(255) NOT NULL,
  name_with_initials VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(20),

  -- Contact Information
  primary_phone VARCHAR(20),
  secondary_phone VARCHAR(20),
  email VARCHAR(255),

  -- Location Information
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  district VARCHAR(100),
  division VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(10),

  -- GPS Coordinates (Optional)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Household Information
  household_size INTEGER,
  number_of_children INTEGER,
  household_head_name VARCHAR(255),
  household_head_relation VARCHAR(100),

  -- Socio-Economic Information
  income_level VARCHAR(50),
  employment_status VARCHAR(100),
  education_level VARCHAR(100),

  -- Vulnerability Information
  is_vulnerable BOOLEAN DEFAULT false,
  vulnerability_type VARCHAR(100),  -- Single Parent, Disabled, Elderly, etc.
  disability_details TEXT,
  special_needs TEXT,

  -- Additional Information
  notes TEXT,
  profile_photo VARCHAR(500),

  -- Metadata
  registered_by INTEGER NOT NULL REFERENCES users(id),
  registered_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =================================
-- 2. BENEFICIARY SUPPORT HISTORY
-- =================================
CREATE TABLE IF NOT EXISTS beneficiary_support (
  id SERIAL PRIMARY KEY,

  -- Beneficiary Link
  beneficiary_id INTEGER NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,

  -- Project/Department Link
  project_id INTEGER REFERENCES projects(id),
  department VARCHAR(100),  -- Orphan Care, WASH, Health, Education, etc.

  -- Support Details
  support_type VARCHAR(100) NOT NULL,  -- Financial, Material, Training, Infrastructure, etc.
  support_category VARCHAR(100),       -- Water, Sanitation, Food, Medical, Educational, etc.
  support_description TEXT NOT NULL,

  -- Quantity and Value
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(50),                    -- Units, Families, Individuals, etc.
  estimated_value DECIMAL(12,2),
  actual_value DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'LKR',

  -- Dates
  support_date DATE NOT NULL,
  support_start_date DATE,
  support_end_date DATE,

  -- Donor/Partner Information
  partner_id INTEGER REFERENCES partners(id),
  donor_name VARCHAR(255),
  funding_source VARCHAR(255),

  -- Location (where support was provided)
  support_location VARCHAR(255),
  support_district VARCHAR(100),
  support_division VARCHAR(100),

  -- Status and Tracking
  status VARCHAR(50) DEFAULT 'Planned',  -- Planned, In Progress, Completed, Cancelled
  completion_percentage INTEGER DEFAULT 0,

  -- Impact and Feedback
  impact_notes TEXT,
  beneficiary_feedback TEXT,
  satisfaction_rating INTEGER,  -- 1-5 scale

  -- Documentation
  documentation_url VARCHAR(500),
  photos JSON,                  -- Array of photo URLs

  -- Additional Information
  notes TEXT,

  -- Metadata
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  verified_by INTEGER REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 3. BENEFICIARY DOCUMENTS
-- ====================================
CREATE TABLE IF NOT EXISTS beneficiary_documents (
  id SERIAL PRIMARY KEY,
  beneficiary_id INTEGER NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,

  document_type VARCHAR(100) NOT NULL,  -- NIC Copy, Birth Certificate, Income Certificate, etc.
  document_name VARCHAR(255) NOT NULL,
  document_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),

  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 4. CREATE ENUM TYPES
-- ====================================
DO $$ BEGIN
  CREATE TYPE enum_beneficiaries_gender AS ENUM('Male', 'Female', 'Other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_beneficiaries_income_level AS ENUM('Below Poverty Line', 'Low Income', 'Middle Income', 'High Income');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_beneficiary_support_status AS ENUM('Planned', 'In Progress', 'Completed', 'Cancelled', 'On Hold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_beneficiary_support_type AS ENUM(
    'Financial', 'Material', 'Training', 'Infrastructure',
    'Health Services', 'Educational Support', 'Food Assistance',
    'Water & Sanitation', 'Livelihood Support', 'Emergency Relief', 'Other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ====================================
-- 5. ALTER COLUMNS TO USE ENUM TYPES (Safe - handles NULL values)
-- ====================================
ALTER TABLE beneficiaries
  ALTER COLUMN gender TYPE enum_beneficiaries_gender USING CASE WHEN gender IS NOT NULL THEN gender::enum_beneficiaries_gender ELSE NULL END,
  ALTER COLUMN income_level TYPE enum_beneficiaries_income_level USING CASE WHEN income_level IS NOT NULL THEN income_level::enum_beneficiaries_income_level ELSE NULL END;

ALTER TABLE beneficiary_support
  ALTER COLUMN support_type TYPE enum_beneficiary_support_type USING support_type::enum_beneficiary_support_type;

-- Fix default value for status after ENUM type is set
ALTER TABLE beneficiary_support ALTER COLUMN status DROP DEFAULT;
ALTER TABLE beneficiary_support
  ALTER COLUMN status TYPE enum_beneficiary_support_status USING status::enum_beneficiary_support_status;
ALTER TABLE beneficiary_support ALTER COLUMN status SET DEFAULT 'Planned'::enum_beneficiary_support_status;

-- ====================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ====================================

-- Beneficiaries indexes
CREATE INDEX IF NOT EXISTS beneficiaries_nic_idx ON beneficiaries(nic);
CREATE INDEX IF NOT EXISTS beneficiaries_full_name_idx ON beneficiaries(full_name);
CREATE INDEX IF NOT EXISTS beneficiaries_district_idx ON beneficiaries(district);
CREATE INDEX IF NOT EXISTS beneficiaries_division_idx ON beneficiaries(division);
CREATE INDEX IF NOT EXISTS beneficiaries_is_active_idx ON beneficiaries(is_active);
CREATE INDEX IF NOT EXISTS beneficiaries_registered_by_idx ON beneficiaries(registered_by);
CREATE INDEX IF NOT EXISTS beneficiaries_registered_date_idx ON beneficiaries(registered_date);
CREATE INDEX IF NOT EXISTS beneficiaries_is_vulnerable_idx ON beneficiaries(is_vulnerable);
CREATE INDEX IF NOT EXISTS beneficiaries_primary_phone_idx ON beneficiaries(primary_phone);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS beneficiaries_district_division_idx ON beneficiaries(district, division);
CREATE INDEX IF NOT EXISTS beneficiaries_is_active_district_idx ON beneficiaries(is_active, district);

-- Beneficiary Support indexes
CREATE INDEX IF NOT EXISTS beneficiary_support_beneficiary_id_idx ON beneficiary_support(beneficiary_id);
CREATE INDEX IF NOT EXISTS beneficiary_support_project_id_idx ON beneficiary_support(project_id);
CREATE INDEX IF NOT EXISTS beneficiary_support_partner_id_idx ON beneficiary_support(partner_id);
CREATE INDEX IF NOT EXISTS beneficiary_support_department_idx ON beneficiary_support(department);
CREATE INDEX IF NOT EXISTS beneficiary_support_support_type_idx ON beneficiary_support(support_type);
CREATE INDEX IF NOT EXISTS beneficiary_support_support_category_idx ON beneficiary_support(support_category);
CREATE INDEX IF NOT EXISTS beneficiary_support_status_idx ON beneficiary_support(status);
CREATE INDEX IF NOT EXISTS beneficiary_support_support_date_idx ON beneficiary_support(support_date);
CREATE INDEX IF NOT EXISTS beneficiary_support_support_district_idx ON beneficiary_support(support_district);
CREATE INDEX IF NOT EXISTS beneficiary_support_support_division_idx ON beneficiary_support(support_division);
CREATE INDEX IF NOT EXISTS beneficiary_support_recorded_by_idx ON beneficiary_support(recorded_by);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS beneficiary_support_beneficiary_date_idx ON beneficiary_support(beneficiary_id, support_date DESC);
CREATE INDEX IF NOT EXISTS beneficiary_support_project_date_idx ON beneficiary_support(project_id, support_date DESC);
CREATE INDEX IF NOT EXISTS beneficiary_support_district_date_idx ON beneficiary_support(support_district, support_date DESC);
CREATE INDEX IF NOT EXISTS beneficiary_support_status_date_idx ON beneficiary_support(status, support_date DESC);

-- Beneficiary Documents indexes
CREATE INDEX IF NOT EXISTS beneficiary_documents_beneficiary_id_idx ON beneficiary_documents(beneficiary_id);
CREATE INDEX IF NOT EXISTS beneficiary_documents_document_type_idx ON beneficiary_documents(document_type);
CREATE INDEX IF NOT EXISTS beneficiary_documents_uploaded_by_idx ON beneficiary_documents(uploaded_by);

-- ====================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- ====================================

-- Beneficiaries table comments
COMMENT ON TABLE beneficiaries IS 'Universal beneficiary database tracking all beneficiaries across all projects and departments';
COMMENT ON COLUMN beneficiaries.nic IS 'National Identity Card number - unique identifier for duplicate detection';
COMMENT ON COLUMN beneficiaries.full_name IS 'Full name of the beneficiary';
COMMENT ON COLUMN beneficiaries.district IS 'Administrative district where beneficiary resides';
COMMENT ON COLUMN beneficiaries.division IS 'Administrative division/GN division where beneficiary resides';
COMMENT ON COLUMN beneficiaries.latitude IS 'GPS latitude coordinate (optional)';
COMMENT ON COLUMN beneficiaries.longitude IS 'GPS longitude coordinate (optional)';
COMMENT ON COLUMN beneficiaries.is_vulnerable IS 'Flag indicating if beneficiary is in vulnerable category';
COMMENT ON COLUMN beneficiaries.vulnerability_type IS 'Type of vulnerability: Single Parent, Disabled, Elderly, etc.';
COMMENT ON COLUMN beneficiaries.registered_by IS 'User ID who registered this beneficiary';
COMMENT ON COLUMN beneficiaries.is_active IS 'Indicates if beneficiary record is active';

-- Beneficiary Support table comments
COMMENT ON TABLE beneficiary_support IS 'Complete history of all support provided to beneficiaries across all projects';
COMMENT ON COLUMN beneficiary_support.beneficiary_id IS 'Reference to beneficiary receiving support';
COMMENT ON COLUMN beneficiary_support.project_id IS 'Reference to project under which support was provided';
COMMENT ON COLUMN beneficiary_support.department IS 'Department providing support: Orphan Care, WASH, Health, Education, etc.';
COMMENT ON COLUMN beneficiary_support.support_type IS 'Type of support: Financial, Material, Training, Infrastructure, etc.';
COMMENT ON COLUMN beneficiary_support.support_category IS 'Specific category: Water, Sanitation, Food, Medical, etc.';
COMMENT ON COLUMN beneficiary_support.quantity IS 'Number of units/items provided';
COMMENT ON COLUMN beneficiary_support.estimated_value IS 'Estimated monetary value of support';
COMMENT ON COLUMN beneficiary_support.actual_value IS 'Actual monetary value spent';
COMMENT ON COLUMN beneficiary_support.support_date IS 'Date when support was provided';
COMMENT ON COLUMN beneficiary_support.partner_id IS 'Donor/Partner who funded the support';
COMMENT ON COLUMN beneficiary_support.status IS 'Current status of the support provision';
COMMENT ON COLUMN beneficiary_support.impact_notes IS 'Notes on impact of support';
COMMENT ON COLUMN beneficiary_support.beneficiary_feedback IS 'Feedback from beneficiary';
COMMENT ON COLUMN beneficiary_support.satisfaction_rating IS 'Satisfaction rating from 1-5';
COMMENT ON COLUMN beneficiary_support.photos IS 'JSON array of photo URLs documenting the support';

-- Beneficiary Documents table comments
COMMENT ON TABLE beneficiary_documents IS 'Stores documents related to beneficiaries (NIC copies, certificates, etc.)';
COMMENT ON COLUMN beneficiary_documents.document_type IS 'Type of document: NIC Copy, Birth Certificate, Income Certificate, etc.';

-- ====================================
-- 8. CREATE TRIGGERS FOR updated_at
-- ====================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_beneficiary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for beneficiaries
DROP TRIGGER IF EXISTS update_beneficiaries_updated_at ON beneficiaries;
CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_beneficiary_updated_at();

-- Triggers for beneficiary_support
DROP TRIGGER IF EXISTS update_beneficiary_support_updated_at ON beneficiary_support;
CREATE TRIGGER update_beneficiary_support_updated_at
  BEFORE UPDATE ON beneficiary_support
  FOR EACH ROW
  EXECUTE FUNCTION update_beneficiary_updated_at();

-- Triggers for beneficiary_documents
DROP TRIGGER IF EXISTS update_beneficiary_documents_updated_at ON beneficiary_documents;
CREATE TRIGGER update_beneficiary_documents_updated_at
  BEFORE UPDATE ON beneficiary_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_beneficiary_updated_at();

-- ====================================
-- 9. CREATE VIEWS FOR COMMON QUERIES
-- ====================================

-- View: Beneficiary with support summary
CREATE OR REPLACE VIEW beneficiary_support_summary AS
SELECT
  b.id,
  b.nic,
  b.full_name,
  b.district,
  b.division,
  b.is_active,
  COUNT(DISTINCT bs.id) as total_supports,
  COUNT(DISTINCT bs.project_id) as projects_count,
  COUNT(DISTINCT bs.partner_id) as partners_count,
  SUM(CASE WHEN bs.status = 'Completed' THEN 1 ELSE 0 END) as completed_supports,
  SUM(bs.actual_value) as total_value_received,
  MAX(bs.support_date) as last_support_date,
  MIN(bs.support_date) as first_support_date
FROM beneficiaries b
LEFT JOIN beneficiary_support bs ON b.id = bs.beneficiary_id
GROUP BY b.id, b.nic, b.full_name, b.district, b.division, b.is_active;

COMMENT ON VIEW beneficiary_support_summary IS 'Summary of support history for each beneficiary';

-- ====================================
-- SUCCESS MESSAGE
-- ====================================
DO $$
BEGIN
  RAISE NOTICE '✓ Beneficiary Management System database schema created successfully!';
  RAISE NOTICE '  - beneficiaries table created';
  RAISE NOTICE '  - beneficiary_support table created';
  RAISE NOTICE '  - beneficiary_documents table created';
  RAISE NOTICE '  - All indexes created for optimal performance';
  RAISE NOTICE '  - All triggers created for automatic timestamp updates';
  RAISE NOTICE '  - beneficiary_support_summary view created';
END $$;
