-- Jobs & Projects module
BEGIN;

CREATE TABLE IF NOT EXISTS public.jobs (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  customer_id text REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  location text,
  description text,
  quoted_price numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'quoted'
    CHECK (status IN ('quoted','approved','deposit_paid','in_progress','ready','completed','cancelled')),
  expected_start_date date,
  expected_completion_date date,
  estimated_materials numeric(14,2) NOT NULL DEFAULT 0,
  estimated_labour numeric(14,2) NOT NULL DEFAULT 0,
  estimated_transport numeric(14,2) NOT NULL DEFAULT 0,
  estimated_other numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_business_id_idx ON public.jobs (business_id);
CREATE INDEX IF NOT EXISTS jobs_business_status_idx ON public.jobs (business_id, status);

CREATE TABLE IF NOT EXISTS public.job_costs (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  cost_type text NOT NULL DEFAULT 'other'
    CHECK (cost_type IN ('materials','labour','transport','installation','other')),
  description text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  cost_date date NOT NULL DEFAULT CURRENT_DATE,
  supplier_id text REFERENCES public.suppliers(id) ON DELETE SET NULL,
  expense_id text REFERENCES public.expenses(id) ON DELETE SET NULL,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  recorded_by_name text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_costs_job_id_idx ON public.job_costs (job_id);

CREATE TABLE IF NOT EXISTS public.job_payments (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash',
  note text,
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  recorded_by_name text,
  cash_flow_id text,
  transaction_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_payments_job_id_idx ON public.job_payments (job_id);

CREATE TABLE IF NOT EXISTS public.job_materials (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 0,
  unit_cost numeric(14,2) NOT NULL DEFAULT 0,
  total_cost numeric(14,2) NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  inventory_adjustment_id text,
  job_cost_id text REFERENCES public.job_costs(id) ON DELETE SET NULL,
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  recorded_by_name text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_materials_job_id_idx ON public.job_materials (job_id);

CREATE TABLE IF NOT EXISTS public.job_activity (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_activity_job_id_idx ON public.job_activity (job_id);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_activity ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jobs','job_costs','job_payments','job_materials','job_activity']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_member_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_business_member(business_id) OR public.is_admin()) WITH CHECK (public.is_business_member(business_id) OR public.is_admin())',
      t || '_member_all', t
    );
  END LOOP;
END $$;

COMMIT;
