import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryAuthForm } from '../../_components/IndustryAuthForm';

const config = getIndustryConfig('education')!;

export const metadata = {
  title: `Sign in · ${config.productName}`,
};

export default function Page() {
  return <IndustryAuthForm config={config} mode="login" />;
}
