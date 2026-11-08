import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryDashboardClient } from '../../_components/IndustryDashboardClient';

const config = getIndustryConfig('education')!;

export const metadata = {
  title: `${config.productName} · Dashboard`,
};

export default function Page() {
  return <IndustryDashboardClient config={config} />;
}
