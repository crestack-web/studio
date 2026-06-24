// Test email using verified sender
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY || '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';
const BREVO_API_URL = 'https://api.brevo.com/v3';

const axios = require('axios');

async function sendTestEmailWithVerifiedSender() {
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
      email: 'support@busmo.io', // Using verified sender
    },
    to: [
      {
        email: 'crestack@gmail.com',
        name: 'Test Recipient'
      }
    ],
    subject: 'TEST - Verified Sender - Please Confirm Receipt',
    htmlContent: `
      <html>
      <body>
        <h1>✅ Test Email from Verified Sender</h1>
        <p>This email was sent using the verified sender: support@busmo.io</p>
        <p><strong>If you receive this email, please reply to confirm.</strong></p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <hr>
        <p><em>This is a test to verify email delivery is working correctly.</em></p>
      </body>
      </html>
    `,
  };

  try {
    console.log('Sending test email with VERIFIED sender...');
    console.log('Sender:', emailData.sender);
    console.log('Recipient:', emailData.to[0]);
    
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ API call successful!');
    console.log('Message ID:', response.data.messageId);
    console.log('\nEmail should arrive at crestack@gmail.com shortly.');
    
  } catch (error) {
    console.error('❌ Error:');
    console.error(error.response?.data || error.message);
  }
}

sendTestEmailWithVerifiedSender();
