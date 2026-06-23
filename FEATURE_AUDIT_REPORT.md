# BUSMO FEATURE AUDIT REPORT
**Generated:** 2025-06-23
**Scope:** Complete audit of all features, plans, permissions, and navigation

---

## EXECUTIVE SUMMARY

This report provides a comprehensive audit of Busmo's current feature ecosystem, subscription plans, business categories, and permission systems. The audit identified **44+ implemented pages**, **3 subscription plans**, **15 business categories**, and **multiple permission systems** that need consolidation.

### Key Findings:
- ✅ **3 production plans exist**: Starter, Standard, Pro (no Free plan)
- ✅ **15 business categories defined** with feature mappings
- ✅ **44+ fully implemented pages** with complete functionality
- ⚠️ **6 features in navigation but missing dedicated pages**
- ⚠️ **Multiple scattered permission systems** need consolidation
- ⚠️ **Feature restrictions hardcoded** in multiple files
- ⚠️ **Settings page has basic feature toggles** but not fully integrated

---

## 1. EXISTING SUBSCRIPTION PLANS

### Production Plans (from `scripts/createPlans.js` and `src/app/pricing/page.tsx`)

| Plan ID | Name | Monthly Price | Yearly Price | Paystack Monthly Code | Paystack Yearly Code |
|---------|------|---------------|--------------|---------------------|---------------------|
| `starter` | Starter | ₦5,000 | ₦50,000 | PLN_79p5yysj5q5z1qz | PLN_k9c24tyc4g5x8v9 |
| `standard` | Standard | ₦10,000 | ₦100,000 | PLN_x5vbs3rigk8g9q2 | PLN_0z6g4j3j6a59v04 |
| `pro` | Pro | ₦25,000 | ₦250,000 | PLN_p0j2j9y6f7a6g9v | PLN_2s4q2y0g1m1c8s7 |

### Plan Features (from pricing page)

**Starter Plan:**
- Sales & Inventory Tracking
- Expense Management
- Basic Reports (Profit/Loss)
- Ask MO AI (10 msgs/day, 2,500 credits)
- Up to 50 Products
- Staff Management (1 staff)
- Statement/Transaction History
- Business Services Directory

**Standard Plan:**
- Everything in Starter
- Cash Flow Tracking
- Money Control & Operations
- Credit Tracking (Debtors/Creditors)
- Ask MO AI (50 msgs/day, 10,000 credits)
- Up to 500 Products
- Staff Management (up to 10 staff)
- Multi-branch Support (up to 3 branches)
- Advanced Analytics & Reports
- Supplier Management
- Invoice Verification

**Pro Plan:**
- Everything in Standard
- Unlimited Products
- Unlimited Staff
- Unlimited Branches
- Bank Accounts Integration
- Bank Reconciliation
- Ask MO AI (Unlimited messages & credits)
- Audit Trail & Activity Logs
- Staff Activity Tracking
- Priority Support
- Access Capital & Funding

---

## 2. BUSINESS CATEGORIES

### Defined Categories (from `src/app/welcome/signup/page.tsx`)

1. **Retail Shop** - General retail operations
2. **Restaurant** - Food service with menu management
3. **Grocery Store** - Food retail with expiry tracking
4. **Fashion** - Clothing with variants and sizes
5. **Electronics** - Electronics retail
6. **Manufacturing** - Production and raw materials
7. **Services** - Service-based businesses
8. **Pharmacy** - Medical with expiry/batch tracking
9. **Supermarket** - Large retail with multi-branch
10. **Cafe** - Coffee shop with menu/ingredients
11. **Wholesale** - Bulk distribution
12. **Distributor** - Distribution network
13. **Healthcare** - Medical services
14. **Education** - Educational institutions
15. **Other** - Catch-all for other types

### Category Feature Mappings (from signup page)

Each category has predefined feature sets. Example mappings:

**Retail:** Sales Recording, Inventory Tracking, Staff Management, Cash Flow Analysis, Credit Tracking, Expense Management, Customer Management, Supplier Management, Profit/Loss Reports, Business Analytics, Ask MO AI Assistant

**Restaurant:** Sales Recording, Inventory Tracking, Staff Management, Cash Flow Analysis, Menu Management, Ingredient Tracking, Expiry Alerts, Expense Management, Customer Management, Supplier Management, Profit/Loss Reports, Business Analytics, Ask MO AI Assistant

**Wholesale:** Sales Recording, Inventory Tracking, Staff Management, Cash Flow Analysis, Credit Tracking, Expense Management, Customer Management, Supplier Management, Profit/Loss Reports, Business Analytics, Ask MO AI Assistant, Multi-branch Support

---

## 3. IMPLEMENTED FEATURES & PAGES

### Fully Implemented Features (44+ pages)

| Feature | Page File | Route | Status | Notes |
|---------|-----------|-------|--------|-------|
| Home | HomePage.tsx | /owner/dashboard/home | ✅ Complete | Dashboard overview |
| Record Sale | RecordSalePage.tsx | /owner/dashboard/sale | ✅ Complete | Full POS functionality |
| Inventory | InventoryPage.tsx | /owner/dashboard/inventory | ✅ Complete | Stock management |
| Add Product | Addproductpage.tsx | /owner/dashboard/add-product | ✅ Complete | Product creation |
| Add Expense | Addexpensepage.tsx | /owner/dashboard/add-expense | ✅ Complete | Expense tracking |
| Cashflow | Cashflowpage.tsx | /owner/dashboard/cashflow | ✅ Complete | Cash flow analysis |
| Statement | Statementpage.tsx | /owner/dashboard/statement | ✅ Complete | Transaction history |
| Reports | ReportsPage.tsx | /owner/dashboard/reports | ✅ Complete | Business analytics |
| Bank Reconciliation | BankReconciliationPage.tsx | /owner/dashboard/bank-reconciliation | ✅ Complete | Bank matching |
| Bank Statement Import | BankStatementImportPage.tsx | /owner/dashboard/bank-statement-import | ✅ Complete | CSV import |
| Money Control | MoneyControlPage.tsx | /owner/dashboard/money-control | ✅ Complete | Payment tracking |
| Credit Tracking | CreditTrackingPage.tsx | /owner/dashboard/credit-tracking | ✅ Complete | Debt management |
| Customer Credit | CustomerCreditPage.tsx | /owner/dashboard/customer-credit | ✅ Complete | Customer debt |
| Supplier Credit | SupplierCreditPage.tsx | /owner/dashboard/supplier-credit | ✅ Complete | Supplier debt |
| Warehouse | WarehousePage.tsx | /owner/dashboard/warehouse | ✅ Complete | Multi-location stock |
| Stock Transfers | StockTransfersPage.tsx | /owner/dashboard/stock-transfers | ✅ Complete | Stock movement |
| Suppliers | SuppliersPage.tsx | /owner/dashboard/suppliers | ✅ Complete | Supplier management |
| Receive Stock | ReceiveStockPage.tsx | /owner/dashboard/receive-stock | ✅ Complete | Stock receiving |
| Restock | RestockPage.tsx | /owner/dashboard/restock | ✅ Complete | Restocking |
| Branches | BranchesPage.tsx | /owner/dashboard/branches | ✅ Complete | Multi-branch mgmt |
| Staff | StaffPage.tsx | /owner/dashboard/staff | ✅ Complete | Staff management |
| Add Staff | AddStaffPage.tsx | /owner/dashboard/add-staff | ✅ Complete | Staff creation |
| Edit Staff | EditStaffPage.tsx | /owner/dashboard/edit-staff/[id] | ✅ Complete | Staff editing |
| Remove Staff | RemoveStaffPage.tsx | /owner/dashboard/remove-staff/[id] | ✅ Complete | Staff removal |
| Services | ServicesPage.tsx | /owner/dashboard/services | ✅ Complete | Business services |
| Settings | SettingsPage.tsx | /owner/dashboard/settings | ✅ Complete | Settings management |
| Ask MO (Desktop) | InlineAIChat.tsx | /owner/dashboard/mo | ✅ Complete | AI assistant |
| Ask MO (Mobile) | MobileAskMOPage.tsx | /owner/dashboard/mo-mobile | ✅ Complete | Mobile AI |
| Capital | CapitalPage.tsx | /owner/dashboard/capital | ✅ Complete | Funding access |
| Referrals | ReferralsPage.tsx | /owner/dashboard/referrals | ✅ Complete | Referral program |
| Audit Trail | AuditTrailPage.tsx | /owner/dashboard/audit-trail | ✅ Complete | Activity logs |
| Staff Activity | StaffActivityPage.tsx | /owner/dashboard/staff-activity | ✅ Complete | Staff tracking |
| Staff Accountability | StaffAccountabilityPage.tsx | /owner/dashboard/staff-accountability | ✅ Complete | Staff performance |
| Money Leakage | MoneyLeakagePage.tsx | /owner/dashboard/money-leakage | ✅ Complete | Loss detection |
| Payment Traceability | PaymentTraceabilityPage.tsx | /owner/dashboard/payment-traceability | ✅ Complete | Payment tracking |
| Cash Reconciliation | CashReconciliationPage.tsx | /owner/dashboard/cash-reconciliation | ✅ Complete | Cash matching |
| Invoice Verification | InvoiceVerificationPage.tsx | /owner/dashboard/invoice-verification | ✅ Complete | Invoice checking |
| Bank Accounts | BankAccountsPage.tsx | /owner/dashboard/bank-accounts | ✅ Complete | Bank account mgmt |

### Features in Navigation But Missing Dedicated Pages

| Feature | Nav Item ID | Status | Issue | Recommendation |
|---------|-------------|--------|-------|----------------|
| Menu Management | menu-management | ⚠️ No Page | In navItems.ts but no dedicated page component | Create MenuManagementPage.tsx |
| Ingredient Tracking | ingredient-tracking | ⚠️ No Page | In navItems.ts but no dedicated page component | Create IngredientTrackingPage.tsx |
| Expiry Alerts | expiry-alerts | ⚠️ No Page | In navItems.ts but no dedicated page component | Create ExpiryAlertsPage.tsx |
| Production Tracking | production-tracking | ⚠️ No Page | In navItems.ts but no dedicated page component | Create ProductionTrackingPage.tsx |
| E-commerce Storefront | ecommerce-storefront | ⚠️ No Page | In navItems.ts but no dedicated page component | Create EcommercePage.tsx |
| Payroll | payroll | ⚠️ No Page | In navItems.ts but no dedicated page component | Create PayrollPage.tsx |
| Customer Management | customer-management | ⚠️ No Page | In navItems.ts but no dedicated page component | Create CustomerManagementPage.tsx |

### Hidden/Inaccessible Features

| Feature | Location | Issue | Recommendation |
|---------|----------|-------|----------------|
| Email Campaigns | navItems.ts (commented out) | Removed from navigation | Decide whether to implement or remove |
| My Market | navItems.ts (commented out) | Removed from navigation | Decide whether to implement or remove |
| BusmoPay | navItems.ts (commented out) | Removed from navigation | Decide whether to implement or remove |
| BusmoGo | navItems.ts (commented out) | Removed from navigation | Decide whether to implement or remove |

---

## 4. PERMISSION & ACCESS LOGIC

### Current Permission Systems

**1. Feature Restrictions (`src/lib/featureRestrictions.ts`)**
- Pro-only features: bankAccounts, auditTrail, staffActivity, multiLocation, productionTracking, payrollManagement, ecommerceStorefront
- Standard-or-Pro features: cashFlow, creditTracking, menuManagement, ingredientTracking, multiBranchSupport, expiryAlerts
- Credit layer eligibility based on business type
- Trial mode feature access based on selectedFeatures

**2. Navigation Requirements (`src/app/owner/dashboard/navItems.ts`)**
- NAV_ITEM_REQUIREMENTS maps nav items to:
  - requiredFeatures (array of feature names)
  - requiredCategories (array of category IDs)
  - excludedCategories (array of category IDs)
  - requiredPlan (starter | standard | pro)

**3. Staff Permissions (`src/lib/staffPermissions.ts`)**
- Role-based permissions (cashier, sales_associate, inventory_manager, etc.)
- Permission categories: sales, inventory, reporting, management, financial
- Business type-specific recommended roles and critical permissions

**4. Sidebar Visibility Logic (`src/app/owner/dashboard/Sidebar.tsx`)**
- Filters nav items based on:
  - User's plan (with trial bypass)
  - User's business category
  - Selected features (from onboarding)
  - Hardcoded plan hierarchy

### Issues Identified

1. **Scattered Logic**: Permission checks in 4+ different files
2. **Hardcoded Values**: Plan hierarchy, feature lists hardcoded
3. **Inconsistent Naming**: Feature names differ between systems
4. **No Central Registry**: No single source of truth for features
5. **Trial Logic Complexity**: Special trial bypass logic scattered

---

## 5. BACKEND SERVICES & API ENDPOINTS

### Firebase Functions (`functions/src/index.ts`)

| Function | Purpose | Status |
|----------|---------|--------|
| askMo | AI-powered business intelligence | ✅ Active |
| initializePayment | Paystack payment initialization | ✅ Active |
| verifyPayment | Paystack payment verification | ✅ Active |
| paystackWebhook | Paystack webhook handler | ✅ Active |

### API Routes (`src/app/api/`)

| Route | Purpose | Status |
|-------|---------|--------|
| /api/ask-mo | Ask MO frontend endpoint | ✅ Active |
| /api/staff/create | Staff creation endpoint | ✅ Active |

### Backend Data Models (`docs/backend.json`)

**Key Entities:**
- Business, User, Admin, Product, Sale, Expense, Transaction
- InventoryAdjustment, AiQuestion, StaffPermission, Invitation
- MarketCategory, MarketBanner, SupportAgent, ChatConversation
- PaymentTransaction, PaymentIntent, Plan, Subscription
- BusinessVerification, Order, DeliveryAgent, Announcement
- Service, ServiceRequest, EmailBranding, EmailTemplate, EmailLog

---

## 6. NAVIGATION STRUCTURE

### Current Navigation (`src/app/owner/dashboard/navItems.ts`)

**Main Section:**
- Home, Record Sale, Inventory, Add Product, Add Expense
- Cashflow, Statement, Reports
- Bank Reconciliation, Money Control, Credit Tracking
- Menu Management, Ingredients, Expiry Alerts
- Production, E-commerce

**Growth Section:**
- Access Capital, Referrals

**Account Section:**
- Ask MO, Business Services, Staff
- Suppliers, Customers, Invoice Verification
- Branches, Payroll, Settings

### Mobile Navigation (`MOBILE_NAV_ITEMS`)

- home, sale, cashflow, mo, staff

---

## 7. SETTINGS PAGE ANALYSIS

### Current Settings Features (`src/app/owner/dashboard/SettingsPage.tsx`)

**Sections:**
1. Language (10 languages)
2. Currency (60+ currencies)
3. Appearance (theme)
4. Account & Plan
5. Business Profile
6. Receipt Customization
7. Notifications
8. Privacy
9. Features (basic toggles)

**Feature Toggles:**
- Inventory Management
- Sales Recording
- Expense Tracking
- Supplier Management
- Warehouse Management
- Staff Management
- Ask MO AI Assistant
- Advanced Analytics

**Issues:**
- Feature list hardcoded in component
- Not connected to central feature registry
- No category-based filtering
- No plan-based filtering
- No upgrade prompts

---

## 8. ASK MO INTEGRATION

### Current Implementation

**Backend (`functions/src/index.ts`):**
- Uses Google Generative AI (Gemini 1.5 Flash)
- Fetches business context from Firestore
- Builds system prompt with business data
- Handles conversation history
- Retry logic with exponential backoff

**Business Context Retrieved:**
- Business name and category
- Sales performance (30 days + today)
- Inventory status (total, out of stock, low stock)
- Expenses (30 days)
- Staff count

**Frontend:**
- MobileAskMOPage.tsx (mobile)
- InlineAIChat.tsx (desktop)
- useAskMO.ts hook

**Issues:**
- Not feature-aware (doesn't know which modules are enabled)
- Not category-adaptive (same prompts for all businesses)
- Doesn't respect plan limitations
- No tool filtering based on enabled features

---

## 9. MISSING CONFIGURATIONS

### Feature Registry
- ❌ No centralized feature registry exists
- ❌ No feature metadata (descriptions, categories, dependencies)
- ❌ No feature-to-plan mappings
- ❌ No feature-to-category mappings

### Category-Based Bundles
- ⚠️ Category features defined in signup page but not used elsewhere
- ❌ No category-based navigation filtering
- ❌ No category-based feature recommendations

### Plan Feature Mappings
- ⚠️ Plan features defined in pricing page but not enforced systematically
- ❌ No plan-based feature access matrix
- ❌ No upgrade prompts for locked features

### Diagnostics
- ❌ No admin diagnostics page
- ❌ No feature visibility debugging tools
- ❌ No permission conflict detection

---

## 10. RECOMMENDATIONS

### Immediate Actions (Phase 1)

1. **Create Central Feature Registry**
   - Define all features with metadata
   - Map features to plans
   - Map features to categories
   - Define feature dependencies

2. **Consolidate Permission Logic**
   - Move all permission checks to single module
   - Use feature registry as source of truth
   - Remove hardcoded plan hierarchies

3. **Implement Missing Pages**
   - Menu Management
   - Ingredient Tracking
   - Expiry Alerts
   - Production Tracking
   - E-commerce Storefront
   - Payroll
   - Customer Management

### Medium-Term Actions (Phase 2-4)

4. **Transform Settings Page**
   - Connect to feature registry
   - Show enabled/disabled/locked features
   - Add upgrade prompts
   - Add category-based filtering

5. **Implement Dynamic Navigation**
   - Generate nav from feature registry
   - Filter by category, plan, enabled features
   - Auto-update on changes

6. **Make Ask MO Feature-Aware**
   - Pass enabled features to backend
   - Filter tools based on enabled modules
   - Adapt prompts to business category

### Long-Term Actions (Phase 5-9)

7. **Create Admin Diagnostics**
   - Show all feature states
   - Debug permission issues
   - Validate registry consistency

8. **Validate Implementation**
   - Test all feature access paths
   - Verify plan enforcement
   - Check category filtering

---

## 11. FEATURE REGISTRY PROPOSAL

### Proposed Structure

```typescript
interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: FeatureCategory;
  pageId?: PageId;
  requiredPlans: Plan[];
  excludedPlans?: Plan[];
  requiredCategories?: BusinessCategory[];
  excludedCategories?: BusinessCategory[];
  dependencies?: string[];
  isOptional: boolean;
  isProOnly: boolean;
  isStandardOrPro: boolean;
}

type FeatureCategory = 
  | 'inventory' 
  | 'sales' 
  | 'analytics' 
  | 'ai' 
  | 'operations' 
  | 'financial' 
  | 'hr' 
  | 'restaurant' 
  | 'manufacturing';

type Plan = 'starter' | 'standard' | 'pro';

type BusinessCategory = 
  | 'retail' 
  | 'restaurant' 
  | 'grocery' 
  | 'fashion' 
  | 'electronics' 
  | 'manufacturing' 
  | 'services' 
  | 'pharmacy' 
  | 'supermarket' 
  | 'cafe' 
  | 'wholesale' 
  | 'distributor' 
  | 'healthcare' 
  | 'education' 
  | 'other';
```

### Proposed Features to Register

**Core Features:**
- sales-recording
- inventory-tracking
- expense-management
- cashflow-tracking
- reports-analytics
- statement-history

**Operations Features:**
- supplier-management
- warehouse-management
- stock-transfers
- multi-branch-support

**Financial Features:**
- credit-tracking
- money-control
- bank-accounts
- bank-reconciliation
- invoice-verification

**Restaurant Features:**
- menu-management
- ingredient-tracking
- recipe-costing

**Manufacturing Features:**
- production-tracking
- bill-of-materials
- raw-materials

**HR Features:**
- staff-management
- payroll-management
- staff-activity-tracking

**Advanced Features:**
- audit-trail
- expiry-alerts
- ecommerce-storefront
- customer-management

**AI Features:**
- ask-mo-ai-assistant

---

## 12. ACCESS CONTROL FORMULA

### Proposed Final Logic

```typescript
canAccessFeature = 
  featureAllowedForCategory(businessCategory, feature) &&
  featureAllowedForPlan(currentPlan, feature) &&
  featureEnabled(userSettings, feature) &&
  featureDependenciesMet(enabledFeatures, feature.dependencies)
```

### Implementation Layers

1. **Category Layer**: Is this feature relevant to my business type?
2. **Plan Layer**: Does my subscription plan include this feature?
3. **User Layer**: Have I enabled this feature in settings?
4. **Dependency Layer**: Are required features also enabled?

---

## 13. NEXT STEPS

### Phase 1: Feature Registry (Priority: HIGH)
1. Create `src/lib/featureRegistry.ts`
2. Define all 44+ features with metadata
3. Map features to plans and categories
4. Create helper functions for access checks

### Phase 2: Permission Consolidation (Priority: HIGH)
1. Refactor `featureRestrictions.ts` to use registry
2. Update `navItems.ts` to use registry
3. Update `Sidebar.tsx` to use registry
4. Remove hardcoded permission logic

### Phase 3: Missing Pages (Priority: MEDIUM)
1. Create 6 missing page components
2. Connect to existing backend
3. Add to navigation
4. Test functionality

### Phase 4: Settings Transformation (Priority: MEDIUM)
1. Update SettingsPage.tsx to use registry
2. Show feature states (enabled/disabled/locked)
3. Add upgrade prompts
4. Add category filtering

### Phase 5: Dynamic Navigation (Priority: MEDIUM)
1. Generate navigation from registry
2. Filter by category, plan, enabled features
3. Auto-update on changes
4. Test all navigation paths

### Phase 6: Ask MO Awareness (Priority: MEDIUM)
1. Pass enabled features to backend
2. Filter tools based on enabled modules
3. Adapt prompts to category
4. Test with different business types

### Phase 7: Admin Diagnostics (Priority: LOW)
1. Create admin diagnostics page
2. Show all feature states
3. Debug permission issues
4. Validate registry consistency

### Phase 8: Validation (Priority: HIGH)
1. Test all feature access paths
2. Verify plan enforcement
3. Check category filtering
4. Test upgrade flows

---

## 14. RISK ASSESSMENT

### High Risks
- **Breaking Changes**: Refactoring permissions could break existing access
- **Data Migration**: User feature preferences may need migration
- **Performance**: Registry lookups could impact performance if not optimized

### Mitigation Strategies
- Implement gradual rollout with feature flags
- Maintain backward compatibility during transition
- Add extensive testing before deployment
- Monitor performance metrics

---

## 15. SUCCESS METRICS

### Quantitative
- All 44+ pages accessible through navigation
- Zero hardcoded permission checks
- 100% feature coverage in registry
- <100ms permission check latency

### Qualitative
- Clear upgrade paths for users
- Intuitive feature discovery
- Consistent access control
- Easy debugging for admins

---

## CONCLUSION

Busmo has a solid foundation with 44+ implemented features, 3 production plans, and 15 business categories. The main issues are:

1. **Scattered permission logic** across multiple files
2. **Missing centralized feature registry** 
3. **6 features in navigation but without pages**
4. **Settings page not connected to feature system**
5. **Ask MO not feature-aware**

The recommended approach is to implement a centralized Feature Registry that serves as the single source of truth for all feature access logic, then gradually refactor existing systems to use it. This will provide a modular, maintainable foundation for future feature development.

**Estimated Implementation Time:** 2-3 weeks for full implementation across all phases.
