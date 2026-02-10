
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const crypto = require("crypto");
const axios = require("axios");
const admin = require("firebase-admin");

const db = admin.firestore();

const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY');
const PAYSTACK_SECRET = defineSecret('PAYSTACK_SECRET');

function getPaystackSecret() {
    try {
        const secret = PAYSTACK_SECRET_KEY.value();
        if (secret) return secret;
    } catch {
        // When running locally without secrets, fall back to env var.
    }

    try {
        const secret = PAYSTACK_SECRET.value();
        if (secret) return secret;
    } catch {
        // ignore
    }

    if (process.env.PAYSTACK_SECRET_KEY) return process.env.PAYSTACK_SECRET_KEY;
    if (process.env.PAYSTACK_SECRET) return process.env.PAYSTACK_SECRET;

    try {
        // Backwards-compatibility with `firebase functions:config:set paystack.secret_key=...`
        const functions = require('firebase-functions');
        const cfg = functions.config && functions.config();
        const fromConfig = cfg?.paystack?.secret_key || cfg?.paystack?.secret || cfg?.paystack?.secretKey;
        if (fromConfig) return fromConfig;
    } catch {
        // ignore
    }

    return undefined;
}

async function paystackPost(path, payload, paystackSecret) {
    const response = await axios.post(`https://api.paystack.co${path}`, payload, {
        headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
        },
        timeout: 30000,
    });
    return response.data;
}

function getBusinessIdFromDocPath(docPath) {
    // Expects businesses/{businessId}/payouts/{payoutId}
    const parts = String(docPath || '').split('/');
    const idx = parts.indexOf('businesses');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
}


/**
 * Initializes a payment with Paystack after validating and calculating the amount on the backend.
 * This is the single, authoritative entry point for all payments.
 */
exports.initializePayment = onRequest({ cors: true, secrets: [PAYSTACK_SECRET_KEY, PAYSTACK_SECRET] }, async (req, res) => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const paystackSecret = getPaystackSecret();
        if (!paystackSecret) {
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }

        try {
            const { type, payload, userId, businessId, email, callback_url } = req.body;

            if (!type || !payload || !userId || !email || !businessId) {
                return res.status(400).json({ success: false, error: 'Missing required parameters.' });
            }

            let amountInNaira = 0; // Authoritative amount in NAIRA.
            let currency = 'NGN';
            let planCode;
            let orderRef = null;
            let orderDraft = null;
            let orderId = null;
            let orderPath = null;

            switch (type) {
                case 'product': {
                    const { items, customer, fulfillmentMethod } = payload;
                    if (!items || items.length === 0) {
                        throw new Error('No items provided for product payment.');
                    }
                    let subtotalAmount = 0;
                    const orderItems = [];

                    // Optional: compute delivery fee from business profile settings (authoritative).
                    let deliveryFee = 0;
                    const requestedFulfillment = fulfillmentMethod || 'delivery';
                    if (requestedFulfillment === 'delivery') {
                        const businessProfileSnap = await db.collection('businessProfiles').doc(businessId).get().catch(() => null);
                        const businessProfile = businessProfileSnap && businessProfileSnap.exists ? businessProfileSnap.data() : null;
                        const configuredFee = businessProfile?.marketSettings?.delivery?.deliveryFee;
                        if (typeof configuredFee === 'number' && Number.isFinite(configuredFee) && configuredFee >= 0) {
                            deliveryFee = configuredFee;
                        }
                    }

                    // Pre-generate a stable order ID so we can link Paystack metadata -> Firestore order.
                    orderRef = db.collection('businesses').doc(businessId).collection('orders').doc();
                    orderId = orderRef.id;
                    orderPath = orderRef.path;

                    for (const item of items) {
                        const productRef = db.collection('marketProducts').doc(item.productId);
                        const productSnap = await productRef.get();
                        if (!productSnap.exists) {
                            throw new Error(`Product with ID ${item.productId} not found.`);
                        }
                        
                        const productData = productSnap.data();
                        
                        if ((productData.currency || 'NGN') !== 'NGN') {
                            throw new Error('Payments are currently only supported in NGN.');
                        }

                        let itemPrice = 0;
                        let variantName;
                        if (item.variantId && productData.hasVariants) {
                            const variant = productData.variants.find(v => v.id === item.variantId);
                            if (!variant) {
                                throw new Error(`Variant ${item.variantId} for product ${item.productId} not found.`);
                            }
                            itemPrice = variant.price;
                            variantName = variant.name;
                        } else {
                            itemPrice = productData.price;
                        }

                        // Robustness Check: Ensure price is a valid number.
                        if (typeof itemPrice !== 'number' || isNaN(itemPrice)) {
                            throw new Error(`Invalid price for product ${item.productId}. Please check product settings.`);
                        }
                        if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
                            throw new Error(`Invalid quantity for product ${item.productId}.`);
                        }

                        subtotalAmount += itemPrice * item.quantity;
                        orderItems.push({
                            productId: item.productId,
                            productName: productData.productName || productData.name || 'Product',
                            variantId: item.variantId || null,
                            variantName: variantName || null,
                            quantity: item.quantity,
                            price: itemPrice,
                        });
                    }

                    amountInNaira = subtotalAmount + deliveryFee;

                    orderDraft = {
                        buyerId: userId,
                        sellerBusinessId: businessId,
                        customer: customer || {},
                        items: orderItems,
                        subtotal: subtotalAmount,
                        deliveryFee,
                        total: amountInNaira,
                        status: 'pending',
                        fulfillment: requestedFulfillment,
                        payment: 'busmopay',
                        paymentStatus: 'pending',
                        paymentReference: null,
                        paymentIntentReference: null,
                        payoutStatus: 'unpaid',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    };
                    break;
                }
                case 'subscription': {
                    const { planId, billingCycle } = payload;
                    let finalPlanId = planId;
                    
                    if (planId === 'multibranch') {
                        finalPlanId = 'multi-branch';
                    }
                    
                    const planRef = db.collection('plans').doc(finalPlanId);
                    const planSnap = await planRef.get();
                    if (!planSnap.exists) {
                        throw new Error(`Subscription plan with ID '${planId}' not found in database.`);
                    }
                    const planData = planSnap.data();

                    const priceInNaira = billingCycle === 'monthly' ? planData.monthlyPrice : planData.yearlyPrice;
                    if (typeof priceInNaira !== 'number' || isNaN(priceInNaira)) {
                        throw new Error(`Price for plan '${planId}' and cycle '${billingCycle}' is not configured correctly.`);
    
                    }
                    amountInNaira = priceInNaira;
                    
                    planCode = billingCycle === 'monthly' ? planData.paystack_plan_code_monthly : planData.paystack_plan_code_yearly;
                    if (!planCode || planCode.includes('PLN_xx')) {
                        console.warn(`Paystack plan code not configured for plan '${planId}'. Proceeding with one-time charge.`);
                        planCode = undefined;
                    }
                    currency = 'NGN';
                    break;
                }
                case 'service': {
                    const { serviceId } = payload;
                    const serviceRef = db.collection('services').doc(serviceId);
                    const serviceSnap = await serviceRef.get();
                    if (!serviceSnap.exists) {
                         throw new Error('Service not found.');
                    }
                    const serviceFee = serviceSnap.data().fee;
                    if (typeof serviceFee !== 'number' || isNaN(serviceFee)) {
                        throw new Error(`Invalid fee for service ${serviceId}.`);
                    }
                    amountInNaira = serviceFee;
                    break;
                }
                default:
                    throw new Error('Invalid payment type.');
            }
            
            // Final conversion and validation before sending to Paystack
            const amountInKobo = Math.round(amountInNaira * 100);
            
            // Stricter check for a valid, positive integer amount.
            if (!Number.isInteger(amountInKobo) || amountInKobo < 50) { // Paystack minimum is 50 kobo
                console.error(`Invalid final amount calculated. Naira: ${amountInNaira}, Kobo: ${amountInKobo}`);
                throw new Error(`Calculated final amount is invalid or below minimum. Amount: ${amountInNaira} Naira.`);
            }

            const paystackPayload = {
                email,
                amount: amountInKobo,
                currency,
                callback_url,
                metadata: {
                    userId,
                    businessId,
                    type,
                    ...(orderId ? { orderId, orderPath } : {}),
                },
                ...(planCode && { plan: planCode })
            };

            const response = await axios.post('https://api.paystack.co/transaction/initialize', paystackPayload, {
                headers: { Authorization: `Bearer ${paystackSecret}`, 'Content-Type': 'application/json' },
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
                    orderId: orderId || null,
                    orderPath: orderPath || null,
                    amount: amountInKobo,
                    currency,
                    status: 'pending',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // For product payments, create a pending order immediately so owners/admins can see
                // payment status transition in realtime.
                if (type === 'product' && orderRef && orderDraft) {
                    await orderRef.set({
                        ...orderDraft,
                        paymentReference: reference,
                        paymentIntentReference: reference,
                    });
                }

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

/**
 * Verifies a payment transaction with Paystack.
 * Accepts query param: ?reference=<tx_ref>
 * Returns: Full Paystack verification data object on success.
 */
exports.verifyPayment = onRequest({ cors: true, secrets: [PAYSTACK_SECRET_KEY, PAYSTACK_SECRET] }, async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }
    const paystackSecret = getPaystackSecret();
    if (!paystackSecret) {
        console.error("Verify function called, but PAYSTACK_SECRET_KEY is not configured.");
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
                    Authorization: `Bearer ${paystackSecret}`,
                },
            }
        );

        if (response.data && response.data.status) {
            const paystackData = response.data.data;

            // Best-effort reconciliation: if Paystack confirms payment, ensure our Firestore
            // state is updated even if the webhook is delayed.
            try {
                await db.runTransaction(async (tx) => {
                    const intentRef = db.collection('paymentIntents').doc(reference);
                    const intentSnap = await tx.get(intentRef);
                    if (!intentSnap.exists) return;

                    const intentData = intentSnap.data();
                    if (intentData.status === 'successful') return;

                    // Only reconcile successful Paystack charges.
                    if (paystackData.status !== 'success') return;

                    // Paystack returns `amount` in kobo.
                    if (typeof intentData.amount === 'number' && typeof paystackData.amount === 'number') {
                        if (intentData.amount !== paystackData.amount) {
                            console.warn(`verifyPayment reconcile: amount mismatch for ${reference}. intent=${intentData.amount}, paystack=${paystackData.amount}`);
                            return;
                        }
                    }

                    const paidAtDate = paystackData.paid_at ? new Date(paystackData.paid_at) : new Date();

                    if (intentData.type === 'subscription') {
                        const { planId, billingCycle } = intentData.payload || {};
                        if (!planId || !billingCycle) return;

                        let endDate = new Date(paidAtDate);
                        if (billingCycle === 'monthly') {
                            endDate.setMonth(paidAtDate.getMonth() + 1);
                        } else {
                            endDate.setFullYear(paidAtDate.getFullYear() + 1);
                        }

                        const subRef = db
                            .collection('users')
                            .doc(intentData.userId)
                            .collection('subscriptions')
                            .doc(reference);
                        const subTxRef = db.collection('subscriptionTransactions').doc(reference);

                        tx.set(
                            subRef,
                            {
                                planId,
                                status: 'active',
                                billingCycle,
                                paystackReference: reference,
                                currentPeriodStart: admin.firestore.Timestamp.fromDate(paidAtDate),
                                currentPeriodEnd: admin.firestore.Timestamp.fromDate(endDate),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            },
                            { merge: true }
                        );

                        tx.set(
                            subTxRef,
                            {
                                userId: intentData.userId,
                                planId,
                                amountPaid: (intentData.amount || 0) / 100,
                                currency: paystackData.currency || 'NGN',
                                paystackReference: reference,
                                status: 'successful',
                                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            },
                            { merge: true }
                        );

                        tx.update(intentRef, { status: 'successful' });
                        return;
                    }

                    if (intentData.type === 'product') {
                        // Confirm the linked order so the user sees success even if the webhook is delayed.
                        const resolveOrderRef = () => {
                            if (intentData.orderPath && typeof intentData.orderPath === 'string') {
                                return db.doc(intentData.orderPath);
                            }
                            if (intentData.orderId && intentData.businessId) {
                                return db.collection('businesses').doc(intentData.businessId).collection('orders').doc(intentData.orderId);
                            }
                            return null;
                        };

                        const linkedOrderRef = resolveOrderRef();
                        if (!linkedOrderRef) {
                            // If we can't resolve an order, just mark the intent successful.
                            tx.update(intentRef, { status: 'successful' });
                            return;
                        }

                        tx.set(
                            linkedOrderRef,
                            {
                                paymentStatus: 'paid',
                                status: 'confirmed',
                                payment: 'busmopay',
                                paymentReference: reference,
                                paidAt: admin.firestore.Timestamp.fromDate(paidAtDate),
                                gateway: {
                                    channel: paystackData?.channel || null,
                                    gatewayResponse: paystackData?.gateway_response || null,
                                },
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            },
                            { merge: true }
                        );

                        tx.update(intentRef, { status: 'successful' });
                        return;
                    }
                });
            } catch (reconcileErr) {
                console.warn('verifyPayment reconcile failed:', reconcileErr);
            }

            // Return the full data object from Paystack
            return res.status(200).json({ success: true, data: paystackData });
        } else {
            return res.status(400).json({ success: false, error: response.data.message || 'Could not verify payment.' });
        }
    } catch (error) {
        console.error("Paystack verifyPayment error:", error.response ? error.response.data : error.message);
        const errorMessage = error.response?.data?.message || 'An error occurred while verifying the payment.';
        return res.status(error.response?.status || 500).json({ success: false, error: errorMessage });
    }
});


/**
 * Handles incoming webhook events from Paystack.
 * It cryptographically verifies the request and processes the payment events.
 */
exports.paystackWebhook = onRequest({ secrets: [PAYSTACK_SECRET_KEY, PAYSTACK_SECRET] }, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const paystackSecret = getPaystackSecret();
    if (!paystackSecret) {
        console.error('Webhook received but PAYSTACK_SECRET_KEY is not configured.');
        return res.status(500).send('Webhook secret not configured');
    }
    
    // 1. Verify the webhook signature.
    // Paystack signs the raw request body; use req.rawBody when available.
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
    const hash = crypto
        .createHmac('sha512', paystackSecret)
        .update(rawBody)
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        console.warn('Webhook received with invalid signature.');
        return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    const eventId = event.id;
    const reference = event?.data?.reference;

    try {
        await db.runTransaction(async (transaction) => {
            // 2. Enforce Idempotency
            const eventRef = db.collection('processedWebhookEvents').doc(eventId);
            const eventSnap = await transaction.get(eventRef);
            if (eventSnap.exists) {
                console.log(`Webhook event ${eventId} already processed.`);
                return;
            }

            // Transfer webhooks are independent from payment intents.
            if (typeof event?.event === 'string' && event.event.startsWith('transfer.')) {
                const transferReference = reference;
                const transferCode = event?.data?.transfer_code || event?.data?.transferCode || null;

                if (transferReference) {
                    const payoutsQuery = db
                        .collectionGroup('payouts')
                        .where('paystackReference', '==', transferReference)
                        .limit(5);

                    const payoutsSnap = await transaction.get(payoutsQuery);

                    for (const payoutDoc of payoutsSnap.docs) {
                        const payoutRef = payoutDoc.ref;
                        const payout = payoutDoc.data() || {};
                        const businessId = getBusinessIdFromDocPath(payoutRef.path);
                        const orderId = payout.orderId || null;

                        const isSuccess = event.event === 'transfer.success';
                        const isFailed = event.event === 'transfer.failed';

                        if (isSuccess) {
                            transaction.set(
                                payoutRef,
                                {
                                    status: 'paid',
                                    paystackTransferCode: transferCode,
                                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                                },
                                { merge: true }
                            );
                            if (businessId && orderId) {
                                const orderRef = db.collection('businesses').doc(businessId).collection('orders').doc(orderId);
                                transaction.set(
                                    orderRef,
                                    { payoutStatus: 'paid', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
                                    { merge: true }
                                );
                            }
                        }

                        if (isFailed) {
                            transaction.set(
                                payoutRef,
                                {
                                    status: 'failed',
                                    paystackTransferCode: transferCode,
                                    failureReason: event?.data?.reason || event?.data?.gateway_response || event?.data?.message || null,
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                                },
                                { merge: true }
                            );
                            if (businessId && orderId) {
                                const orderRef = db.collection('businesses').doc(businessId).collection('orders').doc(orderId);
                                transaction.set(
                                    orderRef,
                                    { payoutStatus: 'unpaid', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
                                    { merge: true }
                                );
                            }
                        }
                    }
                }

                transaction.set(eventRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
                return;
            }

            // 3. Fetch the Payment Intent
            if (!reference) {
                throw new Error('Missing Paystack reference.');
            }
            const intentRef = db.collection('paymentIntents').doc(reference);
            const intentSnap = await transaction.get(intentRef);
            if (!intentSnap.exists) {
                throw new Error(`Payment intent with reference ${reference} not found.`);
            }
            const intentData = intentSnap.data();

            const resolveOrderRef = () => {
                if (intentData.orderPath && typeof intentData.orderPath === 'string') {
                    return db.doc(intentData.orderPath);
                }
                if (intentData.orderId && intentData.businessId) {
                    return db.collection('businesses').doc(intentData.businessId).collection('orders').doc(intentData.orderId);
                }
                return null;
            };

            // 4. Handle event type
            if (event.event === 'charge.success') {
                switch (intentData.type) {
                    case 'product': {
                        const linkedOrderRef = resolveOrderRef();
                        const paidAt = event.data?.paid_at ? new Date(event.data.paid_at) : new Date();

                        if (linkedOrderRef) {
                            transaction.set(
                                linkedOrderRef,
                                {
                                    paymentStatus: 'paid',
                                    status: 'confirmed',
                                    payment: 'busmopay',
                                    paymentReference: reference,
                                    paidAt: admin.firestore.Timestamp.fromDate(paidAt),
                                    gateway: {
                                        channel: event.data?.channel || null,
                                        gatewayResponse: event.data?.gateway_response || null,
                                    },
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                                },
                                { merge: true }
                            );
                        } else {
                            // Backward-compat: create an order if none was pre-created.
                            const newOrderRef = db.collection('businesses').doc(intentData.businessId).collection('orders').doc();
                            transaction.set(newOrderRef, {
                                buyerId: intentData.userId,
                                sellerBusinessId: intentData.businessId,
                                customer: event.data.customer,
                                items: intentData.payload.items,
                                subtotal: intentData.amount / 100, // Convert back to Naira
                                deliveryFee: 0,
                                total: intentData.amount / 100,
                                status: 'confirmed',
                                fulfillment: intentData.payload.fulfillmentMethod,
                                payment: 'busmopay',
                                paymentStatus: 'paid',
                                paymentReference: reference,
                                payoutStatus: 'unpaid',
                                paidAt: admin.firestore.Timestamp.fromDate(paidAt),
                                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            });
                        }
                        break;
                    }
                    case 'subscription': {
                         const { planId, billingCycle } = intentData.payload;
                        const subRef = db.collection('users').doc(intentData.userId).collection('subscriptions').doc(reference); // Idempotent per reference
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
                             billingCycle,
                             paystackReference: reference,
                             currentPeriodStart: admin.firestore.Timestamp.fromDate(paidAtDate),
                             currentPeriodEnd: admin.firestore.Timestamp.fromDate(endDate),
                             createdAt: admin.firestore.FieldValue.serverTimestamp(),
                             updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                         }, { merge: true });

                         transaction.set(subTxRef, {
                             userId: intentData.userId,
                             planId,
                             amountPaid: intentData.amount / 100,
                             currency: 'NGN',
                             paystackReference: reference,
                             status: 'successful',
                             createdAt: admin.firestore.FieldValue.serverTimestamp(),
                         }, { merge: true });
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
                 const linkedOrderRef = resolveOrderRef();
                 if (intentData.type === 'product' && linkedOrderRef) {
                    transaction.set(
                        linkedOrderRef,
                        {
                            paymentStatus: 'failed',
                            paymentReference: reference,
                            gateway: {
                                gatewayResponse: event.data?.gateway_response || null,
                            },
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    );
                 }
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

// --- BUSMOPAY PAYOUTS (AUTOMATED) ---
// Processes payouts that have been marked as `processing` and have aged past the configured delay.
// Default delay is 48 hours; configure via `PAYOUT_DELAY_HOURS` env var.
exports.processPayouts = onSchedule(
    {
        schedule: 'every 60 minutes',
        secrets: [PAYSTACK_SECRET_KEY, PAYSTACK_SECRET],
    },
    async () => {
        const paystackSecret = getPaystackSecret();
        if (!paystackSecret) {
            console.error('processPayouts: Paystack secret not configured.');
            return;
        }

        const delayHoursRaw = process.env.PAYOUT_DELAY_HOURS;
        const delayHours = Number.isFinite(Number(delayHoursRaw)) ? Number(delayHoursRaw) : 48;
        const cutoffDate = new Date(Date.now() - delayHours * 60 * 60 * 1000);
        const cutoff = admin.firestore.Timestamp.fromDate(cutoffDate);

        const candidates = await db
            .collectionGroup('payouts')
            .where('status', '==', 'processing')
            .limit(50)
            .get();

        for (const payoutDoc of candidates.docs) {
            const payoutRef = payoutDoc.ref;
            const payoutId = payoutRef.id;

            const createdAt = payoutDoc.data()?.createdAt;
            if (!createdAt || typeof createdAt.toDate !== 'function') continue;
            if (createdAt.toDate() > cutoffDate) continue;

            let payoutData = null;
            try {
                payoutData = await db.runTransaction(async (tx) => {
                    const fresh = await tx.get(payoutRef);
                    if (!fresh.exists) return null;
                    const data = fresh.data();
                    if (data.status !== 'processing') return null;
                    tx.update(payoutRef, {
                        status: 'initiating',
                        processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    return data;
                });
            } catch (claimErr) {
                console.warn('processPayouts: failed to claim payout', payoutRef.path, claimErr);
                continue;
            }

            if (!payoutData) continue;

            const businessId = getBusinessIdFromDocPath(payoutRef.path);
            if (!businessId) {
                await payoutRef.set(
                    {
                        status: 'failed',
                        failureReason: 'Invalid payout path (missing businessId).',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
                continue;
            }

            const orderId = payoutData.orderId || null;
            const amountMajor = Number(payoutData.amount || 0);
            const amountKobo = Math.round(amountMajor * 100);
            if (!Number.isInteger(amountKobo) || amountKobo < 50) {
                await payoutRef.set(
                    {
                        status: 'failed',
                        failureReason: `Invalid payout amount: ${payoutData.amount}`,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
                continue;
            }

            const bankAccountRef = db.collection('businesses').doc(businessId).collection('bankAccount').doc('primary');
            const bankAccountSnap = await bankAccountRef.get();
            const bankAccount = bankAccountSnap.exists ? bankAccountSnap.data() : null;
            if (!bankAccount || bankAccount.status !== 'verified') {
                await payoutRef.set(
                    {
                        status: 'failed',
                        failureReason: 'Payout account is not verified.',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
                if (orderId) {
                    await db.collection('businesses').doc(businessId).collection('orders').doc(orderId).set(
                        { payoutStatus: 'unpaid', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
                        { merge: true }
                    );
                }
                continue;
            }

            const bankCode = bankAccount.bankCode;
            const accountNumber = bankAccount.accountNumber;
            const accountName = bankAccount.accountName || bankAccount.account_name || 'Busmo Seller';
            if (!bankCode || !accountNumber) {
                await payoutRef.set(
                    {
                        status: 'failed',
                        failureReason: 'Missing bank account details.',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
                continue;
            }

            let recipientCode = bankAccount.recipientCode || null;
            if (!recipientCode) {
                try {
                    const recipientResp = await paystackPost(
                        '/transferrecipient',
                        {
                            type: 'nuban',
                            name: String(accountName),
                            account_number: String(accountNumber),
                            bank_code: String(bankCode),
                            currency: 'NGN',
                        },
                        paystackSecret
                    );

                    if (!recipientResp?.status) {
                        throw new Error(recipientResp?.message || 'Paystack transferrecipient failed');
                    }

                    recipientCode = recipientResp?.data?.recipient_code;
                    if (!recipientCode) {
                        throw new Error('Paystack did not return recipient_code');
                    }

                    await bankAccountRef.set(
                        {
                            recipientCode,
                            recipientUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    );
                } catch (recipientErr) {
                    await payoutRef.set(
                        {
                            status: 'failed',
                            failureReason: recipientErr?.message || 'Failed to create transfer recipient.',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    );
                    continue;
                }
            }

            const paystackReference = `payout_${payoutId}`;
            try {
                const transferResp = await paystackPost(
                    '/transfer',
                    {
                        source: 'balance',
                        amount: amountKobo,
                        recipient: recipientCode,
                        reason: `Busmo payout for order ${orderId || ''}`.trim(),
                        reference: paystackReference,
                    },
                    paystackSecret
                );

                if (!transferResp?.status) {
                    throw new Error(transferResp?.message || 'Paystack transfer failed');
                }

                const transferData = transferResp.data || {};
                const transferStatus = String(transferData.status || '').toLowerCase();
                const isPaid = transferStatus === 'success' || transferStatus === 'successful' || transferStatus === 'completed';

                await payoutRef.set(
                    {
                        status: isPaid ? 'paid' : 'initiated',
                        paystackReference,
                        paystackTransferCode: transferData.transfer_code || transferData.transferCode || null,
                        paystackRecipient: recipientCode,
                        amountKobo,
                        initiatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        gatewayResponse: transferResp,
                        ...(isPaid ? { paidAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
                    },
                    { merge: true }
                );

                if (orderId) {
                    await db.collection('businesses').doc(businessId).collection('orders').doc(orderId).set(
                        {
                            payoutStatus: isPaid ? 'paid' : 'processing',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    );
                }
            } catch (transferErr) {
                await payoutRef.set(
                    {
                        status: 'failed',
                        paystackReference,
                        failureReason: transferErr?.message || 'Failed to initiate Paystack transfer.',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
                if (orderId) {
                    await db.collection('businesses').doc(businessId).collection('orders').doc(orderId).set(
                        { payoutStatus: 'unpaid', updatedAt: admin.firestore.FieldValue.serverTimestamp() },
                        { merge: true }
                    );
                }
            }
        }
    }
);
