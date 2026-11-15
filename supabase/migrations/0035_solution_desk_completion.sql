-- Busmo industry solutions: complete the native tables used by the live desk APIs.
-- Safe to re-run: every statement is additive / IF NOT EXISTS.

-- ─────────────────────────────────────────────────────────────────────────────
-- Healthcare: patient profiles (conditions, contact details, care team)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE healthcare_patients
  ADD COLUMN IF NOT EXISTS patient_code TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS sex TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_clinician_name TEXT,
  ADD COLUMN IF NOT EXISTS primary_clinician_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_patients_code
  ON healthcare_patients (business_id, patient_code)
  WHERE patient_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hc_patients_staff
  ON healthcare_patients (business_id, assigned_staff_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Healthcare: staff / clinicians directory
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS healthcare_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT,
  specialty TEXT,
  department TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  shift TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_staff_biz ON healthcare_staff (business_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Healthcare: clinical visits
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS healthcare_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  patient_id UUID REFERENCES healthcare_patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  appointment_id UUID REFERENCES healthcare_appointments(id) ON DELETE SET NULL,
  clinician_staff_id UUID,
  clinician_name TEXT,
  department TEXT,
  visit_type TEXT DEFAULT 'consultation',
  chief_complaint TEXT,
  diagnosis TEXT,
  notes TEXT,
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_visits_biz ON healthcare_visits (business_id);
CREATE INDEX IF NOT EXISTS idx_hc_visits_patient ON healthcare_visits (business_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_hc_visits_created ON healthcare_visits (business_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Healthcare: billing
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS healthcare_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  patient_id UUID REFERENCES healthcare_patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  visit_id UUID REFERENCES healthcare_visits(id) ON DELETE SET NULL,
  invoice_number TEXT,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payer TEXT DEFAULT 'Self-pay',
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft', 'sent', 'open', 'pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_billing_biz ON healthcare_billing (business_id);
CREATE INDEX IF NOT EXISTS idx_hc_billing_status ON healthcare_billing (business_id, status);
CREATE INDEX IF NOT EXISTS idx_hc_billing_created ON healthcare_billing (business_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_billing_number
  ON healthcare_billing (business_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

-- Extra appointment details used by the live desk screens.
ALTER TABLE healthcare_appointments
  ADD COLUMN IF NOT EXISTS clinician_staff_id UUID,
  ADD COLUMN IF NOT EXISTS clinician_name TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS room TEXT;

CREATE INDEX IF NOT EXISTS idx_hc_appts_clinician
  ON healthcare_appointments (business_id, clinician_staff_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Professional: client + task enrichment
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE professional_clients
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS retainer NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE professional_tasks
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS assignee TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_pro_tasks_status
  ON professional_tasks (business_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Education: richer student records (timetable / attendance / reporting)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE education_students
  ADD COLUMN IF NOT EXISTS admission_no TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS guardian TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_edu_students_admission
  ON education_students (business_id, admission_no)
  WHERE admission_no IS NOT NULL;

ALTER TABLE education_fee_payments
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS term TEXT,
  ADD COLUMN IF NOT EXISTS class_name TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_edu_fees_student
  ON education_fee_payments (business_id, student_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill timestamps for rows created before the columns existed.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE healthcare_patients
  SET updated_at = COALESCE(updated_at, created_at)
  WHERE updated_at IS NULL;

UPDATE professional_clients
  SET updated_at = COALESCE(updated_at, created_at)
  WHERE updated_at IS NULL;

UPDATE education_students
  SET enrolled_at = COALESCE(enrolled_at, created_at),
      updated_at = COALESCE(updated_at, created_at)
  WHERE enrolled_at IS NULL OR updated_at IS NULL;
