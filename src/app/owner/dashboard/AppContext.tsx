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
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('busmo-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev: Theme) => (prev === 'light' ? 'dark' : 'light'));
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

  // Load user from Firebase Auth
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
    businessId: undefined,
  });

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const displayName = firebaseUser.displayName || data.displayName || data.businessName || data.firstName + ' ' + data.lastName || 'User';
            const firstName = displayName.split(' ')[0];
            
            setUser({
              initials: (firstName.charAt(0) + (displayName.split(' ')[1]?.charAt(0) || '')).toUpperCase(),
              shortName: firstName,
              role: data.role || 'Owner',
              plan: data.plan || 'Free',
              id: firebaseUser.uid,
              name: displayName,
              email: firebaseUser.email || data.email || '',
              avatarContent: data.avatarContent || '👤',
              avatarStyle: { 
                background: data.avatarBg || '#6B3FE7', 
                color: data.avatarColor || '#fff' 
              },
              businessId: data.businessId,
            });
          } else {
            // Fallback if user doc doesn't exist
            const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
            const firstName = displayName.split(' ')[0];
            
            setUser({
              initials: (firstName.charAt(0) + (displayName.split(' ')[1]?.charAt(0) || '')).toUpperCase(),
              shortName: firstName,
              role: 'Owner',
              plan: 'Free',
              id: firebaseUser.uid,
              name: displayName,
              email: firebaseUser.email || '',
              avatarContent: '👤',
              avatarStyle: { background: '#6B3FE7', color: '#fff' },
              businessId: undefined,
            });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const openAvatarModal  = useCallback(() => setAvatarModalOpen(true), []);
  const closeAvatarModal = useCallback(() => setAvatarModalOpen(false), []);

  const saveAvatar = useCallback((option: AvatarOption) => {
    setUser(prev => ({
      ...prev,
      avatarContent: option.content,
      avatarStyle: { background: option.bg, color: option.color },
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
        theme, toggleTheme,
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
