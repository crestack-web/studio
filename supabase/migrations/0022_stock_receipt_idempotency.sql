-- Idempotent stock receipts (prevent double-apply on retry)
alter table public.stock_receipts
  add column if not exists operation_id text,
  add column if not exists receipt_number text,
  add column if not exists supplier_id text,
  add column if not exists supplier_name text,
  add column if not exists total_cost numeric(14,2) default 0,
  add column if not exists payment_method text,
  add column if not exists metadata jsonb default '{}'::jsonb;

create unique index if not exists idx_stock_receipts_business_operation
  on public.stock_receipts (business_id, operation_id)
  where operation_id is not null and length(trim(operation_id)) > 0;

create index if not exists idx_stock_receipts_business_created
  on public.stock_receipts (business_id, created_at desc);
