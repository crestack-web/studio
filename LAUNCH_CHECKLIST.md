# ðŸš€ Busmo Launch Checklist

## Status: âš ï¸ NOT READY FOR PRODUCTION

Last Updated: March 3, 2026

---

## âœ… Completed (Configuration Files Created)

- [x] `storage.rules` - Firebase Storage security rules
- [x] `firestore.indexes.json` - Database indexes
- [x] `.env.example` - Root environment template
- [x] `functions/.env.example` - Cloud Functions env template
- [x] `busmo-whatsapp/.env.example` - WhatsApp bot env template
- [x] `.gitignore` - Updated to protect .env files

---

## âŒ Critical Blockers (Must Fix Before Launch)

### 1. Environment Variables Not Configured

**Action Required:** Create `.env.local` and `functions/.env` with real API keys

#### Required API Keys:

| Service | Variable | Where to Get | Status |
|---------|----------|--------------|--------|
| **Google AI** | `MISTRAL_API_KEY` | [makersuite.google.com](https://makersuite.google.com/app/apikey) | âŒ Missing |
| **Paystack** | `PAYSTACK_SECRET_KEY` | [paystack.com/settings/api-keys](https://paystack.com/settings/api-keys) | âŒ Missing |
| **SendGrid** | `SENDGRID_API_KEY` | [sendgrid.com](https://sendgrid.com) | âŒ Missing |
| **Alibaba Cloud** | `DASHSCOPE_API_KEY` | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com) | âœ… Exists in WhatsApp bot |

#### Steps to Configure:

```bash
# 1. Copy template files
cd c:\firebase\studio
copy .env.example .env.local
copy functions\.env.example functions\.env

# 2. Edit .env.local with your actual keys
# 3. Edit functions\.env with your actual keys
# 4. Deploy environment variables to Firebase
firebase functions:secrets:set MISTRAL_API_KEY
firebase functions:secrets:set PAYSTACK_SECRET_KEY
firebase functions:secrets:set SENDGRID_API_KEY
```

---

### 2. Incomplete Authentication Flow

#### Staff Login Uses Mock Data âŒ
**File:** `src/app/staff/login/page.tsx`

**Current Issue:**
```typescript
// Line 19 - HARDCODED!
const correctOtp = '123456';
```

**Fix Required:**
- Connect to Firebase Auth
- Use OTP functions from `functions/index.js` (`sendOtpLogin`, `verifyOtpLogin`)

#### Missing Pages âŒ
- `/forgot` - Password reset request page
- `/onboarding` - First-time user setup

---

### 3. TODO Comments = Incomplete Features

| File | Line | Issue | Priority |
|------|------|-------|----------|
| `src/app/invest/page.tsx` | 52 | `// TODO: Submit to backend` | HIGH |
| `src/app/Seller/page.tsx` | 25 | `// TODO: Submit to backend` | HIGH |
| `src/app/staff/login/page.tsx` | 19, 31 | `// TODO: Replace with real API call` | HIGH |
| `src/app/owner/dashboard/App.tsx` | 4-29 | AppContext imports commented out | MEDIUM |

---

### 4. Build Errors Suppressed

**File:** `next.config.ts`

```typescript
typescript: {
  ignoreBuildErrors: true,  // âš ï¸ REMOVE THIS
},
eslint: {
  ignoreDuringBuilds: true,  // âš ï¸ REMOVE THIS
},
```

**Action:** Remove these flags and fix all TypeScript errors before launch.

---

## ðŸ”§ High Priority Fixes

### 5. Owner Dashboard Uses Mock Data

**File:** `src/app/owner/dashboard/App.tsx`

Currently shows placeholder content instead of real Firestore data.

**Fix:** Connect to real Firestore queries for:
- Sales metrics
- Product inventory
- Staff performance
- Revenue tracking

### 6. Test Payment Flow End-to-End

**Files:** `functions/src/payments.js`, `src/app/plans/subscribe/page.tsx`

**Test Cases:**
- [ ] Paystack payment initialization
- [ ] Webhook signature validation
- [ ] Subscription activation
- [ ] Failed payment handling
- [ ] Refund processing

### 7. Test Email Delivery

**File:** `functions/email/service.js`

**Test Cases:**
- [ ] Welcome email on signup
- [ ] OTP login email
- [ ] Staff invite email
- [ ] Daily digest to owners
- [ ] Payment confirmation

---

## ðŸ“‹ Medium Priority

### 8. Security Hardening

- [ ] Move Firebase config from `src/firebase/config.ts` to environment variables
- [ ] Remove hardcoded WhatsApp verify token from docs
- [ ] Add rate limiting to Cloud Functions
- [ ] Review Firestore rules for edge cases
- [ ] Add input validation to all API endpoints

### 9. Add Missing Firestore Indexes

**Action:** Run app with Firebase emulator and capture missing index errors

```bash
firebase emulators:start
# Use the app, check emulator UI for missing indexes
# Add to firestore.indexes.json
```

### 10. Monitoring & Logging

- [ ] Set up Sentry for error tracking
- [ ] Enable Firebase Performance Monitoring
- [ ] Configure Cloud Functions logging
- [ ] Set up uptime monitoring

---

## ðŸ“ Low Priority (Post-Launch)

### 11. Documentation

- [ ] Update `README.md` with setup instructions
- [ ] Create deployment runbook
- [ ] Document API endpoints
- [ ] Create user guides

### 12. Testing

- [ ] Add unit tests for Cloud Functions
- [ ] Add E2E tests for critical flows
- [ ] Set up CI/CD pipeline
- [ ] Load testing

### 13. WhatsApp Bot Integration

**Decision Required:** Should `/busmo-whatsapp/` be:
- [ ] Integrated into main app
- [ ] Kept as separate service (document separately)

---

## ðŸŽ¯ Launch Readiness Score

| Category | Score | Status |
|----------|-------|--------|
| **Firebase Setup** | 90% | âœ… Good |
| **Authentication** | 50% | âš ï¸ Needs Work |
| **Database** | 85% | âœ… Good |
| **Cloud Functions** | 70% | âš ï¸ Untested |
| **Environment Config** | 20% | âŒ Critical |
| **Frontend Pages** | 60% | âš ï¸ TODOs |
| **Security** | 40% | âŒ Hardcoded Keys |
| **Documentation** | 30% | âŒ Minimal |

### **Overall: 45/100 - NOT READY FOR PRODUCTION**

---

## ðŸš¦ Go/No-Go Decision

### âœ… GREEN LIGHT (Ready to Launch) When:
- All Critical Blockers are resolved
- Environment variables configured
- Authentication flow tested
- Payment flow tested end-to-end
- Build errors fixed (no suppressed errors)

### âš ï¸ YELLOW LIGHT (Launch with Caution) When:
- Critical blockers resolved
- High priority fixes 50% complete
- Basic monitoring in place

### âŒ RED LIGHT (Do Not Launch) Current Status:
- Critical blockers NOT resolved
- No environment variables configured
- Authentication incomplete
- Build errors suppressed

---

## ðŸ“… Recommended Timeline

| Week | Focus |
|------|-------|
| **Week 1** | Configure environment variables, fix authentication |
| **Week 2** | Complete TODO features, test payments |
| **Week 3** | Security hardening, monitoring setup |
| **Week 4** | Testing, documentation, soft launch |

---

## ðŸ”— Quick Links

- [Firebase Console](https://console.firebase.google.com/project/bizassistant2-62305643-adad7)
- [Paystack Dashboard](https://dashboard.paystack.com)
- [SendGrid Dashboard](https://app.sendgrid.com)
- [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com)
- [Google AI Studio](https://makersuite.google.com)

---

**Prepared by:** Senior Full-Stack Engineer  
**Date:** March 3, 2026  
**Next Review:** After critical blockers are resolved
