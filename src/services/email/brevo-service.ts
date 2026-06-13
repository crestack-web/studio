// ═══════════════════════════════════════════
//  Brevo Email Service
// ═══════════════════════════════════════════
//  Centralized service for all Brevo (Sendinblue) email operations
//  including campaigns and transactional emails
// ═══════════════════════════════════════════

import axios from 'axios';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3';

if (!BREVO_API_KEY) {
  console.warn('BREVO_API_KEY not found in environment variables. Brevo email service will not function.');
}

// Axios instance for Brevo API
const brevoApi = axios.create({
  baseURL: BREVO_API_URL,
  headers: {
    'api-key': BREVO_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ═══════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════

export interface EmailCampaign {
  name: string;
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  htmlContent: string;
  recipients: {
    listIds?: number[];
  };
  scheduledAt?: string;
}

export interface TransactionalEmail {
  to: {
    email: string;
    name?: string;
  }[];
  subject: string;
  htmlContent: string;
  sender?: {
    name: string;
    email: string;
  };
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

// ═══════════════════════════════════════════
//  Campaign Functions
// ═══════════════════════════════════════════

/**
 * Create a new email campaign
 */
export async function createCampaign(campaign: EmailCampaign): Promise<any> {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key not configured');
  }

  try {
    const emailCampaign = {
      name: campaign.name,
      subject: campaign.subject,
      sender: campaign.sender,
      type: 'classic',
      htmlContent: campaign.htmlContent,
      recipients: campaign.recipients,
      scheduledAt: campaign.scheduledAt,
    };

    const response = await brevoApi.post('/emailCampaigns', emailCampaign);
    console.log('Campaign created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error('Failed to create email campaign');
  }
}

/**
 * Send a campaign immediately
 */
export async function sendCampaign(campaignId: number): Promise<any> {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key not configured');
  }

  try {
    const response = await brevoApi.post(`/emailCampaigns/${campaignId}/sendNow`);
    console.log('Campaign sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending campaign:', error);
    throw new Error('Failed to send email campaign');
  }
}

/**
 * Schedule a campaign for later
 */
export async function scheduleCampaign(campaignId: number, scheduledAt: string): Promise<any> {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key not configured');
  }

  try {
    const response = await brevoApi.put(`/emailCampaigns/${campaignId}`, { scheduledAt });
    console.log('Campaign scheduled successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    throw new Error('Failed to schedule email campaign');
  }
}

// ═══════════════════════════════════════════
//  Transactional Email Functions
// ═══════════════════════════════════════════

/**
 * Send a transactional email
 */
export async function sendTransactionalEmail(email: TransactionalEmail): Promise<any> {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key not configured');
  }

  try {
    const sendSmtpEmail = {
      to: email.to,
      subject: email.subject,
      htmlContent: email.htmlContent,
      sender: email.sender || {
        name: 'Busmo',
        email: 'noreply@busmo.com',
      },
      params: email.params,
    };

    const response = await brevoApi.post('/smtp/email', sendSmtpEmail);
    console.log('Transactional email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending transactional email:', error);
    throw new Error('Failed to send transactional email');
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  businessName?: string
): Promise<any> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Busmo! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Welcome to Busmo! We're excited to have you on board${businessName ? ` and help you grow ${businessName}` : ''}.</p>
          <p>Busmo is your all-in-one business management solution designed to help you:</p>
          <ul>
            <li>Track sales and inventory in real-time</li>
            <li>Manage your team and staff performance</li>
            <li>Get AI-powered business insights</li>
            <li>Monitor cash flow and expenses</li>
          </ul>
          <p>Get started by logging into your dashboard and exploring the features.</p>
          <a href="https://busmo.com/dashboard" class="button">Go to Dashboard</a>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Busmo Team</p>
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
    subject: 'Welcome to Busmo! 🎉',
    htmlContent,
    params: { name, businessName },
  });
}

/**
 * Send staff invitation email
 */
export async function sendStaffInvitationEmail(
  email: string,
  staffName: string,
  businessName: string,
  tempPassword: string
): Promise<any> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; background: #f9f9f9; }
        .password-box { background: #fff; padding: 15px; border: 2px dashed #667eea; text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited to Join ${businessName}! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${staffName},</p>
          <p>You've been invited to join the team at <strong>${businessName}</strong> on Busmo.</p>
          <p>Your temporary password is:</p>
          <div class="password-box">${tempPassword}</div>
          <p><strong>Important:</strong> Please change your password after logging in for security.</p>
          <a href="https://busmo.com/login" class="button">Login to Busmo</a>
          <p>If you have any questions, please contact your business owner.</p>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name: staffName }],
    subject: `You're invited to join ${businessName}! 🎉`,
    htmlContent,
    params: { staffName, businessName, tempPassword },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
): Promise<any> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>This link will expire in 1 hour for security.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The Busmo Team</p>
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
    subject: 'Reset Your Password',
    htmlContent,
    params: { name, resetLink },
  });
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlertEmail(
  email: string,
  businessName: string,
  lowStockItems: Array<{ name: string; stock: number; threshold: number }>
): Promise<any> {
  const itemsList = lowStockItems.map(item => 
    `<li><strong>${item.name}</strong>: ${item.stock} remaining (threshold: ${item.threshold})</li>`
  ).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; background: #f9f9f9; }
        .alert-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .items-list { list-style: none; padding: 0; }
        .items-list li { padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
        .items-list li:last-child { border-bottom: none; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Low Stock Alert</h1>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>The following items in <strong>${businessName}</strong> are running low on stock:</p>
          <div class="alert-box">
            <ul class="items-list">
              ${itemsList}
            </ul>
          </div>
          <p>We recommend restocking these items soon to avoid running out.</p>
          <a href="https://busmo.com/dashboard/inventory" class="button">Manage Inventory</a>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Low Stock Alert - ${businessName}`,
    htmlContent,
    params: { businessName, lowStockItems },
  });
}

/**
 * Send daily sales summary email
 */
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
  const topProductsList = salesData.topProducts.map(product => 
    `<li><strong>${product.name}</strong>: ${product.quantity} sold - ${product.revenue.toLocaleString()}</li>`
  ).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; background: #f9f9f9; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
        .products-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .products-box h3 { margin-top: 0; color: #333; }
        .products-list { list-style: none; padding: 0; }
        .products-list li { padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
        .products-list li:last-child { border-bottom: none; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Daily Sales Summary</h1>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>Here's your sales summary for <strong>${businessName}</strong> on ${salesData.date}:</p>
          
          <div class="metrics">
            <div class="metric">
              <div class="metric-value">${salesData.totalSales.toLocaleString()}</div>
              <div class="metric-label">Total Sales</div>
            </div>
            <div class="metric">
              <div class="metric-value">${salesData.totalProfit.toLocaleString()}</div>
              <div class="metric-label">Total Profit</div>
            </div>
            <div class="metric">
              <div class="metric-value">${salesData.transactionCount}</div>
              <div class="metric-label">Transactions</div>
            </div>
          </div>

          <div class="products-box">
            <h3>🏆 Top Selling Products</h3>
            <ul class="products-list">
              ${topProductsList}
            </ul>
          </div>

          <a href="https://busmo.com/dashboard/sales" class="button">View Full Report</a>
          <p>Best regards,<br>The Busmo Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Daily Sales Summary - ${businessName}`,
    htmlContent,
    params: { businessName, salesData },
  });
}

/**
 * Send credit payment reminder email
 */
export async function sendCreditPaymentReminderEmail(
  email: string,
  customerName: string,
  businessName: string,
  amount: number,
  dueDate: string
): Promise<any> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; background: #f9f9f9; }
        .amount-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #d97706; }
        .due-date { font-size: 14px; color: #666; margin-top: 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 Payment Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>This is a friendly reminder from <strong>${businessName}</strong> that you have a pending payment.</p>
          
          <div class="amount-box">
            <div class="amount">${amount.toLocaleString()}</div>
            <div class="due-date">Due: ${dueDate}</div>
          </div>

          <p>Please make your payment at your earliest convenience to avoid any late fees.</p>
          <a href="https://busmo.com/dashboard/credit" class="button">Make Payment</a>
          <p>If you have already made this payment, please disregard this notice.</p>
          <p>Thank you for your business!</p>
          <p>Best regards,<br>${businessName}</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name: customerName }],
    subject: `Payment Reminder - ${businessName}`,
    htmlContent,
    params: { customerName, businessName, amount, dueDate },
  });
}

// ═══════════════════════════════════════════
//  Contact Management Functions
// ═══════════════════════════════════════════

/**
 * Add a contact to Brevo
 */
export async function addContact(contact: Contact): Promise<any> {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key not configured');
  }

  try {
    const createContact = {
      email: contact.email,
      attributes: contact.attributes || {},
      listIds: contact.listIds || [],
    };

    const response = await brevoApi.post('/contacts', createContact);
    console.log('Contact added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw new Error('Failed to add contact');
  }
}

/**
 * Create a contact list
 */
export async function createContactList(list: ContactList): Promise<any> {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key not configured');
  }

  try {
    const createList = {
      name: list.name,
      folderId: list.folderId,
    };

    const response = await brevoApi.post('/lists', createList);
    console.log('Contact list created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating contact list:', error);
    throw new Error('Failed to create contact list');
  }
}

// ═══════════════════════════════════════════
//  Export
// ═══════════════════════════════════════════

export const BrevoService = {
  // Campaigns
  createCampaign,
  sendCampaign,
  scheduleCampaign,
  
  // Transactional emails
  sendTransactionalEmail,
  sendWelcomeEmail,
  sendStaffInvitationEmail,
  sendPasswordResetEmail,
  sendLowStockAlertEmail,
  sendDailySalesSummaryEmail,
  sendCreditPaymentReminderEmail,
  
  // Contact management
  addContact,
  createContactList,
};

export default BrevoService;
