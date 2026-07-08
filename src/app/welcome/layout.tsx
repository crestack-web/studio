import './styles/globals.css';
import { AnnouncementBar } from './components/AnnouncementBar';

interface LayoutProps {
  children: React.ReactNode;
  showAnnouncement?: boolean;
}

export default function Layout({ children, showAnnouncement = true }: LayoutProps) {
  return (
    <html lang="en">
      <body className={showAnnouncement ? 'has-announcement' : ''}>
        {showAnnouncement && <AnnouncementBar />}
        {children}
      </body>
    </html>
  );
}
