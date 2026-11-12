'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import { HospitalityReservationsPage } from '../../../_components/hospitality/HospitalityModules';

const config = getIndustryConfig('hospitality')!;

export default function Page() {
  return <HospitalityReservationsPage config={config} />;
}
