/**
 * Pricing for Busmo industry solutions (Healthcare, Hospitality, Professional, Education).
 * Amounts align with Busmo Business tiers for operational consistency.
 */
import type { IndustryId } from './types';

export type SolutionPlanId = 'starter' | 'standard' | 'pro';

export type SolutionPlan = {
  id: SolutionPlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  cta: string;
  features: string[];
};

export function formatSolutionNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

const SHARED_TRIAL = '14-day free trial';

const BASE_AMOUNTS = {
  starter: { monthly: 7_500, yearly: 75_000 },
  standard: { monthly: 20_000, yearly: 200_000 },
  pro: { monthly: 40_000, yearly: 400_000 },
} as const;

type SolutionPricingPack = {
  productName: string;
  headline: string;
  subhead: string;
  plans: SolutionPlan[];
};

function pack(
  productName: string,
  short: string,
  featureSets: [string[], string[], string[]]
): SolutionPricingPack {
  return {
    productName,
    headline: `Simple pricing for ${short}`,
    subhead: `Same clear tiers as Busmo Business. ${SHARED_TRIAL} on every plan.`,
    plans: [
      {
        id: 'starter',
        name: `${short} Start`,
        tagline: `Core ${short.toLowerCase()} operations`,
        monthlyPrice: BASE_AMOUNTS.starter.monthly,
        yearlyPrice: BASE_AMOUNTS.starter.yearly,
        cta: `Start ${short}`,
        features: [...featureSets[0], SHARED_TRIAL],
      },
      {
        id: 'standard',
        name: `${short} Control`,
        tagline: `Full control for growing teams`,
        monthlyPrice: BASE_AMOUNTS.standard.monthly,
        yearlyPrice: BASE_AMOUNTS.standard.yearly,
        popular: true,
        cta: `Get ${short} Control`,
        features: [...featureSets[1], SHARED_TRIAL],
      },
      {
        id: 'pro',
        name: `${short} Scale`,
        tagline: `Multi-location & advanced ops`,
        monthlyPrice: BASE_AMOUNTS.pro.monthly,
        yearlyPrice: BASE_AMOUNTS.pro.yearly,
        cta: `Get ${short} Scale`,
        features: [...featureSets[2], SHARED_TRIAL],
      },
    ],
  };
}

export const SOLUTION_PRICING: Record<
  Exclude<IndustryId, 'business'>,
  SolutionPricingPack
> = {
  healthcare: pack('Busmo Healthcare', 'Healthcare', [
    [
      'Patient records',
      'Appointments',
      'Visit logging',
      'Basic billing',
      'Clinical staff (limited)',
    ],
    [
      'Everything in Start',
      'Rooms / beds',
      'Medical supplies',
      'Full billing & payments',
      'Clinic revenue reports',
      'More staff seats',
    ],
    [
      'Everything in Control',
      'Multi-location clinics',
      'Advanced reporting',
      'Priority support',
      'Unlimited staff seats',
    ],
  ]),
  hospitality: pack('Busmo Hospitality', 'Hospitality', [
    [
      'Room inventory',
      'Reservations',
      'Guest check-in / out',
      'Basic front desk',
      'Limited staff access',
    ],
    [
      'Everything in Start',
      'Housekeeping status',
      'F&B sales (if enabled)',
      'Revenue reports',
      'More staff seats',
    ],
    [
      'Everything in Control',
      'Multi-property support',
      'Advanced reporting',
      'Priority support',
      'Unlimited staff seats',
    ],
  ]),
  professional: pack('Busmo Professional', 'Professional', [
    [
      'Clients',
      'Projects / engagements',
      'Basic invoicing',
      'Task list',
      'Limited team seats',
    ],
    [
      'Everything in Start',
      'Time tracking',
      'Retainers & outstanding',
      'Team workload',
      'More seats',
    ],
    [
      'Everything in Control',
      'Advanced reporting',
      'Multi-office ready',
      'Priority support',
      'Unlimited seats',
    ],
  ]),
  education: pack('Busmo Education', 'Education', [
    [
      'Students',
      'Fee collection',
      'Classes / cohorts',
      'Basic staff access',
      'Payment methods',
    ],
    [
      'Everything in Start',
      'Outstanding fees',
      'Materials / inventory (optional)',
      'Staff management',
      'Reports',
    ],
    [
      'Everything in Control',
      'Multi-campus',
      'Advanced reporting',
      'Priority support',
      'Unlimited staff',
    ],
  ]),
};

export function getSolutionPricing(industryId: string): SolutionPricingPack {
  const key = industryId as Exclude<IndustryId, 'business'>;
  return SOLUTION_PRICING[key] || SOLUTION_PRICING.professional;
}
