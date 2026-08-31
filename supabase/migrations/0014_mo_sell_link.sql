ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mo_sell_business_id text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mo_sell_store_url text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mo_sell_linked_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_businesses_mo_sell_business_id
  ON businesses (mo_sell_business_id)
  WHERE mo_sell_business_id IS NOT NULL;
