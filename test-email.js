// Test email script using Brevo service
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY || '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';
const BREVO_API_URL = 'https://api.brevo.com/v3';

const axios = require('axios');

async function sendTestEmail() {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const emailData = {
    to: [{ email: 'crestack@gmail.com', name: 'Test Recipient' }],
    subject: 'Busmo Email Test - Brevo Service',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Brevo Email Test Successful!</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>This is a test email from Busmo using the Brevo email service.</p>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Service: Brevo (Sendinblue)</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
              <li>Status: Working correctly ✅</li>
            </ul>
            <p>Your email features are now configured and ready to use!</p>
            <p>Best regards,<br>The Busmo Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Busmo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    sender: {
      name: 'Busmo',
      email: 'noreply@busmo.com',
    },
  };

  try {
    console.log('Sending test email to crestack@gmail.com...');
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ Test email sent successfully!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error(error.response?.data || error.message);
  }
}

sendTestEmail();
