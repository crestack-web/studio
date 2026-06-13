import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore';
import { useApp } from '@/app/owner/dashboard/AppContext';

export type BranchScope = 'all' | 'single';

export interface Branch {
  id: string;
  name: string;
  location?: string;
}

interface BranchContextType {
  selectedBranchId: string | null;
  selectedBranchScope: BranchScope;
  branches: Branch[];
  setSelectedBranch: (branchId: string | null) => void;
  setSelectedBranchScope: (scope: BranchScope) => void;
  setBranches: (branches: Branch[]) => void;
  isProUser: boolean;
  setIsProUser: (isPro: boolean) => void;
  businessId: string | null;
  setBusinessId: (businessId: string | null) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(null);
  const [selectedBranchScope, setSelectedBranchScopeState] = useState<BranchScope>('all');
  const [branches, setBranchesState] = useState<Branch[]>([]);
  const [isProUser, setIsProUserState] = useState<boolean>(false);
  const [businessId, setBusinessIdState] = useState<string | null>(null);

  // Load persisted branch selection on mount
  useEffect(() => {
    const savedBranchId = localStorage.getItem('selectedBranchId');
    const savedBranchScope = localStorage.getItem('selectedBranchScope') as BranchScope;
    const savedIsPro = localStorage.getItem('isProUser');

    if (savedBranchId) setSelectedBranchIdState(savedBranchId);
    if (savedBranchScope) setSelectedBranchScopeState(savedBranchScope);
    if (savedIsPro) setIsProUserState(savedIsPro === 'true');
  }, []);

  // Update businessId and isProUser when user data changes
  useEffect(() => {
    if (user.businessId) {
      setBusinessIdState(user.businessId);
    }
    
    // Set isProUser based on plan
    const proPlans = ['multi-branch', 'company'];
    setIsProUserState(proPlans.includes(user.plan));
  }, [user.businessId, user.plan]);

  // Persist branch selection changes
  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem('selectedBranchId', selectedBranchId);
    } else {
      localStorage.removeItem('selectedBranchId');
    }
  }, [selectedBranchId]);

  useEffect(() => {
    localStorage.setItem('selectedBranchScope', selectedBranchScope);
  }, [selectedBranchScope]);

  useEffect(() => {
    localStorage.setItem('isProUser', isProUser.toString());
  }, [isProUser]);

  // Load branches from Firestore when businessId is set
  useEffect(() => {
    if (!businessId) return;

    const { firestore } = initializeFirebase();
    const branchesQuery = query(
      collection(firestore, 'businesses', businessId, 'branches'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(branchesQuery, (snapshot) => {
      const loadedBranches: Branch[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedBranches.push({
          id: doc.id,
          name: data.name || 'Unnamed Branch',
          location: data.address || undefined,
        });
      });
      setBranchesState(loadedBranches);
    }, (error) => {
      console.error('Error loading branches:', error);
    });

    return () => unsubscribe();
  }, [businessId]);

  const setSelectedBranch = (branchId: string | null) => {
    setSelectedBranchIdState(branchId);
  };

  const setSelectedBranchScope = (scope: BranchScope) => {
    setSelectedBranchScopeState(scope);
    // When switching to 'all', clear the selected branch
    if (scope === 'all') {
      setSelectedBranchIdState(null);
    }
  };

  const setBranches = (branches: Branch[]) => {
    setBranchesState(branches);
  };

  const setIsProUser = (isPro: boolean) => {
    setIsProUserState(isPro);
  };

  const setBusinessId = (businessId: string | null) => {
    setBusinessIdState(businessId);
  };

  return (
    <BranchContext.Provider
      value={{
        selectedBranchId,
        selectedBranchScope,
        branches,
        setSelectedBranch,
        setSelectedBranchScope,
        setBranches,
        isProUser,
        setIsProUser,
        businessId,
        setBusinessId,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
