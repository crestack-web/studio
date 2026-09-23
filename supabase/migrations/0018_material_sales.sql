-- Outbound material sales (PET buyers → recyclers / aggregators)
CREATE TABLE IF NOT EXISTS public.material_sales (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  material_id text REFERENCES public.recyclable_materials(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  buyer_name text,
  weight_kg numeric(14,3) NOT NULL DEFAULT 0,
  sell_price_per_kg numeric(14,4) NOT NULL DEFAULT 0,
  cost_per_kg numeric(14,4) NOT NULL DEFAULT 0,
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  cost_of_goods numeric(14,2) NOT NULL DEFAULT 0,
  profit numeric(14,2) NOT NULL DEFAULT 0,
  amount_received numeric(14,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash',
  sale_date date,
  note text,
  recorded_by text,
  recorded_by_name text,
  sale_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS material_sales_business_id_idx ON public.material_sales (business_id);
CREATE INDEX IF NOT EXISTS material_sales_sale_date_idx ON public.material_sales (business_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS material_sales_material_id_idx ON public.material_sales (material_id);

ALTER TABLE public.material_sales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'material_sales' AND policyname = 'material_sales_member_all'
  ) THEN
    CREATE POLICY material_sales_member_all ON public.material_sales
      FOR ALL
      USING (public.is_business_member(business_id) OR public.is_admin())
      WITH CHECK (public.is_business_member(business_id) OR public.is_admin());
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- fallback open policies if helpers missing in some envs
  NULL;
END $$;
