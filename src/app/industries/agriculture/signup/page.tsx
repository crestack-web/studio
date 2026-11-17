import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryAuthForm } from '../../_components/IndustryAuthForm';

const config = getIndustryConfig('agriculture')!;

export const metadata = {
  title: `Get started · Busmo Agriculture`,
};

export default function Page() {
  return <IndustryAuthForm config={config} mode="signup" />;
}
