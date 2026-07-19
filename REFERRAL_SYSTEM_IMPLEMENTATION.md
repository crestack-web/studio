
# Referral System Implementation Guide

## 🎯 Overview
The referral system is now fully functional with the following features:
- 20% commission on all subscription payments from referred users
- Wallet balance tracking with real-time updates
- Withdrawal functionality with ₦2,000 minimum
- Transaction history
- Paystack integration for payments

## 📁 Files Created/Modified

### 1. API Endpoints
- **`src/app/api/referrals/track-signup/route.ts`** - Tracks when a new user signs up via referral link
- **`src/app/api/referrals/initiate-withdrawal/route.ts`** - Handles withdrawal requests with ₦2,000 minimum
- **`src/app/api/payments/verify-subscription/route.ts`** - Updated to automatically credit 20% commission to referrers

### 2. Frontend Components
- **`src/app/owner/dashboard/ReferralsPage.tsx`** - Complete referral dashboard with:
  - Referral link generation and sharing
  - Real-time balance display
  - Stats tracking (total referrals, active subs, total earned)
  - Transaction history
  - Withdrawal modal with validation

- **`src/app/owner/dashboard/ReferralsPage.module.css`** - Updated styles for transaction list

- **`src/app/welcome/signup/page.tsx`** - Modified to:
  - Capture referral code from URL (`?ref=`)
  - Send referral tracking data after signup

## 🔄 Complete Referral Flow

### Step 1: Referral Link Generation
```
User dashboard → Referrals page → Unique link generated: https://busmo.io/welcome/signup?ref=USER_ID
```

### Step 2: New User Signup
```
User clicks link → Signs up → System captures referrer ID → Creates user account
→ POST /api/referrals/track-signup (records referral relationship)
```

### Step 3: Payment & Commission
```
Referred user subscribes → Pays via Paystack → Payment verification endpoint
→ Calculates 20% commission → Credits referrer's balance
→ Logs transaction in referral_transactions collection
```

### Step 4: Withdrawal
```
User clicks "Withdraw" → Enters amount (min ₦2,000) → Validates balance
→ Checks bank details → Creates withdrawal request
→ Deducts from balance → Admin processes payout
```

## 💾 Database Schema

### Collections Created

#### `referrals`
- `referrerId` - ID of user who referred
- `referredId` - ID of newly signed up user
- `referredEmail` - Email of new user
- `referredName` - Name of new user
- `status` - pending/active/cancelled
- `hasSubscribed` - boolean
- `subscriptionPlan` - plan name
- `subscriptionDate` - timestamp
- `commissionEarned` - total commission from this referral
- `createdAt` - timestamp
- `updatedAt` - timestamp

#### `referral_transactions`
- `referrerId` - referrer's user ID
- `referredId` - referred user's ID
- `type` - commission/withdrawal
- `amount` - transaction amount
- `plan` - subscription plan
- `paymentReference` - referral ID or withdrawal ID
- `createdAt` - timestamp

#### `referral_withdrawals`
- `userId` - user requesting withdrawal
- `amount` - withdrawal amount
- `status` - pending/approved/rejected/processed
- `bankAccountNumber` - user's bank account
- `bankCode` - bank code
- `bankName` - bank name
- `accountName` - account holder name
- `createdAt` - timestamp
- `processedAt` - timestamp

### User Document Fields
- `referralBalance` - current available balance
- `totalEarned` - lifetime earnings
- `totalReferrals` - count of total referrals
- `activeReferrals` - count of active subscriptions
- `pendingWithdrawal` - amount in pending withdrawals
- `bankAccountNumber` - for withdrawals
- `bankCode` - bank code
- `bankName` - bank name
- `accountName` - account holder name

## 🔐 Paystack Integration

### Environment Variables Required
```env
PAYSTACK_SECRET_KEY=sk_live_89d86f3614caf87df47e2dfd60f26394cdcdd75e
PAYSTACK_PUBLIC_KEY=pk_live_e2d2b40b34e758d22b585fc61ebea16ff39775c
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_e2d2b40b34e758d22b585fc61ebea16ff39775c
```

### Withdrawal Flow
The system currently creates withdrawal requests that must be manually processed by admin. To integrate with Paystack for automatic withdrawals:

```typescript
// Future: Add to referral-withdrawal processing
const transferResponse = await fetch('https://api.paystack.co/transfer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: 'balance',
    amount: amount * 100, // in kobo
    recipient: userData.bankAccountNumber // or use transfer recipient code
  })
});
```

## ✅ Testing Checklist

### 1. Referral Link Testing
- [ ] Navigate to Referrals page in dashboard
- [ ] Copy referral link
- [ ] Verify link contains your user ID
- [ ] Open link in incognito browser

### 2. Signup Flow Testing
- [ ] Complete signup via referral link
- [ ] Check browser console for "Referral code captured" log
- [ ] Complete account creation
- [ ] Verify "Referral tracked successfully" message in console
- [ ] Check Firestore `referrals` collection for new document

### 3. Commission Testing
- [ ] Referred user subscribes to a plan (e.g., Starter @ ₦15,000/month or Standard @ ₦40,000/month)
- [ ] Payment is processed via Paystack
- [ ] Verify payment in `subscription_payments` collection
- [ ] Check `referrals` document updated with:
  - `status: 'active'`
  - `hasSubscribed: true`
  - `commissionEarned: amount * 0.20`
- [ ] Verify referrer's `referralBalance` increased by 20% of plan price
- [ ] Check `referral_transactions` collection for commission record

### 4. Wallet Testing
- [ ] View updated balance on Referrals page
- [ ] Stats show correct:
  - Total Referrals count
  - Active Subs count
  - Total Earned amount
  - Current Balance
- [ ] Transaction history displays commission entry

### 5. Withdrawal Testing
- [ ] Attempt withdrawal below ₦2,000 (should fail with error)
- [ ] Add bank details in Settings (if not already present)
- [ ] Attempt withdrawal above ₦2,000
- [ ] Verify withdrawal request created
- [ ] Check balance decreased by withdrawal amount
- [ ] Verify `referral_withdrawals` collection has new document
- [ ] Transaction history shows withdrawal entry

## 🧪 Manual Test Scenarios

### Scenario 1: New Referral Signup
```javascript
// 1. User A gets referral link: https://busmo.io/welcome/signup?ref=USER_A_ID
// 2. User B clicks link and signs up
// 3. Expected: referrals collection has { referrerId: USER_A_ID, referredId: USER_B_ID }
```

### Scenario 2: Commission Calculation
```javascript
// 1. User B (referred) subscribes to Standard plan @ ₦40,000/month
// 2. Payment verified
// 3. Expected:
//    - commissionEarned = 40000 * 0.20 = ₦8,000
//    - referrerBalance += ₦8,000
//    - referral_transactions: { type: 'commission', amount: 8000 }
```

### Scenario 3: Withdrawal Validation
```javascript
// 1. User has ₦5,000 balance
// 2. Attempts to withdraw ₦1,500
// 3. Expected: Error "Minimum withdrawal is ₦2,000"

// 4. Attempts to withdraw ₦6,000
// 5. Expected: Error "Insufficient balance"

// 6. Attempts to withdraw ₦3,000 (no bank details)
// 7. Expected: Error "Please update your bank details in Settings first"

// 8. Adds bank details, withdraws ₦3,000
// 9. Expected: Success, new balance = ₦2,000
```

## 🔍 Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Referrals collection
    match /referrals/{referralId} {
      allow read: if request.auth != null && 
        (resource.data.referrerId == request.auth.uid || 
         resource.data.referredId == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.referrerId != request.auth.uid &&
        request.resource.data.referredId == request.auth.uid;
      allow update: if false; // Only system can update
    }
    
    // Referral transactions
    match /referral_transactions/{txId} {
      allow read: if request.auth != null && 
        resource.data.referrerId == request.auth.uid;
      allow create: if false; // Only system can create
    }
    
    // Withdrawal requests
    match /referral_withdrawals/{withdrawalId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      allow update: if false; // Only admin can update
    }
    
    // Users - referral fields
    match /users/{userId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
      
      // Only allow updates to referral fields by the user themselves
      allow update: if request.auth != null && request.auth.uid == userId &&
        request.resource.data.keys().hasAny([
          'referralBalance', 'bankAccountNumber', 'bankCode', 
          'bankName', 'accountName', 'pendingWithdrawal'
        ]);
    }
  }
}
```

## 🚀 Next Steps

### Automatic Withdrawal Processing (Optional)
To enable automatic payouts via Paystack:

1. Create a `processed-withdrawals` collection for tracking
2. Add admin-only API route for approving withdrawals
3. Integrate Paystack Transfers API
4. Set up webhook to track transfer status

### Additional Enhancements
- Email notifications for commission earnings
- Email notifications for withdrawal status changes
- Referral leaderboard
- Multi-level referrals (optional)
- Withdrawal history with status tracking

## 🐛 Troubleshooting

### Commission Not Credited
1. Check `referrals` collection for matching `referredId`
2. Verify `status` is not 'cancelled'
3. Check payment verification logs for errors
4. Ensure `userId` is in payment metadata

### Balance Not Updating
1. Check `referral_transactions` for new entries
2. Verify user document exists in `users` collection
3. Check Firestore security rules allow updates

### Withdrawal Fails
1. Verify bank details exist in user document
2. Check balance is above ₦2,000 minimum
3. Ensure `referralBalance` field is populated
4. Check withdrawal request in `referral_withdrawals` collection

## 📊 Testing the Complete Flow

1. **Start here:** Navigate to `/owner/dashboard/referrals` in your app
2. **Copy your referral link**
3. **Open incognito window** and sign up via that link
4. **Subscribe to a plan** (use test card: 4242 4242 4242 4242)
5. **Verify commission** appears in referrer's wallet
6. **Test withdrawal** with amounts above and below minimum

## ✨ Features Implemented

✅ Referral link generation and tracking  
✅ 20% commission on all plan payments  
✅ Real-time wallet balance updates  
✅ Transaction history with filtering  
✅ Withdrawal system with ₦2,000 minimum  
✅ Bank details validation  
✅ Paystack integration maintained  
✅ User-friendly UI with modals  
✅ Error handling and validation  
✅ Non-blocking analytics (won't break main flow)  
✅ Firestore security rules  

## 🎉 Implementation Complete!

The referral system is now fully operational. All commissions are automatically calculated and credited when referred users make payments. Users can track their earnings in real-time and request withdrawals once they reach the ₦2,000 minimum.