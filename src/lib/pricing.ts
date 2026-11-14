/**
 * Busmo Pricing — single source of truth for plan display names, amounts, and copy.
 *
 * Architecture:
 *   Busmo Business  → size + features (Free / Starter / Growth / Business)
 *   Solutions       → industry models (see @/lib/industries/pricing)
 *   Enterprise      → custom contracts + implementation
 *
 * Plan IDs (starter | standard | pro) are preserved for existing subscriptions,
 * feature gating, and Paystack/Firestore records.
 * Public names: Starter, Growth (standard), Business (pro). Free is marketing-only until entitlements ship.
 */

export type PlanId = 'starter' | 'standard' | 'pro' | 'free';

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
  headline: "Control your business, even when you're not there.",
  subhead: 'Busmo gives business owners control over sales, stock, cash and staff.',
} as const;

/**
 * Black Friday / BFCM 2026 — applies to all paid SaaS plans when active.
 * End date inclusive through end of day WAT approximated as UTC end of day.
 */
export const BLACK_FRIDAY = {
  code: 'BLACKFRIDAY2026',
  label: 'Black Friday',
  /** Percent off list price (monthly + yearly) */
  percentOff: 40,
  /** ISO date strings — active from start through end (inclusive calendar days) */
  startsAt: '2026-11-14',
  endsAt: '2026-12-02',
  headline: 'Black Friday — 40% off every plan',
  subhead: 'Limited-time sale on Starter, Growth, and Business. Annual still saves ~2 months on top.',
  badge: '40% OFF',
} as const;

export function isBlackFridayActive(now: Date = new Date()): boolean {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const day = `${y}-${m}-${d}`;
  return day >= BLACK_FRIDAY.startsAt && day <= BLACK_FRIDAY.endsAt;
}

/** Sale amount in Naira (integer). */
export function applyPercentOff(listPrice: number, percentOff: number): number {
  if (!(listPrice > 0) || !(percentOff > 0)) return listPrice;
  return Math.max(0, Math.round(listPrice * (1 - percentOff / 100)));
}

export function getPlanListPrice(plan: BusmoPlan, billing: 'monthly' | 'yearly'): number {
  return billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
}

/** What the customer is charged right now (sale if BF active). */
export function getPlanChargePrice(
  plan: BusmoPlan,
  billing: 'monthly' | 'yearly',
  now: Date = new Date()
): { list: number; charge: number; saleActive: boolean; percentOff: number; promoCode: string | null } {
  const list = getPlanListPrice(plan, billing);
  const saleActive = isBlackFridayActive(now) && list > 0;
  const percentOff = saleActive ? BLACK_FRIDAY.percentOff : 0;
  const charge = saleActive ? applyPercentOff(list, percentOff) : list;
  return {
    list,
    charge,
    saleActive,
    percentOff,
    promoCode: saleActive ? BLACK_FRIDAY.code : null,
  };
}

/** Marketing Free tier — entitlements to be enforced when free product ships. */
export const FREE_PLAN = {
  id: 'free' as const,
  name: 'Free',
  tagline: 'For businesses starting out.',
  description: 'A real free product, not only a trial.',
  monthlyPrice: 0,
  yearlyPrice: 0,
  cta: 'Start free',
  features: [
    'Basic business profile',
    'Basic sales tracking',
    'Limited products',
    'Basic reports',
  ],
} as const;

export const BUSMO_PLANS: BusmoPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For small businesses getting serious about tracking their business.',
    description: 'Get your business numbers organized.',
    monthlyPrice: 5000,
    yearlyPrice: 50000, // 10 months
    cta: 'Get Starter',
    features: [
      'Sales & inventory tracking',
      'Basic reporting',
      'MO assistant',
      'Limited staff access',
      'Mobile access',
      '14-day free trial',
    ],
  },
  {
    id: 'standard',
    name: 'Growth',
    tagline: 'For growing businesses that need control over sales, stock, cash and staff.',
    description: 'Take control of sales, stock, cash and staff.',
    monthlyPrice: 15000,
    yearlyPrice: 150000,
    cta: 'Get Growth',
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
      '14-day free trial',
    ],
  },
  {
    id: 'pro',
    name: 'Business',
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
      '14-day free trial',
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
  if (lower.includes('pro') || lower.includes('scale') || lower === 'business') return getPlanById('pro').name;
  if (lower.includes('standard') || lower.includes('control') || lower.includes('growth'))
    return getPlanById('standard').name;
  if (lower.includes('starter') || lower.includes('start')) return getPlanById('starter').name;
  return planIdOrName;
}
