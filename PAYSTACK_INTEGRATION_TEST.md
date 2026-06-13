# Paystack Subscription Integration - Testing Instructions

## What Was Implemented

1. **Subscription Initialization Endpoint**: `/api/payments/initialize-subscription`
   - Accepts: plan, userId, email, amount
   - Calls Paystack API to initialize transaction
   - Returns authorization_url for checkout
   - Saves payment reference to Firestore

2. **Subscription Verification Endpoint**: `/api/payments/verify-subscription`
   - Accepts: reference
   - Verifies transaction with Paystack
   - Updates user subscription status in Firestore
   - Sets subscription end date based on plan

3. **Updated Subscribe Page**: `/subscribe`
   - Changed from Whop to Paystack
   - Calls new initialization endpoint
   - Redirects to Paystack checkout

## Required Environment Variables

Ensure these are set in your `.env.local` file:
```
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your production URL)
```

## Testing Steps

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Subscription Initialization

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/payments/initialize-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "starter",
    "userId": "test-user-id",
    "email": "test@example.com",
    "amount": 15
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "reference": "paystack_reference",
    "authorization_url": "https://checkout.paystack.co/...",
    "access_code": "access_code"
  }
}
```

### 3. Test Subscription Verification

After completing a payment, test the verification endpoint:

```bash
curl -X POST http://localhost:3000/api/payments/verify-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "paystack_reference_from_step_2"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "status": "success",
    "reference": "paystack_reference",
    "amount": 1500,
    "metadata": { ... }
  }
}
```

### 4. Test Full Flow via UI

1. Navigate to `/subscribe` page
2. Select a plan (Starter, Standard, or Pro)
3. Click "Continue" button
4. Should redirect to Paystack checkout
5. Complete payment (use test card for testing)
6. After payment, should redirect back and verify
7. Check Firestore to confirm subscription status updated

### 5. Test Paystack Test Cards

For testing in Paystack sandbox mode, use these test cards:

**Success Card:**
- Card Number: 4084 0840 8404 0841
- Expiry: Any future date
- CVV: Any 3 digits

**Failure Card:**
- Card Number: 4084 0840 8404 0841
- Expiry: Any future date
- CVV: Any 3 digits
- PIN: Wrong PIN

## Firestore Checks

After successful payment, verify in Firestore:

1. **Payment Record**: Check `subscriptionPayments/{reference}` collection
   - Should have status: 'success'
   - Should have transactionData

2. **User Subscription**: Check `users/{userId}` document
   - subscriptionStatus: 'active'
   - subscriptionPlan: plan name
   - subscriptionStartDate: timestamp
   - subscriptionEndDate: timestamp
   - lastPaymentReference: reference
   - lastPaymentAmount: amount

## Troubleshooting

**Error: "Paystack secret key not configured"**
- Ensure PAYSTACK_SECRET_KEY is set in .env.local
- Restart the dev server after adding the key

**Error: "Failed to initialize payment"**
- Check Paystack API key is valid
- Check network connectivity
- Check Paystack API status

**Payment not verifying**
- Ensure callback_url matches your domain
- Check Paystack webhook is receiving requests
- Check console for verification errors

## Notes

- The integration uses Paystack's transaction API (not subscription API) for simplicity
- Subscription end dates are calculated based on plan:
  - Starter: 1 month
  - Standard: 6 months
  - Pro: 1 year
- All amounts are in Naira (NGN)
- Paystack expects amounts in kobo (amount * 100)
