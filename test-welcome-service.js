// Test welcome email using the actual Brevo service
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY || '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';
const BREVO_API_URL = 'https://api.brevo.com/v3';

const axios = require('axios');

async function sendTransactionalEmail(email) {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const sendSmtpEmail = {
    to: email.to,
    subject: email.subject,
    htmlContent: email.htmlContent,
    sender: email.sender || {
      name: 'Busmo Support',
      email: 'support@busmo.io',
    },
    params: email.params,
  };

  const response = await brevoApi.post('/smtp/email', sendSmtpEmail);
  console.log('Email sent successfully:', response.data);
  return response.data;
}

async function sendWelcomeEmail(email, name, businessName) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .content { padding: 40px 30px; background: #fff; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Busmo! 🎉</h1>
          <p>Your Business Management Solution</p>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Welcome to Busmo! We're excited to have you on board${businessName ? ` and help you grow ${businessName}` : ''}.</p>
          <p>Busmo is your all-in-one business management solution designed to help you track sales, manage your team, get AI-powered insights, and monitor cash flow.</p>
          <a href="https://busmo.web.app/dashboard" class="button">Go to Dashboard</a>
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

sendWelcomeEmail('crestack@gmail.com', 'Crestack Company', 'Test Business')
  .then(() => console.log('✅ Welcome email sent successfully!'))
  .catch(err => console.error('❌ Error:', err.message));
