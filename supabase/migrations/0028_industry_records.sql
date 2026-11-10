-- Unified operational records for solution modules (launch-ready CRUD)
CREATE TABLE IF NOT EXISTS industry_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  product_edition TEXT NOT NULL,
  module TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  amount NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_industry_records_biz_mod
  ON industry_records (business_id, product_edition, module, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_industry_records_status
  ON industry_records (business_id, module, status);
