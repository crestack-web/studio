/**
 * Busmo One launch configuration.
 */
export const BUSMO_ONE_CONFIG = {
  productName: 'Busmo One',
  tagline: 'Your business. One smart terminal.',
  /** Pre-order / launch price (NGN) */
  launchPriceNgn: 299_000,
  /**
   * Reference value of 12 months Busmo Scale (for discount display only).
   * Align with current Scale list price when known; used to show combined value.
   */
  scaleAnnualValueNgn: 120_000,
  priceConfirmed: true,
  promotionCode: 'BUSMO_ONE_SCALE_1YR',
  promotionLabel: '1 year of Busmo Scale free',
  promotionMonths: 12,
  scalePlanName: 'Busmo Scale',
  statusOptions: ['submitted', 'contacted', 'confirmed', 'cancelled'] as const,
} as const;

export type BusmoOnePreorderStatus = (typeof BUSMO_ONE_CONFIG.statusOptions)[number];

export function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/** Bundle value shown for discount storytelling: terminal + Scale year */
export function bundleValueNgn(): number {
  return BUSMO_ONE_CONFIG.launchPriceNgn + BUSMO_ONE_CONFIG.scaleAnnualValueNgn;
}

export function savingsNgn(): number {
  return BUSMO_ONE_CONFIG.scaleAnnualValueNgn;
}
