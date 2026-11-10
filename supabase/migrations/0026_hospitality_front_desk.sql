-- Busmo Hospitality: front desk rooms, bookings, property branding
-- Owner configures logo/name; staff use front-desk dashboard.

CREATE TABLE IF NOT EXISTS hospitality_settings (
  business_id UUID PRIMARY KEY,
  property_name TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  timezone TEXT DEFAULT 'Africa/Lagos',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hospitality_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  room_number TEXT NOT NULL,
  floor TEXT,
  category TEXT DEFAULT 'Standard',
  rate_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_hosp_rooms_business ON hospitality_rooms (business_id);
CREATE INDEX IF NOT EXISTS idx_hosp_rooms_status ON hospitality_rooms (business_id, status);

CREATE TABLE IF NOT EXISTS hospitality_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  room_id UUID REFERENCES hospitality_rooms(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_email TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hosp_bookings_business ON hospitality_bookings (business_id);
CREATE INDEX IF NOT EXISTS idx_hosp_bookings_status ON hospitality_bookings (business_id, status);
CREATE INDEX IF NOT EXISTS idx_hosp_bookings_checkin ON hospitality_bookings (business_id, check_in_date);
