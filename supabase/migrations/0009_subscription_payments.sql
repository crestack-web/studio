-- Ensure subscription payment rows can be recorded idempotently from Paystack verifies
create unique index if not exists payment_transactions_provider_ref_unique
  on public.payment_transactions (provider_ref)
  where provider_ref is not null;

create index if not exists payment_transactions_type_created_idx
  on public.payment_transactions (type, created_at desc);

create index if not exists payment_transactions_status_idx
  on public.payment_transactions (status);
