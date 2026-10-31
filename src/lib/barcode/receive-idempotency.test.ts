/**
 * Receive idempotency semantics (in-memory model).
 * Run: npx tsx src/lib/barcode/receive-idempotency.test.ts
 */

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

type Receipt = { operationId: string; applied: boolean };
const receipts = new Map<string, Receipt>();
const stock = new Map<string, number>();

function receive(businessId: string, operationId: string, productId: string, qty: number) {
  const key = `${businessId}:${operationId}`;
  if (receipts.has(key)) {
    return { duplicate: true, stock: stock.get(productId) || 0 };
  }
  receipts.set(key, { operationId, applied: true });
  stock.set(productId, (stock.get(productId) || 0) + qty);
  return { duplicate: false, stock: stock.get(productId) || 0 };
}

stock.set('p1', 10);
const r1 = receive('biz', 'op-1', 'p1', 5);
assert(r1.duplicate === false && r1.stock === 15, 'first apply');
const r2 = receive('biz', 'op-1', 'p1', 5);
assert(r2.duplicate === true && r2.stock === 15, 'retry same operationId no double stock');
const r3 = receive('biz', 'op-2', 'p1', 3);
assert(r3.duplicate === false && r3.stock === 18, 'new operation applies');
const r4 = receive('biz-other', 'op-1', 'p1', 5);
assert(r4.duplicate === false, 'same operationId other business is separate key in model');

console.log('receive-idempotency.test.ts OK');
