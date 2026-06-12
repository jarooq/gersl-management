import sequelize from '../config/database.js';

// =============================================================================
// Multi-currency / exchange-rate support for the finance module.
//
// Run with: node server/src/migrations/add_forex_columns_to_finance.js
// Idempotent — safe to re-run.
//
// Adds:
//   - exchange_rates       : daily Sampath Bank O/D Buying rate snapshots
//   - invoice_receipts     : per-receipt record against an invoice (rate + gain/loss)
//   - forex columns on invoices / payables / grant_receivables / donations
//     (booking side) and on grant_receipts / payments (receipt side)
//
// Backfill: existing rows are treated as already-LKR (rate = 1, amount_lkr =
// the existing amount). Foreign-currency rows created before this migration
// keep rate = 1 and should be corrected by finance staff.
// =============================================================================

async function run() {
  try {
    // --- exchange_rates -----------------------------------------------------
    await sequelize.query(`
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
    `);
    await sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS exchange_rates_currency_date_idx
         ON exchange_rates (currency, rate_date);`
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS exchange_rates_date_idx ON exchange_rates (rate_date);`
    );

    // --- invoice_receipts ---------------------------------------------------
    await sequelize.query(`
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
    `);
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS invoice_receipts_invoice_idx ON invoice_receipts (invoice_id);`
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS invoice_receipts_date_idx ON invoice_receipts (receipt_date);`
    );

    // --- booking-side forex columns ----------------------------------------
    // invoices, payables, grant_receivables, donations
    const bookingTables = ['invoices', 'payables', 'grant_receivables', 'donations'];
    for (const t of bookingTables) {
      await sequelize.query(`
        ALTER TABLE ${t}
          ADD COLUMN IF NOT EXISTS original_amount NUMERIC(15,2),
          ADD COLUMN IF NOT EXISTS exchange_rate   NUMERIC(14,6) DEFAULT 1,
          ADD COLUMN IF NOT EXISTS rate_date       DATE,
          ADD COLUMN IF NOT EXISTS amount_lkr      NUMERIC(15,2),
          ADD COLUMN IF NOT EXISTS rate_source     VARCHAR(20);
      `);
    }

    // --- receipt-side forex columns ----------------------------------------
    // grant_receipts and payments also need a realised gain/loss column
    for (const t of ['grant_receipts', 'payments']) {
      await sequelize.query(`
        ALTER TABLE ${t}
          ADD COLUMN IF NOT EXISTS exchange_rate      NUMERIC(14,6) DEFAULT 1,
          ADD COLUMN IF NOT EXISTS rate_date          DATE,
          ADD COLUMN IF NOT EXISTS amount_lkr         NUMERIC(15,2),
          ADD COLUMN IF NOT EXISTS exchange_gain_loss NUMERIC(15,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS rate_source        VARCHAR(20);
      `);
    }

    // --- backfill existing rows --------------------------------------------
    // Treat pre-existing rows as already booked at rate = 1. amount_lkr mirrors
    // the existing amount so LKR records are correct and foreign-currency
    // records become visible (and editable) rather than silently null.
    await sequelize.query(`
      UPDATE invoices SET
        original_amount = COALESCE(original_amount, total_amount),
        exchange_rate   = COALESCE(exchange_rate, 1),
        amount_lkr      = COALESCE(amount_lkr, total_amount),
        rate_date       = COALESCE(rate_date, invoice_date),
        rate_source     = COALESCE(rate_source, 'manual')
      WHERE amount_lkr IS NULL;
    `);
    await sequelize.query(`
      UPDATE payables SET
        original_amount = COALESCE(original_amount, amount),
        exchange_rate   = COALESCE(exchange_rate, 1),
        amount_lkr      = COALESCE(amount_lkr, amount),
        rate_date       = COALESCE(rate_date, invoice_date),
        rate_source     = COALESCE(rate_source, 'manual')
      WHERE amount_lkr IS NULL;
    `);
    await sequelize.query(`
      UPDATE grant_receivables SET
        original_amount = COALESCE(original_amount, total_amount),
        exchange_rate   = COALESCE(exchange_rate, 1),
        amount_lkr      = COALESCE(amount_lkr, total_amount),
        rate_date       = COALESCE(rate_date, grant_start_date),
        rate_source     = COALESCE(rate_source, 'manual')
      WHERE amount_lkr IS NULL;
    `);
    await sequelize.query(`
      UPDATE donations SET
        original_amount = COALESCE(original_amount, amount),
        exchange_rate   = COALESCE(exchange_rate, 1),
        amount_lkr      = COALESCE(amount_lkr, amount),
        rate_date       = COALESCE(rate_date, donation_date::date),
        rate_source     = COALESCE(rate_source, 'manual')
      WHERE amount_lkr IS NULL;
    `);
    await sequelize.query(`
      UPDATE grant_receipts SET
        exchange_rate = COALESCE(exchange_rate, 1),
        amount_lkr    = COALESCE(amount_lkr, amount),
        rate_date     = COALESCE(rate_date, receipt_date),
        rate_source   = COALESCE(rate_source, 'manual')
      WHERE amount_lkr IS NULL;
    `);
    await sequelize.query(`
      UPDATE payments SET
        exchange_rate = COALESCE(exchange_rate, 1),
        amount_lkr    = COALESCE(amount_lkr, amount),
        rate_date     = COALESCE(rate_date, payment_date),
        rate_source   = COALESCE(rate_source, 'manual')
      WHERE amount_lkr IS NULL;
    `);

    console.log('✅ Forex columns + exchange_rates / invoice_receipts ready');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();
