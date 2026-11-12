'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryDashboardClient } from '../../_components/IndustryDashboardClient';

const config = getIndustryConfig('education')!;

/** Shell stays mounted across section routes so auth does not re-run. */
export default function EducationDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  return <IndustryDashboardClient config={config} />;
}
