import './styles/globals.css';
import { AnnouncementBar } from './components/AnnouncementBar';

export default function Layout({ children, showAnnouncement = true }: { children: React.ReactNode; showAnnouncement?: boolean }) {
  return (
    <html lang="en">
      <body className={showAnnouncement ? 'has-announcement' : ''}>
        {showAnnouncement && <AnnouncementBar />}
        {children}
      </body>
    </html>
  );
}
