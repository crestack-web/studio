import type { PageId } from './index';

export type NotificationType = 'info' | 'success' | 'warning' | 'alert';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  href?: PageId;
  category?: 'sales' | 'stock' | 'system' | 'tip' | 'payroll';
}

export const NOTIFICATIONS_STORAGE_KEY = 'busmo-app-notifications-v1';

export function loadStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n) => n && typeof n.id === 'string' && typeof n.title === 'string');
  } catch {
    return [];
  }
}

export function saveStoredNotifications(items: AppNotification[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    /* ignore quota */
  }
}

/** @deprecated Mock seeds removed — use loadRealNotifications from notifications-service */
export function defaultNotifications(): AppNotification[] {
  return [];
}
