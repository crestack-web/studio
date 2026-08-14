-- ============================================================
-- BUSMO — Supabase Storage buckets
-- Mirrors the Firebase Storage layout (see storage.rules):
--   products/{businessId}/**      -> bucket "products"
--   apps/**                       -> bucket "apps"
--   storeProducts/{businessId}/** -> bucket "store-products"
-- plus generic buckets for avatars, expenses, logos, uploads.
--
-- NOTE: RLS on storage objects is set below using business_id
-- extracted from the object path. Objects uploaded outside a
-- business prefix are only accessible by the owner role.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('products', 'products', true),
  ('apps', 'apps', true),
  ('store-products', 'store-products', true),
  ('avatars', 'avatars', true),
  ('expenses', 'expenses', true),
  ('logos', 'logos', true),
  ('receipts', 'receipts', true),
  ('uploads', 'uploads', true),
  ('media', 'media', true)
on conflict (id) do nothing;

-- Helper: extract business_id from object path.
-- Storage path convention: {bucket}/{businessId}/...
create or replace function public.storage_business_id(bucket_name text, object_path text)
returns text
language sql
immutable
as $$
  select split_part(object_path, '/', 1)
  where bucket_name in ('products', 'store-products', 'expenses', 'receipts', 'media');
$$;

-- Public read for buckets marked public
create policy "public_read_products" on storage.objects for select
  using (bucket_id = 'products');
create policy "public_read_store_products" on storage.objects for select
  using (bucket_id = 'store-products');
create policy "public_read_apps" on storage.objects for select
  using (bucket_id = 'apps');
create policy "public_read_avatars" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "public_read_expenses" on storage.objects for select
  using (bucket_id = 'expenses');
create policy "public_read_logos" on storage.objects for select
  using (bucket_id = 'logos');
create policy "public_read_receipts" on storage.objects for select
  using (bucket_id = 'receipts');
create policy "public_read_uploads" on storage.objects for select
  using (bucket_id = 'uploads');
create policy "public_read_media" on storage.objects for select
  using (bucket_id = 'media');

-- Writes: business members may write under their own business prefix,
-- or users may write to the avatars/uploads buckets under their own uid.
create policy "member_write_products" on storage.objects for insert
  with check (
    bucket_id in ('products', 'store-products', 'expenses', 'receipts', 'media')
    and is_business_member(storage_business_id(bucket_id, name))
  );

create policy "user_write_avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

create policy "user_write_uploads" on storage.objects for insert
  with check (bucket_id = 'uploads' and split_part(name, '/', 1) = auth.uid()::text);

-- Updates/deletes follow the same ownership rules.
create policy "member_write_products_update" on storage.objects for update
  using (
    bucket_id in ('products', 'store-products', 'expenses', 'receipts', 'media')
    and is_business_member(storage_business_id(bucket_id, name))
  )
  with check (
    bucket_id in ('products', 'store-products', 'expenses', 'receipts', 'media')
    and is_business_member(storage_business_id(bucket_id, name))
  );

create policy "member_write_products_delete" on storage.objects for delete
  using (
    bucket_id in ('products', 'store-products', 'expenses', 'receipts', 'media')
    and is_business_member(storage_business_id(bucket_id, name))
  );

create policy "user_write_avatars_update" on storage.objects for update
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text)
  with check (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);

create policy "user_write_avatars_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text);
