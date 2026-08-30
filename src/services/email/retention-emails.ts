/**
 * Retention & dunning emails for trial, grace extension, and subscription renewal.
 * Uses existing Brevo transactional sender.
 */
import { sendTransactionalEmail } from './brevo-service';
import { BUSMO_LOGO } from './email-constants';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busmo.io';
const SUBSCRIBE_URL = `${APP_URL}/subscribe`;

const getEmailHeader = (icon: string, title: string, subtitle: string) => `
  <div style="padding: 40px 30px; text-align: center; color: white; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); position: relative; overflow: hidden;">
    <div style="position: relative; z-index: 1;">
      <img src="${BUSMO_LOGO}" alt="Busmo Logo" style="width: 80px; height: 80px; margin-bottom: 16px; display: inline-block; border-radius: 16px; background: white; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <h1 style="margin: 16px 0 8px; font-size: 28px; font-weight: 700; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.95; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${subtitle}</p>
    </div>
  </div>
`;

const baseStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
  .content { padding: 40px 30px; background: #fff; }
  .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
  .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
`;

export interface GraceExtensionParams {
  email: string;
  name: string;
  businessName: string;
  trialEndDate: string;
  graceEndDate: string;
  daysRemainingInGrace: number;
}

/** Sent when the 3-day trial ends and the free 3-day extension starts. */
export async function sendGraceExtensionEmail(params: GraceExtensionParams): Promise<any> {
  const { email, name, businessName, trialEndDate, graceEndDate, daysRemainingInGrace } = params;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>We've extended your access — 3 free days</title>
      <style>${baseStyles}
        .alert-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: #D97706; }
        .value-box { background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🎁', '3 Extra Days — On Us', 'Your trial ended. We extended access so you can subscribe without interruption.')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your free trial for <strong>${businessName}</strong> ended on <strong>${trialEndDate}</strong>.</p>
          <p>We don't want you to lose momentum. We've given you a <strong>free 3-day extension</strong> so you can keep using the dashboard while you choose a plan.</p>

          <div class="alert-box">
            <h2>⏰ Extension ends ${graceEndDate}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">
              You have <strong>${daysRemainingInGrace} day${daysRemainingInGrace === 1 ? '' : 's'}</strong> left of full access.
              After that, the dashboard will be locked until you subscribe.
            </p>
          </div>

          <div class="value-box">
            <h3 style="margin-top: 0; color: #6B3FE7;">Why subscribe now matters</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Keep continuous access to sales, inventory, and reports</li>
              <li>Your data stays safe — but locked dashboards slow decisions</li>
              <li>Ask MO, team access, and insights stay available on a plan</li>
              <li>Avoid a gap in tracking that costs more than a month of Busmo</li>
            </ul>
          </div>

          <a href="${SUBSCRIBE_URL}" class="button">Choose a Plan & Stay Live →</a>

          <p>Questions? Reply to this email or write <a href="mailto:support@busmo.io">support@busmo.io</a>.</p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: `🎁 3 extra days free — subscribe before access locks for ${businessName}`,
    htmlContent,
  });
}

export interface GraceReminderParams {
  email: string;
  name: string;
  businessName: string;
  graceEndDate: string;
  daysRemaining: number;
}

/** Daily-style reminders during the 3-day grace (extension) window. */
export async function sendGraceReminderEmail(params: GraceReminderParams): Promise<any> {
  const { email, name, businessName, graceEndDate, daysRemaining } = params;

  const urgent = daysRemaining <= 1;
  const subject = urgent
    ? `⚠️ Last day of free access — subscribe to keep ${businessName} running`
    : `⏰ ${daysRemaining} days left of free access — don't lose your dashboard`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>${baseStyles}
        .alert-box { background: ${urgent ? '#FEE2E2' : '#FEF3C7'}; border: 2px solid ${urgent ? '#DC2626' : '#F59E0B'}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: ${urgent ? '#DC2626' : '#D97706'}; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader(urgent ? '🚨' : '⏰', urgent ? 'Last Day of Free Access' : `${daysRemaining} Days Left`, 'Subscribe to keep your dashboard unlocked')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your free extension for <strong>${businessName}</strong> ends on <strong>${graceEndDate}</strong>.</p>

          <div class="alert-box">
            <h2>${urgent ? 'Dashboard locks tomorrow' : `${daysRemaining} days until lock`}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">
              After the extension, you won't be able to open the owner dashboard until you subscribe.
              Your data stays safe — but you lose day-to-day control until payment is complete.
            </p>
          </div>

          <p><strong>Why this matters for your business:</strong></p>
          <ul style="color: #555; font-size: 14px; line-height: 1.8;">
            <li>Missed sales or stock updates compound quickly</li>
            <li>Staff and MO AI access depend on an active plan</li>
            <li>Subscribing now keeps everything continuous — no scramble later</li>
          </ul>

          <a href="${SUBSCRIBE_URL}" class="button">Subscribe Now →</a>

          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject,
    htmlContent,
  });
}

export interface RenewalDueParams {
  email: string;
  name: string;
  businessName: string;
  planName: string;
  amount: number;
  currency?: string;
  dueDate: string;
  daysUntilDue: number;
}

/** Pre-renewal and post-due reminders when a paid month is due and not yet paid. */
export async function sendRenewalDueReminderEmail(params: RenewalDueParams): Promise<any> {
  const {
    email,
    name,
    businessName,
    planName,
    amount,
    currency = 'NGN',
    dueDate,
    daysUntilDue,
  } = params;

  const overdue = daysUntilDue < 0;
  const amountLabel = `${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}`;

  let subject: string;
  let headline: string;
  if (overdue) {
    subject = `⚠️ Payment overdue — keep ${businessName} on ${planName}`;
    headline = 'Payment Overdue';
  } else if (daysUntilDue === 0) {
    subject = `📅 Renewal due today — ${planName} for ${businessName}`;
    headline = 'Renewal Due Today';
  } else {
    subject = `📅 Renewal in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} — ${planName}`;
    headline = `Renewal in ${daysUntilDue} Days`;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>${baseStyles}
        .alert-box { background: ${overdue ? '#FEE2E2' : '#FEF3C7'}; border: 2px solid ${overdue ? '#DC2626' : '#F59E0B'}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: ${overdue ? '#DC2626' : '#D97706'}; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader(overdue ? '⚠️' : '📅', headline, 'Your Busmo subscription needs attention')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>
            ${overdue
              ? `We haven't received payment for <strong>${businessName}</strong>'s <strong>${planName}</strong> plan. Your billing date was <strong>${dueDate}</strong>.`
              : `Your <strong>${planName}</strong> plan for <strong>${businessName}</strong> renews on <strong>${dueDate}</strong>.`}
          </p>

          <div class="alert-box">
            <h2>${overdue ? 'Action needed to avoid interruption' : 'Upcoming renewal'}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">
              ${overdue
                ? 'Without payment, access to the dashboard and team tools can be restricted. Paying now protects continuous operations.'
                : 'Confirm your payment method is ready so renewal goes through smoothly and nothing stops mid-month.'}
            </p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Plan</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount</span>
              <span class="detail-value">${amountLabel}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${overdue ? 'Was due' : 'Due date'}</span>
              <span class="detail-value">${dueDate}</span>
            </div>
          </div>

          <p><strong>Why staying subscribed matters:</strong></p>
          <ul style="color: #555; font-size: 14px; line-height: 1.8;">
            <li>Uninterrupted sales, stock, and cashflow tracking</li>
            <li>Team and MO AI stay available for daily decisions</li>
            <li>Avoid gaps that are harder (and costlier) to reconstruct later</li>
          </ul>

          <a href="${SUBSCRIBE_URL}" class="button">${overdue ? 'Pay Now & Keep Access →' : 'Review Billing / Pay →'}</a>

          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject,
    htmlContent,
  });
}
