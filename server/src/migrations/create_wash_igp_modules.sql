-- ============================================================================
-- create_wash_igp_modules.sql
--
-- WASH (Water/Sanitation/Hygiene) and IGP (Income Generating Programmes)
-- modules. Mirrors the orphan-care pattern: donor → order → individual items
-- with beneficiary, GPS, stage timeline, photos, and donor reports.
--
-- Both modules connect to existing entities (partners as donors, vendors as
-- contractors, beneficiaries for recipients, projects as umbrellas, proposals
-- upstream, invoices + bills + cash transactions on the finance side). No
-- duplication — the new tables only carry programme-specific operational
-- state.
--
-- Idempotent (IF NOT EXISTS everywhere). Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions to existing tables
-- ---------------------------------------------------------------------------

-- Household GPS on beneficiaries — captured at registration or first visit.
-- Each WashItem/IgpItem may carry its own installation/delivery GPS too,
-- because the household and the installation point (village square pump)
-- can be different points.
ALTER TABLE beneficiaries
  ADD COLUMN IF NOT EXISTS household_lat DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS household_lng DECIMAL(10, 7);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_household_gps
  ON beneficiaries (household_lat, household_lng);

-- Vendors can be flagged as contractors so the contractor picker on
-- WASH/IGP items only shows the relevant rows.
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS is_contractor BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_vendors_is_contractor
  ON vendors (is_contractor) WHERE is_contractor = TRUE;

-- Partner-level defaults that propagate into every order from this donor.
-- Most donors honour one consistent pattern (proforma vs post-delivery,
-- batch vs per-item invoicing). Orders inherit these, with override allowed.
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS payment_term       VARCHAR(30) DEFAULT 'PostDelivery',
  ADD COLUMN IF NOT EXISTS invoice_frequency  VARCHAR(20) DEFAULT 'PerOrder',
  ADD COLUMN IF NOT EXISTS reporting_format   VARCHAR(20) DEFAULT 'PerItem',
  ADD COLUMN IF NOT EXISTS anonymize_reports  BOOLEAN DEFAULT FALSE;

-- Proposal additions — line-item line, standing/framework flag, conversion
-- pointer back to the WashOrder or IgpOrder created from this proposal.
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS proposal_type         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS proposal_line_items   JSONB,
  ADD COLUMN IF NOT EXISTS standing_proposal     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS total_quantity_cap    INTEGER,
  ADD COLUMN IF NOT EXISTS named_beneficiaries   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS converted_order_type  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS converted_order_id    INTEGER;

CREATE INDEX IF NOT EXISTS idx_proposals_proposal_type
  ON proposals (proposal_type) WHERE proposal_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_standing
  ON proposals (standing_proposal) WHERE standing_proposal = TRUE;

-- ---------------------------------------------------------------------------
-- 2. WASH module
-- ---------------------------------------------------------------------------

-- A donor-funded batch. One Nation's 50 hand pumps for April = one wash_order.
-- Mercuful Group's standing arrangement = one long-running wash_order with
-- rolling items added over time.
CREATE TABLE IF NOT EXISTS wash_orders (
  id                    SERIAL PRIMARY KEY,
  order_code            VARCHAR(50) UNIQUE NOT NULL,
  donor_id              INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  project_id            INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  proposal_id           INTEGER REFERENCES proposals(id) ON DELETE SET NULL,

  title                 VARCHAR(300) NOT NULL,
  description           TEXT,

  unit_type             VARCHAR(50),         -- HandPump | CommunityWell | HybridWell | TubeWell | Filter | Tank | Latrine | Mixed
  quantity              INTEGER NOT NULL,    -- Planned count
  unit_cost             DECIMAL(15,2),
  total_budget          DECIMAL(15,2),
  currency              VARCHAR(8) DEFAULT 'LKR',

  order_date            DATE NOT NULL,
  deadline              DATE NOT NULL,
  committed_date        DATE,                -- When GERSL accepted the order
  expected_delivery     DATE,

  delivery_cadence      VARCHAR(20) DEFAULT 'Batch',   -- Daily | Weekly | Monthly | Batch
  invoice_timing        VARCHAR(20) DEFAULT 'AfterWork',  -- BeforeWork | AfterWork
  work_start_condition  VARCHAR(30) DEFAULT 'OnAcceptance',  -- OnAcceptance | OnFundsReceived
  donor_reporting       VARCHAR(20) DEFAULT 'PerItem',  -- PerItem | BatchAtCompletion | Monthly

  invoice_id            INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  payment_status        VARCHAR(20) DEFAULT 'Pending',  -- Pending | PartiallyPaid | Paid | Overdue
  amount_received       DECIMAL(15,2) DEFAULT 0,

  status                VARCHAR(20) DEFAULT 'Active',   -- Active | Completed | Cancelled
  donor_ref             VARCHAR(100),         -- Donor's own tracking ref
  notes                 TEXT,

  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wash_orders_donor      ON wash_orders (donor_id);
CREATE INDEX IF NOT EXISTS idx_wash_orders_project    ON wash_orders (project_id);
CREATE INDEX IF NOT EXISTS idx_wash_orders_proposal   ON wash_orders (proposal_id);
CREATE INDEX IF NOT EXISTS idx_wash_orders_status     ON wash_orders (status);
CREATE INDEX IF NOT EXISTS idx_wash_orders_deadline   ON wash_orders (deadline);
CREATE INDEX IF NOT EXISTS idx_wash_orders_payment    ON wash_orders (payment_status);

-- One installation. One named beneficiary, one GPS, one stage state.
CREATE TABLE IF NOT EXISTS wash_items (
  id                    SERIAL PRIMARY KEY,
  item_code             VARCHAR(50) UNIQUE NOT NULL,
  order_id              INTEGER NOT NULL REFERENCES wash_orders(id) ON DELETE CASCADE,

  beneficiary_id        INTEGER REFERENCES beneficiaries(id) ON DELETE SET NULL,
  beneficiary_name      VARCHAR(200),         -- Captured inline as backup if beneficiary row not yet created
  beneficiary_nic       VARCHAR(20),
  beneficiary_phone     VARCHAR(20),
  household_size        INTEGER,

  province              VARCHAR(100),
  district              VARCHAR(100),
  ds_division           VARCHAR(150),
  gn_division           VARCHAR(150),
  address               TEXT,
  installation_lat      DECIMAL(10,7),
  installation_lng      DECIMAL(10,7),

  unit_type             VARCHAR(50) NOT NULL, -- Inherits from order but can override
  planned_cost          DECIMAL(15,2),
  actual_cost           DECIMAL(15,2),

  assigned_contractor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  assigned_supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

  stage                 VARCHAR(30) DEFAULT 'Ordered',
  -- Ordered | Surveyed | Materials | Construction | Testing | HandedOver | Reported | Cancelled
  surveyed_at           TIMESTAMP,
  materials_at          TIMESTAMP,
  construction_at       TIMESTAMP,
  testing_at            TIMESTAMP,
  handover_at           TIMESTAMP,
  reported_at           TIMESTAMP,

  planned_completion    DATE,
  sla_days              INTEGER,
  overdue_reason        TEXT,

  donor_ref             VARCHAR(100),         -- This specific item's donor reference (One Nation often gives one per pump)
  report_pdf_url        VARCHAR(1000),
  notes                 TEXT,

  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wash_items_order        ON wash_items (order_id);
CREATE INDEX IF NOT EXISTS idx_wash_items_beneficiary  ON wash_items (beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_wash_items_stage        ON wash_items (stage);
CREATE INDEX IF NOT EXISTS idx_wash_items_contractor   ON wash_items (assigned_contractor_id);
CREATE INDEX IF NOT EXISTS idx_wash_items_supervisor   ON wash_items (assigned_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_wash_items_district     ON wash_items (district);
CREATE INDEX IF NOT EXISTS idx_wash_items_gps          ON wash_items (installation_lat, installation_lng);
CREATE INDEX IF NOT EXISTS idx_wash_items_planned      ON wash_items (planned_completion);

-- Append-only timeline of stage transitions and progress updates.
CREATE TABLE IF NOT EXISTS wash_stage_updates (
  id                SERIAL PRIMARY KEY,
  item_id           INTEGER NOT NULL REFERENCES wash_items(id) ON DELETE CASCADE,
  stage             VARCHAR(30) NOT NULL,
  percent_complete  INTEGER DEFAULT 0,
  notes             TEXT,
  photo_urls        JSONB DEFAULT '[]'::jsonb,
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  updated_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  source            VARCHAR(20) DEFAULT 'web',  -- web | mobile
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wash_stage_updates_item ON wash_stage_updates (item_id);
CREATE INDEX IF NOT EXISTS idx_wash_stage_updates_at   ON wash_stage_updates (created_at);

-- ---------------------------------------------------------------------------
-- 3. IGP module — same structure as WASH with livelihood-specific fields
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS igp_orders (
  id                    SERIAL PRIMARY KEY,
  order_code            VARCHAR(50) UNIQUE NOT NULL,
  donor_id              INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  project_id            INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  proposal_id           INTEGER REFERENCES proposals(id) ON DELETE SET NULL,

  title                 VARCHAR(300) NOT NULL,
  description           TEXT,

  -- IGP orders are often mixed (15 sewing + 15 canoe + 20 bicycle).
  -- The line items live as JSONB on the order; individual igp_items carry
  -- their own asset_type.
  asset_mix             JSONB,               -- [{type:'SewingMachine', qty:15, unit:45000}, ...]
  quantity              INTEGER NOT NULL,    -- Sum across asset_mix
  total_budget          DECIMAL(15,2),
  currency              VARCHAR(8) DEFAULT 'LKR',

  order_date            DATE NOT NULL,
  deadline              DATE NOT NULL,
  committed_date        DATE,
  expected_delivery     DATE,

  delivery_cadence      VARCHAR(20) DEFAULT 'Batch',
  invoice_timing        VARCHAR(20) DEFAULT 'AfterWork',
  work_start_condition  VARCHAR(30) DEFAULT 'OnAcceptance',
  donor_reporting       VARCHAR(20) DEFAULT 'PerItem',

  invoice_id            INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  payment_status        VARCHAR(20) DEFAULT 'Pending',
  amount_received       DECIMAL(15,2) DEFAULT 0,

  status                VARCHAR(20) DEFAULT 'Active',
  donor_ref             VARCHAR(100),
  notes                 TEXT,

  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_igp_orders_donor    ON igp_orders (donor_id);
CREATE INDEX IF NOT EXISTS idx_igp_orders_project  ON igp_orders (project_id);
CREATE INDEX IF NOT EXISTS idx_igp_orders_proposal ON igp_orders (proposal_id);
CREATE INDEX IF NOT EXISTS idx_igp_orders_status   ON igp_orders (status);
CREATE INDEX IF NOT EXISTS idx_igp_orders_deadline ON igp_orders (deadline);
CREATE INDEX IF NOT EXISTS idx_igp_orders_payment  ON igp_orders (payment_status);

CREATE TABLE IF NOT EXISTS igp_items (
  id                    SERIAL PRIMARY KEY,
  item_code             VARCHAR(50) UNIQUE NOT NULL,
  order_id              INTEGER NOT NULL REFERENCES igp_orders(id) ON DELETE CASCADE,

  beneficiary_id        INTEGER REFERENCES beneficiaries(id) ON DELETE SET NULL,
  beneficiary_name      VARCHAR(200),
  beneficiary_nic       VARCHAR(20),
  beneficiary_phone     VARCHAR(20),
  household_size        INTEGER,

  province              VARCHAR(100),
  district              VARCHAR(100),
  ds_division           VARCHAR(150),
  gn_division           VARCHAR(150),
  address               TEXT,
  delivery_lat          DECIMAL(10,7),
  delivery_lng          DECIMAL(10,7),

  asset_type            VARCHAR(50) NOT NULL,
  -- SewingMachine | Canoe | Bicycle | LivestockKit | ToolKit | CashGrant | Other
  asset_specification   TEXT,                -- Make/model/size detail
  planned_cost          DECIMAL(15,2),
  actual_cost           DECIMAL(15,2),

  assigned_contractor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  assigned_supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Optional training/skills component (sewing requires a course; bicycle doesn't)
  training_required     BOOLEAN DEFAULT FALSE,
  training_hours        INTEGER,
  training_completed_at TIMESTAMP,
  trainer_id            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  certificate_url       VARCHAR(1000),

  stage                 VARCHAR(30) DEFAULT 'Ordered',
  -- Ordered | Surveyed | Procured | Training | Delivered | FollowUp | Reported | Cancelled
  surveyed_at           TIMESTAMP,
  procured_at           TIMESTAMP,
  delivered_at          TIMESTAMP,
  reported_at           TIMESTAMP,

  planned_completion    DATE,
  follow_up_at          DATE,                -- Livelihood-monitoring visit
  income_baseline       DECIMAL(15,2),       -- Pre-asset monthly income
  income_followup       DECIMAL(15,2),       -- Captured at follow-up

  donor_ref             VARCHAR(100),
  report_pdf_url        VARCHAR(1000),
  notes                 TEXT,

  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_igp_items_order        ON igp_items (order_id);
CREATE INDEX IF NOT EXISTS idx_igp_items_beneficiary  ON igp_items (beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_igp_items_stage        ON igp_items (stage);
CREATE INDEX IF NOT EXISTS idx_igp_items_asset_type   ON igp_items (asset_type);
CREATE INDEX IF NOT EXISTS idx_igp_items_contractor   ON igp_items (assigned_contractor_id);
CREATE INDEX IF NOT EXISTS idx_igp_items_supervisor   ON igp_items (assigned_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_igp_items_district     ON igp_items (district);
CREATE INDEX IF NOT EXISTS idx_igp_items_gps          ON igp_items (delivery_lat, delivery_lng);

CREATE TABLE IF NOT EXISTS igp_stage_updates (
  id                SERIAL PRIMARY KEY,
  item_id           INTEGER NOT NULL REFERENCES igp_items(id) ON DELETE CASCADE,
  stage             VARCHAR(30) NOT NULL,
  percent_complete  INTEGER DEFAULT 0,
  notes             TEXT,
  photo_urls        JSONB DEFAULT '[]'::jsonb,
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  updated_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  source            VARCHAR(20) DEFAULT 'web',
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_igp_stage_updates_item ON igp_stage_updates (item_id);
CREATE INDEX IF NOT EXISTS idx_igp_stage_updates_at   ON igp_stage_updates (created_at);

-- ---------------------------------------------------------------------------
-- 4. Refresh planner stats
-- ---------------------------------------------------------------------------
ANALYZE wash_orders;
ANALYZE wash_items;
ANALYZE wash_stage_updates;
ANALYZE igp_orders;
ANALYZE igp_items;
ANALYZE igp_stage_updates;
ANALYZE beneficiaries;
ANALYZE vendors;
ANALYZE partners;
ANALYZE proposals;
