// Test email to majnun@busmo.io
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.Brevo_API_key || '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';
const BREVO_API_URL = 'https://api.brevo.com/v3';

const axios = require('axios');

async function sendTestEmailToMajnun() {
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
      name: 'Busmo System',
      email: 'noreply@busmo.io',
    },
    to: [
      {
        email: 'majnun@busmo.io',
        name: 'Majnun'
      }
    ],
    subject: 'Email Functionality Test - Busmo System',
    htmlContent: '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #667eea;">Email Test Successful! ✅</h1><p>This is a test email to verify that the Busmo email system is working correctly.</p><p><strong>Sent to:</strong> majnun@busmo.io</p><p><strong>Time:</strong> ' + new Date().toISOString() + '</p><p>If you receive this email, the email functionality is working properly.</p><hr style="border: 1px solid #e9ecef; margin: 20px 0;"><p style="color: #666; font-size: 12px;">This is an automated test message from Busmo System.</p></body></html>',
  };

  try {
    console.log('Sending test email to majnun@busmo.io...');
    console.log('Recipient:', emailData.to[0].email);
    console.log('Subject:', emailData.subject);
    console.log('Sender:', emailData.sender);
    
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('\n✅ Email sent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check Brevo account status
    console.log('\nChecking Brevo account status...');
    const accountResponse = await brevoApi.get('/account');
    console.log('Account info:', JSON.stringify(accountResponse.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error('Error details:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

sendTestEmailToMajnun();