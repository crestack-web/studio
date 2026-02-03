
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// IMPORTANT: Set your Paystack secret key in your environment variables
// In Firebase console: functions > configuration > environment variables
// PAYSTACK_SECRET_KEY=your_live_or_test_secret_key
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/**
 * Initializes a Paystack transaction.
 * Expects { amount: number, email: string, reference: string, metadata: { callback_url: string } } in the request body.
 */
exports.initializePayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { amount, email, reference, metadata } = req.body;
        
        if (!reference || !amount || !email) {
            return res.status(400).json({ success: false, error: 'Missing required fields: reference, amount, email.' });
        }
        
        if (!PAYSTACK_SECRET) {
            console.error("Paystack secret key is not configured.");
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }
        
        // Amount should be in kobo (lowest currency unit)
        const amountInKobo = Math.round(amount * 100);

        try {
            const paystackResponse = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email: email,
                    amount: amountInKobo,
                    reference: reference,
                    callback_url: metadata?.callback_url,
                    metadata: {
                        custom_fields: [
                            {
                                display_name: "Order Reference",
                                variable_name: "order_reference",
                                value: reference
                            }
                        ]
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (paystackResponse.data && paystackResponse.data.status) {
                // Return the authorization URL to the client
                return res.status(200).json({ success: true, data: paystackResponse.data.data });
            } else {
                return res.status(500).json({ success: false, error: 'Failed to initialize payment with Paystack.' });
            }

        } catch (error) {
            console.error("Paystack initialization error:", error.response ? error.response.data : error.message);
            return res.status(500).json({ success: false, error: 'An error occurred while initializing payment.' });
        }
    });
});


/**
 * Paystack Webhook to confirm payment and update order or subscription.
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    // Verify webhook signature to ensure the request is from Paystack
    if (!PAYSTACK_SECRET) {
        console.error("Paystack secret key is not configured for webhook verification.");
        return res.status(500).send('Webhook not configured.');
    }

    const signature = req.headers["x-paystack-signature"];
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
                       .update(JSON.stringify(req.body))
                       .digest('hex');

    if (hash !== signature) {
        console.warn('Invalid webhook signature received.');
        return res.status(401).send('Invalid signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
        const { reference } = event.data;
        
        // Handle Subscription Payments
        if (reference && reference.startsWith('SUB-')) {
            const transactionId = reference.substring(4);
            try {
                const subTxRef = db.collection('subscriptionTransactions').doc(transactionId);
                
                await db.runTransaction(async (transaction) => {
                    const subTxDoc = await transaction.get(subTxRef);
                    if (!subTxDoc.exists || subTxDoc.data().status === 'successful') {
                        console.log(`Subscription transaction ${transactionId} already processed or does not exist.`);
                        return;
                    }

                    const subTxData = subTxDoc.data();
                    const userId = subTxData.userId;

                    const subscriptionsRef = db.collection('users').doc(userId).collection('subscriptions');
                    const subscriptionSnapshot = await subscriptionsRef.limit(1).get();

                    if (subscriptionSnapshot.empty) {
                        throw new Error(`No subscription found for user ${userId} to activate.`);
                    }

                    const subscriptionDoc = subscriptionSnapshot.docs[0];
                    const billingCycle = subTxData.billingCycle || 'monthly';
                    
                    const newPeriodEnd = new Date();
                    if (billingCycle === 'yearly') {
                        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
                    } else {
                        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
                    }

                    // Update subscription transaction
                    transaction.update(subTxRef, { status: 'successful', paystackReference: reference });
                    // Update user's subscription
                    transaction.update(subscriptionDoc.ref, {
                        status: 'active',
                        currentPeriodEnd: admin.firestore.Timestamp.fromDate(newPeriodEnd)
                    });
                });
                
                console.log(`Successfully processed subscription payment for user associated with transaction: ${transactionId}`);

            } catch (error) {
                console.error(`Error processing subscription webhook for reference ${reference}:`, error);
                return res.sendStatus(500); // Tell Paystack to retry
            }
        
        // Handle Service Request Payments
        } else if (reference && reference.startsWith('SRV-')) {
            const requestId = reference.substring(4);
            const requestsCollectionGroup = db.collectionGroup('serviceRequests');
            const query = requestsCollectionGroup.where(admin.firestore.FieldPath.documentId(), '==', requestId);
            
            try {
                const requestSnapshots = await query.get();
                if (requestSnapshots.empty) {
                    console.warn(`Webhook for non-existent service request ID: ${requestId}`);
                    return res.sendStatus(200);
                }

                const requestDoc = requestSnapshots.docs[0];
                const requestRef = requestDoc.ref;
                
                await db.runTransaction(async (transaction) => {
                    const freshRequestSnap = await transaction.get(requestRef);
                    if (!freshRequestSnap.exists) return;
                    const freshRequestData = freshRequestSnap.data();
                    
                    if (freshRequestData.paymentStatus !== 'unpaid') {
                         console.log(`Service request ${requestId} payment already processed.`);
                         return;
                    }
                    
                    transaction.update(requestRef, {
                        paymentStatus: 'paid',
                        status: 'pending', // Set to pending for admin to pick up
                        paystackReference: reference
                    });
                });

                console.log(`Successfully processed payment for service request: ${requestId}`);
            } catch (error) {
                console.error(`Error processing service request webhook for reference ${reference}:`, error);
                return res.sendStatus(500);
            }
        
        // Handle Order Payments (default)
        } else {
            const orderId = reference.startsWith('ORD-') ? reference.substring(4) : reference;
            const ordersCollectionGroup = db.collectionGroup('orders');
            const query = ordersCollectionGroup.where(admin.firestore.FieldPath.documentId(), '==', orderId);
            
            try {
                const orderSnapshots = await query.get();
                if (orderSnapshots.empty) {
                    console.warn(`Webhook for non-existent or already processed order ID: ${orderId}`);
                    return res.sendStatus(200);
                }

                const orderDoc = orderSnapshots.docs[0];
                const orderData = orderDoc.data();
                const businessId = orderData.sellerBusinessId;
                const orderRef = orderDoc.ref;
                
                await db.runTransaction(async (transaction) => {
                    const freshOrderSnap = await transaction.get(orderRef);
                    const freshOrderData = freshOrderSnap.data();

                    if (freshOrderData.status !== 'pending') {
                        console.log(`Order ${orderId} not pending, skipping webhook update.`);
                        return;
                    }

                    transaction.update(orderRef, { status: 'confirmed' });
                    
                    const paymentTxRef = db.collection('businesses').doc(businessId).collection('paymentTransactions').doc();
                    transaction.set(paymentTxRef, {
                        orderId: orderId,
                        amount: event.data.amount / 100,
                        currency: freshOrderData.currency || 'NGN',
                        status: 'successful',
                        gateway: 'paystack',
                        reference: reference,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    for (const item of freshOrderData.items) {
                        const productRef = db.collection('businesses').doc(businessId).collection('products').doc(item.productId);
                        const marketProductRef = db.collection('marketProducts').doc(item.productId);

                        const productSnap = await transaction.get(productRef);
                        if (!productSnap.exists()) {
                            console.warn(`Product ${item.productId} not found for stock deduction.`);
                            continue;
                        }
                        
                        const productData = productSnap.data();
                        let newTotalStock;

                        if (item.variantId && productData.hasVariants && Array.isArray(productData.variants)) {
                            let variantFound = false;
                            const newVariants = productData.variants.map((v) => {
                                if (v.id === item.variantId) {
                                    variantFound = true;
                                    return { ...v, quantity: (v.quantity || 0) - item.quantity };
                                }
                                return v;
                            });
                            
                            if (!variantFound) {
                                 console.warn(`Variant ${item.variantId} not found in product ${item.productId}. Skipping stock deduction for this item.`);
                                 continue;
                            }
                            
                            newTotalStock = newVariants.reduce((sum, v) => sum + (v.quantity || 0), 0);
                            transaction.update(productRef, { variants: newVariants });
                            transaction.update(marketProductRef, { 
                                'variants': newVariants.map(v => ({ id: v.id, name: v.name, price: v.price, availableQuantity: v.quantity })), 
                                'availableQuantity': newTotalStock 
                            });
                        } else {
                            newTotalStock = (productData.quantity || 0) - item.quantity;
                            transaction.update(productRef, { quantity: newTotalStock });
                            transaction.update(marketProductRef, { availableQuantity: newTotalStock });
                        }
                    }
                });

                console.log(`Successfully processed payment and updated stock for order: ${orderId}`);
            } catch (error) {
                console.error(`Error processing order webhook for reference ${reference}:`, error);
                return res.sendStatus(500); // Tell Paystack to retry
            }
        }
    }

    res.sendStatus(200);
});

exports.fetchBankList = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const country = req.query.country || 'nigeria';

        if (!PAYSTACK_SECRET) {
            console.error("Paystack secret key is not configured.");
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }

        try {
            const response = await axios.get(`https://api.paystack.co/bank?country=${country}&currency=NGN`, {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
            });

            if (response.data && response.data.status) {
                return res.status(200).json({ success: true, data: response.data.data });
            } else {
                return res.status(500).json({ success: false, error: 'Failed to fetch bank list.' });
            }
        } catch (error) {
            console.error("Paystack fetchBankList error:", error.response ? error.response.data : error.message);
            return res.status(500).json({ success: false, error: 'An error occurred while fetching bank list.' });
        }
    });
});

exports.verifyBankAccount = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const { account_number, bank_code } = req.body;

        if (!account_number || !bank_code) {
            return res.status(400).json({ success: false, error: 'Missing account_number or bank_code.' });
        }

        if (!PAYSTACK_SECRET) {
            console.error("Paystack secret key is not configured.");
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }
        
        try {
            const response = await axios.get(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
            });
            
            if (response.data && response.data.status) {
                return res.status(200).json({ success: true, data: response.data.data });
            } else {
                return res.status(400).json({ success: false, error: response.data.message || 'Could not resolve account.' });
            }
        } catch (error) {
            console.error("Paystack verifyBankAccount error:", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.message || 'An error occurred while resolving the bank account.';
            return res.status(error.response?.status || 500).json({ success: false, error: errorMessage });
        }
    });
});

exports.verifyPayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const { reference } = req.query;

        if (!reference) {
            return res.status(400).json({ success: false, error: 'Payment reference is missing.' });
        }

        if (!PAYSTACK_SECRET) {
            console.error("Paystack secret key is not configured.");
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }

        try {
            const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
            });

            if (response.data && response.data.status) {
                return res.status(200).json({ success: true, data: response.data.data });
            } else {
                return res.status(404).json({ success: false, error: 'Transaction not found or failed.' });
            }
        } catch (error) {
            console.error("Paystack verifyPayment error:", error.response ? error.response.data : error.message);
            return res.status(500).json({ success: false, error: 'An error occurred while verifying the payment.' });
        }
    });
});
