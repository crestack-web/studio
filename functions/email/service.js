

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
let sgMail;
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

// Read SendGrid config from both process.env and Firebase functions config
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || (functions.config().sendgrid && functions.config().sendgrid.apikey);
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || (functions.config().sendgrid && functions.config().sendgrid.from_email);
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || (functions.config().sendgrid && functions.config().sendgrid.from_name);

function getDb() {
    return admin.firestore();
}

// --- Email Provider Configuration ---
// Preferred: SendGrid API
//   SENDGRID_API_KEY=...
//   SENDGRID_FROM_EMAIL=verified-sender@yourdomain.com
// Optional:
//   SENDGRID_FROM_NAME=Busmo
// Fallback: SMTP (e.g. SendGrid SMTP)
//   EMAIL_HOST=smtp.sendgrid.net
//   EMAIL_PORT=587
//   EMAIL_USER=apikey
//   EMAIL_PASS=YOUR_SENDGRID_API_KEY

const requiredSmtpEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const missingSmtpEnvVars = requiredSmtpEnvVars.filter(v => !process.env[v]);
const publicBrandHost = process.env.PUBLIC_BRAND_HOST || 'https://busmo.web.app';

const hasSendGridApi = !!SENDGRID_API_KEY;
const hasSmtp = missingSmtpEnvVars.length === 0;

let provider = null;
if (hasSendGridApi) {
    try {
        // Lazy require so local dev doesn't crash if dep isn't installed yet.
        sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(SENDGRID_API_KEY);
        provider = {
            type: 'sendgrid',
            send: async (msg) => sgMail.send(msg),
        };
    } catch (e) {
        console.warn('SendGrid API is configured but @sendgrid/mail is not available:', e?.message || e);
    }
}

let transporter;
if (!provider && hasSmtp) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    provider = {
        type: 'smtp',
        send: async (msg) => transporter.sendMail(msg),
    };
}

if (!provider) {
    const notes = [];
    if (!hasSendGridApi) notes.push('SENDGRID_API_KEY');
    if (!hasSmtp) notes.push(...missingSmtpEnvVars);
    console.warn('Email service is not configured. Missing environment variables:', Array.from(new Set(notes)).join(', '));
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
                otp_login: {
                        subject: "Your Busmo one-time login code",
                        htmlBody: `<!DOCTYPE html>
<html lang=\"en\" style=\"background:#f3f4f6;\">
<head>
    <meta charset=\"UTF-8\">
    <title>Busmo OTP Login</title>
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
    <style>
        @media only screen and (max-width:600px) {
            .container { width:100% !important; }
            .main { padding:16px !important; }
            .cta-btn { width:100% !important; padding:16px 0 !important; }
            .footer-links { display:block !important; text-align:center !important; }
        }
        .cta-btn:hover { background:#059669 !important; }
    </style>
</head>
<body style=\"margin:0;padding:0;background:#f3f4f6;\">
    <table width=\"100%\" bgcolor=\"#f3f4f6\" cellpadding=\"0\" cellspacing=\"0\">
        <tr>
            <td align=\"center\">
                <table class=\"container\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(99,102,241,0.08);margin:32px auto;\">
                    <tr>
                        <td align=\"center\" style=\"padding:32px 0 16px 0;background:#fff;border-bottom:1px solid #f3f4f6;\">
                            <img src=\"https://busmo.io/logo.png\" alt=\"Busmo App Logo\" width=\"48\" height=\"48\" style=\"display:block;margin:auto;\">
                        </td>
                    </tr>
                    <tr>
                        <td align=\"center\" style=\"padding:32px;\">
                            <h1 style=\"font-family:'Segoe UI',Arial,sans-serif;font-size:2rem;font-weight:700;color:#3b82f6;margin:0;\">One-Time Login Code</h1>
                            <p style=\"font-family:'Segoe UI',Arial,sans-serif;font-size:1.1rem;color:#374151;margin:24px 0 0 0;\">Use this code to sign in securely:</p>
                            <div style=\"font-size:2.2rem;color:#10b981;font-weight:700;margin:24px 0;\">{{otp}}</div>
                            <div style=\"background:#f9fafb;border-radius:10px;padding:24px 20px;margin:32px 0;\">
                                <div style=\"font-size:1.1rem;color:#6366f1;font-weight:600;margin-bottom:8px;\">🔒 For your security</div>
                                <div style=\"font-family:'Segoe UI',Arial,sans-serif;font-size:1rem;color:#374151;\">This code is valid for one-time use and expires in 10 minutes.</div>
                            </div>
                            <div align=\"center\" style=\"margin:32px 0;\">
                                <a href=\"https://busmo.io/login\" class=\"cta-btn\" style=\"display:inline-block;background:#10b981;color:#fff;font-family:'Segoe UI',Arial,sans-serif;font-size:1.2rem;font-weight:700;border-radius:8px;padding:16px 48px;text-decoration:none;transition:background 0.2s;\">Sign In Now</a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align=\"center\" style=\"background:#f3f4f6;padding:32px;\">
                            <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">
                                <tr>
                                    <td align=\"center\" style=\"padding-bottom:16px;\">
                                        <a href=\"https://twitter.com/busmohq\" style=\"margin:0 8px;\"><img src=\"https://busmo.io/twitter-icon.png\" alt=\"Twitter\" width=\"24\" height=\"24\"></a>
                                        <a href=\"https://facebook.com/busmohq\" style=\"margin:0 8px;\"><img src=\"https://busmo.io/facebook-icon.png\" alt=\"Facebook\" width=\"24\" height=\"24\"></a>
                                        <a href=\"https://instagram.com/busmohq\" style=\"margin:0 8px;\"><img src=\"https://busmo.io/instagram-icon.png\" alt=\"Instagram\" width=\"24\" height=\"24\"></a>
                                        <a href=\"https://linkedin.com/company/busmo\" style=\"margin:0 8px;\"><img src=\"https://busmo.io/linkedin-icon.png\" alt=\"LinkedIn\" width=\"24\" height=\"24\"></a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align=\"center\" style=\"font-family:'Segoe UI',Arial,sans-serif;font-size:0.9rem;color:#6b7280;padding-top:8px;\">© 2026 Busmo</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
                        preheader: "Your one-time login code for Busmo.",
                },
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

            password_reset: {
                subject: "Reset your Busmo password",
                htmlBody: `
                    <h1>Reset your password</h1>
                    <p>Hi {{userName}},</p>
                    <p>We received a request to reset your password.</p>
                    <p><a href="{{resetUrl}}" target="_blank" rel="noopener noreferrer">Reset Password</a></p>
                    <p>If you didn’t request this, you can ignore this email.</p>
                `,
                preheader: "Use the link to reset your password.",
            },

            admin_signin_link: {
                subject: "Your Busmo Admin login link",
                htmlBody: `
                    <h1>Admin login</h1>
                    <p>Hi {{userName}},</p>
                    <p>Use the link below to sign in to your Busmo Admin dashboard.</p>
                    <p><a href="{{signInUrl}}" target="_blank" rel="noopener noreferrer">Sign in to Admin</a></p>
                    <p>If you didn’t request this, you can ignore this email.</p>
                `,
                preheader: "Use this link to sign in to Admin.",
            },

            staff_signin_link: {
                subject: "Your Busmo Staff login link",
                htmlBody: `
                    <h1>Staff login</h1>
                    <p>Hi {{userName}},</p>
                    {{#if businessName}}
                        <p>You’ve been invited to join <strong>{{businessName}}</strong> as staff on Busmo.</p>
                    {{/if}}
                    <p>Use the link below to sign in to your Staff dashboard.</p>
                    <p><a href="{{signInUrl}}" target="_blank" rel="noopener noreferrer">Sign in as Staff</a></p>
                    <p>If you didn’t request this, you can ignore this email.</p>
                `,
                preheader: "Use this link to sign in as staff.",
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
    if (!provider) {
        const errorMsg = `Email service is not configured. Set SENDGRID_API_KEY (recommended) or SMTP env vars (${requiredSmtpEnvVars.join(', ')}).`;
        console.error(errorMsg);
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
        const fromEmail = SENDGRID_FROM_EMAIL || branding.senderEmail;
        const fromName = SENDGRID_FROM_NAME || branding.senderName;

        let sendResult;
        try {
            if (provider.type === 'sendgrid') {
                sendResult = await provider.send({
                    to,
                    from: { email: fromEmail, name: fromName },
                    subject,
                    html: finalHtml,
                });
            } else {
                sendResult = await provider.send({
                    from: `"${fromName}" <${fromEmail}>`,
                    to,
                    subject,
                    html: finalHtml,
                });
            }
        } catch (sendError) {
            console.error('Detailed email send error:', sendError && sendError.response && sendError.response.body ? sendError.response.body : sendError);
            throw sendError;
        }

        // 5. Log success
        await logRef.set({
            to,
            templateId,
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            sendResult: sendResult || null,
        });

    } catch (error) {
        console.error(`Error sending email to ${to} with template ${templateId}:`, error && error.response && error.response.body ? error.response.body : error);
        // Log failure
        await logRef.set({
            to,
            templateId,
            status: 'failed',
            error: (error && error.response && error.response.body) ? JSON.stringify(error.response.body) : error.message,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Re-throw to let the calling function know it failed
        throw error;
    }
}

module.exports = { sendTransactionalEmail };

    