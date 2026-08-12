# ðŸš€ Busmo - Quick Deployment Guide

## âœ… What's Ready

- [x] Staff authentication fixed (uses real Firebase)
- [x] Forgot password page created
- [x] Storage rules created
- [x] Firestore indexes created
- [x] Environment files created
- [x] Paystack LIVE key configured âœ…
- [x] DashScope API key configured âœ…

## âš ï¸ Missing Keys (Get These Now)

You need 2 more keys to complete setup:

### 1. Google AI API Key (2 minutes)
**Get it here:** https://makersuite.google.com/app/apikey

1. Go to the link above
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)
5. Add to both files:
   - `.env.local`: Replace `your-google-ai-api-key`
   - `functions/.env`: Replace `your-google-ai-api-key`

### 2. SendGrid API Key (5 minutes)
**Get it here:** https://app.sendgrid.com/settings/api_keys

1. Go to the link above (create free account if needed)
2. Click "Create API Key"
3. Name it "Busmo Production"
4. Select "Full Access"
5. Copy the key (starts with `SG.`)
6. Add to both files:
   - `.env.local`: Replace `your-sendgrid-api-key`
   - `functions/.env`: Replace `your-sendgrid-api-key`

---

## ðŸš€ Deploy to Firebase (5 minutes)

### Step 1: Login to Firebase

```bash
cd c:\firebase\studio
firebase login
```

### Step 2: Set Your Project

```bash
firebase use bizassistant2-62305643-adad7
```

### Step 3: Deploy Secrets (Secure Method)

```bash
# Deploy API keys securely
firebase functions:secrets:set MISTRAL_API_KEY
# (Paste your Google AI key when prompted)

firebase functions:secrets:set SENDGRID_API_KEY
# (Paste your SendGrid key when prompted)

firebase functions:secrets:set PAYSTACK_SECRET_KEY
# (Already in .env, but this secures it in cloud)
```

### Step 4: Deploy Everything

```bash
# Deploy all Firebase services
firebase deploy
```

This will deploy:
- âœ… Firestore rules
- âœ… Firestore indexes
- âœ… Storage rules
- âœ… Cloud Functions
- âœ… Hosting (if configured)

### Step 5: Test Everything

1. **Test Staff Login:**
   - Go to: `http://localhost:3000/staff/login`
   - Enter your staff email
   - Check email for OTP
   - Enter OTP and login

2. **Test Forgot Password:**
   - Go to: `http://localhost:3000/forgot`
   - Enter your email
   - Check for reset email

3. **Test Payment:**
   - Go to: `http://localhost:3000/plans/subscribe`
   - Click on a plan
   - Paystack modal should appear

---

## ðŸŽ¯ Launch Checklist

- [ ] Get Google AI API Key
- [ ] Get SendGrid API Key
- [ ] Add keys to `.env.local` and `functions/.env`
- [ ] Run `firebase login`
- [ ] Run `firebase use bizassistant2-62305643-adad7`
- [ ] Run `firebase deploy`
- [ ] Test staff login
- [ ] Test forgot password
- [ ] Test payment flow
- [ ] **LAUNCH!** ðŸš€

---

## ðŸ“ž Quick Commands

```bash
# Check if server is running
npm run dev

# Deploy only Cloud Functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules

# View Cloud Functions logs
firebase functions:log

# Stop local server
# Press Ctrl+C in the terminal
```

---

## ðŸŽ‰ You're Almost There!

**Current Status:** 85% Ready

**What's Working:**
- âœ… Staff authentication (real Firebase)
- âœ… Forgot password page
- âœ… Paystack LIVE payments
- âœ… All config files
- âœ… Firebase rules & indexes

**What's Needed:**
- â³ Google AI Key (2 min)
- â³ SendGrid Key (5 min)
- â³ Deploy to Firebase (5 min)

**Total Time to Launch:** ~15 minutes

Let's go! ðŸš€
