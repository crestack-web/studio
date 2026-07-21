# PostHog post-wizard report

PostHog is integrated into the Next.js App Router application with browser initialization in `instrumentation-client.ts`, server-side payment verification tracking through `posthog-node`, and a Next.js ingestion proxy configured from environment variables. Autocapture, session recording defaults, and exception capture remain enabled.

The browser SDK identifies authenticated users after password or Google login using the Firebase user ID. Email and role are stored only as person properties; custom event properties do not include user-entered names, emails, or product/expense descriptions.

| Event name | Description | File |
| --- | --- | --- |
| `user_logged_in` | An authenticated user completes password or Google login. | `src/app/login/form/page.tsx` |
| `sale_recorded` | A business owner or staff member successfully records a point-of-sale transaction. | `src/app/record-sale/page.tsx` |
| `expense_recorded` | A business owner successfully saves a categorized business expense. | `src/app/record-expense/page.tsx` |
| `subscription_checkout_started` | An authenticated user starts checkout for a selected subscription plan. | `src/app/subscribe/page.tsx` |
| `subscription_payment_verified` | The server verifies a subscription payment successfully. | `src/app/api/payments/verify-subscription/route.ts` |

## Next steps

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/519256/dashboard/1871658)
- Insights were not created yet because the newly added custom events have not reached the PostHog schema. After deploying and exercising these flows, create saved trends for sales, expenses, checkout starts, and verified subscription payments on the dashboard.

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names added to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or the bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs.

### Agent skill

An agent skill folder remains in `.claude/skills/integration-nextjs-app-router` for future PostHog work.
