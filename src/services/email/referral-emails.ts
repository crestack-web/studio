import { sendTransactionalEmail } from './brevo-service';

const BUSMO_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAAtGVYSWZJSSoACAAAAAYAEgEDAAEAAAABAAAAGgEFAAEAAABWAAAAGwEFAAEAAABeAAAAKAEDAAEAAAACAAAAEwIDAAEAAAABAAAAaYcEAAEAAABmAAAAAAAAAGAAAAABAAAAYAAAAAEAAAAGAACQBwAEAAAAMDIxMAGRBwAEAAAAAQIDAACgBwAEAAAAMDEwMAGgAwABAAAA//8AAAKgBAABAAAA9AEAAAOgBAABAAAA9AEAAAAAAAAA4cNEAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF1mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTAyLTA3PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUctd2xCT0lvMCZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBR3kzUUpfNGlZJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0JBR3kzZTVObENvJnF1b3Q7LCZxdW90O3RlbXBsYXRlJnF1b3Q7OiZxdW90O09yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyZxdW90O308L0F0dHJpYjpEYXRhPgogICAgIDxBdHRyaWI6RXh0SWQ+M2YyZTNkNTEtOTA0OS00YmM4LTkwZjAtMTcxMGZmYzFkYjQ2PC9BdHRyaWI6RXh0SWQ+CiAgICAgPEF0dHJpYjpGYklkPjUyNTI2NTkxNDE3OTU4MDwvQXR0cmFiOkZiSWQ+CiAgICAgPEF0dHJpYjpUb3VjaFR5cGU+MjwvQXR0cmFiOlRvdWNoVHlwZT4KICAgIDwvcmRmOmxpPgogICA8L3JkZjpTZXE+CiAgPC9BdHRyaWI6QWRzPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPk9yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyAtIDI8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnBkZj0naHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyc+CiAgPHBkZjpBdXRob3I+dGFoZWVyYXRmb29kczwvcGRmOkF1dGhvcj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoK';

const getEmailHeader = (icon: string, title: string, subtitle: string) => `
  <div style="padding: 40px 30px; text-align: center; color: white; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); position: relative; overflow: hidden;">
    <div style="position: relative; z-index: 1;">
      <img src="${BUSMO_LOGO}" alt="Busmo Logo" style="width: 80px; height: 80px; margin-bottom: 16px; display: inline-block; border-radius: 16px; background: white; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <h1 style="margin: 16px 0 8px; font-size: 28px; font-weight: 700; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.95; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${subtitle}</p>
    </div>
  </div>
`;

export interface ReferralInvitationSentParams {
  email: string;
  name: string;
  businessName: string;
  referralEmail: string;
  referralName?: string;
  referralLink: string;
  rewardAmount?: number;
  currency?: string;
}

export interface ReferralJoinedParams {
  email: string;
  name: string;
  businessName: string;
  referralName: string;
  referralEmail: string;
  joinedDate: string;
  currency?: string;
}

export interface ReferralStartedTrialParams {
  email: string;
  name: string;
  businessName: string;
  referralName: string;
  referralEmail: string;
  trialStartDate: string;
  currency?: string;
}

export interface ReferralConvertedToPaidParams {
  email: string;
  name: string;
  businessName: string;
  referralName: string;
  referralEmail: string;
  planName: string;
  conversionDate: string;
  rewardAmount: number;
  currency?: string;
}

export interface ReferralRewardEarnedParams {
  email: string;
  name: string;
  businessName: string;
  referralName: string;
  referralEmail: string;
  rewardAmount: number;
  rewardType: 'credit' | 'cash' | 'discount';
  earnedDate: string;
  currency?: string;
}

export interface ReferralRewardPaidParams {
  email: string;
  name: string;
  businessName: string;
  rewardAmount: number;
  rewardType: 'credit' | 'cash' | 'discount';
  paidDate: string;
  transactionId?: string;
  currency?: string;
}

// Referral Invitation Sent Email
export async function sendReferralInvitationSentEmail(params: ReferralInvitationSentParams): Promise<any> {
  const { email, name, businessName, referralEmail, referralName, referralLink, rewardAmount, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎁 Referral Invitation Sent</title>
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
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🎁', 'Invitation Sent', 'Your referral has been invited')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>You've successfully invited <strong>${referralName || referralEmail}</strong> to join Busmo!</p>
          
          <div class="success-box">
            <h2>🎉 Invitation Sent!</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your referral will receive an email with your invitation link.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Referral Email:</span>
              <span class="detail-value">${referralEmail}</span>
            </div>
            ${rewardAmount ? `
            <div class="detail-row">
              <span class="detail-label">Potential Reward:</span>
              <span class="detail-value">${currency === 'NGN' ? '₦' : '$'}${rewardAmount.toLocaleString()}</span>
            </div>
            ` : ''}
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 How Rewards Work</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>When your referral signs up, you'll be notified</li>
              <li>When they start a trial, you earn a partial reward</li>
              <li>When they convert to a paid plan, you earn the full reward</li>
              <li>Track all your referrals in your dashboard</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/referrals" class="button">Track Referrals</a>
          
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
    subject: '🎁 Referral Invitation Sent - Busmo',
    htmlContent,
  });
}

// Referral Joined Email
export async function sendReferralJoinedEmail(params: ReferralJoinedParams): Promise<any> {
  const { email, name, businessName, referralName, referralEmail, joinedDate, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎉 Referral Joined</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .success-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .success-box h2 { margin: 0 0 10px; font-size: 32px; }
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
        ${getEmailHeader('🎉', 'Referral Joined!', 'Your invitation was successful')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Great news! <strong>${referralName}</strong> has signed up for Busmo using your referral!</p>
          
          <div class="success-box">
            <h2>🎊 Referral Joined!</h2>
            <p style="margin: 0; font-size: 18px;">${referralName} is now exploring Busmo</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Referral Name:</span>
              <span class="detail-value">${referralName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Referral Email:</span>
              <span class="detail-value">${referralEmail}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Joined On:</span>
              <span class="detail-value">${joinedDate}</span>
            </div>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 Next Steps</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Encourage them to start their free trial</li>
              <li>Offer to help them get started with Busmo</li>
              <li>When they convert to paid, you'll earn your reward</li>
              <li>Track their progress in your referral dashboard</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/referrals" class="button">View Referral Progress</a>
          
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
    subject: `🎉 Referral Joined - ${referralName}`,
    htmlContent,
  });
}

// Referral Started Trial Email
export async function sendReferralStartedTrialEmail(params: ReferralStartedTrialParams): Promise<any> {
  const { email, name, businessName, referralName, referralEmail, trialStartDate, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🚀 Referral Started Trial</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .success-box { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .success-box h2 { margin: 0 0 10px; font-size: 32px; }
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
        ${getEmailHeader('🚀', 'Trial Started!', 'Your referral is exploring Busmo')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Exciting news! <strong>${referralName}</strong> has started their free trial on Busmo!</p>
          
          <div class="success-box">
            <h2>🎊 Trial Started!</h2>
            <p style="margin: 0; font-size: 18px;">${referralName} is now experiencing Busmo</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Referral Name:</span>
              <span class="detail-value">${referralName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Trial Started:</span>
              <span class="detail-value">${trialStartDate}</span>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">💡 Reward Progress</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>✅ Referral signed up</li>
              <li>✅ Referral started trial</li>
              <li>⏳ Waiting for conversion to paid plan</li>
              <li>🎁 Full reward when they convert</li>
            </ul>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 Help Them Convert</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Share your success stories with Busmo</li>
              <li>Offer tips on how you use Busmo effectively</li>
              <li>Answer any questions they might have</li>
              <li>Encourage them to upgrade before trial ends</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/referrals" class="button">Track Referral Progress</a>
          
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
    subject: `🚀 Referral Started Trial - ${referralName}`,
    htmlContent,
  });
}

// Referral Converted to Paid Email
export async function sendReferralConvertedToPaidEmail(params: ReferralConvertedToPaidParams): Promise<any> {
  const { email, name, businessName, referralName, referralEmail, planName, conversionDate, rewardAmount, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎉 Referral Converted!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .celebration-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .celebration-box h2 { margin: 0 0 10px; font-size: 32px; }
        .celebration-box .reward { font-size: 48px; font-weight: 700; margin: 15px 0; }
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
        ${getEmailHeader('🎉', 'Referral Converted!', 'You earned a reward')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Congratulations! <strong>${referralName}</strong> has converted to a paid plan on Busmo!</p>
          
          <div class="celebration-box">
            <h2>🎊 Reward Earned!</h2>
            <p style="margin: 0; font-size: 18px;">${referralName} subscribed to ${planName}</p>
            <div class="reward">${currency === 'NGN' ? '₦' : '$'}${rewardAmount.toLocaleString()}</div>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">Your reward is being processed</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Referral Name:</span>
              <span class="detail-value">${referralName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Conversion Date:</span>
              <span class="detail-value">${conversionDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reward Amount:</span>
              <span class="detail-value" style="color: #10B981;">${currency === 'NGN' ? '₦' : '$'}${rewardAmount.toLocaleString()}</span>
            </div>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 Reward Details</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Your reward will be credited to your account</li>
              <li>You can use it towards your Busmo subscription</li>
              <li>Or request a payout to your bank account</li>
              <li>Keep referring to earn more rewards!</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/referrals" class="button">View Your Rewards</a>
          
          <p>Thank you for helping grow the Busmo community!</p>
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
    subject: `🎉 Referral Converted - ${referralName}`,
    htmlContent,
  });
}

// Referral Reward Earned Email
export async function sendReferralRewardEarnedEmail(params: ReferralRewardEarnedParams): Promise<any> {
  const { email, name, businessName, referralName, referralEmail, rewardAmount, rewardType, earnedDate, currency = 'NGN' } = params;
  
  const rewardTypeText = rewardType === 'credit' ? 'Account Credit' : rewardType === 'cash' ? 'Cash Payout' : 'Discount Credit';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>💰 Reward Earned</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .reward-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .reward-box h2 { margin: 0 0 10px; font-size: 32px; }
        .reward-box .amount { font-size: 48px; font-weight: 700; margin: 15px 0; }
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
        ${getEmailHeader('💰', 'Reward Earned', 'Your referral reward is ready')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>You've earned a reward from referring <strong>${referralName}</strong> to Busmo!</p>
          
          <div class="reward-box">
            <h2>🎁 Reward Earned!</h2>
            <div class="amount">${currency === 'NGN' ? '₦' : '$'}${rewardAmount.toLocaleString()}</div>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">${rewardTypeText}</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Referral:</span>
              <span class="detail-value">${referralName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reward Type:</span>
              <span class="detail-value">${rewardTypeText}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Earned On:</span>
              <span class="detail-value">${earnedDate}</span>
            </div>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 How to Use Your Reward</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              ${rewardType === 'credit' ? `
              <li>Use it to pay for your Busmo subscription</li>
              <li>It will be automatically applied to your next invoice</li>
              <li>Check your balance in the billing section</li>
              ` : rewardType === 'cash' ? `
              <li>Request payout to your bank account</li>
              <li>Processing takes 3-5 business days</li>
              <li>Minimum payout threshold applies</li>
              ` : `
              <li>Apply it to your next subscription payment</li>
              <li>Valid for 12 months from earned date</li>
              <li>Cannot be combined with other offers</li>
              `}
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/referrals" class="button">View Your Rewards</a>
          
          <p>Keep referring to earn more rewards!</p>
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
    subject: `💰 Reward Earned - ${currency === 'NGN' ? '₦' : '$'}${rewardAmount.toLocaleString()}`,
    htmlContent,
  });
}

// Referral Reward Paid Email
export async function sendReferralRewardPaidEmail(params: ReferralRewardPaidParams): Promise<any> {
  const { email, name, businessName, rewardAmount, rewardType, paidDate, transactionId, currency = 'NGN' } = params;
  
  const rewardTypeText = rewardType === 'credit' ? 'Account Credit' : rewardType === 'cash' ? 'Cash Payout' : 'Discount Credit';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>✅ Reward Paid</title>
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
        ${getEmailHeader('✅', 'Reward Paid', 'Your reward has been processed')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your referral reward has been successfully processed and paid!</p>
          
          <div class="success-box">
            <h2>✅ Payment Complete</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your reward of ${currency === 'NGN' ? '₦' : '$'}${rewardAmount.toLocaleString()} has been ${rewardType === 'credit' ? 'credited to your account' : 'sent to your bank account'}.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">${currency === 'NGN' ? '₦' : '$'}${rewardAmount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${rewardTypeText}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Paid On:</span>
              <span class="detail-value">${paidDate}</span>
            </div>
            ${transactionId ? `
            <div class="detail-row">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${transactionId}</span>
            </div>
            ` : ''}
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 Keep Earning</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Share your referral link with more people</li>
              <li>Help your referrals succeed with Busmo</li>
              <li>Earn rewards for every successful conversion</li>
              <li>Track all your earnings in your dashboard</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/referrals" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2);">View Your Earnings</a>
          
          <p>Thank you for being a valued Busmo partner!</p>
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
    subject: `✅ Reward Paid - ${currency === 'NGN' ? '₦' : '$'}${rewardAmount.toLocaleString()}`,
    htmlContent,
  });
}
