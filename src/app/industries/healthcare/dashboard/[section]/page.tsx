import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryDashboardClient } from '../../../_components/IndustryDashboardClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const config = getIndustryConfig('healthcare')!;

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <IndustryDashboardClient config={config} section={section} />;
}
