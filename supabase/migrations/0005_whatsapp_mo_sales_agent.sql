-- WhatsApp MO Sales Agent V1 (Infobip)
-- Multi-tenant ready: sender → business mapping + conversation/message store with idempotency

create table if not exists public.whatsapp_connections (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses(id) on delete cascade,
  provider text not null default 'infobip',
  whatsapp_sender text not null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, whatsapp_sender)
);

create index if not exists whatsapp_connections_business_idx
  on public.whatsapp_connections (business_id);

create table if not exists public.whatsapp_conversations (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses(id) on delete cascade,
  customer_phone text not null,
  provider text not null default 'infobip',
  agent_status text not null default 'ai_active',
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, customer_phone, provider)
);

create index if not exists whatsapp_conversations_business_phone_idx
  on public.whatsapp_conversations (business_id, customer_phone);

create table if not exists public.whatsapp_messages (
  id text primary key default gen_random_uuid()::text,
  conversation_id text not null references public.whatsapp_conversations(id) on delete cascade,
  business_id text not null references public.businesses(id) on delete cascade,
  provider text not null default 'infobip',
  provider_message_id text,
  direction text not null,
  message_type text not null default 'text',
  message_text text,
  processing_status text not null default 'received',
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists whatsapp_messages_provider_msg_unique
  on public.whatsapp_messages (provider, provider_message_id)
  where provider_message_id is not null;

create index if not exists whatsapp_messages_conversation_idx
  on public.whatsapp_messages (conversation_id, created_at);

alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;

drop policy if exists whatsapp_connections_member_read on public.whatsapp_connections;
create policy whatsapp_connections_member_read on public.whatsapp_connections
  for select using (is_business_member(business_id) or is_admin());

drop policy if exists whatsapp_conversations_member_read on public.whatsapp_conversations;
create policy whatsapp_conversations_member_read on public.whatsapp_conversations
  for select using (is_business_member(business_id) or is_admin());

drop policy if exists whatsapp_messages_member_read on public.whatsapp_messages;
create policy whatsapp_messages_member_read on public.whatsapp_messages
  for select using (is_business_member(business_id) or is_admin());
