/**
 * MO App Integration Testing Suite
 * 
 * Tests end-to-end integration:
 * Alibaba Cloud Gateway → Firebase → Qwen3.5 → Firestore
 * 
 * Usage: node test-integration.js
 */

require('dotenv').config({ path: '.env.test' });
const crypto = require('crypto');
const axios = require('axios');

// ═══════════════════════════════════════════
//  Configuration
// ═══════════════════════════════════════════

const CONFIG = {
  // Firebase Direct URLs (bypass gateway)
  firebase: {
    recordSale: process.env.FIREBASE_FUNCTION_URL_RECORD_SALE,
    addProduct: process.env.FIREBASE_FUNCTION_URL_ADD_PRODUCT,
    askBusiness: process.env.FIREBASE_FUNCTION_URL_ASK_BUSINESS,
  },
  
  // Alibaba Cloud API Gateway URLs
  gateway: {
    recordSale: process.env.GATEWAY_URL_RECORD_SALE,
    addProduct: process.env.GATEWAY_URL_ADD_PRODUCT,
    askBusiness: process.env.GATEWAY_URL_ASK_BUSINESS,
  },
  
  // Alibaba Cloud Authentication
  alibaba: {
    appKey: process.env.ALIBABA_APP_KEY,
    appSecret: process.env.ALIBABA_APP_SECRET,
  },
  
  // Test Data
  testMerchantId: process.env.TEST_MERCHANT_ID || 'demo',
  testUserId: process.env.TEST_USER_ID || 'test-user-123',
  
  // Timeouts
  timeout: 60000, // 60 seconds for AI calls
};

// ═══════════════════════════════════════════
//  Test Results Tracker
// ═══════════════════════════════════════════

const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logResult(testName, passed, details = '', responseTime = 0) {
  results.tests.push({ testName, passed, details, responseTime });
  if (passed) {
    results.passed++;
    console.log(`✅ PASS: ${testName} (${responseTime}ms)`);
  } else {
    results.failed++;
    console.log(`❌ FAIL: ${testName}`);
    if (details) console.log(`   Error: ${details}`);
  }
}

// ═══════════════════════════════════════════
//  Helper Functions
// ═══════════════════════════════════════════

/**
 * Generate HMAC-SHA256 signature for Alibaba Cloud Gateway
 */
function generateAlibabaSignature(method, url, appSecret, timestamp) {
  const stringToSign = `${method}\n${url}\n${timestamp}\n${appSecret}`;
  return crypto
    .createHmac('sha256', appSecret)
    .update(stringToSign)
    .digest('base64');
}

/**
 * Make HTTP request with optional Alibaba Cloud auth
 */
async function makeRequest(url, method = 'POST', data = null, useAlibabaAuth = false) {
  const startTime = Date.now();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (useAlibabaAuth && CONFIG.alibaba.appKey && CONFIG.alibaba.appSecret) {
    const timestamp = new Date().toISOString();
    const signature = generateAlibabaSignature(
      method,
      url,
      CONFIG.alibaba.appSecret,
      timestamp
    );
    
    headers['X-Ca-Key'] = CONFIG.alibaba.appKey;
    headers['X-Ca-Timestamp'] = timestamp;
    headers['X-Ca-Signature'] = signature;
  }
  
  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout: CONFIG.timeout,
    });
    
    const responseTime = Date.now() - startTime;
    return {
      success: true,
      status: response.status,
      data: response.data,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      responseTime,
    };
  }
}

/**
 * Validate response structure
 */
function validateResponse(response, expectedFields) {
  if (!response.success) return false;
  if (response.status !== 200) return false;
  
  for (const field of expectedFields) {
    if (!(field in response.data)) {
      console.log(`   Missing field: ${field}`);
      return false;
    }
  }
  
  return true;
}

// ═══════════════════════════════════════════
//  Test Cases
// ═══════════════════════════════════════════

console.log('\n🧪 MO App Integration Testing Suite\n');
console.log('═══════════════════════════════════════════\n');

// ───────────────────────────────────────────
//  TEST 1: Record Sale (Firebase Direct)
// ───────────────────────────────────────────

async function testRecordSaleFirebase() {
  console.log('\n📦 TEST 1: Record Sale (Firebase Direct)\n');
  
  const payload = {
    merchant_id: CONFIG.testMerchantId,
    user_id: CONFIG.testUserId,
    text: 'Sold 2 bags of rice for 5000 naira cash',
  };
  
  // Success Case
  const success = await makeRequest(
    CONFIG.firebase.recordSale,
    'POST',
    payload
  );
  
  logResult(
    'Record Sale - Success Case',
    validateResponse(success, ['status', 'data', 'message']),
    success.error || JSON.stringify(success.data),
    success.responseTime
  );
  
  // Error Case - Missing fields
  const errorCase = await makeRequest(
    CONFIG.firebase.recordSale,
    'POST',
    { merchant_id: CONFIG.testMerchantId }
  );
  
  logResult(
    'Record Sale - Error Case (Missing Fields)',
    errorCase.status === 400 || errorCase.status === 500,
    errorCase.error || `Status: ${errorCase.status}`,
    errorCase.responseTime
  );
}

// ───────────────────────────────────────────
//  TEST 2: Record Sale (API Gateway)
// ───────────────────────────────────────────

async function testRecordSaleGateway() {
  console.log('\n📦 TEST 2: Record Sale (API Gateway)\n');
  
  const payload = {
    merchant_id: CONFIG.testMerchantId,
    user_id: CONFIG.testUserId,
    text: 'Sold 3 bottles of water for 600 naira transfer',
  };
  
  const response = await makeRequest(
    CONFIG.gateway.recordSale,
    'POST',
    payload,
    true // Use Alibaba auth
  );
  
  logResult(
    'Record Sale - Gateway Auth',
    validateResponse(response, ['status', 'data', 'message']),
    response.error || JSON.stringify(response.data),
    response.responseTime
  );
}

// ───────────────────────────────────────────
//  TEST 3: Add Product (Firebase Direct)
// ───────────────────────────────────────────

async function testAddProductFirebase() {
  console.log('\n📦 TEST 3: Add Product (Firebase Direct)\n');
  
  const payload = {
    merchant_id: CONFIG.testMerchantId,
    user_id: CONFIG.testUserId,
    name: 'Test Product',
    price: 1000,
    imageUrl: 'https://example.com/product.jpg',
  };
  
  const success = await makeRequest(
    CONFIG.firebase.addProduct,
    'POST',
    payload
  );
  
  logResult(
    'Add Product - Success Case',
    validateResponse(success, ['status', 'data', 'message']),
    success.error || JSON.stringify(success.data),
    success.responseTime
  );
  
  // Error Case - Missing price
  const errorCase = await makeRequest(
    CONFIG.firebase.addProduct,
    'POST',
    { merchant_id: CONFIG.testMerchantId, name: 'Test' }
  );
  
  logResult(
    'Add Product - Error Case (Missing Price)',
    errorCase.status === 400 || errorCase.status === 500,
    errorCase.error || `Status: ${errorCase.status}`,
    errorCase.responseTime
  );
}

// ───────────────────────────────────────────
//  TEST 4: Add Product (API Gateway)
// ───────────────────────────────────────────

async function testAddProductGateway() {
  console.log('\n📦 TEST 4: Add Product (API Gateway)\n');
  
  const payload = {
    merchant_id: CONFIG.testMerchantId,
    user_id: CONFIG.testUserId,
    name: 'Gateway Test Product',
    price: 2000,
  };
  
  const response = await makeRequest(
    CONFIG.gateway.addProduct,
    'POST',
    payload,
    true
  );
  
  logResult(
    'Add Product - Gateway Auth',
    validateResponse(response, ['status', 'data', 'message']),
    response.error || JSON.stringify(response.data),
    response.responseTime
  );
}

// ───────────────────────────────────────────
//  TEST 5: Ask Business (Firebase Direct)
// ───────────────────────────────────────────

async function testAskBusinessFirebase() {
  console.log('\n📦 TEST 5: Ask Business (Firebase Direct)\n');
  
  const payload = {
    merchant_id: CONFIG.testMerchantId,
    user_id: CONFIG.testUserId,
    question: 'How is my business doing?',
  };
  
  const success = await makeRequest(
    CONFIG.firebase.askBusiness,
    'POST',
    payload
  );
  
  logResult(
    'Ask Business - Success Case',
    validateResponse(success, ['status', 'data', 'message']) &&
    typeof success.data?.answer === 'string',
    success.error || JSON.stringify(success.data),
    success.responseTime
  );
  
  // Validate AI response is not empty
  logResult(
    'Ask Business - AI Response Valid',
    success.success && 
    success.data?.answer?.length > 10 &&
    success.data?.answer?.length < 2000,
    `Response length: ${success.data?.answer?.length || 0}`,
    success.responseTime
  );
}

// ───────────────────────────────────────────
//  TEST 6: Ask Business (API Gateway)
// ───────────────────────────────────────────

async function testAskBusinessGateway() {
  console.log('\n📦 TEST 6: Ask Business (API Gateway)\n');
  
  const payload = {
    merchant_id: CONFIG.testMerchantId,
    user_id: CONFIG.testUserId,
    question: 'What should I restock?',
  };
  
  const response = await makeRequest(
    CONFIG.gateway.askBusiness,
    'POST',
    payload,
    true
  );
  
  logResult(
    'Ask Business - Gateway Auth',
    validateResponse(response, ['status', 'data', 'message']) &&
    typeof response.data?.answer === 'string',
    response.error || JSON.stringify(response.data),
    response.responseTime
  );
}

// ───────────────────────────────────────────
//  TEST 7: Performance Tests
// ───────────────────────────────────────────

async function testPerformance() {
  console.log('\n⚡ TEST 7: Performance Tests\n');
  
  const payload = {
    merchant_id: CONFIG.testMerchantId,
    user_id: CONFIG.testUserId,
    question: 'Show me my sales',
  };
  
  const response = await makeRequest(
    CONFIG.firebase.askBusiness,
    'POST',
    payload
  );
  
  // AI should respond within 60 seconds
  logResult(
    'Performance - AI Response Time < 60s',
    response.responseTime < 60000,
    `${response.responseTime}ms`,
    response.responseTime
  );
  
  // Ideally should be < 30 seconds
  logResult(
    'Performance - AI Response Time < 30s (Ideal)',
    response.responseTime < 30000,
    `${response.responseTime}ms`,
    response.responseTime
  );
}

// ───────────────────────────────────────────
//  TEST 8: JSON Validation
// ───────────────────────────────────────────

async function testJSONValidation() {
  console.log('\n📋 TEST 8: JSON Validation\n');
  
  const payload = {
    merchant_id: CONFIG.testMerchantId,
    user_id: CONFIG.testUserId,
    text: 'Sold 5 items for 10000',
  };
  
  const response = await makeRequest(
    CONFIG.firebase.recordSale,
    'POST',
    payload
  );
  
  // Check if response is valid JSON
  logResult(
    'JSON Validation - Response is Valid JSON',
    response.success && typeof response.data === 'object',
    response.error || 'Valid JSON',
    response.responseTime
  );
  
  // Check if AI response contains expected structure
  if (response.success && response.data?.data) {
    const hasProducts = Array.isArray(response.data.data.products);
    const hasTotal = typeof response.data.data.total === 'number';
    
    logResult(
      'JSON Validation - Sale Data Structure',
      hasProducts && hasTotal,
      `Products: ${hasProducts}, Total: ${hasTotal}`,
      response.responseTime
    );
  }
}

// ═══════════════════════════════════════════
//  Run All Tests
// ═══════════════════════════════════════════

async function runAllTests() {
  console.log('Configuration:');
  console.log(`  Firebase Record Sale: ${CONFIG.firebase.recordSale ? '✅' : '❌'}`);
  console.log(`  Firebase Add Product: ${CONFIG.firebase.addProduct ? '✅' : '❌'}`);
  console.log(`  Firebase Ask Business: ${CONFIG.firebase.askBusiness ? '✅' : '❌'}`);
  console.log(`  Gateway Record Sale: ${CONFIG.gateway.recordSale ? '✅' : '❌'}`);
  console.log(`  Gateway Add Product: ${CONFIG.gateway.addProduct ? '✅' : '❌'}`);
  console.log(`  Gateway Ask Business: ${CONFIG.gateway.askBusiness ? '✅' : '❌'}`);
  console.log(`  Alibaba Auth: ${CONFIG.alibaba.appKey ? '✅' : '❌'}`);
  console.log(`  Test Merchant ID: ${CONFIG.testMerchantId}`);
  console.log('\n═══════════════════════════════════════════\n');
  
  // Check if URLs are configured
  if (!CONFIG.firebase.recordSale) {
    console.log('⚠️  Skipping tests - Firebase URLs not configured in .env.test\n');
    return;
  }
  
  // Run tests
  await testRecordSaleFirebase();
  await testRecordSaleGateway();
  await testAddProductFirebase();
  await testAddProductGateway();
  await testAskBusinessFirebase();
  await testAskBusinessGateway();
  await testPerformance();
  await testJSONValidation();
  
  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total:  ${results.passed + results.failed}`);
  
  const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  console.log(`📊 Pass Rate: ${passRate}%\n`);
  
  if (results.failed > 0) {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(err => {
  console.error('💥 Test suite crashed:', err);
  process.exit(1);
});
