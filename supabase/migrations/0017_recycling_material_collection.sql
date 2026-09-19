-- Recycling & Material Collection (PET procurement / supplier weigh-in)
BEGIN;

CREATE TABLE IF NOT EXISTS public.recyclable_materials (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recyclable_materials_business_id_idx ON public.recyclable_materials (business_id);

CREATE TABLE IF NOT EXISTS public.material_prices (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  material_id text NOT NULL REFERENCES public.recyclable_materials(id) ON DELETE CASCADE,
  price_per_unit numeric(14,2) NOT NULL DEFAULT 0,
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS material_prices_material_id_idx ON public.material_prices (material_id);
CREATE INDEX IF NOT EXISTS material_prices_business_effective_idx ON public.material_prices (business_id, material_id, effective_from DESC);

CREATE TABLE IF NOT EXISTS public.material_purchases (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id text REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text NOT NULL,
  material_id text REFERENCES public.recyclable_materials(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  weight_kg numeric(14,3) NOT NULL DEFAULT 0,
  price_per_kg numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  amount_paid numeric(14,2) NOT NULL DEFAULT 0,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('paid','partial','unpaid')),
  payment_method text NOT NULL DEFAULT 'cash',
  note text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  recorded_by_name text,
  expense_id text,
  cash_flow_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS material_purchases_business_id_idx ON public.material_purchases (business_id);
CREATE INDEX IF NOT EXISTS material_purchases_supplier_id_idx ON public.material_purchases (supplier_id);
CREATE INDEX IF NOT EXISTS material_purchases_purchase_date_idx ON public.material_purchases (business_id, purchase_date DESC);

ALTER TABLE public.recyclable_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_purchases ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['recyclable_materials','material_prices','material_purchases']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_member_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_business_member(business_id) OR public.is_admin()) WITH CHECK (public.is_business_member(business_id) OR public.is_admin())',
      t || '_member_all', t
    );
  END LOOP;
END $$;

COMMIT;
