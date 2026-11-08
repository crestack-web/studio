import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryWelcome } from '../_components/IndustryWelcome';

const config = getIndustryConfig('professional')!;

export const metadata = {
  title: `${config.productName} · Busmo`,
  description: config.description,
};

export default function Page() {
  return <IndustryWelcome config={config} />;
}
