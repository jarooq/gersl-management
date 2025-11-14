-- Create Partners Table
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  logo TEXT,
  category VARCHAR(100),
  type VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  focus_areas JSON DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'Prospective' CHECK (status IN ('Active', 'Inactive', 'Prospective')),
  partnership_start DATE,
  total_contributions DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_country ON partners(country);
