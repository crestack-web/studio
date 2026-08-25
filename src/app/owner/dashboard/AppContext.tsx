'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { LangProvider } from './LangContext';
import { getSupabase } from '@/lib/supabase';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';

type User = {
  initials: string;
  shortName: string;
  role: string;
  plan: string;
  id: string;
  name: string;
  email: string;
  avatarContent: string;
  avatarStyle: {
    background: string;
    color: string;
  };
  photoURL?: string;
  businessId?: string;
};

import { PageId, Theme } from '.';

// Define AvatarOption type locally since it's not exported from './types'
type AvatarOption = {
  content: string;
  bg: string;
  color: string;
};

// Define ToastState locally since it's not exported from './types'
type ToastState = {
  message: string;
  visible: boolean;
};

// ═══════════════════════════════════════════
//  AppContext — global UI state
// ═══════════════════════════════════════════

interface AppContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  activePage: PageId;
  navigateTo: (page: PageId) => void;
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toast: ToastState;
  showToast: (message: string) => void;
  user: User;
  openAvatarModal: () => void;
  closeAvatarModal: () => void;
  avatarModalOpen: boolean;
  saveAvatar: (option: AvatarOption) => void;
  notificationsVisible: boolean;
  toggleNotifications: () => void;
  dismissNotifications: () => void;
  aiPanelOpen: boolean;
  toggleAIPanel: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('busmo-theme') as Theme) || 'light'; }
    catch { return 'light'; }
  });

  useEffect(() => {
    const applyTheme = (themeValue: Theme) => {
      let actualTheme: 'light' | 'dark';
      
      if (themeValue === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        actualTheme = themeValue;
      }
      
      document.documentElement.setAttribute('data-theme', actualTheme);
    };

    applyTheme(theme);
    localStorage.setItem('busmo-theme', theme);

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(theme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev: Theme) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const [activePage, setActivePage] = useState<PageId>('home');

  const navigateTo = useCallback((page: PageId) => {
    setActivePage(page);
    setSidebarOpen(false);
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);
  const openSidebar   = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  // Load user from Supabase Auth
  const [user, setUser] = useState<User>({
    initials: '..',
    shortName: 'Loading...',
    role: 'Owner',
    plan: 'Free',
    id: '',
    name: '',
    email: '',
    avatarContent: '👤',
    avatarStyle: { background: '#6B3FE7', color: '#fff' },
    photoURL: undefined,
    businessId: undefined,
  });

  const loadUser = useCallback(async (userId: string, userEmail: string, metadata: Record<string, any> | undefined, firestore: any, firebaseAuth: any) => {
    // Resolve the Firestore user doc key: migrated users have firebase_uid in Supabase metadata
    const firestoreUid = metadata?.firebase_uid || userId;

    try {
      const userDoc = await getDoc(doc(firestore, 'users', firestoreUid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const displayName = (metadata?.full_name || metadata?.name) || data.displayName || data.businessName || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : '') || 'User';
        const firstName = displayName.split(' ')[0];
        
        setUser({
          initials: (firstName.charAt(0) + (displayName.split(' ')[1]?.charAt(0) || '')).toUpperCase(),
          shortName: firstName,
          role: data.role || metadata?.role || 'Owner',
          plan: data.plan || 'Free',
          id: userId,
          name: displayName,
          email: userEmail || data.email || '',
          avatarContent: data.photoURL || data.avatarContent || '👤',
          avatarStyle: { 
            background: data.photoURL || data.avatarBg || '#6B3FE7', 
            color: data.avatarColor || '#fff' 
          },
          photoURL: data.photoURL,
          businessId: data.businessId || firestoreUid,
        });
        return;
      }
    } catch (error) {
      console.error('Error loading user data from Firestore:', error);
    }

    // Fallback: no Firestore doc found — use Supabase metadata
    const displayName = (metadata?.full_name || metadata?.name) || userEmail.split('@')[0] || 'User';
    const firstName = displayName.split(' ')[0];
    
    setUser({
      initials: (firstName.charAt(0) + (displayName.split(' ')[1]?.charAt(0) || '')).toUpperCase(),
      shortName: firstName,
      role: metadata?.role || 'Owner',
      plan: 'Free',
      id: userId,
      name: displayName,
      email: userEmail || '',
      avatarContent: '👤',
      avatarStyle: { background: '#6B3FE7', color: '#fff' },
      photoURL: undefined,
      businessId: metadata?.businessId || firestoreUid,
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    const { firestore, auth: firebaseAuth } = initializeFirebase();

    const signInToFirebase = async (supabaseAccessToken: string) => {
      try {
        const res = await fetch('/api/auth/firebase-token', {
          method: 'POST',
          headers: { Authorization: `Bearer ${supabaseAccessToken}` },
        });
        if (!res.ok) {
          console.error('Failed to get Firebase custom token:', res.status);
          return;
        }
        const { customToken } = await res.json();
        if (customToken) {
          await signInWithCustomToken(firebaseAuth, customToken);
        }
      } catch (e) {
        console.error('Error signing into Firebase Auth:', e);
      }
    };

    const handleSession = async (session: any) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        const firestoreUid = metadata?.firebase_uid || session.user.id;
        loadUser(session.user.id, session.user.email || '', metadata, firestore, firebaseAuth);

        // Sign into Firebase Auth so Firestore rules (request.auth) work
        if (!firebaseAuth.currentUser) {
          const tokenResponse = await supabase.auth.getSession();
          const accessToken = tokenResponse.data.session?.access_token;
          if (accessToken) {
            await signInToFirebase(accessToken);
          }
        }
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const openAvatarModal  = useCallback(() => setAvatarModalOpen(true), []);
  const closeAvatarModal = useCallback(() => setAvatarModalOpen(false), []);

  const saveAvatar = useCallback((option: AvatarOption) => {
    setUser(prev => ({
      ...prev,
      avatarContent: option.content,
      avatarStyle: { background: option.bg, color: option.color },
      photoURL: option.bg.startsWith('http') ? option.bg : undefined,
    }));
    setAvatarModalOpen(false);
  }, []);

  // Notification state
  const [notificationsVisible, setNotificationsVisible] = useState(() => {
    try {
      const dismissed = localStorage.getItem('busmo-notifications-dismissed');
      return !dismissed; // Show on first load if not dismissed
    } catch {
      return true;
    }
  });

  const toggleNotifications = useCallback(() => {
    setNotificationsVisible(prev => !prev);
  }, []);

  const dismissNotifications = useCallback(() => {
    setNotificationsVisible(false);
    localStorage.setItem('busmo-notifications-dismissed', 'true');
  }, []);

  // AI Panel state
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const toggleAIPanel = useCallback(() => setAIPanelOpen(prev => !prev), []);

  return (
    <LangProvider>
      <AppContext.Provider value={{
        theme, setTheme, toggleTheme,
        activePage, navigateTo,
        sidebarCollapsed, sidebarOpen, toggleSidebar, openSidebar, closeSidebar,
        toast, showToast,
        user, openAvatarModal, closeAvatarModal, avatarModalOpen, saveAvatar,
        notificationsVisible, toggleNotifications, dismissNotifications,
        aiPanelOpen, toggleAIPanel,
      }}>
        {children}
      </AppContext.Provider>
    </LangProvider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export default AppContext;

