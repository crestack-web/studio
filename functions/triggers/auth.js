
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { sendTransactionalEmail } = require("../email/service");

/**
 * Triggered when a new user is created.
 * Sends a welcome email.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { email, displayName } = user;

    if (!email) {
        console.log("User does not have an email, skipping welcome email.");
        return null;
    }

    try {
        await sendTransactionalEmail({
            to: email,
            templateId: 'welcome',
            data: {
                userName: displayName || 'there',
            },
        });
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send welcome email to ${email}`, error);
    }
    return null;
});

    