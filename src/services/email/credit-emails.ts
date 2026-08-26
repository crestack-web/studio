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

export interface CustomerPaymentOverdueParams {
  email: string;
  customerName: string;
  businessName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  currency?: string;
}

export interface SupplierPaymentDueParams {
  email: string;
  name: string;
  businessName: string;
  supplierName: string;
  amount: number;
  dueDate: string;
  invoiceNumber?: string;
  currency?: string;
}

export interface SupplierPaymentOverdueParams {
  email: string;
  name: string;
  businessName: string;
  supplierName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  invoiceNumber?: string;
  currency?: string;
}

// Customer Payment Overdue Email
export async function sendCustomerPaymentOverdueEmail(params: CustomerPaymentOverdueParams): Promise<any> {
  const { email, customerName, businessName, amount, dueDate, daysOverdue, currency = 'NGN' } = params;
  
  const urgency = daysOverdue > 30 ? 'urgent' : daysOverdue > 14 ? 'high' : 'medium';
  const bgColor = urgency === 'urgent' ? '#FEE2E2' : urgency === 'high' ? '#FEF3C7' : '#DBEAFE';
  const borderColor = urgency === 'urgent' ? '#DC2626' : urgency === 'high' ? '#F59E0B' : '#3B82F6';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚠️ Payment Overdue</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: ${bgColor}; border: 2px solid ${borderColor}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: ${borderColor}; }
        .amount-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #E5E7EB; text-align: center; }
        .amount { font-size: 36px; font-weight: 700; color: ${borderColor}; margin: 10px 0; }
        .days-overdue { font-size: 14px; color: #6B7280; margin-top: 10px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('⚠️', 'Payment Overdue', 'Action required')}
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>This is a reminder that you have an overdue payment with <strong>${businessName}</strong>.</p>
          
          <div class="alert-box">
            <h2>${urgency === 'urgent' ? '🚨 Urgent: Payment Overdue' : urgency === 'high' ? '⚠️ Payment Overdue' : '📋 Payment Reminder'}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your payment is <strong>${daysOverdue} days</strong> overdue.</p>
          </div>

          <div class="amount-box">
            <div style="font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Amount Due</div>
            <div class="amount">${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}</div>
            <div class="days-overdue">Due Date: ${dueDate} • ${daysOverdue} days overdue</div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ How to Pay</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Visit ${businessName} to make payment in person</li>
              <li>Transfer to the business account</li>
              <li>Contact ${businessName} for alternative payment methods</li>
            </ul>
          </div>

          ${daysOverdue > 14 ? `
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">⚠️ Important Notice</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Please arrange payment as soon as possible to avoid any late fees or service interruptions.</p>
          </div>
          ` : ''}

          <a href="https://busmo.io" class="button">Contact Business</a>
          
          <p>If you have already made this payment, please disregard this notice and contact ${businessName} to confirm.</p>
          <p>Thank you for your business!</p>
          <p>Best regards,<br><strong>${businessName}</strong></p>
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
    subject: `⚠️ Payment Overdue - ${businessName}`,
    htmlContent,
  });
}

// Supplier Payment Due Email
export async function sendSupplierPaymentDueEmail(params: SupplierPaymentDueParams): Promise<any> {
  const { email, name, businessName, supplierName, amount, dueDate, invoiceNumber, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>💳 Supplier Payment Due</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .reminder-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .reminder-box h2 { margin-top: 0; color: #1E40AF; }
        .payment-details { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #E5E7EB; }
        .payment-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .payment-row:last-child { border-bottom: none; }
        .payment-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .payment-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('💳', 'Supplier Payment Due', 'Upcoming payment reminder')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>This is a reminder that <strong>${businessName}</strong> has an upcoming payment due to <strong>${supplierName}</strong>.</p>
          
          <div class="reminder-box">
            <h2>📅 Payment Reminder</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Please ensure sufficient funds are available to process this payment on time.</p>
          </div>

          <div class="payment-details">
            <div class="payment-row">
              <span class="payment-label">Supplier:</span>
              <span class="payment-value">${supplierName}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Amount:</span>
              <span class="payment-value">${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}</span>
            </div>
            ${invoiceNumber ? `
            <div class="payment-row">
              <span class="payment-label">Invoice Number:</span>
              <span class="payment-value">${invoiceNumber}</span>
            </div>
            ` : ''}
            <div class="payment-row">
              <span class="payment-label">Due Date:</span>
              <span class="payment-value">${dueDate}</span>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ Recommended Actions</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Verify the invoice details and amount</li>
              <li>Ensure sufficient funds in your business account</li>
              <li>Process payment before the due date</li>
              <li>Contact supplier if there are any discrepancies</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/suppliers" class="button">Manage Suppliers</a>
          
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
    subject: `💳 Supplier Payment Due - ${supplierName}`,
    htmlContent,
  });
}

// Supplier Payment Overdue Email
export async function sendSupplierPaymentOverdueEmail(params: SupplierPaymentOverdueParams): Promise<any> {
  const { email, name, businessName, supplierName, amount, dueDate, daysOverdue, invoiceNumber, currency = 'NGN' } = params;
  
  const urgency = daysOverdue > 30 ? 'urgent' : daysOverdue > 14 ? 'high' : 'medium';
  const bgColor = urgency === 'urgent' ? '#FEE2E2' : urgency === 'high' ? '#FEF3C7' : '#DBEAFE';
  const borderColor = urgency === 'urgent' ? '#DC2626' : urgency === 'high' ? '#F59E0B' : '#3B82F6';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🚨 Supplier Payment Overdue</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: ${bgColor}; border: 2px solid ${borderColor}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: ${borderColor}; }
        .payment-details { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #E5E7EB; }
        .payment-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .payment-row:last-child { border-bottom: none; }
        .payment-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .payment-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🚨', 'Supplier Payment Overdue', 'Immediate attention required')}
        <div class="content">
          <p>Hi ${name},</p>
          <p><strong>${businessName}</strong> has an overdue payment to <strong>${supplierName}</strong> that requires immediate attention.</p>
          
          <div class="alert-box">
            <h2>${urgency === 'urgent' ? '🚨 Urgent: Payment Overdue' : urgency === 'high' ? '⚠️ Payment Overdue' : '📋 Payment Reminder'}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">This payment is <strong>${daysOverdue} days</strong> overdue.</p>
          </div>

          <div class="payment-details">
            <div class="payment-row">
              <span class="payment-label">Supplier:</span>
              <span class="payment-value">${supplierName}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Amount:</span>
              <span class="payment-value">${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}</span>
            </div>
            ${invoiceNumber ? `
            <div class="payment-row">
              <span class="payment-label">Invoice Number:</span>
              <span class="payment-value">${invoiceNumber}</span>
            </div>
            ` : ''}
            <div class="payment-row">
              <span class="payment-label">Due Date:</span>
              <span class="payment-value">${dueDate}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Days Overdue:</span>
              <span class="payment-value" style="color: ${borderColor}; font-weight: 700;">${daysOverdue} days</span>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ Recommended Actions</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Contact ${supplierName} immediately to discuss payment</li>
              <li>Process payment as soon as possible</li>
              <li>Negotiate a payment plan if needed</li>
              <li>Document all communication for your records</li>
            </ul>
          </div>

          ${daysOverdue > 14 ? `
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">⚠️ Business Impact</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Overdue supplier payments may result in:</p>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Delayed future shipments</li>
              <li>Damaged supplier relationships</li>
              <li>Potential late fees or interest charges</li>
              <li>Difficulty securing credit with suppliers</li>
            </ul>
          </div>
          ` : ''}

          <a href="https://busmo.io/dashboard/suppliers" class="button">Manage Suppliers</a>
          
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
    subject: `🚨 Supplier Payment Overdue - ${supplierName}`,
    htmlContent,
  });
}
