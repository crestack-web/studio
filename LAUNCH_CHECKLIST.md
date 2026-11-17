# Busmo Launch Checklist

Last updated: 2026-11-17
Stack: Next.js 15 · Supabase · Paystack · Brevo · PostHog · Google AI

## 1. Code and build

- [x] Five solution suites built (hospitality, healthcare, professional, education, agriculture)
- [x] Shared design system and mobile CSS
- [x] Real suite icons on auth and dashboard surfaces
- [x] Sidebar collapse across desktop breakpoints
- [x] Dashboard suite switcher removed; welcome switcher retained
- [x] Local `solutions.css` only (external CDN injection removed)
- [x] Service worker cache bumped to `busmo-offline-v4`
- [x] `npx tsc --noEmit` clean
- [ ] `npm run build` passes with production env
- [ ] Deployed to Vercel

## 2. Supabase

- [ ] Production project selected
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set (local + Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (local + Vercel)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server only, local + Vercel)
- [ ] Auth Site URL = production domain
- [ ] Auth redirect URL includes `/auth/callback`
- [ ] Email provider enabled; Google provider optional
- [ ] Migrations `0001`–`0034` confirmed applied
- [ ] `0035_solution_desk_completion.sql` applied
- [ ] `0027_solution_staff_desks.sql` and `0028_industry_records.sql` confirmed

## 3. Environment

- [ ] `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `PUBLIC_APP_URL`, `PUBLIC_BRAND_HOST`
- [ ] Paystack keys (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`)
- [ ] `DEFAULT_CURRENCY`, `PAYOUT_DELAY_HOURS`
- [ ] Brevo (`BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`) or Resend fallback (`RESEND_API_KEY`)
- [ ] `GOOGLE_GENAI_API_KEY`
- [ ] Optional `MO_SELL_*` and PostHog variables

## 4. Per-suite end-to-end (all five)

- [ ] Welcome page loads and suite switcher works
- [ ] Signup provisions an organization
- [ ] Login lands on the suite dashboard
- [ ] Onboarding completes for a new business
- [ ] Create/edit/delete a record in at least three sections
- [ ] Records persist after refresh
- [ ] Second business cannot see the first business's data
- [ ] Ask Mo responds with workspace context
- [ ] No console errors
- [ ] No horizontal overflow at 360 px / 856 px / 1280 px

## 5. Cross-cutting

- [ ] `/auth/callback` completes email confirmation
- [ ] `/api/industries/session` returns `200` with a valid token
- [ ] Password reset email delivers
- [ ] PWA manifest and service worker register without errors
- [ ] Sitemap and robots resolve on the production domain

## 6. Commercial decision

- [ ] Choose model: private/free beta **or** paid with 14-day trial
- [ ] If paid: implement trial/subscription gating and verify Paystack subscription flow
- [ ] If beta: update signup copy so it does not promise a trial that is not enforced

## Go / no-go

Ship when sections 1–5 are checked. Section 6 must be decided explicitly before marketing the product publicly.
