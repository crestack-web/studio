-- MO Sales credits: trial + purchased wallet + usage ledger
-- Business-scoped; never tied to WhatsApp connection for trial entitlement.

create table if not exists public.mo_credit_wallets (
  business_id text primary key references public.businesses(id) on delete cascade,
  trial_credits_granted integer not null default 0,
  trial_credits_used integer not null default 0,
  purchased_credits integer not null default 0,
  purchased_credits_used integer not null default 0,
  total_credits_used integer not null default 0,
  trial_started_at timestamptz,
  low_credit_notified_at timestamptz,
  empty_notified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mo_credit_wallets_nonneg check (
    trial_credits_granted >= 0
    and trial_credits_used >= 0
    and purchased_credits >= 0
    and purchased_credits_used >= 0
    and total_credits_used >= 0
    and trial_credits_used <= trial_credits_granted
    and purchased_credits_used <= purchased_credits
  )
);

create table if not exists public.mo_credit_ledger (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses(id) on delete cascade,
  type text not null,
  amount integer not null,
  balance_after integer not null,
  conversation_id text,
  message_id text,
  provider_message_id text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint mo_credit_ledger_type_check check (
    type in ('trial_grant', 'purchase', 'message_usage', 'refund', 'adjustment')
  )
);

create index if not exists mo_credit_ledger_business_created_idx
  on public.mo_credit_ledger (business_id, created_at desc);

create unique index if not exists mo_credit_ledger_usage_message_unique
  on public.mo_credit_ledger (business_id, message_id)
  where type = 'message_usage' and message_id is not null;

create unique index if not exists mo_credit_ledger_purchase_ref_unique
  on public.mo_credit_ledger ((metadata->>'payment_reference'))
  where type = 'purchase' and metadata->>'payment_reference' is not null;

create table if not exists public.mo_credit_packages (
  id text primary key,
  name text not null,
  credits integer not null check (credits > 0),
  price_kobo integer not null check (price_kobo >= 0),
  currency text not null default 'NGN',
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mo_credit_config (
  id text primary key default 'default',
  trial_credits integer not null default 100,
  credits_per_response integer not null default 1,
  low_credit_pct integer not null default 20,
  critical_credit_pct integer not null default 10,
  currency text not null default 'NGN',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.mo_credit_config (id) values ('default')
on conflict (id) do nothing;

insert into public.mo_credit_packages (id, name, credits, price_kobo, description, sort_order) values
  ('starter', 'Starter', 1000, 500000, '1,000 MO credits for growing reply volume', 10),
  ('growth', 'Growth', 5000, 2000000, '5,000 MO credits for busy stores', 20),
  ('scale', 'Scale', 10000, 3500000, '10,000 MO credits for high volume', 30)
on conflict (id) do nothing;

-- Available = remaining trial + remaining purchased
create or replace function public.mo_credits_available(w public.mo_credit_wallets)
returns integer
language sql
immutable
as $$
  select greatest(
    0,
    (w.trial_credits_granted - w.trial_credits_used)
    + (w.purchased_credits - w.purchased_credits_used)
  );
$$;

-- Atomic deduct for one MO response. Returns { ok, balance, ledger_id, error }.
create or replace function public.mo_credits_deduct_for_response(
  p_business_id text,
  p_amount integer,
  p_conversation_id text default null,
  p_message_id text default null,
  p_provider_message_id text default null,
  p_description text default 'MO response'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.mo_credit_wallets%rowtype;
  available integer;
  use_trial integer;
  use_purchased integer;
  new_balance integer;
  lid text;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  select * into w
  from public.mo_credit_wallets
  where business_id = p_business_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_wallet', 'balance', 0);
  end if;

  -- Idempotent: same inbound message already charged
  if p_message_id is not null then
    select id into lid
    from public.mo_credit_ledger
    where business_id = p_business_id
      and type = 'message_usage'
      and message_id = p_message_id
    limit 1;
    if lid is not null then
      available := public.mo_credits_available(w);
      return jsonb_build_object('ok', true, 'balance', available, 'ledger_id', lid, 'duplicate', true);
    end if;
  end if;

  available := public.mo_credits_available(w);
  if available < p_amount then
    return jsonb_build_object('ok', false, 'error', 'insufficient_credits', 'balance', available);
  end if;

  use_trial := least(p_amount, greatest(0, w.trial_credits_granted - w.trial_credits_used));
  use_purchased := p_amount - use_trial;

  update public.mo_credit_wallets set
    trial_credits_used = trial_credits_used + use_trial,
    purchased_credits_used = purchased_credits_used + use_purchased,
    total_credits_used = total_credits_used + p_amount,
    updated_at = now()
  where business_id = p_business_id
  returning * into w;

  new_balance := public.mo_credits_available(w);
  lid := gen_random_uuid()::text;

  insert into public.mo_credit_ledger (
    id, business_id, type, amount, balance_after,
    conversation_id, message_id, provider_message_id, description, metadata
  ) values (
    lid, p_business_id, 'message_usage', -p_amount, new_balance,
    p_conversation_id, p_message_id, p_provider_message_id, p_description,
    jsonb_build_object('from_trial', use_trial, 'from_purchased', use_purchased)
  );

  return jsonb_build_object(
    'ok', true,
    'balance', new_balance,
    'ledger_id', lid,
    'from_trial', use_trial,
    'from_purchased', use_purchased
  );
end;
$$;

-- Grant trial once per business
create or replace function public.mo_credits_ensure_trial(
  p_business_id text,
  p_trial_amount integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.mo_credit_wallets%rowtype;
  grant_amt integer;
  cfg_trial integer;
  new_balance integer;
  lid text;
begin
  select trial_credits into cfg_trial from public.mo_credit_config where id = 'default';
  grant_amt := coalesce(p_trial_amount, cfg_trial, 100);
  if grant_amt < 0 then grant_amt := 0; end if;

  insert into public.mo_credit_wallets (business_id, trial_credits_granted, trial_started_at)
  values (p_business_id, 0, null)
  on conflict (business_id) do nothing;

  select * into w from public.mo_credit_wallets where business_id = p_business_id for update;

  if w.trial_credits_granted > 0 then
    new_balance := public.mo_credits_available(w);
    return jsonb_build_object(
      'ok', true,
      'granted', false,
      'trial_credits_granted', w.trial_credits_granted,
      'balance', new_balance
    );
  end if;

  if grant_amt = 0 then
    return jsonb_build_object('ok', true, 'granted', false, 'trial_credits_granted', 0, 'balance', public.mo_credits_available(w));
  end if;

  update public.mo_credit_wallets set
    trial_credits_granted = grant_amt,
    trial_started_at = now(),
    updated_at = now()
  where business_id = p_business_id
  returning * into w;

  new_balance := public.mo_credits_available(w);
  lid := gen_random_uuid()::text;
  insert into public.mo_credit_ledger (
    id, business_id, type, amount, balance_after, description, metadata
  ) values (
    lid, p_business_id, 'trial_grant', grant_amt, new_balance,
    'MO Sales free trial credits',
    jsonb_build_object('trial', true)
  );

  return jsonb_build_object(
    'ok', true,
    'granted', true,
    'trial_credits_granted', grant_amt,
    'balance', new_balance,
    'ledger_id', lid
  );
end;
$$;

-- Grant purchased credits after verified payment
create or replace function public.mo_credits_grant_purchase(
  p_business_id text,
  p_credits integer,
  p_payment_reference text,
  p_package_id text default null,
  p_amount_kobo integer default null,
  p_currency text default 'NGN'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.mo_credit_wallets%rowtype;
  new_balance integer;
  lid text;
  existing text;
begin
  if p_credits is null or p_credits <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_credits');
  end if;
  if p_payment_reference is null or length(trim(p_payment_reference)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'payment_reference_required');
  end if;

  select id into existing
  from public.mo_credit_ledger
  where type = 'purchase'
    and metadata->>'payment_reference' = p_payment_reference
  limit 1;
  if existing is not null then
    select * into w from public.mo_credit_wallets where business_id = p_business_id;
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'ledger_id', existing,
      'balance', public.mo_credits_available(w)
    );
  end if;

  insert into public.mo_credit_wallets (business_id)
  values (p_business_id)
  on conflict (business_id) do nothing;

  select * into w from public.mo_credit_wallets where business_id = p_business_id for update;

  update public.mo_credit_wallets set
    purchased_credits = purchased_credits + p_credits,
    updated_at = now()
  where business_id = p_business_id
  returning * into w;

  new_balance := public.mo_credits_available(w);
  lid := gen_random_uuid()::text;
  insert into public.mo_credit_ledger (
    id, business_id, type, amount, balance_after, description, metadata
  ) values (
    lid, p_business_id, 'purchase', p_credits, new_balance,
    'Purchased MO credits',
    jsonb_build_object(
      'payment_reference', p_payment_reference,
      'package_id', p_package_id,
      'amount_kobo', p_amount_kobo,
      'currency', p_currency
    )
  );

  return jsonb_build_object('ok', true, 'ledger_id', lid, 'balance', new_balance, 'credits', p_credits);
end;
$$;

-- Refund usage when outbound send fails after deduct
create or replace function public.mo_credits_refund_usage(
  p_business_id text,
  p_message_id text,
  p_reason text default 'outbound_send_failed'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_row public.mo_credit_ledger%rowtype;
  w public.mo_credit_wallets%rowtype;
  refund_amt integer;
  from_trial integer;
  from_purchased integer;
  new_balance integer;
  lid text;
  existing text;
begin
  select * into usage_row
  from public.mo_credit_ledger
  where business_id = p_business_id
    and type = 'message_usage'
    and message_id = p_message_id
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'usage_not_found');
  end if;

  select id into existing
  from public.mo_credit_ledger
  where business_id = p_business_id
    and type = 'refund'
    and message_id = p_message_id
  limit 1;
  if existing is not null then
    select * into w from public.mo_credit_wallets where business_id = p_business_id;
    return jsonb_build_object('ok', true, 'duplicate', true, 'ledger_id', existing, 'balance', public.mo_credits_available(w));
  end if;

  refund_amt := abs(usage_row.amount);
  from_trial := coalesce((usage_row.metadata->>'from_trial')::int, 0);
  from_purchased := coalesce((usage_row.metadata->>'from_purchased')::int, refund_amt - from_trial);

  select * into w from public.mo_credit_wallets where business_id = p_business_id for update;

  update public.mo_credit_wallets set
    trial_credits_used = greatest(0, trial_credits_used - from_trial),
    purchased_credits_used = greatest(0, purchased_credits_used - from_purchased),
    total_credits_used = greatest(0, total_credits_used - refund_amt),
    updated_at = now()
  where business_id = p_business_id
  returning * into w;

  new_balance := public.mo_credits_available(w);
  lid := gen_random_uuid()::text;
  insert into public.mo_credit_ledger (
    id, business_id, type, amount, balance_after,
    conversation_id, message_id, provider_message_id, description, metadata
  ) values (
    lid, p_business_id, 'refund', refund_amt, new_balance,
    usage_row.conversation_id, p_message_id, usage_row.provider_message_id,
    coalesce(p_reason, 'Refund unused MO response credit'),
    jsonb_build_object('from_trial', from_trial, 'from_purchased', from_purchased, 'reason', p_reason)
  );

  return jsonb_build_object('ok', true, 'ledger_id', lid, 'balance', new_balance, 'refunded', refund_amt);
end;
$$;

alter table public.mo_credit_wallets enable row level security;
alter table public.mo_credit_ledger enable row level security;
alter table public.mo_credit_packages enable row level security;
alter table public.mo_credit_config enable row level security;

drop policy if exists mo_credit_wallets_member_read on public.mo_credit_wallets;
create policy mo_credit_wallets_member_read on public.mo_credit_wallets
  for select using (is_business_member(business_id) or is_admin());

drop policy if exists mo_credit_ledger_member_read on public.mo_credit_ledger;
create policy mo_credit_ledger_member_read on public.mo_credit_ledger
  for select using (is_business_member(business_id) or is_admin());

drop policy if exists mo_credit_packages_read on public.mo_credit_packages;
create policy mo_credit_packages_read on public.mo_credit_packages
  for select using (true);

drop policy if exists mo_credit_config_read on public.mo_credit_config;
create policy mo_credit_config_read on public.mo_credit_config
  for select using (true);
