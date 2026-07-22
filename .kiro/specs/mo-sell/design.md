# Design Document — MO Sell

## Overview

MO Sell is the commerce engine of Busmo. It is a native Next.js module — not a separate app — that gives any Busmo merchant a full-featured online storefront without requiring technical knowledge. Every confirmed order automatically propagates into Busmo's existing sales, inventory, cash flow, customer, and analytics modules via an atomic Integration Bridge.

Phase One delivers four capabilities:

1. **Store Setup** — AI-guided onboarding via MO that produces a fully configured Store_Config in minutes.
2. **Storefront** — A public-facing Next.js route group at `/store/{storeSlug}` with product catalog, cart, and order confirmation.
3. **Commerce** — Paystack-powered checkout, shipping zone management, order pipeline management.
4. **Analytics** — Storefront funnel metrics surfaced in the merchant dashboard and injected into MO's context.

MO Sell replaces and extends the existing `EcommercePage.tsx` stub. The existing `businesses/{businessId}/storeProducts` and `businesses/{businessId}/storeOrders` collection paths are preserved for backward compatibility.

---

## Architecture

MO Sell is composed of two surfaces connected by a shared Firestore data layer and a server-side Integration Bridge.

```
┌──────────────────────────────────────────────────────────────────┐
│  MERCHANT SURFACE                                                │
│  /owner/dashboard  (AppShell, authenticated)                    │
│                                                                  │
│  PAGE_MAP['mo-sell'] → MOSellPage.tsx                           │
│    ├── StoreSetupWizard (shown when no Store_Config)            │
│    ├── MOSellOverview (KPIs, new orders, MO prompts)            │
│    ├── StoreProductsManager                                      │
│    ├── StoreCollectionsManager                                   │
│    ├── StoreOrdersManager                                        │
│    ├── StoreShippingManager                                      │
│    ├── StoreSettingsPanel                                        │
│    └── StoreAnalyticsPanel                                       │
└──────────────────────────────────────────────────────────────────┘
                             │
                     Firestore (Admin SDK)
                             │
┌──────────────────────────────────────────────────────────────────┐
│  PUBLIC STOREFRONT                                               │
│  /store/[storeSlug]  (unauthenticated, ISR)                     │
│    ├── StorefrontLayout (branding CSS vars, nav, footer)        │
│    ├── /                 ← Homepage (hero, collections)         │
│    ├── /products/[id]    ← Product detail                       │
│    ├── /cart             ← Cart review                          │
│    ├── /checkout         ← Checkout form + Paystack             │
│    └── /order/[id]       ← Order confirmation                   │
└──────────────────────────────────────────────────────────────────┘
                             │
                    API Routes (server-side)
                             │
┌──────────────────────────────────────────────────────────────────┐
│  /api/store/                                                     │
│    config/[storeSlug]     GET  ← public store lookup            │
│    products               GET  ← public product listing         │
│    checkout/initiate      POST ← create CheckoutSession         │
│    orders/confirm         POST ← verify Paystack + Bridge       │
│    analytics/event        POST ← fire-and-forget analytics      │
└──────────────────────────────────────────────────────────────────┘
                             │
              Integration Bridge (processConfirmedOrder)
                             │
        Atomic Firestore batch → sales, products, customers,
                                  cashFlow, notifications
```

### Key Design Decisions

- **No new auth system**: Public storefront routes are fully unauthenticated. Cart is localStorage-scoped per storeSlug.
- **ISR for performance**: Storefront pages use `revalidate = 60`. Product pages use `generateStaticParams`.
- **Admin SDK for Integration Bridge**: All bridge writes use Firebase Admin SDK and bypass Firestore security rules.
- **Paystack redirect flow**: Checkout redirects to Paystack-hosted page. No inline JS injection needed.
- **cashFlow vs cashflow**: Existing codebase uses `cashFlow` (camelCase) for the subcollection name — preserved throughout.

---

## Components and Interfaces

### Merchant Dashboard Components

All components live under `src/app/owner/dashboard/mo-sell/`.

| Component | Responsibility |
|---|---|
| `MOSellPage.tsx` | Top-level page. Reads `businesses/{businessId}/store/config`. Shows `StoreSetupWizard` overlay when doc is absent; shows tabbed management UI otherwise. |
| `StoreSetupWizard.tsx` | Full-screen onboarding overlay. Talks to `/api/ask-mo` with store-setup system prompt. Parses JSON suggestions block from MO response. Writes `store/config` on confirm. |
| `MOSellOverview.tsx` | KPI cards (revenue, orders, conversion rate). New-order notification list. Contextual MO prompt cards (0 products, 0 orders after 7 days). |
| `StoreProductsManager.tsx` | Paginated product table. Add/edit form pre-fills from `businesses/{businessId}/products`. Bulk enable/disable toggle. |
| `StoreCollectionsManager.tsx` | Collection CRUD. Drag-to-reorder products within a collection. Duplicate-name guard. |
| `StoreOrdersManager.tsx` | Order list with status/payment filters. Pipeline controls (paid→processing→shipped→delivered). Tracking number entry. Refund trigger via Paystack API. Status history audit log. |
| `StoreShippingManager.tsx` | Shipping zone CRUD. Pickup location config. Negative-rate guard. |
| `StoreSettingsPanel.tsx` | Edit `store/config`. Logo upload with compression (browser-image-compression, already in package.json). Color picker. Store URL display. Publish/pause toggle. |
| `StoreAnalyticsPanel.tsx` | Monthly revenue chart (Recharts, already in package.json). Conversion funnel. Top-5 products table. |

### Public Storefront Components

All components live under `src/components/storefront/`.

| Component | Responsibility |
|---|---|
| `StorefrontLayout.tsx` | Server component. Fetches `store/config` once. Injects `--primary-color` and `--secondary-color` CSS variables into `<html>` style tag. Renders store nav (logo/name + cart icon) and footer. |
| `StorefrontHomePage.tsx` | Hero banner with store name and logo. Featured products grid. Collection sections. |
| `ProductGrid.tsx` | Responsive grid. Accepts `products: StorefrontProduct[]`. Renders `ProductCard` for each. |
| `ProductCard.tsx` | Image (Next.js `<Image>`), name, price, discount badge, Add-to-Cart button. Disabled + "Out of Stock" label when `available: false` or `stock === 0`. |
| `ProductDetailPage.tsx` | Image gallery (embla-carousel-react, already in package.json). Description. Stock indicator (<10 units). Quantity selector. Add-to-Cart. OG meta tags. |
| `CartDrawer.tsx` | Slide-out drawer (`framer-motion`). Line items with +/- quantity controls. Subtotal. Checkout CTA. |
| `CheckoutForm.tsx` | Customer details form. Delivery/pickup radio. Shipping zone select. Order summary. Pay Now → POST `/api/store/checkout/initiate` → redirect to Paystack URL. |
| `OrderConfirmationPage.tsx` | Order number, items, total, delivery option, estimated timeframe. |

### Next.js Route Structure

**Merchant Dashboard additions:**

```
src/app/owner/dashboard/
  types.ts                         ← add 'mo-sell' to PageId union
  AppShell.tsx                     ← add PAGE_MAP['mo-sell'] = <MOSellPage />
  navItems.ts                      ← replace 'ecommerce-storefront' with 'mo-sell'
  MOSellPage.tsx                   ← top-level page component
  mo-sell/
    StoreSetupWizard.tsx
    MOSellOverview.tsx
    StoreProductsManager.tsx
    StoreCollectionsManager.tsx
    StoreOrdersManager.tsx
    StoreShippingManager.tsx
    StoreSettingsPanel.tsx
    StoreAnalyticsPanel.tsx
    mo-sell.types.ts               ← all MO Sell TypeScript interfaces
    MOSellPage.module.css
    StoreSetupWizard.module.css
    (other .module.css files)
```

**Public Storefront (new route group):**

```
src/app/store/
  [storeSlug]/
    page.tsx                       ← Homepage (ISR, revalidate=60)
    layout.tsx                     ← Loads store config, applies CSS vars
    products/
      [productId]/
        page.tsx                   ← Product detail (ISR, revalidate=60)
    cart/
      page.tsx                     ← Cart review (client component)
    checkout/
      page.tsx                     ← Checkout form (client component)
    order/
      [orderId]/
        page.tsx                   ← Order confirmation
      pending/
        page.tsx                   ← Polls confirm endpoint after Paystack redirect
```

**New API Routes:**

```
src/app/api/store/
  config/[storeSlug]/route.ts      ← GET: public store config lookup by slug
  products/route.ts                ← GET: ?businessId=&available=true&collectionId=
  checkout/initiate/route.ts       ← POST: create CheckoutSession + Paystack init
  orders/confirm/route.ts          ← POST: verify Paystack + run Integration Bridge
  analytics/event/route.ts         ← POST: record analytics event (fire-and-forget)
```

---

## Data Models

All new collections live under `businesses/{businessId}/` — consistent with the active codebase convention.

### `businesses/{businessId}/store/config` (singleton document)

```typescript
interface StoreConfig {
  storeSlug: string;                         // unique across all merchants, [a-z0-9-]+
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;                      // CSS hex, e.g. "#6B3FE7"
  secondaryColor: string;                    // CSS hex
  businessCategory: string;
  currency: string;                          // ISO 4217, e.g. "NGN"
  contactEmail: string;
  contactPhone: string;
  status: 'draft' | 'active' | 'paused';
  paystackPublicKey: string;
  enabledProductTypes: Array<'physical' | 'digital' | 'service'>;
  pickupLocations: Array<{ name: string; address: string }>;
  // Custom domain (manually connected)
  customDomain: string | null;               // e.g. "shop.mybrand.com" — no protocol, no trailing slash
  customDomainStatus: 'pending' | 'verified' | 'failed';
  customDomainVerifiedAt: Timestamp | null;
  // Domain purchased through MO Sell
  domainPurchaseRecord: DomainPurchaseRecord | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface DomainPurchaseRecord {
  domain: string;                            // e.g. "mybrand.store"
  godaddyRegistrationId: string;             // GoDaddy operation ID from v3 registration
  paystackReference: string;                 // Paystack transaction reference for audit
  purchasedAt: Timestamp;
  renewalDate: Timestamp;                    // purchasedAt + 1 year
  renewalPriceNgn: number;                   // annual renewal cost in NGN at time of purchase
  autoRenew: boolean;                        // default false in Phase One
  registrationStatus: 'pending' | 'active' | 'failed';
}
```

### `businesses/{businessId}/storeProducts/{productId}`

```typescript
interface StorefrontProduct {
  productId: string;                         // reference to businesses/{id}/products/{id} or standalone
  productType: 'physical' | 'digital' | 'service';
  displayName: string;
  description: string;
  price: number;                             // > 0, validated
  compareAtPrice: number | null;
  images: string[];                          // max 8 URLs
  category: string;
  collectionIds: string[];
  tags: string[];
  stock: number;                             // ignored for digital/service
  sku: string | null;
  available: boolean;
  featured: boolean;
  digitalFileUrl: string | null;             // only when productType === 'digital'
  deliveryNote: string | null;               // only when productType === 'service'
  lowStockThreshold: number;                 // default 5
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `businesses/{businessId}/storeCollections/{collectionId}`

```typescript
interface StoreCollection {
  title: string;                             // unique per businessId
  description: string;
  coverImageUrl: string | null;
  productIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `businesses/{businessId}/storeOrders/{orderId}`

```typescript
type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: Timestamp;
  changedBy: string;                         // userId of merchant
}

interface OrderLineItem {
  productId: string;
  productType: 'physical' | 'digital' | 'service';
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface StoreOrder {
  orderNumber: string;                       // e.g. "ORD-00042"
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryOption: 'delivery' | 'pickup';
  shippingAddress: string | null;
  shippingZoneId: string | null;
  shippingCost: number;
  lineItems: OrderLineItem[];
  subtotal: number;
  total: number;
  paystackReference: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingNumber: string | null;
  carrier: string | null;
  statusHistory: StatusHistoryEntry[];
  integrationStatus: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `businesses/{businessId}/checkoutSessions/{sessionId}`

```typescript
type CheckoutSessionStatus =
  | 'pending'
  | 'payment_initiated'
  | 'payment_confirmed'
  | 'payment_confirmed_integration_pending'
  | 'completed'
  | 'expired';

interface CheckoutSession {
  storeSlug: string;
  businessId: string;
  lineItems: OrderLineItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryOption: 'delivery' | 'pickup';
  shippingAddress: string | null;
  shippingZoneId: string | null;
  shippingCost: number;
  subtotal: number;
  total: number;
  paystackReference: string | null;
  status: CheckoutSessionStatus;
  expiresAt: Timestamp;                      // TTL: 1 hour from creation
  createdAt: Timestamp;
}
```

### `businesses/{businessId}/storeShippingZones/{zoneId}`

```typescript
interface ShippingZone {
  zoneName: string;
  regions: string[];                         // state/region names
  flatRate: number;                          // >= 0, validated
  estimatedDeliveryDays: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `businesses/{businessId}/storeAnalytics/{eventId}`

```typescript
type AnalyticsEventType = 'page_view' | 'add_to_cart' | 'checkout_initiated' | 'order_completed';

interface StoreAnalyticsEvent {
  eventType: AnalyticsEventType;
  storeSlug: string;
  pageType: string | null;
  productId: string | null;
  timestamp: Timestamp;
}
```

### Cart (client-side, localStorage)

```typescript
// localStorage key: `busmo_cart_${storeSlug}`
interface CartItem {
  productId: string;
  displayName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;                          // cap at this value; Infinity for digital/service
  productType: 'physical' | 'digital' | 'service';
}

interface Cart {
  storeSlug: string;
  items: CartItem[];
  updatedAt: number;                         // Unix timestamp ms
}
```

### TypeScript Extensions

**`src/app/owner/dashboard/types.ts`** — add to `PageId` union:

```typescript
| 'mo-sell'
```

**`src/app/owner/dashboard/mo-sell/mo-sell.types.ts`** — contains all interfaces above plus:

```typescript
interface IntegrationBridgeParams {
  businessId: string;
  sessionId: string;
  paystackData: PaystackTransactionData;
}

interface IntegrationBridgeResult {
  orderId: string;
}

interface PaystackTransactionData {
  reference: string;
  status: string;
  amount: number;                            // kobo
  currency: string;
  metadata: Record<string, unknown>;
}
```

---

## Integration Bridge Design

**File:** `src/lib/services/mo-sell-integration-bridge.ts`

```typescript
export async function processConfirmedOrder(params: IntegrationBridgeParams): Promise<IntegrationBridgeResult>
```

The bridge executes a single `WriteBatch` via Firebase Admin SDK. All seven writes are committed atomically. If the batch fails, no partial state exists.

### Batch Write Operations (in order)

1. **Create StoreOrder** — `businesses/{businessId}/storeOrders/{orderId}`
   - `status: 'paid'`, `paymentStatus: 'paid'`, `integrationStatus: 'completed'`
   - `orderNumber`: read existing order count + 1, format as `ORD-XXXXX`
   - `paystackReference`, all line items, totals from session

2. **Decrement stock** — `businesses/{businessId}/products/{productId}`
   - Only for line items where `productType === 'physical'`
   - Use Firestore `increment(-quantity)` for each physical product

3. **Create sales record** — `businesses/{businessId}/sales/{saleId}`
   - Same structure as manually recorded sales
   - `paymentMethod: 'online'`, `source: 'mo_sell'`
   - `products`: array mapped from line items
   - `total`: verified Paystack amount ÷ 100 (kobo → NGN)

4. **Upsert customer** — `businesses/{businessId}/customers/{customerId}`
   - Match by email (query first); create if absent
   - `increment('totalOrders', 1)` and `increment('totalSpend', order.total)`

5. **Create cash flow entry** — `businesses/{businessId}/cashFlow/{flowId}`
   - `type: 'income'`, `source: 'mo_sell'`
   - `amount`: order total, `description`: `"Online order ${orderNumber}"`

6. **Create new-order notification** — `businesses/{businessId}/notifications/{id}`
   - `type: 'new_order'`, `orderId`, `read: false`

7. **Low-stock notifications** — `businesses/{businessId}/notifications/{id}`
   - For each physical line item where `stock - purchasedQty <= lowStockThreshold`
   - `type: 'low_stock'`, `productId`

### Failure Handling

If `batch.commit()` throws:
- Set `checkoutSessions/{sessionId}.status = 'payment_confirmed_integration_pending'`
- Log error to `console.error` with structured context
- Return `{ error: 'integration_failed', sessionId }` to client (HTTP 202)
- Merchant sees yellow alert banner in `MOSellOverview.tsx` for any session in `payment_confirmed_integration_pending` state

### Email Notifications (fire-and-forget)

After batch commit, non-blocking calls (`.catch()` logged):

```typescript
// Customer confirmation
await sendOrderConfirmationEmail({ customerEmail, orderNumber, lineItems, total, storeName }).catch(console.error);

// Merchant notification
await sendNewOrderEmail({ merchantEmail, orderNumber, customerName, total }).catch(console.error);
```

Both use the existing `@sendgrid/mail` integration pattern from `src/services/email/`.

---

## Paystack Integration Flow

### Client → Server Flow

```
1. Customer fills CheckoutForm
2. POST /api/store/checkout/initiate
   Body: { storeSlug, businessId, lineItems, customer, deliveryOption,
           shippingZoneId, shippingCost, subtotal, total }
   Response: { paystackUrl: string, sessionId: string }

3. Client redirects to paystackUrl (Paystack hosted page)

4. Paystack redirects to:
   /store/{storeSlug}/order/pending?ref={reference}&session={sessionId}

5. pending/page.tsx calls:
   POST /api/store/orders/confirm
   Body: { paystackReference, sessionId, businessId }
   Response: { orderId } → redirect to /store/{storeSlug}/order/{orderId}
```

### `/api/store/checkout/initiate` (POST)

```typescript
// 1. Validate request body with zod schema
// 2. Create CheckoutSession in Firestore (status: 'pending', expiresAt: now+1hr)
// 3. Initialize Paystack transaction:
const res = await fetch('https://api.paystack.co/transaction/initialize', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: customerEmail,
    amount: total * 100,               // kobo
    currency: storeConfig.currency,
    reference: `mosell_${sessionId}_${Date.now()}`,
    metadata: { sessionId, businessId, storeSlug },
    callback_url: `${baseUrl}/store/${storeSlug}/order/pending`,
  }),
});
// 4. Update session with paystackReference (status: 'payment_initiated')
// 5. Return { paystackUrl: data.authorization_url, sessionId }
```

### `/api/store/orders/confirm` (POST)

```typescript
// 1. Fetch CheckoutSession — verify it exists and is 'payment_initiated'
// 2. GET https://api.paystack.co/transaction/verify/{reference}
//    Authorization: Bearer ${process.env.PAYSTACK_SECRET_KEY}
// 3. If status !== 'success': update session to 'failed', return 400
// 4. If amount !== session.total * 100 (kobo): return 400 with amount mismatch
// 5. Call processConfirmedOrder({ businessId, sessionId, paystackData })
// 6. Update session status to 'completed'
// 7. Return { orderId }
```

### Paystack Keys

| Key | Location | Usage |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | `process.env` server-only | Transaction initialization and verification |
| `paystackPublicKey` | `store/config` Firestore doc | Read by storefront to pass to checkout (not used for inline JS in Phase 1) |

---

## MO AI Integration Points

### Store Setup Wizard

The wizard sends a custom system prompt suffix to `/api/ask-mo`:

```
"You are helping set up a MO Sell storefront for a business in Africa.
The merchant has described their business. Based on this, respond conversationally
and include a JSON block at the end of your message in exactly this format:
```json
{
  "suggestions": {
    "storeName": "string",
    "primaryColor": "#xxxxxx",
    "secondaryColor": "#xxxxxx",
    "collectionNames": ["string"],
    "storePolicy": "string",
    "faq": [{ "q": "string", "a": "string" }]
  }
}
```"
```

The wizard parses the JSON block from MO's response using a regex extractor:

```typescript
const jsonMatch = moResponse.match(/```json\n([\s\S]+?)\n```/);
const suggestions = jsonMatch ? JSON.parse(jsonMatch[1]).suggestions : null;
```

Each suggestion is presented as a conversational message from MO, not a raw form field. Merchants can accept, edit, or ask MO to regenerate each field individually.

### MO Sell Context in Ask MO

`useAskMO.ts` extends the `businessSummary` payload sent to `/api/ask-mo`:

```typescript
moSell?: {
  storeStatus: 'draft' | 'active' | 'paused' | 'not_configured';
  monthlyRevenue: number;
  monthlyOrders: number;
  conversionRate: number;                    // (orders / checkoutSessions) * 100
  topProducts: Array<{ name: string; unitsSold: number }>;
}
```

This data is loaded from `businesses/{businessId}/store/config` and aggregated from `storeOrders` and `storeAnalytics` collections. It becomes part of the `BUSINESS_CONTEXT_PROMPT` that the `/api/ask-mo` route already injects, so MO can answer "how many orders today?" accurately.

### Proactive MO Prompt Cards (MOSellOverview.tsx)

Trigger conditions are evaluated client-side with hardcoded logic — no AI call required:

| Condition | Card Copy |
|---|---|
| `storeProducts.length === 0` | "Your store has no products yet. Want me to generate descriptions from your inventory?" |
| `store.status === 'active'` AND `store.createdAt < 7 days ago` AND `storeOrders.length === 0` | "Your store has been live for 7 days with no orders. Here's what I'd try first..." |

---

## Firestore Security Rules

Add the following rules to the existing `firestore.rules` file, inside the top-level `match /databases/{database}/documents` block. These extend the existing rules — do not replace them.

```
// =====================
// MO SELL — STORE CONFIG (merchant only)
// =====================
match /businesses/{businessId}/store/{document=**} {
  allow read: if hasBusinessAccess(businessId) || isAdmin();
  allow write: if hasBusinessAccess(businessId) || isAdmin();
}

// =====================
// MO SELL — STORE PRODUCTS (public read, merchant write)
// =====================
match /businesses/{businessId}/storeProducts/{productId} {
  allow read: if true;
  allow write: if hasBusinessAccess(businessId) || isAdmin();
}

// =====================
// MO SELL — STORE COLLECTIONS (public read, merchant write)
// =====================
match /businesses/{businessId}/storeCollections/{collectionId} {
  allow read: if true;
  allow write: if hasBusinessAccess(businessId) || isAdmin();
}

// =====================
// MO SELL — STORE ORDERS (merchant read, Integration Bridge creates via Admin SDK)
// =====================
match /businesses/{businessId}/storeOrders/{orderId} {
  allow read: if hasBusinessAccess(businessId) || isAdmin();
  allow create: if false; // created server-side via Admin SDK (bypasses rules)
  allow update: if hasBusinessAccess(businessId) || isAdmin();
}

// =====================
// MO SELL — CHECKOUT SESSIONS (public create + read; session ID is unguessable UUID)
// =====================
match /businesses/{businessId}/checkoutSessions/{sessionId} {
  allow read, create: if true;
  allow update: if true; // needed for status updates from pending/page.tsx
  allow delete: if false;
}

// =====================
// MO SELL — STORE ANALYTICS (public create, merchant read)
// =====================
match /businesses/{businessId}/storeAnalytics/{eventId} {
  allow create: if true;
  allow read: if hasBusinessAccess(businessId) || isAdmin();
  allow update, delete: if false;
}

// =====================
// MO SELL — SHIPPING ZONES (merchant only)
// =====================
match /businesses/{businessId}/storeShippingZones/{zoneId} {
  allow read, write: if hasBusinessAccess(businessId) || isAdmin();
}
```

Note: All Integration Bridge writes run via Firebase Admin SDK on the server, which bypasses these security rules entirely. The rules above govern client-side SDK access only.

---

## Performance Strategy

### Storefront Pages (Public)

| Page | Rendering Strategy | Rationale |
|---|---|---|
| `store/[storeSlug]` (homepage) | ISR, `revalidate = 60` | Product/collection data changes infrequently |
| `store/[storeSlug]/products/[productId]` | ISR, `revalidate = 60` + `generateStaticParams` | Pre-generates top product pages at build time |
| `store/[storeSlug]/cart` | Client-side only | Cart is localStorage — no server content |
| `store/[storeSlug]/checkout` | Client-side only | Form state, no static content |
| `store/[storeSlug]/order/[orderId]` | Server-side render | Order data must be fresh at time of request |
| `store/[storeSlug]/order/pending` | Client-side only | Polling loop after Paystack redirect |

### LCP Target (≤ 2.5s on mobile 4G)

Achieved via:
1. **Static generation**: Homepage and product pages are pre-rendered HTML — no client waterfall.
2. **Next.js `<Image>`**: All product images use `next/image` with explicit `width`, `height`, and `sizes` props. Formats served as WebP where supported.
3. **No dashboard bundle**: The storefront route group (`/store/`) is completely outside the AppShell. None of the dashboard JavaScript is loaded on public pages.
4. **Store config cached in layout**: `StorefrontLayout.tsx` is a server component that fetches `store/config` once per request and passes it to all child pages via React context — no duplicate fetches per page.
5. **Analytics fire-and-forget**: `POST /api/store/analytics/event` is called without `await` on the client. It never blocks render.
6. **Lean storefront CSS**: Storefront pages use a minimal CSS file with CSS custom properties (`--primary-color`, `--secondary-color`) sourced from `store/config`. No Tailwind JIT scan overhead at runtime.

### Merchant Dashboard Performance

- `MOSellPage.tsx` loads `store/config` on mount. If absent, renders wizard immediately — no loading skeleton.
- `StoreOrdersManager.tsx` paginates at 20 orders per page using Firestore `startAfter` cursor pagination.
- `StoreAnalyticsPanel.tsx` aggregates data client-side from the last 30 days of `storeAnalytics` events (max 500 docs per query). Monthly summaries are pre-computed and stored in `store/config.monthlySnapshot` on each order completion to avoid expensive aggregation queries.
- All dashboard sub-components are code-split by React lazy loading inside `MOSellPage.tsx`.

### Cart Performance

- All cart operations are synchronous localStorage reads/writes — zero network latency.
- Cart state is hydrated on first render from `localStorage`. A small hydration mismatch guard prevents SSR flash.

---

## Property-Based Correctness Properties

The following properties define the formal correctness criteria for MO Sell. These are encoded as executable tests using the project's test framework.

### Property 1 — Cart Subtotal Consistency
**For all cart states C:** `subtotal(C) = Σ (item.quantity × item.price)` for all items in C.
- Tested by: generate random carts with fuzzing, verify subtotal equals manual sum.

### Property 2 — Stock Cap Enforcement
**For all add-to-cart operations:** if `item.productType === 'physical'` and `requestedQty > item.stock`, then `cart.item.quantity = item.stock`.
- Tested by: attempt to add quantities above stock; verify quantity never exceeds `maxStock`.

### Property 3 — Integration Bridge Atomicity
**For all payment confirmation events:** either all six write targets (order, stock decrements, sale, customer, cashFlow, notification) are updated, or none are.
- Tested by: mock Firestore batch to throw mid-commit; verify no partial writes exist afterward.

### Property 4 — Paystack Amount Integrity
**For all order confirmations:** `order.total = paystackData.amount / 100` where `paystackData.amount` is the verified kobo amount from Paystack.
- Tested by: generate orders with various totals; verify confirmed order total equals verified Paystack amount.

### Property 5 — Stock Decrement Type Guard
**For all confirmed orders:** `productType === 'digital'` or `productType === 'service'` products MUST NOT have their `stock` field decremented.
- Tested by: create orders with mixed product types; verify only physical products have stock decremented.

### Property 6 — storeSlug Uniqueness
**For all storeSlug generation operations:** if slug S already exists in any `store/config` document, the generated slug MUST be S + "-N" for some integer N ≥ 1.
- Tested by: simulate slug collisions; verify generated slug is always unique.

### Property 7 — Discount Badge Accuracy
**For all products where `compareAtPrice > price`:** `discountBadge = round((1 - price / compareAtPrice) * 100)`.
- Tested by: generate product pairs with various price/compareAtPrice ratios; verify badge percentage matches formula.

### Property 8 — Order Pipeline Monotonicity
**For all order status transitions:** transitions only move forward in the pipeline (`paid → processing → shipped → delivered`) or to terminal states (`cancelled`, `refunded`). Backward transitions (e.g., `shipped → paid`) are rejected.
- Tested by: attempt all possible status transition pairs; verify only valid forward transitions succeed.

---

## Custom Domain Support

### Overview

Merchants can connect a domain they own (e.g. `shop.mybrand.com`) to their MO Sell storefront. When verified, the storefront is accessible at both the custom domain and the default `busmo.io/store/{storeSlug}` URL simultaneously. The custom domain becomes the canonical URL for all links, OG meta tags, and email content.

The implementation uses a DNS CNAME approach — no SSL provisioning code is needed in the application itself. The hosting infrastructure (Firebase App Hosting / Vercel / Cloudflare) handles TLS termination for custom domains at the edge. The application is responsible for:

1. Accepting and validating the custom domain input
2. Showing the merchant the correct DNS instructions
3. Verifying the CNAME resolves correctly
4. Routing incoming requests from the custom domain to the right storefront

---

### DNS Setup Flow (Merchant-Facing)

When a merchant enters a custom domain in `StoreSettingsPanel.tsx`, they are shown these instructions:

```
To connect shop.mybrand.com to your MO Sell store:

1. Log in to your domain registrar (e.g. GoDaddy, Namecheap, Google Domains).
2. Go to DNS settings for mybrand.com.
3. Add a CNAME record:
     Host / Name:  shop
     Value / Target:  store.busmo.io
     TTL:  3600 (or "Automatic")
4. Save and allow up to 48 hours for DNS to propagate.
5. Click "Verify Domain" below to check when it's ready.
```

The `customDomainStatus` is set to `pending` immediately on save. The merchant can re-run verification at any time by clicking "Verify Domain".

---

### Domain Verification API

**New route:** `src/app/api/store/domain/verify/route.ts`

```typescript
// POST body: { businessId: string; customDomain: string }
// Auth: requires valid merchant session (checked via Firebase Admin SDK)

export async function POST(request: NextRequest) {
  // 1. Validate that businessId belongs to the authenticated user
  // 2. Read Store_Config to confirm customDomain matches the stored value
  // 3. Perform DNS CNAME lookup:
  const dns = await import('dns/promises');
  let resolved: string[] = [];
  try {
    resolved = await dns.resolveCname(customDomain);
  } catch {
    // CNAME not found or DNS error
  }
  const verified = resolved.some(r => r === 'store.busmo.io' || r.endsWith('.busmo.io'));

  // 4. Update Store_Config:
  //    verified  → customDomainStatus: 'verified', customDomainVerifiedAt: now
  //    not found → customDomainStatus: 'failed'

  // 5. Return { verified: boolean, resolvedTo: string[] }
}
```

Node's built-in `dns/promises.resolveCname()` is used — no external DNS library needed.

---

### Request Routing: Custom Domain → Storefront

Next.js middleware (`src/middleware.ts`) intercepts all incoming requests and rewrites custom domain traffic to the correct storefront route:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const isBusmoHost = host === 'busmo.io' || host.endsWith('.busmo.io') || host.includes('localhost');

  // Only intercept requests from non-Busmo hosts
  if (!isBusmoHost) {
    // Lookup businessId by customDomain using the public config API
    // (cached at the edge via Next.js fetch cache)
    const res = await fetch(
      `${request.nextUrl.origin}/api/store/domain/lookup?domain=${host}`,
      { next: { revalidate: 300 } }   // cache 5 minutes at edge
    );

    if (res.ok) {
      const { storeSlug } = await res.json();
      // Rewrite the URL: / → /store/{storeSlug}, /products/x → /store/{storeSlug}/products/x
      const url = request.nextUrl.clone();
      url.pathname = `/store/${storeSlug}${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }

    // Domain not found or not verified — return 404
    return new NextResponse('Store not found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon).*)'],
};
```

**Domain lookup API** (`src/app/api/store/domain/lookup/route.ts`):

```typescript
// GET ?domain=shop.mybrand.com
// Queries Firestore for a Store_Config where customDomain === domain AND customDomainStatus === 'verified'
// Returns { storeSlug } or 404
// Uses Firebase Admin SDK (server-side only)
```

This lookup is cached for 5 minutes at the edge, so Firestore is not hit on every storefront request from a custom domain.

---

### Canonical URL and Meta Tag Handling

`StorefrontLayout.tsx` determines the canonical base URL at render time:

```typescript
// Server component — runs at request time
const storeConfig = await getStoreConfig(storeSlug);

const baseUrl =
  storeConfig.customDomainStatus === 'verified' && storeConfig.customDomain
    ? `https://${storeConfig.customDomain}`
    : `https://busmo.io/store/${storeConfig.storeSlug}`;
```

This `baseUrl` is passed to all child pages and used for:
- `<link rel="canonical" href={baseUrl} />`
- Open Graph `og:url` meta tag
- Storefront links in confirmation emails
- Sitemap generation (future)

---

### Email Links

`processConfirmedOrder` in `mo-sell-integration-bridge.ts` reads `Store_Config` to determine the correct storefront base URL before constructing email links:

```typescript
const storeLinkBase =
  config.customDomainStatus === 'verified' && config.customDomain
    ? `https://${config.customDomain}`
    : `https://busmo.io/store/${config.storeSlug}`;

const orderUrl = `${storeLinkBase}/order/${orderId}`;
// Used in both the customer confirmation email and the merchant notification email
```

---

### StoreSettingsPanel UI Behaviour

| State | UI shown |
|---|---|
| No custom domain saved | Input field + "Connect a domain" helper text |
| `customDomainStatus: 'pending'` | Domain value + DNS instructions panel + "Verify Domain" button + amber badge "Pending DNS" |
| `customDomainStatus: 'verified'` | Domain value + green badge "Active" + "Remove" link + verified-at timestamp |
| `customDomainStatus: 'failed'` | Domain value + red badge "Verification Failed" + error message + "Retry Verification" button + DNS instructions |

The "Verify Domain" button calls `POST /api/store/domain/verify` and updates the badge in real time without a full page reload.

---

### Property-Based Correctness Property (addition)

**Property 9 — Custom Domain Canonical Consistency**
**For all storefront renders where `customDomainStatus === 'verified'`:** the `<link rel="canonical">` href, `og:url` meta tag, and all storefront email links SHALL use the custom domain base URL, not the `busmo.io/store/{storeSlug}` URL.
- Tested by: set `customDomainStatus` to `verified` with a mock domain; assert all URL outputs use the custom domain prefix.
