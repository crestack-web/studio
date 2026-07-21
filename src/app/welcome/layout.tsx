import './styles/globals.css';
import { AnnouncementBar } from './components/AnnouncementBar';

export const dynamic = 'force-dynamic';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AnnouncementBar />
        {children}
      </body>
    </html>
  );
}
