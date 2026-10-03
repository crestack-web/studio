# Busmo AI Feature Builder — Architecture Foundation

**Status:** Phase 1 audit + foundation schema + internal prototype  
**Date:** 2026-10-03  
**Principle:** AI proposes structured Busmo feature definitions → validation → native renderer. Never arbitrary production code.

---

## 1. Current architecture (audit)

### 1.1 Stack

| Layer | Technology |
|-------|------------|
| App | Next.js 15 App Router |
| Auth | Supabase Auth (email + Google OAuth PKCE) |
| Data | Supabase Postgres + RLS; residual Firebase/Firestore paths during migration |
| AI | Ask MO / MO Sales (Mistral and related services under `src/lib/services`, `src/lib/ask-mo`) |
| UI | Owner dashboard CSS modules + shared Card/Topbar/Sidebar patterns |

### 1.2 Tenant model

- **Business** is the tenant (`public.businesses`).
- **Users** link via `users.business_id` / metadata `businessId`.
- **Staff** via `staff_permissions` and role metadata.
- Scope resolution: `src/lib/resolve-business-scope.ts`.
- RLS helper: `public.is_business_member(business_id)` + `public.is_admin()` (`0001`, `0004`).

Almost all operational tables carry `business_id` and RLS policies keyed on membership.

### 1.3 Authentication

- Browser: `src/lib/supabase.ts` → cookie PKCE via `@supabase/ssr` (`supabase-browser.ts`).
- OAuth callback: `src/app/auth/callback/route.ts` (server exchange).
- New Google users without a business → `/welcome/signup` onboarding.

### 1.4 Module structure (hardcoded)

Owner product surface is **compile-time** mapped:

- `PageId` union — `src/app/owner/dashboard/types.ts`
- `PAGE_COMPONENTS` — `src/app/owner/dashboard/AppShell.tsx`
- Nav — `navItems.ts` + `CATEGORY_FEATURES` + `featureRegistry.ts` + Sidebar `isNavItemVisible`

Category-specific modules (restaurant menu/ingredients, recycling material collection, jobs) are **separate pages and tables**, not data-driven feature definitions.

### 1.5 Relevant files

| Area | Paths |
|------|--------|
| Nav / access | `featureRegistry.ts`, `dynamicNavigation.ts`, `categoryFeatureBundles.ts`, `navItems.ts`, `Sidebar.tsx` |
| Data access | `supabase-client-data.ts`, `supabase-server.ts`, `resolve-business-scope.ts` |
| AI / MO | `src/lib/services/mo-*`, `src/lib/ask-mo/*`, `src/app/api/mo-sales/*` |
| Schema | `supabase/migrations/0001_*.sql` … `0019_*.sql` |
| Design | Dashboard CSS modules, `Card.tsx`, welcome `globals.css` |

### 1.6 Permissions / RLS

- Server and DB enforce tenant isolation; frontend gates are UX only.
- Feature flags today are **plan + category + selected features**, not per-custom-feature RBAC.
- Staff permissions: `staffPermissions.ts`, `staff_permissions` table.

### 1.7 Workflow / automation today

- No general workflow engine.
- Closest concepts: MO action router (`mo-action-router.ts`) for record-sale / add-product / expense; WhatsApp MO sales agent pipeline; offline sync.
- These are **code paths**, not declarative Trigger → Condition → Action graphs.

### 1.8 What is already suitable for dynamic rendering

- Shared layout shell (Sidebar, Topbar, page container).
- Card / table / form patterns repeated across pages.
- `business_id` everywhere + RLS.
- Feature registry as a **catalogue of product modules** (not custom per-tenant definitions).

### 1.9 Architectural risks for a feature builder

1. **Hardcoded `PageId` + `PAGE_COMPONENTS`** — every new feature requires a deploy.
2. **Dual data paths** (Supabase + Firestore remnants) — definitions must target one store.
3. **Category drift** — category resolution is multi-source (businesses, users, metadata, localStorage).
4. **No declarative workflow runtime** — automations today are imperative.
5. **AI with broad data loaders** — must not expand into arbitrary SQL/code generation.
6. **Plan gating vs custom features** — commercial rules need a clear model for “generated” modules.

---

## 2. Gaps

| Gap | Impact |
|-----|--------|
| No `custom_features` definition store | Cannot version or publish tenant features |
| No definition validator | AI output cannot be safely accepted |
| No dynamic renderer | Only hand-built pages |
| No workflow DSL | Cannot “when deposit paid → create task” |
| No AI tool layer for features | MO cannot create_feature safely |
| Prototype gated | Correct for now; no user exposure |

---

## 3. Recommended architecture

```
Owner / MO AI
     ↓
Controlled tools (create_feature, validate_feature, …)
     ↓
Feature definition (JSON schema / TS types)
     ↓
validateFeatureDefinition()
     ↓
custom_features + custom_feature_versions (Postgres)
     ↓
FeatureRenderer (table | form | cards | metrics only)
     ↓
custom_feature_records (business_id scoped, RLS)
```

**Non-goals (now):** arbitrary React, multi-tenant code deploys, unrestricted DB credentials for AI.

---

## 4. Feature definition schema (proposed + implemented types)

See `src/lib/custom-features/types.ts`:

- `BusmoFeatureDefinition` — id, slug, name, entities[], views[], actions[], workflows[], permissions[], version, status
- Field types whitelist: text, number, currency, date, status, select, relation, …
- View types whitelist: table, form, cards, metrics, timeline
- Status lifecycle: `draft` → `testing` → `published` → `archived`

### Database (`0020_custom_features_foundation.sql`)

- `custom_features` — definition jsonb, version, status, business_id
- `custom_feature_versions` — history rows
- `custom_feature_records` — entity_key + data jsonb, business_id
- RLS: `is_business_member(business_id) OR is_admin()`

---

## 5. Primitives (controlled vocabulary)

### Data (platform entities AI may **link** to, not reinvent)

Customer, Product, Sale, SaleItem, Expense, Payment, Inventory, Staff, Supplier, Job, Task, MaterialPurchase, MaterialSale

### UI (renderer may emit)

Page, Table, Form, Card, Metric, Status chip, Tabs, Filter (future), Modal (future)

### Behaviour (actions / workflow steps)

Create, Update, Delete, Assign, Notify, SetStatus, Export (future), Schedule (future)

Anything outside the whitelist **fails validation**.

---

## 6. Dynamic renderer

**Implemented prototype:** `FeatureRenderer`  
Path: `src/lib/custom-features/renderer/FeatureRenderer.tsx`

Pipeline:

1. `validateFeatureDefinition(def)`
2. Render only approved view types
3. Rows supplied by caller (sample or `custom_feature_records`)

Styling inherits Busmo purple / DM Sans dashboard language via local CSS module (no second design system).

---

## 7. Tenant isolation strategy

1. Every definition and record row has **`business_id` NOT NULL**.
2. RLS via existing `is_business_member`.
3. API tools (future) must resolve business from **session**, never from client-supplied unchecked IDs alone.
4. Renderer never loads another tenant’s definition without server scope check.
5. Frontend nav visibility is **not** security.

---

## 8. Versioning strategy

- `custom_features.version` + unique `(business_id, slug, version)`.
- `custom_feature_versions` stores full definition snapshots.
- Publish copies definition into a new version row; previous published can be archived.
- Rollback = re-publish prior version row (future UI).

MVP: single row + version integer; versions table ready for history.

---

## 9. Workflow architecture (seam only)

Declarative shape in definition:

```
trigger: { type, entity?, status? }
condition?: { field, equals }
steps: [{ type: create_record | update_record | notify | assign | set_status, ... }]
```

**Not implemented runtime.** Future engine:

1. Domain events (sale.created, payment.created, record.status_changed)
2. Match published workflows for `business_id`
3. Execute steps through **service layer** (same as MO actions), not eval

Integrate later with `mo-action-router` patterns.

---

## 10. AI agent tool interface (future)

| Tool | Purpose |
|------|---------|
| `get_business_context` | Category, plan, existing modules |
| `get_feature` / `list_features` | Tenant definitions |
| `create_feature` | Draft definition |
| `update_feature` | Draft edit |
| `validate_feature` | Structural + policy checks |
| `preview_feature` | Render testing status |
| `publish_feature` | Status transition + version bump |
| Platform tools | `get_sales`, `create_customer`, … existing services |

AI **proposes**; Busmo **authorizes, validates, executes**.

---

## 11. AI-generated code isolation (future only)

Documented path only:

Sandbox → tests → security review → restricted runtime → approved Busmo APIs only.

No unrestricted DB, secrets, filesystem, or cross-tenant access.

---

## 12. Internal prototype

**Delivery Tracker** — hardcoded definition:

- Entities: delivery (customer, order, driver, status, date, amount, notes)
- Statuses: Pending, Out for Delivery, Delivered, Failed
- Views: table, form, metrics

**Access:** set `NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE=true`, open owner dashboard page `feature-prototype` (not in default sidebar).

**Files:**

- `src/lib/custom-features/definitions/delivery-tracker.ts`
- `src/app/owner/dashboard/InternalFeaturePrototypePage.tsx`
- Tests: `scripts/test-custom-feature-definition.mjs`

---

## 13. Migration roadmap

### PHASE A — Foundation (this deliverable)

- Architecture doc
- Types + validator
- Schema migration 0020
- Internal renderer prototype
- Structural tests

### PHASE B — Dynamic Features

- CRUD API for definitions (server-scoped)
- Persist records to `custom_feature_records`
- Optional nav injection for `published` features only
- Owner “Custom features” settings (list/publish) — still no AI

### PHASE C — AI Feature Builder

- MO tools: create/validate/preview definition from natural language
- Always draft-first; human publish
- Prompt grounded in primitives whitelist

### PHASE D — User Customization

- Edit fields/views in UI
- Clone / template library (Jobs, Deliveries, Furniture build)

### PHASE E — Advanced agent

- Workflow runtime
- Optional sandboxed code for edge calculations
- Multi-step “change this / automate that” conversations

---

## 14. Safety rules observed

- No broad UI rewrite
- No replacement of existing modules
- Prototype gated by env flag
- No arbitrary code execution
- RLS-aligned schema
- Existing auth and design language reused

---

## 15. Next concrete engineering steps (when ready)

1. Apply `0020_custom_features_foundation.sql` in Supabase.
2. Add server routes `POST/GET /api/custom-features` with session business scope.
3. Wire publish → Sidebar item from `published` rows only.
4. Keep AI tools read-only until validate + draft flow is battle-tested.


---

## Phase B — Implemented (persistence + CRUD)

**Status:** IMPLEMENTED (internal prototype only)

### What works

| Capability | Implementation |
|------------|----------------|
| Persist feature | `custom_features` via `createCustomFeature` |
| Version snapshot | `custom_feature_versions` on create/publish |
| Publish | `publishCustomFeature` — archives prior published same slug |
| Load published | `getPublishedFeatureBySlug` |
| Records CRUD | `create/update/delete/listFeatureRecord*` |
| Server validation | `validateFeatureRecord` — unknown fields, types, enums, required |
| API | `GET/POST /api/custom-features`, `GET/POST /api/custom-features/records` |
| AuthZ | Bearer token + `assertBusinessAccess(userId, businessId)` before every op |
| Renderer | Generic CRUD callbacks; no Delivery Tracker `if` branches |
| Prototype page | Ensures published Delivery Tracker + loads/saves records |

### Service layer

`src/lib/custom-features/service.ts` — server-only, uses service role **after** caller has asserted membership.

### Security model

1. API authenticates JWT.
2. API asserts business membership (owner / profile business_id / admin).
3. All queries filter `business_id = authenticated business`.
4. Cross-tenant featureId alone is insufficient — business_id must match.
5. RLS policies remain on tables for direct client access paths.

### Relationships (deferred)

`relation` field type is accepted in definitions; no join resolution or FK enforcement in Phase B. Delivery Tracker uses plain text for Customer/Order/Driver.

### Not implemented (FUTURE)

- AI feature generation UI
- Workflow runtime
- Published features in default sidebar for all users
- Soft-delete / audit log UI
- Multi-entity forms with relation pickers

### How to run prototype

1. Apply `0020_custom_features_foundation.sql` in Supabase if not applied.
2. Set `NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE=true` on Vercel.
3. Redeploy.
4. Sign in as owner → open page `feature-prototype`.
5. Create / edit / delete deliveries; refresh to confirm persistence.

### Phase C recommendation

Expose MO tools that **only** call:

`validateFeatureDefinition` → `createCustomFeature` (draft) → human/publish → same record APIs.

Never allow the model to write SQL or skip validation.
