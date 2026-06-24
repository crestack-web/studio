// Simple test email with minimal configuration
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY || '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';
const BREVO_API_URL = 'https://api.brevo.com/v3';

const axios = require('axios');

async function sendSimpleTestEmail() {
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
      name: 'Busmo Test',
      email: 'noreply@busmo.com',
    },
    to: [
      {
        email: 'crestack@gmail.com',
        name: 'Test Recipient'
      }
    ],
    subject: 'SIMPLE TEST - Please Confirm Receipt',
    htmlContent: '<html><body><h1>Simple Test Email</h1><p>If you receive this, please reply to confirm.</p><p>Sent at: ' + new Date().toISOString() + '</p></body></html>',
  };

  try {
    console.log('Sending simple test email...');
    console.log('Sender:', emailData.sender);
    console.log('Recipient:', emailData.to[0]);
    console.log('Subject:', emailData.subject);
    
    const response = await brevoApi.post('/smtp/email', emailData);
    console.log('✅ API call successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check Brevo account status
    console.log('\nChecking Brevo account status...');
    const accountResponse = await brevoApi.get('/account');
    console.log('Account info:', JSON.stringify(accountResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:');
    console.error(error.response?.data || error.message);
  }
}

sendSimpleTestEmail();
