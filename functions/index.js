
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { onUserCreate } = require("./triggers/auth");
const cors = require('cors')({origin: true});

admin.initializeApp();

// IMPORTANT: Set your Paystack secret key in your environment variables
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// --- NEW PAYMENT FUNCTIONS ---
// All new payment logic is imported from the dedicated payments.js file.
const paymentFunctions = require('./payments');
exports.initializeOneTimePayment = paymentFunctions.initializeOneTimePayment;
exports.initializeSubscription = paymentFunctions.initializeSubscription;
exports.verifyPayment = paymentFunctions.verifyPayment;
exports.paystackWebhook = paymentFunctions.paystackWebhook;


// --- EXISTING FUNCTIONS (PRESERVED) ---

// Expose the auth trigger for the welcome email
exports.onUserCreate = onUserCreate;

// Bank utility functions are preserved as they are not part of the core payment/subscription flow reset.
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
