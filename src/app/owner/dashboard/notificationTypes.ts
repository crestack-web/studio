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

/** Seed helpful defaults once when the inbox is empty */
export function defaultNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: `seed-tip-${now}`,
      type: 'info',
      title: 'Tip: track daily expenses',
      body: 'Recording expenses the same day keeps profit and cash runway accurate.',
      createdAt: now - 60_000,
      read: false,
      href: 'add-expense',
      category: 'tip',
    },
    {
      id: `seed-stock-${now}`,
      type: 'warning',
      title: 'Check low stock',
      body: 'Review inventory for items near their threshold before you miss sales.',
      createdAt: now - 120_000,
      read: false,
      href: 'inventory',
      category: 'stock',
    },
    {
      id: `seed-control-${now}`,
      type: 'success',
      title: 'Money Control is ready',
      body: 'See sales, stock, and cash in one place — even when you are not at the shop.',
      createdAt: now - 180_000,
      read: false,
      href: 'money-control',
      category: 'system',
    },
  ];
}
