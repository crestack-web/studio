/**
 * Busmo One launch configuration.
 * Early-access price is proposed — confirm before treating as finalized retail.
 */
export const BUSMO_ONE_CONFIG = {
  productName: 'Busmo One',
  tagline: 'Your business. One smart terminal.',
  /** Proposed founding customer / early-access price (NGN) — pending confirmation */
  earlyAccessPriceNgn: 249_000,
  /** Proposed regular retail (NGN) */
  regularPriceNgn: 299_000,
  priceConfirmed: false,
  promotionCode: 'BUSMO_ONE_FOUNDING_SCALE_2MO',
  promotionLabel: '2 months of Busmo Scale included',
  scalePlanName: 'Busmo Scale',
  statusOptions: ['submitted', 'contacted', 'confirmed', 'cancelled'] as const,
} as const;

export type BusmoOnePreorderStatus = (typeof BUSMO_ONE_CONFIG.statusOptions)[number];

export function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
