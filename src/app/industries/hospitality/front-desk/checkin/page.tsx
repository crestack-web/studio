'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { HospitalityCheckinPage } from '../../../_components/hospitality/HospitalityModules';

const config = getIndustryConfig('hospitality')!;

export default function Page() {
  return <HospitalityCheckinPage config={config} />;
}
