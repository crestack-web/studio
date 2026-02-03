
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
 * Expects { amount: number, email: string, metadata: { orderId: string, callback_url: string } } in the request body.
 */
exports.initializePayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { amount, email, metadata } = req.body;
        const { orderId, callback_url } = metadata || {};

        if (!orderId || !amount || !email) {
            return res.status(400).json({ error: 'Missing required fields in body or metadata: orderId, amount, email.' });
        }
        
        if (!PAYSTACK_SECRET) {
            console.error("Paystack secret key is not configured.");
            return res.status(500).json({ error: 'Payment gateway not configured.' });
        }
        
        // Amount should be in kobo (lowest currency unit)
        const amountInKobo = Math.round(amount * 100);

        try {
            const paystackResponse = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email: email,
                    amount: amountInKobo,
                    reference: orderId,
                    callback_url: callback_url,
                    metadata: {
                        order_id: orderId,
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
                return res.status(200).json(paystackResponse.data.data);
            } else {
                return res.status(500).json({ error: 'Failed to initialize payment with Paystack.' });
            }

        } catch (error) {
            console.error("Paystack initialization error:", error.response ? error.response.data : error.message);
            return res.status(500).json({ error: 'An error occurred while initializing payment.' });
        }
    });
});


/**
 * Paystack Webhook to confirm payment and update order.
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    // Verify webhook signature to ensure the request is from Paystack
    if (!PAYSTACK_SECRET) {
        console.error("Paystack secret key is not configured for webhook verification.");
        return res.status(500).send('Webhook not configured.');
    }

    const signature = req.headers["x-paystack-signature"];
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
                       .update(req.rawBody)
                       .digest('hex');

    if (hash !== signature) {
        console.warn('Invalid webhook signature received.');
        return res.status(401).send('Invalid signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
        const { reference } = event.data;
        const orderId = reference;

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
                    reference: orderId,
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
            console.error(`Error processing webhook for order ${orderId}:`, error);
            return res.sendStatus(500); // Tell Paystack to retry
        }
    }

    res.sendStatus(200);
});
