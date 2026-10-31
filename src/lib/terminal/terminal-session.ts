/**
 * Trusted Busmo One terminal activation.
 * Must NOT key off viewport width alone (phones stay on standard portal).
 */

const DEVICE_KEY = 'busmo_one_device';
const DEMO_KEY = 'busmo_one_demo';

export type StaffExperienceMode = 'standard' | 'terminal' | 'demo';

export function markAsBusmoOneDevice(): void {
  try {
    localStorage.setItem(DEVICE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearBusmoOneDevice(): void {
  try {
    localStorage.removeItem(DEVICE_KEY);
  } catch {
    /* ignore */
  }
}

export function isBusmoOneDeviceFlag(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (localStorage.getItem(DEVICE_KEY) === '1') return true;
    if ((window as any).BusmoOneBridge) return true;
    const ua = navigator.userAgent || '';
    if (/BusmoOne/i.test(ua)) return true;
    return false;
  } catch {
    return false;
  }
}

export function resolveStaffExperienceMode(
  searchParams?: URLSearchParams | null
): StaffExperienceMode {
  if (typeof window === 'undefined') return 'standard';

  const sp =
    searchParams ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null);

  if (sp?.get('demo') === '1' || sp?.get('busmo_demo') === '1') {
    try {
      sessionStorage.setItem(DEMO_KEY, '1');
    } catch {
      /* ignore */
    }
    return 'demo';
  }

  try {
    if (sessionStorage.getItem(DEMO_KEY) === '1' && sp?.get('demo') !== '0') {
      return 'demo';
    }
  } catch {
    /* ignore */
  }

  // Explicit opt-in for terminal (Android container or ops)
  if (
    sp?.get('terminal') === '1' ||
    sp?.get('mode') === 'terminal' ||
    sp?.get('source') === 'busmo_one'
  ) {
    markAsBusmoOneDevice();
    return 'terminal';
  }

  if (isBusmoOneDeviceFlag()) return 'terminal';

  return 'standard';
}

export function isDemoMode(): boolean {
  return resolveStaffExperienceMode() === 'demo';
}
