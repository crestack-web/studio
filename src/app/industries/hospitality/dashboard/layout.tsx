'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryDashboardClient } from '../../_components/IndustryDashboardClient';

const config = getIndustryConfig('hospitality')!;

/**
 * Shell stays mounted across /dashboard and /dashboard/* so auth and chrome
 * do not re-run on every section switch.
 */
export default function HospitalityDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // children are unused: routing still defines the URL, but the client shell
  // reads the pathname and renders the active module itself.
  void children;
  return <IndustryDashboardClient config={config} />;
}
