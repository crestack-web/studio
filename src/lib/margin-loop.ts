/**
 * Margin loop — persist price applies so MO can follow up later.
 */

export interface MarginApplyRecord {
  productId: string;
  businessId: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  cost: number;
  targetMargin: number;
  appliedAt: string; // ISO
  /** Suggested re-check date (default +7 days) */
  checkAfter: string;
}

function key(businessId: string) {
  return `busmo-margin-applies-v1:${businessId}`;
}

export function loadMarginApplies(businessId: string): MarginApplyRecord[] {
  if (!businessId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key(businessId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMarginApply(record: MarginApplyRecord): void {
  if (!record.businessId || typeof window === 'undefined') return;
  try {
    const list = loadMarginApplies(record.businessId).filter(
      (r) => r.productId !== record.productId
    );
    list.unshift(record);
    localStorage.setItem(key(record.businessId), JSON.stringify(list.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

export function suggestedPriceForMargin(cost: number, targetMarginPct: number): number {
  const m = Math.min(95, Math.max(0, targetMarginPct)) / 100;
  if (cost <= 0 || m >= 1) return cost;
  return cost / (1 - m);
}
