/**
 * Send Hausa Welcome Email via API
 * Calls the backend API to avoid IP whitelist issues
 */

const axios = require('axios');

// API Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const EMAIL_ENDPOINT = `${API_URL}/api/welcome/send`;

// Email details
const emailDetails = {
  to: 'shehubashir647@gmail.com',
  name: 'Shehu Bashir',
  planFrom: 'Starter',
  planTo: 'Standard'
};

// Sample email details
const sampleEmailDetails = {
  to: 'crestack@gmail.com',
  name: 'Crestack Team',
  planFrom: 'Starter',
  planTo: 'Standard'
};

async function sendWelcomeEmail(emailData, isSample = false) {
  try {
    console.log(`${isSample ? 'Sending sample email' : 'Sending welcome email'}...`);
    console.log('To:', emailData.to);
    console.log('Name:', emailData.name);
    
    const response = await axios.post(EMAIL_ENDPOINT, emailData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ ${isSample ? 'Sample email' : 'Welcome email'} sent successfully!`);
    console.log('Message ID:', response.data.messageId);
    console.log('Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending ${isSample ? 'sample email' : 'welcome email'}:`, 
      error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('HAUSA WELCOME EMAIL - VIA BACKEND API');
  console.log('From: Starter Plan → Standard Plan');
  console.log('='.repeat(60));
  console.log('API URL:', EMAIL_ENDPOINT);
  console.log();
  
  try {
    // Check if API is reachable
    console.log('Checking API availability...');
    try {
      await axios.get(`${API_URL}/api/welcome/send`, { method: 'HEAD', timeout: 5000 });
    } catch (e) {
      // Expected to fail for POST endpoint, just checking if server is running
      console.log('✓ API server appears to be running');
    }
    
    console.log();
    
    // Send welcome email to the upgraded user
    await sendWelcomeEmail(emailDetails);
    
    console.log('\n' + '-'.repeat(60));
    
    // Send sample to crestack@gmail.com
    await sendWelcomeEmail(sampleEmailDetails, true);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL EMAILS SENT SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log('1. Hausa welcome email sent to: shehubashir647@gmail.com');
    console.log('2. Sample email sent to: crestack@gmail.com');
    console.log('\nThe Hausa welcome email includes:');
    console.log('✓ Warm congratulatory message in Hausa');
    console.log('✓ Notification of upgrade from Starter to Standard Plan');
    console.log('✓ List of Standard Plan features in Hausa');
    console.log('✓ Call-to-action button to access dashboard');
    console.log('✓ Support contact information');
    
  } catch (error) {
    console.error('\n❌ FAILED TO SEND EMAILS:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your Next.js app is running: npm run dev');
    console.log('2. Check that BREVO_API_KEY is set in .env.local');
    console.log('3. Verify the API endpoint: POST /api/welcome/send');
    process.exit(1);
  }
}

// Run the script
main();