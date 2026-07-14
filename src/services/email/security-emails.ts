import { sendTransactionalEmail } from './brevo-service';

const BUSMO_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAAtGVYSWZJSSoACAAAAAYAEgEDAAEAAAABAAAAGgEFAAEAAABWAAAAGwEFAAEAAABeAAAAKAEDAAEAAAACAAAAEwIDAAEAAAABAAAAaYcEAAEAAABmAAAAAAAAAGAAAAABAAAAYAAAAAEAAAAGAACQBwAEAAAAMDIxMAGRBwAEAAAAAQIDAACgBwAEAAAAMDEwMAGgAwABAAAA//8AAAKgBAABAAAA9AEAAAOgBAABAAAA9AEAAAAAAAAA4cNEAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF1mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTAyLTA3PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUctd2xCT0lvMCZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBR3kzUUpfNGlZJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0JBR3kzZTVObENvJnF1b3Q7LCZxdW90O3RlbXBsYXRlJnF1b3Q7OiZxdW90O09yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyZxdW90O308L0F0dHJpYjpEYXRhPgogICAgIDxBdHRyaWI6RXh0SWQ+M2YyZTNkNTEtOTA0OS00YmM4LTkwZjAtMTcxMGZmYzFkYjQ2PC9BdHRyaWI6RXh0SWQ+CiAgICAgPEF0dHJpYjpGYklkPjUyNTI2NTkxNDE3OTU4MDwvQXR0cmliOkZiSWQ+CiAgICAgPEF0dHJpYjpUb3VjaFR5cGU+MjwvQXR0cmFiOlRvdWNoVHlwZT4KICAgIDwvcmRmOmxpPgogICA8L3JkZjpTZXE+CiAgPC9BdHRyaWI6QWRzPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPk9yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyAtIDI8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnBkZj0naHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyc+CiAgPHBkZjpBdXRob3I+dGFoZWVyYXRmb29kczwvcGRmOkF1dGhvcj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoK';

const getEmailHeader = (icon: string, title: string, subtitle: string) => `
  <div style="padding: 40px 30px; text-align: center; color: white; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); position: relative; overflow: hidden;">
    <div style="position: relative; z-index: 1;">
      <img src="${BUSMO_LOGO}" alt="Busmo Logo" style="width: 80px; height: 80px; margin-bottom: 16px; display: inline-block; border-radius: 16px; background: white; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <h1 style="margin: 16px 0 8px; font-size: 28px; font-weight: 700; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.95; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${subtitle}</p>
    </div>
  </div>
`;

export interface LoginAlertParams {
  email: string;
  name: string;
  device: string;
  browser: string;
  location?: string;
  loginTime: string;
  ipAddress?: string;
}

export interface EmailChangedParams {
  email: string;
  name: string;
  oldEmail: string;
  newEmail: string;
  changedDate: string;
}

export interface PhoneNumberChangedParams {
  email: string;
  name: string;
  oldPhone: string;
  newPhone: string;
  changedDate: string;
}

export interface APIKeyCreatedParams {
  email: string;
  name: string;
  keyName: string;
  createdDate: string;
  lastFourChars: string;
}

export interface TwoFactorEnabledParams {
  email: string;
  name: string;
  enabledDate: string;
  method: 'sms' | 'app' | 'email';
}

export interface TwoFactorDisabledParams {
  email: string;
  name: string;
  disabledDate: string;
}

// Login Alert Email
export async function sendLoginAlertEmail(params: LoginAlertParams): Promise<any> {
  const { email, name, device, browser, location, loginTime, ipAddress } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔐 New Login Detected</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: #1E40AF; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .security-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .security-box h3 { margin-top: 0; color: #D97706; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🔐', 'New Login Detected', 'Security notification')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We detected a new login to your Busmo account. If this was you, you can safely ignore this email.</p>
          
          <div class="alert-box">
            <h2>📍 Login Details</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Here are the details of the login:</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Device:</span>
              <span class="detail-value">${device}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Browser:</span>
              <span class="detail-value">${browser}</span>
            </div>
            ${location ? `
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${location}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${loginTime}</span>
            </div>
            ${ipAddress ? `
            <div class="detail-row">
              <span class="detail-label">IP Address:</span>
              <span class="detail-value">${ipAddress}</span>
            </div>
            ` : ''}
          </div>

          <div class="security-box">
            <h3>🔒 Security Notice</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">If you did not initiate this login, please:</p>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Change your password immediately</li>
              <li>Review your account activity</li>
              <li>Contact our support team if you need assistance</li>
            </ul>
          </div>

          <a href="https://busmo.io/settings/security" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2);">Review Security Settings</a>
          
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
    subject: '🔐 New Login Detected - Busmo Security',
    htmlContent,
  });
}

// Email Changed Email
export async function sendEmailChangedEmail(params: EmailChangedParams): Promise<any> {
  const { email, name, oldEmail, newEmail, changedDate } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📧 Email Address Changed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .change-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .change-box h2 { margin-top: 0; color: #1E40AF; }
        .email-change { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; text-align: center; }
        .email-arrow { font-size: 32px; color: #6B3FE7; margin: 15px 0; }
        .old-email { font-size: 18px; color: #6B7280; }
        .new-email { font-size: 24px; font-weight: 700; color: #10B981; }
        .security-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .security-box h3 { margin-top: 0; color: #D97706; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('📧', 'Email Changed', 'Your email address has been updated')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your Busmo account email address has been successfully changed.</p>
          
          <div class="change-box">
            <h2>📋 Email Change Confirmation</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">All future communications will be sent to your new email address.</p>
          </div>

          <div class="email-change">
            <div class="old-email">Previous Email</div>
            <div style="font-weight: 600; color: #0A0A0F; margin: 8px 0;">${oldEmail}</div>
            <div class="email-arrow">↓</div>
            <div class="new-email">New Email</div>
            <div style="font-weight: 700; color: #10B981; font-size: 20px; margin: 8px 0;">${newEmail}</div>
          </div>

          <div class="security-box">
            <h3>🔒 Security Notice</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">If you did not initiate this change, please contact our support team immediately at <a href="mailto:support@busmo.io" style="color: #6B3FE7;">support@busmo.io</a>.</p>
          </div>

          <p>Changed on: ${changedDate}</p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '📧 Email Address Changed - Busmo',
    htmlContent,
  });
}

// Phone Number Changed Email
export async function sendPhoneNumberChangedEmail(params: PhoneNumberChangedParams): Promise<any> {
  const { email, name, oldPhone, newPhone, changedDate } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📱 Phone Number Changed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .change-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .change-box h2 { margin-top: 0; color: #1E40AF; }
        .phone-change { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; text-align: center; }
        .phone-arrow { font-size: 32px; color: #6B3FE7; margin: 15px 0; }
        .old-phone { font-size: 18px; color: #6B7280; }
        .new-phone { font-size: 24px; font-weight: 700; color: #10B981; }
        .security-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .security-box h3 { margin-top: 0; color: #D97706; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('📱', 'Phone Number Changed', 'Your phone number has been updated')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your Busmo account phone number has been successfully changed.</p>
          
          <div class="change-box">
            <h2>📋 Phone Change Confirmation</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">This phone number will be used for account verification and security notifications.</p>
          </div>

          <div class="phone-change">
            <div class="old-phone">Previous Phone</div>
            <div style="font-weight: 600; color: #0A0A0F; margin: 8px 0;">${oldPhone}</div>
            <div class="phone-arrow">↓</div>
            <div class="new-phone">New Phone</div>
            <div style="font-weight: 700; color: #10B981; font-size: 20px; margin: 8px 0;">${newPhone}</div>
          </div>

          <div class="security-box">
            <h3>🔒 Security Notice</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">If you did not initiate this change, please contact our support team immediately at <a href="mailto:support@busmo.io" style="color: #6B3FE7;">support@busmo.io</a>.</p>
          </div>

          <p>Changed on: ${changedDate}</p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '📱 Phone Number Changed - Busmo',
    htmlContent,
  });
}

// API Key Created Email
export async function sendAPIKeyCreatedEmail(params: APIKeyCreatedParams): Promise<any> {
  const { email, name, keyName, createdDate, lastFourChars } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔑 API Key Created</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .key-box { background: #F0FDF4; border: 2px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .key-box h2 { margin-top: 0; color: #065F46; }
        .key-display { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; text-align: center; }
        .key-value { font-size: 24px; font-weight: 700; color: #6B3FE7; font-family: monospace; letter-spacing: 2px; }
        .security-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .security-box h3 { margin-top: 0; color: #D97706; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🔑', 'API Key Created', 'New API key generated')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>A new API key has been created for your Busmo account.</p>
          
          <div class="key-box">
            <h2>🔑 API Key Details</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Keep this key secure. Do not share it with anyone.</p>
          </div>

          <div class="key-display">
            <div style="font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Key Name</div>
            <div style="font-weight: 600; color: #0A0A0F; margin: 8px 0;">${keyName}</div>
            <div style="font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 15px;">Key (Last 4 Characters)</div>
            <div class="key-value">...${lastFourChars}</div>
          </div>

          <div class="security-box">
            <h3>🔒 Security Best Practices</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Store your API key securely (environment variables, secret managers)</li>
              <li>Never commit API keys to version control</li>
              <li>Rotate your API keys regularly</li>
              <li>Revoke keys that are no longer needed</li>
              <li>Monitor API usage for suspicious activity</li>
            </ul>
          </div>

          <a href="https://busmo.io/settings/api" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2);">Manage API Keys</a>
          
          <p>Created on: ${createdDate}</p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '🔑 API Key Created - Busmo',
    htmlContent,
  });
}

// Two-Factor Authentication Enabled Email
export async function sendTwoFactorEnabledEmail(params: TwoFactorEnabledParams): Promise<any> {
  const { email, name, enabledDate, method } = params;
  
  const methodText = method === 'sms' ? 'SMS' : method === 'app' ? 'Authenticator App' : 'Email';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔐 Two-Factor Authentication Enabled</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .success-box { background: #F0FDF4; border: 2px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .success-box h2 { margin-top: 0; color: #065F46; }
        .method-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; text-align: center; }
        .method-icon { font-size: 48px; margin-bottom: 15px; }
        .method-name { font-size: 24px; font-weight: 700; color: #6B3FE7; }
        .benefits-box { background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .benefits-box h3 { margin-top: 0; color: #6B3FE7; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🔐', '2FA Enabled', 'Your account is now more secure')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Two-factor authentication has been successfully enabled on your Busmo account.</p>
          
          <div class="success-box">
            <h2>🎉 Security Enhanced!</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your account is now protected with an additional layer of security.</p>
          </div>

          <div class="method-box">
            <div class="method-icon">${method === 'sms' ? '📱' : method === 'app' ? '📲' : '📧'}</div>
            <div style="font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Authentication Method</div>
            <div class="method-name">${methodText}</div>
          </div>

          <div class="benefits-box">
            <h3>💡 Benefits of 2FA</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Added protection against unauthorized access</li>
              <li>Even if your password is compromised, your account stays safe</li>
              <li>Peace of mind knowing your business data is secure</li>
              <li>Industry-standard security practice</li>
            </ul>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">⚠️ Important</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Make sure you have access to your ${methodText.toLowerCase()} when logging in. You'll need it to complete the authentication process.</p>
          </div>

          <p>Enabled on: ${enabledDate}</p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '🔐 Two-Factor Authentication Enabled - Busmo',
    htmlContent,
  });
}

// Two-Factor Authentication Disabled Email
export async function sendTwoFactorDisabledEmail(params: TwoFactorDisabledParams): Promise<any> {
  const { email, name, disabledDate } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚠️ Two-Factor Authentication Disabled</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .warning-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .warning-box h2 { margin-top: 0; color: #DC2626; }
        .security-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .security-box h3 { margin-top: 0; color: #D97706; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('⚠️', '2FA Disabled', 'Security feature has been turned off')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Two-factor authentication has been disabled on your Busmo account.</p>
          
          <div class="warning-box">
            <h2>🔓 Security Reduced</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your account no longer has the additional protection of two-factor authentication.</p>
          </div>

          <div class="security-box">
            <h3>🔒 Security Notice</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">If you did not disable 2FA, please:</p>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Enable 2FA again immediately</li>
              <li>Change your password</li>
              <li>Review your account activity</li>
              <li>Contact support if you suspect unauthorized access</li>
            </ul>
          </div>

          <a href="https://busmo.io/settings/security" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2);">Enable 2FA Again</a>
          
          <p>Disabled on: ${disabledDate}</p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '⚠️ Two-Factor Authentication Disabled - Busmo',
    htmlContent,
  });
}
