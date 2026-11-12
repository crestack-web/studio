-- Busmo Hospitality PMS core extensions (African SME hotel / lodge)
-- Aligns closer to Cloudbeds/Mews core: rates on stay, adults, folio balance, room type

ALTER TABLE hospitality_bookings
  ADD COLUMN IF NOT EXISTS adults INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS children INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nights INT,
  ADD COLUMN IF NOT EXISTS rate_per_night NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'front_desk',
  ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Guest profiles (shared across stays)
CREATE TABLE IF NOT EXISTS hospitality_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  id_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hosp_guests_business ON hospitality_guests (business_id);
CREATE INDEX IF NOT EXISTS idx_hosp_guests_phone ON hospitality_guests (business_id, phone);

ALTER TABLE hospitality_bookings
  ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES hospitality_guests(id) ON DELETE SET NULL;

-- Folio line items (room charge, extras, payments)
CREATE TABLE IF NOT EXISTS hospitality_folio_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  booking_id UUID NOT NULL REFERENCES hospitality_bookings(id) ON DELETE CASCADE,
  line_type TEXT NOT NULL DEFAULT 'charge'
    CHECK (line_type IN ('charge', 'payment', 'adjustment')),
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hosp_folio_booking ON hospitality_folio_lines (booking_id);
