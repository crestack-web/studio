import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryAuthForm } from '../../_components/IndustryAuthForm';

const config = getIndustryConfig('hospitality')!;

export const metadata = {
  title: `Sign in · ${config.productName}`,
};

export default function Page() {
  return <IndustryAuthForm config={config} mode="login" />;
}
