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

export interface TermsOfServiceUpdatedParams {
  email: string;
  name: string;
  businessName?: string;
  updateDate: string;
  summary: string;
  effectiveDate: string;
  viewUrl: string;
}

export interface PrivacyPolicyUpdatedParams {
  email: string;
  name: string;
  businessName?: string;
  updateDate: string;
  summary: string;
  effectiveDate: string;
  viewUrl: string;
}

export interface ScheduledMaintenanceParams {
  email: string;
  name: string;
  businessName?: string;
  maintenanceDate: string;
  maintenanceStartTime: string;
  maintenanceEndTime: string;
  affectedServices: string[];
  reason: string;
}

export interface ServiceIncidentParams {
  email: string;
  name: string;
  businessName?: string;
  incidentDate: string;
  incidentType: 'outage' | 'degraded-performance' | 'data-issue';
  affectedServices: string[];
  description: string;
  currentStatus: string;
  estimatedResolution?: string;
}

export interface ServiceRestoredParams {
  email: string;
  name: string;
  businessName?: string;
  restorationDate: string;
  incidentType: 'outage' | 'degraded-performance' | 'data-issue';
  affectedServices: string[];
  resolutionSummary: string;
  incidentDuration: string;
}

// Terms of Service Updated Email
export async function sendTermsOfServiceUpdatedEmail(params: TermsOfServiceUpdatedParams): Promise<any> {
  const { email, name, businessName, updateDate, summary, effectiveDate, viewUrl } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📋 Terms of Service Updated</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .notice-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .notice-box h2 { margin-top: 0; color: #1E40AF; }
        .summary-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .summary-box p { margin: 0; color: #555; font-size: 14px; line-height: 1.8; }
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
        ${getEmailHeader('📋', 'Terms Updated', 'Important changes to our Terms of Service')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We've updated our Terms of Service to better serve you${businessName ? ` and ${businessName}` : ''}.</p>
          
          <div class="notice-box">
            <h2>📋 Terms of Service Updated</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Please review the updated terms which become effective on ${effectiveDate}.</p>
          </div>

          <div class="summary-box">
            <h3 style="margin-top: 0; color: #0A0A0F;">Summary of Changes</h3>
            <p>${summary}</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Update Date:</span>
              <span class="detail-value">${updateDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Effective Date:</span>
              <span class="detail-value">${effectiveDate}</span>
            </div>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 What This Means</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>By continuing to use Busmo, you agree to the updated terms</li>
              <li>Your continued use after ${effectiveDate} constitutes acceptance</li>
              <li>If you disagree with the changes, you may terminate your account</li>
            </ul>
          </div>

          <a href="${viewUrl}" class="button">View Updated Terms</a>
          
          <p>If you have any questions, please contact our support team.</p>
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
    subject: '📋 Terms of Service Updated - Busmo',
    htmlContent,
  });
}

// Privacy Policy Updated Email
export async function sendPrivacyPolicyUpdatedEmail(params: PrivacyPolicyUpdatedParams): Promise<any> {
  const { email, name, businessName, updateDate, summary, effectiveDate, viewUrl } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔒 Privacy Policy Updated</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .notice-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .notice-box h2 { margin-top: 0; color: #1E40AF; }
        .summary-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .summary-box p { margin: 0; color: #555; font-size: 14px; line-height: 1.8; }
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
        ${getEmailHeader('🔒', 'Privacy Updated', 'Changes to our Privacy Policy')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We've updated our Privacy Policy to better protect your data${businessName ? ` and ${businessName}` : ''}.</p>
          
          <div class="notice-box">
            <h2>🔒 Privacy Policy Updated</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Please review the updated policy which becomes effective on ${effectiveDate}.</p>
          </div>

          <div class="summary-box">
            <h3 style="margin-top: 0; color: #0A0A0F;">Summary of Changes</h3>
            <p>${summary}</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Update Date:</span>
              <span class="detail-value">${updateDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Effective Date:</span>
              <span class="detail-value">${effectiveDate}</span>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">🛡️ Our Commitment</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>We take your privacy seriously</li>
              <li>Your data is encrypted and securely stored</li>
              <li>We never sell your personal information</li>
              <li>You have full control over your data</li>
            </ul>
          </div>

          <a href="${viewUrl}" class="button">View Privacy Policy</a>
          
          <p>If you have any questions, please contact our support team.</p>
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
    subject: '🔒 Privacy Policy Updated - Busmo',
    htmlContent,
  });
}

// Scheduled Maintenance Email
export async function sendScheduledMaintenanceEmail(params: ScheduledMaintenanceParams): Promise<any> {
  const { email, name, businessName, maintenanceDate, maintenanceStartTime, maintenanceEndTime, affectedServices, reason } = params;
  
  const servicesList = affectedServices.map(service => `<li style="padding: 8px 0;">${service}</li>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔧 Scheduled Maintenance</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .maintenance-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .maintenance-box h2 { margin-top: 0; color: #D97706; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .services-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .services-box h3 { margin-top: 0; color: #065F46; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🔧', 'Scheduled Maintenance', 'Planned system maintenance')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We'll be performing scheduled maintenance to improve our services${businessName ? ` for ${businessName}` : ''}.</p>
          
          <div class="maintenance-box">
            <h2>🔧 Maintenance Scheduled</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Some services may be temporarily unavailable during this time.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${maintenanceDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Start Time:</span>
              <span class="detail-value">${maintenanceStartTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">End Time:</span>
              <span class="detail-value">${maintenanceEndTime}</span>
            </div>
          </div>

          <div class="services-box">
            <h3>Affected Services</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${servicesList}
            </ul>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">💡 Reason for Maintenance</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">${reason}</p>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ What to Expect</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Brief service interruptions may occur</li>
              <li>Data will be safely backed up before maintenance</li>
              <li>We'll work to minimize downtime</li>
              <li>Services will be fully restored by ${maintenanceEndTime}</li>
            </ul>
          </div>
          
          <p>We apologize for any inconvenience and appreciate your patience.</p>
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
    subject: '🔧 Scheduled Maintenance - Busmo',
    htmlContent,
  });
}

// Service Incident Email
export async function sendServiceIncidentEmail(params: ServiceIncidentParams): Promise<any> {
  const { email, name, businessName, incidentDate, incidentType, affectedServices, description, currentStatus, estimatedResolution } = params;
  
  const incidentTypes = {
    'outage': 'Service Outage',
    'degraded-performance': 'Degraded Performance',
    'data-issue': 'Data Issue'
  };

  const servicesList = affectedServices.map(service => `<li style="padding: 8px 0;">${service}</li>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚠️ Service Incident</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .incident-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .incident-box h2 { margin-top: 0; color: #DC2626; }
        .details-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .services-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .services-box h3 { margin-top: 0; color: #0A0A0F; }
        .status-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .status-box h3 { margin-top: 0; color: #D97706; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('⚠️', 'Service Incident', 'We are working to resolve an issue')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We're currently experiencing a service incident that may affect your use of Busmo${businessName ? ` for ${businessName}` : ''}.</p>
          
          <div class="incident-box">
            <h2>⚠️ ${incidentTypes[incidentType]}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Our team is actively working to resolve this issue.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Incident Date:</span>
              <span class="detail-value">${incidentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Incident Type:</span>
              <span class="detail-value">${incidentTypes[incidentType]}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Current Status:</span>
              <span class="detail-value">${currentStatus}</span>
            </div>
            ${estimatedResolution ? `
            <div class="detail-row">
              <span class="detail-label">Estimated Resolution:</span>
              <span class="detail-value">${estimatedResolution}</span>
            </div>
            ` : ''}
          </div>

          <div class="services-box">
            <h3>Affected Services</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${servicesList}
            </ul>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">📋 Description</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px; line-height: 1.8;">${description}</p>
          </div>

          <div class="status-box">
            <h3>🔄 What We're Doing</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Our engineering team is investigating the issue</li>
              <li>We're working to restore full service as quickly as possible</li>
              <li>We'll provide updates as they become available</li>
              <li>Your data remains safe and secure</li>
            </ul>
          </div>
          
          <p>We apologize for any inconvenience and appreciate your patience.</p>
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
    subject: `⚠️ Service Incident - ${incidentTypes[incidentType]}`,
    htmlContent,
  });
}

// Service Restored Email
export async function sendServiceRestoredEmail(params: ServiceRestoredParams): Promise<any> {
  const { email, name, businessName, restorationDate, incidentType, affectedServices, resolutionSummary, incidentDuration } = params;
  
  const incidentTypes = {
    'outage': 'Service Outage',
    'degraded-performance': 'Degraded Performance',
    'data-issue': 'Data Issue'
  };

  const servicesList = affectedServices.map(service => `<li style="padding: 8px 0;">${service}</li>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>✅ Service Restored</title>
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
        .services-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .services-box h3 { margin-top: 0; color: #0A0A0F; }
        .resolution-box { background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .resolution-box h3 { margin-top: 0; color: #6B3FE7; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('✅', 'Service Restored', 'All systems are operational')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Good news! The service incident has been resolved and all systems are now operational${businessName ? ` for ${businessName}` : ''}.</p>
          
          <div class="success-box">
            <h2>✅ Service Restored</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">All affected services are back to normal operation.</p>
          </div>

          <div class="details-box">
            <div class="detail-row">
              <span class="detail-label">Restoration Date:</span>
              <span class="detail-value">${restorationDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Incident Type:</span>
              <span class="detail-value">${incidentTypes[incidentType]}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Incident Duration:</span>
              <span class="detail-value">${incidentDuration}</span>
            </div>
          </div>

          <div class="services-box">
            <h3>Restored Services</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${servicesList}
            </ul>
          </div>

          <div class="resolution-box">
            <h3>🔧 Resolution Summary</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px; line-height: 1.8;">${resolutionSummary}</p>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">🛡️ What We Did</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Identified and resolved the root cause</li>
              <li>Verified all systems are functioning normally</li>
              <li>Implemented measures to prevent recurrence</li>
              <li>Your data remained safe throughout the incident</li>
            </ul>
          </div>
          
          <p>Thank you for your patience during this incident.</p>
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
    subject: '✅ Service Restored - Busmo',
    htmlContent,
  });
}
