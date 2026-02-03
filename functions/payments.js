
// functions/payments.js
/**
 * @fileoverview This file contains placeholder Paystack payment-related Cloud Functions.
 * This is a clean reset to establish a stable base for future development.
 */

const functions = require("firebase-functions");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });

// It's critical to set PAYSTACK_SECRET_KEY in your Firebase environment configuration.
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  // Log an error during function initialization if the key is missing.
  console.error("FATAL ERROR: PAYSTACK_SECRET_KEY environment variable is not set.");
}

/**
 * Placeholder for initializing a one-time payment.
 * This function is intentionally disabled and returns a 501 Not Implemented error.
 */
exports.initializeOneTimePayment = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(501).json({ error: "Payment feature is temporarily disabled." });
  });
});

/**
 * Placeholder for initializing a subscription payment.
 * This function is intentionally disabled and returns a 501 Not Implemented error.
 */
exports.initializeSubscription = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(501).json({ error: "Subscription feature is temporarily disabled." });
  });
});

/**
 * Placeholder for verifying a payment.
 * This function is intentionally disabled and returns a 501 Not Implemented error.
 */
exports.verifyPayment = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(501).json({ error: "Payment verification is temporarily disabled." });
  });
});

/**
 * Handles incoming webhook events from Paystack.
 * It cryptographically verifies the request signature to ensure it's from Paystack
 * but does not process the event data yet.
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    if (!PAYSTACK_SECRET_KEY) {
        console.error('Webhook received but PAYSTACK_SECRET_KEY is not set. Cannot verify signature.');
        return res.status(500).send('Webhook secret not configured');
    }
    
    // 1. Verify the webhook signature.
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
                       .update(JSON.stringify(req.body))
                       .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        console.warn('Webhook received with invalid signature.');
        return res.status(401).send('Invalid signature');
    }

    // 2. Log the event for debugging.
    const event = req.body;
    console.log(`Received verified Paystack event: ${event.event}`);

    // 3. Acknowledge receipt of the event to Paystack.
    res.status(200).send("Webhook received");
});
