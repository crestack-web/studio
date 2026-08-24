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
import type { AppNotification } from './notificationTypes';
import { showDeviceNotification } from '@/lib/deviceNotifications';
import {
  loadStoredNotifications,
  saveStoredNotifications,
  defaultNotifications,
} from './notificationTypes';

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
  notifications: AppNotification[];
  unreadNotificationCount: number;
  notificationsPanelOpen: boolean;
  openNotificationsPanel: () => void;
  closeNotificationsPanel: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string }) => void;
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

  const loadUser = useCallback(async (userId: string, userEmail: string, metadata: Record<string, any> | undefined, firestore: any) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const displayName = (metadata?.full_name || metadata?.name) || data.displayName || data.businessName || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : '') || 'User';
        const firstName = displayName.split(' ')[0];
        
        setUser({
          initials: (firstName.charAt(0) + (displayName.split(' ')[1]?.charAt(0) || '')).toUpperCase(),
          shortName: firstName,
          role: data.role || 'Owner',
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
          businessId: data.businessId,
        });
      } else {
        const displayName = (metadata?.full_name || metadata?.name) || userEmail.split('@')[0] || 'User';
        const firstName = displayName.split(' ')[0];
        
        setUser({
          initials: (firstName.charAt(0) + (displayName.split(' ')[1]?.charAt(0) || '')).toUpperCase(),
          shortName: firstName,
          role: 'Owner',
          plan: 'Free',
          id: userId,
          name: displayName,
          email: userEmail || '',
          avatarContent: '👤',
          avatarStyle: { background: '#6B3FE7', color: '#fff' },
          photoURL: undefined,
          businessId: undefined,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    const { firestore } = initializeFirebase();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email || '', session.user.user_metadata, firestore);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email || '', session.user.user_metadata, firestore);
      }
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

  // Notification inbox
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [notifHydrated, setNotifHydrated] = useState(false);
  // Legacy tip banner (kept for optional promo strip)
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const toggleNotifications = useCallback(() => {
    setNotificationsPanelOpen((prev) => !prev);
  }, []);

  const dismissNotifications = useCallback(() => {
    setNotificationsVisible(false);
    try {
      localStorage.setItem('busmo-notifications-dismissed', 'true');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let items = loadStoredNotifications();
    if (items.length === 0) {
      items = defaultNotifications();
      saveStoredNotifications(items);
    }
    setNotifications(items);
    setNotifHydrated(true);
  }, []);

  useEffect(() => {
    if (!notifHydrated) return;
    saveStoredNotifications(notifications);
  }, [notifications, notifHydrated]);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const openNotificationsPanel = useCallback(() => setNotificationsPanelOpen(true), []);
  const closeNotificationsPanel = useCallback(() => setNotificationsPanelOpen(false), []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const pushNotification = useCallback(
    (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string }) => {
      const item: AppNotification = {
        id: n.id || `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: n.type,
        title: n.title,
        body: n.body,
        createdAt: Date.now(),
        read: false,
        href: n.href,
        category: n.category,
      };
      setNotifications((prev) => [item, ...prev].slice(0, 50));
      // Mirror to device when permission granted
      showDeviceNotification({
        title: item.title,
        body: item.body,
        tag: item.id,
        url: '/owner/dashboard',
      }).catch(() => {});
    },
    []
  );

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
        notifications, unreadNotificationCount, notificationsPanelOpen,
        openNotificationsPanel, closeNotificationsPanel,
        markNotificationRead, markAllNotificationsRead, dismissNotification, clearNotifications,
        pushNotification,
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

