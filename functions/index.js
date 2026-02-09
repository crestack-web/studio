
const functions = require("firebase-functions");
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require("firebase-admin");
const axios = require("axios");
const { sendTransactionalEmail } = require('./email/service');

// IMPORTANT: Initialize admin BEFORE requiring any modules that call admin.firestore().
admin.initializeApp();

const { onUserCreate } = require("./triggers/auth");
const { onStaffInvitationCreate, onStaffPermissionsAssigned } = require('./triggers/staff');
const { onOrderCreate, onOrderPaid } = require('./triggers/orders');
const { onSaleWrite, onOrderWriteForRevenue, onRevenueBackfillRequestCreate } = require('./triggers/revenue');
const { sendOwnerDailyDigest } = require('./notifications/ownerDailyDigest');

const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY');

// Backwards-compatibility: some environments may still use a different secret name.
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

    // Backwards-compatibility: some projects still set this via `firebase functions:config:set`.
    // This is deprecated for newer runtimes, but we support it as a fallback to reduce breakage.
    try {
        const cfg = functions.config && functions.config();
        const fromConfig = cfg?.paystack?.secret_key || cfg?.paystack?.secret || cfg?.paystack?.secretKey;
        if (fromConfig) return fromConfig;
    } catch {
        // ignore
    }

    return undefined;
}

// --- NEW PAYMENT FUNCTIONS ---
// All new payment logic is imported from the dedicated payments.js file.
const paymentFunctions = require('./payments');
exports.initializePayment = paymentFunctions.initializePayment;
exports.verifyPayment = paymentFunctions.verifyPayment;
exports.paystackWebhook = paymentFunctions.paystackWebhook;
exports.processPayouts = paymentFunctions.processPayouts;


// --- EXISTING FUNCTIONS (PRESERVED) ---

// Expose the auth trigger for the welcome email
exports.onUserCreate = onUserCreate;

// Staff invitation + permissions emails
exports.onStaffInvitationCreate = onStaffInvitationCreate;
exports.onStaffPermissionsAssigned = onStaffPermissionsAssigned;

// Market order notifications
exports.onOrderCreate = onOrderCreate;
exports.onOrderPaid = onOrderPaid;

// Platform revenue aggregation
exports.onSaleWrite = onSaleWrite;
exports.onOrderWriteForRevenue = onOrderWriteForRevenue;
exports.onRevenueBackfillRequestCreate = onRevenueBackfillRequestCreate;

// Daily owner email digest
exports.sendOwnerDailyDigest = sendOwnerDailyDigest;

// Bank utility functions are preserved as they are not part of the core payment/subscription flow reset.
exports.fetchBankList = onRequest({ cors: true, invoker: 'public', secrets: [PAYSTACK_SECRET_KEY, PAYSTACK_SECRET] }, async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }
    const country = req.query.country || 'nigeria';
    const currency = req.query.currency || 'NGN';

    const paystackSecret = getPaystackSecret();
    if (!paystackSecret) {
        console.error("Paystack secret key is not configured.");
        return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
    }

    try {
        const response = await axios.get(
            `https://api.paystack.co/bank?country=${encodeURIComponent(String(country))}&currency=${encodeURIComponent(String(currency))}`,
            {
            headers: { Authorization: `Bearer ${paystackSecret}` },
            }
        );

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

exports.verifyBankAccount = onRequest({ cors: true, invoker: 'public', secrets: [PAYSTACK_SECRET_KEY, PAYSTACK_SECRET] }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }

        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                body = {};
            }
        }

        const safeBody = (body && typeof body === 'object') ? body : {};
        const q = req.query || {};

        const account_number = safeBody.account_number || safeBody.accountNumber || q.account_number || q.accountNumber;
        const bank_code = safeBody.bank_code || safeBody.bankCode || q.bank_code || q.bankCode;

        if (!account_number || !bank_code) {
            return res.status(400).json({ success: false, error: 'Missing account_number or bank_code.' });
        }

        const paystackSecret = getPaystackSecret();
        if (!paystackSecret) {
            console.error('Paystack secret key is not configured.');
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }
        
        const response = await axios.get(
            `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(String(account_number))}&bank_code=${encodeURIComponent(String(bank_code))}`,
            {
                headers: { Authorization: `Bearer ${paystackSecret}` },
            }
        );
        
        if (response.data && response.data.status) {
            return res.status(200).json({ success: true, data: response.data.data });
        }

        return res.status(400).json({ success: false, error: response.data?.message || 'Could not resolve account.' });
    } catch (error) {
        console.error('verifyBankAccount unexpected error:', error?.response ? error.response.data : error);
        const errorMessage = error?.response?.data?.message || error?.message || 'An internal error occurred while resolving the bank account.';
        return res.status(error?.response?.status || 500).json({ success: false, error: errorMessage });
    }
});

exports.sendEmailVerification = onRequest({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const authHeader = String(req.headers.authorization || req.headers.Authorization || '');
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const idToken = match?.[1];

    if (!idToken) {
        return res.status(401).json({ success: false, error: 'Missing Authorization bearer token.' });
    }

    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }

    try {
        const userRecord = await admin.auth().getUser(decoded.uid);
        const email = userRecord.email;
        if (!email) {
            return res.status(400).json({ success: false, error: 'User has no email address.' });
        }

        if (userRecord.emailVerified) {
            return res.status(200).json({ success: true, alreadyVerified: true });
        }

        const publicBrandHost = process.env.PUBLIC_BRAND_HOST || process.env.PUBLIC_APP_URL || 'https://busmo.web.app';
        const actionCodeSettings = {
            url: `${publicBrandHost}/finish-signin`,
            handleCodeInApp: false,
        };

        const verificationUrl = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

        await sendTransactionalEmail({
            to: email,
            templateId: 'email_verification',
            data: {
                userName: userRecord.displayName || 'there',
                verificationUrl,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('sendEmailVerification error:', error);
        return res.status(500).json({ success: false, error: error?.message || 'Failed to send verification email.' });
    }
});
