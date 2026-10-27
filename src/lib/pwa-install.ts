/**
 * PWA install prompt capture for desktop + mobile Chrome/Edge.
 * Safari does not fire beforeinstallprompt — UI falls back to manual instructions.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(canInstall: boolean) => void>();

function notify() {
  const can = deferredPrompt != null;
  listeners.forEach((fn) => {
    try {
      fn(can);
    } catch {
      /* ignore */
    }
  });
}

export function isRunningAsInstalledApp(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
  return false;
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function subscribeInstallAvailability(fn: (canInstall: boolean) => void): () => void {
  listeners.add(fn);
  fn(deferredPrompt != null);
  return () => {
    listeners.delete(fn);
  };
}

export function captureInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  if ((window as any).__busmoPwaInstallBound) return;
  (window as any).__busmoPwaInstallBound = true;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    try {
      localStorage.setItem('busmo_pwa_installed', '1');
    } catch {
      /* ignore */
    }
    notify();
  });
}

export async function promptPwaInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  notify();
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    return choice.outcome;
  } catch {
    return 'dismissed';
  }
}

const DISMISS_KEY = 'busmo_pwa_nudge_dismissed_at';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function wasNudgeDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissNudge(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
