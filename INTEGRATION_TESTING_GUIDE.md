# 🧪 MO App Integration Testing Guide

**Date:** March 4, 2026  
**Status:** ✅ **READY TO RUN**

---

## 🚀 Quick Start

### **1. Install Dependencies**

```bash
npm install --save-dev axios dotenv
```

### **2. Configure Environment**

```bash
# Copy the template
cp .env.test.example .env.test

# Edit .env.test with your actual values
# - Firebase function URLs
# - API Gateway URLs
# - Alibaba Cloud credentials
```

### **3. Run Tests**

```bash
node test-integration.js
```

---

## 📋 Test Coverage

### **Test Suites:**

| Test | Description | Expected Result |
|------|-------------|-----------------|
| **Record Sale (Firebase)** | Test sale recording via Firebase direct | ✅ 200 OK + sale data |
| **Record Sale (Gateway)** | Test via Alibaba Cloud Gateway | ✅ 200 OK + auth validated |
| **Add Product (Firebase)** | Test product creation | ✅ 200 OK + product data |
| **Add Product (Gateway)** | Test via Gateway | ✅ 200 OK + auth validated |
| **Ask Business (Firebase)** | Test AI business insights | ✅ 200 OK + AI response |
| **Ask Business (Gateway)** | Test via Gateway | ✅ 200 OK + AI response |
| **Performance** | AI response time | ✅ < 60s (ideally < 30s) |
| **JSON Validation** | Response structure | ✅ Valid JSON with expected fields |

---

## 🔍 Test Output Example

```
🧪 MO App Integration Testing Suite

═══════════════════════════════════════════

Configuration:
  Firebase Record Sale: ✅
  Firebase Add Product: ✅
  Firebase Ask Business: ✅
  Gateway Record Sale: ✅
  Gateway Add Product: ✅
  Gateway Ask Business: ✅
  Alibaba Auth: ✅
  Test Merchant ID: demo

═══════════════════════════════════════════

📦 TEST 1: Record Sale (Firebase Direct)

✅ PASS: Record Sale - Success Case (1234ms)
✅ PASS: Record Sale - Error Case (Missing Fields) (567ms)

📦 TEST 2: Record Sale (API Gateway)

✅ PASS: Record Sale - Gateway Auth (1456ms)

...

═══════════════════════════════════════════
📊 TEST SUMMARY
═══════════════════════════════════════════

✅ Passed: 12
❌ Failed: 0
📈 Total:  12
📊 Pass Rate: 100.0%

🎉 All tests passed!
```

---

## 🐛 Troubleshooting Guide

### **Error 1: 401 Unauthorized**

**Symptom:**
```
❌ FAIL: Record Sale - Gateway Auth
   Error: Request failed with status code 401
```

**Causes:**
1. Invalid Alibaba Cloud AppKey/AppSecret
2. Timestamp mismatch (clock skew)
3. Signature generation error

**Solutions:**

✅ **Check credentials:**
```bash
# Verify in .env.test
ALIBABA_APP_KEY=correct-key-here
ALIBABA_APP_SECRET=correct-secret-here
```

✅ **Check server time:**
```bash
# Your server time must be synchronized
ntpdate -s time.nist.gov
```

✅ **Verify signature algorithm:**
The test script uses HMAC-SHA256. Ensure your API Gateway expects the same.

---

### **Error 2: 502 Bad Gateway**

**Symptom:**
```
❌ FAIL: Record Sale - Gateway Auth
   Error: Request failed with status code 502
```

**Causes:**
1. Firebase function not deployed
2. API Gateway backend URL incorrect
3. Firebase function timeout

**Solutions:**

✅ **Deploy Firebase functions:**
```bash
firebase deploy --only functions
```

✅ **Check Gateway backend URL:**
```
In Alibaba Cloud Console:
API Gateway → Your API → Backend Configuration
→ Ensure URL matches: https://us-central1-<project-id>.cloudfunctions.net
```

✅ **Increase function timeout:**
```javascript
// In Firebase function
exports.recordSale = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 60 })
  .https.onRequest(...)
```

---

### **Error 3: Timeout (> 60s)**

**Symptom:**
```
❌ FAIL: Performance - AI Response Time < 60s
   Error: timeout of 60000ms exceeded
```

**Causes:**
1. Qwen3.5 API slow response
2. Network latency
3. Large prompt/context

**Solutions:**

✅ **Increase timeout in test:**
```javascript
// In test-integration.js
const CONFIG = {
  timeout: 90000, // 90 seconds
};
```

✅ **Optimize Qwen prompt:**
```javascript
// Reduce max_tokens
parameters: {
  max_tokens: 500, // Instead of 2000
  temperature: 0.3
}
```

✅ **Check Qwen API status:**
```
Alibaba Cloud Console → DashScope → API Usage
→ Check for rate limits or outages
```

---

### **Error 4: Invalid JSON Response**

**Symptom:**
```
❌ FAIL: JSON Validation - Response is Valid JSON
   Error: Unexpected token < in JSON at position 0
```

**Causes:**
1. Qwen returned HTML error page
2. Firebase function crashed
3. API Gateway error page

**Solutions:**

✅ **Check function logs:**
```bash
firebase functions:log --only recordSale
```

✅ **Validate Qwen response:**
```javascript
// In qwenService.ts
try {
  const json = JSON.parse(response.output.text);
  return json;
} catch (e) {
  console.error('Qwen returned non-JSON:', response.output.text);
  return { error: 'Invalid AI response' };
}
```

✅ **Add error handling:**
```javascript
// In test script
if (typeof response.data !== 'object') {
  console.log('Response was not JSON:', response.data);
}
```

---

### **Error 5: Firestore Permission Denied**

**Symptom:**
```
❌ FAIL: Record Sale - Success Case
   Error: 7 PERMISSION_DENIED
```

**Causes:**
1. Firestore rules too restrictive
2. Missing authentication
3. Wrong collection path

**Solutions:**

✅ **Update Firestore rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /merchants/{merchantId}/record_sale/{saleId} {
      allow create: if true; // For testing
      allow read: if true;
    }
  }
}
```

✅ **Deploy rules:**
```bash
firebase deploy --only firestore:rules
```

✅ **Check collection path:**
```javascript
// Should be:
collection(db, 'merchants', merchantId, 'record_sale')

// Not:
collection(db, 'record_sale') // ❌ Wrong
```

---

### **Error 6: Missing Environment Variables**

**Symptom:**
```
Configuration:
  Firebase Record Sale: ❌
  Gateway Record Sale: ❌
⚠️  Skipping tests - Firebase URLs not configured
```

**Solutions:**

✅ **Create .env.test:**
```bash
cp .env.test.example .env.test
```

✅ **Fill in all values:**
```env
FIREBASE_FUNCTION_URL_RECORD_SALE=https://...
GATEWAY_URL_RECORD_SALE=https://...
ALIBABA_APP_KEY=...
ALIBABA_APP_SECRET=...
TEST_MERCHANT_ID=demo
```

✅ **Verify file is loaded:**
```javascript
// Add to test script
console.log('Loaded env:', process.env.FIREBASE_FUNCTION_URL_RECORD_SALE);
```

---

## 📊 Test Results Interpretation

### **Pass Rate Guide:**

| Pass Rate | Status | Action |
|-----------|--------|--------|
| **100%** | ✅ Production Ready | Deploy to production |
| **80-99%** | ⚠️ Minor Issues | Fix failing tests before launch |
| **50-79%** | ❌ Major Issues | Do not deploy, fix backend |
| **< 50%** | 🚫 Critical Failure | Backend not ready |

---

## 🎯 Pre-Launch Checklist

Before deploying to production:

- [ ] All tests pass (100% pass rate)
- [ ] AI response time < 30s average
- [ ] No permission errors
- [ ] Firestore data validated
- [ ] API Gateway auth working
- [ ] Error handling tested
- [ ] Logs monitored for errors

---

## 🔗 Related Documentation

- **Backend Setup:** `BACKEND_SETUP.md`
- **MO AI Configuration:** `MO_AI_CONFIGURATION.md`
- **Qwen Implementation:** `QWEN_MO_IMPLEMENTATION.md`

---

**Ready to test! Run `node test-integration.js` now!** 🧪🚀
