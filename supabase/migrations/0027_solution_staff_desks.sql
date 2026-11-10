-- Staff operational desks for Healthcare, Education, Professional
-- Branding is owner-managed; desks are staff-facing.

CREATE TABLE IF NOT EXISTS solution_branding (
  business_id UUID PRIMARY KEY,
  product_edition TEXT NOT NULL DEFAULT 'business',
  display_name TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Healthcare reception
CREATE TABLE IF NOT EXISTS healthcare_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hc_patients_biz ON healthcare_patients (business_id);

CREATE TABLE IF NOT EXISTS healthcare_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  patient_id UUID REFERENCES healthcare_patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  reason TEXT,
  amount NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hc_appts_biz ON healthcare_appointments (business_id);
CREATE INDEX IF NOT EXISTS idx_hc_appts_day ON healthcare_appointments (business_id, scheduled_at);

-- Education front office
CREATE TABLE IF NOT EXISTS education_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  class_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edu_students_biz ON education_students (business_id);

CREATE TABLE IF NOT EXISTS education_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  student_id UUID REFERENCES education_students(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'recorded'
    CHECK (status IN ('recorded', 'pending', 'reversed')),
  method TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edu_fees_biz ON education_fee_payments (business_id);

-- Professional staff workspace
CREATE TABLE IF NOT EXISTS professional_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pro_clients_biz ON professional_clients (business_id);

CREATE TABLE IF NOT EXISTS professional_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pro_tasks_biz ON professional_tasks (business_id);
