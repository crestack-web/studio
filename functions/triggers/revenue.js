const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

const STATS_DOC_PATH = 'platformStats/revenue';

function safeNumber(value) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getAmountFromSaleDoc(data) {
  if (!data) return 0;
  // Current POS implementation uses `amount`.
  return safeNumber(data.amount);
}

function getAmountFromOrderDoc(data) {
  if (!data) return 0;
  return safeNumber(data.total);
}

async function applyIncrement(transaction, { totalDelta = 0, salesDelta = 0, ordersDelta = 0 }) {
  if (!totalDelta && !salesDelta && !ordersDelta) return;

  const statsRef = db.doc(STATS_DOC_PATH);
  transaction.set(
    statsRef,
    {
      totalNgn: admin.firestore.FieldValue.increment(totalDelta),
      recordedSalesNgn: admin.firestore.FieldValue.increment(salesDelta),
      marketOrdersNgn: admin.firestore.FieldValue.increment(ordersDelta),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Aggregates ALL recorded POS sales into a single global counter.
 * NOTE: This assumes amounts are NGN (BusmoPay is NGN-only today).
 */
exports.onSaleWrite = functions.firestore
  .document('businesses/{businessId}/sales/{saleId}')
  .onWrite(async (change) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const beforeAmount = getAmountFromSaleDoc(before);
    const afterAmount = getAmountFromSaleDoc(after);

    const delta = afterAmount - beforeAmount;
    if (!delta) return null;

    try {
      await db.runTransaction(async (transaction) => {
        await applyIncrement(transaction, {
          totalDelta: delta,
          salesDelta: delta,
          ordersDelta: 0,
        });
      });
    } catch (error) {
      console.error('onSaleWrite revenue aggregation failed', error);
    }

    return null;
  });

/**
 * Aggregates BusmoPay marketplace orders AFTER payment is verified (paymentStatus === 'paid').
 */
exports.onOrderWriteForRevenue = functions.firestore
  .document('businesses/{businessId}/orders/{orderId}')
  .onWrite(async (change) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const beforeIsBusmoPay = before && before.payment === 'busmopay';
    const afterIsBusmoPay = after && after.payment === 'busmopay';

    const beforePaid = beforeIsBusmoPay && before.paymentStatus === 'paid';
    const afterPaid = afterIsBusmoPay && after.paymentStatus === 'paid';

    // Only count paid BusmoPay orders.
    const beforeAmount = beforePaid ? getAmountFromOrderDoc(before) : 0;
    const afterAmount = afterPaid ? getAmountFromOrderDoc(after) : 0;

    const delta = afterAmount - beforeAmount;
    if (!delta) return null;

    try {
      await db.runTransaction(async (transaction) => {
        await applyIncrement(transaction, {
          totalDelta: delta,
          salesDelta: 0,
          ordersDelta: delta,
        });
      });
    } catch (error) {
      console.error('onOrderWriteForRevenue aggregation failed', error);
    }

    return null;
  });
