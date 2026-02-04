
// functions/payments.js
/**
 * @fileoverview This file contains Paystack payment-related Cloud Functions.
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

// This mapping should correspond to the plan codes created in your Paystack dashboard.
// IMPORTANT: You MUST replace 'PLN_xxxxxxxx' with your actual Paystack plan codes.
const paystackPlanMap = {
    shop: {
        monthly: 'PLN_xxxxxxxx', 
        yearly: 'PLN_xxxxxxxx'
    },
    supermarket: {
        monthly: 'PLN_xxxxxxxx',
        yearly: 'PLN_xxxxxxxx'
    },
    'multi-branch': {
        monthly: 'PLN_xxxxxxxx',
        yearly: 'PLN_xxxxxxxx'
    },
    company: {
        monthly: 'PLN_xxxxxxxx',
        yearly: 'PLN_xxxxxxxx'
    }
};

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

    const { email, amount, metadata } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ success: false, error: 'Email and amount are required.' });
    }

    try {
      // Paystack expects the amount in the lowest currency unit (kobo for NGN).
      const amountInKobo = Math.round(amount * 100);

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
 * Accepts: { email, planId, billingCycle, metadata }
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

        const { email, planId, billingCycle, metadata } = req.body;
        if (!email || !planId || !billingCycle) {
            return res.status(400).json({ success: false, error: 'Email, planId, and billingCycle are required.' });
        }
        
        const planCode = paystackPlanMap[planId]?.[billingCycle];

        if (!planCode || planCode.startsWith('PLN_')) {
             console.warn(`Paystack plan code not found or is a placeholder for planId: ${planId}, cycle: ${billingCycle}. Proceeding with placeholder...`);
             if(!planCode) {
                 return res.status(400).json({ success: false, error: `The selected plan ID '${planId}' is not configured for payment.` });
             }
        }
        
        try {
            const response = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email,
                    plan: planCode, // Paystack plan code
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

    const reference = req.query.reference;

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
 * It cryptographically verifies the request signature to ensure it's from Paystack
 * but does not process the event data yet.
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

    // 3. Acknowledge receipt of the event to Paystack.
    res.status(200).send("Webhook received");
});
