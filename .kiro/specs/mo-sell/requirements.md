# Requirements Document — MO Sell

## Introduction

MO Sell is the commerce engine of Busmo — an AI-powered Business Operating System for African businesses. MO Sell allows any Busmo merchant to create a beautiful, fully integrated online storefront without needing technical knowledge. It is a native module inside the existing Busmo Next.js application, not a separate app.

When a customer places an order through MO Sell, the transaction automatically propagates to Busmo's existing sales, inventory, profit, cash flow, customer history, and analytics modules. MO (the AI business partner) understands every transaction immediately and can answer questions, surface insights, and automate follow-up actions on the merchant's behalf.

Phase One covers: Store Setup (AI-guided), Storefront (public-facing), Commerce (payments, shipping, order management), and Store Analytics.

---

## Glossary

- **Busmo**: The parent AI-powered Business Operating System in which MO Sell lives.
- **MO**: Busmo's AI business partner. Understands the merchant's business context and guides setup, answers questions, and surfaces recommendations.
- **MO Sell**: The commerce module of Busmo that powers online storefronts.
- **Merchant**: The business owner who configures and manages a MO Sell storefront. Equivalent to `users/{userId}` with `role: 'Owner'` in Firestore.
- **Customer**: An end buyer who visits and purchases from a MO Sell storefront.
- **Storefront**: The public-facing online store that Customers browse and purchase from.
- **Store_Setup_Wizard**: The AI-guided onboarding flow inside Busmo's Owner dashboard that helps Merchants configure their MO Sell store.
- **Store_Config**: The Firestore document at `merchants/{merchantId}/store/config` that holds the Merchant's storefront settings.
- **Catalog**: The collection of Products and Collections visible in the Storefront.
- **Product**: A sellable item defined by a flexible schema that supports physical products, digital products, services, and other fulfillment types determined by `productType`.
- **Collection**: A named grouping of Products (e.g., "Summer Essentials", "Best Sellers").
- **Cart**: A temporary, session-scoped set of Product line items assembled by a Customer before checkout.
- **Order**: A confirmed purchase transaction created after successful payment. Stored in `merchants/{merchantId}/storeOrders/{orderId}`.
- **Order_Pipeline**: The lifecycle of an Order through statuses: `pending_payment → paid → processing → shipped → delivered` or `cancelled` / `refunded`.
- **Paystack**: The payment gateway used to collect online payments from Customers.
- **Checkout_Session**: A short-lived record that holds Cart contents, Customer details, and Paystack payment reference before Order creation.
- **Integration_Bridge**: The internal service that, upon Order payment confirmation, writes to Busmo's existing `merchants/{merchantId}/sales`, `products` (stock), `customers`, and `cashflow` collections.
- **Store_Analytics**: Aggregated metrics about Storefront traffic, conversion, revenue, and top products, stored in `merchants/{merchantId}/storeAnalytics`.
- **Shipping_Zone**: A geographic delivery area with configured rates and estimated delivery times.
- **Delivery_Option**: A fulfillment method available to a Customer at checkout: delivery or pickup.
- **Store_URL**: The publicly accessible URL for a Merchant's Storefront, formatted as `busmo.io/store/{storeSlug}` or a custom domain.
- **storeSlug**: A URL-safe unique identifier for the Merchant's store, derived from the store name.
- **Custom_Domain**: A merchant-owned domain name (e.g., `shop.mybrand.com`) connected to a MO Sell storefront via a DNS CNAME record pointing to `store.busmo.io`.
- **customDomainStatus**: A field in Store_Config tracking the verification state of a Custom_Domain: `pending` (DNS not yet confirmed), `verified` (CNAME resolves correctly), or `failed` (verification check failed).
- **Domain_Purchase_Flow**: The end-to-end in-app workflow that allows a Merchant to search, pay for, register, and auto-configure a domain name without leaving Busmo.
- **GoDaddy_API**: The third-party domain registrar REST API (v3) used by Busmo to check domain availability, execute domain registrations, and manage DNS records on behalf of Merchants.
- **Domain_Purchase_Record**: A sub-document in Store_Config capturing the GoDaddy registration ID, Paystack payment reference, purchase date, renewal date, and annual renewal price for a domain purchased through MO Sell.

---

## Requirements

### Requirement 1: AI-Guided Store Setup

**User Story:** As a Merchant, I want MO to guide me through setting up my online store conversationally, so that I can launch a professional storefront without filling out endless forms.

#### Acceptance Criteria

1. WHEN a Merchant navigates to the MO Sell module for the first time, THE Store_Setup_Wizard SHALL detect that no Store_Config exists and present the onboarding flow.
2. WHEN the Store_Setup_Wizard is active, THE Store_Setup_Wizard SHALL ask the Merchant what they sell before presenting any configuration form.
3. WHEN the Merchant provides a business description, THE Store_Setup_Wizard SHALL pre-fill store name, suggested color palette, homepage section layout, collection names, and store policies using MO's AI inference.
4. THE Store_Setup_Wizard SHALL allow the Merchant to accept, modify, or regenerate each AI suggestion individually without restarting the entire flow.
5. WHEN the Merchant confirms their store configuration, THE Store_Setup_Wizard SHALL create the Store_Config document in Firestore and mark the store as `status: 'draft'`.
6. THE Store_Config SHALL store: store name, logo URL, primary brand color, secondary brand color, business category, storeSlug, currency code, contact email, contact phone, and store status (`draft` | `active` | `paused`).
7. WHEN the storeSlug is generated, THE Store_Setup_Wizard SHALL verify uniqueness across all Merchant storeSlug values in Firestore and append a numeric suffix if a collision is detected.
8. IF the Merchant attempts to set a storeSlug that contains characters outside `[a-z0-9-]`, THEN THE Store_Setup_Wizard SHALL reject the input and display a validation message specifying the allowed character set.
9. THE Store_Setup_Wizard SHALL be completable on a mobile device with no horizontal scrolling required on viewports 375px wide or wider.
10. WHEN a Merchant who has already completed setup returns to the MO Sell module, THE MO_Sell_Dashboard SHALL display the store status and management interface instead of the onboarding flow.

---

### Requirement 2: Store Branding and Identity

**User Story:** As a Merchant, I want to customize my store's visual identity, so that my storefront looks professional and matches my brand.

#### Acceptance Criteria

1. THE Store_Config SHALL accept a logo image uploaded by the Merchant and store the resulting URL in `logoUrl`.
2. WHEN a Merchant uploads a logo image, THE MO_Sell_Dashboard SHALL accept files of type PNG, JPG, or WebP with a maximum file size of 5 MB and store a compressed version at no more than 800×800 pixels.
3. IF a Merchant uploads a logo file that exceeds 5 MB or is not of type PNG, JPG, or WebP, THEN THE MO_Sell_Dashboard SHALL reject the file and display an error message stating the size and format constraints.
4. THE Store_Config SHALL store a `primaryColor` and `secondaryColor` as valid CSS hex color strings.
5. WHEN a Merchant saves brand colors, THE Storefront SHALL apply the saved `primaryColor` to all primary call-to-action buttons and the `secondaryColor` to accent elements within 500ms of the configuration update propagating.
6. WHERE the Merchant has not uploaded a logo, THE Storefront SHALL display the store name in a styled text treatment using the `primaryColor`.

---

### Requirement 3: Product Catalog Management

**User Story:** As a Merchant, I want to manage the products available in my online store, so that Customers can browse and purchase what I actually sell.

#### Acceptance Criteria

1. THE MO_Sell_Dashboard SHALL allow Merchants to add Products to the Storefront Catalog directly from their existing Busmo inventory, without re-entering product information.
2. WHEN a Merchant adds an inventory product to the Catalog, THE MO_Sell_Dashboard SHALL copy `name`, `price`, `stock`, `imageUrl`, `category`, and `description` from the inventory product document as default values, which the Merchant can then override.
3. THE Product in the Storefront Catalog SHALL store: `productId`, `productType` (`physical` | `digital` | `service`), `displayName`, `description`, `price`, `compareAtPrice`, `images` (array of URLs, max 8), `category`, `collectionIds` (array), `tags` (array), `stock`, `sku`, `available` (boolean), `featured` (boolean), `createdAt`, and `updatedAt`.
4. WHEN a Merchant sets `productType` to `digital`, THE MO_Sell_Dashboard SHALL allow the Merchant to attach a downloadable file URL and suppress all shipping-related fields for that Product.
5. WHEN a Merchant sets `productType` to `service`, THE MO_Sell_Dashboard SHALL suppress stock and shipping fields and allow a `deliveryNote` text field instead.
6. THE MO_Sell_Dashboard SHALL allow a Merchant to mark any Product as `available: false`, which causes THE Storefront to hide the Product from all catalog views without deleting the record.
7. WHEN a Merchant sets a `compareAtPrice` greater than `price`, THE Storefront SHALL display a percentage discount badge calculated as `round((1 - price / compareAtPrice) * 100)`.
8. IF a Merchant submits a Product with `price` less than or equal to zero, THEN THE MO_Sell_Dashboard SHALL reject the submission and display a validation error.
9. THE MO_Sell_Dashboard SHALL allow bulk-enable and bulk-disable of Catalog visibility for selected Products in a single action.
10. WHEN MO suggests product descriptions during onboarding or editing, THE MO_Sell_Dashboard SHALL generate a description using the product name, category, and business context from Store_Config.

---

### Requirement 4: Collections and Catalog Organization

**User Story:** As a Merchant, I want to organize my products into collections, so that Customers can browse by category or theme.

#### Acceptance Criteria

1. THE MO_Sell_Dashboard SHALL allow Merchants to create named Collections with a title, description, and optional cover image.
2. THE MO_Sell_Dashboard SHALL allow Merchants to assign Products to one or more Collections.
3. WHEN the Store_Setup_Wizard generates AI-suggested collection names, THE Store_Setup_Wizard SHALL base the suggestions on the Merchant's business description and existing inventory product categories.
4. THE Storefront SHALL display Collections on the homepage as browsable sections when the Merchant has at least one Collection with at least one available Product.
5. WHEN a Merchant deletes a Collection, THE MO_Sell_Dashboard SHALL remove the `collectionId` from all associated Products' `collectionIds` arrays without deleting the Products.
6. IF a Merchant attempts to create a Collection with a title that already exists for the same merchantId, THEN THE MO_Sell_Dashboard SHALL reject the request and display a duplicate name error.

---

### Requirement 5: Public Storefront — Homepage

**User Story:** As a Customer, I want to visit a merchant's online store and see a beautiful, organized homepage, so that I can discover products and decide to shop.

#### Acceptance Criteria

1. THE Storefront SHALL render a publicly accessible homepage at the URL `busmo.io/store/{storeSlug}` without requiring Customer authentication.
2. THE Storefront SHALL display the store name, logo, and a hero section on the homepage.
3. WHEN the Store_Config `status` is `draft`, THE Storefront SHALL display a "Coming Soon" page to unauthenticated visitors and the management interface to the authenticated Merchant.
4. WHEN the Store_Config `status` is `paused`, THE Storefront SHALL display a store-temporarily-unavailable message to all visitors.
5. THE Storefront homepage SHALL display featured Products when the Merchant has set `featured: true` on at least one available Product.
6. THE Storefront homepage SHALL display Collection sections for each Collection that contains at least one available Product.
7. THE Storefront SHALL achieve a Largest Contentful Paint (LCP) of 2.5 seconds or less on a simulated mobile 4G connection for homepage loads.
8. THE Storefront SHALL be fully usable on viewport widths of 375px or wider without horizontal overflow.

---

### Requirement 6: Product Search and Discovery

**User Story:** As a Customer, I want to search and browse products on the storefront, so that I can quickly find what I'm looking for.

#### Acceptance Criteria

1. THE Storefront SHALL provide a search input that filters the Catalog by matching the search query against `displayName`, `description`, `tags`, and `category` fields.
2. WHEN a Customer submits a search query of fewer than 2 characters, THE Storefront SHALL display a prompt indicating that the query is too short and show no results.
3. WHEN a search query matches no available Products, THE Storefront SHALL display a "no results" message and suggest the Customer browse by Collection.
4. THE Storefront SHALL allow Customers to filter Products by Collection without requiring a search query.
5. THE Storefront SHALL display each Product card with at minimum: product image (or placeholder), display name, price, and an "Add to Cart" button.
6. WHEN a Product has `available: false` or `stock` equal to 0, THE Storefront SHALL display the Product card with an "Out of Stock" label and disable the "Add to Cart" button.

---

### Requirement 7: Product Detail Page

**User Story:** As a Customer, I want to view a detailed product page, so that I can learn about the product before purchasing.

#### Acceptance Criteria

1. THE Storefront SHALL render a product detail page at `/store/{storeSlug}/products/{productId}` for each available Product.
2. THE Storefront product detail page SHALL display: all product images in a scrollable gallery, display name, price, compareAtPrice if set, description, available stock count (when stock is fewer than 10 units), and an "Add to Cart" button.
3. WHEN a Customer navigates to a product detail page for a Product with `available: false`, THE Storefront SHALL display an "Out of Stock" notice and hide the "Add to Cart" button.
4. WHEN a Customer shares a product detail page URL, THE Storefront SHALL render correct Open Graph meta tags including title, description, and the first product image.

---

### Requirement 8: Shopping Cart

**User Story:** As a Customer, I want to add items to a cart and review my order before checkout, so that I can purchase multiple products in one transaction.

#### Acceptance Criteria

1. THE Storefront SHALL maintain a Cart scoped to the Customer's browser session, persisted in localStorage, without requiring the Customer to create an account.
2. WHEN a Customer clicks "Add to Cart" on a Product, THE Storefront SHALL add the Product to the Cart with a quantity of 1 and display a cart count indicator in the navigation.
3. WHEN a Customer adds a Product to the Cart that is already in the Cart, THE Storefront SHALL increment the existing line item quantity by 1 instead of creating a duplicate line item.
4. THE Storefront Cart panel SHALL display: each line item's image, name, quantity, unit price, and line total; the cart subtotal; and buttons to proceed to checkout or continue shopping.
5. WHEN a Customer sets a Cart line item quantity to 0, THE Storefront SHALL remove that line item from the Cart.
6. IF a Customer attempts to add a quantity of a Product that exceeds the available `stock`, THEN THE Storefront SHALL cap the Cart quantity at the available stock value and display a notice indicating the maximum available quantity.
7. THE Storefront Cart subtotal SHALL equal the sum of `(quantity × price)` for all line items, recalculated after every Cart mutation.

---

### Requirement 9: Checkout Flow

**User Story:** As a Customer, I want a simple, trustworthy checkout experience, so that I can complete my purchase confidently.

#### Acceptance Criteria

1. THE Storefront checkout SHALL collect: Customer full name, email address, phone number, delivery address (when delivery is selected), and chosen Delivery_Option.
2. WHEN the Merchant has configured at least one Shipping_Zone, THE Storefront checkout SHALL present delivery and pickup as Delivery_Option choices; otherwise THE Storefront SHALL present only pickup.
3. WHEN a Customer selects delivery, THE Storefront SHALL display available Shipping_Zone rates and add the selected shipping cost to the order total.
4. THE Storefront checkout SHALL display a clear order summary showing all line items, subtotal, shipping cost (if applicable), and grand total before the Customer initiates payment.
5. WHEN a Customer submits checkout, THE Storefront SHALL create a Checkout_Session in Firestore and initiate a Paystack payment using the Paystack public key configured in Store_Config.
6. WHEN Paystack returns a successful payment callback, THE Storefront SHALL verify the transaction against the Paystack secret key server-side before creating an Order.
7. IF Paystack verification fails or returns a status other than `success`, THEN THE Storefront SHALL retain the Checkout_Session, display a payment failure message, and allow the Customer to retry payment without re-entering their details.
8. WHEN payment is verified as successful, THE Integration_Bridge SHALL create an Order in `merchants/{merchantId}/storeOrders`, decrement stock for each purchased Product in `merchants/{merchantId}/products`, record a sale in `merchants/{merchantId}/sales`, update the Customer record in `merchants/{merchantId}/customers`, and create a cash flow entry in `merchants/{merchantId}/cashflow` — all within a single Firestore batch write.
9. THE Integration_Bridge SHALL set the Order `total`, the sales record `total`, and the cash flow entry `amount` to identical values derived from the verified Paystack transaction amount.
10. IF the Firestore batch write in the Integration_Bridge fails, THEN THE Integration_Bridge SHALL log the failure, retain the Checkout_Session with `status: 'payment_confirmed_integration_pending'`, and surface an alert to the Merchant in the MO_Sell_Dashboard for manual resolution.

---

### Requirement 10: Order Confirmation

**User Story:** As a Customer, I want to receive clear confirmation after purchasing, so that I know my order was placed successfully.

#### Acceptance Criteria

1. WHEN an Order is created, THE Storefront SHALL display an order confirmation page showing: order number, list of purchased items with quantities and prices, total paid, Delivery_Option selected, and estimated delivery timeframe if applicable.
2. WHEN an Order is created, THE Storefront SHALL send a confirmation email to the Customer's email address containing the order details within 60 seconds of Order creation.
3. THE order confirmation email SHALL include: order number, itemized list, total, Merchant store name, and Merchant contact information from Store_Config.
4. WHEN an Order is created, THE MO_Sell_Dashboard SHALL display a notification to the Merchant indicating a new order has been received.

---

### Requirement 11: Order Management

**User Story:** As a Merchant, I want to view and manage all orders from my store, so that I can fulfill orders and keep customers informed.

#### Acceptance Criteria

1. THE MO_Sell_Dashboard SHALL display all Orders for the Merchant's store in a list, sorted by creation date descending, with filters for Order status and payment status.
2. THE MO_Sell_Dashboard Order list SHALL display for each Order: order number, customer name, number of items, total amount, creation date, order status, and payment status.
3. THE MO_Sell_Dashboard SHALL allow Merchants to transition Orders through the Order_Pipeline: `paid → processing → shipped → delivered` and to mark an Order as `cancelled`.
4. WHEN a Merchant marks an Order as `shipped`, THE MO_Sell_Dashboard SHALL prompt the Merchant to optionally enter a tracking number and carrier name.
5. WHEN a Merchant marks an Order as `cancelled` from a `paid` or `processing` status, THE MO_Sell_Dashboard SHALL prompt the Merchant to confirm and specify whether a refund should be initiated via Paystack.
6. IF a Merchant confirms a refund on cancellation, THEN THE MO_Sell_Dashboard SHALL call the Paystack refund API with the original transaction reference and display the refund status to the Merchant.
7. WHEN an Order status changes, THE MO_Sell_Dashboard SHALL record the status change in an audit log field `statusHistory` on the Order document, including the new status, timestamp, and the userId of the Merchant who made the change.

---

### Requirement 12: Shipping and Delivery Configuration

**User Story:** As a Merchant, I want to configure how my products are delivered, so that I can offer delivery and pickup options to my customers.

#### Acceptance Criteria

1. THE MO_Sell_Dashboard SHALL allow Merchants to create Shipping_Zones, each with: zone name, list of applicable states or regions, flat shipping rate (in the store currency), and estimated delivery days.
2. THE MO_Sell_Dashboard SHALL allow Merchants to configure at least one pickup location with a name and address.
3. WHEN a Merchant has no Shipping_Zones configured, THE Storefront SHALL offer only pickup as a Delivery_Option at checkout.
4. WHEN a Merchant deletes a Shipping_Zone, THE Storefront SHALL remove that zone's rate from checkout immediately for all new Checkout_Sessions; existing Orders are not affected.
5. IF a Merchant attempts to save a Shipping_Zone with a negative shipping rate, THEN THE MO_Sell_Dashboard SHALL reject the input and display a validation error.

---

### Requirement 13: Busmo Integration — Automatic Data Propagation

**User Story:** As a Merchant, I want every online sale to automatically update all relevant parts of my Busmo account, so that my records are always accurate without manual entry.

#### Acceptance Criteria

1. WHEN the Integration_Bridge processes a confirmed Order, THE Integration_Bridge SHALL write to `merchants/{merchantId}/sales` using the same data structure as manually recorded sales in Busmo, including `products` array, `total`, `paymentMethod: 'online'`, `customerName`, and `createdAt`.
2. WHEN the Integration_Bridge processes a confirmed Order, THE Integration_Bridge SHALL decrement the `stock` field of each purchased Product in `merchants/{merchantId}/products` by the purchased quantity.
3. WHEN the Integration_Bridge processes a confirmed Order, THE Integration_Bridge SHALL create or update the Customer document in `merchants/{merchantId}/customers` with the Customer's name, email, phone, and increment a `totalOrders` counter and `totalSpend` amount.
4. WHEN the Integration_Bridge processes a confirmed Order, THE Integration_Bridge SHALL create a cash flow entry in `merchants/{merchantId}/cashflow` with `type: 'income'`, `amount` equal to the order total, `source: 'mo_sell'`, and `description` referencing the order number.
5. THE Integration_Bridge SHALL complete all Firestore writes for a single Order within a single atomic batch, so that partial updates do not occur.
6. WHEN inventory stock for a Product drops to or below the Product's `lowStockThreshold` after an Integration_Bridge update, THE Integration_Bridge SHALL create a notification document in `merchants/{merchantId}/notifications` with `type: 'low_stock'` and the relevant productId.

---

### Requirement 14: Store Analytics

**User Story:** As a Merchant, I want to see how my online store is performing, so that I can make informed decisions about inventory, promotions, and growth.

#### Acceptance Criteria

1. THE MO_Sell_Dashboard SHALL display a Store Analytics summary containing: total online revenue for the current month, total orders for the current month, total unique customers, and top 5 selling products by quantity sold.
2. WHEN a Customer views a Storefront page, THE Storefront SHALL record a page view event in `merchants/{merchantId}/storeAnalytics` with the page type, timestamp, and storeSlug — without collecting personally identifiable information beyond the storeSlug.
3. WHEN a Customer adds a Product to the Cart, THE Storefront SHALL record an `add_to_cart` event in `merchants/{merchantId}/storeAnalytics` with the productId and storeSlug.
4. THE MO_Sell_Dashboard SHALL calculate and display the Storefront's conversion rate as `(total completed orders / total checkout sessions initiated) × 100`, formatted to one decimal place.
5. WHEN MO is asked about store performance, THE MO_Sell_Dashboard SHALL surface the Store Analytics data in MO's response context so that MO can give accurate, up-to-date answers about revenue, top products, and order trends.

---

### Requirement 15: MO Integration Throughout the Commerce Experience

**User Story:** As a Merchant, I want MO to understand my store and proactively help me, so that I can run my online business with less effort.

#### Acceptance Criteria

1. WHEN the Store_Setup_Wizard is active, THE Store_Setup_Wizard SHALL allow the Merchant to communicate with MO using free-form text to describe their business instead of filling in structured form fields.
2. WHEN the MO_Sell_Dashboard detects that a Merchant has 0 products in the Catalog, THE MO_Sell_Dashboard SHALL display a contextual MO prompt suggesting the Merchant add their first product and offering to auto-generate product descriptions from inventory names.
3. WHEN the MO_Sell_Dashboard detects that a Merchant's store has been `active` for 7 days with 0 orders, THE MO_Sell_Dashboard SHALL surface a MO recommendation card with at least one actionable suggestion to improve discoverability or conversion.
4. WHEN a Merchant asks MO a question about MO Sell (e.g., "how many orders today?", "what's my best-selling product?"), THE MO_Sell_Dashboard SHALL include Store_Analytics data and recent Order data in MO's context so MO can answer accurately.
5. WHEN MO generates a store setup suggestion (color palette, layout, collections), THE Store_Setup_Wizard SHALL present the suggestion as a conversational message from MO, not a generic form field.

---

### Requirement 17: Custom Domain for Storefront

**User Story:** As a Merchant, I want to connect my own domain name to my MO Sell storefront, so that customers visit my store at a branded URL instead of a busmo.io subdomain.

#### Acceptance Criteria

1. THE MO_Sell_Dashboard SHALL allow a Merchant to enter a custom domain name (e.g., `shop.mybrand.com`) in the Store Settings panel and save it to Store_Config as `customDomain`.
2. IF a Merchant submits a `customDomain` value that is not a valid fully-qualified domain name, THEN THE MO_Sell_Dashboard SHALL reject the input and display a validation error specifying the expected format.
3. WHEN a Merchant saves a custom domain, THE MO_Sell_Dashboard SHALL display the required DNS configuration instructions: a CNAME record pointing the domain to `store.busmo.io`, and the expected propagation timeframe.
4. THE MO_Sell_Dashboard SHALL provide a "Verify Domain" action that checks whether the CNAME record for the Merchant's custom domain resolves to `store.busmo.io` and displays a success or failure status to the Merchant.
5. THE Store_Config SHALL store a `customDomainStatus` field with values `pending` | `verified` | `failed` to track the verification state of the custom domain.
6. WHEN `customDomainStatus` is `verified`, THE Storefront SHALL be accessible at both `busmo.io/store/{storeSlug}` and the custom domain simultaneously; the custom domain SHALL take precedence for canonical URLs and Open Graph meta tags.
7. WHEN `customDomainStatus` is `pending` or `failed`, THE Storefront SHALL only be accessible at `busmo.io/store/{storeSlug}`; the custom domain SHALL NOT serve storefront content.
8. IF a Merchant removes their custom domain, THEN THE MO_Sell_Dashboard SHALL clear `customDomain` and set `customDomainStatus` back to `pending`, and the Storefront SHALL revert to serving only from `busmo.io/store/{storeSlug}`.
9. THE order confirmation emails sent to Customers SHALL use the verified custom domain in all storefront links when `customDomainStatus` is `verified`.
10. THE MO_Sell_Dashboard SHALL display a persistent warning banner when a custom domain has been saved but `customDomainStatus` is `failed`, explaining that the domain is not yet serving traffic and linking to the DNS setup instructions.

---

### Requirement 18: In-App Domain Purchase

**User Story:** As a Merchant, I want to search for and purchase a custom domain name directly inside Busmo, so that I can connect a professional domain to my storefront without leaving the platform or touching DNS settings manually.

#### Acceptance Criteria

1. THE MO_Sell_Dashboard SHALL provide a domain search input in the Store Settings panel that allows a Merchant to enter a desired domain name and retrieve availability and pricing from the domain registrar API.
2. WHEN a Merchant submits a domain search query, THE MO_Sell_Dashboard SHALL display whether the exact domain is available and suggest up to 5 alternative TLD variants (e.g. `.com`, `.store`, `.shop`, `.co`, `.ng`) with their respective prices.
3. WHEN a Merchant selects an available domain to purchase, THE MO_Sell_Dashboard SHALL display a purchase confirmation screen showing the domain name, registration period (1 year), annual renewal price, and the total amount to be charged.
4. WHEN a Merchant confirms a domain purchase, THE MO_Sell_Dashboard SHALL initiate a Paystack payment for the domain registration cost plus a Busmo service fee, and SHALL NOT proceed to domain registration until payment is verified server-side.
5. WHEN Paystack confirms payment for a domain purchase, THE MO_Sell_Dashboard SHALL automatically register the domain via the GoDaddy API v3 and set Busmo as the administrative contact.
6. WHEN domain registration is confirmed by the GoDaddy API, THE MO_Sell_Dashboard SHALL automatically create a CNAME DNS record on the purchased domain pointing to `store.busmo.io`, without requiring any manual DNS action from the Merchant.
7. WHEN the CNAME record has been created, THE MO_Sell_Dashboard SHALL automatically run domain verification and, on success, set `customDomainStatus` to `verified` and activate the custom domain for the Merchant's storefront.
8. THE MO_Sell_Dashboard SHALL display real-time status updates to the Merchant throughout the purchase flow: `Searching` → `Payment Processing` → `Registering Domain` → `Configuring DNS` → `Verifying` → `Active`.
9. IF any step in the automated flow fails after payment has been confirmed, THEN THE MO_Sell_Dashboard SHALL retain the payment record, log the failure, and display a support prompt to the Merchant with the transaction reference so the issue can be resolved without requiring re-payment.
10. THE MO_Sell_Dashboard SHALL store a `domainPurchaseRecord` on the Store_Config containing: domain name, GoDaddy registration ID, Paystack payment reference, purchase date, renewal date, and renewal price, so the Merchant can track their domain subscription.
11. THE MO_Sell_Dashboard SHALL display a renewal reminder banner when a Merchant's purchased domain is within 30 days of its renewal date.
12. IF a domain search query returns no available results, THEN THE MO_Sell_Dashboard SHALL display a "no domains available" message and allow the Merchant to try a different name or connect an existing domain manually.

---

### Requirement 16: Flexible Product Architecture for Future Expansion

**User Story:** As Busmo's engineering team, we want the Product and Order data models to support future product types without requiring a schema migration, so that MO Sell can expand to digital products, services, appointments, memberships, and subscriptions.

#### Acceptance Criteria

1. THE Product document schema SHALL include a `productType` field that accepts `physical`, `digital`, or `service` as initial values, with the schema designed to accommodate additional types via configuration without code changes to shared components.
2. THE Order line item schema SHALL store `productType` alongside each line item so that fulfillment logic can branch by type without re-querying product documents.
3. THE Integration_Bridge SHALL check `productType` before applying stock decrements: physical products SHALL have stock decremented; digital and service products SHALL NOT have stock decremented.
4. THE Store_Config document SHALL include an `enabledProductTypes` array field so that future product types can be feature-flagged at the store level.
5. WHEN a new `productType` value is added to `enabledProductTypes`, THE MO_Sell_Dashboard SHALL render the appropriate type-specific form fields for that product type without requiring a full redeployment of shared storefront components.

