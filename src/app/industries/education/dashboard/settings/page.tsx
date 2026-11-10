'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { SolutionBrandingForm } from '../../../_components/SolutionBrandingForm';

const config = getIndustryConfig('education')!;

export default function Page() {
  return (
    <SolutionBrandingForm
      edition="education"
      dashboardPath={config.dashboardPath}
      loginPath={config.loginPath}
      deskPath="/industries/education/front-desk"
      noun="front office"
    />
  );
}
