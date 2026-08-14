-- ============================================================
-- BUSMO — Firebase Firestore → Supabase migration
-- 0001_initial_schema.sql
-- Mirrors the Firestore collections described in
-- docs/backend.json and src/firestore.rules.
--
-- Conventions:
--   * `text` primary keys carry the original Firestore document id
--     (uuid-style ids are used only where the row maps to auth.users).
--   * Money columns are numeric(14,2), quantities are integer.
--   * `metadata jsonb` preserves fields not yet mapped to columns.
--   * RLS is enabled on every table; helpers below encode the
--     business-membership and admin rules from the Firestore rules.
-- ============================================================

-- ------------------------------------------------------------
-- Extensions & defaults
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Grants (anon/authenticated/service_role)
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- updated_at trigger helper
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- RLS helper functions
-- ------------------------------------------------------------
-- Is the current user a member/owner of the given business?
create or replace function public.is_business_member(business_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return (
    select exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and (
          u.business_id = $1
          or u.role in ('admin', 'superadmin')
        )
    )
    or exists (
      select 1
      from public.staff_permissions sp
      where sp.user_id = auth.uid()
        and sp.business_id = $1
    )
  );
end;
$$;

-- Is the current user an admin/superadmin?
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return (
    select exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'superadmin')
    )
  );
end;
$$;

-- ------------------------------------------------------------
-- users  (maps 1:1 to auth.users; firebase_uid kept for migration continuity)
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  firebase_uid text unique,
  email text unique,
  phone text,
  full_name text,
  avatar_url text,
  role text not null default 'user',            -- user | admin | superadmin
  plan text,                                     -- starter | pro | business ...
  business_id text,                              -- current/owned business
  status text not null default 'active',         -- active | suspended | pending
  email_verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.users enable row level security;

create policy "users_self_read" on public.users
  for select using (id = auth.uid() or is_admin());
create policy "users_self_update" on public.users
  for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy "users_admin_insert" on public.users
  for insert with check (is_admin());

-- auto-provision public.users row from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, email_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- businesses & business_profiles
-- ------------------------------------------------------------
create table public.businesses (
  id text primary key,
  owner_id uuid references public.users(id) on delete set null,
  name text,
  category text,                                -- retail | restaurant | fashion ...
  industry text,
  location text,
  description text,
  logo_url text,
  currency text not null default 'NGN',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.businesses enable row level security;

create policy "businesses_member_read" on public.businesses
  for select using (owner_id = auth.uid() or is_business_member(id) or is_admin());
create policy "businesses_owner_write" on public.businesses
  for insert with check (owner_id = auth.uid());
create policy "businesses_owner_update" on public.businesses
  for update using (owner_id = auth.uid() or is_admin()) with check (owner_id = auth.uid() or is_admin());

create table public.business_profiles (
  business_id text primary key references public.businesses(id) on delete cascade,
  opening_capital numeric(14,2),
  cash_available numeric(14,2),
  address text,
  phone text,
  email text,
  website text,
  social jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Subscription / access domain
-- ------------------------------------------------------------
create table public.plans (
  id text primary key,
  name text,
  price numeric(14,2),
  interval text,                                -- monthly | yearly
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  business_id text references public.businesses(id) on delete cascade,
  plan text,
  status text not null default 'active',        -- active | past_due | cancelled | trialing
  started_at timestamptz,
  expires_at timestamptz,
  provider text,                                -- paystack | whop ...
  provider_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_transactions (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  business_id text references public.businesses(id) on delete cascade,
  amount numeric(14,2),
  currency text not null default 'NGN',
  status text,
  provider text,
  provider_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.subscribers (
  id text primary key,
  email text,
  plan text,
  status text,
  created_at timestamptz not null default now()
);

create table public.staff_permissions (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  email text,
  token text,
  role text,
  status text not null default 'pending',       -- pending | accepted | revoked | expired
  invited_by uuid references public.users(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admins (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  email text,
  level text not null default 'support',
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- no policies: admins table is managed by service_role only

create table public.admin_permissions (
  id text primary key,
  admin_id text references public.admins(id) on delete cascade,
  resource text,
  actions text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.admin_permissions enable row level security;

-- ------------------------------------------------------------
-- Core business tables
-- ------------------------------------------------------------
create table public.products (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  name text,
  description text,
  category text,
  sku text,
  barcode text,
  price numeric(14,2) not null default 0,
  cost numeric(14,2) not null default 0,
  stock_level integer not null default 0,
  reorder_level integer not null default 0,
  unit text,
  image_url text,
  tags text[] not null default '{}',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  customer_id text,
  customer_name text,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(14,2) not null default 0,
  total_revenue numeric(14,2) not null default 0,
  profit numeric(14,2) not null default 0,
  payment_method text,
  cash_received numeric(14,2),
  change_due numeric(14,2),
  status text not null default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  category text,
  amount numeric(14,2) not null default 0,
  description text,
  payment_method text,
  receipt_url text,
  created_by uuid references public.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  type text,                                     -- sale | expense | credit | transfer ...
  category text,
  amount numeric(14,2) not null default 0,
  balance_after numeric(14,2),
  reference text,
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_adjustments (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  product_id text references public.products(id),
  change_qty integer not null default 0,
  reason text,
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.customers (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  name text,
  phone text,
  email text,
  address text,
  notes text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_customers (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  name text,
  phone text,
  email text,
  address text,
  credit_limit numeric(14,2) not null default 0,
  total_credit numeric(14,2) not null default 0,
  total_paid numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_transactions (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  customer_id text references public.credit_customers(id),
  type text not null default 'credit',           -- credit | payment
  amount numeric(14,2) not null default 0,
  payment_method text,
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.cash_flow (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  type text,                                    -- available | in_hand | inflow | outflow
  amount numeric(14,2) not null default 0,
  description text,
  category text,
  entry_date date,
  created_at timestamptz not null default now()
);

create table public.cash_reconciliations (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  expected_amount numeric(14,2) not null default 0,
  counted_amount numeric(14,2) not null default 0,
  difference numeric(14,2) not null default 0,
  note text,
  reconciled_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.staff (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  name text,
  role text,
  email text,
  phone text,
  salary numeric(14,2),
  active boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_activity (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  staff_id text references public.staff(id),
  action text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  name text,
  phone text,
  email text,
  address text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_credit (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  supplier_id text references public.suppliers(id),
  amount numeric(14,2) not null default 0,
  paid numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  status text not null default 'open',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchases (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  supplier_id text references public.suppliers(id),
  items jsonb not null default '[]'::jsonb,
  total numeric(14,2) not null default 0,
  paid numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  status text not null default 'pending',
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stock_receipts (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  purchase_id text references public.purchases(id),
  items jsonb not null default '[]'::jsonb,
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.orders (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  customer_name text,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  total numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  type text,
  title text,
  message text,
  read boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  participant_name text,
  participant_phone text,
  last_message text,
  unread_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_conversations (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_questions (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  question text,
  answer text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_trail (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  action text,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.bank_accounts (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  bank_name text,
  account_name text,
  account_number text,
  currency text not null default 'NGN',
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bank_transactions (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  account_id text references public.bank_accounts(id),
  type text,
  amount numeric(14,2) not null default 0,
  description text,
  balance_after numeric(14,2),
  reference text,
  created_at timestamptz not null default now()
);

create table public.payment_transactions (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  type text,                                    -- subscription | payout | sale
  amount numeric(14,2) not null default 0,
  currency text not null default 'NGN',
  status text,
  provider text,
  provider_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.payouts (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  amount numeric(14,2) not null default 0,
  status text not null default 'pending',
  provider text,
  provider_ref text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_requests (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  type text,
  subject text,
  message text,
  status text not null default 'open',
  assigned_to uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  staff_id text references public.staff(id),
  user_id uuid references public.users(id),
  check_in timestamptz,
  check_out timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table public.statements (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  period text,
  balance numeric(14,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.branches (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  name text,
  location text,
  phone text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mo_conversations (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mo_messages (
  id text primary key,
  conversation_id text references public.mo_conversations(id) on delete cascade,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  role text not null,                           -- user | assistant
  content text,
  tokens_used integer,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Storefront
-- ------------------------------------------------------------
create table public.store (
  business_id text primary key references public.businesses(id) on delete cascade,
  name text,
  slug text unique,
  tagline text,
  logo_url text,
  banner_url text,
  theme jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_products (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  product_id text references public.products(id),
  name text,
  description text,
  price numeric(14,2) not null default 0,
  compare_at_price numeric(14,2),
  images text[] not null default '{}',
  category text,
  tags text[] not null default '{}',
  stock integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_collections (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  name text,
  description text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_orders (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_address text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0,
  shipping numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkout_sessions (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  order_id text references public.store_orders(id),
  status text not null default 'open',
  amount numeric(14,2) not null default 0,
  provider text,
  provider_ref text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.store_analytics (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  date date,
  views integer not null default 0,
  visits integer not null default 0,
  orders integer not null default 0,
  revenue numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.store_shipping_zones (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  name text,
  regions text[] not null default '{}',
  rate numeric(14,2) not null default 0,
  free_over numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Marketplace (public read)
-- ------------------------------------------------------------
create table public.market_products (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  product_id text references public.products(id),
  name text,
  description text,
  price numeric(14,2) not null default 0,
  images text[] not null default '{}',
  category text,
  stock integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_banners (
  id text primary key,
  title text,
  subtitle text,
  image_url text,
  link_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.market_gif_banners (
  id text primary key,
  title text,
  gif_url text,
  link_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.market_categories (
  id text primary key,
  name text,
  slug text unique,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id text primary key,
  user_id uuid references public.users(id),
  business_id text references public.businesses(id) on delete cascade,
  product_id text references public.products(id),
  rating integer not null default 5,
  title text,
  content text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.blogs (
  id text primary key,
  author_id uuid references public.users(id),
  title text,
  slug text unique,
  excerpt text,
  content text,
  cover_image text,
  tags text[] not null default '{}',
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Referrals
-- ------------------------------------------------------------
create table public.referrals (
  id text primary key,
  referrer_id uuid references public.users(id) on delete cascade,
  referred_id uuid references public.users(id),
  referred_email text,
  status text not null default 'pending',
  reward numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referral_earnings (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  referral_id text references public.referrals(id),
  amount numeric(14,2) not null default 0,
  source text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referral_stats (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_referrals integer not null default 0,
  total_earned numeric(14,2) not null default 0,
  total_paid numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referral_payouts (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  status text not null default 'pending',
  provider text,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referral_codes (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  code text unique,
  visits integer not null default 0,
  signups integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Support / chat
-- ------------------------------------------------------------
create table public.support_tickets (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  business_id text references public.businesses(id) on delete cascade,
  subject text,
  message text,
  category text,
  status text not null default 'open',
  priority text not null default 'normal',
  assigned_to uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_messages (
  id text primary key,
  ticket_id text references public.support_tickets(id) on delete cascade,
  user_id uuid references public.users(id),
  sender_role text,                             -- user | admin | agent
  content text,
  attachments text[] not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.support_agents (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.chat_conversations (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  participant_name text,
  participant_phone text,
  last_message text,
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id text primary key,
  conversation_id text references public.chat_conversations(id) on delete cascade,
  sender text not null,                         -- user | business
  content text,
  message_type text not null default 'text',
  media_url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.delivery_agents (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text,
  phone text,
  vehicle text,
  active boolean not null default true,
  location jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Misc
-- ------------------------------------------------------------
create table public.coupons (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  code text unique,
  type text not null default 'percent',         -- percent | fixed
  value numeric(14,2) not null default 0,
  min_spend numeric(14,2),
  max_uses integer,
  used integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id text primary key,
  title text,
  content text,
  audience text not null default 'all',
  published_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.investments (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  business_id text references public.businesses(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  status text not null default 'pending',
  provider text,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_verifications (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id),
  document_type text,
  document_url text,
  status text not null default 'pending',
  note text,
  reviewed_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_visits (
  id text primary key,
  page text,
  user_id uuid references public.users(id),
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  name text,
  type text,
  audience text,
  message text,
  status text not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_calendar (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  title text,
  description text,
  platform text,
  scheduled_at timestamptz,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_profiles (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  platform text,
  handle text,
  url text,
  followers integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ugc_creators (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text,
  email text,
  niches text[] not null default '{}',
  rates jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ugc_videos (
  id text primary key,
  creator_id text references public.ugc_creators(id),
  business_id text references public.businesses(id) on delete cascade,
  title text,
  video_url text,
  thumbnail_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.ugc_orders (
  id text primary key,
  business_id text references public.businesses(id) on delete cascade,
  creator_id text references public.ugc_creators(id),
  user_id uuid references public.users(id),
  brief text,
  price numeric(14,2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.waitlist (
  id text primary key,
  email text,
  type text,                                    -- seller | investor
  business_name text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','businesses','business_profiles','plans','subscriptions','staff_permissions',
    'invitations','products','customers','credit_customers','staff','suppliers',
    'supplier_credit','purchases','orders','conversations','ai_conversations',
    'bank_accounts','payouts','service_requests','branches','mo_conversations',
    'store','store_products','store_collections','store_orders','store_shipping_zones',
    'market_products','blogs','referrals','referral_earnings','referral_payouts',
    'referral_codes','support_tickets','chat_conversations','investments',
    'business_verifications','campaigns','content_calendar','social_profiles',
    'ugc_creators','ugc_orders','referral_stats'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- Row Level Security policies
-- ------------------------------------------------------------

-- RLS for business-scoped tables (member/owner can CRUD)
do $$
declare t text;
begin
  foreach t in array array[
    'business_profiles','staff_permissions','invitations','products','sales','expenses',
    'transactions','inventory_adjustments','customers','credit_customers','credit_transactions',
    'cash_flow','cash_reconciliations','staff','staff_activity','suppliers','supplier_credit',
    'purchases','stock_receipts','orders','notifications','conversations','ai_conversations',
    'ai_questions','audit_trail','bank_accounts','bank_transactions','payment_transactions',
    'payouts','service_requests','attendance','statements','branches','mo_conversations',
    'mo_messages','store','store_products','store_collections','store_orders',
    'checkout_sessions','store_analytics','store_shipping_zones','coupons',
    'business_verifications','campaigns','content_calendar','social_profiles',
    'ugc_videos','ugc_orders','subscriptions','investments'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select using (is_business_member(business_id))',
      t || '_rls_select', t
    );
    execute format(
      'create policy %I on public.%I for insert with check (is_business_member(business_id))',
      t || '_rls_insert', t
    );
    execute format(
      'create policy %I on public.%I for update using (is_business_member(business_id)) with check (is_business_member(business_id))',
      t || '_rls_update', t
    );
    execute format(
      'create policy %I on public.%I for delete using (is_business_member(business_id))',
      t || '_rls_delete', t
    );
  end loop;
end $$;

-- Public-read marketplace tables (writes via service_role only)
do $$
declare t text;
begin
  foreach t in array array[
    'market_products','market_banners','market_gif_banners','market_categories','blogs',
    'announcements','plans','support_agents','delivery_agents'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select using (true)',
      t || '_rls_public_read', t
    );
  end loop;
end $$;

-- Marketplace products: owner can write
create policy market_products_rls_write on public.market_products
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

-- Support tickets/messages: user or business member or admin
alter table public.support_tickets enable row level security;
create policy support_tickets_rls_read on public.support_tickets
  for select using (user_id = auth.uid() or is_business_member(business_id) or is_admin());
create policy support_tickets_rls_write on public.support_tickets
  for insert with check (user_id = auth.uid() or is_admin());
create policy support_tickets_rls_update on public.support_tickets
  for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

alter table public.support_messages enable row level security;
create policy support_messages_rls_read on public.support_messages
  for select using (is_admin());
create policy support_messages_rls_write on public.support_messages
  for insert with check (is_admin());

-- Referral tables: user-scoped (no business_id)
alter table public.referrals enable row level security;
create policy referrals_rls_select on public.referrals
  for select using (referrer_id = auth.uid() or referred_id = auth.uid() or is_admin());
create policy referrals_rls_insert on public.referrals
  for insert with check (referrer_id = auth.uid() or is_admin());
create policy referrals_rls_update on public.referrals
  for update using (referrer_id = auth.uid() or referred_id = auth.uid() or is_admin())
  with check (referrer_id = auth.uid() or referred_id = auth.uid() or is_admin());

alter table public.referral_earnings enable row level security;
create policy referral_earnings_rls_select on public.referral_earnings
  for select using (user_id = auth.uid() or is_admin());

alter table public.referral_stats enable row level security;
create policy referral_stats_rls_select on public.referral_stats
  for select using (user_id = auth.uid() or is_admin());

alter table public.referral_payouts enable row level security;
create policy referral_payouts_rls_select on public.referral_payouts
  for select using (user_id = auth.uid() or is_admin());
create policy referral_payouts_rls_insert on public.referral_payouts
  for insert with check (user_id = auth.uid() or is_admin());

alter table public.referral_codes enable row level security;
create policy referral_codes_rls_select on public.referral_codes
  for select using (user_id = auth.uid() or is_admin());
create policy referral_codes_rls_insert on public.referral_codes
  for insert with check (user_id = auth.uid() or is_admin());
create policy referral_codes_rls_update on public.referral_codes
  for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

-- UGC creators: user-scoped
alter table public.ugc_creators enable row level security;
create policy ugc_creators_rls_select on public.ugc_creators
  for select using (user_id = auth.uid() or is_admin());
create policy ugc_creators_rls_insert on public.ugc_creators
  for insert with check (user_id = auth.uid() or is_admin());
create policy ugc_creators_rls_update on public.ugc_creators
  for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

-- Chat conversations: participants only
alter table public.chat_conversations enable row level security;
create policy chat_conversations_rls_read on public.chat_conversations
  for select using (user_id = auth.uid() or is_business_member(business_id));
create policy chat_conversations_rls_write on public.chat_conversations
  for insert with check (user_id = auth.uid() or is_business_member(business_id));
create policy chat_conversations_rls_update on public.chat_conversations
  for update using (user_id = auth.uid() or is_business_member(business_id)) with check (user_id = auth.uid() or is_business_member(business_id));

alter table public.chat_messages enable row level security;
create policy chat_messages_rls_read on public.chat_messages
  for select using (is_admin());
create policy chat_messages_rls_write on public.chat_messages
  for insert with check (is_admin());

-- Reviews: public read, authenticated user write
alter table public.reviews enable row level security;
create policy reviews_rls_read on public.reviews for select using (true);
create policy reviews_rls_write on public.reviews
  for insert with check (user_id = auth.uid());
create policy reviews_rls_update on public.reviews
  for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

-- Waitlist: public signup, service_role reads
alter table public.waitlist enable row level security;
create policy waitlist_rls_insert on public.waitlist for insert with check (true);

-- Admin-only tables (service_role manages)
alter table public.subscribers enable row level security;
alter table public.admin_permissions enable row level security;

-- Misc RLS for remaining tables
alter table public.page_visits enable row level security;
create policy page_visits_rls_insert on public.page_visits for insert with check (true);
create policy page_visits_rls_select on public.page_visits for select using (is_admin());

alter table public.notifications enable row level security;
-- notifications covered by business-scoped loop (has business_id)

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists idx_businesses_owner on public.businesses(owner_id);
create index if not exists idx_users_business on public.users(business_id);
create index if not exists idx_users_firebase_uid on public.users(firebase_uid);

do $$
declare t text;
begin
  foreach t in array array[
    'products','sales','expenses','transactions','inventory_adjustments','customers',
    'credit_customers','credit_transactions','cash_flow','cash_reconciliations','staff',
    'staff_activity','suppliers','supplier_credit','purchases','stock_receipts','orders',
    'notifications','conversations','ai_conversations','ai_questions','audit_trail',
    'bank_accounts','bank_transactions','payment_transactions','payouts','service_requests',
    'attendance','statements','branches','mo_conversations','mo_messages',
    'store_products','store_collections','store_orders','checkout_sessions','store_analytics',
    'store_shipping_zones','market_products','coupons','business_verifications','campaigns',
    'content_calendar','social_profiles','ugc_videos','ugc_orders',
    'investments','subscriptions','subscription_transactions',
    'suppliers','supplier_credit'
  ] loop
    execute format('create index if not exists %I on public.%I (business_id)', t || '_business_idx', t);
    execute format('create index if not exists %I on public.%I (created_at)', t || '_created_idx', t);
  end loop;
end $$;
