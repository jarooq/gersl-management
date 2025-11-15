-- ============================================
-- COMPREHENSIVE FINANCE TABLES
-- ============================================
-- Complete financial management system tables

-- ============================================
-- INVOICES TABLE (Sales Invoices)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  customer_name VARCHAR(200),
  customer_email VARCHAR(100),
  customer_address TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  proposal_id INTEGER REFERENCES proposals(id) ON DELETE SET NULL,
  partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  subtotal DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  balance_due DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'LKR',
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Sent, Paid, Overdue, Cancelled
  payment_terms VARCHAR(100),
  notes TEXT,
  line_items JSON,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_name);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- ============================================
-- BILLS TABLE (Vendor Bills / Payables)
-- ============================================
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  bill_date DATE NOT NULL,
  due_date DATE,
  vendor_name VARCHAR(200) NOT NULL,
  vendor_email VARCHAR(100),
  vendor_address TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  subtotal DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  balance_due DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'LKR',
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Paid, Overdue, Cancelled
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  line_items JSON,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_vendor ON bills(vendor_name);
CREATE INDEX idx_bills_date ON bills(bill_date);

-- ============================================
-- PURCHASE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  request_date DATE NOT NULL,
  required_date DATE,
  vendor_name VARCHAR(200) NOT NULL,
  vendor_contact VARCHAR(100),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  department VARCHAR(100),
  requestor_name VARCHAR(100),
  total_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'LKR',
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Ordered, Received, Cancelled
  approval_status VARCHAR(50) DEFAULT 'Pending',
  approved_by INTEGER REFERENCES users(id),
  approval_date TIMESTAMP,
  line_items JSON,
  delivery_address TEXT,
  special_instructions TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pos_status ON purchase_orders(status);
CREATE INDEX idx_pos_vendor ON purchase_orders(vendor_name);
CREATE INDEX idx_pos_date ON purchase_orders(request_date);

-- ============================================
-- CHART OF ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id SERIAL PRIMARY KEY,
  account_code VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
  category VARCHAR(100), -- Current Asset, Fixed Asset, etc.
  parent_account_id INTEGER REFERENCES chart_of_accounts(id),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  balance DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'LKR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX idx_accounts_active ON chart_of_accounts(is_active);

-- ============================================
-- JOURNAL ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  reference VARCHAR(100),
  description TEXT,
  total_debit DECIMAL(15, 2) DEFAULT 0,
  total_credit DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Posted, Reversed
  posted_date TIMESTAMP,
  reversed_entry_id INTEGER REFERENCES journal_entries(id),
  line_items JSON, -- [{accountId, debit, credit, description}]
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_status ON journal_entries(status);

-- ============================================
-- BANK ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id SERIAL PRIMARY KEY,
  account_name VARCHAR(200) NOT NULL,
  bank_name VARCHAR(200) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  account_holder_name VARCHAR(200),
  branch_code VARCHAR(50),
  swift_code VARCHAR(50),
  currency VARCHAR(10) DEFAULT 'LKR',
  current_balance DECIMAL(15, 2) DEFAULT 0,
  opening_balance DECIMAL(15, 2) DEFAULT 0,
  opening_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  account_type VARCHAR(50), -- Savings, Current, Foreign Currency
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active);

-- ============================================
-- BANK TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bank_transactions (
  id SERIAL PRIMARY KEY,
  transaction_date DATE NOT NULL,
  bank_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- Deposit, Withdrawal, Transfer, Fee
  amount DECIMAL(12, 2) NOT NULL,
  reference_number VARCHAR(100),
  payee_payer VARCHAR(200),
  description TEXT,
  category VARCHAR(100),
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_date DATE,
  statement_balance DECIMAL(15, 2),
  running_balance DECIMAL(15, 2),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_trans_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_trans_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_trans_reconciled ON bank_transactions(is_reconciled);

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  budget_name VARCHAR(200) NOT NULL,
  fiscal_year VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  department VARCHAR(100),
  total_budget DECIMAL(15, 2) NOT NULL,
  allocated_amount DECIMAL(15, 2) DEFAULT 0,
  spent_amount DECIMAL(15, 2) DEFAULT 0,
  remaining_amount DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'LKR',
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Approved, Active, Closed
  line_items JSON, -- [{category, amount, spent}]
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budgets_project ON budgets(project_id);
CREATE INDEX idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX idx_budgets_status ON budgets(status);

-- ============================================
-- PAYROLL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payroll (
  id SERIAL PRIMARY KEY,
  payroll_code VARCHAR(50) UNIQUE NOT NULL,
  staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE,
  basic_salary DECIMAL(10, 2) NOT NULL,
  allowances DECIMAL(10, 2) DEFAULT 0,
  overtime_amount DECIMAL(10, 2) DEFAULT 0,
  bonuses DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  tax_deduction DECIMAL(10, 2) DEFAULT 0,
  epf_deduction DECIMAL(10, 2) DEFAULT 0,
  etf_deduction DECIMAL(10, 2) DEFAULT 0,
  gross_pay DECIMAL(10, 2),
  net_pay DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Processed, Paid
  payment_method VARCHAR(50), -- Bank Transfer, Cash, Cheque
  payment_reference VARCHAR(100),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  processed_by INTEGER REFERENCES users(id),
  processed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_staff ON payroll(staff_id);
CREATE INDEX idx_payroll_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX idx_payroll_status ON payroll(status);

-- ============================================
-- GRANT RECEIVABLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS grant_receivables (
  id SERIAL PRIMARY KEY,
  grant_code VARCHAR(50) UNIQUE NOT NULL,
  grant_name VARCHAR(200) NOT NULL,
  donor_id INTEGER REFERENCES partners(id),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  proposal_id INTEGER REFERENCES proposals(id) ON DELETE SET NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  received_amount DECIMAL(15, 2) DEFAULT 0,
  balance_amount DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'LKR',
  grant_start_date DATE,
  grant_end_date DATE,
  expected_receipt_date DATE,
  status VARCHAR(50) DEFAULT 'Approved', -- Approved, Partially Received, Fully Received, Overdue
  disbursement_schedule JSON, -- [{installment, amount, expected_date, received_date}]
  compliance_requirements TEXT,
  reporting_requirements TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grants_donor ON grant_receivables(donor_id);
CREATE INDEX idx_grants_project ON grant_receivables(project_id);
CREATE INDEX idx_grants_status ON grant_receivables(status);

-- ============================================
-- GRANT RECEIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS grant_receipts (
  id SERIAL PRIMARY KEY,
  receipt_code VARCHAR(50) UNIQUE NOT NULL,
  grant_id INTEGER REFERENCES grant_receivables(id) ON DELETE CASCADE,
  receipt_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'LKR',
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  bank_account_id INTEGER REFERENCES bank_accounts(id),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grant_receipts_grant ON grant_receipts(grant_id);
CREATE INDEX idx_grant_receipts_date ON grant_receipts(receipt_date);

-- ============================================
-- FIXED ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fixed_assets (
  id SERIAL PRIMARY KEY,
  asset_code VARCHAR(50) UNIQUE NOT NULL,
  asset_name VARCHAR(200) NOT NULL,
  asset_type VARCHAR(100), -- Furniture, Equipment, Vehicles, Buildings, etc.
  description TEXT,
  purchase_date DATE NOT NULL,
  purchase_cost DECIMAL(15, 2) NOT NULL,
  salvage_value DECIMAL(15, 2) DEFAULT 0,
  useful_life_years INTEGER,
  depreciation_method VARCHAR(50) DEFAULT 'Straight Line', -- Straight Line, Declining Balance
  accumulated_depreciation DECIMAL(15, 2) DEFAULT 0,
  book_value DECIMAL(15, 2),
  location VARCHAR(200),
  department VARCHAR(100),
  custodian VARCHAR(100),
  supplier VARCHAR(200),
  serial_number VARCHAR(100),
  warranty_expiry DATE,
  status VARCHAR(50) DEFAULT 'Active', -- Active, Under Maintenance, Disposed, Sold
  disposal_date DATE,
  disposal_value DECIMAL(15, 2),
  disposal_notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_type ON fixed_assets(asset_type);
CREATE INDEX idx_assets_status ON fixed_assets(status);
CREATE INDEX idx_assets_department ON fixed_assets(department);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON chart_of_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grant_receivables_updated_at BEFORE UPDATE ON grant_receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grant_receipts_updated_at BEFORE UPDATE ON grant_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixed_assets_updated_at BEFORE UPDATE ON fixed_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
