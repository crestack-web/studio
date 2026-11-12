import { getIndustryConfig } from '@/lib/industries/config';
import { FrontDeskShell } from '../../_components/hospitality/FrontDeskShell';

const config = getIndustryConfig('hospitality')!;

export default function FrontDeskLayout({ children }: { children: React.ReactNode }) {
  return <FrontDeskShell config={config}>{children}</FrontDeskShell>;
}
