'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { SolutionBrandingForm } from '../../../_components/SolutionBrandingForm';

const config = getIndustryConfig('agriculture')!;

export default function Page() {
  return (
    <SolutionBrandingForm
      edition="agriculture"
      dashboardPath={config.dashboardPath}
      loginPath={config.loginPath}
      deskPath="/industries/agriculture/dashboard"
      noun="farm desk"
    />
  );
}
