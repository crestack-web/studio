import './styles/globals.css';
import { AnnouncementBar } from './components/AnnouncementBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnnouncementBar />
        {children}
      </body>
    </html>
  );
}