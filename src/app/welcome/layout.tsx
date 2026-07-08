import './styles/globals.css';
import { AnnouncementBar } from './components/AnnouncementBar';

export default function Layout({ children, hideAnnouncementBar }: { children: React.ReactNode, hideAnnouncementBar?: boolean }) {
  return (
    <html lang="en">
      <body>
        {!hideAnnouncementBar && <AnnouncementBar />}
        {children}
      </body>
    </html>
  );
}