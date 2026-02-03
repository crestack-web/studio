
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const db = admin.firestore();

// --- Email Provider Configuration ---
// IMPORTANT: Set these in your Firebase environment variables
// For example, using SendGrid:
// EMAIL_HOST=smtp.sendgrid.net
// EMAIL_PORT=587
// EMAIL_USER=apikey
// EMAIL_PASS=YOUR_SENDGRID_API_KEY

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- Default Data ---
// This data is used if no branding is found in Firestore.
const defaultBranding = {
    logoUrl: "https://storage.googleapis.com/bizassistant2-62305643-adad7.appspot.com/busmo_logo.png",
    brandColor: "#7953D2",
    accentColor: "#1A237E",
    footerText: `© ${new Date().getFullYear()} Busmo. All rights reserved.`,
    senderName: "Busmo",
    senderEmail: "noreply@busmo.com",
    twitterUrl: "https://x.com/busmo_io",
    instagramUrl: "https://instagram.com/busmo.io",
    facebookUrl: "https://facebook.com/busmo.io",
};

const defaultTemplates = {
    welcome: {
        subject: "Welcome to Busmo!",
        htmlBody: `
            <h1>Hi {{userName}},</h1>
            <p>Welcome aboard! We're thrilled to have you join the Busmo community. We're here to help you gain clarity and grow your business.</p>
            <p>To get started, we recommend adding your first product or recording a sale.</p>
        `,
        preheader: "We're thrilled to have you join us.",
    },
};

// --- Core Service ---

const mainTemplateHtml = fs.readFileSync(path.join(__dirname, 'templates/base.html'), 'utf8');
const mainTemplate = handlebars.compile(mainTemplateHtml, { strict: true });

/**
 * Composes and sends a transactional email.
 * @param {Object} params
 * @param {string} params.to The recipient's email address.
 * @param {string} params.templateId The ID of the template to use (e.g., 'welcome').
 * @param {Object} params.data The dynamic data to inject into the template.
 */
async function sendTransactionalEmail({ to, templateId, data }) {
    const logRef = db.collection('emailLogs').doc();
    
    try {
        // 1. Fetch Branding and Template from Firestore
        const brandingDoc = await db.collection('settings').doc('emailBranding').get();
        const branding = brandingDoc.exists ? brandingDoc.data() : defaultBranding;

        const templateDoc = await db.collection('emailTemplates').doc(templateId).get();
        let templateData = templateDoc.exists ? templateDoc.data() : defaultTemplates[templateId];

        if (!templateData) {
            throw new Error(`Template with ID "${templateId}" not found.`);
        }
        
        // 2. Compile templates with data
        const subjectTemplate = handlebars.compile(templateData.subject);
        const bodyTemplate = handlebars.compile(templateData.htmlBody);

        const subject = subjectTemplate(data);
        const htmlBody = bodyTemplate(data);
        
        // 3. Combine with main branded template
        const finalHtml = mainTemplate({
            ...branding,
            preheader: templateData.preheader,
            content: htmlBody,
        });

        // 4. Send email
        const mailOptions = {
            from: `"${branding.senderName}" <${branding.senderEmail}>`,
            to,
            subject,
            html: finalHtml,
            // TODO: Add plain text version
        };

        await transporter.sendMail(mailOptions);
        
        // 5. Log success
        await logRef.set({
            to,
            templateId,
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

    } catch (error) {
        console.error(`Error sending email to ${to} with template ${templateId}:`, error);
        // Log failure
        await logRef.set({
            to,
            templateId,
            status: 'failed',
            error: error.message,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Re-throw to let the calling function know it failed
        throw error;
    }
}

module.exports = { sendTransactionalEmail };

    