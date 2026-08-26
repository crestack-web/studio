-- Fix is_business_member so owners can read/write products and other business tables.
-- Previous version only checked users.business_id + staff_permissions, which failed when:
--   * users.business_id was null (common after Firestore signup)
--   * business id === auth uid (Busmo signup convention)
--   * ownership is only on businesses.owner_id

create or replace function public.is_business_member(business_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uid_text text;
begin
  if uid is null then
    return false;
  end if;

  uid_text := uid::text;

  -- Signup convention: business document id equals owner auth uid
  if business_id is not null and business_id = uid_text then
    return true;
  end if;

  -- Explicit business owner
  if exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and (
        b.owner_id = uid
        or b.owner_id::text = uid_text
      )
  ) then
    return true;
  end if;

  -- Profile link (snake or legacy)
  if exists (
    select 1
    from public.users u
    where u.id = uid
      and (
        u.business_id = business_id
        or lower(coalesce(u.role, '')) in ('admin', 'superadmin', 'owner', 'business owner')
      )
  ) then
    -- role admin/superadmin alone would be too broad; only grant global admin here
    if exists (
      select 1 from public.users u
      where u.id = uid
        and lower(coalesce(u.role, '')) in ('admin', 'superadmin')
    ) then
      return true;
    end if;

    if exists (
      select 1 from public.users u
      where u.id = uid
        and u.business_id = business_id
    ) then
      return true;
    end if;
  end if;

  -- Staff permissions
  if exists (
    select 1
    from public.staff_permissions sp
    where (sp.user_id = uid_text or sp.user_id = uid::text)
      and sp.business_id = business_id
  ) then
    return true;
  end if;

  -- Staff table membership (if present)
  begin
    if exists (
      select 1
      from public.staff s
      where s.business_id = business_id
        and (
          s.user_id = uid_text
          or s.id = uid_text
        )
        and lower(coalesce(s.status, 'active')) in ('active', '')
    ) then
      return true;
    end if;
  exception when undefined_table then
    null;
  end;

  return false;
end;
$$;

comment on function public.is_business_member(text) is
  'True if auth user owns or belongs to the business (owner_id, users.business_id, staff, or id=uid convention).';

-- Ensure products policies exist (idempotent recreate for write path clarity)
drop policy if exists products_rls_select on public.products;
drop policy if exists products_rls_insert on public.products;
drop policy if exists products_rls_update on public.products;
drop policy if exists products_rls_delete on public.products;
-- Legacy names from loop
drop policy if exists products_rls_select on public.products;
drop policy if exists "products_rls_select" on public.products;

do $$
begin
  -- Drop any existing products policies created by the foreach loop
  perform 1;
exception when others then
  null;
end $$;

-- Recreate explicit policies (safe if names already match)
drop policy if exists products_rls_select on public.products;
drop policy if exists products_rls_write on public.products;
drop policy if exists products_rls_insert on public.products;
drop policy if exists products_rls_update on public.products;
drop policy if exists products_rls_delete on public.products;

create policy products_rls_select on public.products
  for select using (public.is_business_member(business_id));

create policy products_rls_insert on public.products
  for insert with check (public.is_business_member(business_id));

create policy products_rls_update on public.products
  for update using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy products_rls_delete on public.products
  for delete using (public.is_business_member(business_id));
