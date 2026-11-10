import { getIndustryConfig } from '@/lib/industries/config';
import { EducationDesk } from '../../_components/EducationDesk';

const config = getIndustryConfig('education')!;

export const metadata = {
  title: `Staff desk · ${config.productName}`,
};

export default function Page() {
  return <EducationDesk config={config} />;
}
