const crypto = require('crypto');
const admin = require('firebase-admin');
const notificationService = require('./notificationService');
const db = admin.firestore();

function verifyPaystackSignature(req) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  return hash === req.headers['x-paystack-signature'];
}

async function handlePaymentSuccess(data) {
  const { reference, amount, metadata } = data;
  const nairaAmount = Math.round(amount / 100);
  const paymentDoc = {
    reference,
    amount: nairaAmount,
    metadata,
    status: 'success',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection('payments').doc(reference).set(paymentDoc, { merge: true });
  if (metadata && metadata.orderId) {
    await db.collection('orders').doc(metadata.orderId).set({ paymentStatus: 'paid', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  // Notify seller and buyer
  if (metadata && metadata.sellerPhone) {
    await notificationService.sendPaymentConfirmationSeller(metadata.sellerPhone, {
      amount: nairaAmount,
      productName: metadata.productName || '',
      customerName: metadata.customerName || '',
      reference,
    });
  }
  if (metadata && metadata.buyerPhone) {
    await notificationService.sendPaymentConfirmationBuyer(metadata.buyerPhone, {
      amount: nairaAmount,
      productName: metadata.productName || '',
      sellerName: metadata.sellerName || '',
      reference,
    });
  }
}

async function paystackWebhookHandler(req, res) {
  res.status(200).send('ok');
  try {
    if (!verifyPaystackSignature(req)) {
      console.error('❌ Invalid Paystack signature');
      return;
    }
    const event = req.body;
    if (event.event === 'charge.success') {
      await handlePaymentSuccess(event.data);
    }
  } catch (err) {
    console.error('❌ Paystack webhook error:', err.message);
  }
}

module.exports = { paystackWebhookHandler };
