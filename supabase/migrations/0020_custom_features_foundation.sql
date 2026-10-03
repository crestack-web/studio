-- ============================================================
-- Busmo Custom Features foundation (AI feature-builder readiness)
-- Schema only — no user-facing product surface yet.
-- Tenant isolation via business_id + is_business_member RLS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.custom_features (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'testing', 'published', 'archived')),
  nav_label text,
  nav_section text,
  icon_key text,
  created_by text,
  published_at timestamptz,
  archived_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, slug, version)
);

CREATE INDEX IF NOT EXISTS custom_features_business_id_idx
  ON public.custom_features (business_id);
CREATE INDEX IF NOT EXISTS custom_features_business_status_idx
  ON public.custom_features (business_id, status);

CREATE TABLE IF NOT EXISTS public.custom_feature_records (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  feature_id text NOT NULL REFERENCES public.custom_features(id) ON DELETE CASCADE,
  entity_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text,
  created_by text,
  updated_by text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_feature_records_business_idx
  ON public.custom_feature_records (business_id);
CREATE INDEX IF NOT EXISTS custom_feature_records_feature_entity_idx
  ON public.custom_feature_records (feature_id, entity_key);

-- Generic EAV-style storage for future multi-entity features
CREATE TABLE IF NOT EXISTS public.custom_feature_versions (
  id text PRIMARY KEY,
  feature_id text NOT NULL REFERENCES public.custom_features(id) ON DELETE CASCADE,
  business_id text NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  version integer NOT NULL,
  definition jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'testing', 'published', 'archived')),
  created_by text,
  change_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feature_id, version)
);

CREATE INDEX IF NOT EXISTS custom_feature_versions_feature_idx
  ON public.custom_feature_versions (feature_id);

ALTER TABLE public.custom_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_feature_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_feature_versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_features' AND policyname = 'custom_features_member_all'
  ) THEN
    CREATE POLICY custom_features_member_all ON public.custom_features
      FOR ALL
      USING (public.is_business_member(business_id) OR public.is_admin())
      WITH CHECK (public.is_business_member(business_id) OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_feature_records' AND policyname = 'custom_feature_records_member_all'
  ) THEN
    CREATE POLICY custom_feature_records_member_all ON public.custom_feature_records
      FOR ALL
      USING (public.is_business_member(business_id) OR public.is_admin())
      WITH CHECK (public.is_business_member(business_id) OR public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_feature_versions' AND policyname = 'custom_feature_versions_member_all'
  ) THEN
    CREATE POLICY custom_feature_versions_member_all ON public.custom_feature_versions
      FOR ALL
      USING (public.is_business_member(business_id) OR public.is_admin())
      WITH CHECK (public.is_business_member(business_id) OR public.is_admin());
  END IF;
EXCEPTION WHEN undefined_function THEN
  NULL;
END $$;
