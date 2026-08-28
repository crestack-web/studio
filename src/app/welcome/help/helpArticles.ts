/**
 * Help Center articles — written against the live Busmo product surface:
 * owner nav (navItems.ts), staff permissions (staffPermissions.ts),
 * and key dashboard pages (Record Sale, Money Control, Staff, Inventory, etc.).
 */

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  popular?: boolean;
  actionLink?: string;
  actionLabel?: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  // ── Getting Started ─────────────────────────────────────────────
  {
    id: 'gs-1',
    title: 'Getting started with Busmo',
    category: 'Getting Started',
    excerpt: 'Sign up, complete business setup, and use the owner Home dashboard.',
    content:
      'Create an account from /welcome/signup (or Start with Busmo on the marketing site). After login you land on the owner dashboard at /owner/dashboard.\n\n' +
      '1. Open Settings and set business name, category (retail, restaurant, wholesale, etc.), currency, and logo.\n' +
      '2. Add products under Add Product (or dishes under Menu Management for restaurants).\n' +
      '3. Record a first sale from Record Sale.\n' +
      '4. Invite staff from Staff if people will sell or clock in.\n\n' +
      'Home shows sales, cash, and stock snapshots. Feature menus depend on your plan and business category — not every sidebar item appears for every business.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Open owner dashboard',
  },
  {
    id: 'gs-2',
    title: 'Plans, trial, and which features you see',
    category: 'Getting Started',
    excerpt: 'Sidebar items depend on plan (starter / standard / pro) and business category.',
    content:
      'Busmo gates some tools by plan and category (see product nav requirements):\n\n' +
      '• Standard examples: Bank Reconciliation, Money Control, Credit Tracking, Document Templates, Menu Management, Ingredients, Expiry Alerts.\n' +
      '• Pro examples: Branches, Production Tracking, Payroll.\n' +
      '• Category examples: Menu & Ingredients for restaurant/cafe; Production for manufacturing; Warehouse & Stock Transfers for retail/wholesale/distributor.\n\n' +
      'If a page is missing, check Settings → plan and business category, or upgrade from pricing. Trial is available from the marketing site; TrialGuard limits access when a trial ends.',
    popular: false,
    actionLink: '/pricing',
    actionLabel: 'View pricing',
  },
  {
    id: 'gs-3',
    title: 'Owner vs staff portals',
    category: 'Getting Started',
    excerpt: 'Owners use /owner/dashboard; staff use /staff after invite.',
    content:
      'Owners control the full business: sales, stock, cash, staff, MO, reports.\n\n' +
      'Staff sign in at the staff portal (/staff). They only see tools the owner enabled (Record sales, Inventory view, History, Attendance, Messages, Customers, Credit, Returns, Receive stock, Expenses, Shift close, Expiry, Production, Menu, Transfers).\n\n' +
      'Staff data is always scoped to the business that invited them. They cannot change plan settings or full owner Money Control configuration.',
    popular: true,
  },

  // ── Sales ───────────────────────────────────────────────────────
  {
    id: 'sale-1',
    title: 'Record a sale (owner)',
    category: 'Sales',
    excerpt: 'Use Record Sale: cart, payment methods, stock deduction, receipts.',
    content:
      'From the owner sidebar open Record Sale.\n\n' +
      '1. Tap products (or menu dishes) to build a cart; adjust quantities.\n' +
      '2. Choose payment: cash, transfer/POS, or split payments where available.\n' +
      '3. Optionally attach a customer (including credit/pay-later when Credit is enabled).\n' +
      '4. Complete the sale — stock decreases, revenue feeds Cashflow and Statement.\n' +
      '5. Print or share a receipt via Receipt Generator / templates.\n\n' +
      'Sales appear in History-style views and staff History when permissions allow. Offline recording is supported; data syncs when the connection returns.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Go to dashboard',
  },
  {
    id: 'sale-2',
    title: 'Staff recording sales',
    category: 'Sales',
    excerpt: 'Staff use Record Sale when the sale permission is on.',
    content:
      'Staff with the “Record sales” permission open Sale from the staff sidebar or bottom nav.\n\n' +
      'They pick products, set payment (cash / transfer / split), and submit. Sales are stored on the linked owner business only.\n\n' +
      'Staff cannot change product prices in catalog setup; they sell from the products the owner added. After the sale, stock levels update for Inventory viewers.',
    popular: true,
    actionLink: '/staff',
    actionLabel: 'Staff login',
  },
  {
    id: 'sale-3',
    title: 'Credit / pay-later sales',
    category: 'Sales',
    excerpt: 'Issue credit sales and track balances under Credit Tracking.',
    content:
      'When Credit Tracking is available on your plan:\n\n' +
      '• Record Sale can attach a customer and mark payment as credit.\n' +
      '• Owner Credit Tracking shows limits, balances, and payments.\n' +
      '• Staff with Credit permission can view outstanding balances to assist at the counter.\n\n' +
      'Always set a credit limit on the customer before large pay-later sales.',
    popular: false,
  },

  // ── Inventory ───────────────────────────────────────────────────
  {
    id: 'inv-1',
    title: 'Add products and view inventory',
    category: 'Inventory',
    excerpt: 'Add Product sets name, price, cost, stock, reorder level; Inventory lists stock.',
    content:
      'Owner → Add Product: name, SKU, selling price, cost, opening stock, reorder/low-stock level, category, image, unit.\n\n' +
      'Owner → Inventory: search stock, see low stock, open product detail, adjust quantities.\n\n' +
      'Sales reduce stock. Restock / Receive Stock increases stock when goods arrive. Warehouse and Stock Transfers apply when your category supports multi-location.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Open dashboard',
  },
  {
    id: 'inv-2',
    title: 'Receive stock, restock, warehouse, transfers',
    category: 'Inventory',
    excerpt: 'Inbound goods and moves between store, warehouse, or branch.',
    content:
      'Receive Stock (owner) logs inbound deliveries and can apply quantities to inventory.\n' +
      'Staff with Receive permission can submit receipt notes for the owner to confirm.\n\n' +
      'Warehouse (retail/wholesale/distributor) manages location stock.\n' +
      'Stock Transfers moves quantity between locations; staff can request transfers when Transfers permission is on.\n\n' +
      'Restock is the quick path to top up product quantities from Inventory workflows.',
    popular: false,
  },
  {
    id: 'inv-3',
    title: 'Menu, ingredients, and portion quantity',
    category: 'Inventory',
    excerpt: 'Restaurants: Menu Management with unit + portion stock; staff Menu shows live counts.',
    content:
      'For restaurant/cafe businesses (Standard+):\n\n' +
      '• Menu Management: add dishes with price, category, portion quantity, unit (e.g. portion, plate), and low-stock threshold.\n' +
      '• Ingredients: track kitchen inputs separately from sellable dishes.\n' +
      '• Staff Menu / floor: shows live available portions so wait staff know what to sell.\n\n' +
      'Record Sale still processes the order; keep portion quantities updated after prep or service.',
    popular: true,
  },
  {
    id: 'inv-4',
    title: 'Expiry alerts and production',
    category: 'Inventory',
    excerpt: 'Near-expiry lists for grocery/pharmacy/food; production runs for manufacturing.',
    content:
      'Expiry Alerts (Standard+, relevant categories) highlight items nearing expiry so you can discount or pull stock.\n' +
      'Staff with Expiry permission can review product lists and flag issues via Messages.\n\n' +
      'Production (Pro, manufacturing): log finished goods from production runs. Staff Production permission can log runs for owner review.',
    popular: false,
  },

  // ── Finance / Money ─────────────────────────────────────────────
  {
    id: 'fin-1',
    title: 'Add expenses and read Cashflow',
    category: 'Finance',
    excerpt: 'Log spends; Cashflow shows money in vs out.',
    content:
      'Owner → Add Expense: category, amount, payment method, note/receipt.\n' +
      'Staff with Expenses permission can log petty cash-style expenses for the business.\n\n' +
      'Cashflow aggregates sales inflows, expense outflows, and related money movements so you see whether cash is building or draining — not just revenue.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Open dashboard',
  },
  {
    id: 'fin-2',
    title: 'Statement and Reports',
    category: 'Finance',
    excerpt: 'Statement connects sales, costs, and expenses; Reports summarize performance.',
    content:
      'Statement is where Busmo turns activity into profit context: sales revenue, cost of goods (from product costs), and expenses.\n\n' +
      'Reports provide analytics views (profit/loss style summaries and business metrics depending on plan). Use them after you have steady sales and accurate product costs — wrong cost prices make margins wrong.',
    popular: false,
  },
  {
    id: 'fin-3',
    title: 'Money Control and cash reconciliation',
    category: 'Finance',
    excerpt: 'Compare expected collections to cash handled; review staff shift closes.',
    content:
      'Money Control (Standard+) links sales activity to money movement so owners can spot mismatches — not a guarantee of zero loss, but clearer accountability.\n\n' +
      'Cash reconciliation stores expected vs actual cash, variance, notes, and staff.\n' +
      'Staff → Shift close: counts the drawer against today’s cash sales, submits variance for owner review (saved as cash reconciliation).\n\n' +
      'Also use Staff Accountability on the owner side to review shift and cash behaviour over time.',
    popular: true,
  },
  {
    id: 'fin-4',
    title: 'Bank accounts and bank reconciliation',
    category: 'Finance',
    excerpt: 'Track bank accounts; reconcile statements against Busmo records.',
    content:
      'Bank Accounts holds account name, bank, and balances metadata.\n' +
      'Bank Reconciliation (Standard+) matches bank activity to recorded sales/expenses to find gaps.\n' +
      'Bank Statement Import supports bringing statement lines in where enabled.\n\n' +
      'Payment methods on sales (cash vs transfer) should match how money actually landed so reconciliation stays meaningful.',
    popular: false,
  },
  {
    id: 'fin-5',
    title: 'Capital and referrals',
    category: 'Finance',
    excerpt: 'Access Capital pathways and the Referrals program.',
    content:
      'Access Capital surfaces capital-related options for eligible categories (e.g. wholesale, retail, manufacturing, distributor).\n\n' +
      'Referrals: share your code, track referral activity and earnings from the Referrals page in Growth.',
    popular: false,
  },

  // ── Staff ───────────────────────────────────────────────────────
  {
    id: 'st-1',
    title: 'Invite staff and set permissions',
    category: 'Staff',
    excerpt: 'Staff page: invite by role, toggle sale/inventory/shift and more.',
    content:
      'Owner → Staff:\n\n' +
      '1. Add staff with name, contact, role (Staff, Cashier, Manager, etc.).\n' +
      '2. Enable only the permissions they need — Record sales, View inventory, History, Attendance, Messages, Customers, Credit, Returns, Receive, Expenses, Shift close, Expiry, Menu, Production, Transfers.\n' +
      '3. Staff set password via invite / set-password flow and login at /staff.\n\n' +
      'Recommended permission packs differ by role and business category (restaurant cashiers get Menu; manufacturing may get Production).',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Open dashboard',
  },
  {
    id: 'st-2',
    title: 'Attendance, payroll, and accountability',
    category: 'Staff',
    excerpt: 'Clock in/out, payroll (Pro), activity and accountability views.',
    content:
      'Staff Attendance permission: clock in and out; records land in attendance for the business.\n' +
      'Owner can review attendance from Staff tools.\n\n' +
      'Payroll (Pro) configures salaries and runs payroll-related workflows.\n' +
      'Staff Activity and Staff Accountability help owners see who sold what and how cash shifts closed.',
    popular: false,
  },
  {
    id: 'st-3',
    title: 'Staff messages and team chat',
    category: 'Staff',
    excerpt: 'Messages permission enables chat with owner/team from the staff app.',
    content:
      'Staff with Messages open the Messages page to chat about stock, returns, or shift issues.\n' +
      'Owners use Chat / team messaging surfaces on the dashboard to coordinate without leaving Busmo.',
    popular: false,
  },

  // ── Customers & Suppliers ───────────────────────────────────────
  {
    id: 'cu-1',
    title: 'Customers',
    category: 'Customers',
    excerpt: 'Customer profiles, history, and attach-to-sale.',
    content:
      'Owner → Customers: create profiles (name, phone, notes), view purchase activity.\n' +
      'Attach customers on Record Sale for history and credit.\n' +
      'Staff Customers permission: look up customers at the counter.\n\n' +
      'Credit balances are managed under Credit Tracking when that feature is on.',
    popular: false,
  },
  {
    id: 'su-1',
    title: 'Suppliers and supplier credit',
    category: 'Suppliers',
    excerpt: 'Supplier list, profiles, purchases, and payables.',
    content:
      'Owner → Suppliers / Supplier Management: add suppliers, contacts, balances.\n' +
      'Supplier profiles and credit tools track what you owe and purchase history.\n' +
      'Receive Stock can link inbound goods to suppliers depending on workflow.\n\n' +
      'Not shown for pure services/education categories in some configurations.',
    popular: false,
  },

  // ── MO & Growth ─────────────────────────────────────────────────
  {
    id: 'mo-1',
    title: 'Ask MO (AI assistant)',
    category: 'MO & Growth',
    excerpt: 'Natural language help with sales, stock, expenses, and insights.',
    content:
      'Ask MO sits in the Account section (and mobile Ask MO).\n\n' +
      'Ask things like what sold today, stock levels, or expense summaries. MO reads your business data context — it is an intelligence layer on top of recorded sales, inventory, and expenses, not a separate ledger.\n\n' +
      'Text entry is primary; voice is available where the client supports it.',
    popular: true,
    actionLink: '/owner/dashboard',
    actionLabel: 'Open dashboard',
  },
  {
    id: 'mo-2',
    title: 'MO Sales and MO Sell',
    category: 'MO & Growth',
    excerpt: 'MO Sales: WhatsApp-oriented selling; MO Sell: commerce hub (beta).',
    content:
      'MO Sales is the WhatsApp AI salesperson workspace under Growth.\n' +
      'MO Sell is the commerce hub entry (beta) for online/social selling paths.\n\n' +
      'These complement in-store Record Sale — they do not replace core POS-style recording for walk-in customers.',
    popular: false,
  },

  // ── Documents & Settings ────────────────────────────────────────
  {
    id: 'doc-1',
    title: 'Receipts and document templates',
    category: 'Documents',
    excerpt: 'Receipt Generator and Document Templates (Standard+).',
    content:
      'After a sale you can generate receipts (thermal / paper-oriented layouts).\n' +
      'Receipt Theme Config customizes branding.\n' +
      'Document Templates (Standard+) covers broader business document layouts.\n\n' +
      'Keep business name and logo updated in Settings so printed documents stay correct.',
    popular: false,
  },
  {
    id: 'set-1',
    title: 'Settings, branches, and offline',
    category: 'Settings',
    excerpt: 'Business profile, currency, multi-branch (Pro), offline sync.',
    content:
      'Settings: business profile, category, currency, notifications preferences, and account controls.\n\n' +
      'Branches (Pro, not for all categories): manage multiple locations.\n\n' +
      'Busmo is designed offline-first for core recording (sales, expenses, inventory actions). When the network returns, data syncs. Use the in-app network status indicator if something fails to save.',
    popular: false,
  },
  {
    id: 'set-2',
    title: 'Download apps and web access',
    category: 'Settings',
    excerpt: 'Android APK and web/PWA from the Download page.',
    content:
      'From /welcome/download you can get the Android app build or continue on web.\n' +
      'Owner login is /login; staff is /staff/login.\n' +
      'Use the same credentials after install; business data stays in the cloud workspace.',
    popular: false,
    actionLink: '/welcome/download',
    actionLabel: 'Download Busmo',
  },
];

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Getting Started': 'Signup, plans, owner vs staff',
  Sales: 'Record Sale, payments, credit sales',
  Inventory: 'Products, stock, menu, warehouse',
  Finance: 'Expenses, cashflow, Money Control, banks',
  Staff: 'Invite, permissions, attendance, payroll',
  Customers: 'Profiles and credit customers',
  Suppliers: 'Suppliers and payables',
  'MO & Growth': 'Ask MO, MO Sales, MO Sell',
  Documents: 'Receipts and templates',
  Settings: 'Profile, branches, offline, download',
};
