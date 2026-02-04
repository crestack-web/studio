// functions/payments.js
/**
 * @fileoverview This file contains the reset and rebuilt Paystack payment-related Cloud Functions.
 * It provides a clean, minimal, and stable implementation for handling payments.
 */

const functions = require("firebase-functions");
const crypto = require("crypto");
const axios = require("axios");
const cors = require('cors')({origin: true});


// It's critical to set PAYSTACK_SECRET_KEY in your Firebase environment configuration.
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  // Log an error during function initialization if the key is missing.
  console.error("FATAL ERROR: PAYSTACK_SECRET_KEY environment variable is not set.");
}

/**
 * Initializes a one-time payment with Paystack.
 * Accepts: { email, amount, metadata }
 * Returns: { success, authorization_url, reference }
 */
exports.initializeOneTimePayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }
        
        if (!PAYSTACK_SECRET_KEY) {
          console.error("Payment function called, but PAYSTACK_SECRET_KEY is not set.");
          return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }

        try {
            const { email, amount, metadata } = req.body;
            if (!email || !amount) {
              return res.status(400).json({ success: false, error: 'Email and amount are required.' });
            }

            // Paystack expects the amount in the lowest currency unit (kobo for NGN).
            const amountInKobo = Math.round(Number(amount) * 100);

            const response = await axios.post(
              'https://api.paystack.co/transaction/initialize',
              {
                email,
                amount: amountInKobo,
                metadata,
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
                authorization_url: response.data.data.authorization_url,
                reference: response.data.data.reference,
              });
            } else {
              return res.status(500).json({ success: false, error: response.data.message || 'Failed to initialize payment.' });
            }
        } catch (error) {
            console.error("Paystack initializeOneTimePayment error:", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.message || 'An error occurred while initializing payment.';
            return res.status(error.response?.status || 500).json({ success: false, error: errorMessage });
        }
    });
});

/**
 * Initializes a subscription payment with Paystack.
 * Accepts: { email, plan_code, metadata }
 * Returns: { success, authorization_url, reference }
 */
exports.initializeSubscription = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        if (!PAYSTACK_SECRET_KEY) {
            console.error("Subscription function called, but PAYSTACK_SECRET_KEY is not set.");
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }
        
        try {
            const { email, plan_code, metadata } = req.body;
            if (!email || !plan_code) {
                return res.status(400).json({ success: false, error: 'Email and plan_code are required.' });
            }

            const response = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email,
                    plan: plan_code,
                    metadata,
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
                    authorization_url: response.data.data.authorization_url,
                    reference: response.data.data.reference,
                });
            } else {
                return res.status(500).json({ success: false, error: response.data.message || 'Failed to initialize subscription.' });
            }
        } catch (error) {
            console.error("Paystack initializeSubscription error:", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.message || 'An error occurred while initializing subscription.';
            return res.status(error.response?.status || 500).json({ success: false, error: errorMessage });
        }
    });
});


/**
 * Verifies a payment transaction with Paystack.
 * Accepts: { reference }
 * Returns: { success, data: { ...paystack transaction data } }
 */
exports.verifyPayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).send('Method Not Allowed');
        }
        if (!PAYSTACK_SECRET_KEY) {
          console.error("Verify function called, but PAYSTACK_SECRET_KEY is not set.");
          return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }
        
        try {
            const reference = req.query.reference;

            if (!reference) {
              return res.status(400).json({ success: false, error: 'Payment reference is required.' });
            }
            
            const response = await axios.get(
              `https://api.paystack.co/transaction/verify/${reference}`,
              {
                headers: {
                  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
              }
            );

            if (response.data && response.data.status) {
              // Return the full data object from Paystack
              return res.status(200).json({ success: true, data: response.data.data });
            } else {
              return res.status(400).json({ success: false, error: response.data.message || 'Could not verify payment.' });
            }
        } catch (error) {
            console.error("Paystack verifyPayment error:", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.message || 'An error occurred while verifying the payment.';
            return res.status(error.response?.status || 500).json({ success: false, error: errorMessage });
        }
    });
});


/**
 * Handles incoming webhook events from Paystack.
 * It cryptographically verifies the request signature and logs the event.
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

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

    // Handle specific events
    switch (event.event) {
        case 'charge.success':
            console.log('Charge success for reference:', event.data.reference);
            // Future logic to update order status would go here.
            break;
        case 'subscription.create':
            console.log('Subscription created:', event.data.subscription_code);
            // Future logic to create subscription record would go here.
            break;
        case 'invoice.payment_succeeded':
            console.log('Invoice payment succeeded for:', event.data.customer.email);
            // Future logic to update subscription period would go here.
            break;
        default:
            console.log(`Unhandled event type: ${event.event}`);
    }

    // 3. Acknowledge receipt of the event to Paystack.
    res.status(200).send("Webhook received");
});
