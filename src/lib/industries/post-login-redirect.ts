/** Resolve post-login destination from user metadata. */
export function postLoginPath(userMetadata?: Record<string, unknown> | null): string {
  const meta = userMetadata || {};
  const edition = String(
    meta.product_edition || meta.industry || meta.category || ''
  ).toLowerCase();
  if (edition === 'hospitality') return '/industries/hospitality/dashboard';
  if (edition === 'professional') return '/industries/professional/dashboard';
  return '/owner';
}
