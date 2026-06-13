
// --- ALL REQUIRES AT TOP ---
const functions = require("firebase-functions");
const onRequest = functions.https.onRequest;
const admin = require("firebase-admin");
const axios = require("axios");
const { sendTransactionalEmail } = require('./email/service');
const { generateOTP, storeOTP, verifyOTP } = require('./email/otp');

// --- OTP EMAIL LOGIN ---
// Place OTP endpoints after all requires and initialization
exports.sendOtpLogin = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }
        const body = parseJsonBody(req);
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const role = typeof body.role === 'string' ? body.role : 'User';
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Missing or invalid email.' });
        }
        const otp = generateOTP();
        await storeOTP(email, otp, role);
        await sendTransactionalEmail({
            to: email,
            templateId: 'otp_login',
            data: { userName: email, otp, role },
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('sendOtpLogin error:', error);
        return res.status(500).json({ success: false, error: 'Failed to send OTP.' });
    }
});

exports.verifyOtpLogin = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }
        const body = parseJsonBody(req);
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
        if (!email || !otp) {
            return res.status(400).json({ success: false, error: 'Missing email or OTP.' });
        }
        const valid = await verifyOTP(email, otp);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'Invalid or expired OTP.' });
        }
        // Optionally, issue a custom token or session here
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('verifyOtpLogin error:', error);
        return res.status(500).json({ success: false, error: 'OTP verification failed.' });
    }
});

exports.sendTestOtp = functions.https.onRequest(async (req, res) => {
    const functions = require('firebase-functions');
    let sgMail;
    // Read SendGrid config from both env and functions config
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || (functions.config().sendgrid && functions.config().sendgrid.apikey);
    const SENDGRID_FROM_EMAIL = 'support@busmo.io';
    const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || (functions.config().sendgrid && functions.config().sendgrid.from_name);
        try {
                sgMail = require('@sendgrid/mail');
                sgMail.setApiKey(SENDGRID_API_KEY);
                const msg = {
                        to: 'crestack@gmail.com',
                        from: {
                                email: SENDGRID_FROM_EMAIL,
                                name: SENDGRID_FROM_NAME || 'Busmo',
                        },
                        subject: 'Welcome to Busmo! Your business clarity journey starts now',
                        html: `<!-- Busmo Responsive Email Template: Welcome Email -->
<!DOCTYPE html>
<html lang="en" style="background:#f3f4f6;">
<head>
    <meta charset="UTF-8">
    <title>Welcome to Busmo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        @media only screen and (max-width:600px) {
            .container { width:100% !important; }
            .main { padding:16px !important; }
            .benefit-table td { display:block; width:100% !important; text-align:left !important; }
            .cta-btn { width:100% !important; padding:16px 0 !important; }
            .footer-links { display:block !important; text-align:center !important; }
        }
        .cta-btn:hover { background:#059669 !important; }
    </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
    <table width="100%" bgcolor="#f3f4f6" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
        <tr>
            <td align="center">
                <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(99,102,241,0.08);margin:32px auto;">
                    <tr>
                        <td align="center" style="padding:32px 0 16px 0;background:#fff;border-bottom:1px solid #f3f4f6;">
                            <img src="https://busmo.io/logo.png" alt="Busmo App Logo" width="48" height="48" style="display:block;margin:auto;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:32px;background:linear-gradient(90deg,#e0e7ff 0%,#dbeafe 100%);">
                            <h1 style="font-family:'Segoe UI',Arial,sans-serif;font-size:2rem;font-weight:700;color:#3b82f6;margin:0;">Ready to See Your Real Profit?</h1>
                            <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:1.1rem;color:#6366f1;margin:16px 0 0 0;">Welcome to Busmo – the clarity tool for African business owners.</p>
                            <span style="font-size:2rem;">💡</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="main" style="padding:32px;">
                            <p style="font-family:'Segoe UI',Arial,sans-serif;font-size:1rem;color:#374151;margin:0 0 24px 0;">
                                You deserve to know your true profit, every day. Busmo helps you track sales, inventory, and expenses – all in one place, so you can focus on growing your business.
                            </p>
                            <table class="benefit-table" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="40" valign="top" style="font-size:1.5rem;">📊</td>
                                    <td style="font-family:'Segoe UI',Arial,sans-serif;font-size:1rem;color:#374151;padding-bottom:24px;">See daily profit in seconds</td>
                                </tr>
                                <tr>
                                    <td width="40" valign="top" style="font-size:1.5rem;">📦</td>
                                    <td style="font-family:'Segoe UI',Arial,sans-serif;font-size:1rem;color:#374151;padding-bottom:24px;">Track inventory automatically</td>
                                </tr>
                                <tr>
                                    <td width="40" valign="top" style="font-size:1.5rem;">💰</td>
                                    <td style="font-family:'Segoe UI',Arial,sans-serif;font-size:1rem;color:#374151;">Know exactly where your money goes</td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;margin:32px 0;">
                                <tr>
                                    <td width="60" align="center" valign="top">
                                        <span style="font-size:2rem;">👤</span>
                                    </td>
                                    <td style="font-family:'Segoe UI',Arial,sans-serif;font-size:1rem;color:#374151;padding-left:16px;">
                                        <em>"Busmo helped me finally understand my ₦ profit and manage my shop with confidence!"</em>
                                        <div style="font-size:0.9rem;color:#6b7280;margin-top:8px;">Aisha Bello, Bello Fashion Lagos</div>
                                    </td>
                                </tr>
                            </table>
                            <div align="center" style="margin:32px 0;">
                                <a href="https://busmo.io/welcome" class="cta-btn" style="display:inline-block;background:#10b981;color:#fff;font-family:'Segoe UI',Arial,sans-serif;font-size:1.2rem;font-weight:700;border-radius:8px;padding:16px 48px;text-decoration:none;transition:background 0.2s;">Start Your Free Trial</a>
                                <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:0.95rem;color:#6b7280;margin-top:12px;">
                                    No credit card required • 14-day free trial
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="background:#f3f4f6;padding:32px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom:16px;">
                                        <a href="https://twitter.com/busmohq" style="margin:0 8px;"><img src="https://busmo.io/twitter-icon.png" alt="Twitter" width="24" height="24" style="vertical-align:middle;"></a>
                                        <a href="https://facebook.com/busmohq" style="margin:0 8px;"><img src="https://busmo.io/facebook-icon.png" alt="Facebook" width="24" height="24" style="vertical-align:middle;"></a>
                                        <a href="https://instagram.com/busmohq" style="margin:0 8px;"><img src="https://busmo.io/instagram-icon.png" alt="Instagram" width="24" height="24" style="vertical-align:middle;"></a>
                                        <a href="https://linkedin.com/company/busmo" style="margin:0 8px;"><img src="https://busmo.io/linkedin-icon.png" alt="LinkedIn" width="24" height="24" style="vertical-align:middle;"></a>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="footer-links" align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:1rem;color:#6366f1;padding-bottom:16px;">
                                        <a href="https://busmo.io/about" style="color:#6366f1;text-decoration:none;margin:0 8px;">About Us</a> |
                                        <a href="https://busmo.io/help" style="color:#6366f1;text-decoration:none;margin:0 8px;">Help</a> |
                                        <a href="https://busmo.io/contact" style="color:#6366f1;text-decoration:none;margin:0 8px;">Contact</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:0.9rem;color:#6b7280;padding-bottom:8px;">
                                        <a href="https://busmo.io/unsubscribe" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:0.9rem;color:#6b7280;">
                                        12 Allen Avenue, Ikeja, Lagos, Nigeria
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:0.9rem;color:#6b7280;padding-top:8px;">
                                        © 2026 Busmo
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
                };
                await sgMail.send(msg);
                console.log('Welcome email sent successfully');
                return res.status(200).json({ success: true, message: 'Welcome email sent.' });
        } catch (error) {
                console.error('SendGrid welcome email error:', error);
                return res.status(500).json({ success: false, error: error.message || error.toString() });
        }
});

// IMPORTANT: Initialize admin BEFORE requiring any modules that call admin.firestore().
admin.initializeApp();

const { onUserCreate } = require("./triggers/auth");
const { onStaffInvitationCreate, onStaffPermissionsAssigned } = require('./triggers/staff');
const { onOrderCreate, onOrderPaid } = require('./triggers/orders');
const { onSaleWrite, onOrderWriteForRevenue, onRevenueBackfillRequestCreate } = require('./triggers/revenue');
const { onMarketProductCreatedNotifySubscribers } = require('./triggers/marketSubscriptions');
const { onSubscriptionTransactionCreatedApplyReferralCommission } = require('./triggers/referrals');
const { sendOwnerDailyDigest } = require('./notifications/ownerDailyDigest');
const { createProduct } = require("./triggers/products");

function getProjectId() {
    const fromEnv = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (fromEnv) return String(fromEnv);
    const firebaseConfig = process.env.FIREBASE_CONFIG;
    if (firebaseConfig) {
        try {
            const parsed = JSON.parse(firebaseConfig);
            if (parsed?.projectId) return String(parsed.projectId);
        } catch {
            // ignore
        }
    }
    return undefined;
}

function resolveAppOrigin(req) {
    const candidates = [
        process.env.PUBLIC_APP_URL,
        process.env.PUBLIC_APP_ORIGIN,
        process.env.APP_URL,
        process.env.APP_ORIGIN,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXT_PUBLIC_APP_ORIGIN,
        process.env.PUBLIC_BRAND_HOST,
    ].filter(Boolean);

    if (candidates.length > 0) {
        return String(candidates[0]).replace(/\/+$/, '');
    }

    const originHeader = String(req.headers.origin || '').trim();
    if (originHeader.startsWith('http://') || originHeader.startsWith('https://')) {
        try {
            const asUrl = new URL(originHeader);
            // Avoid accidentally using a cloudfunctions origin.
            if (!asUrl.hostname.endsWith('cloudfunctions.net')) {
                return `${asUrl.protocol}//${asUrl.host}`;
            }
        } catch {
            // ignore
        }
    }

    const projectId = getProjectId();
    if (projectId) return `https://${projectId}.web.app`;

    // Last resort: keep it valid.
    return 'https://busmo.web.app';
}

function parseJsonBody(req) {
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            body = {};
        }
    }
    return (body && typeof body === 'object') ? body : {};
}

function normalizeRelativeContinueUrl(raw) {
    if (!raw || typeof raw !== 'string') return '/owner/home';
    const trimmed = raw.trim();
    if (!trimmed) return '/owner/home';
    try {
        const decoded = decodeURIComponent(trimmed);
        if (decoded.startsWith('/')) return decoded;
        // Reject absolute URLs.
        return '/owner/home';
    } catch {
        return trimmed.startsWith('/') ? trimmed : '/owner/home';
    }
}

function getPaystackSecret() {
    const raw = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;
    const secret = raw ? String(raw).trim() : '';
    if (!secret) return undefined;
    // Paystack secret keys are typically sk_test_* or sk_live_*; guard against misconfiguration.
    if (!secret.startsWith('sk_')) return undefined;
    return secret;

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

// Storefront subscriber notifications
exports.onMarketProductCreatedNotifySubscribers = onMarketProductCreatedNotifySubscribers;

// Referral commissions (recurring on subscriptions)
exports.onSubscriptionTransactionCreatedApplyReferralCommission = onSubscriptionTransactionCreatedApplyReferralCommission;

// Daily owner email digest
exports.sendOwnerDailyDigest = sendOwnerDailyDigest;

// Products
exports.createProduct = createProduct;
exports.getProducts = require("./triggers/products").getProducts;

// --- AUTH EMAILS (TRANSACTIONAL) ---

// Sends an admin email-link sign-in URL using our transactional email provider.
// Body: { email: string }
exports.sendAdminSignInLink = onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }

        const body = parseJsonBody(req);
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Missing or invalid email.' });
        }

        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch {
            return res.status(404).json({ success: false, error: 'No user found for that email.' });
        }

        const superAdmins = new Set([
            'crestack@gmail.com',
            'abduladallahusman@gmail.com',
        ]);

        let isAdmin = superAdmins.has(email);
        if (!isAdmin) {
            const [profileSnap, permSnap] = await Promise.all([
                admin.firestore().doc(`users/${userRecord.uid}`).get(),
                admin.firestore().doc(`admin_permissions/${userRecord.uid}`).get(),
            ]);
            const role = profileSnap.exists ? profileSnap.data()?.role : undefined;
            const perm = permSnap.exists ? permSnap.data() : undefined;
            isAdmin = role === 'Admin' || !!perm?.isSuperAdmin;
        }

        if (!isAdmin) {
            return res.status(403).json({ success: false, error: 'Not authorized for admin access.' });
        }

        const origin = resolveAppOrigin(req);
        const actionCodeSettings = {
            url: `${origin}/admin/finish-signin`,
            handleCodeInApp: true,
        };

        const signInUrl = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

        const userName = userRecord.displayName || userRecord.email || 'there';
        await sendTransactionalEmail({
            to: email,
            templateId: 'admin_signin_link',
            data: {
                userName,
                signInUrl,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('sendAdminSignInLink error:', error);
        return res.status(500).json({ success: false, error: 'Failed to send login link.' });
    }
});

// Sends a staff email-link sign-in URL using our transactional email provider.
// Allowed if there's a pending invitation for the email, or the email belongs to an existing Staff account.
// Body: { email: string }
exports.sendStaffSignInLink = onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, error: 'Method Not Allowed' });
        }

        const body = parseJsonBody(req);
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Missing or invalid email.' });
        }

        const invitationRef = admin.firestore().doc(`invitations/${email}`);
        const invitationSnap = await invitationRef.get();
        const invitation = invitationSnap.exists ? (invitationSnap.data() || {}) : null;
        const hasPendingInvite = !!invitation && invitation.status === 'pending';

        let existingStaffName = undefined;
        let existingBusinessName = undefined;

        if (!hasPendingInvite) {
            // If no invite, only allow if the user is already a Staff.
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                const profileSnap = await admin.firestore().doc(`users/${userRecord.uid}`).get();
                const role = profileSnap.exists ? profileSnap.data()?.role : undefined;
                if (role !== 'Staff') {
                    return res.status(403).json({ success: false, error: 'No staff invitation found for this email.' });
                }

                existingStaffName = userRecord.displayName || userRecord.email;
            } catch {
                return res.status(403).json({ success: false, error: 'No staff invitation found for this email.' });
            }
        }

        if (hasPendingInvite) {
            existingBusinessName = invitation.businessName;
        }

        const origin = resolveAppOrigin(req);
        const actionCodeSettings = {
            url: `${origin}/finish-signin`,
            handleCodeInApp: true,
        };

        const signInUrl = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
        const userName = existingStaffName || email;

        await sendTransactionalEmail({
            to: email,
            templateId: 'staff_signin_link',
            data: {
                userName,
                businessName: existingBusinessName,
                signInUrl,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('sendStaffSignInLink error:', error);
        return res.status(500).json({ success: false, error: 'Failed to send login link.' });
    }
});


// Bank utility functions are preserved as they are not part of the core payment/subscription flow reset.
exports.fetchBankList = onRequest(async (req, res) => {
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

exports.verifyBankAccount = onRequest(async (req, res) => {
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

// --- REFERRALS ---
// Securely claims a referral code for the currently signed-in user.
// Body: { code: string }
exports.claimReferral = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
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
    } catch {
        return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
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
    const rawCode = typeof safeBody.code === 'string' ? safeBody.code : '';
    const code = rawCode.trim().toUpperCase();

    if (!code || code.length < 6) {
        return res.status(400).json({ success: false, error: 'Invalid referral code.' });
    }

    const uid = decoded.uid;
    const userRef = admin.firestore().collection('users').doc(uid);
    const codeRef = admin.firestore().collection('referralCodes').doc(code);

    try {
        await admin.firestore().runTransaction(async (tx) => {
            const [codeSnap, userSnap] = await Promise.all([tx.get(codeRef), tx.get(userRef)]);
            if (!codeSnap.exists) {
                throw Object.assign(new Error('Invalid referral code.'), { status: 400 });
            }

            const referrerUid = codeSnap.data()?.uid;
            if (!referrerUid || typeof referrerUid !== 'string') {
                throw Object.assign(new Error('Invalid referral code.'), { status: 400 });
            }
            if (referrerUid === uid) {
                throw Object.assign(new Error('You cannot refer yourself.'), { status: 400 });
            }

            const userData = userSnap.exists ? (userSnap.data() || {}) : {};
            if (userData.referredBy && typeof userData.referredBy === 'string') {
                // Idempotent: already linked.
                return;
            }

            const now = admin.firestore.FieldValue.serverTimestamp();
            tx.set(
                userRef,
                {
                    referredBy: referrerUid,
                    referralCodeUsed: code,
                    referredAt: now,
                },
                { merge: true }
            );

            const referrerReferralRef = admin.firestore().doc(`users/${referrerUid}/referrals/${uid}`);
            const referrerStatsRef = admin.firestore().doc(`users/${referrerUid}/referralStats/summary`);
            const existingReferralSnap = await tx.get(referrerReferralRef);

            if (!existingReferralSnap.exists) {
                tx.set(
                    referrerReferralRef,
                    {
                        referredUid: uid,
                        status: 'signed_up',
                        createdAt: now,
                        paidCount: 0,
                        totalCommission: 0,
                        firstPaidAt: null,
                        lastCommissionAt: null,
                    },
                    { merge: true }
                );

                tx.set(
                    referrerStatsRef,
                    {
                        balance: 0,
                        totalCommission: 0,
                        paidReferralsCount: 0,
                        totalReferralsCount: admin.firestore.FieldValue.increment(1),
                        currentRate: 0.3,
                        updatedAt: now,
                    },
                    { merge: true }
                );
            }
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        const status = error?.status || 500;
        const message = status === 500 ? 'Failed to claim referral.' : (error?.message || 'Failed to claim referral.');
        console.error('claimReferral error', { uid: decoded?.uid, code, error: error?.message || String(error) });
        return res.status(status).json({ success: false, error: message });
    }
});

// Generates a referral code for the current user if missing.
// Returns: { success: true, code: string }
exports.ensureReferralCode = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
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
    } catch {
        return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }

    const uid = decoded.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const statsRef = userRef.collection('referralStats').doc('summary');

    const generateCode = (length = 8) => {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let out = '';
        for (let i = 0; i < length; i += 1) {
            out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return out;
    };

    try {
        // Fast path: already has a code.
        const userSnap = await userRef.get();
        const existingCode = userSnap.exists ? userSnap.data()?.referralCode : null;
        if (typeof existingCode === 'string' && existingCode.trim()) {
            const normalized = existingCode.trim().toUpperCase();
            const codeRef = db.collection('referralCodes').doc(normalized);
            const codeSnap = await codeRef.get().catch(() => null);

            if (!codeSnap?.exists) {
                await codeRef.set({ uid, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            }

            await statsRef.set(
                {
                    balance: 0,
                    totalCommission: 0,
                    paidReferralsCount: 0,
                    totalReferralsCount: 0,
                    currentRate: 0.3,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            return res.status(200).json({ success: true, code: normalized });
        }

        for (let attempt = 0; attempt < 12; attempt += 1) {
            const code = generateCode(8);
            const claimed = await db.runTransaction(async (tx) => {
                const codeRef = db.collection('referralCodes').doc(code);
                const codeSnap = await tx.get(codeRef);
                if (codeSnap.exists) return null;

                const now = admin.firestore.FieldValue.serverTimestamp();
                tx.set(codeRef, { uid, createdAt: now });
                tx.set(userRef, { referralCode: code }, { merge: true });
                tx.set(
                    statsRef,
                    {
                        balance: 0,
                        totalCommission: 0,
                        paidReferralsCount: 0,
                        totalReferralsCount: 0,
                        currentRate: 0.3,
                        updatedAt: now,
                    },
                    { merge: true }
                );
                return code;
            });

            if (claimed) {
                return res.status(200).json({ success: true, code: claimed });
            }
        }

        return res.status(500).json({ success: false, error: 'Failed to generate referral code.' });
    } catch (error) {
        console.error('ensureReferralCode error', { uid, error: error?.message || String(error) });
        return res.status(500).json({ success: false, error: 'Failed to generate referral code.' });
    }
});

// Admin-only: records a manual payout against a user's referral balance.
// Body: { userId: string, amount: number, note?: string }
exports.adminRecordReferralPayout = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
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
    } catch {
        return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }

    const callerUid = decoded.uid;
    const callerEmail = String(decoded.email || '').toLowerCase();

    const db = admin.firestore();

    const allowlisted = callerEmail === 'crestack@gmail.com' || callerEmail === 'abduladallahusman@gmail.com';
    let isAdminUser = allowlisted;
    if (!isAdminUser) {
        try {
            const permSnap = await db.doc(`admin_permissions/${callerUid}`).get();
            isAdminUser = permSnap.exists;
        } catch {
            isAdminUser = false;
        }
    }

    if (!isAdminUser) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
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

    const targetUserId = typeof safeBody.userId === 'string' ? safeBody.userId : '';
    const amountRaw = safeBody.amount;
    const note = typeof safeBody.note === 'string' ? safeBody.note.trim().slice(0, 200) : '';

    const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw);
    if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'Missing userId.' });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid amount.' });
    }

    if (amount < 5000) {
        return res.status(400).json({ success: false, error: 'Minimum payout is 5000.' });
    }

    // Keep to 2 decimals.
    const payoutAmount = Math.round(amount * 100) / 100;

    try {
        const payoutId = db.collection('_').doc().id;
        await db.runTransaction(async (tx) => {
            const statsRef = db.doc(`users/${targetUserId}/referralStats/summary`);
            const statsSnap = await tx.get(statsRef);
            const stats = statsSnap.exists ? (statsSnap.data() || {}) : {};
            const currentBalance = Number(stats.balance || 0);
            if (!Number.isFinite(currentBalance) || currentBalance <= 0) {
                throw Object.assign(new Error('User has no referral balance.'), { status: 400 });
            }
            if (payoutAmount > currentBalance + 1e-9) {
                throw Object.assign(new Error('Amount exceeds referral balance.'), { status: 400 });
            }

            const payoutRef = db.doc(`users/${targetUserId}/referralPayouts/${payoutId}`);
            const now = admin.firestore.FieldValue.serverTimestamp();

            tx.set(payoutRef, {
                id: payoutId,
                userId: targetUserId,
                amount: payoutAmount,
                currency: 'NGN',
                note: note || null,
                createdAt: now,
                createdBy: callerUid,
                createdByEmail: callerEmail || null,
                status: 'paid',
                method: 'manual',
            });

            tx.set(
                statsRef,
                {
                    balance: Math.round((currentBalance - payoutAmount) * 100) / 100,
                    totalPaidOut: admin.firestore.FieldValue.increment(payoutAmount),
                    lastPayoutAt: now,
                    updatedAt: now,
                },
                { merge: true }
            );
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        const status = error?.status || 500;
        const message = status === 500 ? 'Failed to record payout.' : (error?.message || 'Failed to record payout.');
        console.error('adminRecordReferralPayout error', { callerUid, targetUserId, payoutAmount, error: error?.message || String(error) });
        return res.status(status).json({ success: false, error: message });
    }
});

exports.sendEmailVerification = onRequest(async (req, res) => {
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
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                body = {};
            }
        }
        const safeBody = (body && typeof body === 'object') ? body : {};

        const userRecord = await admin.auth().getUser(decoded.uid);
        const email = userRecord.email;
        if (!email) {
            return res.status(400).json({ success: false, error: 'User has no email address.' });
        }

        if (userRecord.emailVerified) {
            return res.status(200).json({ success: true, alreadyVerified: true });
        }

        const publicBrandHost = process.env.PUBLIC_BRAND_HOST || process.env.PUBLIC_APP_URL || 'https://busmo.web.app';

        const rawContinue = typeof safeBody.continueUrl === 'string' ? safeBody.continueUrl : '';
        const continuePath = rawContinue.startsWith('/') ? rawContinue : '/owner/home';
        const actionCodeSettings = {
            url: `${publicBrandHost}/finish-email-verification?continue=${encodeURIComponent(continuePath)}`,
            handleCodeInApp: true,
        };

        const firebaseVerificationUrl = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

        // Build a branded in-app link that applies the action code on our site.
        // This avoids the default Firebase action-handler UI and fixes bad redirects.
        let verificationUrl = firebaseVerificationUrl;
        try {
            const urlObj = new URL(firebaseVerificationUrl);
            const mode = urlObj.searchParams.get('mode') || 'verifyEmail';
            const oobCode = urlObj.searchParams.get('oobCode');
            const lang = urlObj.searchParams.get('lang');

            if (oobCode) {
                const branded = new URL(`${publicBrandHost}/finish-email-verification`);
                branded.searchParams.set('mode', mode);
                branded.searchParams.set('oobCode', oobCode);
                branded.searchParams.set('continue', continuePath);
                if (lang) branded.searchParams.set('lang', lang);
                verificationUrl = branded.toString();
            }
        } catch (e) {
            // Fall back to the Firebase-generated link.
            verificationUrl = firebaseVerificationUrl;
        }

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

exports.sendPasswordReset = onRequest(async (req, res) => {
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
    const email = String(safeBody.email || '').trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ success: false, error: 'Missing email.' });
    }

    try {
        const publicBrandHost = process.env.PUBLIC_BRAND_HOST || process.env.PUBLIC_APP_URL || 'https://busmo.web.app';
        const actionCodeSettings = {
            url: `${publicBrandHost}/login/form`,
            handleCodeInApp: false,
        };

        const resetUrl = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

        await sendTransactionalEmail({
            to: email,
            templateId: 'password_reset',
            data: {
                userName: 'there',
                resetUrl,
            },
        });

        // Avoid leaking whether an email exists.
        return res.status(200).json({ success: true });
    } catch (error) {
        // Avoid leaking whether an email exists.
        if (error?.code === 'auth/user-not-found') {
            return res.status(200).json({ success: true });
        }

        console.error('sendPasswordReset error:', error);
        return res.status(500).json({ success: false, error: error?.message || 'Failed to send password reset email.' });
    }
});

exports.sendAdminSignInLink = onRequest({ cors: true }, async (req, res) => {
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
    const email = String(safeBody.email || '').trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ success: false, error: 'Missing email.' });
    }

    try {
        const publicBrandHost = process.env.PUBLIC_BRAND_HOST || process.env.PUBLIC_APP_URL || 'https://busmo.web.app';
        const actionCodeSettings = {
            url: `${publicBrandHost}/admin/finish-signin`,
            handleCodeInApp: true,
        };

        const signInUrl = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

        let userName = 'there';
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            userName = userRecord?.displayName || userName;
        } catch {
            // ignore
        }

        await sendTransactionalEmail({
            to: email,
            templateId: 'admin_signin_link',
            data: {
                userName,
                signInUrl,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('sendAdminSignInLink error:', error);
        return res.status(500).json({ success: false, error: error?.message || 'Failed to send login link.' });
    }
});
