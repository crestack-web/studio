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
