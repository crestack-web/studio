import type { ProductEdition } from './resolve-edition';
import { pathForEdition, normalizeProductEdition } from './resolve-edition';

/**
 * Weak client-side hint from user_metadata only.
 * Prefer /api/industries/session after login for authoritative routing.
 */
export function postLoginPath(userMetadata?: Record<string, unknown> | null): string {
  const meta = userMetadata || {};
  const edition = normalizeProductEdition(
    meta.product_edition || meta.industry || meta.category || ''
  );
  return pathForEdition(edition as ProductEdition);
}

export function postLoginPathFromEdition(edition: ProductEdition | string): string {
  return pathForEdition(normalizeProductEdition(edition));
}
