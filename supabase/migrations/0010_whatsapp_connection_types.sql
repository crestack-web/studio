-- Phase 2: WhatsApp connection types / agent profiles (schema only)
--
-- Goal:
--   merchant connection → business_id required → merchant_sales (existing)
--   platform connection → business_id NULL → busmo_acquisition (future)
--
-- Does NOT change webhook, MO agent, credits, or application behavior.
-- Existing merchant rows keep connection_type=merchant, agent_profile=merchant_sales.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. whatsapp_connections: type + profile + nullable business_id for platform
-- ---------------------------------------------------------------------------

ALTER TABLE public.whatsapp_connections
  ADD COLUMN IF NOT EXISTS connection_type text NOT NULL DEFAULT 'merchant',
  ADD COLUMN IF NOT EXISTS agent_profile text NOT NULL DEFAULT 'merchant_sales';

-- Existing rows: defaults already applied; force-normalize any unexpected nulls
UPDATE public.whatsapp_connections
SET
  connection_type = COALESCE(NULLIF(connection_type, ''), 'merchant'),
  agent_profile = COALESCE(NULLIF(agent_profile, ''), 'merchant_sales')
WHERE connection_type IS NULL
   OR agent_profile IS NULL
   OR connection_type = ''
   OR agent_profile = '';

-- Allow platform rows without a merchant business (no fake business).
-- FK to businesses remains; NULL is valid for nullable FKs.
ALTER TABLE public.whatsapp_connections
  ALTER COLUMN business_id DROP NOT NULL;

-- Drop constraints if re-running migration partially
ALTER TABLE public.whatsapp_connections
  DROP CONSTRAINT IF EXISTS whatsapp_connections_connection_type_check;

ALTER TABLE public.whatsapp_connections
  DROP CONSTRAINT IF EXISTS whatsapp_connections_agent_profile_check;

ALTER TABLE public.whatsapp_connections
  DROP CONSTRAINT IF EXISTS whatsapp_connections_type_business_chk;

ALTER TABLE public.whatsapp_connections
  ADD CONSTRAINT whatsapp_connections_connection_type_check
  CHECK (connection_type IN ('merchant', 'platform'));

ALTER TABLE public.whatsapp_connections
  ADD CONSTRAINT whatsapp_connections_agent_profile_check
  CHECK (agent_profile IN ('merchant_sales', 'busmo_acquisition'));

-- Ownership relationship:
--   merchant → business_id required
--   platform → business_id must be null
ALTER TABLE public.whatsapp_connections
  ADD CONSTRAINT whatsapp_connections_type_business_chk
  CHECK (
    (connection_type = 'merchant' AND business_id IS NOT NULL)
    OR
    (connection_type = 'platform' AND business_id IS NULL)
  );

-- Sender uniqueness (provider, whatsapp_sender) is already UNIQUE on the table
-- from 0005 — do not drop or replace.

CREATE INDEX IF NOT EXISTS whatsapp_connections_connection_type_idx
  ON public.whatsapp_connections (connection_type);

CREATE INDEX IF NOT EXISTS whatsapp_connections_agent_profile_idx
  ON public.whatsapp_connections (agent_profile);

-- ---------------------------------------------------------------------------
-- 2. whatsapp_conversations: connection_id (nullable) + optional null business
-- ---------------------------------------------------------------------------

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS connection_id text
    REFERENCES public.whatsapp_connections(id) ON DELETE SET NULL;

-- Best-effort backfill: map each merchant conversation to one connection
-- for the same business_id + provider (prefer active, then most recently updated).
UPDATE public.whatsapp_conversations c
SET connection_id = sub.conn_id
FROM (
  SELECT DISTINCT ON (wc.business_id, wc.provider)
    wc.business_id,
    wc.provider,
    wc.id AS conn_id
  FROM public.whatsapp_connections wc
  WHERE wc.connection_type = 'merchant'
    AND wc.business_id IS NOT NULL
  ORDER BY
    wc.business_id,
    wc.provider,
    CASE WHEN wc.status = 'active' THEN 0 ELSE 1 END,
    wc.updated_at DESC NULLS LAST,
    wc.created_at DESC NULLS LAST
) sub
WHERE c.connection_id IS NULL
  AND c.business_id = sub.business_id
  AND c.provider = sub.provider;

CREATE INDEX IF NOT EXISTS whatsapp_conversations_connection_id_idx
  ON public.whatsapp_conversations (connection_id)
  WHERE connection_id IS NOT NULL;

-- Allow future platform conversations without a merchant business.
-- Application code for merchants still always sets business_id (unchanged).
ALTER TABLE public.whatsapp_conversations
  ALTER COLUMN business_id DROP NOT NULL;

-- Platform scope rule: if there is no business, there must be a connection.
ALTER TABLE public.whatsapp_conversations
  DROP CONSTRAINT IF EXISTS whatsapp_conversations_scope_chk;

ALTER TABLE public.whatsapp_conversations
  ADD CONSTRAINT whatsapp_conversations_scope_chk
  CHECK (
    business_id IS NOT NULL
    OR connection_id IS NOT NULL
  );

-- Uniqueness strategy (staged, non-destructive):
-- 1) Keep existing UNIQUE (business_id, customer_phone, provider) for merchant rows.
--    PostgreSQL UNIQUE treats NULLs as distinct, so it does not protect platform rows.
-- 2) Add partial unique index on (connection_id, customer_phone, provider)
--    for rows that have connection_id — authoritative for platform and preferred for merchant.
--
-- Merchant path continues to use business_id uniqueness as today.
-- Platform path (connection_id set, business_id null) is protected by the partial index.

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_conversations_connection_phone_provider_uidx
  ON public.whatsapp_conversations (connection_id, customer_phone, provider)
  WHERE connection_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. whatsapp_messages: no change this phase
-- ---------------------------------------------------------------------------
-- business_id remains NOT NULL.
-- Platform messages will be introduced when app code writes them via
-- conversation_id → connection_id (later phase). Leaving FK/RLS intact avoids
-- weakening merchant isolation or forcing app changes.

-- ---------------------------------------------------------------------------
-- 4. RLS: no policy rewrite this phase
-- ---------------------------------------------------------------------------
-- Existing policies use is_business_member(business_id) OR is_admin().
-- Platform rows with business_id NULL are not visible to merchant members
-- (is_business_member(NULL) is false); admins and service-role still can access.
-- Tightening platform-only policies belongs with admin acquisition APIs later.

COMMIT;
