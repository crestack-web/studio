/**
 * Transactional email service.
 *
 * Provider order:
 *   1. Brevo  (BREVO_API_KEY)   — preferred
 *   2. Resend (RESEND_API_KEY)  — fallback
 *
 * Historically named brevo-service for import compatibility.
 *
 * Optional env:
 *   BREVO_FROM_EMAIL / BREVO_FROM_NAME
 *   EMAIL_FROM  (default: "Busmo <support@busmo.io>")
 *   RESEND_FROM
 */

import { BUSMO_LOGO } from './email-constants';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_FROM_EMAIL = (process.env.BREVO_FROM_EMAIL || '').trim();
const BREVO_FROM_NAME = (process.env.BREVO_FROM_NAME || '').trim();
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_API_URL = 'https://api.resend.com/emails';

type Sender = { name: string; email: string };

function parseAddress(raw?: string): Sender | null {
  if (!raw) return null;
  const value = raw.trim();
  const match = value.match(/^(.*)<([^>]+)>\s*$/);
  if (match) {
    const email = match[2].trim();
    if (!email) return null;
    return { name: match[1].trim().replace(/^"|"$/g, '') || 'Busmo', email };
  }
  if (value.includes('@')) return { name: 'Busmo', email: value };
  return null;
}

const DEFAULT_SENDER: Sender = BREVO_FROM_EMAIL
  ? { email: BREVO_FROM_EMAIL.trim(), name: (BREVO_FROM_NAME || 'Busmo').trim() }
  : parseAddress(process.env.EMAIL_FROM) ||
    parseAddress(process.env.RESEND_FROM) || {
      name: 'Busmo',
      email: 'support@busmo.io',
    };

export const EMAIL_PROVIDER: 'brevo' | 'resend' | null = BREVO_API_KEY
  ? 'brevo'
  : RESEND_API_KEY
    ? 'resend'
    : null;

export function isEmailConfigured(): boolean {
  return EMAIL_PROVIDER !== null;
}

if (!EMAIL_PROVIDER && typeof window === 'undefined') {
  console.warn(
    '[email] No email provider configured. Set BREVO_API_KEY or RESEND_API_KEY. Transactional emails will fail until one is configured.'
  );
}


// ── Types (kept stable for all template modules) ──────────────

export interface EmailCampaign {
  name: string;
  subject: string;
  sender: { name: string; email: string };
  htmlContent: string;
  recipients: { listIds?: number[] };
  scheduledAt?: string;
}

export interface TransactionalEmail {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { name: string; email: string };
  params?: Record<string, any>;
}

export interface Contact {
  email: string;
  attributes?: Record<string, any>;
  listIds?: number[];
}

export interface ContactList {
  name: string;
  folderId?: number;
}

function resolveSender(sender?: { name: string; email: string }): Sender {
  if (sender?.email) {
    return { email: sender.email, name: sender.name || 'Busmo' };
  }
  return DEFAULT_SENDER;
}

function formatFrom(sender?: { name: string; email: string }): string {
  const resolved = resolveSender(sender);
  return `${resolved.name} <${resolved.email}>`;
}

// ── Core send (Brevo → Resend fallback) ──────────────────────

async function sendViaBrevo(
  email: TransactionalEmail,
  to: { email: string; name?: string }[]
): Promise<{ id: string }> {
  const sender = resolveSender(email.sender);
  const body: Record<string, unknown> = {
    sender,
    to: to.map((recipient) =>
      recipient.name
        ? { email: recipient.email, name: recipient.name }
        : { email: recipient.email }
    ),
    subject: email.subject,
    htmlContent: email.htmlContent,
  };

  if (email.params?.replyTo) {
    body.replyTo = { email: String(email.params.replyTo) };
  }

  const toLabel = to.map((r) => r.email).join(', ');
  console.log('[email] Sending via Brevo →', toLabel, '| from:', formatFrom(email.sender));

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (data as any)?.message ||
      (data as any)?.error ||
      res.statusText ||
      'Unknown Brevo error';
    console.error('[email] Brevo error:', res.status, JSON.stringify(data));
    throw new Error(`Failed to send email via Brevo: ${msg}`);
  }

  const id = (data as any)?.messageId || '';
  if (!id) {
    console.error('[email] Brevo 2xx but missing messageId', data);
    throw new Error('Brevo accepted the request but returned no message id');
  }

  console.log('[email] Sent via Brevo:', id, '→', toLabel);
  return { id };
}

async function sendViaResend(
  email: TransactionalEmail,
  to: { email: string; name?: string }[]
): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    from: formatFrom(email.sender),
    to: to.map((r) => r.email),
    subject: email.subject,
    html: email.htmlContent,
  };

  // Optional reply-to from params
  if (email.params?.replyTo) {
    body.reply_to = email.params.replyTo;
  }

  const toLabel = to.map((r) => r.email).join(', ');
  console.log('[email] Sending via Resend →', toLabel, '| from:', body.from);

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (data as any)?.message ||
      (typeof (data as any)?.error === 'string'
        ? (data as any).error
        : (data as any)?.error?.message) ||
      res.statusText ||
      'Unknown Resend error';
    console.error('[email] Resend error:', res.status, JSON.stringify(data));
    throw new Error(`Failed to send email via Resend: ${msg}`);
  }

  const id = (data as any)?.id || '';
  if (!id) {
    console.error('[email] Resend 2xx but missing id', data);
    throw new Error('Resend accepted the request but returned no message id');
  }

  console.log('[email] Sent via Resend:', id, '→', to.map((r) => r.email).join(', '));
  return { id };
}

/**
 * Send a transactional email.
 * Uses Brevo when BREVO_API_KEY is set, otherwise Resend.
 * Used by every template in src/services/email/* and API routes.
 */
export async function sendTransactionalEmail(
  email: TransactionalEmail
): Promise<{ id: string }> {
  if (!EMAIL_PROVIDER) {
    throw new Error(
      'Email is not configured. Set BREVO_API_KEY or RESEND_API_KEY in the environment.'
    );
  }

  if (!email.to?.length) {
    throw new Error('sendTransactionalEmail: at least one recipient is required');
  }

  const to = email.to
    .filter((recipient) => Boolean(recipient?.email))
    .map((recipient) => ({
      email: String(recipient.email).trim(),
      name: recipient.name,
    }));
  if (!to.length) {
    throw new Error('sendTransactionalEmail: recipient email addresses are required');
  }

  return EMAIL_PROVIDER === 'brevo'
    ? sendViaBrevo(email, to)
    : sendViaResend(email, to);
}

// ── Campaign / contact stubs (not used for transactional sends) ─

export async function createCampaign(_campaign: EmailCampaign): Promise<any> {
  throw new Error(
    'Email campaigns are not supported in this service. Use your email provider dashboard or a marketing tool.'
  );
}

export async function sendCampaign(_campaignId: number): Promise<any> {
  throw new Error(
    'Email campaigns are not supported in this service. Use your email provider dashboard or a marketing tool.'
  );
}

export async function scheduleCampaign(
  _campaignId: number,
  _scheduledAt: string
): Promise<any> {
  throw new Error(
    'Email campaigns are not supported in this service. Use your email provider dashboard or a marketing tool.'
  );
}

export async function addContact(contact: Contact): Promise<any> {
  // No-op friendly: contacts are not required for transactional sends
  console.warn('[email] addContact is a no-op for transactional sends', contact.email);
  return { ok: true, email: contact.email };
}

export async function createContactList(list: ContactList): Promise<any> {
  console.warn('[email] createContactList is a no-op for transactional sends', list.name);
  return { ok: true, name: list.name };
}

// ── Convenience templates (same signatures as before) ─────────

export async function sendWelcomeEmail(
  email: string,
  name: string,
  businessName?: string
): Promise<any> {
  const htmlContent = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:Segoe UI,sans-serif;background:#f4f4f4;margin:0;padding:24px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px;text-align:center;color:#fff">
          <img src="${BUSMO_LOGO}" alt="Busmo" width="56" height="56" style="border-radius:12px;margin-bottom:16px;" />
          <h1 style="margin:0">Welcome to Busmo!</h1>
        </div>
        <div style="padding:32px">
          <p>Hi ${name},</p>
          <p>Welcome to Busmo! We're excited to have you on board${
            businessName ? ` and help you grow ${businessName}` : ''
          }.</p>
          <p><a href="https://www.busmo.io/login" style="display:inline-block;padding:12px 28px;background:#667eea;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Go to Dashboard</a></p>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
      </div>
    </body></html>`;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: 'Welcome to Busmo!',
    htmlContent,
  });
}

export async function sendStaffInvitationEmail(
  email: string,
  staffName: string,
  businessName: string,
  tempPassword: string
): Promise<any> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.busmo.io';
  const loginUrl = `${appUrl.replace(/\/$/, '')}/login/staff`;

  const htmlContent = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;padding:24px;background:#f4f4f4">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px;text-align:center;color:#fff">
          <img src="${BUSMO_LOGO}" alt="Busmo" width="56" height="56" style="border-radius:12px;margin-bottom:16px;" />
          <h1 style="margin:0;font-size:22px">You're invited to join ${businessName}</h1>
        </div>
        <div style="padding:32px;color:#333;line-height:1.55">
          <p>Hi ${staffName},</p>
          <p>You've been invited to join <strong>${businessName}</strong> on Busmo as a team member.</p>
          <p style="margin-bottom:8px"><strong>Login email</strong></p>
          <p style="margin-top:0;font-family:monospace;background:#f8f7ff;padding:10px 14px;border-radius:8px">${email}</p>
          <p style="margin-bottom:8px"><strong>Temporary password</strong></p>
          <p style="margin-top:0;font-size:18px;font-weight:bold;letter-spacing:0.04em;border:2px dashed #667eea;padding:12px 16px;display:inline-block;border-radius:8px;background:#faf9ff">${tempPassword}</p>
          <p style="font-size:14px;color:#555">Sign in with this password, then you'll be asked to set your own password.</p>
          <p style="margin:28px 0">
            <a href="${loginUrl}" style="display:inline-block;padding:12px 28px;background:#667eea;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open staff login</a>
          </p>
          <p style="font-size:13px;color:#888">If the button doesn't work, go to:<br/><a href="${loginUrl}">${loginUrl}</a></p>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
      </div>
    </body></html>`;

  return sendTransactionalEmail({
    to: [{ email, name: staffName }],
    subject: `You're invited to join ${businessName} on Busmo`,
    htmlContent,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
): Promise<any> {
  const htmlContent = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;padding:24px;background:#f4f4f4">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px;text-align:center;color:#fff">
          <img src="${BUSMO_LOGO}" alt="Busmo" width="56" height="56" style="border-radius:12px;margin-bottom:16px;" />
          <h1 style="margin:0;font-size:22px">Reset your password</h1>
        </div>
        <div style="padding:32px">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password.</p>
          <p><a href="${resetLink}" style="display:inline-block;padding:12px 28px;background:#667eea;color:#fff;text-decoration:none;border-radius:8px">Reset Password</a></p>
          <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
      </div>
    </body></html>`;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: 'Reset Your Password',
    htmlContent,
  });
}

export async function sendLowStockAlertEmail(
  email: string,
  businessName: string,
  lowStockItems: Array<{ name: string; stock: number; threshold: number }>
): Promise<any> {
  const itemsList = lowStockItems
    .map(
      (item) =>
        `<li><strong>${item.name}</strong>: ${item.stock} remaining (threshold: ${item.threshold})</li>`
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;padding:24px;background:#f4f4f4">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px;text-align:center;color:#fff">
          <img src="${BUSMO_LOGO}" alt="Busmo" width="56" height="56" style="border-radius:12px;margin-bottom:16px;" />
          <h1 style="margin:0;font-size:22px">Low Stock Alert</h1>
        </div>
        <div style="padding:32px">
          <p>The following items in <strong>${businessName}</strong> are running low:</p>
          <ul>${itemsList}</ul>
          <p><a href="https://www.busmo.io/owner">Manage Inventory</a></p>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
      </div>
    </body></html>`;

  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Low Stock Alert - ${businessName}`,
    htmlContent,
  });
}


/**
 * Staff → owner stock alert (same Resend path as invitations / low-stock).
 */
export async function sendStaffStockAlertEmail(params: {
  ownerEmail: string;
  ownerName?: string;
  businessName: string;
  staffName: string;
  staffEmail?: string;
  staffRole?: string;
  products: Array<{ name: string; stock: number; threshold?: number; status?: string }>;
  note?: string;
}): Promise<{ id: string }> {
  const {
    ownerEmail,
    ownerName,
    businessName,
    staffName,
    staffEmail,
    staffRole,
    products,
    note,
  } = params;

  const itemsList = products
    .map((item) => {
      const status =
        item.status === 'out' || item.stock === 0
          ? 'Out of stock'
          : item.status === 'lost'
            ? 'Reported lost'
            : `Only ${item.stock} left` +
              (item.threshold != null ? ` (threshold ${item.threshold})` : '');
      return `<li style="margin:8px 0;"><strong>${item.name}</strong> — ${status}</li>`;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="font-family:Arial,Helvetica,sans-serif;padding:24px;background:#f4f4f4;margin:0">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#6B3FE7,#8B5CF6);padding:28px;text-align:center;color:#fff">
          <img src="${BUSMO_LOGO}" alt="Busmo" width="56" height="56" style="border-radius:12px;margin-bottom:12px;background:#fff;padding:4px;" />
          <h1 style="margin:0;font-size:22px">Stock Alert from Staff</h1>
          <p style="margin:8px 0 0;opacity:0.95;font-size:14px">${businessName}</p>
        </div>
        <div style="padding:28px;color:#333;font-size:15px;line-height:1.6">
          <p>Hi ${ownerName || 'there'},</p>
          <p>
            <strong>${staffName}</strong>${staffRole ? ` (${staffRole})` : ''}${staffEmail ? ` &lt;${staffEmail}&gt;` : ''}
            reported stock that needs attention at <strong>${businessName}</strong>.
          </p>
          <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;padding:14px 16px;margin:16px 0">
            <div style="font-size:12px;font-weight:700;color:#6B3FE7;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Reported by</div>
            <div style="font-weight:600">${staffName}</div>
            ${staffEmail ? `<div style="font-size:13px;color:#6B7280">${staffEmail}</div>` : ''}
          </div>
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:14px 16px;margin:16px 0">
            <div style="font-weight:700;color:#B91C1C;margin-bottom:8px">Affected products</div>
            <ul style="padding-left:18px;margin:0">${itemsList}</ul>
          </div>
          ${
            note
              ? `<div style="background:#FFFBEB;border-left:4px solid #F59E0B;padding:12px 14px;margin:16px 0;border-radius:6px">
                   <div style="font-size:12px;font-weight:700;color:#B45309;margin-bottom:4px">Staff note</div>
                   <div>${note}</div>
                 </div>`
              : ''
          }
          <p style="margin:20px 0 8px">
            <a href="https://www.busmo.io/owner" style="display:inline-block;padding:12px 24px;background:#6B3FE7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open inventory</a>
          </p>
          <p style="color:#6B7280;font-size:13px">Best regards,<br/>The Busmo Team</p>
        </div>
      </div>
    </body></html>`;

  return sendTransactionalEmail({
    to: [{ email: ownerEmail, name: ownerName }],
    subject: `🚨 Stock alert from ${staffName} — ${businessName}`,
    htmlContent,
    params: staffEmail ? { replyTo: staffEmail } : undefined,
  });
}

export async function sendDailySalesSummaryEmail(
  email: string,
  businessName: string,
  salesData: {
    date: string;
    totalSales: number;
    totalProfit: number;
    transactionCount: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  }
): Promise<any> {
  const topProductsList = salesData.topProducts
    .map(
      (p) =>
        `<li><strong>${p.name}</strong>: ${p.quantity} sold — ${p.revenue.toLocaleString()}</li>`
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;padding:24px;background:#f4f4f4">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px;text-align:center;color:#fff">
          <img src="${BUSMO_LOGO}" alt="Busmo" width="56" height="56" style="border-radius:12px;margin-bottom:16px;" />
          <h1 style="margin:0;font-size:22px">Daily Sales Summary</h1>
        </div>
        <div style="padding:32px">
          <p>Summary for <strong>${businessName}</strong> on ${salesData.date}:</p>
          <ul>
            <li>Total Sales: ${salesData.totalSales.toLocaleString()}</li>
            <li>Total Profit: ${salesData.totalProfit.toLocaleString()}</li>
            <li>Transactions: ${salesData.transactionCount}</li>
          </ul>
          <h3>Top products</h3>
          <ul>${topProductsList}</ul>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
      </div>
    </body></html>`;

  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Daily Sales Summary - ${businessName}`,
    htmlContent,
  });
}

export async function sendCreditPaymentReminderEmail(
  email: string,
  customerName: string,
  businessName: string,
  amount: number,
  dueDate: string
): Promise<any> {
  const htmlContent = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;padding:24px;background:#f4f4f4">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px;text-align:center;color:#fff">
          <img src="${BUSMO_LOGO}" alt="Busmo" width="56" height="56" style="border-radius:12px;margin-bottom:16px;" />
          <h1 style="margin:0;font-size:22px">Payment Reminder</h1>
        </div>
        <div style="padding:32px">
          <p>Dear ${customerName},</p>
          <p>Friendly reminder from <strong>${businessName}</strong> of a pending payment.</p>
          <p style="font-size:24px;font-weight:bold">${amount.toLocaleString()}</p>
          <p>Due: ${dueDate}</p>
          <p>Best regards,<br>${businessName}</p>
        </div>
      </div>
    </body></html>`;

  return sendTransactionalEmail({
    to: [{ email, name: customerName }],
    subject: `Payment Reminder - ${businessName}`,
    htmlContent,
  });
}

export const BrevoService = {
  createCampaign,
  sendCampaign,
  scheduleCampaign,
  sendTransactionalEmail,
  sendWelcomeEmail,
  sendStaffInvitationEmail,
  sendPasswordResetEmail,
  sendLowStockAlertEmail,
  sendDailySalesSummaryEmail,
  sendCreditPaymentReminderEmail,
  addContact,
  createContactList,
};

export default BrevoService;
