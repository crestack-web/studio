const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

const db = admin.firestore();

const STATS_DOC_PATH = 'platformStats/revenue';
const BACKFILL_REQUESTS_PATH = 'maintenance/revenueBackfillRequests/{requestId}';

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

async function sumCollectionGroup(groupName, { selectFields = [], shouldIncludeDoc, getAmount }) {
  let total = 0;
  let docCount = 0;

  const docIdField = admin.firestore.FieldPath.documentId();

  let baseQuery = db.collectionGroup(groupName).orderBy(docIdField).limit(500);
  if (selectFields.length) baseQuery = baseQuery.select(...selectFields);

  let lastDoc = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = baseQuery;
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (shouldIncludeDoc && !shouldIncludeDoc(data)) continue;

      total += safeNumber(getAmount(data));
      docCount += 1;
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  return { total, docCount };
}

async function recomputeRevenueTotals() {
  const sales = await sumCollectionGroup('sales', {
    selectFields: ['amount'],
    getAmount: (data) => getAmountFromSaleDoc(data),
  });

  const orders = await sumCollectionGroup('orders', {
    selectFields: ['payment', 'paymentStatus', 'total'],
    shouldIncludeDoc: (data) => data?.payment === 'busmopay' && data?.paymentStatus === 'paid',
    getAmount: (data) => getAmountFromOrderDoc(data),
  });

  return {
    recordedSalesNgn: sales.total,
    marketOrdersNgn: orders.total,
    totalNgn: sales.total + orders.total,
    salesDocCount: sales.docCount,
    paidBusmoPayOrdersDocCount: orders.docCount,
  };
}

/**
 * Aggregates ALL recorded POS sales into a single global counter.
 * NOTE: This assumes amounts are NGN (BusmoPay is NGN-only today).
 */
exports.onSaleWrite = onDocumentWritten('businesses/{businessId}/sales/{saleId}', async (event) => {
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;

    const before = beforeSnap && beforeSnap.exists ? beforeSnap.data() : null;
    const after = afterSnap && afterSnap.exists ? afterSnap.data() : null;

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
exports.onOrderWriteForRevenue = onDocumentWritten('businesses/{businessId}/orders/{orderId}', async (event) => {
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;

    const before = beforeSnap && beforeSnap.exists ? beforeSnap.data() : null;
    const after = afterSnap && afterSnap.exists ? afterSnap.data() : null;

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

/**
 * Admin-only backfill: recompute platformStats/revenue from existing docs.
 * Trigger by creating a doc under maintenance/revenueBackfillRequests/.
 */
exports.onRevenueBackfillRequestCreate = onDocumentCreated(
  {
    document: BACKFILL_REQUESTS_PATH,
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async (event) => {
    const requestRef = event.data?.ref;
    const requestData = event.data?.data?.() || {};

    if (!requestRef) return;

    try {
      await requestRef.set(
        {
          status: 'running',
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const totals = await recomputeRevenueTotals();

      await db.doc(STATS_DOC_PATH).set(
        {
          totalNgn: totals.totalNgn,
          recordedSalesNgn: totals.recordedSalesNgn,
          marketOrdersNgn: totals.marketOrdersNgn,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          backfilledAt: admin.firestore.FieldValue.serverTimestamp(),
          backfillMeta: {
            salesDocCount: totals.salesDocCount,
            paidBusmoPayOrdersDocCount: totals.paidBusmoPayOrdersDocCount,
            requestedBy: requestData?.requestedBy || null,
          },
        },
        { merge: true }
      );

      await requestRef.set(
        {
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          result: totals,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Revenue backfill failed', error);
      await requestRef.set(
        {
          status: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: String(error?.message || error),
        },
        { merge: true }
      );
    }
  }
);
