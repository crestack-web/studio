-- Fix storage path business id extraction.
-- Object names in bucket "products" should be {businessId}/file...
-- Legacy uploads used products/{businessId}/file (first segment was wrong).

create or replace function public.storage_business_id(bucket_name text, object_path text)
returns text
language sql
immutable
as $$
  select case
    when bucket_name in ('products', 'store-products', 'expenses', 'receipts', 'media')
      and split_part(object_path, '/', 1) in ('products', 'store-products', 'expenses', 'receipts', 'media')
      then nullif(split_part(object_path, '/', 2), '')
    when bucket_name in ('products', 'store-products', 'expenses', 'receipts', 'media')
      then nullif(split_part(object_path, '/', 1), '')
    else null
  end;
$$;

comment on function public.storage_business_id(text, text) is
  'Extract business id from storage object path: {businessId}/... or legacy {bucket}/{businessId}/...';
