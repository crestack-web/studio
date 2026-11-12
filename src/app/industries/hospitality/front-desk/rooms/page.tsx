'use client';

import { getIndustryConfig } from '@/lib/industries/config';
import {
  HospitalityReservationsPage,
  HospitalityRoomsPage,
  HospitalityGuestsPage,
  HospitalityCheckinPage,
} from '../../../_components/hospitality/HospitalityModules';

const config = getIndustryConfig('hospitality')!;

export default function Page() {
  const section = 'rooms' as const;
  if (section === 'bookings') return <HospitalityReservationsPage config={config} />;
  if (section === 'rooms') return <HospitalityRoomsPage config={config} />;
  if (section === 'guests') return <HospitalityGuestsPage config={config} />;
  return <HospitalityCheckinPage config={config} />;
}
