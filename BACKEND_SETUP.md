# 🚀 MO App Backend - Deployment Guide

## Prerequisites

1. **Node.js 18+** installed
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Firebase Project** created at [console.firebase.google.com](https://console.firebase.google.com)
4. **Alibaba Cloud DashScope API Key** from [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com)

## 📦 Installation

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Set Environment Variables

```bash
cd functions
cp .env.example .env
```

Edit `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id
DASHSCOPE_API_KEY=sk-your-dashscope-api-key
QWEN_MODEL=qwen-max
QWEN_MAX_TOKENS=2000
QWEN_TEMPERATURE=0.7
```

### 3. Login to Firebase

```bash
firebase login
```

### 4. Set Project

```bash
firebase use <your-project-id>
```

## 🚀 Deploy

### Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This will deploy:
- `recordSale` - POST endpoint for AI-powered sale recording
- `addProduct` - POST endpoint for AI product analysis
- `askBusiness` - POST endpoint for AI business insights
- `health` - GET health check endpoint

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Everything

```bash
firebase deploy
```

## 🔗 API Endpoints

After deployment, your functions will be available at:

```
https://<region>-<project-id>.cloudfunctions.net/recordSale
https://<region>-<project-id>.cloudfunctions.net/addProduct
https://<region>-<project-id>.cloudfunctions.net/askBusiness
https://<region>-<project-id>.cloudfunctions.net/health
```

## 🔌 Alibaba Cloud API Gateway Setup

### 1. Create API Group

1. Go to [API Gateway Console](https://apigateway.console.aliyun.com)
2. Create new API Group
3. Set domain name (e.g., `api.yourdomain.com`)

### 2. Create Backend Service

1. Navigate to **Backend Services**
2. Click **Create Backend Service**
3. Configure:
   - **Name**: MO App Backend
   - **Type**: HTTP/HTTPS
   - **Address**: `https://<region>-<project-id>.cloudfunctions.net`
   - **Path**: `/`

### 3. Create APIs

#### Record Sale API

- **Name**: Record Sale
- **Method**: POST
- **Path**: `/recordSale`
- **Backend**: MO App Backend
- **Request Parameters**:
  ```json
  {
    "merchant_id": "string (required)",
    "user_id": "string (required)",
    "text": "string (required)",
    "language": "string (optional)"
  }
  ```

#### Add Product API

- **Name**: Add Product
- **Method**: POST
- **Path**: `/addProduct`
- **Backend**: MO App Backend
- **Request Parameters**:
  ```json
  {
    "merchant_id": "string (required)",
    "user_id": "string (required)",
    "name": "string (required)",
    "price": "number (required)",
    "imageUrl": "string (optional)"
  }
  ```

#### Ask Business API

- **Name**: Ask Business
- **Method**: POST
- **Path**: `/askBusiness`
- **Backend**: MO App Backend
- **Request Parameters**:
  ```json
  {
    "merchant_id": "string (required)",
    "user_id": "string (required)",
    "question": "string (required)"
  }
  ```

### 4. Configure CORS

In API Gateway, add CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 5. Get API Gateway URL

Your final API endpoint will be:
```
https://<api-group-id>.apigateway.<region>.aliyuncs.com
```

## 📝 Usage Examples

### Record Sale

```bash
curl -X POST https://your-api-gateway-url/recordSale \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "merchant123",
    "user_id": "user456",
    "text": "Sold 2 bags of rice for 5000 naira cash"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "saleId": "abc123",
    "products": [
      {"name": "Rice", "quantity": 2, "price": 2500}
    ],
    "total": 5000,
    "paymentMethod": "cash"
  },
  "message": "Sale recorded successfully"
}
```

### Add Product

```bash
curl -X POST https://your-api-gateway-url/addProduct \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "merchant123",
    "user_id": "user456",
    "name": "Dangote Rice 50kg",
    "price": 25000,
    "imageUrl": "https://storage.googleapis.com/..."
  }'
```

### Ask Business Question

```bash
curl -X POST https://your-api-gateway-url/askBusiness \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "merchant123",
    "user_id": "user456",
    "question": "How are my sales this month?"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "answer": "Your sales this month are ₦150,000 across 45 transactions...",
    "confidence": "high",
    "suggestions": [
      "Restock Rice - only 5 bags left",
      "Consider promoting low-stock items",
      "Track expenses to calculate net profit"
    ]
  }
}
```

## 🔧 Local Development

### Run Emulators

```bash
firebase emulators:start
```

Access emulator UI: [http://localhost:4000](http://localhost:4000)

### Test Functions Locally

```bash
cd functions
npm run shell
```

Then in the shell:
```javascript
recordSale({
  body: {
    merchant_id: 'test123',
    user_id: 'user456',
    text: 'Sold 2 bags of rice for 5000'
  }
})
```

## 📊 Monitoring

### View Logs

```bash
firebase functions:log
```

### Filter by Function

```bash
firebase functions:log --only recordSale
```

## ⚠️ Important Notes

1. **Timeout**: AI functions may take 30-60 seconds. Configure API Gateway timeout accordingly.
2. **Cost**: Monitor token usage in Alibaba Cloud Console.
3. **Security**: All endpoints validate `merchant_id` and `user_id`.
4. **Rate Limiting**: Configure in API Gateway to prevent abuse.

## 🆘 Troubleshooting

### Function Deployment Fails

```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf functions/node_modules
npm install

# Redeploy
firebase deploy --only functions
```

### AI API Errors

- Check `DASHSCOPE_API_KEY` is valid
- Verify API quota in Alibaba Cloud Console
- Check function logs: `firebase functions:log`

### Firestore Permission Errors

- Ensure Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check user authentication in Firebase Console

## 📚 Next Steps

1. Set up Firebase Authentication for user management
2. Configure Firebase Storage for product images
3. Set up Cloud Scheduler for automated reports
4. Integrate with frontend using the API Gateway URL
