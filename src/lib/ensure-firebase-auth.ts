/**
 * After Supabase login, sign into Firebase Auth with a custom token so
 * Firestore Security Rules (request.auth) succeed for client reads/writes.
 */

import { getSupabase } from '@/lib/supabase';
import { initializeFirebase } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';

let inFlight: Promise<boolean> | null = null;

export async function ensureFirebaseAuth(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { auth } = initializeFirebase();
      if (auth?.currentUser) return true;

      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return false;

      const res = await fetch('/api/auth/firebase-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('[ensureFirebaseAuth] token exchange failed', err);
        return false;
      }

      const { firebaseToken } = await res.json();
      if (!firebaseToken) return false;

      await signInWithCustomToken(auth, firebaseToken);
      console.log('[ensureFirebaseAuth] Firebase Auth linked to Supabase session');
      return true;
    } catch (e) {
      console.warn('[ensureFirebaseAuth] failed', e);
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
