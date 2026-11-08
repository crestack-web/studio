export type IndustryId = 'hospitality' | 'professional' | 'business';

export type IndustryNavItem = {
  id: string;
  label: string;
  href: string;
  section?: 'main' | 'operations' | 'finance' | 'settings';
};

export type IndustryMetric = {
  id: string;
  label: string;
  emptyValue: string;
  hint?: string;
};

export type IndustryQuickAction = {
  id: string;
  label: string;
  href: string;
};

export type IndustryConfig = {
  id: Exclude<IndustryId, 'business'>;
  productName: string;
  shortName: string;
  tagline: string;
  description: string;
  welcomePath: string;
  loginPath: string;
  signupPath: string;
  dashboardPath: string;
  features: string[];
  benefits: string[];
  nav: IndustryNavItem[];
  metrics: IndustryMetric[];
  quickActions: IndustryQuickAction[];
  greetingNoun: string;
};
