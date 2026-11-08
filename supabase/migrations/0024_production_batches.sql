-- Production batches: what a manufacturer is making, the raw materials used, and the finished outcome.
CREATE TABLE IF NOT EXISTS public.production_batches (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  product_name text NOT NULL,
  product_id text,
  planned_qty numeric(14,3) NOT NULL DEFAULT 0,
  actual_qty numeric(14,3),
  unit text NOT NULL DEFAULT 'pcs',
  status text NOT NULL DEFAULT 'planned',
  priority text NOT NULL DEFAULT 'medium',
  target_date date,
  started_at timestamptz,
  completed_at timestamptz,
  assigned_to text,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  material_cost numeric(14,2) NOT NULL DEFAULT 0,
  labor_cost numeric(14,2) NOT NULL DEFAULT 0,
  total_cost numeric(14,2) NOT NULL DEFAULT 0,
  unit_cost numeric(14,4),
  yield_percent numeric(8,2),
  notes text,
  stock_applied boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS production_batches_business_idx
  ON public.production_batches (business_id, created_at DESC);

ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'production_batches' AND policyname = 'production_batches_member_all'
  ) THEN
    CREATE POLICY production_batches_member_all ON public.production_batches
      FOR ALL
      USING (public.is_business_member(business_id) OR public.is_admin())
      WITH CHECK (public.is_business_member(business_id) OR public.is_admin());
  END IF;
EXCEPTION WHEN undefined_function THEN
  NULL;
END $$;
