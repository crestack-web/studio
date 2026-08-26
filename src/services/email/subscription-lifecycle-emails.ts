import { sendTransactionalEmail } from './brevo-service';
import { BUSMO_LOGO, getEmailHeader as sharedGetEmailHeader } from './email-constants';

const getEmailHeader = (icon: string, title: string, subtitle: string) => `
  <div style="padding: 40px 30px; text-align: center; color: white; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); position: relative; overflow: hidden;">
    <div style="position: relative; z-index: 1;">
      <img src="${BUSMO_LOGO}" alt="Busmo Logo" style="width: 80px; height: 80px; margin-bottom: 16px; display: inline-block; border-radius: 16px; background: white; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <h1 style="margin: 16px 0 8px; font-size: 28px; font-weight: 700; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.95; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${subtitle}</p>
    </div>
  </div>
`;

export interface PaymentFailedParams {
  email: string;
  name: string;
  businessName: string;
  amount: number;
  currency?: string;
  failureReason: string;
  retryDate: string;
  retryAttempt: number;
}

export interface RetryPaymentReminderParams {
  email: string;
  name: string;
  businessName: string;
  amount: number;
  currency?: string;
  retryDate: string;
  retryAttempt: number;
  maxRetries: number;
}

export interface TrialExpiredParams {
  email: string;
  name: string;
  businessName: string;
  trialEndDate: string;
  currency?: string;
}

export interface SubscriptionRenewedParams {
  email: string;
  name: string;
  businessName: string;
  planName: string;
  amount: number;
  billingPeriod: string;
  nextBillingDate: string;
  currency?: string;
}

export interface SubscriptionCancelledParams {
  email: string;
  name: string;
  businessName: string;
  planName: string;
  cancellationDate: string;
  accessUntilDate: string;
  reason?: string;
  currency?: string;
}

export interface SubscriptionExpiredParams {
  email: string;
  name: string;
  businessName: string;
  planName: string;
  expiryDate: string;
  currency?: string;
}

export interface CardExpiringSoonParams {
  email: string;
  name: string;
  businessName: string;
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  daysUntilExpiry: number;
}

// Payment Failed Email
export async function sendPaymentFailedEmail(params: PaymentFailedParams): Promise<any> {
  const { email, name, businessName, amount, currency = 'NGN', failureReason, retryDate, retryAttempt } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>💳 Payment Failed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: #DC2626; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('💳', 'Payment Failed', 'We were unable to process your payment')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We were unable to process your payment for <strong>${businessName}</strong>.</p>
          
          <div class="alert-box">
            <h2>❌ Payment Declined</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;"><strong>Reason:</strong> ${failureReason}</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Retry Attempt:</span>
              <span class="detail-value">${retryAttempt}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Next Retry Date:</span>
              <span class="detail-value">${retryDate}</span>
            </div>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">⚠️ Action Required</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Update your payment method if needed</li>
              <li>Ensure sufficient funds are available</li>
              <li>Contact your bank if the issue persists</li>
              <li>We'll automatically retry the payment on ${retryDate}</li>
            </ul>
          </div>

          <a href="https://busmo.io/settings/billing" class="button">Update Payment Method</a>
          
          <p>If you have any questions, please contact our support team.</p>
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
    subject: `💳 Payment Failed - ${businessName}`,
    htmlContent,
  });
}

// Retry Payment Reminder Email
export async function sendRetryPaymentReminderEmail(params: RetryPaymentReminderParams): Promise<any> {
  const { email, name, businessName, amount, currency = 'NGN', retryDate, retryAttempt, maxRetries } = params;
  
  const urgency = retryAttempt >= maxRetries - 1 ? 'urgent' : retryAttempt >= maxRetries - 2 ? 'high' : 'normal';
  const bgColor = urgency === 'urgent' ? '#FEE2E2' : urgency === 'high' ? '#FEF3C7' : '#DBEAFE';
  const borderColor = urgency === 'urgent' ? '#DC2626' : urgency === 'high' ? '#F59E0B' : '#3B82F6';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔄 Payment Retry Reminder</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: ${bgColor}; border: 2px solid ${borderColor}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: ${borderColor}; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🔄', 'Payment Retry', 'Final payment attempt scheduled')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We're preparing to retry your payment for <strong>${businessName}</strong>.</p>
          
          <div class="alert-box">
            <h2>${urgency === 'urgent' ? '🚨 Final Retry Attempt' : urgency === 'high' ? '⚠️ Payment Retry' : '📋 Payment Retry Scheduled'}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Attempt ${retryAttempt} of ${maxRetries}</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Retry Date:</span>
              <span class="detail-value">${retryDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Attempts Remaining:</span>
              <span class="detail-value">${maxRetries - retryAttempt}</span>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ Ensure Successful Payment</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Verify your payment method is valid</li>
              <li>Ensure sufficient funds are available</li>
              <li>Update payment details if needed</li>
              ${urgency === 'urgent' ? '<li>This is your final retry attempt before potential service interruption</li>' : ''}
            </ul>
          </div>

          <a href="https://busmo.io/settings/billing" class="button">Update Payment Method</a>
          
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
    subject: `🔄 Payment Retry Reminder - ${businessName}`,
    htmlContent,
  });
}

// Trial Expired Email
export async function sendTrialExpiredEmail(params: TrialExpiredParams): Promise<any> {
  const { email, name, businessName, trialEndDate, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⏰ Trial Expired</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: #DC2626; }
        .plans-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('⏰', 'Trial Expired', 'Your trial period has ended')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your trial period for <strong>${businessName}</strong> has expired.</p>
          
          <div class="alert-box">
            <h2>⏰ Trial Period Ended</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your trial ended on ${trialEndDate}. To continue using Busmo, please subscribe to a plan.</p>
          </div>

          <div class="plans-box">
            <h3 style="margin-top: 0; color: #0A0A0F;">Choose Your Plan</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li><strong>Starter:</strong> Perfect for small businesses</li>
              <li><strong>Professional:</strong> For growing businesses</li>
              <li><strong>Enterprise:</strong> For large operations</li>
            </ul>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 Why Continue with Busmo?</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Track sales and inventory in real-time</li>
              <li>Get AI-powered business insights</li>
              <li>Manage your team efficiently</li>
              <li>Make data-driven decisions</li>
            </ul>
          </div>

          <a href="https://busmo.io/plans" class="button">View Plans & Subscribe</a>
          
          <p>We'd love to continue helping you grow your business!</p>
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
    subject: `⏰ Trial Expired - ${businessName}`,
    htmlContent,
  });
}

// Subscription Renewed Email
export async function sendSubscriptionRenewedEmail(params: SubscriptionRenewedParams): Promise<any> {
  const { email, name, businessName, planName, amount, billingPeriod, nextBillingDate, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>✅ Subscription Renewed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .success-box { background: #F0FDF4; border: 2px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .success-box h2 { margin-top: 0; color: #065F46; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('✅', 'Subscription Renewed', 'Your plan has been successfully renewed')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your subscription for <strong>${businessName}</strong> has been successfully renewed.</p>
          
          <div class="success-box">
            <h2>🎉 Renewal Successful!</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">You can continue enjoying all the features of Busmo without interruption.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}/${billingPeriod}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Next Billing Date:</span>
              <span class="detail-value">${nextBillingDate}</span>
            </div>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 Need to Make Changes?</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Upgrade or downgrade your plan anytime</li>
              <li>Update your payment method in settings</li>
              <li>View your billing history</li>
              <li>Contact support for assistance</li>
            </ul>
          </div>

          <a href="https://busmo.io/settings/billing" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2);">Manage Subscription</a>
          
          <p>Thank you for choosing Busmo!</p>
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
    subject: `✅ Subscription Renewed - ${businessName}`,
    htmlContent,
  });
}

// Subscription Cancelled Email
export async function sendSubscriptionCancelledEmail(params: SubscriptionCancelledParams): Promise<any> {
  const { email, name, businessName, planName, cancellationDate, accessUntilDate, reason, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>👋 Subscription Cancelled</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .notice-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .notice-box h2 { margin-top: 0; color: #1E40AF; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('👋', 'Subscription Cancelled', 'Your subscription has been cancelled')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your subscription for <strong>${businessName}</strong> has been cancelled.</p>
          
          <div class="notice-box">
            <h2>📋 Cancellation Confirmed</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">You will continue to have access until ${accessUntilDate}.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cancellation Date:</span>
              <span class="detail-value">${cancellationDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Access Until:</span>
              <span class="detail-value">${accessUntilDate}</span>
            </div>
            ${reason ? `
            <div class="detail-row">
              <span class="detail-label">Reason:</span>
              <span class="detail-value">${reason}</span>
            </div>
            ` : ''}
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 What Happens Next</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Your data will be safely stored for 30 days</li>
              <li>You can reactivate your subscription anytime</li>
              <li>After 30 days, data will be permanently deleted</li>
              <li>Contact support if you need an extension</li>
            </ul>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">❓ Changed Your Mind?</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">You can reactivate your subscription anytime before ${accessUntilDate} to continue using Busmo.</p>
          </div>

          <a href="https://busmo.io/settings/billing" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2);">Reactivate Subscription</a>
          
          <p>We're sorry to see you go. If there's anything we can do to improve, please let us know.</p>
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
    subject: `👋 Subscription Cancelled - ${businessName}`,
    htmlContent,
  });
}

// Subscription Expired Email
export async function sendSubscriptionExpiredEmail(params: SubscriptionExpiredParams): Promise<any> {
  const { email, name, businessName, planName, expiryDate, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⏰ Subscription Expired</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: #DC2626; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('⏰', 'Subscription Expired', 'Your subscription has ended')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your subscription for <strong>${businessName}</strong> has expired.</p>
          
          <div class="alert-box">
            <h2>⏰ Access Revoked</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your subscription expired on ${expiryDate}. To regain access, please resubscribe.</p>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 About Your Data</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Your data has been safely stored</li>
              <li>Data will be permanently deleted after 30 days</li>
              <li>Resubscribe before then to keep your data</li>
              <li>Contact support if you need assistance</li>
            </ul>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">🚀 Ready to Come Back?</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Resubscribe now to continue managing your business with Busmo's powerful tools.</p>
          </div>

          <a href="https://busmo.io/plans" class="button">Resubscribe Now</a>
          
          <p>We hope to see you back soon!</p>
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
    subject: `⏰ Subscription Expired - ${businessName}`,
    htmlContent,
  });
}

// Card Expiring Soon Email
export async function sendCardExpiringSoonEmail(params: CardExpiringSoonParams): Promise<any> {
  const { email, name, businessName, lastFourDigits, expiryMonth, expiryYear, daysUntilExpiry } = params;
  
  const urgency = daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 14 ? 'high' : 'normal';
  const bgColor = urgency === 'urgent' ? '#FEE2E2' : urgency === 'high' ? '#FEF3C7' : '#DBEAFE';
  const borderColor = urgency === 'urgent' ? '#DC2626' : urgency === 'high' ? '#F59E0B' : '#3B82F6';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>💳 Card Expiring Soon</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: ${bgColor}; border: 2px solid ${borderColor}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: ${borderColor}; }
        .card-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; text-align: center; }
        .card-number { font-size: 24px; font-weight: 700; color: #0A0A0F; font-family: monospace; letter-spacing: 2px; }
        .expiry-date { font-size: 18px; color: #6B7280; margin-top: 10px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('💳', 'Card Expiring Soon', 'Update your payment method')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>The payment method for <strong>${businessName}</strong> is expiring soon.</p>
          
          <div class="alert-box">
            <h2>${urgency === 'urgent' ? '🚨 Action Required' : urgency === 'high' ? '⚠️ Update Soon' : '📋 Card Expiring'}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Expires in ${daysUntilExpiry} days</p>
          </div>

          <div class="card-box">
            <div style="font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Card on File</div>
            <div class="card-number">•••• •••• •••• ${lastFourDigits}</div>
            <div class="expiry-date">Expires: ${expiryMonth}/${expiryYear}</div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ Why Update Now?</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Ensure uninterrupted service</li>
              <li>Avoid failed payments</li>
              <li>Prevent subscription interruption</li>
              <li>Keep your business running smoothly</li>
            </ul>
          </div>

          <a href="https://busmo.io/settings/billing" class="button">Update Payment Method</a>
          
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
    subject: `💳 Card Expiring Soon - ${businessName}`,
    htmlContent,
  });
}
