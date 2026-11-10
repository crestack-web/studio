/**
 * Busmo Solutions & Enterprise pricing — industry-specific models.
 * Annual ≈ 10× monthly (≈ 2 months free). Education also supports term pricing.
 */

export type SolutionFamily =
  | 'business'
  | 'hospitality'
  | 'education'
  | 'professional'
  | 'healthcare'
  | 'enterprise';

export type SolutionPlanPublic = {
  id: string;
  name: string;
  capacity?: string;
  tagline: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  termPrice?: number | null;
  popular?: boolean;
  cta: string;
  features: string[];
  isFree?: boolean;
  isEnterprise?: boolean;
};

export type SolutionPricingPage = {
  family: SolutionFamily;
  productName: string;
  modelLabel: string;
  headline: string;
  subhead: string;
  billingNote: string;
  plans: SolutionPlanPublic[];
  addOns?: { name: string; model: string }[];
};

export function formatSolutionNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export const SOLUTION_PRICING: Record<
  'hospitality' | 'education' | 'professional' | 'healthcare',
  SolutionPricingPage
> = {
  hospitality: {
    family: 'hospitality',
    productName: 'Busmo Hospitality',
    modelLabel: 'Room capacity + properties',
    headline: 'Pricing built for hotels & hospitality',
    subhead:
      'Priced by room capacity so smaller properties start lean and larger hotels scale with operations.',
    billingNote:
      'Monthly billing suits hotels. Annual plans include ~2 months free. Channel managers, SMS and payment gateway fees are separate where used.',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        capacity: 'Up to 15 rooms',
        tagline: 'Guesthouses and small hotels',
        monthlyPrice: 25_000,
        yearlyPrice: 250_000,
        cta: 'Start Hospitality',
        features: [
          'Room management',
          'Reservations',
          'Guest records',
          'Check-in / check-out',
          'Basic billing',
          'Occupancy reports',
          '14-day free trial',
        ],
      },
      {
        id: 'growth',
        name: 'Growth',
        capacity: 'Up to 50 rooms',
        tagline: 'Busy hotels with F&B and staff',
        monthlyPrice: 60_000,
        yearlyPrice: 600_000,
        popular: true,
        cta: 'Get Growth',
        features: [
          'Everything in Starter',
          'Housekeeping',
          'Maintenance',
          'Staff management',
          'Restaurant billing',
          'Revenue reports',
          'Multiple room categories',
          '14-day free trial',
        ],
      },
      {
        id: 'professional',
        name: 'Professional',
        capacity: 'Up to 150 rooms',
        tagline: 'Multi-property ready operations',
        monthlyPrice: 150_000,
        yearlyPrice: 1_500_000,
        cta: 'Get Professional',
        features: [
          'Everything in Growth',
          'Advanced operational reports',
          'Multi-property support',
          'Advanced permissions',
          'Centralized reporting',
          'Advanced integrations',
          '14-day free trial',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        capacity: '150+ rooms / groups',
        tagline: 'Hotel groups & chains',
        monthlyPrice: null,
        yearlyPrice: null,
        isEnterprise: true,
        cta: 'Talk to sales',
        features: [
          'Hotel groups',
          'Multiple properties',
          'Centralized operations',
          'Custom workflows',
          'Dedicated support',
          'Integrations',
        ],
      },
    ],
    addOns: [
      { name: 'Additional property', model: 'Monthly' },
      { name: 'WhatsApp automation', model: 'Usage-based' },
      { name: 'Premium support', model: 'Monthly' },
    ],
  },
  education: {
    family: 'education',
    productName: 'Busmo Education',
    modelLabel: 'Active student enrollment',
    headline: 'Pricing built for schools',
    subhead:
      'Priced by active students. Support monthly, termly, and annual billing to match academic cycles.',
    billingNote:
      'Term pricing aligns with school calendars. Free plan covers up to 100 students.',
    plans: [
      {
        id: 'free',
        name: 'Free',
        capacity: 'Up to 100 students',
        tagline: 'Small schools getting started',
        monthlyPrice: 0,
        yearlyPrice: 0,
        termPrice: 0,
        isFree: true,
        cta: 'Start free',
        features: ['Students', 'Classes', 'Basic attendance', 'Basic fees', 'Staff records'],
      },
      {
        id: 'starter',
        name: 'Starter',
        capacity: 'Up to 200 students',
        tagline: 'Nursery to secondary entry',
        monthlyPrice: 15_000,
        yearlyPrice: 150_000,
        termPrice: 45_000,
        cta: 'Start Education',
        features: [
          'Students',
          'Classes',
          'Attendance',
          'Basic fees',
          'Results',
          'Staff records',
          '14-day free trial',
        ],
      },
      {
        id: 'growth',
        name: 'Growth',
        capacity: 'Up to 600 students',
        tagline: 'Growing schools with fee ops',
        monthlyPrice: 30_000,
        yearlyPrice: 300_000,
        termPrice: 90_000,
        popular: true,
        cta: 'Get Growth',
        features: [
          'Everything in Starter',
          'Parent portal',
          'Fee management',
          'Digital receipts',
          'Communication',
          'Report cards',
          'Financial reporting',
          '14-day free trial',
        ],
      },
      {
        id: 'professional',
        name: 'Professional',
        capacity: 'Up to 1,200 students',
        tagline: 'Larger schools & academies',
        monthlyPrice: 60_000,
        yearlyPrice: 600_000,
        termPrice: 180_000,
        cta: 'Get Professional',
        features: [
          'Everything in Growth',
          'Advanced analytics',
          'Academic management',
          'Custom reports',
          'Advanced permissions',
          'Integrations',
          '14-day free trial',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        capacity: '1,200+ / school groups',
        tagline: 'Multi-campus institutions',
        monthlyPrice: null,
        yearlyPrice: null,
        termPrice: null,
        isEnterprise: true,
        cta: 'Talk to sales',
        features: [
          'School groups',
          'Multiple campuses',
          'Centralized administration',
          'Dedicated onboarding',
          'Custom integrations',
        ],
      },
    ],
    addOns: [
      { name: 'Additional campus', model: 'Monthly' },
      { name: 'SMS / parent alerts', model: 'Usage-based' },
      { name: 'Data migration', model: 'One-time' },
    ],
  },
  professional: {
    family: 'professional',
    productName: 'Busmo Professional',
    modelLabel: 'Team seats + capabilities',
    headline: 'Pricing for project-based firms',
    subhead: 'Priced by team size for agencies, consultants, studios and construction teams.',
    billingNote: 'Annual plans include ~2 months free. Extra seats can be added without always jumping plans.',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        capacity: 'Up to 3 users',
        tagline: 'Solo operators and tiny teams',
        monthlyPrice: 15_000,
        yearlyPrice: 150_000,
        cta: 'Start Professional',
        features: ['Clients', 'Projects', 'Tasks', 'Scheduling', 'Basic billing', '14-day free trial'],
      },
      {
        id: 'team',
        name: 'Team',
        capacity: 'Up to 10 users',
        tagline: 'Collaborative project delivery',
        monthlyPrice: 40_000,
        yearlyPrice: 400_000,
        popular: true,
        cta: 'Get Team',
        features: [
          'Everything in Starter',
          'Team collaboration',
          'Time tracking',
          'Client communication',
          'Project budgets',
          'Invoicing',
          '14-day free trial',
        ],
      },
      {
        id: 'business',
        name: 'Business',
        capacity: 'Up to 30 users',
        tagline: 'Multi-team professional firms',
        monthlyPrice: 100_000,
        yearlyPrice: 1_000_000,
        cta: 'Get Business',
        features: [
          'Everything in Team',
          'Resource allocation',
          'Project profitability',
          'Advanced permissions',
          'Multiple teams',
          'Advanced analytics',
          '14-day free trial',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        capacity: 'Custom seats',
        tagline: 'Large organizations',
        monthlyPrice: null,
        yearlyPrice: null,
        isEnterprise: true,
        cta: 'Talk to sales',
        features: [
          'Multiple departments',
          'Custom workflows',
          'Integrations',
          'Centralized reporting',
          'Dedicated support',
        ],
      },
    ],
    addOns: [
      { name: 'Additional seats', model: 'Monthly' },
      { name: 'AI credits', model: 'Usage-based' },
      { name: 'Custom integrations', model: 'Implementation fee' },
    ],
  },
  healthcare: {
    family: 'healthcare',
    productName: 'Busmo Healthcare',
    modelLabel: 'Facility size + operational modules',
    headline: 'Pricing for clinic operations',
    subhead:
      'Administrative and operational software for clinics — patients, appointments, billing and facility ops.',
    billingNote:
      'Clinical records, lab and prescription modules may be packaged separately with proper safeguards. Annual ≈ 2 months free.',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        capacity: 'Small clinics',
        tagline: 'Patient admin & appointments',
        monthlyPrice: 40_000,
        yearlyPrice: 400_000,
        cta: 'Start Healthcare',
        features: [
          'Patient administration',
          'Appointments',
          'Visit logging',
          'Basic billing',
          'Staff scheduling basics',
          '14-day free trial',
        ],
      },
      {
        id: 'growth',
        name: 'Growth',
        capacity: 'Medium clinics',
        tagline: 'Full clinic operations',
        monthlyPrice: 100_000,
        yearlyPrice: 1_000_000,
        popular: true,
        cta: 'Get Growth',
        features: [
          'Everything in Starter',
          'Facility operations',
          'Pharmacy / supplies inventory',
          'Full billing & payments',
          'Revenue reporting',
          'More staff seats',
          '14-day free trial',
        ],
      },
      {
        id: 'professional',
        name: 'Professional',
        capacity: 'Larger clinics',
        tagline: 'High-volume facilities',
        monthlyPrice: 250_000,
        yearlyPrice: 2_500_000,
        cta: 'Get Professional',
        features: [
          'Everything in Growth',
          'Advanced reporting',
          'Advanced permissions',
          'Multi-module operations',
          'Priority support',
          '14-day free trial',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        capacity: 'Hospitals / groups',
        tagline: 'Hospital groups & networks',
        monthlyPrice: null,
        yearlyPrice: null,
        isEnterprise: true,
        cta: 'Talk to sales',
        features: [
          'Multi-facility groups',
          'Centralized administration',
          'Custom workflows',
          'Dedicated onboarding',
          'SLAs & integrations',
        ],
      },
    ],
    addOns: [
      { name: 'Additional location', model: 'Monthly' },
      { name: 'Premium support', model: 'Monthly' },
      { name: 'Data migration', model: 'One-time' },
    ],
  },
};

export const ENTERPRISE_PRICING = {
  productName: 'Busmo Enterprise',
  headline: 'Business infrastructure, not just a higher plan',
  subhead: 'Implementation, multi-location operations, SLAs and dedicated partnership.',
  indications: [
    { customer: 'Growing organization', software: 'From ₦250,000/mo', implementation: 'From ₦500,000' },
    { customer: 'Multi-location business', software: 'From ₦500,000/mo', implementation: 'From ₦1.5M' },
    { customer: 'Large organization', software: 'From ₦1M/mo', implementation: 'From ₦3M' },
    { customer: 'Enterprise group', software: 'Custom', implementation: 'Custom' },
  ],
  includes: [
    'Dedicated onboarding',
    'Data migration',
    'Multiple locations',
    'Advanced permissions',
    'Custom integrations',
    'Account management',
    'SLAs',
    'Training & custom reports',
  ],
};

export function getSolutionPricing(industryId: string): SolutionPricingPage {
  const key = industryId as keyof typeof SOLUTION_PRICING;
  return SOLUTION_PRICING[key] || SOLUTION_PRICING.professional;
}

export const PRICING_HUB = [
  {
    id: 'business',
    title: 'Busmo Business',
    model: 'Business size + features',
    href: '/pricing/business',
    blurb: 'Retail, wholesale and commerce — free to enterprise.',
    fromLabel: 'From ₦0',
  },
  {
    id: 'hospitality',
    title: 'Busmo Hospitality',
    model: 'Room capacity + locations',
    href: '/industries/hospitality#pricing',
    blurb: 'Hotels, guesthouses and resorts.',
    fromLabel: 'From ₦25,000/mo',
  },
  {
    id: 'education',
    title: 'Busmo Education',
    model: 'Student enrollment',
    href: '/industries/education#pricing',
    blurb: 'Schools with monthly, termly or annual billing.',
    fromLabel: 'From ₦0',
  },
  {
    id: 'professional',
    title: 'Busmo Professional',
    model: 'Team size + projects',
    href: '/industries/professional#pricing',
    blurb: 'Agencies, consultants and project firms.',
    fromLabel: 'From ₦15,000/mo',
  },
  {
    id: 'healthcare',
    title: 'Busmo Healthcare',
    model: 'Facility size + modules',
    href: '/industries/healthcare#pricing',
    blurb: 'Clinic operations — patients, appointments, billing.',
    fromLabel: 'From ₦40,000/mo',
  },
  {
    id: 'enterprise',
    title: 'Busmo Enterprise',
    model: 'Custom contracts',
    href: '/pricing#enterprise',
    blurb: 'Groups, implementation and SLAs.',
    fromLabel: 'Custom',
  },
] as const;
