
const functions = require("firebase-functions");
const crypto = require("crypto");
const axios = require("axios");
const cors = require('cors')({origin: true});
const admin = require("firebase-admin");

const db = admin.firestore();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error("FATAL ERROR: PAYSTACK_SECRET_KEY environment variable is not set.");
}

// Hardcoded plan details (in kobo) - Should be moved to Firestore /plans collection
const plans = {
    shop: { monthlyPrice: 150000, yearlyPrice: 1500000, paystack_plan_code_monthly: 'PLN_79p5yysj5q5z1qz', paystack_plan_code_yearly: 'PLN_k9c24tyc4g5x8v9' },
    supermarket: { monthlyPrice: 1000000, yearlyPrice: 10000000, paystack_plan_code_monthly: 'PLN_x5vbs3rigk8g9q2', paystack_plan_code_yearly: 'PLN_0z6g4j3j6a59v04' },
    'multi-branch': { monthlyPrice: 3000000, yearlyPrice: 30000000, paystack_plan_code_monthly: 'PLN_p0j2j9y6f7a6g9v', paystack_plan_code_yearly: 'PLN_2s4q2y0g1m1c8s7' },
    company: { monthlyPrice: 5000000, yearlyPrice: 50000000, paystack_plan_code_monthly: 'PLN_w8t4c0j7d8f9a2s', paystack_plan_code_yearly: 'PLN_3d5f8g0h2k1l4m9' }
};


/**
 * Initializes a payment with Paystack after validating and calculating the amount on the backend.
 * This is the single, authoritative entry point for all payments.
 */
exports.initializePayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        if (!PAYSTACK_SECRET_KEY) {
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }

        try {
            const { type, payload, userId, businessId, email, callback_url } = req.body;

            if (!type || !payload || !userId || !email || !businessId) {
                return res.status(400).json({ success: false, error: 'Missing required parameters.' });
            }

            let amount = 0; // Authoritative amount in kobo
            let currency = 'NGN'; // Default currency
            let planCode;

            switch (type) {
                case 'product': {
                    const { items } = payload;
                    let totalAmount = 0;
                    for (const item of items) {
                        const productRef = db.collection('marketProducts').doc(item.productId);
                        const productSnap = await productRef.get();
                        if (!productSnap.exists()) throw new Error(`Product with ID ${item.productId} not found.`);
                        
                        const productData = productSnap.data();
                        currency = productData.currency || 'NGN';
                        if (currency !== 'NGN') throw new Error('Payments are currently only supported in NGN.');

                        let itemPrice = 0;
                        if (item.variantId && productData.hasVariants) {
                            const variant = productData.variants.find(v => v.id === item.variantId);
                            if (!variant) throw new Error(`Variant ${item.variantId} not found.`);
                            itemPrice = variant.price;
                        } else {
                            itemPrice = productData.price;
                        }
                        totalAmount += itemPrice * item.quantity;
                    }
                    amount = Math.round(totalAmount * 100);
                    break;
                }
                case 'subscription': {
                    const { planId, billingCycle } = payload;
                    
                    // FIX: Handle both 'multi-branch' and 'multibranch' to fix inconsistency
                    let plan = plans[planId];
                    if (!plan && planId === 'multibranch') {
                        plan = plans['multi-branch'];
                    }

                    if (!plan) {
                         throw new Error(`Invalid subscription plan ID: '${planId}'.`);
                    }
                    
                    planCode = billingCycle === 'monthly' ? plan.paystack_plan_code_monthly : plan.paystack_plan_code_yearly;
                    if (!planCode || planCode.includes('PLN_xx')) throw new Error('Paystack plan code not configured for this plan.');
                    
                    amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                    break;
                }
                case 'service': {
                    const { serviceId } = payload;
                    const serviceRef = db.collection('services').doc(serviceId);
                    const serviceSnap = await serviceRef.get();
                    if (!serviceSnap.exists()) throw new Error('Service not found.');
                    amount = serviceSnap.data().fee * 100;
                    break;
                }
                default:
                    throw new Error('Invalid payment type.');
            }
            
            const paystackPayload = {
                email,
                amount,
                callback_url,
                metadata: { userId, businessId, type, ...(payload.metadata || {}) },
                ...(planCode && { plan: planCode }) // Conditionally add plan if it exists
            };

            const response = await axios.post('https://api.paystack.co/transaction/initialize', paystackPayload, {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
            });

            if (response.data && response.data.status) {
                const reference = response.data.data.reference;
                
                const intentRef = db.collection('paymentIntents').doc(reference);
                await intentRef.set({
                    reference,
                    userId,
                    businessId,
                    type,
                    payload,
                    amount,
                    currency,
                    status: 'pending',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                return res.status(200).json({ success: true, ...response.data.data });
            } else {
                return res.status(500).json({ success: false, error: response.data.message || 'Failed to initialize payment.' });
            }
        } catch (error) {
            console.error("Paystack initializePayment error:", error.response ? error.response.data : error.message, error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while initializing payment.';
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
 * It cryptographically verifies the request and processes the payment events.
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    if (!PAYSTACK_SECRET_KEY) {
        console.error('Webhook received but PAYSTACK_SECRET_KEY is not set.');
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

    const event = req.body;
    const eventId = event.id;
    const reference = event.data.reference;

    try {
        await db.runTransaction(async (transaction) => {
            // 2. Enforce Idempotency
            const eventRef = db.collection('processedWebhookEvents').doc(eventId);
            const eventSnap = await transaction.get(eventRef);
            if (eventSnap.exists) {
                console.log(`Webhook event ${eventId} already processed.`);
                return;
            }

            // 3. Fetch the Payment Intent
            const intentRef = db.collection('paymentIntents').doc(reference);
            const intentSnap = await transaction.get(intentRef);
            if (!intentSnap.exists) {
                throw new Error(`Payment intent with reference ${reference} not found.`);
            }
            const intentData = intentSnap.data();

            // 4. Handle event type
            if (event.event === 'charge.success') {
                switch (intentData.type) {
                    case 'product': {
                        const orderRef = db.collection('businesses').doc(intentData.businessId).collection('orders').doc();
                        transaction.set(orderRef, {
                            buyerId: intentData.userId,
                            sellerBusinessId: intentData.businessId,
                            customer: event.data.customer,
                            items: intentData.payload.items,
                            subtotal: intentData.amount / 100, // Convert back to Naira
                            deliveryFee: 0, // TODO: Calculate this properly
                            total: intentData.amount / 100,
                            status: 'confirmed',
                            fulfillment: intentData.payload.fulfillmentMethod,
                            payment: 'busmopay',
                            paymentReference: reference,
                            payoutStatus: 'unpaid',
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        // TODO: Deduct stock from products
                        break;
                    }
                    case 'subscription': {
                         const { planId, billingCycle } = intentData.payload;
                         const subRef = db.collection('users').doc(intentData.userId).collection('subscriptions').doc(); // Auto-gen ID
                         const subTxRef = db.collection('subscriptionTransactions').doc(reference);

                         const paidAtDate = new Date(event.data.paid_at);
                         let endDate = new Date(paidAtDate);
                         if (billingCycle === 'monthly') {
                            endDate.setMonth(paidAtDate.getMonth() + 1);
                         } else {
                            endDate.setFullYear(paidAtDate.getFullYear() + 1);
                         }

                         transaction.set(subRef, {
                             planId,
                             status: 'active',
                             currentPeriodStart: admin.firestore.Timestamp.fromDate(paidAtDate),
                             currentPeriodEnd: admin.firestore.Timestamp.fromDate(endDate),
                             createdAt: admin.firestore.FieldValue.serverTimestamp(),
                         });

                         transaction.set(subTxRef, {
                             userId: intentData.userId,
                             planId,
                             amountPaid: intentData.amount / 100,
                             currency: 'NGN',
                             paystackReference: reference,
                             status: 'successful',
                             createdAt: admin.firestore.FieldValue.serverTimestamp(),
                         });
                        break;
                    }
                    case 'service': {
                        const { serviceRequestId } = intentData.payload;
                        const serviceRequestRef = db.collection('businesses').doc(intentData.businessId).collection('serviceRequests').doc(serviceRequestId);
                        transaction.update(serviceRequestRef, {
                            paymentStatus: 'paid',
                            paystackReference: reference
                        });
                        break;
                    }
                }
                 transaction.update(intentRef, { status: 'successful' });
            } else if (event.event === 'charge.failed') {
                 transaction.update(intentRef, { status: 'failed' });
            }

            // Mark event as processed
            transaction.set(eventRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
        });
        
        console.log(`Successfully processed webhook event: ${event.event} for reference: ${reference}`);
        res.status(200).send("Webhook processed successfully");

    } catch (error) {
        console.error(`Error processing webhook for reference ${reference}:`, error);
        res.status(500).send("Error processing webhook");
    }
});
