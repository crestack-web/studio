import type { Viewport } from 'next';
import '../../_design/solutions.css';
import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryDashboardClient } from '../../_components/IndustryDashboardClient';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

/**
 * Shell stays mounted across /dashboard and /dashboard/* so auth and chrome
 * do not re-run on every section switch.
 */
export default function EducationDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  return <IndustryDashboardClient config={getIndustryConfig('education')!} />;
}
