import { getIndustryConfig } from '@/lib/industries/config';
import { HospitalityStaffSection } from '../../../../_components/hospitality/HospitalityStaffSection';

const config = getIndustryConfig('hospitality')!;

export const metadata = {
  title: `Bookings · Front Desk · ${config.productName}`,
};

export default function Page() {
  return <HospitalityStaffSection config={config} section="bookings" />;
}
