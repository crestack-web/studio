-- Public hotel website + inbound bookings (source = website)

CREATE TABLE IF NOT EXISTS hospitality_websites (
  business_id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  published BOOLEAN NOT NULL DEFAULT false,
  property_name TEXT,
  tagline TEXT,
  about TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '12:00',
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  hero_image_url TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  booking_enabled BOOLEAN NOT NULL DEFAULT true,
  primary_color TEXT DEFAULT '#5b21b6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hosp_websites_slug ON hospitality_websites (slug);
CREATE INDEX IF NOT EXISTS idx_hosp_websites_published ON hospitality_websites (published) WHERE published = true;

-- Ensure bookings can mark website source (column may already exist from 0031)
ALTER TABLE hospitality_bookings
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'front_desk';
