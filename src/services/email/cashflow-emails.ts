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

export interface LargeExpenseAlertParams {
  email: string;
  name: string;
  businessName: string;
  expenseAmount: number;
  expenseCategory: string;
  expenseDescription: string;
  averageExpense: number;
  currency?: string;
}

export interface UnusualSpendingAlertParams {
  email: string;
  name: string;
  businessName: string;
  period: string;
  totalSpending: number;
  averageSpending: number;
  variancePercentage: number;
  unusualCategories: Array<{ category: string; amount: number; average: number }>;
  currency?: string;
}

export interface NegativeCashflowWarningParams {
  email: string;
  name: string;
  businessName: string;
  currentCashflow: number;
  period: string;
  mainCauses: string[];
  recommendations: string[];
  currency?: string;
}

export interface PositiveCashflowAchievementParams {
  email: string;
  name: string;
  businessName: string;
  cashflowAmount: number;
  period: string;
  growthRate: number;
  achievementType: 'daily' | 'weekly' | 'monthly';
  currency?: string;
}

// Large Expense Alert Email
export async function sendLargeExpenseAlertEmail(params: LargeExpenseAlertParams): Promise<any> {
  const { email, name, businessName, expenseAmount, expenseCategory, expenseDescription, averageExpense, currency = 'NGN' } = params;
  
  const variance = ((expenseAmount - averageExpense) / averageExpense * 100).toFixed(0);
  const isSignificantlyHigher = expenseAmount > averageExpense * 1.5;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>💰 Large Expense Alert</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: ${isSignificantlyHigher ? '#FEE2E2' : '#FEF3C7'}; border: 2px solid ${isSignificantlyHigher ? '#DC2626' : '#F59E0B'}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: ${isSignificantlyHigher ? '#DC2626' : '#D97706'}; }
        .expense-details { background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .expense-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .expense-row:last-child { border-bottom: none; }
        .expense-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .expense-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('💰', 'Large Expense Alert', 'Unusual expense detected')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We detected an unusually large expense in <strong>${businessName}</strong>:</p>
          
          <div class="alert-box">
            <h2>${isSignificantlyHigher ? '🚨 Significantly Higher Than Average' : '⚠️ Above Average Expense'}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">This expense is <strong>${variance}%</strong> ${isSignificantlyHigher ? 'higher' : 'above'} your usual spending for this category.</p>
          </div>

          <div class="expense-details">
            <div class="expense-row">
              <span class="expense-label">Amount:</span>
              <span class="expense-value">${currency === 'NGN' ? '₦' : '$'}${expenseAmount.toLocaleString()}</span>
            </div>
            <div class="expense-row">
              <span class="expense-label">Category:</span>
              <span class="expense-value">${expenseCategory}</span>
            </div>
            <div class="expense-row">
              <span class="expense-label">Description:</span>
              <span class="expense-value">${expenseDescription}</span>
            </div>
            <div class="expense-row">
              <span class="expense-label">Your Average:</span>
              <span class="expense-value">${currency === 'NGN' ? '₦' : '$'}${averageExpense.toLocaleString()}</span>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ Recommended Actions</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Verify this expense was intentional</li>
              <li>Check if this is a one-time or recurring expense</li>
              <li>Review if this aligns with your budget</li>
              <li>Consider if there are more cost-effective alternatives</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/expenses" class="button">View Expenses</a>
          
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
    subject: `💰 Large Expense Alert - ${businessName}`,
    htmlContent,
  });
}

// Unusual Spending Alert Email
export async function sendUnusualSpendingAlertEmail(params: UnusualSpendingAlertParams): Promise<any> {
  const { email, name, businessName, period, totalSpending, averageSpending, variancePercentage, unusualCategories, currency = 'NGN' } = params;
  
  const categoriesList = unusualCategories.map(cat => `
    <div style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
      <div style="font-weight: 600; color: #0A0A0F;">${cat.category}</div>
      <div style="font-size: 12px; color: #6B7280;">
        Spent: ${currency === 'NGN' ? '₦' : '$'}${cat.amount.toLocaleString()} • 
        Average: ${currency === 'NGN' ? '₦' : '$'}${cat.average.toLocaleString()}
      </div>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📊 Unusual Spending Alert</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: #1E40AF; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .metric-card { background: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .metric-value { font-size: 24px; font-weight: 700; color: #6B3FE7; margin-bottom: 5px; }
        .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .categories-box { background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .categories-box h3 { margin-top: 0; color: #0A0A0F; font-size: 18px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('📊', 'Unusual Spending Alert', 'Spending pattern anomaly detected')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We detected unusual spending patterns in <strong>${businessName}</strong> for <strong>${period}</strong>:</p>
          
          <div class="alert-box">
            <h2>📈 Spending Variance Detected</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Your spending is <strong>${variancePercentage}%</strong> ${variancePercentage > 0 ? 'higher' : 'lower'} than your usual patterns.</p>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${currency === 'NGN' ? '₦' : '$'}${totalSpending.toLocaleString()}</div>
              <div class="metric-label">This ${period}</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${currency === 'NGN' ? '₦' : '$'}${averageSpending.toLocaleString()}</div>
              <div class="metric-label">Usually</div>
            </div>
          </div>

          ${unusualCategories.length > 0 ? `
          <div class="categories-box">
            <h3>🔍 Unusual Categories</h3>
            ${categoriesList}
          </div>
          ` : ''}

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">✅ Recommended Actions</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Review the unusual categories above</li>
              <li>Verify if these expenses are necessary</li>
              <li>Check for any duplicate or erroneous entries</li>
              <li>Consider adjusting your budget if needed</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/expenses" class="button">Review Expenses</a>
          
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
    subject: `📊 Unusual Spending Alert - ${businessName}`,
    htmlContent,
  });
}

// Negative Cashflow Warning Email
export async function sendNegativeCashflowWarningEmail(params: NegativeCashflowWarningParams): Promise<any> {
  const { email, name, businessName, currentCashflow, period, mainCauses, recommendations, currency = 'NGN' } = params;
  
  const causesList = mainCauses.map(cause => `<li style="padding: 8px 0;">${cause}</li>`).join('');
  const recommendationsList = recommendations.map(rec => `<li style="padding: 8px 0;">${rec}</li>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚠️ Negative Cashflow Warning</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .alert-box { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box h2 { margin-top: 0; color: #DC2626; }
        .cashflow-display { background: #FEE2E2; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .cashflow-amount { font-size: 48px; font-weight: 700; color: #DC2626; margin: 10px 0; }
        .causes-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .causes-box h3 { margin-top: 0; color: #D97706; }
        .recommendations-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .recommendations-box h3 { margin-top: 0; color: #065F46; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('⚠️', 'Negative Cashflow Warning', 'Immediate attention required')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your business <strong>${businessName}</strong> is experiencing negative cashflow for <strong>${period}</strong>:</p>
          
          <div class="alert-box">
            <h2>🚨 Cashflow Alert</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Negative cashflow means more money is going out than coming in. This requires immediate attention.</p>
          </div>

          <div class="cashflow-display">
            <div style="font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Current Cashflow</div>
            <div class="cashflow-amount">${currency === 'NGN' ? '₦' : '$'}${currentCashflow.toLocaleString()}</div>
            <div style="color: #DC2626; font-weight: 600;"><span style="font-size: 24px;">↓</span> Negative</div>
          </div>

          <div class="causes-box">
            <h3>🔍 Main Causes</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${causesList}
            </ul>
          </div>

          <div class="recommendations-box">
            <h3>✅ Recommended Actions</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${recommendationsList}
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/cashflow" class="button">View Cashflow Details</a>
          
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
    subject: `⚠️ Negative Cashflow Warning - ${businessName}`,
    htmlContent,
  });
}

// Positive Cashflow Achievement Email
export async function sendPositiveCashflowAchievementEmail(params: PositiveCashflowAchievementParams): Promise<any> {
  const { email, name, businessName, cashflowAmount, period, growthRate, achievementType, currency = 'NGN' } = params;
  
  const periodText = achievementType === 'daily' ? 'today' : achievementType === 'weekly' ? 'this week' : 'this month';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎉 Positive Cashflow Achievement</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .celebration-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .celebration-box h2 { margin: 0 0 10px; font-size: 32px; }
        .celebration-box .amount { font-size: 48px; font-weight: 700; margin: 15px 0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .metric-card { background: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .metric-value { font-size: 24px; font-weight: 700; color: #10B981; margin-bottom: 5px; }
        .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🎉', 'Cashflow Achievement!', 'Great job managing your finances')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Congratulations! <strong>${businessName}</strong> has achieved positive cashflow <strong>${periodText}</strong>:</p>
          
          <div class="celebration-box">
            <h2>🎊 Positive Cashflow!</h2>
            <p style="margin: 0; font-size: 18px;">More money coming in than going out</p>
            <div class="amount">${currency === 'NGN' ? '₦' : '$'}${cashflowAmount.toLocaleString()}</div>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">Growth Rate: ${growthRate > 0 ? '+' : ''}${growthRate}%</p>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${currency === 'NGN' ? '₦' : '$'}${cashflowAmount.toLocaleString()}</div>
              <div class="metric-label">Net Cashflow</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${growthRate > 0 ? '📈' : '📉'} ${Math.abs(growthRate)}%</div>
              <div class="metric-label">Growth Rate</div>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">💡 Why This Matters</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Positive cashflow means your business is generating more cash than it's spending. This is a sign of healthy financial management and provides flexibility for growth.</p>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">🚀 Next Steps</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Consider reinvesting surplus cash into growth</li>
              <li>Build up your cash reserves for future opportunities</li>
              <li>Review your pricing strategy to maximize profitability</li>
              <li>Use Ask Mo to identify further optimization opportunities</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard/cashflow" class="button">View Cashflow Details</a>
          
          <p>Keep up the great work managing your business finances!</p>
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
    subject: `🎉 Positive Cashflow Achievement - ${businessName}`,
    htmlContent,
  });
}
