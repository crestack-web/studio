'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { SolutionBrandingForm } from '../../../_components/SolutionBrandingForm';

const config = getIndustryConfig('professional')!;

export default function Page() {
  return (
    <SolutionBrandingForm
      edition="professional"
      dashboardPath={config.dashboardPath}
      loginPath={config.loginPath}
      deskPath="/industries/professional/front-desk"
      noun="workspace"
    />
  );
}
