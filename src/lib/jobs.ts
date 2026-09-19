/**
 * Jobs & Projects — domain helpers (money + materials + profitability).
 */
export type JobStatus =
  | 'quoted' | 'approved' | 'deposit_paid' | 'in_progress' | 'ready' | 'completed' | 'cancelled';

export type JobCostType = 'materials' | 'labour' | 'transport' | 'installation' | 'other';

export const JOB_STATUSES: { id: JobStatus; label: string }[] = [
  { id: 'quoted', label: 'Quoted' },
  { id: 'approved', label: 'Approved' },
  { id: 'deposit_paid', label: 'Deposit Paid' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const JOB_COST_TYPES: { id: JobCostType; label: string }[] = [
  { id: 'materials', label: 'Materials' },
  { id: 'labour', label: 'Labour' },
  { id: 'transport', label: 'Transport' },
  { id: 'installation', label: 'Installation' },
  { id: 'other', label: 'Other' },
];

export const ACTIVE_JOB_STATUSES: JobStatus[] = [
  'quoted', 'approved', 'deposit_paid', 'in_progress', 'ready',
];

export function statusLabel(status: string): string {
  return JOB_STATUSES.find((s) => s.id === status)?.label || status;
}

export function sumAmounts(items: Array<{ amount?: number | null }> | null | undefined): number {
  if (!items?.length) return 0;
  return items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
}

export function estimatedJobCost(job: {
  estimatedMaterials?: number | null; estimated_materials?: number | null;
  estimatedLabour?: number | null; estimated_labour?: number | null;
  estimatedTransport?: number | null; estimated_transport?: number | null;
  estimatedOther?: number | null; estimated_other?: number | null;
}): number {
  return (
    (Number(job.estimatedMaterials ?? job.estimated_materials) || 0) +
    (Number(job.estimatedLabour ?? job.estimated_labour) || 0) +
    (Number(job.estimatedTransport ?? job.estimated_transport) || 0) +
    (Number(job.estimatedOther ?? job.estimated_other) || 0)
  );
}

export function jobFinancials(params: {
  quotedPrice: number; totalPaid: number; actualCost: number; estimatedCost: number;
}) {
  const revenue = Number(params.quotedPrice) || 0;
  const paid = Number(params.totalPaid) || 0;
  const actualCost = Number(params.actualCost) || 0;
  const estimatedCost = Number(params.estimatedCost) || 0;
  const customerBalance = Math.max(0, revenue - paid);
  const expectedProfit = revenue - estimatedCost;
  const actualProfit = revenue - actualCost;
  const margin = revenue > 0 ? (actualProfit / revenue) * 100 : 0;
  const expectedMargin = revenue > 0 ? (expectedProfit / revenue) * 100 : 0;
  return { revenue, paid, customerBalance, actualCost, estimatedCost, expectedProfit, actualProfit, margin, expectedMargin };
}

export function sellingPriceForMargin(cost: number, marginPercent: number): number {
  const m = Number(marginPercent) || 0;
  if (m >= 100 || m <= 0) return Number(cost) || 0;
  return (Number(cost) || 0) / (1 - m / 100);
}

export function groupCostsByType(
  costs: Array<{ costType?: string; cost_type?: string; amount?: number }>
): Record<JobCostType, number> {
  const out: Record<JobCostType, number> = { materials: 0, labour: 0, transport: 0, installation: 0, other: 0 };
  for (const c of costs || []) {
    const t = String(c.costType ?? c.cost_type ?? 'other') as JobCostType;
    if (t in out) out[t] += Number(c.amount) || 0;
    else out.other += Number(c.amount) || 0;
  }
  return out;
}
