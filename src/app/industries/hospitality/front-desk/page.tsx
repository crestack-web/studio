import { getIndustryConfig } from '@/lib/industries/config';
import { FrontDeskDashboard } from '../../_components/FrontDeskDashboard';

const config = getIndustryConfig('hospitality')!;

export const metadata = {
  title: `Front Desk · ${config.productName}`,
};

export default function Page() {
  return <FrontDeskDashboard config={config} mode="staff" embedded />;
}
