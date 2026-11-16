import type { Viewport } from 'next';
import '../../_design/solutions.css';
import { SolutionsCssLink } from '../../_design/loadSolutionsCss';
import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryDashboardClient } from '../../_components/IndustryDashboardClient';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function ProfessionalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  return (
    <>
      <SolutionsCssLink />
      <IndustryDashboardClient config={getIndustryConfig('professional')!} />
    </>
  );
}
