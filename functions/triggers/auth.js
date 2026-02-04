
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { sendTransactionalEmail } = require("../email/service");

const db = admin.firestore();

/**
 * Triggered when a new user is created.
 * Sends a welcome email to Owners, but not to Staff.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;

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
