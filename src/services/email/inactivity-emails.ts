/**
 * Re-engagement: nudge owners who haven't logged in to record sales.
 */
import { sendTransactionalEmail } from './brevo-service';
import { BUSMO_LOGO, SOCIAL_FOOTER } from './email-constants';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://busmo.io';
const LOGIN_URL = `${APP_URL}/login`;
const DASHBOARD_URL = `${APP_URL}/owner/home`;

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
  .tip-box { background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px; }
`;

export interface InactivitySalesReminderParams {
  email: string;
  name: string;
  businessName: string;
  /** Whole days since last login (at least 1) */
  daysAway: number;
}

/**
 * Sent when an owner hasn't logged in for ~1+ day.
 * Nudge them to record sales so the business stays visible.
 */
export async function sendInactivitySalesReminderEmail(
  params: InactivitySalesReminderParams
): Promise<any> {
  const { email, name, businessName, daysAway } = params;
  const daysLabel = daysAway <= 1 ? 'a day' : `${daysAway} days`;

  const subject = `📝 ${businessName} — record today's sales so nothing slips through`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader(
          '📊',
          'Keep the books honest',
          `We noticed you haven't opened Busmo in ${daysLabel}`
        )}
        <div class="content">
          <p>Hi ${name},</p>
          <p>
            A quiet day on Busmo for <strong>${businessName}</strong> can mean sales happened in the shop
            but never made it into the system — and then cash, stock, and profit stop matching reality.
          </p>

          <div class="tip-box">
            <h3 style="margin-top: 0; color: #6B3FE7;">Quick win (2 minutes)</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin-bottom: 0;">
              <li>Open Busmo and <strong>record today's sales</strong></li>
              <li>Log any expenses or cash movements while they're fresh</li>
              <li>Check stock alerts so shelves don't run dry</li>
            </ul>
          </div>

          <p style="color: #555; font-size: 14px;">
            Owners who log activity daily catch shortages earlier and close the day faster.
            Even one sale recorded keeps your numbers honest.
          </p>

          <a href="${DASHBOARD_URL}" class="button">Open dashboard & record a sale →</a>

          <p style="font-size: 13px; color: #6B7280;">
            If you're not at the shop, you can still ask MO by text or log in from your phone.
            <a href="${LOGIN_URL}" style="color: #6B3FE7;">Sign in</a>
          </p>

          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
          ${SOCIAL_FOOTER}
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
