import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Whitelisted admin emails
const ADMIN_EMAILS = [
  'founder@busmo.io',
  'admin@busmo.io',
  // Add more admin emails as needed
];

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user || !user.email) {
    return false;
  }

  // Check if email is in whitelist
  if (ADMIN_EMAILS.includes(user.email)) {
    return true;
  }

  // Check Firestore for admin role
  try {
    const { firestore } = initializeFirebase();
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role === 'admin' || userData.isAdmin === true;
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }

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
