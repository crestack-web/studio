
const functions = require("firebase-functions");
const crypto = require("crypto");
const axios = require("axios");
const cors = require('cors')({origin: true});

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error("FATAL ERROR: PAYSTACK_SECRET_KEY environment variable is not set.");
}

/**
 * Initializes a one-time or subscription payment with Paystack.
 * Accepts: { email, amount?, plan?, metadata? }
 * If 'plan' is provided, it's a subscription.
 * If 'amount' is provided, it's a one-time payment.
 * Returns: Paystack authorization object { authorization_url, reference, ... }
 */
exports.initializePayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        if (!PAYSTACK_SECRET_KEY) {
            console.error("Payment function called, but PAYSTACK_SECRET_KEY is not set.");
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }

        try {
            const { email, amount, plan, metadata } = req.body;

            if (!email || (!amount && !plan)) {
                return res.status(400).json({ success: false, error: 'Email and either amount or plan are required.' });
            }

            const payload = {
                email,
                metadata,
            };

            if (plan) {
                // Subscription payment
                payload.plan = plan;
            } else {
                // One-time payment
                // Paystack expects the amount in the lowest currency unit (kobo for NGN).
                payload.amount = Math.round(Number(amount) * 100);
            }
            
            // For subscriptions, Paystack still needs an amount for the first charge, 
            // but it's taken from the plan. If amount is also sent, we prioritize the plan.
            if(plan && amount) {
                delete payload.amount;
            }

            const response = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                payload,
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
                    ...response.data.data, // Return the whole data object from Paystack
                });
            } else {
                // Use Paystack's error message if available
                return res.status(500).json({ success: false, error: response.data.message || 'Failed to initialize payment.' });
            }
        } catch (error) {
            console.error("Paystack initializePayment error:", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.message || 'An error occurred while initializing payment.';
            return res.status(error.response?.status || 500).json({ success: false, error: errorMessage });
        }
    });
});

/**
 * Verifies a payment transaction with Paystack.
 * Accepts query param: ?reference=<tx_ref>
 * Returns: Full Paystack verification data object on success.
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
    // No CORS needed here as it's not a browser request.
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
        case 'invoice.payment_failed':
        case 'invoice.payment_succeeded':
            console.log(`Invoice payment ${event.event.split('.')[1]} for:`, event.data.customer.email);
            // Future logic to update subscription period would go here.
            break;
        default:
            console.log(`Unhandled event type: ${event.event}`);
    }

    // 3. Acknowledge receipt of the event to Paystack.
    res.status(200).send("Webhook received");
});
