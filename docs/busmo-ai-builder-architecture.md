# Busmo AI Feature Builder — Architecture Foundation

**Status:** Phase A + B + C (AI draft builder) implemented (internal prototype)  
**Date:** 2026-10-03  
**Principle:** AI proposes structured Busmo feature definitions → validation → native renderer. Never arbitrary production code.

**Rule:** MO proposes software. Busmo validates software. The owner publishes software.

---

## 1. Current architecture (audit)

### 1.1 Stack

| Layer | Technology |
|-------|------------|
| App | Next.js 15 App Router |
| Auth | Supabase Auth (email + Google OAuth PKCE) |
| Data | Supabase Postgres + RLS; residual Firebase/Firestore paths during migration |
| AI | Ask MO / MO Sales (Mistral under `src/ai/mistral.ts`, `src/app/api/ask-mo`) |
| UI | Owner dashboard CSS modules + shared Card/Topbar/Sidebar patterns |

### 1.2 Tenant model

- **Business** is the tenant (`public.businesses`).
- **Users** link via `users.business_id` / metadata `businessId`.
- Scope resolution: `src/lib/resolve-business-scope.ts`.
- RLS: `public.is_business_member(business_id)` + `public.is_admin()`.

### 1.3 Authentication

- Browser Supabase session; API routes use Bearer JWT + `assertBusinessAccess` (`src/app/api/mo-sales/_auth.ts`).

### 1.4 AI provider (reuse — do not replace)

- **IMPLEMENTED:** Mistral via `getMistralClient()` (`src/ai/mistral.ts`).
- Ask MO: large route at `src/app/api/ask-mo/route.ts` (intent, planner, data loaders).
- Feature Builder does **not** rewrite Ask MO. It adds a controlled tool API at `/api/custom-features/builder` that the prototype (and later Ask MO) can call.

---

## Phase A — Foundation

**Status:** IMPLEMENTED

- Types + `validateFeatureDefinition`
- Migration `0020_custom_features_foundation.sql`
- `FeatureRenderer`
- Delivery Tracker hardcoded definition
- Tests: `scripts/test-custom-feature-definition.mjs`

---

## Phase B — Persistence + CRUD

**Status:** IMPLEMENTED

- `service.ts` create / publish / records
- APIs `/api/custom-features`, `/api/custom-features/records`
- Tenant-scoped via `assertBusinessAccess`

---

## Phase C — AI Feature Builder (DRAFT only)

**Status:** IMPLEMENTED (internal prototype)

### MO integration

| Piece | Status | Path |
|-------|--------|------|
| Feature builder context | IMPLEMENTED | `builder-context.ts` (from ALLOWED_* types) |
| NL → definition | IMPLEMENTED | `nl-to-definition.ts` (heuristics + optional Mistral) |
| Tools | IMPLEMENTED | `builder-tools.ts` |
| API | IMPLEMENTED | `POST /api/custom-features/builder` |
| Prototype UI | IMPLEMENTED | `InternalFeaturePrototypePage` NL panel |
| Full Ask MO chat rewrite | FUTURE | Call builder API from intent when ready |

### Feature-builder tools (AI-safe)

| Tool | Behavior |
|------|----------|
| `get_feature_builder_context` | Vocabulary + limitations |
| `validate_feature_definition` | Structural validation only |
| `create_custom_feature_draft` | **Always** `status=draft` |
| `get_custom_feature_draft` | Load draft by id/slug |
| `update_custom_feature_draft` | Update draft only; published untouched |
| `build_from_natural_language` | NL → validate → draft |

**Not AI tools:** `publish_draft` (owner-only via same route), `execute_sql`, `run_code`, `modify_files`, `deploy_code`.

### Validation pipeline

```
AI / NL output
  → parse
  → validateFeatureDefinition()
  → toolCreateCustomFeatureDraft (forces draft)
  → custom_features + custom_feature_versions
```

Never persist unvalidated AI output. Service layer remains authority.

### Draft lifecycle

1. Owner or MO request → draft row (`status=draft`)
2. Existing published same slug stays live
3. Draft version ≥ max(slug versions)+1 when new

### Preview lifecycle

- Owner selects draft → same `FeatureRenderer` as published
- Prototype shows banner: PREVIEW (DRAFT)
- Record CRUD disabled in draft preview mode

### Publish lifecycle

- Explicit `publish_draft` with authenticated owner
- `publishCustomFeature` archives prior published same slug, bumps version
- AI cannot call publish as a “tool” in the AI tool list; only owner UI/API action

### Security model

1. JWT required
2. `assertBusinessAccess(userId, businessId)` — never trust model-supplied business alone
3. All service queries filter `business_id`
4. Draft updates rejected if status ≠ draft
5. Cross-tenant create blocked by access assert (Business A cannot draft for B)

### Token / rate-limit considerations

- **DESIGNED:** Reuse Ask MO / MO credits when wiring into main chat
- **IMPLEMENTED:** Builder route is authenticated; heuristic path needs no LLM tokens
- Optional Mistral only when heuristics need clarification and `MISTRAL_API_KEY` is set

### Supported vocabulary

Field types and views: see `ALLOWED_FIELD_TYPES` / `ALLOWED_VIEW_TYPES` in `types.ts`.

### Unsupported

- Arbitrary JS/SQL/React/CSS
- Workflow runtime execution
- AI publishing
- Multi-entity relation pickers

### Example (NL → draft)

**Request:**  
`Create a delivery tracker with customer, order, driver, status, delivery date and amount.`

**Result:** Valid `BusmoFeatureDefinition`, `status: "draft"`, summary starts with `DRAFT CREATED`.

### Tests

- `scripts/test-feature-builder-phase-c.mjs` — NL fixtures, invalid types, unsupported code, draft-only
- Phase A tests still pass

### How to try

1. Migration 0020 applied
2. `NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE=true`
3. Owner → `feature-prototype`
4. Enter NL → Generate draft → Preview → Publish

---

## Roadmap labels

| Phase | Status |
|-------|--------|
| A Foundation | IMPLEMENTED |
| B Persistence | IMPLEMENTED |
| C AI draft builder | IMPLEMENTED |
| D UI customization / templates | FUTURE |
| E Workflow runtime / sandbox code | FUTURE |

---

## Safety rules observed

- No broad UI rewrite
- No second AI architecture / provider migration
- No arbitrary code generation
- Draft-first; human publish
- Existing Ask MO and product modules intact

---

## Phase E — Business process intelligence (IMPLEMENTED)

**Status:** IMPLEMENTED  
**Date:** 2026-10-03

Transforms NL→fields into: **conversation → business intent → process model → definition**.

### New modules

| Module | Role |
|--------|------|
| `business-process-types.ts` | `BusinessProcessPlan` IR (actors, events, calculations, questions, assumptions) |
| `business-patterns.ts` | Reusable patterns: PET/recycling, supplier purchase, credit, jobs, delivery, production, service |
| `process-planner.ts` | Plan from language; clarification; semantic process edits; conversation combine helper |
| `plan-to-definition.ts` | Process plan → `BusmoFeatureDefinition` + owner explanation |
| `quality-score.ts` | Internal scores (dev/test only) |

### Pipeline

```
Owner language
  → planBusinessProcess (BusinessProcessPlan)
  → businessProcessPlanToDefinition
  → validateFeatureDefinition
  → draft (existing)
  → FeatureRenderer / explanation
  → owner publish (unchanged)
```

### Preserved

- No arbitrary React/SQL/JS
- No AI publish
- Tenant `assertBusinessAccess`
- Draft → owner publish only
- Existing FeatureRenderer

### Tests

`node scripts/test-business-process-intelligence.mjs` — unseen businesses + clarification + unsupported.

---

## Phase F — Universal context-aware capabilities (FOUNDATION)

**Status:** FOUNDATION IMPLEMENTED (2026-10-03)

### Delivered

| Capability | Path |
|------------|------|
| Relation targets on fields | `types.ts` `relationTarget`, `BusmoRelationTarget` |
| Safe computed values | `computed.ts` (`multiply`/`add`/`subtract`/`divide`) |
| Tenant entity lookup API | `GET /api/custom-features/entities` |
| Business context summary | `business-context-provider.ts` |
| Renderer lookups + live calc | `FeatureRenderer` `RecordForm` + `businessId` |
| Pattern uses refs + computed | PET/recycling pattern → supplier/product relation + computed total/balance |

### Preserved

- Existing definitions without relation/computed still render
- AI proposes → validate → draft → owner publish
- Tenant isolation via `assertBusinessAccess`

### Not yet (next increments)

- Full history/timeline components
- Price resolution cascade across modules
- Compose over Sales/Inventory native modules instead of parallel records
- Multi-line visit/settlement event groups
- Charts / rich overview widgets

