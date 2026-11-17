import type { IndustryId } from './types';

/** Canonical product icons used across solution auth, welcome and dashboard surfaces. */
export const SOLUTION_ICONS: Record<IndustryId, string> = {
  business: '/email-logo.png',
  hospitality: '/industries/busmo-hospitality-icon.svg',
  professional: '/industries/busmo-professional-icon.svg',
  healthcare: '/industries/busmo-healthcare-icon.svg',
  education: '/industries/busmo-education-icon.svg',
  agriculture: '/industries/busmo-agriculture-icon.svg',
};
