-- Subscription / trial / grace fields on public.users
-- Aligns with record-subscription-payment unlocks and retention email cron.

alter table public.users
  add column if not exists subscription_status text,
  add column if not exists trial_start_date timestamptz,
  add column if not exists trial_end_date timestamptz,
  add column if not exists grace_end_date timestamptz,
  add column if not exists subscription_start_date timestamptz,
  add column if not exists subscription_end_date timestamptz;

create index if not exists idx_users_subscription_status
  on public.users (subscription_status);

create index if not exists idx_users_trial_end
  on public.users (trial_end_date)
  where trial_end_date is not null;

create index if not exists idx_users_grace_end
  on public.users (grace_end_date)
  where grace_end_date is not null;

create index if not exists idx_users_subscription_end
  on public.users (subscription_end_date)
  where subscription_end_date is not null;

comment on column public.users.subscription_status is
  'trial | grace | active | expired | pending_payment';
comment on column public.users.trial_end_date is
  'When the 3-day free trial ends';
comment on column public.users.grace_end_date is
  'When the post-trial 3-day free extension ends (dashboard gate)';
comment on column public.users.subscription_end_date is
  'Paid plan period end / next renewal due';
