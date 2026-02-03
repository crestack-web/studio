// functions/payments.js
/**
 * @fileoverview This file contains all Paystack payment-related Cloud Functions.
 * It provides a clean, minimal, and secure backend for initializing payments
 * and handling webhooks. This logic is completely isolated from other business logic.
 */

const functions = require("firebase-functions");
const axios = require("axios");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");

// Initialize Firestore if not already done
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();


// It's critical to set PAYSTACK_SECRET_KEY in your Firebase environment configuration.
// `firebase functions:config:set paystack.secret_key="sk_..."`
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error("FATAL ERROR: PAYSTACK_SECRET_KEY environment variable is not set.");
}

/**
 * Initializes a one-time payment with Paystack.
 * The frontend should call this function and redirect the user to the returned authorization_url.
 */
exports.initializeOneTimePayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send({ success: false, error: 'Method Not Allowed' });
    }

    const { email, amount, metadata, reference } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ success: false, error: 'Email and amount are required.' });
    }

    // Paystack requires the amount in the lowest currency unit (kobo for NGN).
    const amountInKobo = Math.round(amount * 100);

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amountInKobo,
          reference: reference || undefined, // Pass reference if provided
          metadata: metadata || {},
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Return the authorization data to the frontend.
      if (response.data && response.data.status) {
        return res.status(200).json({
          success: true,
          ...response.data.data, // Contains authorization_url, access_code, reference
        });
      } else {
        console.error("Paystack initialization failed:", response.data);
        return res.status(502).json({ success: false, error: 'Paystack API returned an error.' });
      }
    } catch (error) {
      console.error("initializeOneTimePayment error:", error.response ? error.response.data : error.message);
      return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
    }
  });
});

/**
 * Initializes a recurring subscription payment with Paystack.
 * The frontend should call this with a plan_code created on your Paystack dashboard.
 */
exports.initializeSubscription = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send({ success: false, error: 'Method Not Allowed' });
    }
    
    const { email, plan, reference, metadata } = req.body;

    if (!email || !plan) {
      return res.status(400).json({ success: false, error: 'Email and plan are required.' });
    }

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          plan,
          reference: reference || undefined,
          metadata: metadata || {},
          // Amount is ignored by Paystack when a plan is provided, but it's required.
          amount: 0, 
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.status) {
        return res.status(200).json({
          success: true,
          ...response.data.data, // Contains authorization_url, access_code, reference
        });
      } else {
        console.error("Paystack subscription init failed:", response.data);
        return res.status(502).json({ success: false, error: 'Paystack API returned an error.' });
      }
    } catch (error) {
      console.error("initializeSubscription error:", error.response ? error.response.data : error.message);
      return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
    }
  });
});

/**
 * Verifies a payment reference with Paystack.
 * This should be called by the frontend after the user returns from the Paystack checkout page.
 */
exports.verifyPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Accommodate reference from either GET query or POST body.
    const reference = req.query.reference || req.body.reference;
    
    if (!reference) {
        return res.status(400).json({ success: false, error: 'Payment reference is required.' });
    }

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const { data } = response;

        if (data.status && data.data.status === 'success') {
            const isSubscription = !!data.data.plan;
            // Return a simple, clear status to the frontend.
            return res.status(200).json({
                success: true,
                paid: true,
                type: isSubscription ? 'subscription' : 'one_time',
                data: data.data, // Pass the full data payload for client-side use if needed.
            });
        } else {
             return res.status(200).json({
                success: false,
                paid: false,
                message: data.data.gateway_response || 'Payment not successful.',
            });
        }
    } catch (error) {
        console.error("verifyPayment error:", error.response ? error.response.data : error.message);
        return res.status(500).json({ success: false, error: 'An internal error occurred during verification.' });
    }
  });
});

/**
 * Handles incoming webhook events from Paystack.
 * It cryptographically verifies the request signature to ensure it's from Paystack.
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    // 1. Verify the webhook signature.
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
                       .update(JSON.stringify(req.body))
                       .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        console.warn('Webhook received with invalid signature.');
        return res.status(401).send('Invalid signature');
    }

    // 2. Log the authentic event.
    const event = req.body;
    console.log(`Received verified Paystack event: ${event.event}`, event.data);

    // 3. Process the event based on its type.
    try {
        switch (event.event) {
            case 'charge.success':
                const { reference, metadata, amount, currency } = event.data;
                const { businessId, orderId } = metadata;
                
                // Only process if we have the IDs we need
                if (businessId && orderId) {
                    const batch = db.batch();

                    // Update order status
                    const orderRef = db.doc(`businesses/${businessId}/orders/${orderId}`);
                    batch.update(orderRef, { status: 'confirmed', paymentStatus: 'paid' });
                    
                    // Create payment transaction log
                    const transactionRef = db.collection(`businesses/${businessId}/paymentTransactions`).doc(reference);
                    batch.set(transactionRef, {
                        orderId: orderId,
                        amount: amount / 100, // Convert from kobo
                        currency: currency,
                        status: 'successful',
                        gateway: 'paystack',
                        reference: reference,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    await batch.commit();
                    console.log(`Successfully processed order ${orderId} for business ${businessId}.`);
                } else {
                     console.warn(`Webhook received for charge.success without businessId or orderId in metadata. Reference: ${reference}`);
                }
                break;
            case 'subscription.create':
                // TODO: Handle new subscription creation
                console.log(`Subscription created for customer: ${event.data.customer.email}. Plan: ${event.data.plan.name}`);
                break;
            case 'invoice.payment_succeeded':
            case 'charge.success': // This case is now duplicated, but fine for handling recurring payments.
                if (event.data.plan) { // Check if it's part of a plan
                    console.log(`Recurring payment successful for subscription: ${event.data.plan.plan_code}`);
                    // TODO: Extend subscription validity in Firestore.
                }
                break;
            default:
                console.log(`Unhandled Paystack event type: ${event.event}`);
        }
    } catch (error) {
        console.error(`Error processing webhook event ${event.event}:`, error);
        return res.status(500).send('Webhook processing error');
    }


    // 4. Acknowledge receipt of the event to Paystack.
    res.sendStatus(200);
});
