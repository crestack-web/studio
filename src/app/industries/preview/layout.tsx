import type { Metadata, Viewport } from 'next';
import '../_design/solutions.css';

export const metadata: Metadata = {
  title: 'Busmo Solutions — preview',
  description:
    'Preview the redesigned Busmo industry solutions: hospitality, healthcare, professional services, education and agriculture.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function SolutionsPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
