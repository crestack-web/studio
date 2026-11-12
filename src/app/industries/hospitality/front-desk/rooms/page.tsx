'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { HospitalityRoomsPage } from '../../../_components/hospitality/HospitalityModules';

const config = getIndustryConfig('hospitality')!;

export default function Page() {
  return <HospitalityRoomsPage config={config} />;
}
