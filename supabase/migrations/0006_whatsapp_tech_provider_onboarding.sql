-- Multi-tenant WhatsApp Tech Provider / Embedded Signup fields
-- Preserves existing trial connections (447860088970 etc.)

alter table public.whatsapp_connections
  add column if not exists onboarding_status text not null default 'not_connected',
  add column if not exists waba_id text,
  add column if not exists meta_business_id text,
  add column if not exists phone_number_id text,
  add column if not exists display_name text,
  add column if not exists phone_display text,
  add column if not exists country_code text,
  add column if not exists connected_at timestamptz,
  add column if not exists disconnected_at timestamptz,
  add column if not exists onboarding_error text;

-- Map existing rows into state machine without changing status='active' trial senders
update public.whatsapp_connections
set onboarding_status = case
  when status = 'active' then 'active'
  when status = 'pending' then 'sender_registration_pending'
  when status = 'failed' then 'failed'
  else coalesce(nullif(onboarding_status, ''), 'not_connected')
end
where onboarding_status = 'not_connected' or onboarding_status is null;

create index if not exists whatsapp_connections_waba_idx
  on public.whatsapp_connections (waba_id)
  where waba_id is not null;

create index if not exists whatsapp_connections_onboarding_status_idx
  on public.whatsapp_connections (onboarding_status);

-- Lightweight per-business usage counters (provider cost attribution later)
create table if not exists public.whatsapp_usage_daily (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses(id) on delete cascade,
  day date not null default (timezone('utc', now()))::date,
  inbound_count integer not null default 0,
  outbound_count integer not null default 0,
  mo_replies_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  unique (business_id, day)
);

create index if not exists whatsapp_usage_daily_business_idx
  on public.whatsapp_usage_daily (business_id, day desc);

alter table public.whatsapp_usage_daily enable row level security;
