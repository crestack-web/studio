-- Phase 5B: Busmo acquisition leads (minimal CRM for platform WhatsApp MO)
--
-- Goal:
--   Persist prospect identity + conversational stage for the acquisition agent.
--   Scoped to platform acquisition only — no merchant business linkage.
--
-- Does NOT:
--   - Declare signed_up / activated / converted as MO-writable terminal states
--   - Touch merchant tables, credits, or product catalog
--   - Enable cold/bulk outbound messaging

BEGIN;

CREATE TABLE IF NOT EXISTS public.busmo_leads (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                 text NOT NULL,
  normalized_phone      text NOT NULL,
  name                  text,
  business_name         text,
  business_type         text,
  needs                 text,
  pain_points           text,
  recommended_plan      text,
  stage                 text NOT NULL DEFAULT 'new'
                        CHECK (stage IN (
                          'new',
                          'engaged',
                          'qualified',
                          'signup_started',
                          'signed_up',
                          'activated',
                          'converted',
                          'handed_off'
                        )),
  source                text NOT NULL DEFAULT 'whatsapp',
  source_connection_id  uuid REFERENCES public.whatsapp_connections(id) ON DELETE SET NULL,
  campaign              text,
  handoff_reason        text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- One lead per normalized phone for acquisition identity
CREATE UNIQUE INDEX IF NOT EXISTS busmo_leads_normalized_phone_uidx
  ON public.busmo_leads (normalized_phone);

CREATE INDEX IF NOT EXISTS busmo_leads_stage_idx
  ON public.busmo_leads (stage);

CREATE INDEX IF NOT EXISTS busmo_leads_source_connection_idx
  ON public.busmo_leads (source_connection_id)
  WHERE source_connection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS busmo_leads_updated_at_idx
  ON public.busmo_leads (updated_at DESC);

ALTER TABLE public.busmo_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS busmo_leads_admin_all ON public.busmo_leads;
CREATE POLICY busmo_leads_admin_all
  ON public.busmo_leads
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- No is_business_member policy — acquisition leads have no business_id.

COMMIT;
