-- Busmo One: barcode uniqueness per business + terminal device registry

-- Unique barcode within a business (null barcodes allowed multiple times)
create unique index if not exists idx_products_business_barcode_unique
  on public.products (business_id, barcode)
  where barcode is not null and length(trim(barcode)) > 0;

create index if not exists idx_products_business_barcode_lookup
  on public.products (business_id, barcode)
  where barcode is not null;

-- Optional terminal device registry (owner can revoke devices later)
create table if not exists public.terminal_devices (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  branch_id text,
  device_label text,
  platform text not null default 'android',
  status text not null default 'active',
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_terminal_devices_business
  on public.terminal_devices (business_id);

comment on table public.terminal_devices is
  'Busmo One physical terminals registered to a business/branch';
