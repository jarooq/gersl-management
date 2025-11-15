-- ============================================
-- MISSING TABLES MIGRATION
-- ============================================
-- Creates tables for Campaigns, Social Media, Job Postings,
-- Vendor Calls, Donations, Compliance, and Attendance

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  campaign_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(100), -- Education, Health, Emergency, etc.
  category VARCHAR(100),
  target_amount DECIMAL(12, 2) DEFAULT 0,
  raised_amount DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Active, Completed, Cancelled
  start_date DATE,
  end_date DATE,
  image_url VARCHAR(500),
  video_url VARCHAR(500),
  location VARCHAR(200),
  beneficiaries INTEGER DEFAULT 0,
  approval_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected
  approved_by INTEGER REFERENCES users(id),
  approval_date TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_approval_status ON campaigns(approval_status);

-- ============================================
-- DONATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  donation_code VARCHAR(50) UNIQUE NOT NULL,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  donor_name VARCHAR(200) NOT NULL,
  donor_email VARCHAR(100),
  donor_phone VARCHAR(20),
  donor_type VARCHAR(50), -- Individual, Corporate, Anonymous
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'LKR',
  payment_method VARCHAR(50), -- Card, Bank Transfer, Cash, etc.
  payment_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Completed, Failed, Refunded
  transaction_id VARCHAR(100),
  receipt_number VARCHAR(50),
  is_anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  donation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_status ON donations(payment_status);
CREATE INDEX idx_donations_date ON donations(donation_date);

-- ============================================
-- JOB POSTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS job_postings (
  id SERIAL PRIMARY KEY,
  job_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  department VARCHAR(100),
  location VARCHAR(200),
  employment_type VARCHAR(50), -- Full-time, Part-time, Contract, Volunteer
  salary_range VARCHAR(100),
  positions_available INTEGER DEFAULT 1,
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  qualifications TEXT,
  benefits TEXT,
  application_deadline DATE,
  status VARCHAR(50) DEFAULT 'Open', -- Open, Closed, On Hold
  posted_date DATE DEFAULT CURRENT_DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_deadline ON job_postings(application_deadline);

-- ============================================
-- JOB APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_name VARCHAR(200) NOT NULL,
  applicant_email VARCHAR(100) NOT NULL,
  applicant_phone VARCHAR(20),
  cover_letter TEXT,
  resume_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'Submitted', -- Submitted, Under Review, Shortlisted, Rejected, Hired
  application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_applications_job ON job_applications(job_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

-- ============================================
-- VENDOR CALLS TABLE (Procurement/Tenders)
-- ============================================
CREATE TABLE IF NOT EXISTS vendor_calls (
  id SERIAL PRIMARY KEY,
  tender_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Goods, Services, Works
  type VARCHAR(100), -- Open Tender, Limited Tender, Request for Quotation
  budget_range VARCHAR(100),
  requirements TEXT,
  submission_deadline TIMESTAMP,
  opening_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Open', -- Open, Closed, Awarded, Cancelled
  document_url VARCHAR(500),
  contact_person VARCHAR(100),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  published_date DATE DEFAULT CURRENT_DATE,
  awarded_to VARCHAR(200),
  award_amount DECIMAL(12, 2),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_calls_status ON vendor_calls(status);
CREATE INDEX idx_vendor_calls_deadline ON vendor_calls(submission_deadline);

-- ============================================
-- VENDOR SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vendor_submissions (
  id SERIAL PRIMARY KEY,
  vendor_call_id INTEGER REFERENCES vendor_calls(id) ON DELETE CASCADE,
  vendor_name VARCHAR(200) NOT NULL,
  vendor_email VARCHAR(100),
  vendor_phone VARCHAR(20),
  proposal_document_url VARCHAR(500),
  quoted_amount DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'Submitted', -- Submitted, Under Review, Shortlisted, Rejected, Awarded
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_submissions_call ON vendor_submissions(vendor_call_id);
CREATE INDEX idx_vendor_submissions_status ON vendor_submissions(status);

-- ============================================
-- SOCIAL MEDIA POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS social_media_posts (
  id SERIAL PRIMARY KEY,
  post_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  platforms JSON, -- ['facebook', 'twitter', 'instagram', 'linkedin']
  media_type VARCHAR(50), -- Image, Video, Link, Text
  media_urls JSON, -- Array of media URLs
  scheduled_time TIMESTAMP,
  published_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Scheduled, Published, Failed
  engagement_stats JSON, -- {likes: 0, shares: 0, comments: 0, views: 0}
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_posts_status ON social_media_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_media_posts(scheduled_time);

-- ============================================
-- SOCIAL MEDIA ENGAGEMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS social_media_engagement (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES social_media_posts(id) ON DELETE CASCADE,
  platform VARCHAR(50), -- facebook, twitter, instagram, linkedin
  engagement_type VARCHAR(50), -- like, share, comment, view, click
  engagement_count INTEGER DEFAULT 0,
  engagement_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engagement_post ON social_media_engagement(post_id);
CREATE INDEX idx_engagement_date ON social_media_engagement(engagement_date);

-- ============================================
-- COMPLIANCE DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_documents (
  id SERIAL PRIMARY KEY,
  document_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100), -- Policy, Procedure, Certificate, License, Audit Report
  description TEXT,
  document_url VARCHAR(500),
  issue_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'Active', -- Active, Expired, Pending Renewal, Archived
  compliance_area VARCHAR(100), -- Legal, Financial, Safety, Quality, etc.
  responsible_person INTEGER REFERENCES users(id),
  review_frequency VARCHAR(50), -- Annual, Quarterly, Monthly
  last_review_date DATE,
  next_review_date DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compliance_status ON compliance_documents(status);
CREATE INDEX idx_compliance_expiry ON compliance_documents(expiry_date);
CREATE INDEX idx_compliance_review ON compliance_documents(next_review_date);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status VARCHAR(50) DEFAULT 'Present', -- Present, Absent, Late, Half Day, Leave, Holiday
  leave_type VARCHAR(50), -- Sick, Annual, Casual, Maternity, etc.
  work_hours DECIMAL(4, 2), -- Calculated work hours
  overtime_hours DECIMAL(4, 2) DEFAULT 0,
  location VARCHAR(100), -- Office, Remote, Field
  notes TEXT,
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, attendance_date)
);

CREATE INDEX idx_attendance_staff ON attendance(staff_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ============================================
-- LEAVE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL, -- Sick, Annual, Casual, Maternity, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count DECIMAL(3, 1), -- Can have half days
  reason TEXT,
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled
  approved_by INTEGER REFERENCES users(id),
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- UPDATE TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_calls_updated_at BEFORE UPDATE ON vendor_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_submissions_updated_at BEFORE UPDATE ON vendor_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_posts_updated_at BEFORE UPDATE ON social_media_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_engagement_updated_at BEFORE UPDATE ON social_media_engagement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_documents_updated_at BEFORE UPDATE ON compliance_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
