import { sendTransactionalEmail } from './brevo-service';

const BUSMO_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAAtGVYSWZJSSoACAAAAAYAEgEDAAEAAAABAAAAGgEFAAEAAABWAAAAGwEFAAEAAABeAAAAKAEDAAEAAAACAAAAEwIDAAEAAAABAAAAaYcEAAEAAABmAAAAAAAAAGAAAAABAAAAYAAAAAEAAAAGAACQBwAEAAAAMDIxMAGRBwAEAAAAAQIDAACgBwAEAAAAMDEwMAGgAwABAAAA//8AAAKgBAABAAAA9AEAAAOgBAABAAAA9AEAAAAAAAAA4cNEAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF1mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTAyLTA3PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUctd2xCT0lvMCZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBR3kzUUpfNGlZJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0JBR3kzZTVObENvJnF1b3Q7LCZxdW90O3RlbXBsYXRlJnF1b3Q7OiZxdW90O09yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyZxdW90O308L0F0dHJpYjpEYXRhPgogICAgIDxBdHRyaWI6RXh0SWQ+M2YyZTNkNTEtOTA0OS00YmM4LTkwZjAtMTcxMGZmYzFkYjQ2PC9BdHRyaWI6RXh0SWQ+CiAgICAgPEF0dHJpYjpGYklkPjUyNTI2NTkxNDE3OTU4MDwvQXR0cmliOkZiSWQ+CiAgICAgPEF0dHJpYjpUb3VjaFR5cGU+MjwvQXR0cmliOlRvdWNoVHlwZT4KICAgIDwvcmRmOmxpPgogICA8L3JkZjpTZXE+CiAgPC9BdHRyaWI6QWRzPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkYz0naHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8nPgogIDxkYzp0aXRsZT4KICAgPHJkZjpBbHQ+CiAgICA8cmRmOmxpIHhtbDpsYW5nPSd4LWRlZmF1bHQnPk9yYW5nZSBCbGFjayBCb2xkIFN0YXJ0dXAgSCBMZXR0ZXIgTG9nbyAtIDI8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnBkZj0naHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyc+CiAgPHBkZjpBdXRob3I+dGFoZWVyYXRmb29kczwvcGRmOkF1dGhvcj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoK';

const getEmailHeader = (icon: string, title: string, subtitle: string) => `
  <div style="padding: 40px 30px; text-align: center; color: white; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); position: relative; overflow: hidden;">
    <div style="position: relative; z-index: 1;">
      <img src="${BUSMO_LOGO}" alt="Busmo Logo" style="width: 80px; height: 80px; margin-bottom: 16px; display: inline-block; border-radius: 16px; background: white; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <h1 style="margin: 16px 0 8px; font-size: 28px; font-weight: 700; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.95; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${subtitle}</p>
    </div>
  </div>
`;

export interface FirstSaleCelebrationParams {
  email: string;
  name: string;
  businessName: string;
  saleAmount: number;
  productName: string;
  currency?: string;
}

export interface StatementDownloadedParams {
  email: string;
  name: string;
  businessName: string;
  reportName: string;
  reportType: string;
  dateGenerated: string;
  reportingPeriod: string;
  currency?: string;
}

export interface WeeklyReportParams {
  email: string;
  name: string;
  businessName: string;
  weekStartDate: string;
  weekEndDate: string;
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  transactionCount: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  insights: string[];
  currency?: string;
}

export interface MonthlyReportParams {
  email: string;
  name: string;
  businessName: string;
  month: string;
  year: number;
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  transactionCount: number;
  growthRate: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  aiRecommendations: Array<{ title: string; description: string; impact: string }>;
  currency?: string;
}

// First Sale Celebration Email
export async function sendFirstSaleCelebrationEmail(params: FirstSaleCelebrationParams): Promise<any> {
  const { email, name, businessName, saleAmount, productName, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎉 Your First Sale!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .celebration-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .celebration-box h2 { margin: 0 0 10px; font-size: 32px; }
        .celebration-box .amount { font-size: 48px; font-weight: 700; margin: 15px 0; }
        .milestone-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .milestone-box h3 { margin-top: 0; color: #065F46; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🎉', 'Congratulations!', 'Your First Sale on Busmo')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>This is a big moment! You just recorded your first sale on Busmo for <strong>${businessName}</strong>.</p>
          
          <div class="celebration-box">
            <h2>🎊 First Sale Recorded!</h2>
            <p style="margin: 0; font-size: 18px;">Product: <strong>${productName}</strong></p>
            <div class="amount">${currency === 'NGN' ? '₦' : '$'}${saleAmount.toLocaleString()}</div>
            <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9;">You're officially on your way to business success!</p>
          </div>

          <div class="milestone-box">
            <h3>🚀 What's Next?</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Keep recording every sale to build your data</li>
              <li>Use Ask Mo to get insights about your performance</li>
              <li>Track your inventory to never run out of stock</li>
              <li>Set up staff accounts to delegate tasks</li>
            </ul>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #D97706;">💡 Pro Tip</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Consistency is key! Record every sale, even the small ones. This data becomes powerful insights that help you grow.</p>
          </div>

          <a href="https://busmo.io/dashboard" class="button">View Your Dashboard</a>
          
          <p>Congratulations again on this milestone. Here's to many more sales!</p>
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
    subject: '🎉 Congratulations! Your First Sale on Busmo',
    htmlContent,
  });
}

// Statement Downloaded Email
export async function sendStatementDownloadedEmail(params: StatementDownloadedParams): Promise<any> {
  const { email, name, businessName, reportName, reportType, dateGenerated, reportingPeriod, currency = 'NGN' } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Statement Downloaded - ${reportName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .report-box { background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #E5E7EB; }
        .report-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
        .report-row:last-child { border-bottom: none; }
        .report-label { font-weight: 600; color: #6B7280; font-size: 14px; }
        .report-value { font-weight: 600; color: #0A0A0F; font-size: 14px; }
        .security-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .security-box h3 { margin-top: 0; color: #D97706; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('📄', 'Statement Downloaded', 'Your report is ready')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>This email confirms that you downloaded a report from Busmo for <strong>${businessName}</strong>.</p>
          
          <div class="report-box">
            <div class="report-row">
              <span class="report-label">Report Name:</span>
              <span class="report-value">${reportName}</span>
            </div>
            <div class="report-row">
              <span class="report-label">Report Type:</span>
              <span class="report-value">${reportType}</span>
            </div>
            <div class="report-row">
              <span class="report-label">Date Generated:</span>
              <span class="report-value">${dateGenerated}</span>
            </div>
            <div class="report-row">
              <span class="report-label">Reporting Period:</span>
              <span class="report-value">${reportingPeriod}</span>
            </div>
          </div>

          <div class="security-box">
            <h3>🔒 Security Notice</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">If you did not initiate this download, please contact our support team immediately at <a href="mailto:support@busmo.io" style="color: #6B3FE7;">support@busmo.io</a>.</p>
          </div>

          <a href="https://busmo.io/dashboard" class="button">Go to Dashboard</a>
          
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
    subject: `📄 Statement Downloaded - ${reportName}`,
    htmlContent,
  });
}

// Weekly Business Report Email
export async function sendWeeklyBusinessReportEmail(params: WeeklyReportParams): Promise<any> {
  const { email, name, businessName, weekStartDate, weekEndDate, totalRevenue, totalProfit, totalExpenses, transactionCount, topProducts, insights, currency = 'NGN' } = params;
  
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

  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Business Report - ${businessName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .metric-card { background: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .metric-value { font-size: 24px; font-weight: 700; color: #6B3FE7; margin-bottom: 5px; }
        .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
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
        ${getEmailHeader('📊', 'Weekly Business Report', `${businessName} • ${weekStartDate} to ${weekEndDate}`)}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Here's your weekly business performance summary:</p>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${currency === 'NGN' ? '₦' : '$'}${totalRevenue.toLocaleString()}</div>
              <div class="metric-label">Total Revenue</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #10B981;">${currency === 'NGN' ? '₦' : '$'}${totalProfit.toLocaleString()}</div>
              <div class="metric-label">Net Profit</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #F59E0B;">${currency === 'NGN' ? '₦' : '$'}${totalExpenses.toLocaleString()}</div>
              <div class="metric-label">Total Expenses</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${transactionCount}</div>
              <div class="metric-label">Transactions</div>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #555;">
              <strong>Profit Margin:</strong> ${profitMargin}% • 
              <strong>Average Transaction:</strong> ${transactionCount > 0 ? (totalRevenue / transactionCount).toFixed(0) : 0}
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
            <h3>💡 Weekly Insights</h3>
            <ul>
              ${insightsList}
            </ul>
          </div>
          ` : ''}
          
          <a href="https://busmo.io/dashboard" class="button">View Full Dashboard</a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
            This is an automated weekly report. You can manage your notification preferences in Settings.
          </p>
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
    subject: `📊 Weekly Business Report - ${businessName}`,
    htmlContent,
  });
}

// Monthly Business Report Email
export async function sendMonthlyBusinessReportEmail(params: MonthlyReportParams): Promise<any> {
  const { email, name, businessName, month, year, totalRevenue, totalProfit, totalExpenses, transactionCount, growthRate, topProducts, aiRecommendations, currency = 'NGN' } = params;
  
  const topProductsList = topProducts.slice(0, 5).map((product, index) => `
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

  const recommendationsList = aiRecommendations.map(rec => `
    <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #6B3FE7; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <h4 style="margin: 0 0 10px; color: #0A0A0F; font-size: 16px;">${rec.title}</h4>
      <p style="margin: 8px 0; color: #555; font-size: 14px;">${rec.description}</p>
      <div style="background: #F3EFFE; border-left: 3px solid #6B3FE7; padding: 12px; margin: 12px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 13px; color: #6B3FE7;"><strong>💡 Impact:</strong> ${rec.impact}</p>
      </div>
    </div>
  `).join('');

  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
  const growthColor = growthRate >= 0 ? '#10B981' : '#EF4444';
  const growthIcon = growthRate >= 0 ? '📈' : '📉';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monthly Business Report - ${businessName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .metric-card { background: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; }
        .metric-value { font-size: 24px; font-weight: 700; color: #6B3FE7; margin-bottom: 5px; }
        .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .products-box { background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB; }
        .products-box h3 { margin-top: 0; color: #0A0A0F; font-size: 18px; }
        .ai-section { background: linear-gradient(135deg, #F3EFFE 0%, #E9D5FF 100%); padding: 30px; border-radius: 16px; margin: 30px 0; }
        .ai-section h3 { margin-top: 0; color: #6B3FE7; font-size: 20px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('📊', 'Monthly Business Report', `${businessName} • ${month} ${year}`)}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Here's your comprehensive monthly business performance summary with AI-powered recommendations:</p>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${currency === 'NGN' ? '₦' : '$'}${totalRevenue.toLocaleString()}</div>
              <div class="metric-label">Total Revenue</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #10B981;">${currency === 'NGN' ? '₦' : '$'}${totalProfit.toLocaleString()}</div>
              <div class="metric-label">Net Profit</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: ${growthColor};">${growthIcon} ${Math.abs(growthRate)}%</div>
              <div class="metric-label">Growth Rate</div>
            </div>
          </div>

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #555;">
              <strong>Transactions:</strong> ${transactionCount} • 
              <strong>Profit Margin:</strong> ${profitMargin}% • 
              <strong>Expenses:</strong> ${currency === 'NGN' ? '₦' : '$'}${totalExpenses.toLocaleString()}
            </p>
          </div>

          ${topProducts.length > 0 ? `
          <div class="products-box">
            <h3>🏆 Top 5 Products This Month</h3>
            ${topProductsList}
          </div>
          ` : ''}

          <div class="ai-section">
            <h3>🤖 AI Recommendations from Ask Mo</h3>
            <p style="margin-bottom: 20px; color: #555;">Based on your business data, here are personalized recommendations to grow your business:</p>
            ${recommendationsList}
          </div>
          
          <a href="https://busmo.io/dashboard" class="button">View Complete Dashboard</a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6B7280;">
            This is an automated monthly report. AI recommendations are generated based on your business performance data.
          </p>
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
    subject: `📊 Monthly Business Report - ${businessName} - ${month} ${year}`,
    htmlContent,
  });
}
