import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryDashboardClient } from '../../../_components/IndustryDashboardClient';

export const dynamic = 'force-dynamic';

const config = getIndustryConfig('hospitality')!;

export default function Page() {
  return <IndustryDashboardClient config={config} section="hotel-settings" />;
}
