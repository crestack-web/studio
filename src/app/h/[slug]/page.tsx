import { HotelPublicSite } from '../../industries/_components/hospitality/HotelPublicSite';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return {
    title: `Book · ${slug}`,
    description: 'Hotel booking powered by Busmo Hospitality',
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <HotelPublicSite slug={slug} />;
}
