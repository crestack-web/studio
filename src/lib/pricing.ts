/**
 * Busmo Pricing — single source of truth for plan display names, amounts, and copy.
 *
 * Plan IDs (starter | standard | pro) are preserved for existing subscriptions,
 * feature gating, and Paystack/Firestore records. Only public-facing names and
 * prices change.
 *
 * Paystack plan codes in scripts/createPlans.js / Firestore `plans` collection
 * must be updated in the Paystack dashboard to match new amounts before
 * recurring billing uses the new prices for NEW subscribers. Existing
 * subscriptions remain on their original Paystack plan codes.
 */

export type PlanId = 'starter' | 'standard' | 'pro';

export interface BusmoPlan {
  id: PlanId;
  /** Public-facing name */
  name: string;
  /** Short positioning line */
  tagline: string;
  /** Outcome-focused description */
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  /** CTA label for primary actions */
  cta: string;
  popular?: boolean;
  /** Feature bullets for marketing/pricing UI (map existing capabilities only) */
  features: string[];
  /** Optional highlight features for richer cards */
  highlightFeatures?: string[];
}

/** One-time onboarding fee messaging (not charged automatically unless payment flow supports it). */
export const ONBOARDING = {
  fromAmount: 30000,
  label: 'One-time onboarding fee from ₦30,000',
  customLabel: 'Custom onboarding available',
  note: 'Exact amount varies based on business complexity.',
} as const;

export const POSITIONING = {
  headline: 'Control your business, even when you\'re not there.',
  subhead: 'Busmo gives business owners control over sales, stock, cash and staff.',
} as const;

/**
 * Canonical plan definitions.
 * Mapping: starter → Busmo Start, standard → Busmo Control, pro → Busmo Scale
 */
export const BUSMO_PLANS: BusmoPlan[] = [
  {
    id: 'starter',
    name: 'Busmo Start',
    tagline: 'For small businesses getting serious about tracking their business.',
    description: 'Get your business numbers organized.',
    monthlyPrice: 7500,
    yearlyPrice: 75000, // 10 months equivalent (2 months free)
    cta: 'Start with Busmo',
    features: [
      'Sales tracking',
      'Expenses',
      'Basic inventory',
      'Customers & suppliers',
      'Profit dashboard & basic reports',
      'Ask MO AI assistant',
      'Limited staff access',
      'Mobile access',
      '3-day free trial',
    ],
  },
  {
    id: 'standard',
    name: 'Busmo Control',
    tagline: 'For growing businesses that need control over sales, stock, cash and staff.',
    description: 'Take control of sales, stock, cash and staff.',
    monthlyPrice: 20000,
    yearlyPrice: 200000,
    cta: 'Get Busmo Control',
    popular: true,
    features: [
      'Everything in Start',
      'Cash-flow tracking',
      'Money Control',
      'Bank reconciliation',
      'Credit sales & supplier credit',
      'Staff accountability',
      'Menu, ingredients & expiry (restaurants)',
      'Advanced reporting',
      'More staff capacity',
      '3-day free trial',
    ],
  },
  {
    id: 'pro',
    name: 'Busmo Scale',
    tagline: 'For larger and multi-location businesses that need deeper operational control.',
    description: 'Run growing and multi-location operations with deeper control.',
    monthlyPrice: 40000,
    yearlyPrice: 400000,
    cta: 'Start Scaling',
    features: [
      'Everything in Control',
      'Multiple branches & locations',
      'Warehouse & stock transfers',
      'Payroll management',
      'Staff activity & audit trail',
      'Production tracking (manufacturing)',
      'Centralized multi-branch reporting',
      'Priority support',
      'Assisted onboarding',
      '3-day free trial',
    ],
  },
];

export const ENTERPRISE = {
  name: 'Enterprise',
  tagline: 'For businesses with complex operations, multiple locations or custom requirements.',
  cta: 'Talk to Sales',
  priceLabel: 'Custom',
} as const;

export function getPlanById(id: string | undefined | null): BusmoPlan {
  const plan = BUSMO_PLANS.find((p) => p.id === id);
  return plan ?? BUSMO_PLANS[0];
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/** Display name for a stored plan id (backward compatible with old names). */
export function planDisplayName(planIdOrName: string | undefined | null): string {
  if (!planIdOrName) return BUSMO_PLANS[0].name;
  const lower = planIdOrName.toLowerCase();
  if (lower.includes('pro') || lower.includes('scale')) return getPlanById('pro').name;
  if (lower.includes('standard') || lower.includes('control')) return getPlanById('standard').name;
  if (lower.includes('starter') || lower.includes('start')) return getPlanById('starter').name;
  return planIdOrName;
}
