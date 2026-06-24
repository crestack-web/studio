// Send welcome email with embedded base64 logo
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY || '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';
const BREVO_API_URL = 'https://api.brevo.com/v3';

const fs = require('fs');
const axios = require('axios');

// Load base64 logo
const base64Logo = fs.readFileSync('logo-base64.txt', 'utf8');

async function sendWelcomeEmailWithEmbeddedLogo() {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const emailData = {
    sender: {
      name: 'Busmo Support',
      email: 'support@busmo.io',
    },
    to: [
      {
        email: 'crestack@gmail.com',
        name: 'Crestack Company'
      }
    ],
    subject: 'Welcome to Busmo! 🎉',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: white;
            padding: 10px;
            margin: 0 auto 20px;
            display: block;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
          }
          .header p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
            background: #fff;
          }
          .welcome-text {
            font-size: 18px;
            color: #555;
            margin-bottom: 25px;
          }
          .features {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .features h3 {
            margin-top: 0;
            color: #667eea;
            font-size: 20px;
          }
          .features ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .features li {
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: center;
          }
          .features li:last-child {
            border-bottom: none;
          }
          .features li::before {
            content: '✓';
            color: #667eea;
            font-weight: bold;
            font-size: 18px;
            margin-right: 12px;
          }
          .button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 25px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${base64Logo}" alt="Busmo Logo" class="logo">
            <h1>Welcome to Busmo! 🎉</h1>
            <p>Your Business Management Solution</p>
          </div>
          <div class="content">
            <p class="welcome-text">Dear Crestack Company,</p>
            <p class="welcome-text">We're thrilled to have you join the Busmo family! Your account has been successfully created, and you're now ready to transform the way you manage your business.</p>
            
            <div class="features">
              <h3>🚀 What You Can Do With Busmo:</h3>
              <ul>
                <li>Track sales and inventory in real-time</li>
                <li>Manage your team and staff performance</li>
                <li>Get AI-powered business insights</li>
                <li>Monitor cash flow and expenses</li>
                <li>Send professional invoices and receipts</li>
                <li>Manage customer relationships</li>
              </ul>
            </div>
            
            <p>Get started by exploring your dashboard and setting up your business profile. Our intuitive interface makes it easy to manage everything in one place.</p>
            
            <a href="https://busmo.web.app/dashboard" class="button">Go to Dashboard</a>
            
            <p>If you have any questions or need assistance, our support team is here to help. Just reply to this email or reach out to us at support@busmo.io</p>
            
            <p>Best regards,<br><strong>The Busmo Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Busmo. All rights reserved.</p>
            <p>123 Business Street, Tech City, TC 12345</p>
            <p style="margin-top: 15px; font-size: 12px;">
              You received this email because you signed up for Busmo.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    console.log('Sending welcome email with EMBEDDED base64 logo...');
    console.log('Recipient: crestack@gmail.com');
    console.log('Sender: support@busmo.io');
    
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ Welcome email sent successfully!');
    console.log('Message ID:', response.data.messageId);
    console.log('\nEmail should arrive at crestack@gmail.com shortly with embedded logo.');
    
  } catch (error) {
    console.error('❌ Error sending welcome email:');
    console.error(error.response?.data || error.message);
  }
}

sendWelcomeEmailWithEmbeddedLogo();
