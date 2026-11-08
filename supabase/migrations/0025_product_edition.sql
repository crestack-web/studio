-- Authoritative product edition for Busmo Industries.
-- Values: business | hospitality | professional
-- user_metadata remains onboarding-only and must not override this column.

alter table public.businesses
  add column if not exists product_edition text;

comment on column public.businesses.product_edition is
  'Authoritative Busmo product edition: business | hospitality | professional. Resolved from organization, not user_metadata.';

update public.businesses
set product_edition = case
  when lower(coalesce(product_edition, '')) in ('business', 'hospitality', 'professional')
    then lower(product_edition)
  when lower(coalesce(metadata->>'product_edition', '')) in ('business', 'hospitality', 'professional')
    then lower(metadata->>'product_edition')
  when lower(coalesce(industry, '')) in ('hospitality', 'professional')
    then lower(industry)
  when lower(coalesce(category, '')) in ('hospitality', 'professional')
    then lower(category)
  when lower(coalesce(industry, '')) like '%hotel%' or lower(coalesce(category, '')) like '%hotel%'
    then 'hospitality'
  when lower(coalesce(industry, '')) like '%consult%'
    or lower(coalesce(category, '')) like '%agency%'
    or lower(coalesce(industry, '')) like '%professional%'
    then 'professional'
  else 'business'
end
where product_edition is null
   or product_edition = ''
   or lower(product_edition) not in ('business', 'hospitality', 'professional');

alter table public.businesses
  alter column product_edition set default 'business';

create index if not exists businesses_product_edition_idx
  on public.businesses (product_edition);
