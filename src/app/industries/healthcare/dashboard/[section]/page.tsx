import { getIndustryConfig } from '@/lib/industries/config';
import { IndustryDashboardClient } from '../../../_components/IndustryDashboardClient';

const config = getIndustryConfig('healthcare')!;

export function generateStaticParams() {
  return config.nav
    .filter((n) => n.id !== 'overview')
    .map((n) => ({ section: n.id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return <IndustryDashboardClient config={config} section={section} />;
}
