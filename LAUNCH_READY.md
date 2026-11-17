# Busmo Launch Readiness

Last updated: 2026-11-17

## Status

All five industry solutions are built and wired to live Supabase data. Remaining work is deployment and end-to-end verification against the production Supabase project.

## What is done

| Area | Status |
| --- | --- |
| Busmo Hospitality | Built, QA-passed, live data, AI Mo |
| Busmo Healthcare | Built, QA-passed, live data, AI Mo |
| Busmo Professional | Built, QA-passed, live data, AI Mo |
| Busmo Education | Built, QA-passed, live data, AI Mo |
| Busmo Agriculture | Built, live data, AI Mo, PWA manifest, sitemap |
| Shared design system | Tokens, shell, primitives, charts, mobile CSS |
| Real suite icons | `src/lib/industries/solution-icons.ts` (`SOLUTION_ICONS`) |
| Sidebar collapse | Persisted preference, works at desktop breakpoints |
| Welcome suite switcher | Present on all welcome pages |
| Dashboard suite switcher | Removed (dashboards are single-suite) |
| Typecheck | Clean (`npx tsc --noEmit`) |
| CSS delivery | Local `solutions.css` only; no external CDN dependency |
| Transactional email | Brevo primary, Resend fallback (`brevo-service.ts`) |
| Service worker | `busmo-offline-v4` (old caches replaced on activate) |
| Accessibility | Focus-visible outlines on all solutions surfaces |

## What is left before public launch

1. **Supabase production wiring** — set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel.
2. **Apply migrations** — `0035_solution_desk_completion.sql` is pending; confirm `0031`–`0034` and shared `0027`/`0028` are applied.
3. **Configure Supabase Auth URLs** — Site URL and `/auth/callback` redirect for the production domain.
4. **Production build** — run `npm run build` with production env and deploy to Vercel.
5. **E2E verification** — for each suite: signup → login → onboarding → CRUD → refresh persistence → cross-business isolation.
6. **Decide billing model** — signup copy advertises a 14-day free trial but no subscription/trial gate is implemented. Either launch as private/free beta or add trial/subscription enforcement.

See `DEPLOY_NOW.md` for commands and `LAUNCH_CHECKLIST.md` for the step-by-step list.
