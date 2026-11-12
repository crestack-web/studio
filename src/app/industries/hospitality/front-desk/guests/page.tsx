'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { HospitalityGuestsPage } from '../../../_components/hospitality/HospitalityModules';

const config = getIndustryConfig('hospitality')!;

export default function Page() {
  return <HospitalityGuestsPage config={config} />;
}
