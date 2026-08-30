-- Central Busmo business wallet (NGN). Fund via Paystack; spend on credits, payroll, etc.

create table if not exists public.business_wallets (
  business_id text primary key references public.businesses(id) on delete cascade,
  balance_kobo bigint not null default 0 check (balance_kobo >= 0),
  currency text not null default 'NGN',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  type text not null, -- credit | debit
  amount_kobo bigint not null check (amount_kobo > 0),
  balance_after_kobo bigint not null,
  purpose text, -- fund | mo_credits | payroll | refund | adjustment
  reference text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint wallet_tx_type_check check (type in ('credit', 'debit'))
);

create unique index if not exists idx_wallet_tx_reference_unique
  on public.wallet_transactions (reference)
  where reference is not null and reference <> '';

create index if not exists idx_wallet_tx_business_created
  on public.wallet_transactions (business_id, created_at desc);

alter table public.business_wallets enable row level security;
alter table public.wallet_transactions enable row level security;

-- Owners can read their wallet; writes go through service role APIs
create policy "wallet_owner_read" on public.business_wallets
  for select using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "wallet_tx_owner_read" on public.wallet_transactions
  for select using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );
