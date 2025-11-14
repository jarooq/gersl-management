-- Create orphan_needs table manually
CREATE TABLE IF NOT EXISTS orphan_needs (
  id SERIAL PRIMARY KEY,
  orphan_id INTEGER NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
  need_type VARCHAR(255) NOT NULL,
  need_category VARCHAR(50) DEFAULT 'Other',
  description TEXT,
  quantity INTEGER DEFAULT 1,
  estimated_cost DECIMAL(10,2),
  urgency VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'Pending',
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  recorded_date DATE NOT NULL,
  approved_by INTEGER REFERENCES users(id),
  approved_date DATE,
  fulfilled_by VARCHAR(255),
  fulfilled_date DATE,
  actual_cost DECIMAL(10,2),
  notes TEXT,
  visit_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create ENUM types
DO $$ BEGIN
  CREATE TYPE enum_orphan_needs_need_category AS ENUM('Education', 'Health', 'Clothing', 'Food', 'Shelter', 'Other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_orphan_needs_urgency AS ENUM('High', 'Medium', 'Low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enum_orphan_needs_status AS ENUM('Pending', 'Approved', 'In Progress', 'Fulfilled', 'Cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Alter columns to use ENUM types
ALTER TABLE orphan_needs
  ALTER COLUMN need_category TYPE enum_orphan_needs_need_category USING need_category::enum_orphan_needs_need_category,
  ALTER COLUMN urgency TYPE enum_orphan_needs_urgency USING urgency::enum_orphan_needs_urgency,
  ALTER COLUMN status TYPE enum_orphan_needs_status USING status::enum_orphan_needs_status;

-- Create indexes
CREATE INDEX IF NOT EXISTS orphan_needs_orphan_id_idx ON orphan_needs(orphan_id);
CREATE INDEX IF NOT EXISTS orphan_needs_need_type_idx ON orphan_needs(need_type);
CREATE INDEX IF NOT EXISTS orphan_needs_status_idx ON orphan_needs(status);
CREATE INDEX IF NOT EXISTS orphan_needs_urgency_idx ON orphan_needs(urgency);
CREATE INDEX IF NOT EXISTS orphan_needs_recorded_by_idx ON orphan_needs(recorded_by);
CREATE INDEX IF NOT EXISTS orphan_needs_recorded_date_idx ON orphan_needs(recorded_date);

-- Add comments
COMMENT ON COLUMN orphan_needs.need_type IS 'Type of need: School Bag, Uniform, Shoes, Books, Medical Supplies, etc.';
COMMENT ON COLUMN orphan_needs.description IS 'Detailed description of the need';
COMMENT ON COLUMN orphan_needs.quantity IS 'Number of items needed';
COMMENT ON COLUMN orphan_needs.estimated_cost IS 'Estimated cost in LKR';
COMMENT ON COLUMN orphan_needs.urgency IS 'Priority level of the need';
COMMENT ON COLUMN orphan_needs.status IS 'Current status of the need';
COMMENT ON COLUMN orphan_needs.recorded_by IS 'ID of coordinator who recorded the need';
COMMENT ON COLUMN orphan_needs.recorded_date IS 'Date when need was recorded';
COMMENT ON COLUMN orphan_needs.approved_by IS 'ID of user who approved the need';
COMMENT ON COLUMN orphan_needs.fulfilled_by IS 'Donor/Partner who fulfilled the need';
COMMENT ON COLUMN orphan_needs.actual_cost IS 'Actual cost spent in LKR';
COMMENT ON COLUMN orphan_needs.notes IS 'Additional notes or comments';
COMMENT ON COLUMN orphan_needs.visit_id IS 'Related visit ID if recorded during a visit';
