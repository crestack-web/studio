'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { SolutionBrandingForm } from '../../../_components/SolutionBrandingForm';

const config = getIndustryConfig('healthcare')!;

export default function Page() {
  return (
    <SolutionBrandingForm
      edition="healthcare"
      dashboardPath={config.dashboardPath}
      loginPath={config.loginPath}
      deskPath="/industries/healthcare/front-desk"
      noun="reception"
    />
  );
}
