-- Payroll entries + staff bank details for Paystack bulk salary transfers

alter table public.staff
  add column if not exists bank_name text,
  add column if not exists bank_code text,
  add column if not exists account_number text,
  add column if not exists account_name text,
  add column if not exists paystack_recipient_code text,
  add column if not exists status text default 'active';

create table if not exists public.payroll_entries (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  staff_id text references public.staff(id) on delete set null,
  staff_name text,
  staff_role text,
  period text not null,
  base_salary numeric(14,2) not null default 0,
  bonuses numeric(14,2) not null default 0,
  deductions numeric(14,2) not null default 0,
  overtime_hours numeric(10,2) not null default 0,
  overtime_rate numeric(14,2) not null default 0,
  overtime_pay numeric(14,2) not null default 0,
  net_salary numeric(14,2) not null default 0,
  status text not null default 'pending',
  paid_date timestamptz,
  paid_from_wallet boolean default false,
  wallet_reference text,
  paystack_transfer_code text,
  paystack_transfer_status text,
  bank_name text,
  bank_code text,
  account_number text,
  account_name text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payroll_entries_business on public.payroll_entries (business_id);
create index if not exists idx_payroll_entries_period on public.payroll_entries (business_id, period);
create index if not exists idx_payroll_entries_status on public.payroll_entries (business_id, status);

alter table public.payroll_entries enable row level security;

drop policy if exists "payroll_member_all" on public.payroll_entries;
create policy "payroll_member_all" on public.payroll_entries
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
