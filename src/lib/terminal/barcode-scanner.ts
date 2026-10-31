/**
 * Hardware-independent barcode scanner abstraction for Busmo One.
 * Keyboard-wedge scanners (USB) appear as rapid keyboard input ending in Enter.
 * Native Android bridge can push BARCODE_SCANNED events into the same callback path.
 */

export interface BarcodeScanner {
  start(): Promise<void>;
  stop(): Promise<void>;
  onScan(callback: (barcode: string) => void): () => void;
}

type ScanListener = (barcode: string) => void;

/** Minimum characters before treating a rapid key sequence as a scan */
const MIN_BARCODE_LEN = 3;
/** Max gap (ms) between keydowns for wedge scanners */
const WEDGE_GAP_MS = 50;

/**
 * Keyboard-wedge / software keyboard scanner.
 * Does NOT debounce legitimate repeated scans of the same product —
 * only coalesces a single physical scan that might emit duplicate events
 * within a very short window (same barcode < 80ms).
 */
export class KeyboardWedgeScanner implements BarcodeScanner {
  private listeners = new Set<ScanListener>();
  private buffer = '';
  private lastKeyAt = 0;
  private lastEmitted: { code: string; at: number } | null = null;
  private bound = false;
  private onKeyDown: ((e: KeyboardEvent) => void) | null = null;

  async start(): Promise<void> {
    if (this.bound || typeof window === 'undefined') return;
    this.bound = true;
    this.onKeyDown = (e: KeyboardEvent) => this.handleKey(e);
    window.addEventListener('keydown', this.onKeyDown, true);
  }

  async stop(): Promise<void> {
    if (!this.bound || !this.onKeyDown) return;
    window.removeEventListener('keydown', this.onKeyDown, true);
    this.onKeyDown = null;
    this.bound = false;
    this.buffer = '';
  }

  onScan(callback: ScanListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /** Push a barcode from Android bridge or tests */
  inject(barcode: string): void {
    this.emit(barcode);
  }

  private handleKey(e: KeyboardEvent): void {
    // Ignore when typing in text fields (except our dedicated scan input)
    const target = e.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName;
      const isScanField = target.getAttribute?.('data-barcode-input') === 'true';
      if (!isScanField && (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
    }

    const now = Date.now();
    if (now - this.lastKeyAt > WEDGE_GAP_MS) {
      this.buffer = '';
    }
    this.lastKeyAt = now;

    if (e.key === 'Enter') {
      const code = this.buffer.trim();
      this.buffer = '';
      if (code.length >= MIN_BARCODE_LEN) {
        e.preventDefault();
        e.stopPropagation();
        this.emit(code);
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.buffer += e.key;
    }
  }

  private emit(raw: string): void {
    const code = String(raw || '').trim();
    if (!code) return;
    const now = Date.now();
    // Coalesce only accidental double-fire of the same scan (<80ms), not intentional re-scans
    if (
      this.lastEmitted &&
      this.lastEmitted.code === code &&
      now - this.lastEmitted.at < 80
    ) {
      return;
    }
    this.lastEmitted = { code, at: now };
    this.listeners.forEach((fn) => {
      try {
        fn(code);
      } catch {
        /* ignore */
      }
    });
  }
}

/** Listens for Android WebView postMessage bridge events */
export class AndroidBridgeScanner implements BarcodeScanner {
  private listeners = new Set<ScanListener>();
  private bound = false;
  private onMessage: ((e: MessageEvent) => void) | null = null;
  private wedge = new KeyboardWedgeScanner();

  async start(): Promise<void> {
    await this.wedge.start();
    if (this.bound || typeof window === 'undefined') return;
    this.bound = true;
    this.onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.type === 'BARCODE_SCANNED' && data.barcode) {
          this.emit(String(data.barcode));
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('message', this.onMessage);
    // Also subscribe wedge so USB scanners still work inside WebView
    this.wedge.onScan((code) => this.emit(code));
  }

  async stop(): Promise<void> {
    await this.wedge.stop();
    if (this.onMessage) {
      window.removeEventListener('message', this.onMessage);
      this.onMessage = null;
    }
    this.bound = false;
  }

  onScan(callback: ScanListener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(code: string): void {
    this.listeners.forEach((fn) => {
      try {
        fn(code);
      } catch {
        /* ignore */
      }
    });
  }
}

export function createDefaultScanner(): BarcodeScanner {
  if (typeof window !== 'undefined' && (window as any).BusmoOneBridge) {
    return new AndroidBridgeScanner();
  }
  return new KeyboardWedgeScanner();
}
