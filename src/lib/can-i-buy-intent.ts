/** Handoff from MO nudges / inventory into Can I Buy This? */

export const CAN_I_BUY_INTENT_KEY = 'busmo-can-i-buy-intent-v1';

export interface CanIBuyIntent {
  productId?: string;
  productName: string;
  /** Suggested restock spend */
  amount?: number;
  stock?: number;
  reorderLevel?: number;
  unitCost?: number;
  source?: string;
  createdAt: string;
}

export function setCanIBuyIntent(intent: Omit<CanIBuyIntent, 'createdAt'> & { createdAt?: string }) {
  if (typeof window === 'undefined') return;
  try {
    const payload: CanIBuyIntent = {
      ...intent,
      productName: intent.productName || 'Stock',
      createdAt: intent.createdAt || new Date().toISOString(),
    };
    sessionStorage.setItem(CAN_I_BUY_INTENT_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function consumeCanIBuyIntent(): CanIBuyIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CAN_I_BUY_INTENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(CAN_I_BUY_INTENT_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.productName !== 'string') return null;
    return parsed as CanIBuyIntent;
  } catch {
    return null;
  }
}

/** Estimate restock cost: buy enough to reach 2× reorder (or +10 units) */
export function estimateRestockAmount(p: {
  stock?: number;
  reorderLevel?: number;
  unitCost?: number;
}): number {
  const stock = Number(p.stock) || 0;
  const reorder = Math.max(1, Number(p.reorderLevel) || 5);
  const unitCost = Number(p.unitCost) || 0;
  const target = Math.max(reorder * 2, stock + reorder);
  const qty = Math.max(1, Math.ceil(target - stock));
  if (unitCost <= 0) return 0;
  return Math.round(qty * unitCost * 100) / 100;
}
