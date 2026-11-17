import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryAuthForm } from '../../_components/IndustryAuthForm';

const config = getIndustryConfig('agriculture')!;

export const metadata = {
  title: `Sign in · Busmo Agriculture`,
};

export default function Page() {
  return <IndustryAuthForm config={config} mode="login" />;
}
