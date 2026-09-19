function estimatedJobCost(job) {
  return (Number(job.estimatedMaterials)||0)+(Number(job.estimatedLabour)||0)+(Number(job.estimatedTransport)||0)+(Number(job.estimatedOther)||0);
}
function jobFinancials({ quotedPrice, totalPaid, actualCost, estimatedCost }) {
  const revenue = Number(quotedPrice)||0;
  const paid = Number(totalPaid)||0;
  const customerBalance = Math.max(0, revenue - paid);
  const expectedProfit = revenue - estimatedCost;
  const actualProfit = revenue - actualCost;
  const margin = revenue > 0 ? (actualProfit / revenue) * 100 : 0;
  return { revenue, paid, customerBalance, actualCost, estimatedCost, expectedProfit, actualProfit, margin };
}
function sellingPriceForMargin(cost, marginPercent) {
  const m = Number(marginPercent)||0;
  if (m >= 100 || m <= 0) return Number(cost)||0;
  return (Number(cost)||0) / (1 - m / 100);
}
function assert(c, m) { if (!c) { console.error('FAIL', m); process.exit(1);} console.log('\u2713', m); }
const est = estimatedJobCost({ estimatedMaterials:700000, estimatedLabour:150000, estimatedTransport:50000, estimatedOther:0 });
assert(est === 900000, 'estimated cost sums');
const f = jobFinancials({ quotedPrice:1500000, totalPaid:800000, actualCost:1020000, estimatedCost:900000 });
assert(f.customerBalance === 700000, 'customer balance');
assert(f.expectedProfit === 600000, 'expected profit');
assert(f.actualProfit === 480000, 'actual profit');
assert(Math.abs(f.margin - 32) < 0.01, 'margin ~32%');
const price = sellingPriceForMargin(900000, 35);
assert(Math.abs(price - 900000/0.65) < 1, 'selling price for 35% margin');
assert(f.customerBalance !== f.actualProfit, 'balance \u2260 profit');
console.log('\nAll jobs financial unit tests passed.');
