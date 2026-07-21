# PostHog Self-driving setup report

## Summary

PostHog Self-driving has been configured for this project. Session Replay, Error Tracking, and Support (Conversations) signal sources are now active, and a tuned scout troop — including a custom scout watching Busmo's subscription checkout funnel — will begin scanning on the next coordinator tick. Findings will start appearing in your [Self-driving inbox](https://us.posthog.com/project/519256/inbox) within approximately 30 minutes.

---

## AI data processing

**Status:** Approved — organization-level AI data processing was approved before this run started.

---

## GitHub

**Status:** Already connected (`crestack-web`, integration id `187519`). No action taken.

---

## Products enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Already enabled | `session_recording_opt_in: true` in project settings; `posthog.init` does not override. Recordings confirmed active. |
| Error Tracking | Already enabled | `error_tracking` present in `product_intents`; exception autocapture left on in `posthog.init` (no `capture_exceptions: false` override). No issues yet — new project. |
| Support (Conversations) | Already enabled | `conversations` present in `product_intents`. **Tickets only arrive once an inbound channel (email / inbox / Slack) is connected** — see Follow-ups. |

> `products-enable` MCP tool was not available in this deployment. Product states were confirmed via `project-get` (`product_intents` array and `session_recording_opt_in`).

---

## Signal sources

| source_product | source_type | Action | Notes |
|---|---|---|---|
| `error_tracking` | `issue_created` | **Enabled** | id `019f7a28-d7f1-718c-a624-9adf19f61a0a` |
| `error_tracking` | `issue_reopened` | **Enabled** | id `019f7a28-dacc-766b-a149-66cbe3232558` |
| `error_tracking` | `issue_spiking` | **Enabled** | id `019f7a28-de09-73df-82bd-d73ed82baddf` |
| `session_replay` | `session_analysis_cluster` | **Enabled** | id `019f7a28-f307-7544-aea4-100c0517a04e`; sample rate 0.1 injected by server |
| `conversations` | `ticket` | **Enabled** | id `019f7a28-f94c-777c-a1d7-71bbfb997301`; dormant until an inbound channel is connected |
| `signals_scout` | `cross_source_issue` | **Skipped** | ON by default — no config row needed to opt in |
| `llm_analytics` | — | **Skipped** | Not a user-facing responder in v1 |
| `logs` | — | **Skipped** | Not a v1 responder |

---

## Connected tools

| Tool | Status |
|---|---|
| GitHub Issues | Not used — not selected |
| Linear | Not used — not selected |
| Jira | Selected but no warehouse source connected (dormant). Responder row enabled (id `019f7a2b-9d8b-7947-912f-d1945bf43761`). The responder will activate automatically once the Jira warehouse source is connected. See Follow-ups. |
| Zendesk | Not used — not selected |
| pganalyze | Not used — not selected |

---

## Scout troop

**4 active** (general + 2 specialists + 1 custom); **23 disabled**.

### Enabled

| Scout | Reason |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations and gap coverage. Was already enabled. |
| `signals-scout-product-analytics` | Busmo tracks core product flows (`sale_recorded`, `expense_recorded`, `user_logged_in`, `subscription_*`) — funnels and retention are primary analytics surfaces. |
| `signals-scout-revenue-analytics` | Paystack subscription payments are central to the business model; watches for capture regressions and goal drift. |
| `signals-scout-subscription-funnel` _(custom)_ | See Custom scouts section. |

### Disabled

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | **Covered by native source** — error tracking signal sources (issue_created / issue_reopened / issue_spiking) are active; a scout on the same surface would duplicate findings. |
| `signals-scout-session-replay` | **Covered by native source** — session_replay / session_analysis_cluster source is active. |
| `signals-scout-ai-observability` | Google AI is used (`Ask MO` feature) but PostHog `$ai_*` events are not yet instrumented. Enable once LLM analytics events are captured. |
| `signals-scout-anomaly-detection` | Not in top-2 specialists; general scout covers cross-product anomalies. Re-enable if dashboards grow. |
| `signals-scout-web-analytics` | Web analytics is in `product_intents` but not a primary surface for this SMB tool. Re-enable if web traffic analysis becomes a priority. |
| `signals-scout-feature-flags` | Feature flags in `product_intents` but no evidence of active flag usage in this repo. Re-enable if flags are adopted. |
| `signals-scout-surveys` | No surveys configured (0 surveys found). Re-enable if surveys are launched. |
| `signals-scout-experiments` | No active experiments. Re-enable when A/B testing starts. |
| `signals-scout-logs` | PostHog logs product in `product_intents` but no evidence of active log capture. Re-enable if the logs product is wired up. |
| `signals-scout-csp-violations` | No CSP reporting configured in this repo. |
| `signals-scout-customer-analytics` | No group/account analytics in use (B2C product). |
| `signals-scout-data-pipelines` | No CDP destinations or batch exports configured. |
| `signals-scout-data-warehouse` | No warehouse sources (Jira source not yet connected). |
| `signals-scout-replay-vision` | No Replay Vision scanners configured. |
| `signals-scout-apm` | No OpenTelemetry/APM spans captured. |
| `signals-scout-inbox-validation` | Fresh setup — no resolved reports to validate yet. |
| `signals-scout-ingestion-warnings` | No evidence of ingestion issues. Low-cost background scout; can be enabled anytime. |
| `signals-scout-health-checks` | Useful but not in top-2; general scout covers health surfaces. Re-enable for dedicated health monitoring. |
| `signals-scout-observability-gaps` | No saved insights to audit yet. Re-enable once dashboards and funnels are built. |
| `signals-scout-mcp-tool-calls` | No `$mcp_tool_call` telemetry in use. |
| `signals-scout-insight-alerts` | No configured insight alerts yet. |
| `signals-scout-skills-store` | Skill hygiene scout; not needed at initial setup. |
| `signals-scout-web-vitals` | Web vitals autocapture is on (`autocapture_web_vitals_opt_in: true`) — worth enabling once baseline is established. |

---

## Custom scouts

### Created: `signals-scout-subscription-funnel`

**What it watches:** The `subscription_checkout_started` → `subscription_payment_verified` conversion funnel — Busmo's Paystack subscription checkout flow.

**Discriminator:** Checkout-to-payment conversion rate drops more than 15% relative to the rolling 7-day prior-period baseline, sustained for 2+ consecutive days. Single-day dips, days with fewer than 5 checkouts, and drops confined to one user are disqualified as noise.

**Why no built-in scout covers it:** `signals-scout-revenue-analytics` watches PostHog Revenue Analytics product (Stripe sync, configured goals) — Paystack is not wired into that product, so the scout runs quiet. `signals-scout-product-analytics` requires saved funnel insights in PostHog; the project is new and has none yet.

**Noise escape hatch:** If the scout becomes noisy, set `emit: false` on its config in PostHog to switch it to dry-run (it still runs and logs but files nothing).

### Proposed but declined

| Scout | Surface | Reason declined |
|---|---|---|
| Business activity health | `sale_recorded` / `expense_recorded` daily volume drops | User declined at proposal step |

### Surfaces considered and ruled out

| Surface | Filter that ruled it out |
|---|---|
| Ask MO AI health | Not watchable — Google AI service is used but PostHog `$ai_*` events are not instrumented; no data in PostHog to query. Instrument with PostHog's LLM analytics SDK first. |

---

## Follow-ups

- [ ] **Connect a Conversations inbound channel** (email, inbox widget, or Slack) so support tickets reach the Self-driving inbox. Settings: [PostHog integrations](https://us.posthog.com/project/519256/settings/environment-integrations)
- [ ] **Connect the Jira warehouse source** to activate the dormant Jira responder. Open: [https://us.posthog.com/project/519256/data-warehouse/connect?kind=Jira](https://us.posthog.com/project/519256/data-warehouse/connect?kind=Jira) — only the `issues` table needs to sync.
- [ ] **Instrument `$ai_*` events for Ask MO** using PostHog's LLM analytics SDK (`posthog-node` or `posthog-js` `$ai_generation` / `$ai_span` events) so `signals-scout-ai-observability` has data to watch. Then enable that scout.
- [ ] **Build and save subscription funnel + core product funnels in PostHog** so `signals-scout-product-analytics` has saved flows to watch for regressions. Priority: login → record-sale funnel, subscription checkout funnel.
- [ ] **Consider enabling `signals-scout-web-vitals`** — `autocapture_web_vitals_opt_in` is already true, so baseline data will accumulate. Enable the scout once a few days of data have landed.
- [ ] **Re-enable `signals-scout-ai-observability`** once LLM analytics events are flowing (Ask MO uses Google AI — wire it through PostHog's LLM analytics to get cost, latency, and error visibility).

---

## What happens next

The scout coordinator picks up fresh configs within ~30 minutes. Scouts run on a 24-hour interval by default. As findings are validated they cluster into reports in your [Self-driving inbox](https://us.posthog.com/project/519256/inbox). Immediately-actionable reports can automatically start coding tasks. The subscription funnel scout will run quiet until enough checkout events accumulate to establish a baseline — typically 5–7 days of normal traffic.
