/**
 * Recycling & Material Collection — domain helpers.
 * Central calc: totalAmount = weightKg × pricePerKg (historical price stored on purchase).
 */

export type MaterialPaymentStatus = 'paid' | 'partial' | 'unpaid';

export const MATERIAL_PAYMENT_STATUSES: { id: MaterialPaymentStatus; label: string }[] = [
  { id: 'paid', label: 'Paid' },
  { id: 'partial', label: 'Partially paid' },
  { id: 'unpaid', label: 'Unpaid' },
];

/** Default materials for V1; more can be added without schema change. */
export const DEFAULT_RECYCLABLE_MATERIALS = [
  { name: 'PET Bottles', unit: 'kg' },
  { name: 'HDPE', unit: 'kg' },
  { name: 'Aluminium', unit: 'kg' },
  { name: 'Cardboard', unit: 'kg' },
  { name: 'Copper', unit: 'kg' },
] as const;

export function calcPurchaseTotal(weightKg: number, pricePerKg: number): number {
  const w = Number(weightKg) || 0;
  const p = Number(pricePerKg) || 0;
  return Math.round(w * p * 100) / 100;
}

export function derivePaymentStatus(totalAmount: number, amountPaid: number): MaterialPaymentStatus {
  const total = Number(totalAmount) || 0;
  const paid = Number(amountPaid) || 0;
  if (paid <= 0) return 'unpaid';
  if (paid >= total - 0.001) return 'paid';
  return 'partial';
}

export function calcBalance(totalAmount: number, amountPaid: number): number {
  return Math.max(0, Math.round(((Number(totalAmount) || 0) - (Number(amountPaid) || 0)) * 100) / 100);
}

export function paymentStatusLabel(status: string): string {
  return MATERIAL_PAYMENT_STATUSES.find((s) => s.id === status)?.label || status;
}

export function validatePurchaseInput(input: {
  supplierId?: string | null;
  materialId?: string | null;
  weightKg: number;
  pricePerKg: number;
  amountPaid: number;
}): string | null {
  if (!input.supplierId) return 'Supplier is required';
  if (!input.materialId) return 'Material is required';
  if (!(Number(input.weightKg) > 0)) return 'Weight must be greater than 0 kg';
  if (Number(input.pricePerKg) < 0) return 'Price per kg cannot be negative';
  if (Number(input.amountPaid) < 0) return 'Amount paid cannot be negative';
  const total = calcPurchaseTotal(input.weightKg, input.pricePerKg);
  if (Number(input.amountPaid) > total + 0.01) return 'Amount paid cannot exceed total';
  return null;
}


/** Weighted average buy cost per kg from purchases for a material. */
export function avgCostPerKg(
  purchases: Array<{ materialId?: string; weightKg?: number; totalAmount?: number; pricePerKg?: number }>
): number {
  let kg = 0;
  let spend = 0;
  for (const p of purchases) {
    const w = Number(p.weightKg) || 0;
    const s =
      Number(p.totalAmount) ||
      (Number(p.pricePerKg) || 0) * w ||
      0;
    if (w <= 0) continue;
    kg += w;
    spend += s;
  }
  if (kg <= 0) return 0;
  return Math.round((spend / kg) * 10000) / 10000;
}

export function calcMaterialStockKg(
  purchases: Array<{ weightKg?: number }>,
  sales: Array<{ weightKg?: number }>
): number {
  const inKg = purchases.reduce((a, p) => a + (Number(p.weightKg) || 0), 0);
  const outKg = sales.reduce((a, s) => a + (Number(s.weightKg) || 0), 0);
  return Math.round((inKg - outKg) * 1000) / 1000;
}

export function calcSaleRevenue(weightKg: number, sellPricePerKg: number): number {
  return Math.round((Number(weightKg) || 0) * (Number(sellPricePerKg) || 0) * 100) / 100;
}

export function calcSaleProfit(
  weightKg: number,
  sellPricePerKg: number,
  costPerKg: number
): { revenue: number; costOfGoods: number; profit: number } {
  const revenue = calcSaleRevenue(weightKg, sellPricePerKg);
  const costOfGoods = Math.round((Number(weightKg) || 0) * (Number(costPerKg) || 0) * 100) / 100;
  return {
    revenue,
    costOfGoods,
    profit: Math.round((revenue - costOfGoods) * 100) / 100,
  };
}

export function validateSaleInput(input: {
  materialId?: string | null;
  weightKg: number;
  sellPricePerKg: number;
  availableKg: number;
}): string | null {
  if (!input.materialId) return 'Material is required';
  if (!(Number(input.weightKg) > 0)) return 'Weight must be greater than 0 kg';
  if (Number(input.sellPricePerKg) < 0) return 'Sell price cannot be negative';
  if (Number(input.weightKg) > Number(input.availableKg) + 0.001) {
    return `Only ${Number(input.availableKg).toFixed(2)} kg available in stock`;
  }
  return null;
}
