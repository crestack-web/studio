import { sendTransactionalEmail } from './brevo-service';

export interface TrialReminderParams {
  email: string;
  name: string;
  businessName: string;
  daysRemaining: number;
  trialEndDate: string;
}

export interface SubscriptionReceiptParams {
  email: string;
  name: string;
  businessName: string;
  planName: string;
  amount: number;
  currency: string;
  transactionId: string;
  billingPeriod: string;
  nextBillingDate: string;
}

export interface DailySummaryParams {
  email: string;
  name: string;
  businessName: string;
  date: string;
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  transactionCount: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  insights: string[];
  currency?: string;
}

export interface BusinessInsightParams {
  email: string;
  name: string;
  businessName: string;
  insights: Array<{
    category: 'global' | 'local';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    actionUrl: string;
    impact: string;
  }>;
  generatedAt: string;
}

// Trial Reminder Emails
export async function sendTrialReminderEmail(params: TrialReminderParams): Promise<any> {
  const { email, name, businessName, daysRemaining, trialEndDate } = params;
  
  let urgency = 'info';
  let subject = '';
  let headline = '';
  let message = '';

  if (daysRemaining <= 1) {
    urgency = 'urgent';
    subject = `⚠️ Your Busmo trial ends tomorrow - Act now!`;
    headline = 'Your Trial Ends Tomorrow';
    message = `Your free trial of Busmo for <strong>${businessName}</strong> ends tomorrow on <strong>${trialEndDate}</strong>.`;
  } else if (daysRemaining <= 3) {
    urgency = 'warning';
    subject = `⏰ 3 days left in your Busmo trial`;
    headline = '3 Days Remaining';
    message = `Your free trial of Busmo for <strong>${businessName}</strong> ends in 3 days on <strong>${trialEndDate}</strong>.`;
  } else {
    urgency = 'info';
    subject = `📅 ${daysRemaining} days left in your Busmo trial`;
    headline = `${daysRemaining} Days Remaining`;
    message = `Your free trial of Busmo for <strong>${businessName}</strong> ends in ${daysRemaining} days on <strong>${trialEndDate}</strong>.`;
  }

  const bgColor = urgency === 'urgent' ? '#FEE2E2' : urgency === 'warning' ? '#FEF3C7' : '#DBEAFE';
  const borderColor = urgency === 'urgent' ? '#DC2626' : urgency === 'warning' ? '#F59E0B' : '#3B82F6';
  const iconColor = urgency === 'urgent' ? '#DC2626' : urgency === 'warning' ? '#F59E0B' : '#3B82F6';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: ${borderColor}; font-size: 20px; }
        .feature-list { background: #F3EFFE; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .feature-list strong { color: #6B3FE7; }
        .cta-box { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .button { display: inline-block; padding: 16px 40px; background: white; color: #6B3FE7; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 10px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 48px; margin-bottom: 10px;">${iconColor === '#DC2626' ? '🚨' : iconColor === '#F59E0B' ? '⏰' : '📅'}</div>
          <h1>${headline}</h1>
          <p>Don't lose access to your business data</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>${message}</p>
          
          <div class="alert-box">
            <h2>${urgency === 'urgent' ? '⚠️ Urgent: Action Required' : urgency === 'warning' ? '⏰ Time is Running Out' : '📊 Plan Your Next Steps'}</h2>
            <p><strong>What happens when your trial ends?</strong></p>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>✓ Your data is <strong>safe and preserved</strong></li>
              <li>✓ You can <strong>upgrade anytime</strong> to restore full access</li>
              <li>✓ All your settings and configurations remain intact</li>
            </ul>
          </div>

          <div class="feature-list">
            <strong>Your Current Access (Starter Plan):</strong><br>
            ✓ Record Sales & Expenses • Track Inventory • Basic Reports • Ask MO AI (10 msgs/day)
          </div>

          ${daysRemaining <= 3 ? `
          <div class="cta-box">
            <h2>Upgrade Now & Save 20%</h2>
            <p style="margin: 15px 0;">Upgrade in the next <strong>${daysRemaining} days</strong> and get <strong>20% off</strong> your first month!</p>
            <a href="https://busmo.io/plans" class="button">View Plans & Upgrade</a>
          </div>
          ` : `
          <div class="cta-box">
            <h2>Ready to Continue?</h2>
            <p style="margin: 15px 0;">Choose a plan that fits your business needs.</p>
            <a href="https://busmo.io/plans" class="button">View Plans</a>
          </div>
          `}

          <p><strong>Need help deciding?</strong> Try our <a href="https://busmo.io/pricing">interactive plan comparison</a> or contact our support team at <a href="mailto:support@busmo.io">support@busmo.io</a>.</p>
          
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

// Subscription Receipt Email
export async function sendSubscriptionReceiptEmail(params: SubscriptionReceiptParams): Promise<any> {
  const { email, name, businessName, planName, amount, currency, transactionId, billingPeriod, nextBillingDate } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - Busmo Subscription</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .header p { margin: 12px 0 0; font-size: 16px; opacity: 0.95; }
        .content { padding: 40px 30px; background: #fff; }
        .receipt-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #E5E7EB; }
        .receipt-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .receipt-row:last-child { border-bottom: none; }
        .receipt-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .receipt-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .receipt-total { background: #F3EFFE; padding: 20px; border-radius: 8px; margin-top: 15px; }
        .receipt-total .receipt-row { border-bottom: none; padding: 8px 0; }
        .receipt-total .receipt-label { font-size: 16px; color: #6B3FE7; }
        .receipt-total .receipt-value { font-size: 20px; color: #6B3FE7; }
        .plan-badge { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 15px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .success-icon { font-size: 64px; text-align: center; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Payment Confirmed!</h1>
          <p>Your subscription has been activated</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for upgrading your <strong>${businessName}</strong> account to the <strong>${planName}</strong> plan. Your payment has been processed successfully.</p>
          
          <div class="receipt-box">
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="plan-badge">${planName} Plan</span>
            </div>
            
            <div class="receipt-row">
              <span class="receipt-label">Business:</span>
              <span class="receipt-value">${businessName}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Plan:</span>
              <span class="receipt-value">${planName}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Billing Period:</span>
              <span class="receipt-value">${billingPeriod}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Transaction ID:</span>
              <span class="receipt-value">${transactionId}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Date:</span>
              <span class="receipt-value">${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <div class="receipt-total">
              <div class="receipt-row">
                <span class="receipt-label">Amount Paid:</span>
                <span class="receipt-value">${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Next Billing Date:</span>
                <span class="receipt-value" style="font-size: 14px;">${nextBillingDate}</span>
              </div>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">🎉 You're All Set!</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Your account has been upgraded and all ${planName} features are now available. Start exploring your enhanced dashboard!</p>
          </div>

          <a href="https://busmo.io/dashboard" class="button">Go to Your Dashboard</a>
          
          <p style="margin-top: 30px;">Questions? Contact us at <a href="mailto:support@busmo.io">support@busmo.io</a></p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
          <p style="margin-top: 8px; font-size: 12px;">
            <a href="mailto:support@busmo.io">Contact Support</a> • 
            <a href="https://busmo.io/privacy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: `✅ Payment Confirmed - ${planName} Plan Activated`,
    htmlContent,
  });
}

// Daily Business Summary Email
export async function sendDailyBusinessSummaryEmail(params: DailySummaryParams): Promise<any> {
  const { email, name, businessName, date, totalSales, totalProfit, totalExpenses, transactionCount, topProducts, insights, currency = 'NGN' } = params;
  
  const topProductsList = topProducts.map((product, index) => `
    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
      <div style="flex: 1;">
        <span style="font-weight: 600; color: #6B3FE7;">#${index + 1}</span>
        <span style="margin-left: 8px; color: #0A0A0F;">${product.name}</span>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 600; color: #0A0A0F;">${product.quantity} sold</div>
        <div style="font-size: 12px; color: #6B7280;">${product.revenue.toLocaleString()}</div>
      </div>
    </div>
  `).join('');

  const insightsList = insights.map(insight => `
    <li style="padding: 8px 0; color: #555; font-size: 14px;">${insight}</li>
  `).join('');

  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Business Summary - ${businessName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 12px 0 0; font-size: 16px; opacity: 0.95; }
        .content { padding: 40px 30px; background: #fff; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .metric-card { background: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .metric-value { font-size: 24px; font-weight: 700; color: #6B3FE7; margin-bottom: 5px; }
        .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .metric-positive { color: #10B981; }
        .metric-neutral { color: #F59E0B; }
        .products-box { background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .products-box h3 { margin-top: 0; color: #0A0A0F; font-size: 18px; }
        .insights-box { background: #F3EFFE; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #6B3FE7; }
        .insights-box h3 { margin-top: 0; color: #6B3FE7; font-size: 16px; }
        .insights-box ul { margin: 0; padding-left: 20px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
          <h1>Daily Business Summary</h1>
          <p>${businessName} • ${new Date(date).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Here's your business performance for yesterday:</p>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${currency === 'NGN' ? '₦' : '$'}${totalSales.toLocaleString()}</div>
              <div class="metric-label">Total Sales</div>
            </div>
            <div class="metric-card">
              <div class="metric-value metric-positive">${currency === 'NGN' ? '₦' : '$'}${totalProfit.toLocaleString()}</div>
              <div class="metric-label">Net Profit</div>
            </div>
            <div class="metric-card">
              <div class="metric-value metric-neutral">${currency === 'NGN' ? '₦' : '$'}${totalExpenses.toLocaleString()}</div>
              <div class="metric-label">Total Expenses</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${profitMargin}%</div>
              <div class="metric-label">Profit Margin</div>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #555;">
              <strong>Transactions:</strong> ${transactionCount} • 
              <strong>Profit Margin:</strong> ${profitMargin}%
            </p>
          </div>

          ${topProducts.length > 0 ? `
          <div class="products-box">
            <h3>🏆 Top Selling Products</h3>
            ${topProductsList}
          </div>
          ` : ''}

          ${insights.length > 0 ? `
          <div class="insights-box">
            <h3>💡 AI Insights from Ask Mo</h3>
            <ul>
              ${insightsList}
            </ul>
          </div>
          ` : ''}
          
          <a href="https://busmo.io/dashboard" class="button">View Full Dashboard</a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
            This is an automated daily summary. You can manage your notification preferences in Settings.
          </p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
          <p style="margin-top: 8px; font-size: 12px;">
            <a href="mailto:support@busmo.io">Contact Support</a> • 
            <a href="https://busmo.io">Visit Website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: `📊 Daily Business Summary - ${businessName} - ${new Date(date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}`,
    htmlContent,
  });
}

// Business Insights Email with Actionable Recommendations
export async function sendBusinessInsightsEmail(params: BusinessInsightParams): Promise<any> {
  const { email, name, businessName, insights, generatedAt } = params;
  
  const globalInsights = insights.filter(i => i.category === 'global');
  const localInsights = insights.filter(i => i.category === 'local');
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch(priority) {
      case 'high': return '#FEE2E2';
      case 'medium': return '#FEF3C7';
      case 'low': return '#DBEAFE';
      default: return '#F3F4F6';
    }
  };

  const renderInsights = (insightList: typeof insights) => {
    if (insightList.length === 0) return '';
    
    return insightList.map(insight => `
      <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid ${getPriorityColor(insight.priority)}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
          <div style="background: ${getPriorityBg(insight.priority)}; color: ${getPriorityColor(insight.priority)}; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">
            ${insight.priority}
          </div>
          <h4 style="margin: 0; color: #0A0A0F; font-size: 16px; flex: 1;">${insight.title}</h4>
        </div>
        
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 10px 0;">${insight.description}</p>
        
        <div style="background: #F3EFFE; border-left: 3px solid #6B3FE7; padding: 12px; margin: 12px 0; border-radius: 6px;">
          <p style="margin: 0; font-size: 13px; color: #6B3FE7;"><strong>💡 Impact:</strong> ${insight.impact}</p>
        </div>
        
        <a href="${insight.actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; box-shadow: 0 2px 4px rgba(107, 63, 231, 0.2);">
          ${insight.action} →
        </a>
      </div>
    `).join('');
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Business Insights & Recommendations - ${businessName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 12px 0 0; font-size: 16px; opacity: 0.95; }
        .content { padding: 40px 30px; background: #fff; }
        .section-title { font-size: 20px; font-weight: 700; color: #0A0A0F; margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 3px solid #6B3FE7; }
        .insight-card { background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #6B3FE7; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .empty-state { background: #F9FAFB; padding: 30px; border-radius: 12px; text-align: center; color: #6B7280; }
        .timestamp { font-size: 12px; color: #9CA3AF; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
          <h1>Business Insights & Recommendations</h1>
          <p>${businessName}</p>
          <p class="timestamp">Generated on ${new Date(generatedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Based on your business data and industry trends, here are personalized insights to help you grow:</p>
          
          ${globalInsights.length > 0 ? `
          <h2 class="section-title">🌍 Market & Industry Insights</h2>
          <p style="color: #6B7280; font-size: 14px; margin-bottom: 15px;">Opportunities and trends affecting businesses like yours globally and in Nigeria</p>
          ${renderInsights(globalInsights)}
          ` : ''}

          ${localInsights.length > 0 ? `
          <h2 class="section-title">📍 Your Business Performance</h2>
          <p style="color: #6B7280; font-size: 14px; margin-bottom: 15px;">Specific recommendations based on your actual business data</p>
          ${renderInsights(localInsights)}
          ` : ''}

          ${insights.length === 0 ? `
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
            <h3>No Insights Available Yet</h3>
            <p>Keep using Busmo to generate AI-powered insights for your business.</p>
          </div>
          ` : ''}
          
          <a href="https://busmo.io/dashboard" class="button">View Complete Dashboard</a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
            <strong>Want to take action?</strong> Click on any insight above to navigate directly to the relevant section of your dashboard. These insights are updated daily based on your business performance.
          </p>
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. Built for African commerce</p>
          <p style="margin-top: 8px; font-size: 12px;">
            <a href="mailto:support@busmo.io">Contact Support</a> • 
            <a href="https://busmo.io/pricing">Upgrade Plan</a> • 
            <a href="https://busmo.io">Visit Website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: `🎯 Business Insights & Recommendations - ${businessName}`,
    htmlContent,
  });
}

// Password Reset Confirmation Email
export async function sendPasswordResetConfirmationEmail(email: string, name: string): Promise<any> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .header p { margin: 12px 0 0; font-size: 16px; opacity: 0.95; }
        .content { padding: 40px 30px; background: #fff; }
        .success-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        .security-tips { background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; }
        .security-tips h3 { margin-top: 0; color: #D97706; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 64px; margin-bottom: 15px;">🔒</div>
          <h1>Password Reset Successful</h1>
          <p>Your password has been updated</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>This email confirms that your Busmo account password has been successfully reset.</p>
          
          <div class="success-box">
            <h3 style="margin-top: 0; color: #065F46;">✅ What Changed?</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Your password has been updated</li>
              <li>All active sessions remain valid</li>
              <li>Your data is secure and unchanged</li>
            </ul>
          </div>

          <div class="security-tips">
            <h3>🛡️ Security Tips</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Use a strong, unique password for your Busmo account</li>
              <li>Don't share your password with anyone</li>
              <li>Enable two-factor authentication when available</li>
              <li>Log out from shared devices</li>
            </ul>
          </div>
          
          <a href="https://busmo.io/dashboard" class="button">Go to Dashboard</a>
          
          <p style="margin-top: 30px;"><strong>Didn't request this change?</strong></p>
          <p style="color: #555; font-size: 14px;">If you did not request a password reset, please contact our support team immediately at <a href="mailto:support@busmo.io">support@busmo.io</a>.</p>
          
          <p>Best regards,<br><strong>The Busmo Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Busmo. All rights reserved.</p>
          <p style="margin-top: 8px; font-size: 12px;">
            <a href="mailto:support@busmo.io">Contact Support</a> • 
            <a href="https://busmo.io">Visit Website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: '🔒 Password Reset Successful - Busmo',
    htmlContent,
  });
}

export const SubscriptionEmailsService = {
  sendTrialReminderEmail,
  sendSubscriptionReceiptEmail,
  sendDailyBusinessSummaryEmail,
  sendBusinessInsightsEmail,
  sendPasswordResetConfirmationEmail,
};