
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

function getDb() {
    return admin.firestore();
}

// --- Email Provider Configuration ---
// IMPORTANT: Set these in your Firebase environment variables
// For example, using SendGrid:
// EMAIL_HOST=smtp.sendgrid.net
// EMAIL_PORT=587
// EMAIL_USER=apikey
// EMAIL_PASS=YOUR_SENDGRID_API_KEY

const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
const publicBrandHost = process.env.PUBLIC_BRAND_HOST || 'https://busmo.web.app';

let transporter;
if (missingEnvVars.length === 0) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
} else {
    // This log will appear when the function instance starts up.
    console.warn(
      'Email service is not configured. Missing environment variables:', 
      missingEnvVars.join(', ')
    );
}

// --- Default Data ---
// This data is used if no branding is found in Firestore.
const defaultBranding = {
    logoUrl: `${publicBrandHost}/icon.svg`,
    brandColor: "#7953D2",
    accentColor: "#1A237E",
    footerText: `© ${new Date().getFullYear()} Busmo. All rights reserved.`,
    senderName: "Busmo",
    senderEmail: "noreply@busmo.com",
    twitterUrl: "https://x.com/busmohq",
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
    staff_invite: {
        subject: "You're invited to join {{businessName}} on Busmo",
        htmlBody: `
            <h1>Hi,</h1>
            <p>You’ve been invited to join <strong>{{businessName}}</strong> as a staff member on Busmo.</p>
            <p>To accept the invite, open the Staff Login page and request a login link using this email address.</p>
            <p><a href="{{joinUrl}}" target="_blank" rel="noopener noreferrer">Join as Staff</a></p>
            <p>If you didn’t expect this invitation, you can ignore this email.</p>
        `,
        preheader: "Join your business as staff on Busmo.",
    },
    staff_access_granted: {
        subject: "Your staff access is ready for {{businessName}}",
        htmlBody: `
            <h1>You're all set!</h1>
            <p>Your manager has assigned your staff permissions for <strong>{{businessName}}</strong>.</p>
            {{#if permissionsSummary}}
                <p><strong>Your access:</strong> {{permissionsSummary}}</p>
            {{/if}}
            <p><a href="{{dashboardUrl}}" target="_blank" rel="noopener noreferrer">Open Staff Dashboard</a></p>
        `,
        preheader: "Your staff permissions have been assigned.",
    },
        owner_daily_digest: {
                subject: "Your Busmo daily digest — {{businessName}}",
                htmlBody: `
                        <h1>Daily digest</h1>
                        <p><strong>{{businessName}}</strong> • {{dateLabel}}</p>

                        <p>
                            <strong>Cash balance:</strong> {{cashBalanceFormatted}}<br/>
                            <strong>Sales (30d):</strong> {{sales30dFormatted}}<br/>
                            <strong>Expenses (30d):</strong> {{expenses30dFormatted}}
                        </p>

                        {{#if hasRunway}}
                            <p><strong>Estimated cash runway:</strong> ~{{runwayDays}} days</p>
                        {{/if}}

                        {{#if hasHighlights}}
                            <h3>Key areas to improve</h3>
                            <ul>
                                {{#each highlights}}
                                    <li>{{this}}</li>
                                {{/each}}
                            </ul>
                        {{/if}}

                        <p><a href="{{dashboardUrl}}" target="_blank" rel="noopener noreferrer">Open your dashboard</a></p>
                `,
                preheader: "Your daily business summary and action items.",
        },
        owner_new_order: {
                subject: "New order received — {{businessName}}",
                htmlBody: `
                        <h1>New order received</h1>
                        <p><strong>{{businessName}}</strong> • {{dateLabel}}</p>

                        <p>
                            <strong>Order ID:</strong> {{orderId}}<br/>
                            <strong>Status:</strong> {{status}}<br/>
                            <strong>Customer:</strong> {{customerName}} {{#if customerPhone}}({{customerPhone}}){{/if}}<br/>
                            <strong>Items:</strong> {{itemsCount}}<br/>
                            <strong>Total:</strong> {{totalFormatted}}
                        </p>

                        {{#if itemLines}}
                            <h3>Items</h3>
                            <ul>
                                {{#each itemLines}}
                                    <li>{{this}}</li>
                                {{/each}}
                            </ul>
                            {{#if hasMoreItems}}
                                <p><em>Open the dashboard to see all items.</em></p>
                            {{/if}}
                        {{/if}}

                        <p><a href="{{ordersUrl}}" target="_blank" rel="noopener noreferrer">Open orders</a></p>
                `,
                preheader: "A customer placed an order in your store.",
        },

            email_verification: {
                subject: "Verify your email for Busmo",
                htmlBody: `
                    <h1>Verify your email</h1>
                    <p>Hi {{userName}},</p>
                    <p>Please verify your email address to continue using your Busmo dashboard.</p>
                    <p><a href="{{verificationUrl}}" target="_blank" rel="noopener noreferrer">Verify Email</a></p>
                    <p>If you didn’t request this, you can ignore this email.</p>
                `,
                preheader: "Verify your email to continue.",
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
    if (!transporter) {
        const errorMsg = `Email service is not configured due to missing environment variables: ${missingEnvVars.join(', ')}. Please set them in your Firebase Functions environment.`;
        console.error(errorMsg);
        // We throw the error so the calling function's catch block can log it with full context.
        throw new Error(errorMsg);
    }
    
    const db = getDb();
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

    