// Test script for owner welcome email series - simplified version
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';
const axios = require('axios');

async function sendOwnerWelcomeEmail1() {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const emailData = {
    to: [{ email: 'majnun@busmo.io', name: 'Majnun' }],
    subject: '🎉 Welcome to Busmo! Your Business Journey Starts Now',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .content { padding: 40px 30px; background: #fff; }
          .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; }
          .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Busmo!</h1>
            <p>Your Complete Business Management Platform</p>
          </div>
          <div class="content">
            <p>Hi Majnun,</p>
            <p>Welcome aboard! Your business <strong>Test Business</strong> is now set up on Busmo. We're here to help you manage sales, track inventory, and grow your business with powerful AI insights.</p>
            
            <p><strong>What makes Busmo different?</strong></p>
            <ul>
              <li>✓ <strong>AI-Powered Insights:</strong> Ask Mo answers questions about your business in plain language</li>
              <li>✓ <strong>Complete Integration:</strong> Sales, inventory, expenses, and staff—all connected</li>
              <li>✓ <strong>Designed for Africa:</strong> Built for African businesses with local payment methods</li>
              <li>✓ <strong>Easy to Use:</strong> No accounting degree needed. Start selling in minutes.</li>
            </ul>
            
            <a href="https://busmo.web.app/dashboard" class="button">Explore Your Dashboard</a>
            
            <p>Need help? Our support team is ready to assist you.</p>
            <p>Best regards,<br><strong>The Busmo Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Busmo. All rights reserved.</p>
            <p>Contact: support@busmo.io</p>
          </div>
        </div>
      </body>
      </html>
    `,
    sender: {
      name: 'Busmo',
      email: 'noreply@busmo.io',
    },
  };

  try {
    console.log('📧 Sending owner welcome email 1 to majnun@busmo.io...');
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ Email 1 sent successfully!');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email 1:');
    console.error(error.response?.data || error.message);
    throw error;
  }
}

async function sendOwnerWelcomeEmail2() {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const emailData = {
    to: [{ email: 'majnun@busmo.io', name: 'Majnun' }],
    subject: '🎯 How Busmo Works - Features That Transform Your Business',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .content { padding: 40px 30px; background: #fff; }
          .feature-section { margin: 20px 0; padding: 20px; background: #F9FAFB; border-left: 4px solid #6B3FE7; border-radius: 8px; }
          .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; }
          .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 How Busmo Works</h1>
            <p>Your Business, Simplified & Amplified</p>
          </div>
          <div class="content">
            <p>Hi Majnun,</p>
            <p>Let's show you how Busmo transforms your daily operations. Think of us as your business command center—accessible anywhere, anytime.</p>
            
            <div class="feature-section">
              <h3>💰 Financial Management Made Simple</h3>
              <p><strong>What it does:</strong> Track all money in and out of your business.</p>
              <p><strong>Why it matters:</strong> Know exactly how much you're earning, spending, and profiting.</p>
            </div>
            
            <div class="feature-section">
              <h3>📦 Smart Inventory Control</h3>
              <p><strong>What it does:</strong> Monitor stock levels, set low-stock alerts, and track product movement.</p>
              <p><strong>Why it matters:</strong> Never run out of bestsellers or overstock slow-moving items.</p>
            </div>
            
            <div class="feature-section">
              <h3>🤖 Ask Mo - Your AI Business Assistant</h3>
              <p><strong>What it does:</strong> Answer natural language questions about your business data.</p>
              <p><strong>Try asking:</strong> "How much profit did I make this month?" or "Which products should I restock?"</p>
            </div>
            
            <a href="https://busmo.web.app/dashboard" class="button">Try These Features Now</a>
            
            <p>Best regards,<br><strong>The Busmo Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Busmo. All rights reserved.</p>
            <p>Contact: support@busmo.io</p>
          </div>
        </div>
      </body>
      </html>
    `,
    sender: {
      name: 'Busmo',
      email: 'noreply@busmo.io',
    },
  };

  try {
    console.log('📧 Sending owner welcome email 2 to majnun@busmo.io...');
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ Email 2 sent successfully!');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email 2:');
    console.error(error.response?.data || error.message);
    throw error;
  }
}

async function sendOwnerWelcomeEmail3() {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const emailData = {
    to: [{ email: 'majnun@busmo.io', name: 'Majnun' }],
    subject: '📈 Understanding Your Dashboard & Business Metrics',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .content { padding: 40px 30px; background: #fff; }
          .insight-box { background: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; }
          .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 Dashboard Decoded</h1>
            <p>Understanding Your Business Metrics</p>
          </div>
          <div class="content">
            <p>Hi Majnun,</p>
            <p>Your Busmo dashboard is packed with powerful insights. Let's demystify what each metric means.</p>
            
            <div class="insight-box">
              <h3>🎯 Key Metrics Explained</h3>
              <p><strong>Revenue:</strong> Total money from sales before expenses.</p>
              <p><strong>Profit:</strong> Revenue minus cost of goods. This is what you actually keep.</p>
              <p><strong>Profit Margin:</strong> Percentage of revenue that's profit. Higher = better efficiency.</p>
              <p><strong>Inventory Turnover:</strong> How fast you sell and replace stock.</p>
            </div>
            
            <p><strong>Business Terms Glossary:</strong></p>
            <p><strong>Cash Flow:</strong> The movement of money in and out of your business. Positive cash flow means more money coming in than going out.</p>
            
            <p><strong>💡 Pro Tip:</strong> Use Ask Mo for insights. Just ask "What's my profit margin this month?" and get instant answers.</p>
            
            <a href="https://busmo.web.app/dashboard" class="button">Explore Your Dashboard</a>
            
            <p>Best regards,<br><strong>The Busmo Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Busmo. All rights reserved.</p>
            <p>Contact: support@busmo.io</p>
          </div>
        </div>
      </body>
      </html>
    `,
    sender: {
      name: 'Busmo',
      email: 'noreply@busmo.io',
    },
  };

  try {
    console.log('📧 Sending owner welcome email 3 to majnun@busmo.io...');
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ Email 3 sent successfully!');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email 3:');
    console.error(error.response?.data || error.message);
    throw error;
  }
}

async function sendOwnerWelcomeEmail4() {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const emailData = {
    to: [{ email: 'majnun@busmo.io', name: 'Majnun' }],
    subject: '🚀 Power User Tips - Maximize Your Busmo Experience',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .content { padding: 40px 30px; background: #fff; }
          .strategy-box { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 25px 0; }
          .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Power User Tips</h1>
            <p>Get the Most Out of Busmo</p>
          </div>
          <div class="content">
            <p>Hi Majnun,</p>
            <p>Now that you're familiar with the basics, let's unlock advanced strategies to maximize your ROI with Busmo.</p>
            
            <div class="strategy-box">
              <h3>🎯 The 80/20 Rule with Busmo</h3>
              <p><strong>1. Record sales consistently</strong> - The more data you collect, the smarter Busmo becomes.</p>
              <p><strong>2. Ask Mo strategic questions weekly</strong> - "What trends do you see in my sales?"</p>
              <p><strong>3. Monitor inventory alerts</strong> - Never miss a restock opportunity.</p>
            </div>
            
            <p><strong>Advanced Strategies:</strong></p>
            <ul>
              <li>📊 <strong>Weekly Review Ritual:</strong> Spend 15 minutes every Friday asking Mo about your business performance.</li>
              <li>🎯 <strong>Set Profit Margins:</strong> Use Busmo's cost tracking to ensure every product is priced profitably.</li>
              <li>👥 <strong>Staff Accountability:</strong> Monitor staff performance through transaction records.</li>
              <li>📱 <strong>Mobile Access:</strong> Record sales anywhere in your store with real-time sync.</li>
            </ul>
            
            <p><strong>Common Misconceptions Debunked:</strong></p>
            <p><strong>"I need to be tech-savvy."</strong> Not true. Busmo is designed for everyday business owners.</p>
            
            <a href="https://busmo.web.app/dashboard" class="button">Start Applying These Tips</a>
            
            <p>Best regards,<br><strong>The Busmo Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Busmo. All rights reserved.</p>
            <p>Contact: support@busmo.io</p>
          </div>
        </div>
      </body>
      </html>
    `,
    sender: {
      name: 'Busmo',
      email: 'noreply@busmo.io',
    },
  };

  try {
    console.log('📧 Sending owner welcome email 4 to majnun@busmo.io...');
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ Email 4 sent successfully!');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email 4:');
    console.error(error.response?.data || error.message);
    throw error;
  }
}

async function sendOwnerWelcomeEmail5() {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const emailData = {
    to: [{ email: 'majnun@busmo.io', name: 'Majnun' }],
    subject: "🎯 You're All Set! Welcome to the Busmo Family",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
          .header { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .content { padding: 40px 30px; background: #fff; }
          .checklist { background: #F0FDF4; border: 2px solid #10B981; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .cta-box { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
          .button { display: inline-block; padding: 16px 40px; background: white; color: #6B3FE7; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 10px 0; }
          .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 You're All Set!</h1>
            <p>Your Busmo Journey Begins Now</p>
          </div>
          <div class="content">
            <p>Hi Majnun,</p>
            <p>Congratulations! You've completed your first week with Busmo. Your business <strong>Test Business</strong> is ready to transform operations.</p>
            
            <div class="checklist">
              <h3>✅ Your First Week Checklist</h3>
              <p>✓ Record your first sale (takes 30 seconds)</p>
              <p>✓ Add your products to inventory</p>
              <p>✓ Set up staff accounts (if applicable)</p>
              <p>✓ Ask Mo your first question about your business</p>
              <p>✓ Review your dashboard and understand your metrics</p>
            </div>
            
            <div class="cta-box">
              <h2>Growing Your Business</h2>
              <p>Remember: Busmo is most powerful when used consistently. The more data you input, the smarter insights you'll receive.</p>
              <a href="https://busmo.web.app/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <h3>📚 Resources to Help You Succeed</h3>
            <p>📖 Help Center - Step-by-step guides and tutorials</p>
            <p>🎥 Video Tutorials - Learn by watching</p>
            <p>💬 Live Support - Chat with our team</p>
            <p>👥 Community - Connect with other owners</p>
            
            <div style="background: #EBF5FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #1E40AF;">🤝 We're Here for You</h3>
              <p><strong>Email:</strong> support@busmo.io</p>
              <p><strong>Response Time:</strong> Within 24 hours (usually faster)</p>
            </div>
            
            <p>Thank you for choosing Busmo. We're excited to be part of your success story!</p>
            <p>Best regards,<br><strong>The Busmo Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Busmo. All rights reserved.</p>
            <p>Contact: support@busmo.io</p>
          </div>
        </div>
      </body>
      </html>
    `,
    sender: {
      name: 'Busmo',
      email: 'noreply@busmo.io',
    },
  };

  try {
    console.log('📧 Sending owner welcome email 5 to majnun@busmo.io...');
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ Email 5 sent successfully!');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email 5:');
    console.error(error.response?.data || error.message);
    throw error;
  }
}

async function sendAllEmails() {
  try {
    console.log('🚀 Starting owner welcome email series test to majnun@busmo.io...\n');
    
    await sendOwnerWelcomeEmail1();
    console.log('');
    
    await sendOwnerWelcomeEmail2();
    console.log('');
    
    await sendOwnerWelcomeEmail3();
    console.log('');
    
    await sendOwnerWelcomeEmail4();
    console.log('');
    
    await sendOwnerWelcomeEmail5();
    console.log('');
    
    console.log('🎉 All 5 owner welcome emails sent successfully to majnun@busmo.io!');
    console.log('Please check the inbox to see the styled and informative emails.');
    
  } catch (error) {
    console.error('\n❌ Email series failed:', error);
  }
}

sendAllEmails();