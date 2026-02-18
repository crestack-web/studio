const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

async function listSubscriberUids(businessId) {
  const subscribersRef = db.collection(`businessProfiles/${businessId}/subscribers`);
  const docIdField = admin.firestore.FieldPath.documentId();

  const uids = [];
  let lastDoc = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = subscribersRef.orderBy(docIdField).limit(500);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snap = await query.get();
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      if (docSnap.id) uids.push(docSnap.id);
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < 500) break;
  }

  return uids;
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

/**
 * Notify subscribers when a seller adds a new market product.
 * Writes notifications to: users/{uid}/notifications/{notificationId}
 */
exports.onMarketProductCreatedNotifySubscribers = functions.firestore.document('marketProducts/{productId}').onCreate(async (snap, context) => {
  const productId = event?.params?.productId;
  const product = event?.data?.data?.() || {};

  const businessId = product?.businessId;
  if (!businessId || !productId) return null;

  let subscriberUids = [];
  try {
    subscriberUids = await listSubscriberUids(businessId);
  } catch (error) {
    console.error('Failed to list subscribers for business', { businessId, error: error?.message || String(error) });
    return null;
  }

  if (!subscriberUids.length) return null;

  let businessName = 'a store';
  let slug = null;
  try {
    const profileSnap = await db.doc(`businessProfiles/${businessId}`).get();
    if (profileSnap.exists) {
      const profile = profileSnap.data() || {};
      businessName = profile.businessName || businessName;
      slug = profile.slug || null;
    }
  } catch {
    // ignore
  }

  const productName = product?.productName || 'New product';
  const href = `/market/product/${productId}`;

  const title = `New product from ${businessName}`;
  const body = `${productName} is now available.`;

  const now = admin.firestore.FieldValue.serverTimestamp();

  // Firestore batch limit is 500 operations; keep margin.
  const uidChunks = chunk(subscriberUids, 450);

  for (const uids of uidChunks) {
    const batch = db.batch();

    for (const uid of uids) {
      const notifRef = db.doc(`users/${uid}/notifications/store_new_product_${productId}`);
      batch.set(
        notifRef,
        {
          type: 'store_new_product',
          businessId,
          businessName,
          businessSlug: slug,
          productId,
          productName,
          title,
          body,
          href,
          createdAt: now,
          read: false,
        },
        { merge: true }
      );
    }

    try {
      await batch.commit();
    } catch (error) {
      console.error('Failed to write subscriber notifications batch', {
        businessId,
        productId,
        error: error?.message || String(error),
      });
    }
  }

  console.log('Subscriber notifications queued', { businessId, productId, subscribers: subscriberUids.length });
  return null;
});
