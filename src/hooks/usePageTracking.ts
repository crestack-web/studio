import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

/**
 * Hook to track user page visits for analytics
 */
export const usePageTracking = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !user || !pathname) return;

    const trackPageVisit = async () => {
      try {
        // Create a reference to the user's page visit document
        const pageVisitRef = doc(
          firestore,
          `users/${user.uid}/pageVisits`,
          pathname.replace(/\//g, '_').substring(1) || 'home' // Replace slashes and remove leading slash
        );

        // Update the page visit document
        await setDoc(
          pageVisitRef,
          {
            page: pathname,
            lastVisited: serverTimestamp(),
            visitCount: increment(1),
            userId: user.uid,
            email: user.email,
            timestamp: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error tracking page visit:', error);
      }
    };

    // Track the page visit after a small delay to ensure page is loaded
    const timer = setTimeout(trackPageVisit, 100);

    return () => clearTimeout(timer);
  }, [firestore, user, pathname]);
};