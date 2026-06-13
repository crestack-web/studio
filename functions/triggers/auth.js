
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { sendTransactionalEmail } = require("../email/service");

const db = admin.firestore();

function generateReferralCode(length = 8) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < length; i += 1) {
        out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return out;
}

async function ensureReferralCodeForUser(uid) {
    if (!uid) return null;

    const userRef = db.collection('users').doc(uid);
    const statsRef = userRef.collection('referralStats').doc('summary');

    // Prefer an existing code if present and correctly mapped.
    const existingUserSnap = await userRef.get().catch(() => null);
    const existingCode = existingUserSnap?.exists ? existingUserSnap.data()?.referralCode : null;

    if (typeof existingCode === 'string' && existingCode.trim()) {
        const normalized = existingCode.trim().toUpperCase();
        const codeRef = db.collection('referralCodes').doc(normalized);
        const codeSnap = await codeRef.get().catch(() => null);

        if (codeSnap?.exists && codeSnap.data()?.uid === uid) {
            await statsRef.set(
                {
                    balance: 0,
                    totalCommission: 0,
                    totalPaidOut: 0,
                    paidReferralsCount: 0,
                    totalReferralsCount: 0,
                    currentRate: 0.3,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
            return normalized;
        }

        if (!codeSnap?.exists) {
            await db.runTransaction(async (tx) => {
                const freshCodeSnap = await tx.get(codeRef);
                if (!freshCodeSnap.exists) {
                    tx.set(codeRef, { uid, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
                    tx.set(userRef, { referralCode: normalized }, { merge: true });
                }
                tx.set(
                    statsRef,
                    {
                        balance: 0,
                        totalCommission: 0,
                        totalPaidOut: 0,
                        paidReferralsCount: 0,
                        totalReferralsCount: 0,
                        currentRate: 0.3,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true }
                );
            });
            return normalized;
        }
        // If the code is taken by someone else, fall through to generate a new one.
    }

    // Generate a unique code and atomically claim it.
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const code = generateReferralCode(8);
        try {
            const claimed = await db.runTransaction(async (tx) => {
                const codeRef = db.collection('referralCodes').doc(code);
                const codeSnap = await tx.get(codeRef);
                if (codeSnap.exists) return null;

                tx.set(codeRef, { uid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
                tx.set(userRef, { referralCode: code }, { merge: true });
                    tx.set(
                        statsRef,
                        {
                            balance: 0,
                            totalCommission: 0,
                            totalPaidOut: 0,
                            paidReferralsCount: 0,
                            totalReferralsCount: 0,
                            currentRate: 0.3,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    );
                return code;
            });

            if (claimed) return claimed;
        } catch (err) {
            // Retry on contention.
            console.warn('ensureReferralCodeForUser transaction failed; retrying', err?.message || String(err));
        }
    }

    return null;
}

/**
 * Triggered when a new user is created.
 * Sends a welcome email to Owners, but not to Staff.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;

    try {
        await ensureReferralCodeForUser(uid);
    } catch (error) {
        console.error('Failed to ensure referral code for new user', { uid, error: error?.message || String(error) });
    }

    if (!email) {
        console.log("User does not have an email, skipping welcome email.");
        return null;
    }

    try {
        // Check the user's role in Firestore to avoid sending generic welcomes to staff
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        // Do not send a generic welcome email if the user is a Staff member.
        // They get a specific "Welcome to [Business]" toast on the frontend,
        // and the generic email without a login link was confusing.
        if (userDoc.exists && userDoc.data().role === 'Staff') {
            console.log(`User ${email} is Staff, skipping generic welcome email.`);
            return null;
        }
        
        // For Owners and other roles, send the welcome email as intended.
        await sendTransactionalEmail({
            to: email,
            templateId: 'welcome',
            data: {
                userName: displayName || 'there',
            },
        });
        console.log(`Welcome email sent to ${email}`);

    } catch (error) {
        console.error(`Failed to process onUserCreate for ${email}`, error);
    }
    return null;
});
