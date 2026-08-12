# ðŸ”¥ Firebase Deployment - Manual Steps Required

## âš ï¸ Firebase Login Requires Browser

Firebase CLI needs to open a browser window for authentication.

---

## ðŸ“‹ Follow These Steps:

### Step 1: Get Missing API Keys (7 minutes)

#### 1. Mistral AI API Key (2 min)
1. Go to: **https://console.mistral.ai/api-keys**
2. Click "Create API Key"
3. Copy the key (starts with a long alphanumeric string)
4. Open `c:\firebase\studio\.env.local`
5. Replace this line:
   ```
   MISTRAL_API_KEY=your-mistral-api-key
   ```
   With your actual key:
   ```
   MISTRAL_API_KEY=your-actual-key
   ```
6. Do the same for `c:\firebase\studio\functions\.env`

#### 2. SendGrid API Key (5 min)
1. Go to: **https://app.sendgrid.com/settings/api_keys**
2. Create account if needed (it's free)
3. Click "Create API Key"
4. Name: "Busmo Production"
5. Select "Full Access"
6. Copy the key (starts with `SG.`)
7. Open `c:\firebase\studio\.env.local`
8. Replace this line:
   ```
   SENDGRID_API_KEY=your-sendgrid-api-key
   ```
   With your actual key:
   ```
   SENDGRID_API_KEY=SG.your-actual-key
   ```
9. Do the same for `c:\firebase\studio\functions\.env`

---

### Step 2: Deploy to Firebase (5 minutes)

Open **Command Prompt** or **PowerShell** in the `c:\firebase\studio` folder and run:

```bash
# 1. Login to Firebase (browser will open)
firebase login

# 2. Set your project
firebase use bizassistant2-62305643-adad7

# 3. Deploy secrets securely
firebase functions:secrets:set MISTRAL_API_KEY
# (Paste your Google AI key when prompted)

firebase functions:secrets:set SENDGRID_API_KEY
# (Paste your SendGrid key when prompted)

# 4. Deploy EVERYTHING
firebase deploy
```

---

### Step 3: Test Everything (5 minutes)

#### Test is Complete When You See:
```
âœ”  Deploy complete!
```

#### Then Test:

1. **Staff Login:**
   - Open: http://localhost:3000/staff/login
   - Enter email
   - Check email for OTP
   - Login successfully âœ…

2. **Forgot Password:**
   - Open: http://localhost:3000/forgot
   - Enter email
   - Check for reset email âœ…

3. **Payment Flow:**
   - Open: http://localhost:3000/plans/subscribe
   - Click a plan
   - Paystack modal appears âœ…

---

## ðŸŽ¯ Quick Reference

### Files You Need to Edit:

**File 1:** `c:\firebase\studio\.env.local`
- Replace `your-google-ai-api-key`
- Replace `your-sendgrid-api-key`

**File 2:** `c:\firebase\studio\functions\.env`
- Replace `your-google-ai-api-key`
- Replace `your-sendgrid-api-key`

### Commands to Run:

```bash
firebase login
firebase use bizassistant2-62305643-adad7
firebase functions:secrets:set MISTRAL_API_KEY
firebase functions:secrets:set SENDGRID_API_KEY
firebase deploy
```

---

## âœ… What's Already Done

- [x] Staff authentication fixed
- [x] Forgot password page created
- [x] Storage rules deployed
- [x] Firestore indexes created
- [x] Paystack LIVE key configured âœ…
- [x] DashScope API key configured âœ…
- [x] Environment files created âœ…

---

## ðŸš€ After Deployment

Your app will be live at:
- **Firebase Hosting:** https://busmo.web.app (if configured)
- **Cloud Functions:** https://us-central1-bizassistant2-62305643-adad7.cloudfunctions.net

---

## ðŸ“ž If You Need Help

**Common Issues:**

1. **"firebase: command not found"**
   ```bash
   npm install -g firebase-tools
   ```

2. **"No project found"**
   ```bash
   firebase projects:list
   firebase use --clear
   firebase use bizassistant2-62305643-adad7
   ```

3. **"Deploy failed"**
   ```bash
   # Check logs
   firebase functions:log
   ```

---

## ðŸŽ‰ You're Ready to Launch!

**Current Progress:** 90% Complete

**Just Need:**
1. Get 2 API keys (7 min)
2. Run deploy commands (5 min)
3. Test flows (5 min)

**Total Time:** ~17 minutes to LAUNCH! ðŸš€

See you on the other side! ðŸ‘‹
