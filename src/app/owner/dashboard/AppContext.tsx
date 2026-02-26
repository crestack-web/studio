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

type User = {
  initials: ReactNode;
  shortName: any;
  role: ReactNode;
  plan: ReactNode;
  id: string;
  name: string;
  email: string;
  avatarContent: string;
  avatarStyle: {
    background: string;
    color: string;
  };
  // Add other fields as needed
};
import { CURRENT_USER } from './mockData';
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

  const [user, setUser] = useState<User>(CURRENT_USER);
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

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      activePage, navigateTo,
      sidebarCollapsed, sidebarOpen, toggleSidebar, openSidebar, closeSidebar,
      toast, showToast,
      user, openAvatarModal, closeAvatarModal, avatarModalOpen, saveAvatar,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export default AppContext;
