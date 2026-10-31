-- Busmo One pre-order / interest registrations (demand validation)
create table if not exists public.busmo_one_preorders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  business_name text not null,
  phone text not null,
  email text not null,
  business_type text,
  city_or_state text,
  quantity integer not null default 1 check (quantity >= 1 and quantity <= 50),
  message text,
  status text not null default 'submitted',
  promotion_code text,
  promotion_eligible boolean not null default true,
  understands_preorder boolean not null default false,
  source text default 'welcome_page',
  metadata jsonb not null default '{}'::jsonb,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_busmo_one_preorders_created on public.busmo_one_preorders (created_at desc);
create index if not exists idx_busmo_one_preorders_status on public.busmo_one_preorders (status);
create index if not exists idx_busmo_one_preorders_email on public.busmo_one_preorders (email);

alter table public.busmo_one_preorders enable row level security;

-- No public read; inserts only via service role API
