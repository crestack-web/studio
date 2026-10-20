import './styles/globals.css';

export const dynamic = 'force-dynamic';

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  // Do not render <html>/<body> here — that is the root layout's job.
  // A nested document shell on Safari can drop the viewport meta and force
  // a ~980px layout width (desktop nav on phones).
  return <>{children}</>;
}
