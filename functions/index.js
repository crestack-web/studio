
const functions = require("firebase-functions");
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require("firebase-admin");
const axios = require("axios");

// IMPORTANT: Initialize admin BEFORE requiring any modules that call admin.firestore().
admin.initializeApp();

const { onUserCreate } = require("./triggers/auth");
const { onStaffInvitationCreate, onStaffPermissionsAssigned } = require('./triggers/staff');
const { onOrderCreate, onOrderPaid } = require('./triggers/orders');
const { onSaleWrite, onOrderWriteForRevenue, onRevenueBackfillRequestCreate } = require('./triggers/revenue');
const { sendOwnerDailyDigest } = require('./notifications/ownerDailyDigest');

const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY');

function getPaystackSecret() {
    try {
        const secret = PAYSTACK_SECRET_KEY.value();
        if (secret) return secret;
    } catch {
        // When running locally without secrets, fall back to env var.
    }
    return process.env.PAYSTACK_SECRET_KEY;
}

// --- NEW PAYMENT FUNCTIONS ---
// All new payment logic is imported from the dedicated payments.js file.
const paymentFunctions = require('./payments');
exports.initializePayment = paymentFunctions.initializePayment;
exports.verifyPayment = paymentFunctions.verifyPayment;
exports.paystackWebhook = paymentFunctions.paystackWebhook;


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
exports.fetchBankList = onRequest({ cors: true, secrets: [PAYSTACK_SECRET_KEY] }, async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }
    const country = req.query.country || 'nigeria';

    const paystackSecret = getPaystackSecret();
    if (!paystackSecret) {
        console.error("Paystack secret key is not configured.");
        return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
    }

    try {
        const response = await axios.get(`https://api.paystack.co/bank?country=${country}&currency=NGN`, {
            headers: { Authorization: `Bearer ${paystackSecret}` },
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

exports.verifyBankAccount = onRequest({ cors: true, secrets: [PAYSTACK_SECRET_KEY] }, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    const { account_number, bank_code } = req.body;

    if (!account_number || !bank_code) {
        return res.status(400).json({ success: false, error: 'Missing account_number or bank_code.' });
    }

    const paystackSecret = getPaystackSecret();
    if (!paystackSecret) {
        console.error("Paystack secret key is not configured.");
        return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
    }
    
    try {
        const response = await axios.get(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, {
            headers: { Authorization: `Bearer ${paystackSecret}` },
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
