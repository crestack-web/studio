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

export interface BusinessHealthScoreParams {
  email: string;
  name: string;
  businessName: string;
  healthScore: number;
  scoreCategory: 'excellent' | 'good' | 'fair' | 'needs-improvement';
  period: string;
  metrics: {
    revenue: { score: number; trend: 'up' | 'down' | 'stable' };
    profitability: { score: number; trend: 'up' | 'down' | 'stable' };
    inventory: { score: number; trend: 'up' | 'down' | 'stable' };
    cashflow: { score: number; trend: 'up' | 'down' | 'stable' };
  };
  recommendations: string[];
  currency?: string;
}

export interface InactivityReminderParams {
  email: string;
  name: string;
  businessName: string;
  daysInactive: number;
  lastActivityDate: string;
  tips: string[];
}

export interface BusinessMilestoneCelebrationParams {
  email: string;
  name: string;
  businessName: string;
  milestoneType: 'first-sale' | '100-sales' | '1000-sales' | 'revenue-goal' | 'customer-goal' | 'anniversary';
  milestoneValue: string;
  achievedDate: string;
  message: string;
  currency?: string;
}

export interface TipsForGrowingBusinessParams {
  email: string;
  name: string;
  businessName: string;
  tips: Array<{
    title: string;
    description: string;
    category: string;
  }>;
}

export interface NewFeatureReleasedParams {
  email: string;
  name: string;
  businessName: string;
  featureName: string;
  featureDescription: string;
  benefit: string;
  learnMoreUrl: string;
}

// Business Health Score Email
export async function sendBusinessHealthScoreEmail(params: BusinessHealthScoreParams): Promise<any> {
  const { email, name, businessName, healthScore, scoreCategory, period, metrics, recommendations, currency = 'NGN' } = params;
  
  const scoreColors = {
    'excellent': '#10B981',
    'good': '#3B82F6',
    'fair': '#F59E0B',
    'needs-improvement': '#EF4444'
  };
  
  const scoreLabels = {
    'excellent': 'Excellent',
    'good': 'Good',
    'fair': 'Fair',
    'needs-improvement': 'Needs Improvement'
  };

  const trendIcons = {
    'up': '📈',
    'down': '📉',
    'stable': '➡️'
  };

  const metricsHtml = Object.entries(metrics).map(([key, value]) => `
    <div style="background: #F9FAFB; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #E5E7EB;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600; color: #0A0A0F; text-transform: capitalize;">${key}</span>
        <span style="font-size: 20px;">${trendIcons[value.trend]}</span>
      </div>
      <div style="font-size: 24px; font-weight: 700; color: ${scoreColors[scoreCategory]}; margin-top: 5px;">${value.score}/100</div>
    </div>
  `).join('');

  const recommendationsList = recommendations.map(rec => `<li style="padding: 8px 0;">${rec}</li>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📊 Business Health Score</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .score-box { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .score-box .score { font-size: 64px; font-weight: 700; margin: 10px 0; }
        .score-box .label { font-size: 18px; opacity: 0.95; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; }
        .recommendations-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .recommendations-box h3 { margin-top: 0; color: #065F46; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('📊', 'Business Health Score', `${businessName} • ${period}`)}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Here's your business health score for <strong>${businessName}</strong>:</p>
          
          <div class="score-box">
            <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">Health Score</div>
            <div class="score">${healthScore}</div>
            <div class="label">${scoreLabels[scoreCategory]}</div>
          </div>

          <div class="metrics-grid">
            ${metricsHtml}
          </div>

          ${recommendations.length > 0 ? `
          <div class="recommendations-box">
            <h3>💡 Recommendations</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${recommendationsList}
            </ul>
          </div>
          ` : ''}

          <a href="https://busmo.io/dashboard" class="button">View Detailed Dashboard</a>
          
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
    subject: `📊 Business Health Score - ${healthScore}/100`,
    htmlContent,
  });
}

// Inactivity Reminder Email
export async function sendInactivityReminderEmail(params: InactivityReminderParams): Promise<any> {
  const { email, name, businessName, daysInactive, lastActivityDate, tips } = params;
  
  const urgency = daysInactive >= 60 ? 'urgent' : daysInactive >= 30 ? 'high' : 'normal';
  const bgColor = urgency === 'urgent' ? '#FEE2E2' : urgency === 'high' ? '#FEF3C7' : '#DBEAFE';
  const borderColor = urgency === 'urgent' ? '#DC2626' : urgency === 'high' ? '#F59E0B' : '#3B82F6';

  const tipsList = tips.map(tip => `<li style="padding: 8px 0;">${tip}</li>`).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>👋 We Miss You</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .reminder-box { background: ${bgColor}; border: 2px solid ${borderColor}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .reminder-box h2 { margin-top: 0; color: ${borderColor}; }
        .tips-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .tips-box h3 { margin-top: 0; color: #065F46; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('👋', 'We Miss You', 'Get back to growing your business')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We noticed you haven't been active on Busmo for <strong>${daysInactive} days</strong>. Your business <strong>${businessName}</strong> could benefit from your attention!</p>
          
          <div class="reminder-box">
            <h2>${urgency === 'urgent' ? '🚨 Account Inactivity Alert' : urgency === 'high' ? '⚠️ Long Time No See' : '👋 We Miss You!'}</h2>
            <p style="margin: 10px 0; color: #555; font-size: 14px;">Last activity: ${lastActivityDate}</p>
          </div>

          <div class="tips-box">
            <h3>💡 Quick Tips to Get Back on Track</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              ${tipsList}
            </ul>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">🚀 Why Busmo Matters</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Track your sales and inventory in real-time</li>
              <li>Get AI-powered business insights</li>
              <li>Make data-driven decisions</li>
              <li>Grow your business faster</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard" class="button">Go to Dashboard</a>
          
          <p>We're here to help you succeed!</p>
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
    subject: `👋 We Miss You - ${daysInactive} days inactive`,
    htmlContent,
  });
}

// Business Milestone Celebration Email
export async function sendBusinessMilestoneCelebrationEmail(params: BusinessMilestoneCelebrationParams): Promise<any> {
  const { email, name, businessName, milestoneType, milestoneValue, achievedDate, message, currency = 'NGN' } = params;
  
  const milestoneIcons = {
    'first-sale': '🎉',
    '100-sales': '💯',
    '1000-sales': '🏆',
    'revenue-goal': '💰',
    'customer-goal': '👥',
    'anniversary': '🎂'
  };

  const milestoneTitles = {
    'first-sale': 'First Sale!',
    '100-sales': '100 Sales!',
    '1000-sales': '1000 Sales!',
    'revenue-goal': 'Revenue Goal!',
    'customer-goal': 'Customer Goal!',
    'anniversary': 'Anniversary!'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎉 Milestone Achieved!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .celebration-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .celebration-box .icon { font-size: 64px; margin-bottom: 15px; }
        .celebration-box h2 { margin: 0 0 10px; font-size: 36px; }
        .celebration-box .value { font-size: 48px; font-weight: 700; margin: 15px 0; }
        .message-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .message-box p { margin: 0; color: #555; font-size: 15px; line-height: 1.8; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B72828; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('🎉', 'Milestone Achieved!', 'Congratulations on your success')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Congratulations! <strong>${businessName}</strong> has achieved an amazing milestone!</p>
          
          <div class="celebration-box">
            <div class="icon">${milestoneIcons[milestoneType]}</div>
            <h2>${milestoneTitles[milestoneType]}</h2>
            <div class="value">${milestoneValue}</div>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.95;">Achieved on ${achievedDate}</p>
          </div>

          <div class="message-box">
            <p>${message}</p>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">🚀 What's Next?</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Keep the momentum going!</li>
              <li>Set your next ambitious goal</li>
              <li>Share your success with your team</li>
              <li>Use Busmo's insights to grow further</li>
            </ul>
          </div>

          <a href="https://busmo.io/dashboard" class="button">View Your Dashboard</a>
          
          <p>Congratulations again on this achievement!</p>
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
    subject: `🎉 Milestone Achieved - ${milestoneTitles[milestoneType]}`,
    htmlContent,
  });
}

// Tips for Growing Business Email
export async function sendTipsForGrowingBusinessEmail(params: TipsForGrowingBusinessParams): Promise<any> {
  const { email, name, businessName, tips } = params;
  
  const tipsHtml = tips.map(tip => `
    <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #E5E7EB;">
      <div style="background: #6B3FE7; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 10px;">${tip.category}</div>
      <h4 style="margin: 10px 0; color: #0A0A0F; font-size: 18px;">${tip.title}</h4>
      <p style="margin: 8px 0; color: #555; font-size: 14px; line-height: 1.6;">${tip.description}</p>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>💡 Tips for Growing Your Business</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .intro-box { background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .intro-box h3 { margin-top: 0; color: #6B3FE7; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('💡', 'Business Growth Tips', 'Expert advice for your business')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>Here are some expert tips to help you grow <strong>${businessName}</strong>:</p>
          
          <div class="intro-box">
            <h3>📈 Why These Tips Matter</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">These tips are based on successful businesses in your industry and can help you overcome common challenges.</p>
          </div>

          ${tipsHtml}

          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #065F46;">🚀 Take Action Today</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px;">Pick one tip and implement it this week. Small consistent actions lead to big results over time.</p>
          </div>

          <a href="https://busmo.io/dashboard" class="button">Apply These Tips in Busmo</a>
          
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
    subject: '💡 Tips for Growing Your Business',
    htmlContent,
  });
}

// New Feature Released Email
export async function sendNewFeatureReleasedEmail(params: NewFeatureReleasedParams): Promise<any> {
  const { email, name, businessName, featureName, featureDescription, benefit, learnMoreUrl } = params;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>✨ New Feature Available</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .content { padding: 40px 30px; background: #fff; }
        .feature-box { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 12px; margin: 25px 0; }
        .feature-box h2 { margin: 0 0 10px; font-size: 28px; }
        .feature-box .icon { font-size: 48px; margin-bottom: 15px; }
        .benefit-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .benefit-box h3 { margin-top: 0; color: #065F46; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px rgba(107, 63, 231, 0.2); }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader('✨', 'New Feature', 'Exciting updates for your business')}
        <div class="content">
          <p>Hi ${name},</p>
          <p>We're excited to announce a new feature that can help <strong>${businessName}</strong> grow even faster!</p>
          
          <div class="feature-box">
            <div class="icon">✨</div>
            <h2>${featureName}</h2>
            <p style="margin: 10px 0; font-size: 16px; opacity: 0.95;">${featureDescription}</p>
          </div>

          <div class="benefit-box">
            <h3>💡 How This Helps You</h3>
            <p style="margin: 8px 0; color: #555; font-size: 14px; line-height: 1.8;">${benefit}</p>
          </div>

          <div style="background: #F3EFFE; border-left: 4px solid #6B3FE7; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #6B3FE7;">🚀 Get Started</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8;">
              <li>Explore the new feature in your dashboard</li>
              <li>Check out our documentation</li>
              <li>Watch the tutorial video</li>
              <li>Contact support if you need help</li>
            </ul>
          </div>

          <a href="${learnMoreUrl}" class="button">Learn More</a>
          
          <p>We hope you love this new feature!</p>
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
    subject: `✨ New Feature: ${featureName}`,
    htmlContent,
  });
}
