-- =============================================================================
-- Multi-currency / exchange-rate support for the finance module.
--
-- Pure-SQL version of add_forex_columns_to_finance.js — paste this directly
-- into a Postgres console (pgAdmin / psql / Supabase SQL editor).
-- Idempotent — safe to re-run.
--
-- Adds:
--   - exchange_rates    : daily Sampath Bank O/D Buying rate snapshots
--   - invoice_receipts  : per-receipt record against an invoice (rate + gain/loss)
--   - forex columns on invoices / payables / grant_receivables / donations
--     (booking side) and on grant_receipts / payments (receipt side)
-- =============================================================================

-- --- exchange_rates ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS exchange_rates (
  id              SERIAL PRIMARY KEY,
  currency        VARCHAR(10)  NOT NULL,
  currency_name   VARCHAR(100),
  rate_date       DATE         NOT NULL,
  od_buying_rate  NUMERIC(14,6) NOT NULL,
  tt_buying_rate  NUMERIC(14,6),
  tt_selling_rate NUMERIC(14,6),
  source          VARCHAR(20)  NOT NULL DEFAULT 'sampath-auto',
  rate_wef        VARCHAR(100),
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS exchange_rates_currency_date_idx
  ON exchange_rates (currency, rate_date);
CREATE INDEX IF NOT EXISTS exchange_rates_date_idx ON exchange_rates (rate_date);

-- --- invoice_receipts --------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_receipts (
  id                 SERIAL PRIMARY KEY,
  invoice_id         INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  receipt_date       DATE    NOT NULL,
  original_amount    NUMERIC(15,2) NOT NULL,
  currency           VARCHAR(10) NOT NULL DEFAULT 'LKR',
  exchange_rate      NUMERIC(14,6) NOT NULL DEFAULT 1,
  rate_date          DATE,
  amount_lkr         NUMERIC(15,2),
  exchange_gain_loss NUMERIC(15,2) NOT NULL DEFAULT 0,
  rate_source        VARCHAR(20),
  payment_method     VARCHAR(50),
  bank_account_id    INTEGER REFERENCES bank_accounts(id),
  reference_number   VARCHAR(100),
  notes              TEXT,
  created_by         INTEGER REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS invoice_receipts_invoice_idx ON invoice_receipts (invoice_id);
CREATE INDEX IF NOT EXISTS invoice_receipts_date_idx    ON invoice_receipts (receipt_date);

-- --- booking-side forex columns ---------------------------------------------
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_rate   NUMERIC(14,6) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rate_date       DATE,
  ADD COLUMN IF NOT EXISTS amount_lkr      NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS rate_source     VARCHAR(20);

ALTER TABLE payables
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_rate   NUMERIC(14,6) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rate_date       DATE,
  ADD COLUMN IF NOT EXISTS amount_lkr      NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS rate_source     VARCHAR(20);

ALTER TABLE grant_receivables
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_rate   NUMERIC(14,6) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rate_date       DATE,
  ADD COLUMN IF NOT EXISTS amount_lkr      NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS rate_source     VARCHAR(20);

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_rate   NUMERIC(14,6) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rate_date       DATE,
  ADD COLUMN IF NOT EXISTS amount_lkr      NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS rate_source     VARCHAR(20);

-- --- receipt-side forex columns ---------------------------------------------
ALTER TABLE grant_receipts
  ADD COLUMN IF NOT EXISTS exchange_rate      NUMERIC(14,6) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rate_date          DATE,
  ADD COLUMN IF NOT EXISTS amount_lkr         NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_gain_loss NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rate_source        VARCHAR(20);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS exchange_rate      NUMERIC(14,6) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rate_date          DATE,
  ADD COLUMN IF NOT EXISTS amount_lkr         NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_gain_loss NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rate_source        VARCHAR(20);

-- --- backfill existing rows (treat as already booked at rate = 1) -----------
UPDATE invoices SET
  original_amount = COALESCE(original_amount, total_amount),
  exchange_rate   = COALESCE(exchange_rate, 1),
  amount_lkr      = COALESCE(amount_lkr, total_amount),
  rate_date       = COALESCE(rate_date, invoice_date),
  rate_source     = COALESCE(rate_source, 'manual')
WHERE amount_lkr IS NULL;

UPDATE payables SET
  original_amount = COALESCE(original_amount, amount),
  exchange_rate   = COALESCE(exchange_rate, 1),
  amount_lkr      = COALESCE(amount_lkr, amount),
  rate_date       = COALESCE(rate_date, invoice_date),
  rate_source     = COALESCE(rate_source, 'manual')
WHERE amount_lkr IS NULL;

UPDATE grant_receivables SET
  original_amount = COALESCE(original_amount, total_amount),
  exchange_rate   = COALESCE(exchange_rate, 1),
  amount_lkr      = COALESCE(amount_lkr, total_amount),
  rate_date       = COALESCE(rate_date, grant_start_date),
  rate_source     = COALESCE(rate_source, 'manual')
WHERE amount_lkr IS NULL;

UPDATE donations SET
  original_amount = COALESCE(original_amount, amount),
  exchange_rate   = COALESCE(exchange_rate, 1),
  amount_lkr      = COALESCE(amount_lkr, amount),
  rate_date       = COALESCE(rate_date, donation_date::date),
  rate_source     = COALESCE(rate_source, 'manual')
WHERE amount_lkr IS NULL;

UPDATE grant_receipts SET
  exchange_rate = COALESCE(exchange_rate, 1),
  amount_lkr    = COALESCE(amount_lkr, amount),
  rate_date     = COALESCE(rate_date, receipt_date),
  rate_source   = COALESCE(rate_source, 'manual')
WHERE amount_lkr IS NULL;

UPDATE payments SET
  exchange_rate = COALESCE(exchange_rate, 1),
  amount_lkr    = COALESCE(amount_lkr, amount),
  rate_date     = COALESCE(rate_date, payment_date),
  rate_source   = COALESCE(rate_source, 'manual')
WHERE amount_lkr IS NULL;
