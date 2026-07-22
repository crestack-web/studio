'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SellPageId =
  | 'overview'
  | 'products'
  | 'collections'
  | 'orders'
  | 'shipping'
  | 'analytics'
  | 'earnings'
  | 'settings'
  | 'theme-editor'
  | 'setup-wizard';

export type SellTheme = 'light' | 'dark';

export interface SellUser {
  id: string;
  name: string;
  shortName: string;
  email: string;
  businessId: string;
  plan: string;
  avatarContent: string;
  avatarStyle: { background: string; color: string };
  photoURL?: string;
  moSellAccess: boolean; // beta gate flag
}

export interface StoreConfig {
  storeSlug: string;
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  businessCategory: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  status: 'draft' | 'active' | 'paused';
  customDomain: string | null;
  customDomainStatus: 'pending' | 'verified' | 'failed';
  managedPayments?: boolean;
  payoutBankName?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
  theme?: string;
  tagline?: string | null;
}

export interface SellToast {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface SellContextValue {
  // Theme
  theme: SellTheme;
  toggleTheme: () => void;

  // Navigation
  activePage: SellPageId;
  navigateTo: (page: SellPageId) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // User
  user: SellUser | null;
  userLoading: boolean;

  // Store config
  storeConfig: StoreConfig | null;
  storeConfigLoading: boolean;
  refreshStoreConfig: () => Promise<void>;

  // Toast
  toast: SellToast;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Quick stats (for topbar / overview)
  quickStats: {
    pendingOrders: number;
    monthlyRevenue: number;
    totalProducts: number;
  };
  refreshQuickStats: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SellContext = createContext<SellContextValue | undefined>(undefined);

export function SellProvider({ children }: { children: ReactNode }) {
  // Theme
  const [theme, setTheme] = useState<SellTheme>(() => {
    try { return (localStorage.getItem('sell-theme') as SellTheme) || 'light'; }
    catch { return 'light'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-sell-theme', theme);
    try { localStorage.setItem('sell-theme', theme); } catch { /* noop */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Navigation
  const [activePage, setActivePage] = useState<SellPageId>('overview');
  const navigateTo = useCallback((page: SellPageId) => {
    setActivePage(page);
    setSidebarOpen(false);
  }, []);

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);
  const openSidebar   = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  // Toast
  const [toast, setToast] = useState<SellToast>({ message: '', type: 'info', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // User
  const [user, setUser] = useState<SellUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: import('firebase/auth').User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setUserLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        const displayName = firebaseUser.displayName || data.displayName || data.businessName || firebaseUser.email?.split('@')[0] || 'User';
        const firstName = displayName.split(' ')[0];
        setUser({
          id: firebaseUser.uid,
          name: displayName,
          shortName: firstName,
          email: firebaseUser.email || data.email || '',
          businessId: data.businessId || '',
          plan: data.plan || 'starter',
          avatarContent: data.avatarContent || firstName.charAt(0).toUpperCase(),
          avatarStyle: {
            background: data.avatarBg || '#0EA5E9',
            color: data.avatarColor || '#fff',
          },
          photoURL: data.photoURL,
          moSellAccess: true, // open to all authenticated users
        });
      } catch (err) {
        console.error('[SellContext] Failed to load user:', err);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Store Config
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [storeConfigLoading, setStoreConfigLoading] = useState(true);

  const refreshStoreConfig = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const configDoc = await getDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config')
      );
      if (configDoc.exists()) {
        setStoreConfig(configDoc.data() as StoreConfig);
      } else {
        setStoreConfig(null);
      }
    } catch (err) {
      console.error('[SellContext] Failed to load store config:', err);
    } finally {
      setStoreConfigLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => {
    if (user?.businessId) {
      refreshStoreConfig();
    } else if (!userLoading) {
      setStoreConfigLoading(false);
    }
  }, [user?.businessId, userLoading, refreshStoreConfig]);

  // Quick stats
  const [quickStats, setQuickStats] = useState({ pendingOrders: 0, monthlyRevenue: 0, totalProducts: 0 });

  const refreshQuickStats = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const biz = user.businessId;

      // Pending orders count
      const ordersQ = query(
        collection(firestore, 'businesses', biz, 'storeOrders'),
        where('status', 'in', ['paid', 'processing']),
        limit(100)
      );
      const ordersSnap = await getDocs(ordersQ);
      const pendingOrders = ordersSnap.size;

      // Monthly revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const revenueQ = query(
        collection(firestore, 'businesses', biz, 'storeOrders'),
        where('paymentStatus', '==', 'paid'),
        where('createdAt', '>=', startOfMonth),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
      const revenueSnap = await getDocs(revenueQ);
      const monthlyRevenue = revenueSnap.docs.reduce((sum, d) => sum + (d.data().total || 0), 0);

      // Product count
      const productsSnap = await getDocs(
        collection(firestore, 'businesses', biz, 'storeProducts')
      );
      const totalProducts = productsSnap.size;

      setQuickStats({ pendingOrders, monthlyRevenue, totalProducts });
    } catch (err) {
      console.error('[SellContext] Failed to load quick stats:', err);
    }
  }, [user?.businessId]);

  useEffect(() => {
    if (user?.businessId && storeConfig) {
      refreshQuickStats();
    }
  }, [user?.businessId, storeConfig, refreshQuickStats]);

  return (
    <SellContext.Provider value={{
      theme, toggleTheme,
      activePage, navigateTo,
      sidebarCollapsed, sidebarOpen, toggleSidebar, openSidebar, closeSidebar,
      user, userLoading,
      storeConfig, storeConfigLoading, refreshStoreConfig,
      toast, showToast,
      quickStats, refreshQuickStats,
    }}>
      {children}
    </SellContext.Provider>
  );
}

export function useSell(): SellContextValue {
  const ctx = useContext(SellContext);
  if (!ctx) throw new Error('useSell must be used inside <SellProvider>');
  return ctx;
}
