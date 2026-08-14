# Busmo — Firebase → Supabase Migration

We are moving the entire platform off Google Firebase (Auth, Firestore, Storage,
Cloud Functions, App Hosting) onto Supabase (Auth, Postgres, Storage, Realtime,
Edge Functions).

This document is the runbook. Foundation artifacts live in:

| Artifact | Purpose |
| --- | --- |
| `supabase/migrations/0001_initial_schema.sql` | Full Postgres schema mirroring Firestore + RLS |
| `supabase/migrations/0002_storage_buckets.sql` | Storage buckets + object policies |
| `src/lib/supabase.ts` | Browser client (anon key, RLS-enforced) |
| `src/lib/supabase-server.ts` | Server client (service_role, bypasses RLS) |
| `scripts/migrate/export-firestore.mjs` | Dump Firestore → JSON |
| `scripts/migrate/import-auth-users.mjs` | Recreate Firebase users in Supabase Auth |
| `scripts/migrate/import-supabase.mjs` | Load JSON → Postgres |

---

## 1. One-time migration runbook (cutover)

Order matters. Do this during a maintenance window.

```bash
# 0) Prereqs in .env.local
#    NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#    SUPABASE_SERVICE_ROLE_KEY,
#    NEXT_PUBLIC_FIREBASE_* + FIREBASE_ADMIN_* (still needed for the export)

# 1) Dump Firestore
node scripts/migrate/export-firestore.mjs
#    -> supabase/migration-data/*.json

# 2) Apply schema to Supabase (SQL editor or supabase CLI)
#    supabase/migrations/0001_initial_schema.sql
#    supabase/migrations/0002_storage_buckets.sql

# 3) Recreate auth users (AFTER schema, BEFORE data)
node scripts/migrate/import-auth-users.mjs
#    -> supabase/migration-data/auth-users.json (firebaseUid -> supabaseUid)

# 4) Load data (businesses/users first, then the rest).
#    Uses PostgREST + the service-role key; no DATABASE_URL needed.
node scripts/migrate/import-supabase.mjs businesses users
node scripts/migrate/import-supabase.mjs
```

Verification: row counts in `_meta.json` vs `select count(*)` per table; spot check
a business with sales/products.

> **Users & passwords.** `import-auth-users.mjs` creates users with a random
> password and `email_confirm = true`. After cutover, trigger the "forgot
> password" flow or send reset links so users can set a real password.
>
> **admins/superadmins.** Set `users.role` on the existing admin emails after
> import (the migration plan should map `crestack@gmail.com` + the
> `ADMIN_EMAIL_ROLES` allowlist in `src/lib/adminAuth.ts`).

---

## 2. Collection → table mapping

### Platform / auth
| Firestore | Supabase table |
| --- | --- |
| `users` (+ `users/{uid}/subscriptions`, `users/{uid}/staff_permissions`) | `users`, `subscriptions`, `staff_permissions` |
| `admins`, `admin_permissions`, `subscribers`, `plans` | same name |
| `invitations`, `businesses/{bid}/invitations` | `invitations` |
| `businesses`, `businesses/{bid}/profile` | `businesses`, `business_profiles` |

### Business domain (all keyed by `business_id`)
| Firestore | Supabase table |
| --- | --- |
| `/products` | `products` |
| `/sales` | `sales` |
| `/expenses` | `expenses` |
| `/transactions` | `transactions` |
| `/inventoryAdjustments` | `inventory_adjustments` |
| `/customers`, `/credit_customers`, `/credit_transactions` | `customers`, `credit_customers`, `credit_transactions` |
| `/cashFlow`, `/cashReconciliations` | `cash_flow`, `cash_reconciliations` |
| `/staff`, `/staffActivity`, `/attendance` | `staff`, `staff_activity`, `attendance` |
| `/suppliers`, `/supplier_credit`, `/purchases`, `/stockReceipts` | same name |
| `/orders`, `/notifications`, `/statements`, `/branches` | same name |
| `/conversations`, `/aiConversations`, `/ai_questions`, `/auditTrail` | same name |
| `/bankAccount`, `/bankAccounts`, `/bankTransactions` | `bank_accounts`, `bank_transactions` |
| `/paymentTransactions`, `/payouts`, `/serviceRequests` | same name |
| `mo_messages`, `mo_conversations` | same name |

### Storefront / marketplace
| Firestore | Supabase table |
| --- | --- |
| `store` | `store` (1 row / business, pk = business_id) |
| `storeProducts`, `storeCollections`, `storeOrders`, `checkoutSessions`, `storeAnalytics`, `storeShippingZones` | same name |
| `marketProducts`, `marketBanners`, `marketGifBanners`, `marketCategories`, `reviews`, `blogs` | same name |

### Referrals / support / misc
| Firestore | Supabase table |
| --- | --- |
| `referrals`, `referralEarnings`, `referralStats`, `referralPayouts`, `referralCodes` | same name |
| `supportTickets`, `supportMessages`, `supportAgents`, `chatConversations`, `chatMessages`, `deliveryAgents` | same name |
| `coupons`, `subscriptionTransactions`, `announcements`, `investments`, `businessVerifications`, `pageVisits` | same name |
| `campaigns`, `contentCalendar`, `socialProfiles` | same name |
| `ugcCreators`, `ugcVideos`, `ugcOrders`, `waitlist` | same name |

---

## 3. Conventions in the new schema

- **IDs.** Business-scoped tables keep the Firestore document id as a `text`
  primary key. `users.id` is a `uuid` = `auth.users.id`. `firebase_uid` is kept
  on `users` for continuity.
- **Timestamps.** `created_at` / `updated_at` `timestamptz`. `updated_at` is
  maintained by a trigger. Firestore `createdAt`/`updatedAt` map onto them.
- **Money.** `numeric(14,2)`. **Quantity.** `integer`. **Flexible data.**
  `jsonb` columns (`items`, `metadata`, `permissions`, ...).
- **Casing.** Firestore camelCase ↔ SQL snake_case (`totalRevenue` →
  `total_revenue`). The import script handles this automatically.
- **RLS.** Business-scoped tables use `is_business_member(business_id)` (owner +
  staff + admins) for CRUD. Marketplace/public tables allow `select` for all and
  writes via service_role. Admin tables are service_role-only.

---

## 4. Auth replacement

| Firebase feature | Supabase equivalent |
| --- | --- |
| `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` | `supabase.auth.signUp` / `signInWithPassword` |
| Google popup (`signInWithPopup`) | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Email-link sign in / OTP | `supabase.auth.signInWithOtp` |
| `onAuthStateChanged` | `supabase.auth.onAuthStateChange` |
| `getIdToken` for server verification | `supabase.auth.getSession` + `JWT` (verify with Supabase JWKS in API routes) |
| Password reset | `supabase.auth.resetPasswordForEmail` |
| Custom claims (`admin` etc.) | Column `users.role` + RLS helper `is_admin()` |

Work still to do (phase 2):
- Replace `src/firebase/provider.tsx` auth-state with a `SupabaseProvider`.
- Replace `src/lib/auth.ts` OTP flow (`httpsCallable` → REST).
- Rewrite server routes that call `getAdminAuth()` (createStaff, restore-user-access)
  to use `supabase.auth.admin`.

---

## 5. Cloud Functions → replacement

| Function | Replacement |
| --- | --- |
| `askMo` | Already server-side (`/api/ask-mo`); swap `getAdminDb` reads to `getSupabaseAdmin()` |
| `initializePayment` / `verifyPayment` / `paystackWebhook` | `/api/payments/*` routes + a Supabase Edge Function for the webhook, or keep the existing API route and point Paystack there |
| `sendTrialReminders`, `sendDailySummaries`, `sendBusinessInsights` | `pg_cron` job or Supabase scheduled Edge Function |
| `createStaff` | API route using `supabase.auth.admin` + insert into `staff` |

---

## 6. Realtime (Firestore `onSnapshot`)

Supabase equivalent: `postgres_changes` subscriptions on tables (e.g.
`supabase.channel(...).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales', filter: 'business_id=eq.'+bid })`).
Components to migrate: `BranchContext`, `use-doc`, `use-collection`,
`admin/support/page.tsx`, `SupportInbox`, `FloatingChatWidget`.

---

## 7. Storage

| Firebase bucket path | Supabase bucket |
| --- | --- |
| `products/{businessId}/**` | `products` |
| `apps/**` | `apps` |
| `storeProducts/{businessId}/**` | `store-products` |
| avatars / expenses / logos / receipts | `avatars`, `expenses`, `logos`, `receipts`, `uploads`, `media` |

File URLs change from `https://firebasestorage.googleapis.com/...` to
`{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`. Services to swap:
`voice-storage.service.ts`, `add-product-service.ts`, `add-expense-service.ts`,
`AvatarModal`, `Addproductpage`, `Addexpensepage`.

---

## 8. Phased app migration plan (still to do)

1. **Phase A — foundation (this commit):** deps, clients, schema, scripts, runbook.
2. **Phase B — auth:** swap sign-up/login/Google/session provider + server JWT
   verification; backfill `users` via the auth trigger.
3. **Phase C — data access layer:** replace `getAdminDb()` with
   `getSupabaseAdmin()` in API routes and services (start with `ask-mo`).
4. **Phase D — realtime:** convert `onSnapshot` hooks to `postgres_changes`.
5. **Phase E — storage:** swap upload/download helpers + stored URLs.
6. **Phase F — functions:** migrate scheduled jobs and Paystack webhook.
7. **Phase G — decommission:** remove `src/firebase/*`, firebase deps, rules,
   `functions/` after a soak period.

---

## 9. Known gaps / TODOs

- [ ] Apply `supabase/migrations/0001` + `0002` to the project (SQL Editor or
      `supabase db push`). No connection string needed — the SQL Editor runs
      against the project directly from the dashboard.
- [ ] `DATABASE_URL` is **optional** — import uses the service-role key over
      PostgREST. Only fill it if you plan raw SQL / `pg_dump`.
- [ ] Recreate the `admins`/`admin_permissions` rows and set `users.role`.
- [ ] Firestore *Realtime Database* (`databaseURL` in config) — confirm nothing
      uses it (`getDatabase` not found in code, but verify).
- [ ] Subscription webhooks (`subscriptionTransactions`) parity check.
- [ ] FCM / push notifications (if any) — need a Supabase Edge Function.
- [ ] `apphosting.yaml` + `firebase.json` removal at the end.
