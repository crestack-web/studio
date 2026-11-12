CREATE TABLE IF NOT EXISTS hospitality_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'front_desk'
    CHECK (role IN ('front_desk', 'housekeeping', 'manager', 'security', 'other')),
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, email)
);
CREATE INDEX IF NOT EXISTS idx_hosp_staff_biz ON hospitality_staff (business_id);
CREATE INDEX IF NOT EXISTS idx_hosp_staff_email ON hospitality_staff (email);
