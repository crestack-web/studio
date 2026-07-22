import { redirect } from 'next/navigation';

/**
 * /sell redirects to the dashboard.
 * The actual dashboard lives at /sell/dashboard so it has
 * a clean, conflict-free route independent of the root /sell path.
 */
export default function SellRootPage() {
  redirect('/sell/dashboard');
}
