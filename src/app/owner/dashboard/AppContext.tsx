import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
// Define Theme type locally if not exported from './types'
type Theme = 'light' | 'dark';

// Define PageId type locally if not exported from './types'
// (Removed duplicate definition. See export type PageId below.)
// Removed duplicate definition of PageId.
// Define AvatarOption type locally
type AvatarOption = {
  content: string;
  bg: string;
  color: string;
};
import { CURRENT_USER } from './mockData';
// export type PageId = 'home' | 'sale' | 'mo' | 'staff' | 'services'; // Removed duplicate definition
// ...existing code...

type User = {
  role: ReactNode;
  plan: ReactNode;
  initials: ReactNode;
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

// Define ToastState type locally
type ToastState = {
  message: string;
  visible: boolean;
};
export type PageId =
  | 'home'
  | 'dashboard'
  | 'capital'
  | 'sale'
  | 'mo'
  | 'staff'
  | 'services'
  // add other page ids as needed
// ═══════════════════════════════════════════
//  BUSMO — App Context
//  Single context for global UI state.
//  Split into domain-specific contexts as the
//  app grows (AuthContext, CartContext, etc.)
// ═══════════════════════════════════════════

interface AppContextValue {
  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Navigation
  activePage: PageId;
  navigateTo: (page: PageId) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;       // mobile only
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // Toast
  toast: ToastState;
  showToast: (message: string) => void;

  // User / Avatar
  user: User;
  openAvatarModal: () => void;
  closeAvatarModal: () => void;
  avatarModalOpen: boolean;
  saveAvatar: (option: AvatarOption) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Theme ──────────────────────────────────
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('busmo-theme') as Theme) || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('busmo-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // ── Navigation ─────────────────────────────
  const [activePage, setActivePage] = useState<PageId>('home');

  const navigateTo = useCallback((page: PageId) => {
    setActivePage(page);
    // Close mobile sidebar on navigation
    setSidebarOpen(false);
  }, []);

  // ── Sidebar ────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // ── Toast ──────────────────────────────────
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  // ── User / Avatar ──────────────────────────
  const [user, setUser] = useState<User>(CURRENT_USER);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const openAvatarModal = useCallback(() => setAvatarModalOpen(true), []);
  const closeAvatarModal = useCallback(() => setAvatarModalOpen(false), []);

  const saveAvatar = useCallback((option: AvatarOption) => {
    setUser(prev => ({
      ...prev,
      avatarContent: option.content,
      avatarStyle: { background: option.bg, color: option.color },
    }));
    setAvatarModalOpen(false);
    // showToast called in modal component after save
  }, []);

  const value: AppContextValue = {
    theme,
    toggleTheme,
    activePage,
    navigateTo,
    sidebarCollapsed,
    sidebarOpen,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    toast,
    showToast,
    user,
    openAvatarModal,
    closeAvatarModal,
    avatarModalOpen,
    saveAvatar,
  };
  // ...existing code...
  // type PageId = 'home' | 'sale' | 'mo' | 'staff' | 'services'; // Removed invalid export
  // ...existing code...
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
