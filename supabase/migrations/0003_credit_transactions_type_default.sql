-- 0003_credit_transactions_type_default.sql
-- Fixup: credit_transactions.type is NOT NULL without a default, but the
-- Firestore source data omits the field. Add a sensible default so the
-- remaining import passes and future inserts are safe.
alter table public.credit_transactions
  alter column type set default 'credit';
