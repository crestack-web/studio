/**
 * Busmo internal barcode identifiers.
 * Format: BSM-<base36 unique> — NOT a GS1 GTIN/EAN/UPC.
 */

export const BUSMO_BARCODE_PREFIX = 'BSM-';

export function isBusmoInternalBarcode(code: string): boolean {
  return String(code || '').trim().toUpperCase().startsWith(BUSMO_BARCODE_PREFIX);
}

/** Client-safe candidate; server must still verify uniqueness per business. */
export function proposeBusmoBarcode(seed?: string): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  const s = (seed || '').replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase();
  return `${BUSMO_BARCODE_PREFIX}${s}${t}${r}`.slice(0, 24);
}

export function normalizeBarcode(code: string): string {
  return String(code || '').trim();
}
