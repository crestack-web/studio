/**
 * Device / system notifications for Busmo (Web Notification API + service worker).
 * Works best when the app is installed as a PWA or the tab is open with permission granted.
 */

export type DeviceNotifPayload = {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
};

const PREF_KEY = 'busmo-device-notif-prefs';

export type DeviceNotifPrefs = {
  sales: boolean;
  expenses: boolean;
  lowStock: boolean;
  system: boolean;
};

const DEFAULT_PREFS: DeviceNotifPrefs = {
  sales: true,
  expenses: true,
  lowStock: true,
  system: true,
};

export function getDeviceNotifPrefs(): DeviceNotifPrefs {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setDeviceNotifPrefs(partial: Partial<DeviceNotifPrefs>) {
  if (typeof window === 'undefined') return;
  const next = { ...getDeviceNotifPrefs(), ...partial };
  localStorage.setItem(PREF_KEY, JSON.stringify(next));
  return next;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/** Request browser permission. Returns final permission state. */
export async function requestDeviceNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

/** Ensure SW is registered (same path as PwaRegister). */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    return await navigator.serviceWorker.register('/service-worker.js');
  } catch {
    return null;
  }
}

/**
 * Show a system notification on the device.
 * Prefers service worker showNotification (works when tab is backgrounded).
 */
export async function showDeviceNotification(payload: DeviceNotifPayload): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const options: NotificationOptions = {
    body: payload.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: payload.tag || 'busmo',
    
    requireInteraction: payload.requireInteraction ?? false,
    data: { url: payload.url || '/owner/dashboard' },
  };

  try {
    const reg = await ensureServiceWorker();
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(payload.title, options);
      return true;
    }
  } catch (err) {
    console.warn('[deviceNotifications] SW notify failed, falling back', err);
  }

  try {
    const n = new Notification(payload.title, options);
    n.onclick = () => {
      window.focus();
      if (payload.url) {
        try {
          window.location.href = payload.url;
        } catch { /* ignore */ }
      }
      n.close();
    };
    return true;
  } catch (err) {
    console.warn('[deviceNotifications] Notification failed', err);
    return false;
  }
}

export async function notifySale(opts: {
  amountLabel: string;
  saleId?: string;
  byStaff?: boolean;
  staffName?: string;
}) {
  const prefs = getDeviceNotifPrefs();
  if (!prefs.sales) return false;
  const who = opts.byStaff && opts.staffName ? ` by ${opts.staffName}` : '';
  return showDeviceNotification({
    title: opts.byStaff ? 'New sale recorded' : 'Sale complete',
    body: `${opts.amountLabel}${who}`,
    tag: opts.saleId ? `sale-${opts.saleId}` : 'sale',
    url: '/owner/dashboard',
  });
}

export async function notifyExpense(opts: { amountLabel: string; category?: string }) {
  const prefs = getDeviceNotifPrefs();
  if (!prefs.expenses) return false;
  return showDeviceNotification({
    title: 'Expense recorded',
    body: opts.category
      ? `${opts.amountLabel} · ${opts.category}`
      : opts.amountLabel,
    tag: 'expense',
    url: '/owner/dashboard',
  });
}

export async function notifyLowStock(opts: { names: string[]; count: number }) {
  const prefs = getDeviceNotifPrefs();
  if (!prefs.lowStock) return false;
  const preview = opts.names.slice(0, 3).join(', ');
  const extra = opts.count > 3 ? ` +${opts.count - 3} more` : '';
  return showDeviceNotification({
    title: opts.count === 1 ? 'Low stock alert' : `${opts.count} low stock items`,
    body: `${preview}${extra}`,
    tag: 'low-stock',
    url: '/owner/dashboard',
    requireInteraction: true,
  });
}

export async function notifySystem(title: string, body: string, tag = 'system') {
  const prefs = getDeviceNotifPrefs();
  if (!prefs.system) return false;
  return showDeviceNotification({ title, body, tag, url: '/owner/dashboard' });
}
