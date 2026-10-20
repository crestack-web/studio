import '../welcome/styles/globals.css';

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  // Root layout owns <html>/<body> + viewport meta (required for Safari mobile).
  return <>{children}</>;
}
