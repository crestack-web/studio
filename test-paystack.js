/**
 * Paystack API Test Script
 * Tests Paystack API connectivity and functionality
 */

const https = require('https');

// Load environment variables
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_live_89d86f3614caf87df47e2dfd60f26394cdcdd75e';

console.log('🧪 Testing Paystack API Integration...\n');

// Test 1: Basic Paystack API connectivity (no auth required)
async function testPaystackConnectivity() {
  console.log('📡 Test 1: Paystack API Basic Connectivity');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/bank/resolve?account_number=0000000000&bank_code=057',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Paystack API is reachable');
          console.log(`   Status Code: ${res.statusCode}`);
          console.log(`   Response: ${response.message || 'API is responding'}`);
          resolve(true);
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Paystack API connection error:', error.message);
      resolve(false);
    });

    req.end();
  });
}

// Test 2: Test with authentication (requires secret key)
async function testAuthenticatedRequest() {
  console.log('\n� Test 2: Authenticated Request');
  
  if (!PAYSTACK_SECRET_KEY) {
    console.log('⚠️  PAYSTACK_SECRET_KEY not found in environment variables');
    console.log('   Skipping authenticated test');
    console.log('   Add PAYSTACK_SECRET_KEY to your .env file to test authenticated requests');
    return null;
  }

  console.log('🔑 Using Paystack Secret Key:', PAYSTACK_SECRET_KEY.substring(0, 10) + '...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/verify/invalid_reference_for_test',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Authenticated request successful');
            console.log(`   Status: ${response.status}`);
            console.log(`   Message: ${response.message || 'Authentication working'}`);
            resolve(true);
          } else if (res.statusCode === 401) {
            console.log('❌ Authentication failed');
            console.log('   Check your PAYSTACK_SECRET_KEY');
            resolve(false);
          } else {
            console.log('✅ API responding with authentication');
            console.log(`   Status Code: ${res.statusCode}`);
            console.log(`   Response: ${response.message || 'Expected test response'}`);
            resolve(true);
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Authenticated request error:', error.message);
      resolve(false);
    });

    req.end();
  });
}

// Test 3: Test transaction initialization (requires secret key)
async function testTransactionInitialization() {
  console.log('\n💳 Test 3: Transaction Initialization');
  
  if (!PAYSTACK_SECRET_KEY) {
    console.log('⚠️  PAYSTACK_SECRET_KEY not found - skipping');
    return null;
  }
  
  return new Promise((resolve, reject) => {
    const testData = {
      email: 'test@example.com',
      amount: 1000, // 10 Naira in kobo
      metadata: {
        test: true,
        userId: 'test_user_123'
      }
    };

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status) {
            console.log('✅ Transaction initialization successful');
            console.log(`   Reference: ${response.data.reference}`);
            console.log(`   Access Code: ${response.data.access_code}`);
            console.log(`   Authorization URL: ${response.data.authorization_url}`);
            resolve(true);
          } else {
            console.log('❌ Transaction initialization failed');
            console.log(`   Message: ${response.message}`);
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Transaction initialization error:', error.message);
      resolve(false);
    });

    req.write(JSON.stringify(testData));
    req.end();
  });
}

// Run all tests
async function runTests() {
  const connectivityTest = await testPaystackConnectivity();
  const authTest = await testAuthenticatedRequest();
  const initTest = await testTransactionInitialization();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Basic Connectivity: ${connectivityTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Authenticated Request: ${authTest === null ? '⏭️  SKIPPED' : authTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Transaction Init: ${initTest === null ? '⏭️  SKIPPED' : initTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (connectivityTest) {
    console.log('\n✅ Paystack API is reachable and responding');
    if (authTest === null) {
      console.log('⚠️  Add PAYSTACK_SECRET_KEY to .env to test authenticated operations');
    } else if (authTest && initTest) {
      console.log('🎉 All Paystack API tests passed!');
      console.log('The Paystack integration is fully functional.');
    }
  } else {
    console.log('\n❌ Paystack API is not reachable');
    console.log('Check your internet connection and Paystack service status');
  }
  
  process.exit(connectivityTest ? 0 : 1);
}

runTests().catch(error => {
  console.error('❌ Test execution error:', error);
  process.exit(1);
});
