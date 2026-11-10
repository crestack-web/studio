-- Phase 1: solution membership roles + RLS for industry tables (0026–0028)
-- REVIEW before apply. Policies use auth.uid() and solution_members / businesses.owner_id.

CREATE TABLE IF NOT EXISTS solution_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'desk', 'readonly')),
  product_edition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_solution_members_user ON solution_members (user_id);
CREATE INDEX IF NOT EXISTS idx_solution_members_biz ON solution_members (business_id);

-- Helper: is member of business (owner of businesses row OR solution_members)
CREATE OR REPLACE FUNCTION public.is_solution_member(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = p_business_id AND b.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM solution_members m
    WHERE m.business_id = p_business_id AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.solution_member_role(p_business_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = p_business_id AND b.owner_id = auth.uid()
    ) THEN 'owner'
    ELSE (
      SELECT m.role FROM solution_members m
      WHERE m.business_id = p_business_id AND m.user_id = auth.uid()
      LIMIT 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_mutate_solution(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.solution_member_role(p_business_id) IN ('owner', 'desk');
$$;

-- Enable RLS on industry tables
ALTER TABLE IF EXISTS hospitality_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hospitality_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hospitality_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS solution_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS healthcare_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS healthcare_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS professional_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS professional_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS industry_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS solution_members ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if re-run
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'hospitality_settings','hospitality_rooms','hospitality_bookings',
        'solution_branding','healthcare_patients','healthcare_appointments',
        'education_students','education_fee_payments','professional_clients',
        'professional_tasks','industry_records','solution_members'
      )
      AND policyname LIKE 'solution_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- solution_members: members can read own rows; only owner can manage
CREATE POLICY solution_members_select ON solution_members
  FOR SELECT USING (user_id = auth.uid() OR public.is_solution_member(business_id));

CREATE POLICY solution_members_write ON solution_members
  FOR ALL USING (public.solution_member_role(business_id) = 'owner')
  WITH CHECK (public.solution_member_role(business_id) = 'owner');

-- Generic pattern: SELECT if member; write if owner or desk
CREATE POLICY solution_hosp_settings_select ON hospitality_settings
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_hosp_settings_write ON hospitality_settings
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_hosp_rooms_select ON hospitality_rooms
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_hosp_rooms_write ON hospitality_rooms
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_hosp_bookings_select ON hospitality_bookings
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_hosp_bookings_write ON hospitality_bookings
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_branding_select ON solution_branding
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_branding_write ON solution_branding
  FOR ALL USING (public.solution_member_role(business_id) = 'owner')
  WITH CHECK (public.solution_member_role(business_id) = 'owner');

CREATE POLICY solution_hc_patients_select ON healthcare_patients
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_hc_patients_write ON healthcare_patients
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_hc_appts_select ON healthcare_appointments
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_hc_appts_write ON healthcare_appointments
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_edu_students_select ON education_students
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_edu_students_write ON education_students
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_edu_fees_select ON education_fee_payments
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_edu_fees_write ON education_fee_payments
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_pro_clients_select ON professional_clients
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_pro_clients_write ON professional_clients
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_pro_tasks_select ON professional_tasks
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_pro_tasks_write ON professional_tasks
  FOR ALL USING (public.can_mutate_solution(business_id))
  WITH CHECK (public.can_mutate_solution(business_id));

CREATE POLICY solution_records_select ON industry_records
  FOR SELECT USING (public.is_solution_member(business_id));
CREATE POLICY solution_records_write ON industry_records
  FOR ALL USING (public.solution_member_role(business_id) = 'owner')
  WITH CHECK (public.solution_member_role(business_id) = 'owner');
