import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, Timestamp, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';

export interface OnboardingState {
  businessName?: string;
  description?: string;
  businessAnalysis?: any;
  step?: number;
  completed?: boolean;
  lastUpdated?: Timestamp;
}

/**
 * Check if user has partial onboarding state
 */
export async function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  try {
    const { firestore } = initializeFirebase();
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    
    // Check if user has onboarding state stored
    if (userData?.onboardingState) {
      return userData.onboardingState;
    }

    // Check if business profile exists (indicates completed onboarding)
    const businessDoc = await getDoc(doc(firestore, 'businesses', userId));
    if (businessDoc.exists()) {
      return { completed: true };
    }

    // Check if user has partial data
    if (userData?.businessName || userData?.businessAnalysis) {
      return {
        businessName: userData.businessName,
        description: userData.description,
        businessAnalysis: userData.businessAnalysis,
        step: userData.onboardingStep || 1,
        completed: false,
        lastUpdated: userData.lastUpdated,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking onboarding state:', error);
    return null;
  }
}

/**
 * Save onboarding state for recovery
 */
export async function saveOnboardingState(userId: string, state: OnboardingState): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    await updateDoc(doc(firestore, 'users', userId), {
      onboardingState: state,
      lastUpdated: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving onboarding state:', error);
  }
}

/**
 * Clear onboarding state after successful completion
 */
export async function clearOnboardingState(userId: string): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    await updateDoc(doc(firestore, 'users', userId), {
      onboardingState: null,
      onboardingStep: null,
    });
  } catch (error) {
    console.error('Error clearing onboarding state:', error);
  }
}

/**
 * Check if setup is incomplete and needs background sync
 */
export async function needsBackgroundSync(userId: string): Promise<boolean> {
  try {
    const { firestore } = initializeFirebase();
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    
    // Check if business profile is missing
    const businessDoc = await getDoc(doc(firestore, 'businesses', userId));
    if (!businessDoc.exists()) {
      return true;
    }

    // Check if recommended categories are missing
    const businessData = businessDoc.data();
    if (userData?.businessAnalysis?.recommendedCategories && 
        (!businessData?.recommendedCategories || businessData.recommendedCategories.length === 0)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking background sync status:', error);
    return false;
  }
}

/**
 * Perform background sync of incomplete onboarding data
 */
export async function performBackgroundSync(userId: string): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return;
    }

    const userData = userDoc.data();
    const businessAnalysis = userData?.businessAnalysis;

    if (!businessAnalysis) {
      return;
    }

    // Sync business profile if missing
    const businessDoc = await getDoc(doc(firestore, 'businesses', userId));
    if (!businessDoc.exists()) {
      await setDoc(doc(firestore, 'businesses', userId), {
        ownerId: userId,
        businessName: userData.businessName || 'My Business',
        category: businessAnalysis.businessType || 'Other',
        country: userData.country || 'nigeria',
        description: userData.description || '',
        plan: 'starter',
        staffIds: [userId],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        active: true,
        recommendedCategories: businessAnalysis.recommendedCategories || [],
        recommendedFeatures: businessAnalysis.recommendedFeatures || [],
        operationalNeeds: businessAnalysis.operationalNeeds || [],
        productTypes: businessAnalysis.productTypes || [],
      });
    }

    // Sync product categories if missing
    if (businessAnalysis.recommendedCategories && businessAnalysis.recommendedCategories.length > 0) {
      const categoriesRef = collection(firestore, 'businesses', userId, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      
      if (categoriesSnapshot.empty) {
        for (const categoryName of businessAnalysis.recommendedCategories) {
          await addDoc(categoriesRef, {
            name: categoryName,
            active: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }
    }

    // Clear onboarding state after successful sync
    await clearOnboardingState(userId);
  } catch (error) {
    console.error('Error performing background sync:', error);
  }
}
