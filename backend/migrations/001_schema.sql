-- ============================================================
-- AICarDealershipSalesOptimizer - Full Schema Migration
-- 001_schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Users / Auth
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  role          VARCHAR(50)  DEFAULT 'user',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Staff
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE,
  phone        VARCHAR(50),
  role         VARCHAR(100),
  department   VARCHAR(100),
  hire_date    DATE,
  salary       NUMERIC(12,2),
  commission_rate NUMERIC(5,4) DEFAULT 0.03,
  status       VARCHAR(50)  DEFAULT 'active',
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Customers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id                  SERIAL PRIMARY KEY,
  first_name          VARCHAR(255) NOT NULL,
  last_name           VARCHAR(255) NOT NULL,
  email               VARCHAR(255),
  phone               VARCHAR(50),
  budget_min          NUMERIC(12,2),
  budget_max          NUMERIC(12,2),
  preferred_make      VARCHAR(100),
  preferred_type      VARCHAR(100),
  credit_score_range  VARCHAR(50),
  financing_needed    BOOLEAN DEFAULT FALSE,
  status              VARCHAR(50) DEFAULT 'active',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Inventory
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id                          SERIAL PRIMARY KEY,
  vin                         VARCHAR(17) UNIQUE,
  make                        VARCHAR(100) NOT NULL,
  model                       VARCHAR(100) NOT NULL,
  year                        INTEGER NOT NULL,
  trim                        VARCHAR(100),
  color                       VARCHAR(100),
  mileage                     INTEGER DEFAULT 0,
  purchase_price              NUMERIC(12,2),
  listing_price               NUMERIC(12,2),
  ai_suggested_price          NUMERIC(12,2),
  condition                   VARCHAR(50) DEFAULT 'Good',
  body_type                   VARCHAR(100),
  status                      VARCHAR(50) DEFAULT 'available',
  days_on_lot                 INTEGER DEFAULT 0,
  -- Reservation tracking
  reserved_for_customer_id    INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  reserved_for_customer_name  VARCHAR(255),
  reserved_at                 TIMESTAMPTZ,
  reservation_notes           TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Leads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id               SERIAL PRIMARY KEY,
  customer_name    VARCHAR(255) NOT NULL,
  email            VARCHAR(255),
  phone            VARCHAR(50),
  source           VARCHAR(100) NOT NULL,
  interest_type    VARCHAR(100),
  vehicle_interest VARCHAR(255),
  status           VARCHAR(50) DEFAULT 'new',
  ai_score         INTEGER,
  last_contact     TIMESTAMPTZ,
  notes            TEXT,
  assigned_to      INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  assigned_name    VARCHAR(255),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Deals
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id               SERIAL PRIMARY KEY,
  customer_id      INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id       INTEGER NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  trade_in_id      INTEGER,
  sale_price       NUMERIC(12,2) NOT NULL,
  trade_in_value   NUMERIC(12,2) DEFAULT 0,
  fni_total        NUMERIC(12,2) DEFAULT 0,
  total_deal_value NUMERIC(12,2),
  profit_margin    NUMERIC(6,2),
  status           VARCHAR(50) DEFAULT 'pending',
  sales_person     VARCHAR(255),
  signed_at        TIMESTAMPTZ,
  funded_at        TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Trade-Ins
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_ins (
  id                    SERIAL PRIMARY KEY,
  customer_id           INTEGER REFERENCES customers(id),
  deal_id               INTEGER REFERENCES deals(id),
  year                  INTEGER,
  make                  VARCHAR(100),
  model                 VARCHAR(100),
  mileage               INTEGER,
  condition             VARCHAR(50),
  estimated_value       NUMERIC(12,2),
  actual_value          NUMERIC(12,2),
  reconditioning_cost   NUMERIC(12,2),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- F&I Products
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fni_products (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  category       VARCHAR(100),
  base_price     NUMERIC(12,2),
  cost           NUMERIC(12,2),
  coverage_term  VARCHAR(100),
  description    TEXT,
  active         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Service Appointments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_appointments (
  id                   SERIAL PRIMARY KEY,
  customer_id          INTEGER REFERENCES customers(id),
  vehicle_description  VARCHAR(500),
  service_type         VARCHAR(255),
  appointment_date     TIMESTAMPTZ,
  mileage_at_service   INTEGER,
  description          TEXT,
  status               VARCHAR(50) DEFAULT 'scheduled',
  total_cost           NUMERIC(12,2),
  technician           VARCHAR(255),
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Inspections
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
  id                   SERIAL PRIMARY KEY,
  vehicle_id           INTEGER REFERENCES inventory(id),
  inspection_type      VARCHAR(100),
  inspector            VARCHAR(255),
  inspection_date      TIMESTAMPTZ,
  engine_rating        VARCHAR(50),
  transmission_rating  VARCHAR(50),
  brakes_rating        VARCHAR(50),
  suspension_rating    VARCHAR(50),
  tires_rating         VARCHAR(50),
  exterior_rating      VARCHAR(50),
  interior_rating      VARCHAR(50),
  electrical_rating    VARCHAR(50),
  overall_score        INTEGER,
  issues_found         TEXT,
  reconditioning_cost  NUMERIC(12,2),
  passed               BOOLEAN DEFAULT FALSE,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Test Drives
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_drives (
  id                   SERIAL PRIMARY KEY,
  customer_id          INTEGER REFERENCES customers(id),
  vehicle_id           INTEGER REFERENCES inventory(id),
  customer_name        VARCHAR(255),
  vehicle_description  VARCHAR(500),
  scheduled_at         TIMESTAMPTZ,
  duration_minutes     INTEGER,
  route_type           VARCHAR(100),
  pre_drive_interest   INTEGER,
  post_drive_interest  INTEGER,
  feedback             TEXT,
  outcome              VARCHAR(100),
  sales_person         VARCHAR(255),
  notes                TEXT,
  status               VARCHAR(50) DEFAULT 'scheduled',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Follow-Ups (CRM)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follow_ups (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER REFERENCES leads(id),
  customer_id   INTEGER REFERENCES customers(id),
  customer_name VARCHAR(255),
  contact_type  VARCHAR(100),
  direction     VARCHAR(50),
  subject       VARCHAR(500),
  outcome       VARCHAR(255),
  sentiment     VARCHAR(50),
  priority      VARCHAR(50) DEFAULT 'medium',
  status        VARCHAR(50) DEFAULT 'pending',
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  sales_person  VARCHAR(255),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Campaigns
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                 SERIAL PRIMARY KEY,
  name               VARCHAR(255) NOT NULL,
  campaign_type      VARCHAR(100),
  channel            VARCHAR(100),
  target_audience    VARCHAR(255),
  budget             NUMERIC(12,2),
  spent              NUMERIC(12,2) DEFAULT 0,
  leads_generated    INTEGER DEFAULT 0,
  deals_closed       INTEGER DEFAULT 0,
  revenue_attributed NUMERIC(12,2) DEFAULT 0,
  impressions        INTEGER DEFAULT 0,
  clicks             INTEGER DEFAULT 0,
  conversion_rate    NUMERIC(6,2) DEFAULT 0,
  roi                NUMERIC(8,2) DEFAULT 0,
  start_date         DATE,
  end_date           DATE,
  status             VARCHAR(50) DEFAULT 'active',
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Commissions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id            SERIAL PRIMARY KEY,
  staff_id      INTEGER REFERENCES staff(id),
  deal_id       INTEGER REFERENCES deals(id),
  amount        NUMERIC(12,2),
  rate          NUMERIC(5,4),
  status        VARCHAR(50) DEFAULT 'pending',
  paid_at       TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Documents
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id           SERIAL PRIMARY KEY,
  deal_id      INTEGER REFERENCES deals(id),
  customer_id  INTEGER REFERENCES customers(id),
  name         VARCHAR(255),
  type         VARCHAR(100),
  file_url     TEXT,
  status       VARCHAR(50) DEFAULT 'pending',
  signed_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Audit Logs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER,
  action      VARCHAR(255) NOT NULL,
  details     JSONB,
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id  ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action   ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created  ON audit_logs(created_at);

-- ─────────────────────────────────────────────────────────────
-- AI Results — JSONB persistence for all AI feature outputs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_results (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  feature    VARCHAR(100) NOT NULL,
  input      JSONB,
  output     JSONB,
  model      VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results(feature);
CREATE INDEX IF NOT EXISTS idx_ai_results_user    ON ai_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Useful indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to  ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_customer_id  ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_vehicle_id   ON deals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deals_status       ON deals(status);
CREATE INDEX IF NOT EXISTS idx_inventory_status   ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_customers_email    ON customers(email);
