// Check available senders in Brevo account
require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY || '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';
const BREVO_API_URL = 'https://api.brevo.com/v3';

const axios = require('axios');

async function checkSenders() {
  const brevoApi = axios.create({
    baseURL: BREVO_API_URL,
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  try {
    console.log('Checking available senders in Brevo account...\n');
    
    const response = await brevoApi.get('/senders');
    console.log('Senders:', JSON.stringify(response.data, null, 2));
    
    if (response.data.senders && response.data.senders.length > 0) {
      console.log('\n✅ Available senders:');
      response.data.senders.forEach((sender, index) => {
        console.log(`${index + 1}. ${sender.email} (${sender.name}) - Status: ${sender.status || 'Unknown'}`);
      });
    } else {
      console.log('\n❌ No senders configured. You need to add a verified sender in Brevo.');
    }
    
  } catch (error) {
    console.error('❌ Error checking senders:');
    console.error(error.response?.data || error.message);
  }
}

checkSenders();
