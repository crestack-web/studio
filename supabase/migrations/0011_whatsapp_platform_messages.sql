-- Phase 5A: Platform messages without fake business_id
--
-- Goal:
--   Platform conversations already support business_id NULL + connection_id (0010).
--   Platform messages must also allow business_id NULL so inbound/outbound can persist
--   under conversation_id without inventing a merchant business.
--
-- Preserves:
--   - Existing merchant rows (all keep non-null business_id)
--   - FK to businesses (nullable FK still enforces value when present)
--   - Unique (provider, provider_message_id) idempotency index
--   - Merchant RLS: is_business_member(NULL) is false → platform rows stay hidden from merchants
--
-- Does NOT:
--   - Create fake businesses
--   - Change merchant MO / credits / agents
--   - Rewrite RLS for acquisition admin APIs (later)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. whatsapp_messages.business_id nullable for platform
-- ---------------------------------------------------------------------------

ALTER TABLE public.whatsapp_messages
  ALTER COLUMN business_id DROP NOT NULL;

-- Soft index for platform message scans by conversation
CREATE INDEX IF NOT EXISTS whatsapp_messages_conversation_null_biz_idx
  ON public.whatsapp_messages (conversation_id, created_at)
  WHERE business_id IS NULL;

-- ---------------------------------------------------------------------------
-- 2. RLS: no policy rewrite
-- ---------------------------------------------------------------------------
-- Existing: is_business_member(business_id) OR is_admin()
-- Platform rows (business_id NULL): merchants cannot SELECT via member policy.
-- Service role / webhook continues full access.

COMMIT;
