// Test script for subscription and password reset emails
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

async function testAllEmails() {
  const testEmail = 'majnun@busmo.io';
  const testName = 'Majnun';
  const testBusiness = 'Test Business';

  console.log('🧪 Testing all subscription and system emails...\n');

  // 1. Trial Reminder - 7 days
  console.log('📧 Sending trial reminder (7 days)...');
  await sendEmail({
    to: [{ email: testEmail, name: testName }],
    subject: '📅 7 days left in your Busmo trial',
    htmlContent: `<div style="padding: 40px; text-align: center; font-family: sans-serif;"><h1>📅 Trial Reminder</h1><p>Hi ${testName},</p><p>Your free trial of Busmo for <strong>${testBusiness}</strong> ends in 7 days on <strong>2026-02-15</strong>.</p><p><a href="https://busmo.web.app/plans">View Plans</a></p></div>`,
  });
  console.log('   ✓ Trial reminder sent');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Trial Reminder - 3 days
  console.log('📧 Sending trial reminder (3 days)...');
  await sendEmail({
    to: [{ email: testEmail, name: testName }],
    subject: '⏰ 3 days left in your Busmo trial',
    htmlContent: `<div style="padding: 40px; text-align: center; font-family: sans-serif;"><h1>⏰ Trial Reminder</h1><p>Hi ${testName},</p><p>Your free trial of Busmo for <strong>${testBusiness}</strong> ends in 3 days on <strong>2026-02-15</strong>.</p><div style="background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;"><h2>Upgrade Now & Save 20%</h2><p>Upgrade in the next 3 days and get 20% off your first month!</p><a href="https://busmo.web.app/plans" style="background: white; color: #6B3FE7; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Plans & Upgrade</a></div></div>`,
  });
  console.log('   ✓ Trial reminder sent');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Trial Reminder - 1 day (urgent)
  console.log('📧 Sending trial reminder (1 day - urgent)...');
  await sendEmail({
    to: [{ email: testEmail, name: testName }],
    subject: '⚠️ Your Busmo trial ends tomorrow - Act now!',
    htmlContent: `<div style="padding: 40px; text-align: center; font-family: sans-serif;"><h1>⚠️ Trial Ends Tomorrow</h1><p>Hi ${testName},</p><p>Your free trial of Busmo for <strong>${testBusiness}</strong> ends tomorrow on <strong>2026-02-15</strong>.</p><div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: left;"><h2 style="color: #DC2626;">⚠️ Urgent: Action Required</h2><p><strong>What happens when your trial ends?</strong></p><ul><li>✓ Your data is <strong>safe and preserved</strong></li><li>✓ You can <strong>upgrade anytime</strong> to restore full access</li></ul></div><div style="background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;"><h2>Upgrade Now & Save 20%</h2><p>Upgrade in the next 1 day and get 20% off your first month!</p><a href="https://busmo.web.app/plans" style="background: white; color: #6B3FE7; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Plans & Upgrade</a></div></div>`,
  });
  console.log('   ✓ Urgent trial reminder sent');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. Subscription Receipt - Starter Plan
  console.log('📧 Sending subscription receipt...');
  await sendEmail({
    to: [{ email: testEmail, name: testName }],
    subject: '✅ Payment Confirmed - Starter Plan Activated',
    htmlContent: `<div style="padding: 40px; text-align: center; font-family: sans-serif;"><div style="font-size: 64px; margin-bottom: 20px;">✅</div><h1>Payment Confirmed!</h1><p>Hi ${testName},</p><p>Thank you for upgrading your <strong>${testBusiness}</strong> account to the <strong>Starter</strong> plan.</p><div style="background: #F9FAFB; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #E5E7EB; text-align: left;"><div style="text-align: center; margin-bottom: 20px;"><span style="background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">STARTER PLAN</span></div><div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;"><span>Business:</span><strong>${testBusiness}</strong></div><div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;"><span>Plan:</span><strong>Starter</strong></div><div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB;"><span>Billing Period:</span><strong>Monthly</strong></div><div style="display: flex; justify-content: space-between; padding: 12px 0;"><span>Transaction ID:</span><strong>TXN-123456789</strong></div><div style="background: #F3EFFE; padding: 20px; border-radius: 8px; margin-top: 15px;"><div style="display: flex; justify-content: space-between;"><span>Amount Paid:</span><strong style="font-size: 20px; color: #6B3FE7;">₦5,000</strong></div><div style="display: flex; justify-content: space-between; margin-top: 8px;"><span>Next Billing Date:</span><strong>2026-03-08</strong></div></div></div><div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: left;"><h3 style="margin-top: 0; color: #065F46;">🎉 You're All Set!</h3><p>Your account has been upgraded and all Starter features are now available.</p></div><a href="https://busmo.web.app/dashboard" style="background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; margin: 20px 0;">Go to Dashboard</a></div>`,
  });
  console.log('   ✓ Subscription receipt sent');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 5. Daily Business Summary
  console.log('📧 Sending daily business summary...');
  await sendEmail({
    to: [{ email: testEmail, name: testName }],
    subject: `📊 Daily Business Summary - ${testBusiness} - Feb 8`,
    htmlContent: `<div style="padding: 40px; font-family: sans-serif;"><div style="background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; border-radius: 16px 16px 0 0;"><div style="font-size: 48px; margin-bottom: 10px;">📊</div><h1>Daily Business Summary</h1><p>${testBusiness} • Sunday, February 8, 2026</p></div><div style="padding: 40px 30px; background: #fff;"><p>Hi ${testName},</p><p>Here's your business performance for yesterday:</p><div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;"><div style="background: #F9FAFB; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #E5E7EB;"><div style="font-size: 24px; font-weight: bold; color: #6B3FE7;">₦125,000</div><div style="font-size: 12px; color: #6B7280; text-transform: uppercase;">Total Sales</div></div><div style="background: #F9FAFB; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #E5E7EB;"><div style="font-size: 24px; font-weight: bold; color: #10B981;">₦45,000</div><div style="font-size: 12px; color: #6B7280; text-transform: uppercase;">Net Profit</div></div><div style="background: #F9FAFB; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #E5E7EB;"><div style="font-size: 24px; font-weight: bold; color: #F59E0B;">₦35,000</div><div style="font-size: 12px; color: #6B7280; text-transform: uppercase;">Total Expenses</div></div><div style="background: #F9FAFB; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #E5E7EB;"><div style="font-size: 24px; font-weight: bold; color: #6B3FE7;">36.0%</div><div style="font-size: 12px; color: #6B7280; text-transform: uppercase;">Profit Margin</div></div></div><div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 8px;"><p style="margin: 0; font-size: 14px;"><strong>Transactions:</strong> 23 • <strong>Profit Margin:</strong> 36.0%</p></div><div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #E5E7EB;"><h3 style="margin-top: 0; color: #0A0A0F;">🏆 Top Selling Products</h3><div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB;"><div><span style="font-weight: bold; color: #6B3FE7;">#1</span> <span>Product A</span></div><div style="text-align: right;"><div style="font-weight: bold;">15 sold</div><div style="font-size: 12px; color: #6B7280;">₦45,000</div></div></div><div style="display: flex; justify-content: space-between; padding: 10px 0;"><div><span style="font-weight: bold; color: #6B3FE7;">#2</span> <span>Product B</span></div><div style="text-align: right;"><div style="font-weight: bold;">12 sold</div><div style="font-size: 12px; color: #6B7280;">₦32,000</div></div></div></div><a href="https://busmo.web.app/dashboard" style="background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; margin: 25px 0;">View Full Dashboard</a><p style="margin-top: 30px; font-size: 12px; color: #6B7280;">This is an automated daily summary.</p></div>`,
  });
  console.log('   ✓ Daily summary sent');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 6. Password Reset Confirmation
  console.log('📧 Sending password reset confirmation...');
  await sendEmail({
    to: [{ email: testEmail, name: testName }],
    subject: '🔒 Password Reset Successful - Busmo',
    htmlContent: `<div style="padding: 40px; text-align: center; font-family: sans-serif;"><div style="font-size: 64px; margin-bottom: 15px;">🔒</div><h1>Password Reset Successful</h1><p>Hi ${testName},</p><p>This email confirms that your Busmo account password has been successfully reset.</p><div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: left;"><h3 style="margin-top: 0; color: #065F46;">✅ What Changed?</h3><ul style="text-align: left; color: #555;"><li>Your password has been updated</li><li>All active sessions remain valid</li><li>Your data is secure and unchanged</li></ul></div><div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; text-align: left;"><h3 style="margin-top: 0; color: #D97706;">🛡️ Security Tips</h3><ul style="text-align: left; color: #555;"><li>Use a strong, unique password</li><li>Don't share your password</li><li>Log out from shared devices</li></ul></div><a href="https://busmo.web.app/dashboard" style="background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; margin: 20px 0;">Go to Dashboard</a><p style="margin-top: 30px; font-size: 14px;"><strong>Didn't request this change?</strong> Contact <a href="mailto:support@busmo.io">support@busmo.io</a></p></div>`,
  });
  console.log('   ✓ Password reset confirmation sent');
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n✅ All subscription and system emails sent successfully!');
  console.log('\nEmail types tested:');
  console.log('  ✓ Trial reminder (7 days)');
  console.log('  ✓ Trial reminder (3 days)');
  console.log('  ✓ Trial reminder (1 day - urgent)');
  console.log('  ✓ Subscription receipt');
  console.log('  ✓ Daily business summary');
  console.log('  ✓ Password reset confirmation');
  console.log('\nAll emails delivered to: majnun@busmo.io');
}

testAllEmails().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});