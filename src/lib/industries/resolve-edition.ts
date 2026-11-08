/**
 * Product edition resolution.
 *
 * Authoritative source: businesses.product_edition (organization record).
 * Fallbacks: businesses.industry, businesses.category, metadata.product_edition.
 * user_metadata is NEVER authoritative for access control.
 */

import type { IndustryId } from './types';
import { dashboardPathForEdition, isIndustryId } from './config';

export const PRODUCT_EDITIONS = [
  'business',
  'hospitality',
  'professional',
  'healthcare',
  'education',
] as const;
export type ProductEdition = (typeof PRODUCT_EDITIONS)[number];

export function normalizeProductEdition(raw: unknown): ProductEdition {
  const s = String(raw || '')
    .toLowerCase()
    .trim();
  if (s === 'hospitality' || s.includes('hotel') || (s.includes('hospitality') && !s.includes('hospital'))) {
    return 'hospitality';
  }
  if (
    s === 'professional' ||
    s.includes('consult') ||
    s.includes('agency') ||
    s.includes('professional')
  ) {
    return 'professional';
  }
  if (
    s === 'healthcare' ||
    s.includes('clinic') ||
    s.includes('hospital') ||
    s.includes('health') ||
    s.includes('medical')
  ) {
    return 'healthcare';
  }
  if (
    s === 'education' ||
    s.includes('school') ||
    s.includes('university') ||
    s.includes('college') ||
    s.includes('training') ||
    s.includes('education')
  ) {
    return 'education';
  }
  if (s === 'business' || s === 'sme' || s === 'retail') return 'business';
  return 'business';
}

export function editionFromBusinessRow(row: {
  product_edition?: string | null;
  industry?: string | null;
  category?: string | null;
  metadata?: Record<string, unknown> | null;
} | null | undefined): ProductEdition {
  if (!row) return 'business';
  const meta = (row.metadata || {}) as Record<string, unknown>;
  if (row.product_edition) return normalizeProductEdition(row.product_edition);
  if (meta.product_edition) return normalizeProductEdition(meta.product_edition);
  if (row.industry) return normalizeProductEdition(row.industry);
  if (row.category) return normalizeProductEdition(row.category);
  return 'business';
}

export function editionHintFromUserMetadata(
  meta: Record<string, unknown> | null | undefined
): ProductEdition | null {
  if (!meta) return null;
  const raw = meta.product_edition || meta.industry || meta.category;
  if (!raw) return null;
  return normalizeProductEdition(raw);
}

export function pathForEdition(edition: ProductEdition): string {
  return dashboardPathForEdition(edition === 'business' ? 'business' : edition);
}

export function assertEditionAccess(
  required: ProductEdition,
  actual: ProductEdition
): { ok: true } | { ok: false; redirectTo: string } {
  if (required === actual) return { ok: true };
  return { ok: false, redirectTo: pathForEdition(actual) };
}

export function isIndustryEdition(
  edition: ProductEdition
): edition is 'hospitality' | 'professional' | 'healthcare' | 'education' {
  return isIndustryId(edition);
}
