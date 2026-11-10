import { getIndustryConfig } from '@/lib/industries/config';
import { HealthcareDesk } from '../../_components/HealthcareDesk';

const config = getIndustryConfig('healthcare')!;

export const metadata = {
  title: `Staff desk · ${config.productName}`,
};

export default function Page() {
  return <HealthcareDesk config={config} />;
}
