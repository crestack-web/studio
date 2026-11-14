/**
 * Busmo One launch configuration.
 */
import { applyPercentOff, isBlackFridayActive, BLACK_FRIDAY } from '@/lib/pricing';

export const BUSMO_ONE_CONFIG = {
  productName: 'Busmo One',
  tagline: 'Your business. One smart terminal.',
  /** List / pre-order price (NGN) */
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
  statusOptions: ['submitted', 'pending_payment', 'paid', 'contacted', 'confirmed', 'cancelled'] as const,
  /** Extra Black Friday off terminal list price when BF is active */
  blackFridayPercentOff: 15,
} as const;

export type BusmoOnePreorderStatus = (typeof BUSMO_ONE_CONFIG.statusOptions)[number];

export function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/** What the buyer pays for one terminal right now. */
export function getBusmoOneChargePrice(now: Date = new Date()): {
  list: number;
  charge: number;
  saleActive: boolean;
  percentOff: number;
  promoCode: string | null;
} {
  const list = BUSMO_ONE_CONFIG.launchPriceNgn;
  const bf = isBlackFridayActive(now);
  const percentOff = bf ? BUSMO_ONE_CONFIG.blackFridayPercentOff : 0;
  const charge = bf ? applyPercentOff(list, percentOff) : list;
  return {
    list,
    charge,
    saleActive: bf,
    percentOff,
    promoCode: bf ? BLACK_FRIDAY.code : null,
  };
}

/** Bundle value shown for discount storytelling: terminal + Scale year */
export function bundleValueNgn(): number {
  return BUSMO_ONE_CONFIG.launchPriceNgn + BUSMO_ONE_CONFIG.scaleAnnualValueNgn;
}

export function savingsNgn(): number {
  return BUSMO_ONE_CONFIG.scaleAnnualValueNgn;
}
