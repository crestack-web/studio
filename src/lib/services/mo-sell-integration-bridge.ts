/**
 * MO Sell Integration Bridge
 *
 * Atomically writes a confirmed Paystack order into all Busmo modules:
 * storeOrder, stock decrement, sale, customer upsert, cashFlow, notifications.
 *
 * All writes are committed in a single Firestore WriteBatch via Admin SDK.
 * If the batch fails, no partial state is created.
 */

import { getAdminDb } from '@/lib/firebase-admin';
import type {
  IntegrationBridgeParams,
  IntegrationBridgeResult,
  OrderLineItem,
  CheckoutSession,
  StoreConfig,
} from '@/types/mo-sell.types';
import { FieldValue } from 'firebase-admin/firestore';

// ─── Email helpers (fire-and-forget, non-blocking) ────────────────────────────

async function sendOrderConfirmationEmail(params: {
  customerEmail: string;
  orderNumber: string;
  lineItems: OrderLineItem[];
  total: number;
  storeName: string;
  orderUrl: string;
}): Promise<void> {
  // Uses the existing sendgrid pattern in src/services/email/
  try {
    await fetch(`${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/email/order-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.error('[IntegrationBridge] sendOrderConfirmationEmail failed:', err);
  }
}

async function sendNewOrderEmail(params: {
  merchantEmail: string;
  orderNumber: string;
  customerName: string;
  total: number;
  storeName: string;
}): Promise<void> {
  try {
    await fetch(`${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/email/new-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.error('[IntegrationBridge] sendNewOrderEmail failed:', err);
  }
}

// ─── Order number generation ───────────────────────────────────────────────────

async function getNextOrderNumber(db: ReturnType<typeof getAdminDb>, businessId: string): Promise<string> {
  const snap = await db
    .collection('businesses').doc(businessId)
    .collection('storeOrders')
    .count()
    .get();
  const count = (snap.data()?.count ?? 0) + 1;
  return `ORD-${String(count).padStart(5, '0')}`;
}

// ─── Main function ─────────────────────────────────────────────────────────────

export async function processConfirmedOrder(
  params: IntegrationBridgeParams
): Promise<IntegrationBridgeResult> {
  const { businessId, sessionId, paystackData } = params;
  const db = getAdminDb();
  const now = new Date();
  const timestamp = FieldValue.serverTimestamp();

  // 1. Load checkout session
  const sessionRef = db
    .collection('businesses').doc(businessId)
    .collection('checkoutSessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new Error(`CheckoutSession ${sessionId} not found`);
  }
  const session = sessionSnap.data() as CheckoutSession;

  // 2. Load store config for email + canonical URL
  const configSnap = await db
    .collection('businesses').doc(businessId)
    .collection('store').doc('config')
    .get();
  const config = configSnap.data() as StoreConfig | undefined;

  const storeName = config?.storeName ?? 'Your Store';
  const storeLinkBase =
    config?.customDomainStatus === 'verified' && config?.customDomain
      ? `https://${config.customDomain}`
      : `https://busmo.io/store/${config?.storeSlug ?? ''}`;

  // 3. Derive order total from Paystack (source of truth: kobo → NGN)
  const verifiedTotal = paystackData.amount / 100;
  const orderId = db.collection('businesses').doc(businessId).collection('storeOrders').doc().id;
  const orderNumber = await getNextOrderNumber(db, businessId);
  const orderUrl = `${storeLinkBase}/order/${orderId}`;

  const batch = db.batch();

  // ── Write 1: Create StoreOrder ─────────────────────────────────────────────
  const orderRef = db
    .collection('businesses').doc(businessId)
    .collection('storeOrders').doc(orderId);

  batch.set(orderRef, {
    orderNumber,
    customerName:    session.customerName,
    customerEmail:   session.customerEmail,
    customerPhone:   session.customerPhone,
    deliveryOption:  session.deliveryOption,
    shippingAddress: session.shippingAddress,
    shippingZoneId:  session.shippingZoneId,
    shippingCost:    session.shippingCost,
    lineItems:       session.lineItems,
    subtotal:        session.subtotal,
    total:           verifiedTotal,
    paystackReference: paystackData.reference,
    status:          'paid',
    paymentStatus:   'paid',
    trackingNumber:  null,
    carrier:         null,
    statusHistory: [{
      status:    'paid',
      timestamp: FieldValue.serverTimestamp(),
      changedBy: 'system',
    }],
    integrationStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // ── Write 2: Decrement stock (physical products only) ──────────────────────
  // Validate stock before decrementing to prevent overselling
  const physicalItems = session.lineItems.filter(item => item.productType === 'physical');
  for (const item of physicalItems) {
    if (!item.productId) continue;
    const productSnap = await db
      .collection('businesses').doc(businessId)
      .collection('storeProducts').doc(item.productId)
      .get();
    if (productSnap.exists) {
      const currentStock = productSnap.data()?.stock ?? 0;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for "${item.displayName}": requested ${item.quantity}, available ${currentStock}`);
      }
    }
    const productRef = db
      .collection('businesses').doc(businessId)
      .collection('storeProducts').doc(item.productId);
    batch.update(productRef, {
      stock: FieldValue.increment(-item.quantity),
      updatedAt: timestamp,
    });
  }

  // ── Write 3: Create sales record ───────────────────────────────────────────
  const saleRef = db
    .collection('businesses').doc(businessId)
    .collection('sales').doc();

  batch.set(saleRef, {
    products: session.lineItems.map(item => ({
      productId:   item.productId,
      name:        item.displayName,
      quantity:    item.quantity,
      price:       item.unitPrice,
      total:       item.lineTotal,
    })),
    total:         verifiedTotal,
    paymentMethod: 'online',
    source:        'mo_sell',
    orderId,
    orderNumber,
    customerName:  session.customerName,
    customerEmail: session.customerEmail,
    createdAt:     timestamp,
    updatedAt:     timestamp,
  });

  // ── Write 4: Upsert customer ───────────────────────────────────────────────
  // Check for existing customer by email first
  const existingCustomers = await db
    .collection('businesses').doc(businessId)
    .collection('customers')
    .where('email', '==', session.customerEmail)
    .limit(1)
    .get();

  if (!existingCustomers.empty) {
    const custRef = existingCustomers.docs[0].ref;
    batch.update(custRef, {
      totalOrders: FieldValue.increment(1),
      totalSpend:  FieldValue.increment(verifiedTotal),
      updatedAt:   timestamp,
    });
  } else {
    const custRef = db
      .collection('businesses').doc(businessId)
      .collection('customers').doc();
    batch.set(custRef, {
      name:        session.customerName,
      email:       session.customerEmail,
      phone:       session.customerPhone,
      totalOrders: 1,
      totalSpend:  verifiedTotal,
      source:      'mo_sell',
      createdAt:   timestamp,
      updatedAt:   timestamp,
    });
  }

  // ── Write 5: Cash flow entry ───────────────────────────────────────────────
  const cashFlowRef = db
    .collection('businesses').doc(businessId)
    .collection('cashFlow').doc();

  batch.set(cashFlowRef, {
    type:        'income',
    source:      'mo_sell',
    amount:      verifiedTotal,
    description: `Online order ${orderNumber}`,
    orderId,
    date:        timestamp,
    createdAt:   timestamp,
  });

  // ── Write 6: New-order notification ───────────────────────────────────────
  const notifRef = db
    .collection('businesses').doc(businessId)
    .collection('notifications').doc();

  batch.set(notifRef, {
    type:        'new_order',
    orderId,
    orderNumber,
    customerName: session.customerName,
    amount:       verifiedTotal,
    read:         false,
    createdAt:    timestamp,
  });

  // ── Write 7: Low-stock notifications ──────────────────────────────────────
  for (const item of physicalItems) {
    if (!item.productId) continue;
    const prodSnap = await db
      .collection('businesses').doc(businessId)
      .collection('storeProducts').doc(item.productId)
      .get();
    if (!prodSnap.exists) continue;
    const prodData = prodSnap.data()!;
    const currentStock    = (prodData.stock ?? 0) - item.quantity;
    const lowStockThreshold = prodData.lowStockThreshold ?? 5;
    if (currentStock <= lowStockThreshold) {
      const lowStockRef = db
        .collection('businesses').doc(businessId)
        .collection('notifications').doc();
      batch.set(lowStockRef, {
        type:       'low_stock',
        productId:  item.productId,
        productName: item.displayName,
        stockLeft:  currentStock,
        read:       false,
        createdAt:  timestamp,
      });
    }
  }

  // ── Write 8: Store earnings (only when managedPayments is enabled) ─────────
  const COMMISSION_RATE = 0.05; // 5% platform commission
  if (config?.managedPayments === true) {
    const commissionAmount = Math.round(verifiedTotal * COMMISSION_RATE * 100) / 100;
    const netAmount        = Math.round((verifiedTotal - commissionAmount) * 100) / 100;
    const earningRef = db
      .collection('businesses').doc(businessId)
      .collection('storeEarnings').doc();
    batch.set(earningRef, {
      orderId,
      orderNumber,
      customerName:     session.customerName,
      grossAmount:      verifiedTotal,
      commissionRate:   COMMISSION_RATE,
      commissionAmount,
      netAmount,
      currency:         config.currency ?? 'NGN',
      status:           'pending',
      payoutRequestId:  null,
      createdAt:        timestamp,
      updatedAt:        timestamp,
    });
  }

  // ── Commit all writes atomically ───────────────────────────────────────────
  try {
    await batch.commit();
  } catch (batchErr) {
    console.error('[IntegrationBridge] Batch commit failed:', {
      businessId, sessionId, error: batchErr,
    });
    // Mark session as integration_pending for merchant retry UI
    await sessionRef.update({
      status: 'payment_confirmed_integration_pending',
      updatedAt: FieldValue.serverTimestamp(),
    }).catch(() => {/* non-fatal */});
    throw batchErr;
  }

  // ── Fire-and-forget emails (non-blocking) ─────────────────────────────────
  sendOrderConfirmationEmail({
    customerEmail: session.customerEmail,
    orderNumber,
    lineItems:     session.lineItems,
    total:         verifiedTotal,
    storeName,
    orderUrl,
  }).catch(console.error);

  if (config?.contactEmail) {
    sendNewOrderEmail({
      merchantEmail: config.contactEmail,
      orderNumber,
      customerName:  session.customerName,
      total:         verifiedTotal,
      storeName,
    }).catch(console.error);
  }

  return { orderId };
}
