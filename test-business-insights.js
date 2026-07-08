// Test script for business insights email
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';
const axios = require('axios');

const brevoApi = axios.create({
  baseURL: BREVO_API_URL,
  headers: {
    'api-key': BREVO_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

async function sendEmail(emailData) {
  try {
    const response = await brevoApi.post('/smtp/email', {
      ...emailData,
      sender: {
        name: 'Busmo',
        email: 'noreply@busmo.io'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send email:', error.response?.data || error.message);
    throw error;
  }
}

async function testBusinessInsightsEmail() {
  const testEmail = 'majnun@busmo.io';
  const testName = 'Majnun';
  const testBusiness = 'Test Business';

  console.log('🧪 Testing Business Insights Email...\n');

  // Business Insights Email with Global and Local insights
  console.log('📧 Sending business insights email...');
  await sendEmail({
    to: [{ email: testEmail, name: testName }],
    subject: `🎯 Business Insights & Recommendations - ${testBusiness}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business Insights & Recommendations - ${testBusiness}</title>
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
            <p>${testBusiness}</p>
            <p class="timestamp">Generated on ${new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <div class="content">
            <p>Hi ${testName},</p>
            <p>Based on your business data and industry trends, here are personalized insights to help you grow:</p>
            
            <h2 class="section-title">🌍 Market & Industry Insights</h2>
            <p style="color: #6B7280; font-size: 14px; margin-bottom: 15px;">Opportunities and trends affecting businesses like yours globally and in Nigeria</p>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #DC2626; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                <div style="background: #FEE2E2; color: #DC2626; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">HIGH</div>
                <h4 style="margin: 0; color: #0A0A0F; font-size: 16px; flex: 1;">Nigerian E-commerce Growth Opportunity</h4>
              </div>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 10px 0;">Nigeria's e-commerce market is projected to grow 20% this year. Online retail sales in Lagos and Abuja are surging, with mobile commerce leading the charge.</p>
              <div style="background: #F3EFFE; border-left: 3px solid #6B3FE7; padding: 12px; margin: 12px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 13px; color: #6B3FE7;"><strong>💡 Impact:</strong> Expanding your online presence could increase revenue by 30-40%</p>
              </div>
              <a href="https://busmo.io/ecommerce" style="display: inline-block; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; box-shadow: 0 2px 4px rgba(107, 63, 231, 0.2);">
                Set Up Online Store →
              </a>
            </div>

            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #F59E0B; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                <div style="background: #FEF3C7; color: #F59E0B; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">MEDIUM</div>
                <h4 style="margin: 0; color: #0A0A0F; font-size: 16px; flex: 1;">Cashless Payment Adoption Rising</h4>
              </div>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 10px 0;">Digital payment adoption in Nigeria increased by 35% in 2025. Customers prefer businesses that offer multiple payment options including card, mobile money, and bank transfers.</p>
              <div style="background: #F3EFFE; border-left: 3px solid #6B3FE7; padding: 12px; margin: 12px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 13px; color: #6B3FE7;"><strong>💡 Impact:</strong> Offering digital payments could boost sales conversion by 25%</p>
              </div>
              <a href="https://busmo.io/payment-traceability" style="display: inline-block; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; box-shadow: 0 2px 4px rgba(107, 63, 231, 0.2);">
                Configure Payments →
              </a>
            </div>

            <h2 class="section-title">📍 Your Business Performance</h2>
            <p style="color: #6B7280; font-size: 14px; margin-bottom: 15px;">Specific recommendations based on your actual business data</p>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #DC2626; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                <div style="background: #FEE2E2; color: #DC2626; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">HIGH</div>
                <h4 style="margin: 0; color: #0A0A0F; font-size: 16px; flex: 1;">Low Stock Alert: 3 Products Need Restocking</h4>
              </div>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 10px 0;">Your inventory analysis shows 3 products are below safety stock levels. This could lead to lost sales and disappointed customers.</p>
              <div style="background: #F3EFFE; border-left: 3px solid #6B3FE7; padding: 12px; margin: 12px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 13px; color: #6B3FE7;"><strong>💡 Impact:</strong> Restocking now could prevent ~₦45,000 in potential lost revenue</p>
              </div>
              <a href="https://busmo.io/inventory" style="display: inline-block; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; box-shadow: 0 2px 4px rgba(107, 63, 231, 0.2);">
                Manage Inventory →
              </a>
            </div>

            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #10B981; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                <div style="background: #FEE2E2; color: #DC2626; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">HIGH</div>
                <h4 style="margin: 0; color: #0A0A0F; font-size: 16px; flex: 1;">Profit Margin Improved: +5% This Week</h4>
              </div>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 10px 0;">Great news! Your profit margin improved from 28% to 33% this week. This is driven by better cost management and higher-margin product sales.</p>
              <div style="background: #F3EFFE; border-left: 3px solid #6B3FE7; padding: 12px; margin: 12px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 13px; color: #6B3FE7;"><strong>💡 Impact:</strong> Continue this trajectory to achieve 40% profit margin this month</p>
              </div>
              <a href="https://busmo.io/reports" style="display: inline-block; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; box-shadow: 0 2px 4px rgba(107, 63, 231, 0.2);">
                View Reports →
              </a>
            </div>

            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #3B82F6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                <div style="background: #DBEAFE; color: #3B82F6; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap;">LOW</div>
                <h4 style="margin: 0; color: #0A0A0F; font-size: 16px; flex: 1;">Staff Performance: Top Performer Identified</h4>
              </div>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 10px 0;">Your staff member "Chioma N." has exceeded sales targets by 25% this month. Consider recognizing her performance to boost team morale.</p>
              <div style="background: #F3EFFE; border-left: 3px solid #6B3FE7; padding: 12px; margin: 12px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 13px; color: #6B3FE7;"><strong>💡 Impact:</strong> Employee recognition programs improve retention by 30%</p>
              </div>
              <a href="https://busmo.io/staff-accountability" style="display: inline-block; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 10px; box-shadow: 0 2px 4px rgba(107, 63, 231, 0.2);">
                View Staff Performance →
              </a>
            </div>
            
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
    `,
  });

  console.log('   ✓ Business insights email sent');
  console.log('\n✅ Business insights email test completed!');
  console.log('\nEmail features:');
  console.log('  ✓ Global market insights (Nigerian e-commerce, cashless payments)');
  console.log('  ✓ Local business insights (inventory, profit margin, staff performance)');
  console.log('  ✓ Priority-based color coding (High, Medium, Low)');
  console.log('  ✓ Impact statements for each insight');
  console.log('  ✓ Direct action buttons linking to dashboard sections');
  console.log('  ✓ Professional, clean design format');
}

testBusinessInsightsEmail().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});