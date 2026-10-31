/**
 * Busmo One Android ↔ WebView message protocol.
 * Native layer posts JSON strings into the WebView; web posts back via BusmoOneBridge.
 *
 * Required native capabilities (Z90 / manufacturer SDK — not yet integrated):
 * - Continuous barcode scan events
 * - Thermal receipt print
 * - Device serial / secure ID
 * - Optional: paper status, battery
 *
 * SDK dependencies (to be confirmed with manufacturer):
 * - Z90 barcode scan service / intent
 * - Z90 thermal print service
 * - Do not embed backend service-role keys in the APK
 */

export type BusmoOneNativeToWeb =
  | { type: 'BARCODE_SCANNED'; barcode: string; at?: number }
  | { type: 'PRINTER_STATUS'; ready: boolean; paperOk: boolean; message?: string }
  | { type: 'DEVICE_INFO'; deviceId: string; model?: string; serial?: string }
  | { type: 'NETWORK_STATUS'; online: boolean };

export type BusmoOneWebToNative =
  | { type: 'PRINT_RECEIPT'; payload: Record<string, unknown> }
  | { type: 'START_SCANNER' }
  | { type: 'STOP_SCANNER' }
  | { type: 'REQUEST_DEVICE_INFO' };

declare global {
  interface Window {
    /** Injected by Busmo One Android WebView container */
    BusmoOneBridge?: {
      postMessage: (json: string) => void;
    };
  }
}

export function postToNative(msg: BusmoOneWebToNative): void {
  try {
    window.BusmoOneBridge?.postMessage(JSON.stringify(msg));
  } catch {
    /* no native bridge */
  }
}
