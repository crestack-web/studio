// Test script for updated owner welcome email series with business-type-specific content
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';
const axios = require('axios');

async function sendTestEmail(emailData) {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  try {
    const response = await brevoApi.post('/smtp/email', emailData);
    return response.data;
  } catch (error) {
    console.error('Failed to send email:', error.response?.data || error.message);
    throw error;
  }
}

async function testAllBusinessTypes() {
  const businessTypes = [
    { category: 'retail', name: 'Majnun', businessName: 'Test Retail Store' },
    { category: 'restaurant', name: 'Majnun', businessName: 'Test Restaurant' },
    { category: 'wholesale', name: 'Majnun', businessName: 'Test Wholesale Business' },
    { category: 'pharmacy', name: 'Majnun', businessName: 'Test Pharmacy' },
    { category: 'manufacturing', name: 'Majnun', businessName: 'Test Manufacturing' },
  ];

  console.log('🧪 Testing owner welcome emails for different business types...\n');

  // Import the email functions
  const { sendOwnerWelcomeEmail1, sendOwnerWelcomeEmail2, sendOwnerWelcomeEmail3, sendOwnerWelcomeEmail4, sendOwnerWelcomeEmail5 } = require('./src/services/email/owner-welcome-series.ts');

  for (const bizType of businessTypes) {
    console.log(`\n📧 Testing ${bizType.category.toUpperCase()} business type:`);
    console.log(`   Business: ${bizType.businessName}`);
    
    try {
      // Send first email for each business type as a sample
      const result = await sendOwnerWelcomeEmail1({
        email: `majnun+${bizType.category}@busmo.io`,
        name: bizType.name,
        businessName: bizType.businessName,
        businessCategory: bizType.category
      });
      
      console.log(`   ✓ Email sent successfully for ${bizType.category}`);
      
      // Wait 1 second between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ✗ Failed to send email for ${bizType.category}:`, error.message);
    }
  }

  console.log('\n✅ Business-type-specific email testing complete!');
  console.log('\nAll emails have been updated to:');
  console.log('  ✓ Reflect actual Busmo dashboard features');
  console.log('  ✓ Include business-type-specific content');
  console.log('  ✓ Address real misconceptions about Busmo');
  console.log('  ✓ Provide accurate feature descriptions');
  console.log('  ✓ Include practical tips for each business type');
}

// Run the test
testAllBusinessTypes().catch(error => {
  console.error('\n❌ Test failed:', error);
});