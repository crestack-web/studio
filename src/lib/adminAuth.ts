import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Whitelisted admin emails
const ADMIN_EMAILS = [
  'sxeedtxheer@gmail.com',
  'admin@busmo.io',
  'majnuncode@gmail.com',
  // Add more admin emails as needed
];

/**
 * Check if current user is an admin
 * STRICT: Only checks whitelist, ignores Firestore roles
 */
export async function isAdmin(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  console.log('Admin check - User:', user?.email, 'UID:', user?.uid);

  if (!user || !user.email) {
    console.log('Admin check failed: No user or email');
    return false;
  }

  // Normalize email to lowercase for comparison
  const normalizedEmail = user.email.toLowerCase();

  // Check if email is in whitelist (case-insensitive) - STRICT CHECK ONLY
  const isInWhitelist = ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
  console.log('Admin check - Email in whitelist:', isInWhitelist, 'User email:', normalizedEmail);
  
  if (isInWhitelist) {
    console.log('Admin check passed: Email in whitelist');
    return true;
  }

  console.log('Admin check failed: Email not in whitelist');
  return false;
}

/**
 * Redirect non-admin users
 */
export async function requireAdmin(): Promise<void> {
  const isUserAdmin = await isAdmin();
  
  if (!isUserAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/owner/dashboard';
    }
    throw new Error('Unauthorized: Admin access required');
  }
}
