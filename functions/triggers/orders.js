const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendTransactionalEmail } = require('../email/service');

const db = admin.firestore();

function formatMoney(amount, currencySymbol) {
  const safe = Number.isFinite(amount) ? Number(amount) : 0;
  const formatted = Math.round(safe).toLocaleString();
  if (!currencySymbol) return formatted;
  return currencySymbol === 'CFA' ? `${formatted} ${currencySymbol}` : `${currencySymbol}${formatted}`;
}

function safeToDate(value) {
  if (!value) return null;
  if (value.toDate && typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

exports.onOrderCreate = functions.firestore
  .document('businesses/{businessId}/orders/{orderId}')
  .onCreate(async (snap, context) => {
    const { businessId, orderId } = context.params;
    const order = snap.data() || {};

    try {
      // Find owner recipients for this business
      const ownersSnap = await db
        .collection('users')
        .where('role', '==', 'Owner')
        .where('businessId', '==', businessId)
        .get();

      if (ownersSnap.empty) return null;

      const businessProfileSnap = await db.collection('businessProfiles').doc(businessId).get().catch(() => null);
      const businessProfile = businessProfileSnap && businessProfileSnap.exists ? businessProfileSnap.data() : {};
      const businessSnap = await db.collection('businesses').doc(businessId).get().catch(() => null);
      const business = businessSnap && businessSnap.exists ? businessSnap.data() : {};

      const businessName = businessProfile.businessName || business.businessName || 'your business';
      const currencySymbol = businessProfile.currency || business.currency || '';

      const createdAt = safeToDate(order.createdAt) || new Date();
      const dateLabel = createdAt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

      const customerName = order.customer?.name || 'Customer';
      const customerPhone = order.customer?.phone || '';
      const status = order.status || 'pending';
      const itemsCount = Array.isArray(order.items) ? order.items.reduce((acc, it) => acc + Number(it.quantity || 0), 0) : 0;
      const total = Number(order.total || 0);
      const totalFormatted = formatMoney(total, currencySymbol);

      const publicAppUrl = process.env.PUBLIC_APP_URL || process.env.PUBLIC_BRAND_HOST || 'https://busmo.web.app';
      const ordersUrl = `${publicAppUrl}/owner/market?section=orders`;

      const itemLines = Array.isArray(order.items)
        ? order.items.slice(0, 6).map(it => {
            const name = it.variantName ? `${it.productName} (${it.variantName})` : it.productName;
            return `${name} × ${Number(it.quantity || 0)}`;
          })
        : [];

      const recipients = ownersSnap.docs
        .map(d => d.data())
        .filter(u => u.emailNotificationsEnabled !== false)
        .map(u => u.email)
        .filter(Boolean);

      if (recipients.length === 0) return null;

      await Promise.all(
        recipients.map(to =>
          sendTransactionalEmail({
            to,
            templateId: 'owner_new_order',
            data: {
              businessName,
              dateLabel,
              orderId,
              customerName,
              customerPhone,
              status,
              itemsCount,
              totalFormatted,
              itemLines,
              hasMoreItems: Array.isArray(order.items) ? order.items.length > itemLines.length : false,
              ordersUrl,
            },
          })
        )
      );

      console.log('New order emails sent', { businessId, orderId, recipients: recipients.length });
    } catch (error) {
      console.error('Failed to send new order email', {
        businessId,
        orderId,
        error: error && error.message ? error.message : String(error),
      });
    }

    return null;
  });
