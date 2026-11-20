# Deploy Busmo

Current stack: **Next.js 15 (App Router) · Supabase (Auth + Postgres + Storage) · Paystack · Brevo · PostHog · Google AI**.

> Ignore any older Firebase deployment notes. Production runs on Supabase + Vercel.

---

## 1. Supabase project

1. Create/choose the production project at <https://supabase.com/dashboard>.
2. Copy from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never `NEXT_PUBLIC_`)
3. **Authentication → URL Configuration**
   - Site URL: `https://<your-domain>`
   - Redirect URLs: `https://<your-domain>/auth/callback`
4. **Authentication → Providers** — enable Email; Google is optional (needs Client ID/Secret + redirect URI from Supabase).

## 2. Apply migrations

Migrations live in `supabase/migrations/` and must be applied in order (`0001` → `0035`). `0035_solution_desk_completion.sql` is the latest and still needs confirmation in production.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

If you cannot use the CLI, paste each migration file into the Supabase SQL editor in order. Do not skip `0027_solution_staff_desks.sql`, `0028_industry_records.sql` or `0031`–`0035` — the solution dashboards depend on them.

## 3. Environment variables

Set these in `.env.local` for local dev and in **Vercel → Project → Settings → Environment Variables** for production.

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Public URLs
NEXT_PUBLIC_APP_URL=https://<your-domain>
NEXT_PUBLIC_SITE_URL=https://<your-domain>
PUBLIC_APP_URL=https://<your-domain>
PUBLIC_BRAND_HOST=<your-domain>

# Payments (Paystack)
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
DEFAULT_CURRENCY=NGN
PAYOUT_DELAY_HOURS=24

# Email — Resend (production provider; Brevo is an optional fallback)
RESEND_API_KEY=
EMAIL_FROM=Busmo <support@busmo.io>
BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=Busmo

# AI (Mo)
GOOGLE_GENAI_API_KEY=

# Optional integrations
MO_SELL_SUPABASE_URL=
MO_SELL_SUPABASE_SERVICE_ROLE_KEY=
MO_SELL_APP_URL=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.

## 4. Build and verify locally

```bash
npm install
npm run typecheck
npm run build
npm start
```

`typescript.ignoreBuildErrors` is `false`, so a clean typecheck is required for a successful build.

## 5. Deploy to Vercel

```bash
npx vercel link
npx vercel --prod
```

Or connect the Git repo in the Vercel dashboard; every push to `main` deploys automatically.

## 6. Smoke test production

For each suite — hospitality, healthcare, professional, education, agriculture:

1. Open `/solutions/<suite>` — welcome page loads, suite switcher works.
2. Sign up at `/solutions/<suite>/signup` — organization is provisioned.
3. Log in at `/solutions/<suite>/login` — lands on `/solutions/<suite>/dashboard`.
4. Create/read records in 2–3 sections — data persists after refresh.
5. Confirm no console errors and no horizontal scroll at 360 px / 856 px / 1280 px.

Also check `/auth/callback` (email confirmation) and `/api/industries/session` returns `200` with a valid session token.
