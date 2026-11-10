import { getIndustryConfig } from '@/lib/industries/config';
import { ProfessionalDesk } from '../../_components/ProfessionalDesk';

const config = getIndustryConfig('professional')!;

export const metadata = {
  title: `Staff desk · ${config.productName}`,
};

export default function Page() {
  return <ProfessionalDesk config={config} />;
}
