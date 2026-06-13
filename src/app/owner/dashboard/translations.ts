// ═══════════════════════════════════════════
//  BUSMO — i18n Translations
//  Covers 10 languages:
//   en  English (Global default)
//   fr  Français (West & Central Africa, Global)
//   ha  Hausa (Nigeria, Niger, Ghana)
//   sw  Kiswahili (East Africa)
//   yo  Yorùbá (Nigeria, Benin, Togo)
//   ig  Igbo (Nigeria)
//   am  አማርኛ Amharic (Ethiopia)
//   ar  عربي Arabic (North Africa, RTL)
//   zu  isiZulu (South Africa)
//   af  Afrikaans (South Africa, Namibia)
// ═══════════════════════════════════════════

export type LangCode = 'en'|'fr'|'ha'|'sw'|'yo'|'ig'|'am'|'ar'|'zu'|'af';

export interface LangMeta {
  code: LangCode;
  name: string;        // native name
  englishName: string;
  flag: string;
  rtl: boolean;
  region: string;
}

export const LANGUAGES: LangMeta[] = [
  { code:'en', name:'English',   englishName:'English',   flag:'global', rtl:false, region:'Global' },
  { code:'fr', name:'Français',  englishName:'French',    flag:'🇫🇷', rtl:false, region:'West & Central Africa, Global' },
  { code:'ha', name:'Hausa',     englishName:'Hausa',     flag:'🇳🇬', rtl:false, region:'Nigeria · Niger · Ghana · Cameroon' },
  { code:'sw', name:'Kiswahili', englishName:'Swahili',   flag:'🇰🇪', rtl:false, region:'East Africa' },
  { code:'yo', name:'Yorùbá',    englishName:'Yoruba',    flag:'🇳🇬', rtl:false, region:'Nigeria · Benin · Togo' },
  { code:'ig', name:'Igbo',      englishName:'Igbo',      flag:'🇳🇬', rtl:false, region:'Nigeria' },
  { code:'am', name:'አማርኛ',      englishName:'Amharic',   flag:'🇪🇹', rtl:false, region:'Ethiopia' },
  { code:'ar', name:'عربي',       englishName:'Arabic',    flag:'🇸🇦', rtl:true,  region:'North Africa · Global' },
  { code:'zu', name:'isiZulu',   englishName:'Zulu',      flag:'🇿🇦', rtl:false, region:'South Africa' },
  { code:'af', name:'Afrikaans', englishName:'Afrikaans', flag:'🇿🇦', rtl:false, region:'South Africa · Namibia' },
];

// ── Full type of every translation key ────────────────────────────
export type TranslationDict = {
  // Navigation
  'nav.home':string; 'nav.recordSale':string; 'nav.addProduct':string;
  'nav.addExpense':string; 'nav.cashflow':string; 'nav.statement':string;
  'nav.reports':string; 'nav.bankReconciliation':string; 'nav.moneyControl':string;
  'nav.salesHistory':string; 'nav.inventory':string; 'nav.expenses':string;
  'nav.capital':string; 'nav.referrals':string; 'nav.askMO':string;
  'nav.services':string; 'nav.staff':string; 'nav.branches':string; 'nav.settings':string;
  'nav.chat':string;
  'nav.market':string; 'nav.pay':string;
  'nav.section.main':string; 'nav.section.money':string;
  'nav.section.team':string; 'nav.section.grow':string; 'nav.section.account':string;
  // Branch
  'branch.switcher.label':string; 'branch.switcher.allBranches':string;
  // Common
  'common.save':string; 'common.cancel':string; 'common.confirm':string;
  'common.close':string; 'common.back':string; 'common.edit':string;
  'common.delete':string; 'common.add':string; 'common.search':string;
  'common.filter':string; 'common.loading':string; 'common.viewAll':string;
  'common.download':string; 'common.print':string; 'common.upload':string;
  'common.submit':string; 'common.yes':string; 'common.no':string;
  'common.optional':string; 'common.required':string; 'common.select':string;
  'common.saveDraft':string; 'common.draft':string; 'common.success':string;
  'common.error':string; 'common.today':string; 'common.total':string;
  'common.currency':string; 'common.units':string; 'common.restock':string;
  'common.prev':string; 'common.next':string; 'common.daysAgo':string;
  'common.unlimited':string; 'common.amount':string; 'common.source':string;
  'common.selectSource':string; 'common.selectCategory':string; 'common.selectReason':string;
  'common.reason':string; 'common.description':string;
  'common.free':string; 'common.open':string;
  // Topbar / Sidebar
  'topbar.greeting':string; 'topbar.toggleTheme':string; 'topbar.notifications':string;
  'sidebar.verified':string; 'sidebar.viewProfile':string;
  // Home
  'home.greeting.morning':string; 'home.greeting.afternoon':string; 'home.greeting.evening':string;
  'home.subtitle':string; 'home.totalSales':string; 'home.totalRevenue':string;
  'home.netProfit':string; 'home.totalExpenses':string; 'home.transactions':string;
  'home.cashBalance':string; 'home.stockValue':string; 'home.quickActions':string;
  'home.recentSales':string; 'home.topProducts':string;
  'home.vsLastMonth':string; 'home.noSalesYet':string;
  'home.businessHealth':string; 'home.fullStatement':string;
  'home.noExpenses':string; 'home.noDataYet':string;
  'home.topInsight':string; 'home.forecasts':string; 'home.forecastDays':string;
  'home.forecastDesc':string; 'home.loading':string; 'home.noForecastData':string;
  'home.forecast.revenue':string; 'home.forecast.stockout':string; 'home.forecast.profit':string;
  'home.forecast.restock':string; 'home.forecast.noData':string;
  'home.insight.profitMargin':string; 'home.insight.healthy':string;
  'home.insight.runsOut':string; 'home.insight.days':string;
  'home.insight.allProducts':string; 'home.insight.healthyStock':string;
  'home.insight.revenue':string; 'home.insight.diversify':string;
  'home.insight.cashRunway':string; 'home.insight.strong':string;
  'home.sellOnline':string; 'home.sellOnlineDesc':string; 'home.setUpStore':string;
  'home.referralsDesc':string; 'home.startReferring':string;
  'home.capitalDesc':string; 'home.exploreFinancing':string;
  // Sale
  'sale.title':string; 'sale.subtitle':string; 'sale.selectProducts':string;
  'sale.cart':string; 'sale.emptyCart':string; 'sale.addToCart':string;
  'sale.quantity':string; 'sale.subtotal':string; 'sale.discount':string;
  'sale.grandTotal':string; 'sale.paymentMethod':string; 'sale.cash':string;
  'sale.transfer':string; 'sale.card':string; 'sale.completeSale':string;
  'sale.saleComplete':string; 'sale.change':string; 'sale.amountPaid':string;
  'sale.customer':string; 'sale.addCustomer':string; 'sale.profit':string;
  'sale.saveDraft':string; 'sale.addCustomItem':string; 'sale.note':string;
  'sale.noProductsFound':string; 'sale.tryDifferentSearch':string;
  'sale.noProducts':string; 'sale.addProductsFirst':string;
  // Product
  'product.title':string; 'product.subtitle':string; 'product.basicInfo':string;
  'product.name':string; 'product.sku':string; 'product.category':string;
  'product.description':string; 'product.pricing':string; 'product.sellingPrice':string;
  'product.costPrice':string; 'product.openingStock':string; 'product.lowStockAlert':string;
  'product.expiryTracking':string; 'product.variants':string; 'product.images':string;
  'product.salesMode':string; 'product.delivery':string; 'product.save':string;
  'product.saved':string; 'product.unit':string; 'product.margin':string; 'product.perUnit':string;
  'product.inStock':string;
  // Expense
  'expense.title':string; 'expense.subtitle':string; 'expense.details':string;
  'expense.category':string; 'expense.amount':string; 'expense.date':string;
  'expense.paymentMethod':string; 'expense.notes':string; 'expense.receipt':string;
  'expense.recurring':string; 'expense.frequency':string; 'expense.record':string;
  'expense.recorded':string; 'expense.whyRecord':string;
  // Cashflow
  'cashflow.title':string; 'cashflow.subtitle':string; 'cashflow.cashBalance':string;
  'cashflow.stockValue':string; 'cashflow.monthIn':string; 'cashflow.monthOut':string;
  'cashflow.addStock':string; 'cashflow.reduceStock':string;
  'cashflow.addMoney':string; 'cashflow.takeMoney':string;
  'cashflow.addStockDesc':string; 'cashflow.reduceStockDesc':string;
  'cashflow.addMoneyDesc':string; 'cashflow.takeMoneyDesc':string;
  'cashflow.recentTransactions':string; 'cashflow.viewStatement':string;
  'cashflow.confirmAddStock':string; 'cashflow.confirmReduceStock':string;
  'cashflow.recordIncoming':string; 'cashflow.recordOutgoing':string;
  'cashflow.loan':string; 'cashflow.investment':string; 'cashflow.personal':string; 'cashflow.other':string;
  'cashflow.noTransactions':string; 'cashflow.addTransactionsFirst':string;
  // Statement
  'statement.title':string; 'statement.subtitle':string; 'statement.period':string;
  'statement.heading':string; 'statement.subheading':string;
  'statement.type':string; 'statement.verified':string; 'statement.verifyAt':string;
  'statement.totalRevenue':string; 'statement.totalExpenses':string; 'statement.netProfit':string;
  'statement.closingStock':string; 'statement.profitLoss':string; 'statement.grossRevenue':string;
  'statement.cogs':string; 'statement.grossProfit':string; 'statement.netProfitAfterCosts':string;
  'statement.ownerDrawings':string; 'statement.ledger':string; 'statement.inventory':string;
  'statement.downloadPdf':string; 'statement.preparing':string; 'statement.pdfTip':string;
  'statement.vsLastMonth':string; 'statement.productsTracked':string;
  'statement.noTransactions':string; 'statement.noProducts':string;
  'statement.startDate':string; 'statement.endDate':string; 'statement.statementType':string;
  'statement.print':string; 'statement.preparingPDF':string; 'statement.downloadPDF':string;
  'statement.verifiedTitle':string; 'statement.verifiedDesc':string; 'statement.statementIdLabel':string;
  'statement.revenueChange':string; 'statement.expenseChange':string; 'statement.profitChange':string;
  'statement.printHeaderSub':string; 'statement.busmoVerified':string; 'statement.generated':string;
  'statement.businessName':string; 'statement.busmoId':string; 'statement.reportPeriod':string;
  'statement.to':string; 'statement.owner':string; 'statement.category':string; 'statement.country':string;
  'statement.busmoVerifiedStatement':string; 'statement.verifyBoxDesc':string;
  'statement.financialSummary':string; 'statement.vsPriorPeriod':string;
  'statement.closingStockValue':string; 'statement.productsTrackedShort':string;
  'statement.profitLossStatement':string; 'statement.totalSalesRevenue':string;
  'statement.platformCommission':string; 'statement.otherOperatingExpenses':string;
  'statement.transactionLedger':string; 'statement.table.date':string; 'statement.table.reference':string;
  'statement.table.type':string; 'statement.table.description':string; 'statement.table.debit':string;
  'statement.table.credit':string; 'statement.table.balance':string; 'statement.inventorySummary':string;
  'statement.table.product':string; 'statement.table.opening':string; 'statement.table.sold':string;
  'statement.table.loss':string; 'statement.table.restock':string; 'statement.table.closing':string;
  'statement.table.value':string; 'statement.table.total':string; 'statement.verifiedBy':string;
  'statement.allTransactions':string; 'statement.salesOnly':string; 'statement.expensesOnly':string;
  'statement.stockMovements':string;
  // MO
  'mo.title':string; 'mo.subtitle':string; 'mo.placeholder':string;
  'mo.send':string; 'mo.thinking':string; 'mo.greeting':string;
  'mo.openFullPage':string; 'mo.openAskMO':string;
  'mo.intro':string; 'mo.features':string; 'mo.planInfo':string;
  'mo.languagePrompt':string; 'mo.languageChanged':string;
  'mo.messagesPerDay':string; 'mo.starterFeatures':string;
  'mo.standardFeatures':string; 'mo.proFeatures':string;
  // MO Suggestions
  'mo.suggest.howBusiness':string;
  'mo.suggest.cashBalance':string;
  'mo.suggest.restock':string;
  'mo.suggest.expenses':string;
  'mo.suggest.recordSale':string;
  'mo.suggest.addProduct':string;
  'mo.suggest.sales':string; 'mo.suggest.profit':string; 'mo.suggest.stock':string;
  'mo.suggest.customers':string; 'mo.suggest.tips':string;
  // Staff
  'staff.title':string; 'staff.subtitle':string; 'staff.addMember':string;
  'staff.revenue':string; 'staff.transactions':string; 'staff.role':string;
  // Inventory
  'inventory.title':string; 'inventory.subtitle':string; 'inventory.exportCsv':string;
  'inventory.addProduct':string; 'inventory.searchPlaceholder':string; 'inventory.noProducts':string;
  'inventory.status.all':string; 'inventory.status.inStock':string;
  'stockStatus.out':string; 'stockStatus.low':string; 'stockStatus.in':string;
  'inventory.status.low':string; 'inventory.status.outOfStock':string;
  'inventory.table.product':string; 'inventory.table.sku':string;
  'inventory.table.category':string; 'inventory.table.stock':string;
  'inventory.table.cost':string; 'inventory.table.price':string;
  'inventory.table.profit':string; 'inventory.table.stockValue':string;
  'inventory.table.status':string; 'inventory.table.sold30d':string;
  'inventory.table.trend':string; 'inventory.table.actions':string;
  'inventory.soldToday':string; 'inventory.soldYesterday':string;
  'inventory.actions.edit':string; 'inventory.actions.restock':string;
  // Insights
  'insights.slowestMovers.title':string; 'insights.slowestMovers.subtitle':string;
  'insights.slowestMovers.empty':string; 'insights.lastSold':string;
  'insights.lowStock.title':string; 'insights.lowStock.stockoutNow':string;
  // Dashboard Inventory Overview
  'dashboard.invOverview.totalProducts':string; 'dashboard.invOverview.totalProductsSub':string;
  'dashboard.invOverview.unitsInStock':string; 'dashboard.invOverview.unitsInStockSub':string;
  'dashboard.invOverview.lowStock':string; 'dashboard.invOverview.outOfStock':string;
  'dashboard.invOverview.outOfStockSub':string; 'dashboard.invOverview.inventoryValue':string;
  'dashboard.invOverview.inventoryValueSub':string; 'dashboard.invOverview.potentialRevenue':string;
  'dashboard.invOverview.potentialProfit':string;
  // Services
  'services.title':string; 'services.subtitle':string;
  'services.getStarted':string; 'services.from':string; 'services.delivery':string;
  'services.storeSetup':string; 'services.storeSetupDesc':string;
  'services.productPhotos':string; 'services.productPhotosDesc':string;
  'services.advertising':string; 'services.advertisingDesc':string;
  'services.businessAudit':string; 'services.businessAuditDesc':string;
  // Capital
  'capital.title':string; 'capital.subtitle':string; 'capital.apply':string;
  'capital.checklist':string; 'capital.eligibility':string;
  'capital.amount':string; 'capital.rate':string;
  // Referrals
  'referrals.title':string; 'referrals.subtitle':string; 'referrals.yourCode':string;
  'referrals.copy':string; 'referrals.share':string;
  'referrals.earned':string; 'referrals.friends':string;
  // Settings
  'settings.title':string; 'settings.subtitle':string;
  'settings.section.language':string; 'settings.section.appearance':string;
  'settings.section.account':string; 'settings.section.notifications':string;
  'settings.section.privacy':string; 'settings.section.business':string;
  'settings.section.currency':string;
  'settings.language':string; 'settings.languageDesc':string;
  'settings.theme':string; 'settings.themeLight':string;
  'settings.themeDark':string; 'settings.themeAuto':string; 'settings.themeDesc':string;
  'settings.businessName':string; 'settings.businessCategory':string;
  'settings.businessPhone':string; 'settings.businessEmail':string;
  'settings.businessAddress':string; 'settings.businessCountry':string;
  'settings.currency':string; 'settings.currencyDesc':string;
  'settings.currencyAutoDetect':string; 'settings.currencyManual':string;
  'settings.currencySearchPlaceholder':string; 'settings.currencyNoResults':string;
  'settings.currencyLivePreview':string; 'settings.currencyThousands':string;
  'settings.currencyDecimal':string; 'settings.currencyPlaces':string;
  'settings.currencySymbol':string; 'settings.currencyBefore':string;
  'settings.currencyAfter':string;
  'settings.notifSales':string; 'settings.notifExpenses':string;
  'settings.notifLowStock':string; 'settings.notifWeeklySummary':string;
  'settings.notifMarketing':string;
  'settings.privacyAnalytics':string; 'settings.privacyAnalyticsDesc':string;
  'settings.deleteData':string; 'settings.deleteDataDesc':string;
  'settings.saved':string; 'settings.changesSaved':string; 'settings.version':string;
  'settings.logout':string; 'settings.logoutConfirm':string;
  'settings.plan':string; 'settings.upgradePlan':string;
  // Welcome Page
  'welcome.heroTitle':string; 'welcome.heroSubtitle':string; 'welcome.heroCta':string;
  'welcome.heroNote':string; 'welcome.whoTitle':string; 'welcome.whoSubtitle':string;
  'welcome.forOwners':string; 'welcome.forOwnersDesc':string; 'welcome.forSellers':string;
  'welcome.forSellersDesc':string; 'welcome.forInvestors':string; 'welcome.forInvestorsDesc':string;
  'welcome.startFreeTrial':string; 'welcome.exploreMarket':string; 'welcome.exploreInvestments':string;
  'welcome.featuresTitle':string; 'welcome.featuresSubtitle':string; 'welcome.featRecordSales':string;
  'welcome.featRecordSalesDesc':string; 'welcome.featInventory':string; 'welcome.featInventoryDesc':string;
  'welcome.featExpenses':string; 'welcome.featExpensesDesc':string; 'welcome.featAI':string;
  'welcome.featAIDesc':string; 'welcome.featForecasts':string; 'welcome.featForecastsDesc':string;
  'welcome.featStaff':string; 'welcome.featStaffDesc':string; 'welcome.whyTitle':string;
  'welcome.whySubtitle':string; 'welcome.oldWay':string; 'welcome.busmoWay':string;
  'welcome.accountingSoftware':string; 'welcome.clarityTool':string; 'welcome.old1':string;
  'welcome.old2':string; 'welcome.old3':string; 'welcome.old4':string; 'welcome.old5':string;
  'welcome.new1':string; 'welcome.new2':string; 'welcome.new3':string; 'welcome.new4':string;
  'welcome.new5':string; 'welcome.investorTitle':string; 'welcome.investorSubtitle':string;
  'welcome.investorFeat1':string; 'welcome.investorFeat2':string; 'welcome.investorFeat3':string;
  'welcome.investorFeat4':string; 'welcome.ctaTitle':string; 'welcome.ctaSubtitle':string;
  'welcome.ctaButton':string; 'welcome.faqTitle':string; 'welcome.liveOpp':string;
  'welcome.platformFeatures':string; 'welcome.offlineFirst':string; 'welcome.verified':string;
  'welcome.open':string; 'welcome.roi':string;
};

// ════════════════════════════════════════════════════════
//  ENGLISH (en) — Master / Default
// ════════════════════════════════════════════════════════
const en: TranslationDict = {
  'nav.home':'Home','nav.recordSale':'Record Sale','nav.addProduct':'Add Product',
  'nav.addExpense':'Add Expense','nav.cashflow':'Cashflow','nav.statement':'Statement',
  'nav.reports':'Reports','nav.bankReconciliation':'Bank Reconciliation','nav.moneyControl':'Money Control',
  'nav.salesHistory':'Sales History','nav.inventory':'Inventory','nav.expenses':'Expenses',
  'nav.capital':'Capital','nav.referrals':'Referrals','nav.askMO':'Ask MO',
  'nav.services':'Services','nav.staff':'Staff','nav.branches':'Branches','nav.settings':'Settings',
  'nav.chat':'Team Chat','nav.market':'Marketplace','nav.pay':'BusmoPay',
  'nav.section.main':'Main','nav.section.money':'Money',
  'nav.section.team':'Team','nav.section.grow':'Grow','nav.section.account':'Account',
  'branch.switcher.label':'Branch:','branch.switcher.allBranches':'All Branches',
  'common.save':'Save','common.cancel':'Cancel','common.confirm':'Confirm',
  'common.close':'Close','common.back':'Back','common.edit':'Edit',
  'common.delete':'Delete','common.add':'Add','common.search':'Search',
  'common.filter':'Filter','common.loading':'Loading…','common.viewAll':'View All',
  'common.download':'Download','common.print':'Print','common.upload':'Upload',
  'common.submit':'Submit','common.yes':'Yes','common.no':'No',
  'common.optional':'optional','common.required':'required','common.select':'Select',
  'common.saveDraft':'Save as Draft','common.draft':'Draft','common.success':'Success',
  'common.error':'Error','common.today':'Today','common.total':'Total','common.currency':'₦',
  'common.units':'units','common.restock':'Restock','common.prev':'Previous','common.next':'Next',
  'common.daysAgo':'days ago','common.unlimited':'Unlimited','common.amount':'Amount',
  'common.source':'Source','common.selectSource':'Select source','common.selectCategory':'Select category',
  'common.selectReason':'Select reason','common.reason':'Reason','common.description':'Description',
  'common.free':'free','common.open':'Open',
  'topbar.greeting':'Welcome back','topbar.toggleTheme':'Toggle theme','topbar.notifications':'Notifications',
  'sidebar.verified':'Verified','sidebar.viewProfile':'View Profile',
  'home.greeting.morning':'Good morning','home.greeting.afternoon':'Good afternoon','home.greeting.evening':'Good evening',
  'home.subtitle':"Here's your business at a glance.",'home.totalSales':'Total Sales',
  'home.totalRevenue':'Total Revenue','home.netProfit':'Net Profit','home.totalExpenses':'Total Expenses',
  'home.transactions':'Transactions','home.cashBalance':'Cash Balance','home.stockValue':'Stock Value',
  'home.quickActions':'Quick Actions','home.recentSales':'Recent Sales','home.topProducts':'Top Products',
  'home.vsLastMonth':'vs last month','home.noSalesYet':'No sales yet today.',
  'home.businessHealth':'Business Health','home.fullStatement':'Full Statement',
  'home.noExpenses':'No expenses','home.noDataYet':'No data yet',
  'home.topInsight':'Top Insight','home.forecasts':'Forecasts','home.forecastDays':'Next 7 days',
  'home.forecastDesc':'Based on your data','home.loading':'Loading','home.noForecastData':'No forecast data yet',
  'home.forecast.revenue':'Projected Revenue','home.forecast.stockout':'Stock Alerts','home.forecast.profit':'Expected Profit',
  'home.forecast.restock':'Restock Needed','home.forecast.noData':'—',
  'home.insight.profitMargin':'Profit margin','home.insight.healthy':'healthy at 29%',
  'home.insight.runsOut':'runs out in ~','home.insight.days':'days',
  'home.insight.allProducts':'All products','home.insight.healthyStock':'have healthy stock levels',
  'home.insight.revenue':'of revenue','home.insight.diversify':'— diversify',
  'home.insight.cashRunway':'Cash runway','home.insight.strong':'strong at ~45 days',
  'home.sellOnline':'Sell Online','home.sellOnlineDesc':'Your free store on Busmo Market is ready.',
  'home.setUpStore':'Set Up Your Store','home.referralsDesc':'Earn commission on referred subscriptions.',
  'home.startReferring':'Start Referring','home.capitalDesc':'Turn business data into real funding.',
  'home.exploreFinancing':'Explore Financing',
  'sale.title':'Record Sale','sale.subtitle':'Select products and record a manual sale.',
  'sale.selectProducts':'Select Products','sale.cart':'Cart','sale.emptyCart':'Your cart is empty. Add products above.',
  'sale.addToCart':'Add to Cart','sale.quantity':'Quantity','sale.subtotal':'Subtotal',
  'sale.discount':'Discount','sale.grandTotal':'Grand Total','sale.paymentMethod':'Payment Method',
  'sale.cash':'Cash','sale.transfer':'Transfer','sale.card':'Card',
  'sale.completeSale':'Complete Sale','sale.saleComplete':'Sale Completed!',
  'sale.change':'Change','sale.amountPaid':'Amount Paid',
  'sale.customer':'Customer','sale.addCustomer':'Add Customer (optional)',
  'sale.profit':'Est. Profit','sale.saveDraft':'Save Draft',
  'sale.addCustomItem':'Add Custom Item','sale.note':'Note','product.inStock':'in stock',
  'sale.noProductsFound':'No products found','sale.tryDifferentSearch':'Try a different search term',
  'sale.noProducts':'No products yet','sale.addProductsFirst':'Add products to your inventory first',
  'product.title':'Add Product','product.subtitle':'Add a product to your inventory. It will appear in your Record Sale flow.',
  'product.basicInfo':'Basic Information','product.name':'Product Name','product.sku':'SKU / Product Code',
  'product.category':'Category','product.description':'Description','product.pricing':'Pricing & Stock',
  'product.sellingPrice':'Selling Price','product.costPrice':'Cost Price',
  'product.openingStock':'Opening Stock','product.lowStockAlert':'Low Stock Alert',
  'product.expiryTracking':'Expiry Tracking','product.variants':'Product Variants',
  'product.images':'Product Images','product.salesMode':'How will this product be sold?',
  'product.delivery':'Delivery Countries','product.save':'Save Product',
  'product.saved':'Product saved successfully','product.unit':'Unit of Measure',
  'product.margin':'Profit margin','product.perUnit':'per unit',
  'expense.title':'Add Expense','expense.subtitle':'Record a business expense.',
  'expense.details':'Expense Details','expense.category':'Category','expense.amount':'Amount',
  'expense.date':'Date of Expense','expense.paymentMethod':'Payment Method',
  'expense.notes':'Description / Notes','expense.receipt':'Receipt / Proof of Payment',
  'expense.recurring':'This is a recurring expense','expense.frequency':'Repeat Frequency',
  'expense.record':'Record Expense','expense.recorded':'Expense recorded successfully',
  'expense.whyRecord':'Why record expenses? Busmo uses your expenses alongside sales to generate verified financial statements for loans and financing.',
  'cashflow.title':'Cashflow','cashflow.subtitle':'Record all money and stock movements in your business.',
  'cashflow.cashBalance':'Cash Balance','cashflow.stockValue':'Stock Value',
  'cashflow.monthIn':'This Month In','cashflow.monthOut':'This Month Out',
  'cashflow.addStock':'Add Stock','cashflow.addStockDesc':'Record new inventory coming into your business',
  'cashflow.reduceStock':'Reduce Stock','cashflow.reduceStockDesc':'Record stock reduction — damage, theft, spoilage',
  'cashflow.addMoney':'Add Money','cashflow.addMoneyDesc':'Record money coming in — sales, loans, refunds',
  'cashflow.takeMoney':'Take Money','cashflow.takeMoneyDesc':'Record money going out — withdrawals, payments',
  'cashflow.recentTransactions':'Recent Transactions',
  'cashflow.noTransactions':'No transactions yet','cashflow.addTransactionsFirst':'Record your first transaction',
  'cashflow.viewStatement':'View Full Statement →',
  'cashflow.confirmAddStock':'Confirm Add Stock','cashflow.confirmReduceStock':'Confirm Stock Reduction',
  'cashflow.recordIncoming':'Record Incoming Money','cashflow.recordOutgoing':'Record Outgoing Money',
  'cashflow.loan':'Loan','cashflow.investment':'Investment','cashflow.personal':'Personal','cashflow.other':'Other',
  'statement.title':'Summary & Statement','statement.subtitle':'Your verified business financial record. Can be used for loan applications and partner verification.',
  'statement.heading':'Summary & Statement','statement.subheading':'Your verified business financial record. Can be used for loan applications and partner verification.',
  'statement.period':'Period','statement.type':'Statement Type',
  'statement.verified':'Busmo Verified Statement.','statement.verifyAt':'Verify at busmo.io/verify',
  'statement.totalRevenue':'Total Revenue','statement.totalExpenses':'Total Expenses',
  'statement.netProfit':'Net Profit','statement.closingStock':'Closing Stock Value',
  'statement.profitLoss':'Profit & Loss Summary','statement.grossRevenue':'Total Sales Revenue',
  'statement.cogs':'Cost of Goods Sold (COGS)','statement.grossProfit':'Gross Profit',
  'statement.netProfitAfterCosts':'Net Profit (After All Costs)','statement.ownerDrawings':'Owner Drawings',
  'statement.ledger':'Transaction Ledger','statement.inventory':'Inventory Summary',
  'statement.downloadPdf':'Download PDF','statement.preparing':'Preparing…',
  'statement.pdfTip':'Choose "Save as PDF" in the print dialog',
  'statement.vsLastMonth':'vs last month','statement.productsTracked':'products tracked',
  'statement.noTransactions':'No transactions to display','statement.noProducts':'No products in inventory',
  'statement.startDate':'Start Date','statement.endDate':'End Date','statement.statementType':'Statement Type',
  'statement.print':'Print','statement.preparingPDF':'Preparing PDF…','statement.downloadPDF':'Download PDF',
  'statement.verifiedTitle':'Busmo Verified','statement.verifiedDesc':'This statement is verified by Busmo. Statement ID:','statement.statementIdLabel':'ID',
  'statement.revenueChange':'vs prior period','statement.expenseChange':'vs prior period','statement.profitChange':'vs prior period',
  'statement.printHeaderSub':'Verified Business Financial Statement','statement.busmoVerified':'Busmo Verified','statement.generated':'Generated',
  'statement.businessName':'Business Name','statement.busmoId':'Busmo ID','statement.reportPeriod':'Report Period',
  'statement.to':'to','statement.owner':'Owner','statement.category':'Category','statement.country':'Country',
  'statement.busmoVerifiedStatement':'Busmo Verified Statement','statement.verifyBoxDesc':'This statement is verified by Busmo.',
  'statement.financialSummary':'Financial Summary','statement.vsPriorPeriod':'vs prior period',
  'statement.closingStockValue':'Closing Stock Value','statement.productsTrackedShort':'products',
  'statement.profitLossStatement':'Profit & Loss Statement','statement.totalSalesRevenue':'Total Sales Revenue',
  'statement.platformCommission':'Platform Commission','statement.otherOperatingExpenses':'Other Operating Expenses',
  'statement.transactionLedger':'Transaction Ledger','statement.table.date':'Date','statement.table.reference':'Reference',
  'statement.table.type':'Type','statement.table.description':'Description','statement.table.debit':'Debit',
  'statement.table.credit':'Credit','statement.table.balance':'Balance','statement.inventorySummary':'Inventory Summary',
  'statement.table.product':'Product','statement.table.opening':'Opening','statement.table.sold':'Sold',
  'statement.table.loss':'Loss','statement.table.restock':'Restock','statement.table.closing':'Closing',
  'statement.table.value':'Value','statement.table.total':'Total','statement.verifiedBy':'Verified by',
  'statement.allTransactions':'All Transactions','statement.salesOnly':'Sales Only','statement.expensesOnly':'Expenses Only',
  'statement.stockMovements':'Stock Movements',
  'mo.title':'Ask MO','mo.subtitle':'Your AI business advisor, powered by Busmo.',
  'mo.placeholder':'Ask MO anything about your business…','mo.send':'Send',
  'mo.thinking':'MO is thinking…',"mo.greeting":"Hi! I'm MO, your Busmo business advisor. How can I help you today?",
  'mo.openFullPage':'Open MO full page','mo.openAskMO':'Open Ask MO',
  'mo.intro':'I can help you understand your business data, record sales, track expenses, and get smart insights. Just ask me anything!',
  'mo.features':'I can help with: sales analysis, profit tracking, inventory management, expense reports, and business forecasts.',
  'mo.planInfo':'You are on the {plan} plan. Upgrade for more features and unlimited messages.',
  'mo.languagePrompt':'I notice your browser is set to {language}. Would you like me to respond in {language}?',
  'mo.languageChanged':'I\'ll now respond in {language}. You can change this anytime in Settings.',
  'mo.messagesPerDay':'messages/day','mo.starterFeatures':'You have **{limit}**. I can help with basic sales insights and summaries.',
  'mo.standardFeatures':'You have **{limit}**. I can help with forecasts, inventory tips, and advanced insights.',
  'mo.proFeatures':'You have **{limit} messages**. I provide premium consulting and custom reports.',
  'mo.suggest.howBusiness':'How is my business doing?',
  'mo.suggest.cashBalance':'What\'s my cash balance?',
  'mo.suggest.restock':'What should I restock?',
  'mo.suggest.expenses':'Am I spending too much?',
  'mo.suggest.recordSale':'Record sale: Sold 2 rice for 5000',
  'mo.suggest.addProduct':'Add product: Rice at 25000 with 50 stock',
  'mo.suggest.sales':'Show me today\'s sales',
  'mo.suggest.profit':'Did I make profit this week?',
  'mo.suggest.stock':'What products are low in stock?',
  'mo.suggest.customers':'Who are my top customers?',
  'mo.suggest.tips':'Give me business tips',
  'staff.title':'Staff','staff.subtitle':'Manage your team and track performance.',
  'staff.addMember':'Add Staff Member','staff.revenue':'Revenue',
  'staff.transactions':'Transactions','staff.role':'Role',
  // Inventory
  'inventory.title':'Inventory','inventory.subtitle':'Track and manage your products',
  'inventory.exportCsv':'Export CSV','inventory.addProduct':'Add Product',
  'inventory.searchPlaceholder':'Search products...','inventory.noProducts':'No products found',
  'inventory.status.all':'All','inventory.status.inStock':'In Stock',
  'inventory.status.low':'Low Stock','inventory.status.outOfStock':'Out of Stock',
  'inventory.table.product':'Product','inventory.table.sku':'SKU',
  'inventory.table.category':'Category','inventory.table.stock':'Stock',
  'inventory.table.cost':'Cost','inventory.table.price':'Price',
  'inventory.table.profit':'Profit','inventory.table.stockValue':'Stock Value',
  'inventory.table.status':'Status','inventory.table.sold30d':'Sold (30d)',
  'inventory.table.trend':'Trend','inventory.table.actions':'Actions',
  'inventory.soldToday':'Sold today','inventory.soldYesterday':'Sold yesterday',
  'inventory.actions.edit':'Edit','inventory.actions.restock':'Restock',
  // Insights
  'insights.slowestMovers.title':'Slowest Movers','insights.slowestMovers.subtitle':'Products that haven\'t been selling well',
  'insights.slowestMovers.empty':'All products are moving well','insights.lastSold':'Last sold',
  'insights.lowStock.title':'Low Stock Alert','insights.lowStock.stockoutNow':'Out of stock now',
  'stockStatus.out':'Out of Stock','stockStatus.low':'Low Stock','stockStatus.in':'In Stock',
  // Dashboard Inventory Overview
  'dashboard.invOverview.totalProducts':'Total Products','dashboard.invOverview.totalProductsSub':'Unique products in inventory',
  'dashboard.invOverview.unitsInStock':'Units in Stock','dashboard.invOverview.unitsInStockSub':'Total inventory units',
  'dashboard.invOverview.lowStock':'Low Stock Items','dashboard.invOverview.outOfStock':'Out of Stock',
  'dashboard.invOverview.outOfStockSub':'Products to restock','dashboard.invOverview.inventoryValue':'Inventory Value',
  'dashboard.invOverview.inventoryValueSub':'Total stock value','dashboard.invOverview.potentialRevenue':'Potential Revenue',
  'dashboard.invOverview.potentialProfit':'Potential profit if all stock sold',
  'services.title':'Services','services.subtitle':'Expert business services to help you grow.',
  'services.getStarted':'Get Started','services.from':'From','services.delivery':'Delivery',
  'services.storeSetup':'Store Setup','services.storeSetupDesc':'Professional configuration',
  'services.productPhotos':'Product Photos','services.productPhotosDesc':'Professional photography',
  'services.advertising':'Advertising','services.advertisingDesc':'Reach more customers',
  'services.businessAudit':'Business Audit','services.businessAuditDesc':'Expert review',
  'capital.title':'Capital','capital.subtitle':'Access funding, loans, and investment opportunities.',
  'capital.apply':'Apply Now','capital.checklist':'Eligibility Checklist',
  'capital.eligibility':'Eligibility','capital.amount':'Loan Amount','capital.rate':'Interest Rate',
  'referrals.title':'Referrals','referrals.subtitle':'Invite businesses and earn rewards.',
  'referrals.yourCode':'Your Referral Code','referrals.copy':'Copy Code',
  'referrals.share':'Share','referrals.earned':'Earned','referrals.friends':'Referrals',
  'settings.title':'Settings','settings.subtitle':'Manage your account, business profile, and preferences.',
  'settings.section.language':'Language','settings.section.appearance':'Appearance',
  'settings.section.account':'Account & Profile','settings.section.notifications':'Notifications',
  'settings.section.privacy':'Privacy & Data','settings.section.business':'Business Profile',
  'settings.section.currency':'Currency',
  'settings.language':'Display Language','settings.languageDesc':'Choose the language used across the entire Busmo dashboard.',
  'settings.currency':'Currency','settings.currencyDesc':'Set your local currency. All amounts in your dashboard will display in the selected currency.',
  'settings.currencyAutoDetect':'Auto-detect from your country',
  'settings.currencyManual':'Or choose any currency manually',
  'settings.currencySearchPlaceholder':'Search by name, code (NGN, USD…) or region…',
  'settings.currencyNoResults':'No currencies match',
  'settings.currencyLivePreview':'Live preview — how amounts appear in your dashboard',
  'settings.currencyThousands':'Thousands separator',
  'settings.currencyDecimal':'Decimal separator',
  'settings.currencyPlaces':'Decimal places',
  'settings.currencySymbol':'Currency symbol',
  'settings.currencyBefore':'before amount','settings.currencyAfter':'after amount',
  'settings.theme':'Theme','settings.themeLight':'Light','settings.themeDark':'Dark',
  'settings.themeAuto':'System','settings.themeDesc':'Choose how Busmo looks on your device.',
  'settings.businessName':'Business Name','settings.businessCategory':'Business Category',
  'settings.businessPhone':'Phone Number','settings.businessEmail':'Business Email',
  'settings.businessAddress':'Business Address','settings.businessCountry':'Country',
  'settings.notifSales':'New Sale Notifications','settings.notifExpenses':'Expense Reminders',
  'settings.notifLowStock':'Low Stock Alerts','settings.notifWeeklySummary':'Weekly Summary Email',
  'settings.notifMarketing':'Tips & Feature Updates',
  'settings.privacyAnalytics':'Share Usage Analytics','settings.privacyAnalyticsDesc':'Help improve Busmo by sharing anonymous usage data.',
  'settings.deleteData':'Delete My Data','settings.deleteDataDesc':'Permanently delete your account and all data.',
  'settings.saved':'Saved','settings.changesSaved':'Changes saved successfully',
  'settings.version':'Version','settings.logout':'Log Out',
  'settings.logoutConfirm':'Are you sure you want to log out?',
  'settings.plan':'Current Plan','settings.upgradePlan':'Upgrade Plan',
  // Welcome Page
  'welcome.heroTitle':'You sell every day. <br /> <span class="text-accent">Do you know if you\'re making money?</span>',
  'welcome.heroSubtitle':'Stop guessing with notebooks and calculators. Busmo turns your daily activity into understanding—and understanding into growth.',
  'welcome.heroCta':'Start Your Free Trial',
  'welcome.heroNote':'3-day free trial · No credit card · Works offline',
  'welcome.whoTitle':'Who is Busmo for?',
  'welcome.whoSubtitle':'Whether you own the business, sell on the market, or fund the next big thing — Busmo has a place for you.',
  'welcome.forOwners':'Business Owners',
  'welcome.forOwnersDesc':'Track your profit, inventory, staff, and expenses — all from one simple dashboard.',
  'welcome.forSellers':'Market Sellers',
  'welcome.forSellersDesc':'Open your online store, reach more customers, and sell with a professional storefront.',
  'welcome.forInvestors':'Investors',
  'welcome.forInvestorsDesc':'Discover and fund verified African businesses — backed by real-time data you can trust.',
  'welcome.startFreeTrial':'Start Free Trial',
  'welcome.exploreMarket':'Explore Busmo Market',
  'welcome.exploreInvestments':'Explore Investments',
  'welcome.featuresTitle':'Everything you need.<br /><em>Nothing you don\'t.</em>',
  'welcome.featuresSubtitle':'Busmo is built for the reality of your business — simple, fast, and offline-first.',
  'welcome.featRecordSales':'Record Sales the Right Way',
  'welcome.featRecordSalesDesc':'See exactly what was sold, track quantity and profit per product, and understand which items actually make you money.',
  'welcome.featInventory':'Inventory Management',
  'welcome.featInventoryDesc':'Add products with cost and quantity, track stock automatically, and get alerts before you run out.',
  'welcome.featExpenses':'Expense Tracking',
  'welcome.featExpensesDesc':'Log daily expenses and inventory costs. See how they affect your profit in real time.',
  'welcome.featAI':'Ask Busmo AI',
  'welcome.featAIDesc':'Just ask: "Did I make profit today?" or "Which product should I restock?" Get straight answers instantly.',
  'welcome.featForecasts':'Smart Forecasts',
  'welcome.featForecastsDesc':'Busmo predicts your next week\'s profit, busiest day, cash runway, and stock outlook.',
  'welcome.featStaff':'Staff Management',
  'welcome.featStaffDesc':'Invite staff members to record sales and manage inventory. Keep control while your team runs things.',
  'welcome.whyTitle':'Not another <em>accounting app.</em>',
  'welcome.whySubtitle':'Busmo is a decision-making tool built for the reality of your business — not for accountants.',
  'welcome.oldWay':'The Old Way',
  'welcome.busmoWay':'The Busmo Way',
  'welcome.accountingSoftware':'Accounting Software',
  'welcome.clarityTool':'Clarity Tool',
  'welcome.old1':'Endless fields, confusing charts, features you\'ll never use',
  'welcome.old2':'Built for accountants — speaks "debits" and "credits"',
  'welcome.old3':'Gives you long reports to dig through, not answers',
  'welcome.old4':'Requires constant internet connection',
  'welcome.old5':'Takes weeks to learn before you can use it properly',
  'welcome.new1':'Record a sale in seconds. See your profit instantly',
  'welcome.new2':'Built for owners — speaks your language, gives straight answers',
  'welcome.new3':'Your most important insights are always one tap away',
  'welcome.new4':'Works offline — because your business doesn\'t pause for WiFi',
  'welcome.new5':'Up and running in minutes, not weeks',
  'welcome.investorTitle':'Invest in Africa\'s<br /><em>Growth Engine.</em>',
  'welcome.investorSubtitle':'Discover and fund the next generation of small businesses, backed by real-time, trusted data from Busmo.',
  'welcome.investorFeat1':'Explore data-verified opportunities with transparent signals',
  'welcome.investorFeat2':'Reduce risk with real-time business health data',
  'welcome.investorFeat3':'Invest in profit-sharing or equity-based deals',
  'welcome.investorFeat4':'Track returns and portfolio performance in one place',
  'welcome.ctaTitle':'The Future of Your Business<br />Starts With Clarity.',
  'welcome.ctaSubtitle':'Join smart business owners across Africa who are building their future with Busmo.',
  'welcome.ctaButton':'Start Your Free Trial Today',
  'welcome.faqTitle':'Frequently Asked Questions',
  'welcome.liveOpp':'Live Opportunities',
  'welcome.platformFeatures':'Platform Features',
  'welcome.offlineFirst':'Offline-first',
  'welcome.verified':'Verified',
  'welcome.open':'Open',
  'welcome.roi':'{roi} ROI',
};

// ════════════════════════════════════════════════════════
//  FRENCH (fr)
// ════════════════════════════════════════════════════════
const fr: TranslationDict = {
  ...en,
  'nav.home':'Accueil','nav.recordSale':'Enregistrer Vente','nav.addProduct':'Ajouter Produit',
  'nav.addExpense':'Ajouter Dépense','nav.cashflow':'Trésorerie','nav.statement':'Relevé',
  'nav.reports':'Rapports','nav.bankReconciliation':'Rapprochement Bancaire','nav.moneyControl':'Contrôle d\'Argent',
  'nav.salesHistory':'Historique des Ventes','nav.inventory':'Inventaire','nav.expenses':'Dépenses',
  'nav.capital':'Capital','nav.referrals':'Parrainages','nav.askMO':'Demander à MO',
  'nav.services':'Services','nav.staff':'Personnel','nav.branches':'Succursales','nav.settings':'Paramètres',
  'nav.chat':'Discussion d\'Équipe','nav.market':'Marché','nav.pay':'BusmoPay',
  'nav.section.main':'Principal','nav.section.money':'Argent',
  'nav.section.team':'Équipe','nav.section.grow':'Croissance','nav.section.account':'Compte',
  'branch.switcher.label':'Succursale:','branch.switcher.allBranches':'Toutes les Succursales',
  'common.save':'Enregistrer','common.cancel':'Annuler','common.confirm':'Confirmer',
  'common.close':'Fermer','common.back':'Retour','common.edit':'Modifier',
  'common.delete':'Supprimer','common.add':'Ajouter','common.search':'Rechercher',
  'common.filter':'Filtrer','common.loading':'Chargement…','common.viewAll':'Voir Tout',
  'common.download':'Télécharger','common.print':'Imprimer','common.upload':'Téléverser',
  'common.submit':'Soumettre','common.yes':'Oui','common.no':'Non',
  'common.optional':'facultatif','common.required':'obligatoire','common.select':'Sélectionner',
  'common.saveDraft':'Enregistrer Brouillon','common.draft':'Brouillon',
  'common.success':'Succès','common.error':'Erreur','common.today':"Aujourd'hui",
  'common.total':'Total','common.currency':'F CFA',
  'topbar.greeting':'Bon retour','sidebar.verified':'Vérifié','sidebar.viewProfile':'Voir le Profil',
  'home.greeting.morning':'Bonjour','home.greeting.afternoon':'Bon après-midi','home.greeting.evening':'Bonsoir',
  'home.subtitle':"Voici votre activité en un coup d'œil.",'home.totalSales':'Ventes Totales',
  'home.totalRevenue':'Revenus Totaux','home.netProfit':'Bénéfice Net','home.totalExpenses':'Dépenses Totales',
  'home.transactions':'Transactions','home.cashBalance':'Solde de Caisse','home.stockValue':'Valeur du Stock',
  'home.quickActions':'Actions Rapides','home.recentSales':'Ventes Récentes','home.topProducts':'Produits Phares',
  'home.vsLastMonth':'vs mois dernier','home.noSalesYet':"Aucune vente aujourd'hui.",
  'home.businessHealth':'Santé de l\'Entreprise','home.fullStatement':'Relevé Complet',
  'home.noExpenses':'Aucune dépense','home.noDataYet':'Pas encore de données',
  'home.topInsight':'Aperçu','home.forecasts':'Prévisions','home.forecastDays':'7 prochains jours',
  'home.forecastDesc':'Basé sur vos données','home.loading':'Chargement','home.noForecastData':'Pas encore de données',
  'home.forecast.revenue':'Revenu Projeté','home.forecast.stockout':'Alertes Stock','home.forecast.profit':'Profit Attendu',
  'home.forecast.restock':'Réapprovisionnement','home.forecast.noData':'—',
  'home.insight.profitMargin':'Marge bénéficiaire','home.insight.healthy':'saine à 29%',
  'home.insight.runsOut':'s\'épuise dans ~','home.insight.days':'jours',
  'home.insight.allProducts':'Tous les produits','home.insight.healthyStock':'ont des niveaux de stock sains',
  'home.insight.revenue':'du revenu','home.insight.diversify':'— diversifiez',
  'home.insight.cashRunway':'Trésorerie','home.insight.strong':'solide à ~45 jours',
  'sale.title':'Enregistrer une Vente','sale.subtitle':'Sélectionnez des produits et enregistrez une vente.',
  'sale.selectProducts':'Sélectionner les Produits','sale.cart':'Panier',
  'sale.emptyCart':'Votre panier est vide.','sale.addToCart':'Ajouter au Panier',
  'sale.quantity':'Quantité','sale.subtotal':'Sous-total','sale.discount':'Remise',
  'sale.grandTotal':'Total Général','sale.paymentMethod':'Mode de Paiement',
  'sale.cash':'Espèces','sale.transfer':'Virement','sale.card':'Carte',
  'sale.completeSale':'Finaliser la Vente','sale.saleComplete':'Vente Finalisée !',
  'sale.change':'Monnaie','sale.amountPaid':'Montant Payé',
  'sale.customer':'Client','sale.addCustomer':'Ajouter un Client (facultatif)',
  'sale.profit':'Bénéfice Est.','sale.saveDraft':'Sauvegarder Brouillon',
  'sale.addCustomItem':'Ajouter Article Personnalisé','sale.note':'Note','product.inStock':'en stock',
  'sale.noProductsFound':'Aucun produit trouvé','sale.tryDifferentSearch':'Essayez un autre terme de recherche',
  'sale.noProducts':'Aucun produit','sale.addProductsFirst':'Ajoutez d\'abord des produits à votre inventaire',
  'product.title':'Ajouter un Produit','product.subtitle':'Ajoutez un produit à votre inventaire.',
  'product.basicInfo':'Informations de Base','product.name':'Nom du Produit','product.sku':'SKU / Code Produit',
  'product.category':'Catégorie','product.description':'Description','product.pricing':'Tarification & Stock',
  'product.sellingPrice':'Prix de Vente','product.costPrice':'Prix de Revient',
  'product.openingStock':'Stock Initial','product.lowStockAlert':'Alerte Stock Faible',
  'product.expiryTracking':'Suivi de Péremption','product.variants':'Variantes du Produit',
  'product.images':'Images du Produit','product.salesMode':'Comment ce produit sera-t-il vendu ?',
  'product.delivery':'Pays de Livraison','product.save':'Enregistrer le Produit',
  'product.saved':'Produit enregistré avec succès','product.unit':'Unité de Mesure',
  'product.margin':'Marge bénéficiaire','product.perUnit':'par unité',
  'expense.title':'Ajouter une Dépense','expense.subtitle':'Enregistrez une dépense professionnelle.',
  'expense.details':'Détails de la Dépense','expense.category':'Catégorie','expense.amount':'Montant',
  'expense.date':'Date de la Dépense','expense.paymentMethod':'Mode de Paiement',
  'expense.notes':'Description / Notes','expense.receipt':'Reçu / Preuve de Paiement',
  "expense.recurring":"Il s'agit d'une dépense récurrente",'expense.frequency':'Fréquence de Répétition',
  'expense.record':'Enregistrer la Dépense','expense.recorded':'Dépense enregistrée avec succès',
  'expense.whyRecord':'Pourquoi enregistrer les dépenses ? Busmo utilise vos dépenses pour générer des relevés financiers vérifiés pour vos demandes de prêt.',
  'cashflow.title':'Trésorerie','cashflow.subtitle':"Enregistrez tous les mouvements d'argent et de stock.",
  'cashflow.cashBalance':'Solde de Caisse','cashflow.stockValue':'Valeur du Stock',
  'cashflow.monthIn':'Entrées du Mois','cashflow.monthOut':'Sorties du Mois',
  'cashflow.addStock':'Ajouter du Stock','cashflow.addStockDesc':'Enregistrer nouvel inventaire',
  'cashflow.reduceStock':'Réduire le Stock','cashflow.reduceStockDesc':'Réduction — dommage, vol',
  "cashflow.addMoney":"Ajouter de l'Argent","cashflow.addMoneyDesc":'Argent entrant — ventes, prêts',
  "cashflow.takeMoney":"Retirer de l'Argent",'cashflow.takeMoneyDesc':'Argent sortant — retraits',
  'cashflow.recentTransactions':'Transactions Récentes',
  'cashflow.noTransactions':'Aucune transaction','cashflow.addTransactionsFirst':'Enregistrez votre première transaction',
  'cashflow.viewStatement':'Voir le Relevé Complet →',
  "cashflow.confirmAddStock":"Confirmer l'Ajout de Stock",'cashflow.confirmReduceStock':'Confirmer la Réduction de Stock',
  'cashflow.recordIncoming':'Enregistrer Entrée','cashflow.recordOutgoing':'Enregistrer Sortie',
  'cashflow.loan':'Prêt','cashflow.investment':'Investissement','cashflow.personal':'Personnel','cashflow.other':'Autre',
  'statement.title':'Résumé & Relevé','statement.subtitle':'Votre relevé financier vérifié. Utilisable pour les demandes de prêt.',
  'statement.heading':'Résumé & Relevé','statement.subheading':'Votre relevé financier vérifié. Utilisable pour les demandes de prêt et la vérification des partenaires.',
  'statement.period':'Période','statement.type':'Type de Relevé',
  'statement.verified':'Relevé Vérifié Busmo.','statement.verifyAt':'Vérifiez sur busmo.io/verify',
  'statement.totalRevenue':'Revenus Totaux','statement.totalExpenses':'Dépenses Totales',
  'statement.netProfit':'Bénéfice Net','statement.closingStock':'Valeur du Stock Final',
  'statement.profitLoss':'Résumé Profits & Pertes',"statement.grossRevenue":"Chiffre d'Affaires Total",
  'statement.cogs':'Coût des Marchandises Vendues','statement.grossProfit':'Bénéfice Brut',
  'statement.netProfitAfterCosts':'Bénéfice Net (Après Tous Coûts)','statement.ownerDrawings':'Retraits du Propriétaire',
  'statement.ledger':'Registre des Transactions','statement.inventory':'Résumé de l\'Inventaire',
  'statement.downloadPdf':'Télécharger PDF','statement.preparing':'Préparation…',
  'statement.pdfTip':'Choisissez "Enregistrer au format PDF" dans la boîte de dialogue d\'impression',
  'statement.vsLastMonth':'vs mois dernier','statement.productsTracked':'produits suivis',
  'statement.noTransactions':'Aucune transaction à afficher','statement.noProducts':'Aucun produit dans l\'inventaire',
  'statement.startDate':'Date de Début','statement.endDate':'Date de Fin','statement.statementType':'Type de Relevé',
  'statement.print':'Imprimer','statement.preparingPDF':'Préparation du PDF…','statement.downloadPDF':'Télécharger PDF',
  'statement.verifiedTitle':'Vérifié par Busmo','statement.verifiedDesc':'Ce relevé est vérifié par Busmo. ID du relevé :','statement.statementIdLabel':'ID',
  'statement.revenueChange':'vs période précédente','statement.expenseChange':'vs période précédente','statement.profitChange':'vs période précédente',
  'statement.printHeaderSub':'Relevé Financier Vérifié','statement.busmoVerified':'Vérifié par Busmo','statement.generated':'Généré',
  'statement.businessName':'Nom de l\'Entreprise','statement.busmoId':'ID Busmo','statement.reportPeriod':'Période du Rapport',
  'statement.to':'à','statement.owner':'Propriétaire','statement.category':'Catégorie','statement.country':'Pays',
  'statement.busmoVerifiedStatement':'Relevé Vérifié Busmo','statement.verifyBoxDesc':'Ce relevé est vérifié par Busmo.',
  'statement.financialSummary':'Résumé Financier','statement.vsPriorPeriod':'vs période précédente',
  'statement.closingStockValue':'Valeur du Stock Final','statement.productsTrackedShort':'produits',
  'statement.profitLossStatement':'Relevé Profits & Pertes','statement.totalSalesRevenue':'Revenus Totaux des Ventes',
  'statement.platformCommission':'Commission de la Plateforme','statement.otherOperatingExpenses':'Autres Dépenses Opérationnelles',
  'statement.transactionLedger':'Registre des Transactions','statement.table.date':'Date','statement.table.reference':'Référence',
  'statement.table.type':'Type','statement.table.description':'Description','statement.table.debit':'Débit',
  'statement.table.credit':'Crédit','statement.table.balance':'Solde','statement.inventorySummary':'Résumé de l\'Inventaire',
  'statement.table.product':'Produit','statement.table.opening':'Ouverture','statement.table.sold':'Vendu',
  'statement.table.loss':'Perte','statement.table.restock':'Réapprovisionnement','statement.table.closing':'Clôture',
  'statement.table.value':'Valeur','statement.table.total':'Total','statement.verifiedBy':'Vérifié par',
  'statement.allTransactions':'Toutes les Transactions','statement.salesOnly':'Ventes Seulement','statement.expensesOnly':'Dépenses Seulement',
  'statement.stockMovements':'Mouvements de Stock',
  'mo.title':'Demander à MO','mo.subtitle':'Votre conseiller commercial IA, propulsé par Busmo.',
  'mo.placeholder':'Posez une question à MO sur votre activité…','mo.send':'Envoyer',
  'mo.thinking':'MO réfléchit…','mo.greeting':'Bonjour ! Je suis MO, votre conseiller Busmo. Comment puis-je vous aider ?',
  'mo.openFullPage':'Ouvrir MO en plein écran','mo.openAskMO':'Ouvrir Demander à MO',
  'mo.intro':'Je peux vous aider à comprendre les données de votre entreprise, enregistrer les ventes, suivre les dépenses et obtenir des informations intelligentes. Demandez-moi n\'importe quoi !',
  'mo.features':'Je peux aider avec : analyse des ventes, suivi des profits, gestion des stocks, rapports de dépenses et prévisions d\'affaires.',
  'mo.planInfo':'Vous êtes sur le plan {plan}. Mettez à niveau pour plus de fonctionnalités et des messages illimités.',
  'mo.languagePrompt':'Je remarque que votre navigateur est en {language}. Voulez-vous que je réponde en {language} ?',
  'mo.languageChanged':'Je vais maintenant répondre en {language}. Vous pouvez changer cela à tout moment dans Paramètres.',
  'mo.suggest.howBusiness':'Comment va mon entreprise ?',
  'mo.suggest.cashBalance':'Quel est mon solde de trésorerie ?',
  'mo.suggest.restock':'Que dois-je réapprovisionner ?',
  'mo.suggest.expenses':'Est-ce que je dépense trop ?',
  'mo.suggest.recordSale':'Enregistrer vente: Vendu 2 riz pour 5000',
  'mo.suggest.addProduct':'Ajouter produit: Riz à 25000 avec 50 stock',
  'mo.suggest.sales':'Montrez-moi les ventes d\'aujourd\'hui',
  'mo.suggest.profit':'Ai-je fait un profit cette semaine ?',
  'mo.suggest.stock':'Quels produits sont en stock faible ?',
  'mo.suggest.customers':'Qui sont mes meilleurs clients ?',
  'mo.suggest.tips':'Donnez-moi des conseils commerciaux',
  'staff.title':'Personnel','staff.subtitle':'Gérez votre équipe et suivez les performances.',
  'staff.addMember':'Ajouter un Membre','staff.revenue':'Revenus','staff.transactions':'Transactions','staff.role':'Rôle',
  'services.title':'Services','services.subtitle':'Services professionnels pour vous aider à croître.',
  'services.getStarted':'Commencer','services.from':'À partir de','services.delivery':'Délai',
  'capital.title':'Capital','capital.subtitle':"Accédez à des financements, prêts et opportunités d'investissement.",
  'capital.apply':'Faire une Demande','capital.checklist':"Liste d'Éligibilité",
  'capital.eligibility':'Éligibilité','capital.amount':'Montant du Prêt','capital.rate':"Taux d'Intérêt",
  'referrals.title':'Parrainages','referrals.subtitle':'Invitez des entreprises et gagnez des récompenses.',
  'referrals.yourCode':'Votre Code de Parrainage','referrals.copy':'Copier le Code',
  'referrals.share':'Partager','referrals.earned':'Gagné','referrals.friends':'Parrainages',
  'settings.title':'Paramètres','settings.subtitle':'Gérez votre compte, profil et préférences.',
  'settings.section.language':'Langue','settings.section.appearance':'Apparence',
  'settings.section.account':'Compte & Profil','settings.section.notifications':'Notifications',
  'settings.section.privacy':'Confidentialité & Données','settings.section.business':'Profil Entreprise',
  'settings.language':"Langue d'Affichage",'settings.languageDesc':'Choisissez la langue utilisée dans tout le tableau de bord Busmo.',
  'settings.theme':'Thème','settings.themeLight':'Clair','settings.themeDark':'Sombre','settings.themeAuto':'Système',
  'settings.themeDesc':'Choisissez comment Busmo apparaît sur votre appareil.',
  "settings.businessName":"Nom de l'Entreprise",'settings.businessCategory':'Catégorie',
  'settings.businessPhone':'Téléphone','settings.businessEmail':'Email Professionnel',
  'settings.businessAddress':'Adresse','settings.businessCountry':'Pays',
  'settings.currency':'Devise','settings.currencyDesc':'Devise affichée dans votre tableau de bord.',
  'settings.notifSales':'Nouvelles Ventes','settings.notifExpenses':'Rappels de Dépenses',
  'settings.notifLowStock':'Alertes Stock Faible','settings.notifWeeklySummary':'Résumé Hebdomadaire',
  'settings.notifMarketing':'Conseils & Mises à Jour',
  'settings.privacyAnalytics':"Partager les Données d'Utilisation",'settings.privacyAnalyticsDesc':'Aidez à améliorer Busmo en partageant des données anonymes.',
  'settings.deleteData':'Supprimer Mes Données','settings.deleteDataDesc':'Supprimez définitivement votre compte et toutes les données.',
  'settings.saved':'Enregistré','settings.changesSaved':'Modifications enregistrées',
  'settings.version':'Version','settings.logout':'Se Déconnecter',
  'settings.logoutConfirm':'Êtes-vous sûr de vouloir vous déconnecter ?',
  'settings.plan':'Plan Actuel','settings.upgradePlan':'Mettre à Niveau',
  // Welcome Page
  'welcome.heroTitle':'Vous vendez tous les jours. <br /> <span class="text-accent">Savez-vous si vous gagnez de l\'argent ?</span>',
  'welcome.heroSubtitle':'Arrêtez de deviner avec des cahiers et des calculatrices. Busmo transforme votre activité quotidienne en compréhension, et la compréhension en croissance.',
  'welcome.heroCta':'Commencez votre essai gratuit',
  'welcome.heroNote':'Essai gratuit de 3 jours · Aucune carte de crédit · Fonctionne hors ligne',
  'welcome.whoTitle':'À qui s\'adresse Busmo ?',
  'welcome.whoSubtitle':'Que vous possédiez l\'entreprise, vendiez sur le marché ou financiez la prochaine grande chose — Busmo a une place pour vous.',
  'welcome.forOwners':'Propriétaires d\'Entreprise',
  'welcome.forOwnersDesc':'Suivez votre profit, inventaire, personnel et dépenses — tout dans un seul tableau de bord simple.',
  'welcome.forSellers':'Vendeurs du Marché',
  'welcome.forSellersDesc':'Ouvrez votre boutique en ligne, atteignez plus de clients et vendez avec une vitrine professionnelle.',
  'welcome.forInvestors':'Investisseurs',
  'welcome.forInvestorsDesc':'Découvrez et financez des entreprises africaines vérifiées — soutenues par des données en temps réel auxquelles vous pouvez faire confiance.',
  'welcome.startFreeTrial':'Commencer l\'Essai Gratuit',
  'welcome.exploreMarket':'Explorer le Marché Busmo',
  'welcome.exploreInvestments':'Explorer les Investissements',
  'welcome.featuresTitle':'Tout ce dont vous avez besoin.<br /><em>Rien que vous n\'ayez pas.</em>',
  'welcome.featuresSubtitle':'Busmo est conçu pour la réalité de votre entreprise — simple, rapide et hors ligne d\'abord.',
  'welcome.featRecordSales':'Enregistrer les Ventes Correctement',
  'welcome.featRecordSalesDesc':'Voyez exactement ce qui a été vendu, suivez la quantité et le profit par produit, et comprenez quels articles vous font vraiment gagner de l\'argent.',
  'welcome.featInventory':'Gestion des Stocks',
  'welcome.featInventoryDesc':'Ajoutez des produits avec coût et quantité, suivez les stocks automatiquement et recevez des alertes avant les ruptures.',
  'welcome.featExpenses':'Suivi des Dépenses',
  'welcome.featExpensesDesc':'Enregistrez les dépenses quotidiennes et les coûts d\'inventaire. Voyez comment ils affectent votre profit en temps réel.',
  'welcome.featAI':'Demander à MO IA',
  'welcome.featAIDesc':'Demandez simplement : "Ai-je fait du profit aujourd\'hui ?" ou "Quel produit dois-je réapprovisionner ?" Obtenez des réponses instantanées.',
  'welcome.featForecasts':'Prévisions Intelligentes',
  'welcome.featForecastsDesc':'Busmo prédit votre profit de la semaine prochaine, le jour le plus occupé, la trésorerie et les perspectives de stock.',
  'welcome.featStaff':'Gestion du Personnel',
  'welcome.featStaffDesc':'Invitez les membres du personnel à enregistrer les ventes et gérer les stocks. Gardez le contrôle pendant que votre équipe gère les opérations.',
  'welcome.whyTitle':'Pas une autre <em>application de comptabilité.</em>',
  'welcome.whySubtitle':'Busmo est un outil de prise de décision conçu pour la réalité de votre entreprise — pas pour les comptables.',
  'welcome.oldWay':'L\'Ancienne Façon',
  'welcome.busmoWay':'La Façon Busmo',
  'welcome.accountingSoftware':'Logiciel de Comptabilité',
  'welcome.clarityTool':'Outil de Clarté',
  'welcome.old1':'Des champs sans fin, des graphiques confus, des fonctionnalités que vous n\'utiliserez jamais',
  'welcome.old2':'Conçu pour les comptables — parle "débits" et "crédits"',
  'welcome.old3':'Vous donne de longs rapports à parcourir, pas des réponses',
  'welcome.old4':'Nécessite une connexion Internet constante',
  'welcome.old5':'Prend des semaines à apprendre avant de pouvoir l\'utiliser correctement',
  'welcome.new1':'Enregistrez une vente en quelques secondes. Voyez votre profit instantanément',
  'welcome.new2':'Conçu pour les propriétaires — parle votre langue, donne des réponses directes',
  'welcome.new3':'Vos insights les plus importants sont toujours à un clic',
  'welcome.new4':'Fonctionne hors ligne — parce que votre entreprise ne s\'arrête pas pour le WiFi',
  'welcome.new5':'Opérationnel en quelques minutes, pas en semaines',
  'welcome.investorTitle':'Investissez dans le<br /><em>Moteur de Croissance Africain.</em>',
  'welcome.investorSubtitle':'Découvrez et financez la prochaine génération de petites entreprises, soutenue par des données fiables en temps réel de Busmo.',
  'welcome.investorFeat1':'Explorez des opportunités vérifiées par des données avec des signaux transparents',
  'welcome.investorFeat2':'Réduisez les risques avec des données de santé d\'entreprise en temps réel',
  'welcome.investorFeat3':'Investissez dans des accords de partage de profits ou de capitaux',
  'welcome.investorFeat4':'Suivez les rendements et la performance du portefeuille en un seul endroit',
  'welcome.ctaTitle':'L\'Avenir de Votre Entreprise<br />Commence par la Clarté.',
  'welcome.ctaSubtitle':'Rejoignez les propriétaires d\'entreprises intelligents en Afrique qui construisent leur avenir avec Busmo.',
  'welcome.ctaButton':'Commencez Votre Essai Gratuit Aujourd\'hui',
  'welcome.faqTitle':'Questions Fréquemment Posées',
  'welcome.liveOpp':'Opportunités en Direct',
  'welcome.platformFeatures':'Fonctionnalités de la Plateforme',
  'welcome.offlineFirst':'Hors ligne d\'abord',
  'welcome.verified':'Vérifié',
  'welcome.open':'Ouvert',
  'welcome.roi':'{roi} ROI',
};

// ════════════════════════════════════════════════════════
//  HAUSA (ha)
// ════════════════════════════════════════════════════════
const ha: TranslationDict = {
  ...en,
  'nav.home':'Gida','nav.recordSale':'Rubuta Siyarwa','nav.addProduct':'Ƙara Kaya',
  'nav.addExpense':'Ƙara Kashe-kashe','nav.cashflow':'Kuɗin Shiga da Fita','nav.statement':'Rahoton Kuɗi',
  'nav.reports':'Rahoto','nav.bankReconciliation':'Daidaita Banki','nav.moneyControl':'Sarrafa Kuɗi',
  'nav.salesHistory':'Tarihin Siyarwa','nav.inventory':'Kayan Ajiya','nav.expenses':'Kashe-kashe',
  'nav.capital':'Jari','nav.referrals':'Shawarwari','nav.askMO':'Tambaya MO',
  'nav.services':'Ayyuka','nav.staff':"Ma'aikata",'nav.settings':'Saiti',
  'nav.chat':'Tattaunawar Ƙungiya','nav.market':'Kasuwa','nav.section.main':'Babba','nav.section.money':'Kuɗi',
  'nav.section.team':'Ƙungiya','nav.section.grow':'Ci Gaba','nav.section.account':'Asusun',
  'branch.switcher.label':'Sashin:','branch.switcher.allBranches':'Dukkan Sashin',
  'common.save':'Ajiye','common.cancel':'Soke','common.confirm':'Tabbatar',
  'common.close':'Rufe','common.back':'Koma Baya','common.search':'Nema',
  'common.total':'Jimila','common.currency':'₦','common.yes':'Eh','common.no':"A'a",
  'common.loading':'Ana Lodawa…','common.viewAll':'Duba Duka',
  'topbar.greeting':'Maraba da dawowa','sidebar.verified':'An Tabbatar','sidebar.viewProfile':'Duba Bayanai',
  'home.greeting.morning':'Ina kwana','home.greeting.afternoon':'Ina yini','home.greeting.evening':'Barka da yamma',
  'home.subtitle':'Ga kasuwancinka a takaice.','home.totalSales':'Jimilar Siyarwa',
  'home.totalRevenue':'Jimilar Kuɗin Shiga','home.netProfit':'Riba ta Gaskiya',
  'home.totalExpenses':'Jimilar Kashe-kashe','home.cashBalance':'Kuɗin Hannun','home.stockValue':'Darajar Kaya',
  'home.quickActions':'Ayyukan Gaggawa','home.recentSales':'Siyarwa Na Kwanan Nan',
  'home.topProducts':'Manyan Kayayyaki','home.vsLastMonth':'idan aka kwatanta da watan jiya',
  'home.noSalesYet':'Babu siyarwa yau tukuna.',
  'home.businessHealth':'Lafiyar Kasuwa','home.fullStatement':'Cikakken Rahoto',
  'home.topInsight':'Babban Bayani','home.forecasts':'Hasashe','home.forecastDays':'Kwanaki 30',
  'home.insight.profitMargin':'Riba','home.insight.healthy':'lafiya a 29%',
  'home.insight.runsOut':'ya kusa ƙare a cikin ~','home.insight.days':'kwanaki',
  'home.insight.revenue':'na kuɗin shiga','home.insight.diversify':'— bambanta',
  'home.insight.cashRunway':'Kuɗin hannu','home.insight.strong':'karfi a ~kwanaki 45',
  'sale.title':'Rubuta Siyarwa','sale.cash':'Naira','sale.transfer':'Canja Wuri','sale.card':'Kati',
  'sale.completeSale':'Kammala Siyarwa','sale.saleComplete':'An Kammala Siyarwa!',
  'sale.quantity':'Yawa','sale.grandTotal':'Jimila Gaba Ɗaya','sale.paymentMethod':'Hanyar Biyan Kuɗi',
  'sale.selectProducts':'Zaɓi Kayayyaki','sale.cart':'Kwati','sale.emptyCart':'Kwatinka babu komai. Ƙara kayayyaki sama.',
  'sale.addToCart':'Ƙara zuwa Kwati','sale.subtotal':'Jimila','sale.discount':'Ragi',
  'sale.profit':'Riba','sale.saveDraft':'Ajiye Daftari',
  'sale.addCustomItem':'Ƙara Kaya Na Musamman','sale.note':'Lura','product.inStock':'a cikin stock',
  'product.title':'Ƙara Kaya','product.name':'Sunan Kaya','product.sellingPrice':'Farashin Siyarwa',
  'product.costPrice':'Farashin Saya','product.save':'Ajiye Kaya','product.saved':'An ajiye kaya cikin nasara',
  'expense.title':'Ƙara Kashe-kashe','expense.record':'Rubuta Kashe-kashe','expense.recorded':'An rubuta kashe-kashe cikin nasara',
  'cashflow.title':'Kuɗin Shiga da Fita','cashflow.cashBalance':'Kuɗin Hannun','cashflow.stockValue':'Darajar Kaya',
  'cashflow.monthIn':'Kuɗin da Ya Shigo Wannan Wata','cashflow.monthOut':'Kuɗin da Ya Fita Wannan Wata',
  'cashflow.addStock':'Ƙara Kaya','cashflow.reduceStock':'Rage Kaya','cashflow.addMoney':'Ƙara Kuɗi','cashflow.takeMoney':'Ɗauki Kuɗi',
  'cashflow.addStockDesc':'Rubuta sabuwar kaya da ta shigo','cashflow.reduceStockDesc':'Rubuta rage kaya - lalacewa, sata',
  'cashflow.addMoneyDesc':'Rubuta kuɗin da ya shigo - sayarwa, lamuni','cashflow.takeMoneyDesc':'Rubuta kuɗin da ya fito - cire kuɗi',
  'cashflow.recentTransactions':"Ma'amalolin Kwanan Nan",'cashflow.viewStatement':'Duba Cikakken Rahoto →',
  'cashflow.noTransactions':'Babu ma\'amala','cashflow.addTransactionsFirst':'Rubuta ma\'amalar farko',
  'cashflow.confirmAddStock':'Tabbatar da Ƙara Kaya','cashflow.confirmReduceStock':'Tabbatar da Rage Kaya',
  'cashflow.recordIncoming':'Rubuta Kuɗin Shigowa','cashflow.recordOutgoing':'Rubuta Kuɗin Fita',
  'cashflow.loan':'Lamuni','cashflow.investment':'Saka hannun jari','cashflow.personal':'Na sirri','cashflow.other':'Sauran',
  'statement.title':'Taƙaitaccen Rahoto','statement.downloadPdf':'Sauke PDF',
  'statement.totalRevenue':'Jimilar Kuɗin Shiga','statement.totalExpenses':'Jimilar Kashe-kashe',
  'statement.netProfit':'Riba ta Gaskiya','statement.closingStock':'Darajar Kayan Rufe',
  'statement.startDate':'Lokacin Fara','statement.endDate':'Lokacin Ƙarshe','statement.statementType':'Nau\'in Rahoto',
  'statement.print':'Buga','statement.preparingPDF':'Ana Shirya PDF…','statement.downloadPDF':'Sauke PDF',
  'statement.verifiedTitle':'An Tabbatar da Busmo','statement.verifiedDesc':'An tabbatar da wannan rahoto da Busmo. ID na rahoto:','statement.statementIdLabel':'ID',
  'statement.revenueChange':'vs lokacin da ya gabata','statement.expenseChange':'vs lokacin da ya gabata','statement.profitChange':'vs lokacin da ya gabata',
  'statement.printHeaderSub':'Rahoto Kuɗi da aka Tabbatar','statement.busmoVerified':'An Tabbatar da Busmo','statement.generated':'An ƙirƙira',
  'statement.businessName':'Sunan Kasuwanci','statement.busmoId':'ID Busmo','statement.reportPeriod':'Lokacin Rahoto',
  'statement.to':'zuwa','statement.owner':'Mallaki','statement.category':'Rukuni','statement.country':'Ƙasa',
  'statement.busmoVerifiedStatement':'Rahoto da aka Tabbatar','statement.verifyBoxDesc':'An tabbatar da wannan rahoto da Busmo.',
  'statement.financialSummary':'Taƙaitaccen Rahoto Kuɗi','statement.vsPriorPeriod':'vs lokacin da ya gabata',
  'statement.closingStockValue':'Darajar Kayan Rufe','statement.productsTrackedShort':'kayayyaki',
  'statement.profitLossStatement':'Rahoto Ribobi da Asarori','statement.totalSalesRevenue':'Jimilar Kuɗin Siyarwa',
  'statement.platformCommission':'Kwamishinon Dandamali','statement.otherOperatingExpenses':'Sauran Kashe-kashen Aiki',
  'statement.transactionLedger':'Littafin Ma\'amala','statement.table.date':'Lokaci','statement.table.reference':'Nau\'i',
  'statement.table.type':'Nau\'i','statement.table.description':'Bayani','statement.table.debit':'Debit',
  'statement.table.credit':'Credit','statement.table.balance':'Ma\'auni','statement.inventorySummary':'Taƙaitaccen Kayan Ajiya',
  'statement.table.product':'Kaya','statement.table.opening':'Fara','statement.table.sold':'An sayar',
  'statement.table.loss':'Asara','statement.table.restock':'Sake cika','statement.table.closing':'Rufe',
  'statement.table.value':'Daraja','statement.table.total':'Jimila','statement.verifiedBy':'An tabbatar da',
  'statement.allTransactions':'Dukkan Ma\'amaloli','statement.salesOnly':'Siyarwa Kawai','statement.expensesOnly':'Kashe-kashe Kawai',
  'statement.stockMovements':'Motsin Kaya',
  'settings.title':'Saiti','settings.language':'Yaren Nuni',
  'settings.languageDesc':'Zaɓi yaren da ake amfani da shi a duk faɗin allunan Busmo.',
  'settings.theme':'Siga','settings.themeLight':'Haske','settings.themeDark':'Duhu',
  'settings.changesSaved':'An ajiye canje-canje cikin nasara','settings.logout':'Fita',
  'settings.saved':'An Ajiye','settings.plan':'Tsarin Yanzu','settings.upgradePlan':'Inganta Tsari',
  'mo.title':'Tambaya MO','mo.placeholder':'Yi wa MO tambaya game da kasuwancinka…','mo.send':'Aika',
  'mo.thinking':'MO yana tunanin…','mo.greeting':'Sannu! Ni ne MO, mai ba ka shawara na Busmo. Yaya zan taimake ka yau?',
  'mo.openFullPage':'Buɗe MO cikakken shafi','mo.openAskMO':'Buɗe Tambaya MO',
  'mo.intro':'Zan iya taimaka maka ka fahimci bayanan kasuwancinka, rubuta siyarwa, bi diddigin kashe-kashe, da samun hikima. Yi min tambaya komai!',
  'mo.features':'Zan iya taimaka da: nazarin siyarwa, bi diddigin riba, gudanar da kayan ajiya, rahotannin kashe-kashe, da hasashen kasuwa.',
  'mo.planInfo':'Kana kan tsarin {plan}. Inganta don ƙarin fasali da sakonnin mara iyaka.',
  'mo.languagePrompt':'Na lura cewa browser ɗinka yana da {language}. Kuna son in amsa da {language}?',
  'mo.languageChanged':'Zan yi amsa da {language} yanzu. Zaka iya canza wannan a kowane lokaci a Saiti.',
  'mo.suggest.howBusiness':'Ta yaya kasuwata take?',
  'mo.suggest.cashBalance':'Menene ma\'aunin kuɗina?',
  'mo.suggest.restock':'Menene zan sake cika?',
  'mo.suggest.expenses':'Shin ina kashewa da yawa?',
  'mo.suggest.recordSale':'Rubuta siyarwa: Na sayar da shinkafa 2 da 5000',
  'mo.suggest.addProduct':'Ƙara kaya: Shinkafa a 25000 da 50 stock',
  'mo.suggest.sales':'Nuna min siyarwar yau',
  'mo.suggest.profit':'Shin na samu riba a wannan makonni?',
  'mo.suggest.stock':'Waɗanne kayayyaki ne suke ƙanƙanta a stock?',
  'mo.suggest.customers':'Wa ne manyan abokan hulɗata?',
  'mo.suggest.tips':'Ba ni shawarwarin kasuwa',
  'staff.title':"Ma'aikata",'staff.addMember':"Ƙara Ma'aikaci",'staff.revenue':'Kuɗin Shiga',
  'referrals.title':'Shawarwari','referrals.yourCode':'Lambar Shawararka',
  // Welcome Page
  'welcome.heroTitle':'Kuna sayarwa kowace rana. <br /> <span class="text-accent">Shin kuna sanin ko kuna samun riba?</span>',
  'welcome.heroSubtitle':'Dakatar da hasashe tare da littattafan lissafi da kalkuleta. Busmo yana canza aikin ku na yau da kullum zuwa fahimta—kuma fahimta zuwa ci gaba.',
  'welcome.heroCta':'Fara Gwajin Kyauta',
  'welcome.heroNote':'Gwajin kyauta na kwana 3 · Ba katin banki · Yana aiki ba tare da intaba ba',
  'welcome.whoTitle':'Wa ne Busmo yake dacewa?',
  'welcome.whoSubtitle':'Ko da kuna mallakar kasuwa, kuna sayarwa a kasuwa, ko kuna ba da jari — Busmo yana da wuri a gare ku.',
  'welcome.forOwners':'Masu Kasuwa',
  'welcome.forOwnersDesc':'Bi diddigin ribar ku, kayan ajiya, ma\'aikata, da kashe-kashe — duk daga wani dashboard mai sauƙi.',
  'welcome.forSellers':'Masu Sayarwa a Kasuwa',
  'welcome.forSellersDesc':'Buɗe shafin yanar gizon ku, kai ga ƙarin abokan hulɗa, kuma ku sayar da shafi mai ƙwarjini.',
  'welcome.forInvestors':'Masu Zuba Jari',
  'welcome.forInvestorsDesc':'Gano kuma ku ba da jari ga kasuwancin Afirka da aka tabbatar — wanda aka goyi bayan bayanai na ainihi da za ku iya amincewa.',
  'welcome.startFreeTrial':'Fara Gwajin Kyauta',
  'welcome.exploreMarket':'Bincika Kasuwar Busmo',
  'welcome.exploreInvestments':'Bincika Zuba Jari',
  'welcome.featuresTitle':'Duk abin da kuke buƙata.<br /><em>Babu abin da ba kuke buƙata ba.</em>',
  'welcome.featuresSubtitle':'Busmo an gina shi ne don haƙiƙanin kasuwancinka — mai sauƙi, da sauri, kuma offline-farko.',
  'welcome.featRecordSales':'Yi Rikodin Siyarwa Daidai',
  'welcome.featRecordSalesDesc':'Duba ainihin abin da aka sayar, bi diddigin yawa da riba ga kowane samfur, kuma ka fahimci waɗanne kayayyaki ne ke sa ka samun kuɗi.',
  'welcome.featInventory':'Gudanar da Kayan Ajiya',
  'welcome.featInventoryDesc':'Ƙara kayayyaki da farashi da yawa, bi diddigin stock a atomatik, kuma ka sami gargadi kafin ka ƙare.',
  'welcome.featExpenses':'Bi Diddigin Kashe-kashe',
  'welcome.featExpensesDesc':'Yi rikodin kashe-kashen yau da kullum da farashin kayan ajiya. Duba yadda suke shafar ribar ku a lokaci mai.',
  'welcome.featAI':'Tambaya Busmo AI',
  'welcome.featAIDesc':'Kawai tambaya: "Shin na samu riba yau?" ko "Wane kayan ne zan sake cika?" Sami amsoshi nan take.',
  'welcome.featForecasts':'Hasashe Mai Hikima',
  'welcome.featForecastsDesc':'Busmo yana hasashen ribar ku ta makonni, ranar da ta fi cike da aiki, tafiyar da kuɗi, da kuma yanayin stock.',
  'welcome.featStaff':'Gudanar da Ma\'aikata',
  'welcome.featStaffDesc':'Yanayi ma\'aikata su yi rikodin siyarwa da kuma gudanar da kayan ajiya. Ki da iko yayin da kungiyar ku ke tafiyar da abubuwa.',
  'welcome.whyTitle':'Ba wani <em>app na lissafin kuɗi ba.</em>',
  'welcome.whySubtitle':'Busmo kayan aikin yanke shawara ne wanda aka gina don haƙiƙanin kasuwancinka — ba ga masu lissafin kuɗi ba.',
  'welcome.oldWay':'Hanyar Da',
  'welcome.busmoWay':'Hanyar Busmo',
  'welcome.accountingSoftware':'Software na Lissafi',
  'welcome.clarityTool':'Kayan Aikin Bayyani',
  'welcome.old1':'Filaye marasa ƙare, zane-zane masu rikitarwa, fasalolin da ba za ku taɓa amfani da su ba',
  'welcome.old2':'An gina shi ga masu lissafi — yana magana "debits" da "credits"',
  'welcome.old3':'Yana ba ku rahotanni masu tsawo don bincika, ba amsoshi ba',
  'welcome.old4':'Yana buƙatar haɗin intanet akai-akai',
  'welcome.old5':'Yana ɗaukar makonni don koyo kafin ku iya amfani da shi yadda ya kamata',
  'welcome.new1':'Yi rikodin siyarwa a cikin dakika. Duba ribar ku nan take',
  'welcome.new2':'An gina shi ga masu kasuwa — yana magana yaren ku, yana ba da amsoshi kai tsaye',
  'welcome.new3':'Mafi muhimmancin bayanan ku suna koyaushe a nesa daya',
  'welcome.new4':'Yana aiki ba tare da WiFi ba — saboda kasuwancin ku baya tsayawa don WiFi',
  'welcome.new5':'Yana aiki a cikin mintuna, ba makonni ba',
  'welcome.investorTitle':'Zuba jari a cikin<br /><em>Injin Ci Gaban Afirka.</em>',
  'welcome.investorSubtitle':'Gano kuma ku ba da jari ga tsararraki masu zuwa na ƙananan kasuwanci, wanda aka goyi bayan bayanai na ainihi daga Busmo.',
  'welcome.investorFeat1':'Bincika damar da aka tabbatar da bayanai tare da alamomi masu bayyani',
  'welcome.investorFeat2':'Rage haɗari tare da bayanin lafiyar kasuwa na ainihi',
  'welcome.investorFeat3':'Zuba jari a cikin yarjejeniyar raba riba ko ekuiti',
  'welcome.investorFeat4':'Bi diddigin dawowa da aikin portfolio a wuri guda',
  'welcome.ctaTitle':'Nan Gaba na Kasuwancin Ku<br />Yana Fara da Bayyani.',
  'welcome.ctaSubtitle':'Shiga masu kasuwa masu hikima a fadin Afirka waɗanda ke gina nan gaba da Busmo.',
  'welcome.ctaButton':'Fara Gwajin Kyauta A Yau',
  'welcome.faqTitle':'Tambayoyin Da Ake Yawan Yi',
  'welcome.liveOpp':'Damammaki A Kai',
  'welcome.platformFeatures':'Fasalolin Dandalin',
  'welcome.offlineFirst':'Offline-farko',
  'welcome.verified':'An Tabbatar',
  'welcome.open':'Buɗe',
  'welcome.roi':'{roi} Riba',
};

// ════════════════════════════════════════════��═══════════
//  SWAHILI (sw)
// ════════════════════════════════════════════════════════
const sw: TranslationDict = {
  ...en,
  'nav.home':'Nyumbani','nav.recordSale':'Rekodi Mauzo','nav.addProduct':'Ongeza Bidhaa',
  'nav.addExpense':'Ongeza Gharama','nav.cashflow':'Mtiririko wa Fedha','nav.statement':'Taarifa ya Fedha',
  'nav.reports':'Ripoti','nav.bankReconciliation':'Urejeshaji wa Benki','nav.moneyControl':'Udhibiti wa Fedha',
  'nav.salesHistory':'Historia ya Mauzo','nav.inventory':'Hesabu ya Bidhaa','nav.expenses':'Gharama',
  'nav.capital':'Mtaji','nav.referrals':'Mapendekezo','nav.askMO':'Uliza MO',
  'nav.services':'Huduma','nav.staff':'Wafanyakazi','nav.settings':'Mipangilio',
  'nav.chat':'Majadiliano ya Timu','nav.market':'Soko','nav.section.main':'Kuu','nav.section.money':'Fedha',
  'nav.section.team':'Timu','nav.section.grow':'Kukua','nav.section.account':'Akaunti',
  'branch.switcher.label':'Tawi:','branch.switcher.allBranches':'Matawi Yote',
  'common.save':'Hifadhi','common.cancel':'Ghairi','common.confirm':'Thibitisha',
  'common.close':'Funga','common.back':'Rudi','common.search':'Tafuta',
  'common.total':'Jumla','common.currency':'KSh','common.yes':'Ndiyo','common.no':'Hapana',
  'common.loading':'Inapakia…','common.viewAll':'Ona Yote',
  'topbar.greeting':'Karibu tena','sidebar.verified':'Imethibitishwa','sidebar.viewProfile':'Ona Wasifu',
  'home.greeting.morning':'Habari ya asubuhi','home.greeting.afternoon':'Habari ya mchana','home.greeting.evening':'Habari ya jioni',
  'home.subtitle':'Huu ndio muhtasari wa biashara yako.','home.totalSales':'Jumla ya Mauzo',
  'home.totalRevenue':'Jumla ya Mapato','home.netProfit':'Faida Halisi','home.totalExpenses':'Jumla ya Gharama',
  'home.cashBalance':'Salio la Fedha','home.stockValue':'Thamani ya Hisa',
  'home.quickActions':'Vitendo vya Haraka','home.recentSales':'Mauzo ya Hivi Karibuni',
  'home.topProducts':'Bidhaa Bora','home.vsLastMonth':'ikilinganishwa na mwezi uliopita',
  'home.noSalesYet':'Bado hakuna mauzo leo.',
  'home.businessHealth':'Afya ya Biashara','home.fullStatement':'Taarifa Kamili',
  'home.topInsight':'Ufahamu Mkuu','home.forecasts':'Utabiri','home.forecastDays':'Siku 30',
  'home.insight.profitMargin':'Faida','home.insight.healthy':'nzuri kwa 29%',
  'home.insight.runsOut':'inaisha ndani ya ~','home.insight.days':'siku',
  'home.insight.revenue':'ya mapato','home.insight.diversify':'— anuwai',
  'home.insight.cashRunway':'Mtiririko wa fedha','home.insight.strong':'imara kwa ~siku 45',
  'sale.title':'Rekodi Mauzo','sale.cash':'Taslimu','sale.transfer':'Uhamisho','sale.card':'Kadi',
  'sale.completeSale':'Kamilisha Mauzo','sale.saleComplete':'Mauzo Yamekamilika!',
  'sale.quantity':'Idadi','sale.grandTotal':'Jumla Kuu','sale.paymentMethod':'Njia ya Malipo',
  'sale.selectProducts':'Chagua Bidhaa','sale.cart':'Gari','sale.emptyCart':'Gari lako ni tupu. Ongeza bidhaa hapo juu.',
  'sale.addToCart':'Ongeza Kwenye Gari','sale.subtotal':'Jumla Ndogo','sale.discount':'Punguzo',
  'sale.profit':'Faida','sale.saveDraft':'Hifadhi Rasimu',
  'sale.addCustomItem':'Ongeza Bidhaa Maalum','sale.note':'Kumbusho','product.inStock':'kwenye hisa',
  'product.title':'Ongeza Bidhaa','product.name':'Jina la Bidhaa',
  'product.sellingPrice':'Bei ya Kuuza','product.costPrice':'Bei ya Kununua',
  'product.save':'Hifadhi Bidhaa','product.saved':'Bidhaa imehifadhiwa',
  'expense.title':'Ongeza Gharama','expense.record':'Rekodi Gharama','expense.recorded':'Gharama imerekodiwa',
  'cashflow.title':'Mtiririko wa Fedha','cashflow.cashBalance':'Salio la Fedha','cashflow.stockValue':'Thamani ya Hisa',
  'cashflow.monthIn':'Ziingialo Mwezi Huu','cashflow.monthOut':'Zitokalo Mwezi Huu',
  'cashflow.addStock':'Ongeza Hisa','cashflow.reduceStock':'Punguza Hisa',
  'cashflow.addMoney':'Ongeza Fedha','cashflow.takeMoney':'Chukua Fedha',
  'cashflow.addStockDesc':'Rekodi mpya ya bidhaa inayoingia','cashflow.reduceStockDesc':'Rekodi upunguzaji wa bidhaa - uharibifu, wizi',
  'cashflow.addMoneyDesc':'Rekodi fedha zinazoingia - mauzo, mikopo','cashflow.takeMoneyDesc':'Rekodi fedha zinazotoka - uondoaji, malipo',
  'cashflow.recentTransactions':'Miamala ya Hivi Karibuni','cashflow.viewStatement':'Ona Taarifa Kamili →',
  'cashflow.noTransactions':'Hakuna miamala','cashflow.addTransactionsFirst':'Rekodi miamala yako ya kwanza',
  'cashflow.confirmAddStock':'Thibitisha Kuongeza Hisa','cashflow.confirmReduceStock':'Thibitisha Kupunguza Hisa',
  'cashflow.recordIncoming':'Rekodi Fedha Zinazoingia','cashflow.recordOutgoing':'Rekodi Fedha Zinazotoka',
  'cashflow.loan':'Mkopo','cashflow.investment':'Uwekezaji','cashflow.personal':'Binafsi','cashflow.other':'Nyingine',
  'statement.title':'Muhtasari & Taarifa','statement.downloadPdf':'Pakua PDF',
  'statement.totalRevenue':'Jumla ya Mapato','statement.totalExpenses':'Jumla ya Gharama',
  'statement.netProfit':'Faida Halisi','statement.closingStock':'Thamani ya Hisa ya Mwisho',
  'settings.title':'Mipangilio','settings.language':'Lugha ya Onyesho',
  'settings.languageDesc':'Chagua lugha inayotumiwa katika dashibodi nzima ya Busmo.',
  'settings.theme':'Mandhari','settings.themeLight':'Mwanga','settings.themeDark':'Giza',
  'settings.changesSaved':'Mabadiliko yamehifadhiwa','settings.logout':'Toka','settings.saved':'Imehifadhiwa',
  'mo.title':'Uliza MO','mo.placeholder':'Uliza MO chochote kuhusu biashara yako…','mo.send':'Tuma',
  'mo.thinking':'MO anafikiri…','mo.greeting':'Habari! Mimi ni MO, mshauri wako wa Busmo. Ninawezaje kukusaidia leo?',
  'mo.openFullPage':'Fungua MO ukurasa kamili','mo.openAskMO':'Fungua Uliza MO',
  'mo.intro':'Ninaweza kukusaidia kuelewa data ya biashara yako, rekodi mauzo, fuatilia gharama, na kupata maarifa makubwa. Niulize chochote!',
  'mo.features':'Ninaweza kusaidia na: uchambuzi wa mauzo, ufuatiliaji wa faida, usimamizi wa hesabu, ripoti za gharama, na utabiri wa biashara.',
  'mo.planInfo':'Uko kwenye mpango wa {plan}. Ongeza kwa vipengele zaidi na ujumbe usio na kikomo.',
  'mo.languagePrompt':'Nimeona kuwa browser yako iko katika {language}. Ungependa nijibu kwa {language}?',
  'mo.languageChanged':'Sasa nitajibu kwa {language}. Unaweza kubadilisha hii wakati wowote katika Mipangilio.',
  'mo.suggest.howBusiness':'Biashara yangu ikoje?',
  'mo.suggest.cashBalance':'Salio langu la fedha ni kiasi gani?',
  'mo.suggest.restock':'Nifanye hisa upya ya nini?',
  'mo.suggest.expenses':'Je, ninatumia pesa nyingi?',
  'mo.suggest.recordSale':'Rekodi mauzo: Nimeuza mchele 2 kwa 5000',
  'mo.suggest.addProduct':'Ongeza bidhaa: Mchele kwa 25000 na stock 50',
  'mo.suggest.sales':'Nionyeshe mauzo ya leo',
  'mo.suggest.profit':'Nilifanya faida wiki hii?',
  'mo.suggest.stock':'Ni bidhaa gani zina stock ndogo?',
  'mo.suggest.customers':'Ni nani wateja wangu bora?',
  'mo.suggest.tips':'Nipe vidokezo vya biashara',
  'staff.title':'Wafanyakazi','staff.addMember':'Ongeza Mwanachama','staff.revenue':'Mapato',
  'referrals.title':'Mapendekezo','referrals.yourCode':'Nambari Yako ya Mapendekezo',
  // Welcome Page
  'welcome.heroTitle':'Unauza kila siku. <br /> <span class="text-accent">Je, unajua kama unafanya faida?</span>',
  'welcome.heroSubtitle':'Acha kukisia kwa vitabu na vikokotoo. Busmo inabadilisha shughuli zako za kila siku kuwa uelewa—na uelewa kuwa ukuaji.',
  'welcome.heroCta':'Anza Majaribio ya Bure',
  'welcome.heroNote':'Majaribio ya bure ya siku 3 · Hakuna kadi ya benki · Inafanya kazi nje ya mtandao',
  'welcome.whoTitle':'Busmo ni ya nani?',
  'welcome.whoSubtitle':'Ikiwa unamiliki biashara, unauza sokoni, au unafadhili kitu kijacho — Busmo ina nafasi kwako.',
  'welcome.forOwners':'Wamiliki wa Biashara',
  'welcome.forOwnersDesc':'Fuatilia faida yako, hesabu, wafanyakazi, na gharama — yote kutoka kwenye dashboardi moja rahisi.',
  'welcome.forSellers':'Wauzaji wa Soko',
  'welcome.forSellersDesc':'Fungua duka lako la mtandao, fikia wateja zaidi, na uza kwa duka la kitaalamu.',
  'welcome.forInvestors':'Wawekezaji',
  'welcome.forInvestorsDesc':'Gundua na ufadhili biashara za Kiafrika zilizothibitishwa — zimeungwa mkono na data za wakati halisi unazoweza kuamini.',
  'welcome.startFreeTrial':'Anza Majaribio ya Bure',
  'welcome.exploreMarket':'Chunguza Soko la Busmo',
  'welcome.exploreInvestments':'Chunguza Uwekezaji',
  'welcome.featuresTitle':'Kila unachohitaji.<br /><em>Hakuna kisicho hitajika.</em>',
  'welcome.featuresSubtitle':'Busmo imejengwa kwa ajili ya ukweli wa biashara yako — rahisi, ya haraka, na offline-kwanza.',
  'welcome.featRecordSales':'Rekodi Mauzo Kwa Njia Sahihi',
  'welcome.featRecordSalesDesc':'Ona aini ya kilichouzwa, fuatilia kiasi na faida kwa kila bidhaa, na ueleze ni vitu gani vinakufanya upate pesa.',
  'welcome.featInventory':'Usimamizi wa Hesabu',
  'welcome.featInventoryDesc':'Ongeza bidhaa na gharama na kiasi, fuatilia hesabu kiotomatiki, na upate tahadhari kabla hujamalizika.',
  'welcome.featExpenses':'Ufuatiliaji wa Gharama',
  'welcome.featExpensesDesc':'Rekodi gharama za kila siku na gharama za hesabu. Ona jinsi zinavyoathiri faida yako kwa wakati halisi.',
  'welcome.featAI':'Uliza Busmo AI',
  'welcome.featAIDesc':'Uliza tu: "Nilifanya faida leo?" au "Ni bidhaa gani nijaze tena?" Pata majibu papo hapo.',
  'welcome.featForecasts':'Utabiri Mahiri',
  'welcome.featForecastsDesc':'Busmo inatabiri faida yako ya wiki ijayo, siku ya shughuli nyingi, mtiririko wa fedha, na mwonekano wa hesabu.',
  'welcome.featStaff':'Usimamizi wa Wafanyakazi',
  'welcome.featStaffDesc':'Alika wafanyakazi kurekodi mauzo na kusimamia hesabu. Weka udhibiti huku timu yako ikiendesha mambo.',
  'welcome.whyTitle':'Sio nyingine <em>app ya uhasibu.</em>',
  'welcome.whySubtitle':'Busmo ni zana ya kufanya maamuzi iliyoundwa kwa ajili ya ukweli wa biashara yako — sio kwa wahasibu.',
  'welcome.oldWay':'Njia ya Kale',
  'welcome.busmoWay':'Njia ya Busmo',
  'welcome.accountingSoftware':'Programu ya Uhasibu',
  'welcome.clarityTool':'Zana ya Ufafanuzi',
  'welcome.old1':'Mashamba yasiyo na mwisho, michoro inayochanganya, vipengele ambavyo hutumia kamwe',
  'welcome.old2':'Imejengwa kwa wahasibu — inazungumza "debits" na "credits"',
  'welcome.old3':'Inakupa ripoti ndefu za kuchunguza, si majibu',
  'welcome.old4':'Inahitaji muunganisho wa mtandao kila wakati',
  'welcome.old5':'Inachukua wiki kujifunza kabla ya kuitumia vizuri',
  'welcome.new1':'Rekodi mauzo kwa sekunde. Ona faida yako mara moja',
  'welcome.new2':'Imejengwa kwa wamiliki — inazungumza lugha yako, inatoa majibu ya moja kwa moja',
  'welcome.new3':'Maarifa yako muhimu zaidi yako umbali wa bonyezo moja',
  'welcome.new4':'Inafanya kazi nje ya mtandao — kwa sababu biashara yako haisimami kwa WiFi',
  'welcome.new5':'Inaanza kufanya kazi kwa dakika, si wiki',
  'welcome.investorTitle':'Wekaza katika<br /><em>Injini ya Ukuaji wa Afrika.</em>',
  'welcome.investorSubtitle':'Gundua na ufadhili kizazi kijacho cha biashara ndogo, zikiungwa mkono na data za kuaminika za wakati halisi kutoka Busmo.',
  'welcome.investorFeat1':'Chunguza fursa zilizothibitishwa na data zenye ishara za uwazi',
  'welcome.investorFeat2':'Punguza hatari na data ya afya ya biashara ya wakati halisi',
  'welcome.investorFeat3':'Wekaza katika mikataba ya kugawana faida au ekuiti',
  'welcome.investorFeat4':'Fuatilia mapato na utendaji wa portfolio katika sehemu moja',
  'welcome.ctaTitle':'Mustakabali wa Biashara Yako<br />Unaanza na Ufafanuzi.',
  'welcome.ctaSubtitle':'Jiunge na wamiliki wa biashara wenye busara barani Afrika ambao wanajenga mustakabali wao na Busmo.',
  'welcome.ctaButton':'Anza Majaribio Yako ya Bure Leo',
  'welcome.faqTitle':'Maswali Yanayoulizwa Mara Kwa Mara',
  'welcome.liveOpp':'Fursa za Moja kwa Moja',
  'welcome.platformFeatures':'Vipengele vya Jukwaa',
  'welcome.offlineFirst':'Offline-kwanza',
  'welcome.verified':'Imethibitishwa',
  'welcome.open':'Wazi',
  'welcome.roi':'{roi} ROI',
};

// ════════════════════════════════════════════════════════
//  YORUBA (yo)
// ════════════════════════════════════════════════════════
const yo: TranslationDict = {
  ...en,
  'nav.home':'Ile','nav.recordSale':'Gbasilẹ Tita','nav.addProduct':'Fi Ọja Kun',
  'nav.addExpense':'Fi Inawo Kun','nav.cashflow':'Ṣiṣan Owo','nav.statement':'Ìdánimọ Owo',
  'nav.reports':'Riportì','nav.bankReconciliation':'Ìṣòwò Báǹkì','nav.moneyControl':'Ìṣàkóso Owó',
  'nav.salesHistory':'Itan Tita','nav.inventory':'Akojọ Ọja','nav.expenses':'Inawo',
  'nav.capital':'Olu-owo','nav.referrals':'Itọkasi','nav.askMO':'Beere MO',
  'nav.services':'Iṣẹ','nav.staff':'Awọn Oṣiṣẹ','nav.settings':'Ètò',
  'nav.chat':'Iwiregbe Ẹgbẹ','nav.market':'Ọja','nav.section.main':'Akọkọ','nav.section.money':'Owo',
  'nav.section.team':'Ẹgbẹ','nav.section.grow':'Idagbasoke','nav.section.account':'Akọọlẹ',
  'branch.switcher.label':'Ipo:','branch.switcher.allBranches':'Gbogbo Ipo',
  'common.save':'Fi pamọ','common.cancel':'Fagilee','common.confirm':'Jẹrisi',
  'common.close':'Pa','common.back':'Pada','common.search':'Wa',
  'common.total':'Apapọ','common.currency':'₦',
  'topbar.greeting':'E kaabọ pada','sidebar.verified':'A ti jẹrisi',
  'home.greeting.morning':'E kaaro','home.greeting.afternoon':'E kaasan','home.greeting.evening':'E kaale',
  'home.subtitle':'Eyi ni apejuwe iṣowo rẹ.','home.totalSales':'Apapọ Tita',
  'home.totalRevenue':'Apapọ Owo-wiwọle','home.netProfit':'Ere Gidi',
  'home.totalExpenses':'Apapọ Inawo','home.cashBalance':'Iyokù Owo','home.stockValue':'Iye Ọja',
  'home.businessHealth':'Ilera Iṣowo','home.fullStatement':'Iroyin Kukuru',
  'home.topInsight':'Oye Pataki','home.forecasts':'Asọtẹlẹ','home.forecastDays':'Ọjọ 30',
  'home.insight.profitMargin':'Ere','home.insight.healthy':'dara ni 29%',
  'home.insight.runsOut':'n parẹ ni ~','home.insight.days':'ọjọ',
  'home.insight.revenue':'ti owo-wiwọle','home.insight.diversify':'— orisirisi',
  'home.insight.cashRunway':'Owo lọwọ','home.insight.strong':'lagbara ni ~ọjọ 45',
  'sale.title':'Gbasilẹ Tita','sale.cash':'Owo','sale.transfer':'Gbigbe Owo','sale.card':'Kaadi',
  'sale.completeSale':'Pari Tita','sale.saleComplete':'Tita Ti Pari!',
  'sale.quantity':'Iye','sale.grandTotal':'Apapọ Nla','sale.paymentMethod':'Ọna Isanwo',
  'sale.selectProducts':'Yan Awọn ọja','sale.cart':'Agbepọ','sale.emptyCart':'Agbepọ rẹ ṣofo. Fi awọn ọja kun loke.',
  'sale.addToCart':'Fi kun Agbepọ','sale.subtotal':'Apapọ Kekere','sale.discount':'Idinku',
  'sale.profit':'Ere','sale.saveDraft':'Fi Pamọ Bi Daftari',
  'sale.addCustomItem':'Fi Ọja Pataki Kun','sale.note':'Akọsilẹ','product.inStock':'ninu akojọpọ',
  'product.title':'Fi Ọja Kun','product.name':'Orukọ Ọja',
  'product.sellingPrice':'Idiyele Tita','product.costPrice':'Idiyele Rira','product.save':'Fi Ọja Pamọ',
  'expense.title':'Fi Inawo Kun','expense.record':'Gbasilẹ Inawo',
  'cashflow.title':'Ṣiṣan Owo','cashflow.addStock':'Fi Ọja Kun','cashflow.reduceStock':'Dinku Ọja',
  'cashflow.addMoney':'Fi Owo Kun','cashflow.takeMoney':'Mu Owo',
  'statement.title':'Akopọ & Ìdánimọ','statement.downloadPdf':'Ṣe Igbasilẹ PDF',
  'settings.title':'Ètò','settings.language':'Ede Ifihan',
  'settings.languageDesc':'Yan ede ti a lo kọja dẹsibọọdù Busmo.',
  'settings.theme':'Iwo','settings.themeLight':'Imọlẹ','settings.themeDark':'Okunkun',
  'settings.changesSaved':'Awọn ayipada ti wa ni ipamọ','settings.logout':'Jade','settings.saved':'Ti fi pamọ',
  'mo.title':'Beere MO','mo.placeholder':'Beere MO ohunkohun nipa iṣowo rẹ…','mo.send':'Fi ranṣẹ',
  // Welcome Page
  'welcome.heroTitle':'O n ta ni gbogbo ọjọ. <br /> <span class="text-accent">Ṣe o mọ boya o n ṣe ere?</span>',
  'welcome.heroSubtitle':'Duro iduro pẹlu awọn iwe akọọlẹ ati iṣiro. Busmo n yi iṣẹ ojoojumọ rẹ di oye—ati oye si idagbasoke.',
  'welcome.heroCta':'Bẹrẹ Idanwo Ọfẹ',
  'welcome.heroNote':'Idanwo ọfẹ ọjọ 3 · Ko si kaadi kirẹditi · N ṣiṣẹ lai si intanẹẹti',
  'welcome.whoTitle':'Ta ni Busmo fẹ?',
  'welcome.whoSubtitle':'Boya o ni iṣowo, o n ta lori ọja, tabi o n ṣe idoko-owo — Busmo ni aaye fun ọ.',
  'welcome.forOwners':'Awọn Oniwun Iṣowo',
  'welcome.forOwnersDesc':'Tọpa ere rẹ, akojọ ọja, oṣiṣẹ, ati inawo — gbogbo lati inu dashboard kan rọrun.',
  'welcome.forSellers':'Awọn Onita Ọja',
  'welcome.forSellersDesc':'Ṣii itaja ori ayelujara rẹ, de ọdọ awọn alabara diẹ sii, ta pẹlu itaja alamọdaju.',
  'welcome.forInvestors':'Awọn Onidoko-owo',
  'welcome.forInvestorsDesc':'Ṣawari ati ṣe idoko-owo ninu awọn iṣowo Afirika ti a fọwọsi — ti a ṣe atilẹyin pẹlu data akoko gidi ti o le gbẹkẹle.',
  'welcome.startFreeTrial':'Bẹrẹ Idanwo Ọfẹ',
  'welcome.exploreMarket':'Ṣawari Ọja Busmo',
  'welcome.exploreInvestments':'Ṣawari Awọn Idoko-owo',
  'welcome.featuresTitle':'Gbogbo ohun ti o nilo.<br /><em>Ko si ohun ti o ko nilo.</em>',
  'welcome.featuresSubtitle':'Busmo jẹ ti a kọ fun otitọ iṣowo rẹ — rọrun, yara, ati offline-akọkọ.',
  'welcome.featRecordSales':'Gbasilẹ Tita Ni Ọna Tọ',
  'welcome.featRecordSalesDesc':'Ri ohun ti a ta, tọpa iye ati ere fun ọja kọọkan, mọ eyi ti o n mu owo wa.',
  'welcome.featInventory':'Iṣakoso Akojọ Ọja',
  'welcome.featInventoryDesc':'Fi awọn ọja kun pẹlu idiyele ati iye, tọpa stock laifọwọyi, gba akiyesi ṣaaju ki o to pari.',
  'welcome.featExpenses':'Iwadi Inawo',
  'welcome.featExpensesDesc':'Gbasilẹ awọn inawo ojoojumọ ati idiyele akojọ ọja. Wo bi wọn ṣe n kan ere rẹ ni akoko gidi.',
  'welcome.featAI':'Beere Busmo AI',
  'welcome.featAIDesc':'Beere nikan: "Ṣe mo ṣe ere loni?" tabi "Iru ọja wo ni MO le tun kun?" Gba idahun lẹsẹkẹsẹ.',
  'welcome.featForecasts':'Asọtẹlẹ Ọgbọn',
  'welcome.featForecastsDesc':'Busmo n sọtẹlẹ ere rẹ fun ọsẹ to n bọ, ọjọ ti o n pọ julọ, sisan owo, ati ireti stock.',
  'welcome.featStaff':'Iṣakoso Oṣiṣẹ',
  'welcome.featStaffDesc':'Pe awọn oṣiṣẹ lati gbasilẹ tita ati ṣakoso akojọ ọja. Pa iṣakoso nigba ti ẹgbẹ rẹ n ṣiṣẹ.',
  'welcome.whyTitle':'Kii ṣe <em>app iṣiro miiran.</em>',
  'welcome.whySubtitle':'Busmo jẹ irinṣẹ ipinnu ti a kọ fun otitọ iṣowo rẹ — kii ṣe fun awọn onisiro.',
  'welcome.oldWay':'Ọna Atijọ',
  'welcome.busmoWay':'Ọna Busmo',
  'welcome.accountingSoftware':'Sọfitiwia Iṣiro',
  'welcome.clarityTool':'Irinṣẹ Oye',
  'welcome.old1':'Awọn aaye ailopin, awọn aworan idamu, awọn ẹya ti o ko ni lo',
  'welcome.old2':'Ti a kọ fun awọn onisiro — n sọ "debits" ati "credits"',
  'welcome.old3':'N fun ọ ni awọn iroyin gigun lati wa, kii ṣe awọn idahun',
  'welcome.old4':'Nilo intanẹẹti nigbagbogbo',
  'welcome.old5':'N gba ọsẹ lati kọ ẹkọ ṣaaju ki o to le lo ọ',
  'welcome.new1':'Gbasilẹ tita ni iṣẹju-aaya. Wo ere rẹ lẹsẹkẹsẹ',
  'welcome.new2':'Ti a kọ fun awọn oniwun — n sọ ede rẹ, n fun ọ ni idahun taara',
  'welcome.new3':'Awọn oye pataki rẹ wa ni ijinna bọọlu kan',
  'welcome.new4':'N ṣiṣẹ lai si WiFi — nitori iṣowo rẹ ko duro fun WiFi',
  'welcome.new5':'N ṣiṣẹ ni iṣẹju, kii ṣe ọsẹ',
  'welcome.investorTitle':'Doko-owo sinu<br /><em>Enjini Idagbasoke Afirika.</em>',
  'welcome.investorSubtitle':'Ṣawari ati ṣe idoko-owo ninu iran ti n bọ ti awọn iṣowo kekere, ti a ṣe atilẹyin pẹlu data gidi lati Busmo.',
  'welcome.investorFeat1':'Ṣawari awọn anfani ti a fọwọsi pẹlu awọn ami oye',
  'welcome.investorFeat2':'Dinku ewu pẹlu data ilera iṣowo akoko gidi',
  'welcome.investorFeat3':'Doko-owo ninu awọn adehun pipin ere tabi ekuiti',
  'welcome.investorFeat4':'Tọpa awọn ere ati iṣẹ portfolio ni aaye kan',
  'welcome.ctaTitle':'Ọjọ Iwaju Iṣowo Rẹ<br /><em>Bẹrẹ Pẹlu Oye.</em>',
  'welcome.ctaSubtitle':'Darapọ mọ awọn oniwun iṣowo ọgbọn ni Afirika ti o n kọ ọjọ iwaju wọn pẹlu Busmo.',
  'welcome.ctaButton':'Bẹrẹ Idanwo Ọfẹ Rẹ Loni',
  'welcome.faqTitle':'Awọn Ibeere Nigbagbogbo',
  'welcome.liveOpp':'Awọn Anfani Laiye',
  'welcome.platformFeatures':'Awọn Ẹya Pẹpẹ',
  'welcome.offlineFirst':'Offline-akọkọ',
  'welcome.verified':'Ti fọwọsi',
  'welcome.open':'Ṣii',
  'welcome.roi':'{roi} Ere',
};

// ════════════════════════════════════════════════════════
//  IGBO (ig)
// ════════════════════════════════════════════════════════
const ig: TranslationDict = {
  ...en,
  'nav.home':'Ulo','nav.recordSale':'Dee Ire Ahia','nav.addProduct':'Tinye Ngwongwo',
  'nav.addExpense':'Tinye Mmefu','nav.cashflow':'Ọghọ Ego','nav.statement':'Ọnọdụ Ego',
  'nav.reports':'Akụkọ','nav.bankReconciliation':'Njikọta Bank','nav.moneyControl':'Nchịkwa Ego',
  'nav.salesHistory':'Akụkọ Ire Ahia','nav.inventory':'Ọnụọgụ Ngwongwo','nav.expenses':'Mmefu',
  'nav.capital':'Ego Ntọala','nav.referrals':'Ntụziaka','nav.askMO':'Jụọ MO',
  'nav.services':'Ọrụ','nav.staff':'Ndị ọrụ','nav.settings':'Ntọala',
  'nav.chat':'Mkparịta Ụka Otu','nav.market':'Ahịa','nav.section.main':'Isi','nav.section.money':'Ego',
  'nav.section.team':'Otu','nav.section.grow':'Uto','nav.section.account':'Akaụntụ',
  'branch.switcher.label':'Alaka:','branch.switcher.allBranches':'Alaka Nile',
  'common.save':'Chekwaa','common.cancel':'Kagbuo','common.confirm':'Kwenye',
  'common.close':'Mechie','common.back':'Laghachi','common.search':'Chọọ',
  'common.total':'Ngụkọta','common.currency':'₦',
  'topbar.greeting':'Nnọọ laghachi','sidebar.verified':'Ejiri ya kwenye',
  'home.greeting.morning':'Ụtụtụ ọma','home.greeting.afternoon':'Ehihie ọma','home.greeting.evening':'Anyasị ọma',
  'home.subtitle':'Nke a bụ nchịkọta azụmaahịa gị.','home.totalSales':'Ngụkọta Ire Ahia',
  'home.totalRevenue':'Ngụkọta Ego Mbata','home.netProfit':'Uru Dị Mma',
  'home.totalExpenses':'Ngụkọta Mmefu','home.cashBalance':'Ego Fọdụrụ','home.stockValue':'Ọnụahịa Ngwongwo',
  'home.businessHealth':'Ahụike Azụmaahịa','home.fullStatement':'Nchịkọta Ego',
  'home.topInsight':'Nkọwa Dị Mkpa','home.forecasts':'Amụma','home.forecastDays':'Ụbọchị 30',
  'home.insight.profitMargin':'Uru','home.insight.healthy':'dị mma na 29%',
  'home.insight.runsOut':'na-akwụsị na ~','home.insight.days':'ụbọchị',
  'home.insight.revenue':'nke ego mbata','home.insight.diversify':'— dịgasị iche',
  'home.insight.cashRunway':'Ego dị','home.insight.strong':'siri ike na ~ụbọchị 45',
  'sale.title':'Dee Ire Ahia','sale.cash':'Ego','sale.transfer':'Nnyefe Ego','sale.card':'Kaadị',
  'sale.completeSale':'Mechaa Ire Ahia','sale.saleComplete':'Ire Ahia Mechara!',
  'sale.quantity':'Ọnụọgụ','sale.grandTotal':'Ngụkọta Ukwu','sale.paymentMethod':'Ụzọ Ịkwụ Ụgwọ',
  'sale.selectProducts':'Họrọ Ngwongwo','sale.cart':'Ibu','sale.emptyCart':'Ibu gị efu. Tinye ngwongwo n\'elu.',
  'sale.addToCart':'Tinye n\'Ibu','sale.subtotal':'Ngụkọta Nta','sale.discount':'Mbelata',
  'sale.profit':'Uru','sale.saveDraft':'Chekwaa Dịka Daftari',
  'sale.addCustomItem':'Tinye Ngwongwo Pụrụ Iche','sale.note':'Ihe Ederede','product.inStock':'n\'ọbá ahịa',
  'product.title':'Tinye Ngwongwo','product.name':'Aha Ngwongwo',
  'product.sellingPrice':'Ọnụahịa Ire','product.costPrice':'Ọnụahịa Ịzụta','product.save':'Chekwaa Ngwongwo',
  'expense.title':'Tinye Mmefu','expense.record':'Dee Mmefu',
  'cashflow.title':'Ọghọ Ego','cashflow.addStock':'Tinye Ngwongwo','cashflow.reduceStock':'Belata Ngwongwo',
  'cashflow.addMoney':'Tinye Ego','cashflow.takeMoney':'Were Ego',
  'cashflow.addStockDesc':'Dee ngwongwo ọhụrụ','cashflow.reduceStockDesc':'Dee mbelata ngwongwo - mmebi, izu',
  'cashflow.addMoneyDesc':'Dee ego na-abata - ire, ịgbazị','cashflow.takeMoneyDesc':'Dee ego na-aga - iwepụ, ịkwụ ụgwọ',
  'cashflow.recentTransactions':'Njikọ Na-adịbeghị Anya','cashflow.viewStatement':'Hụ Nkwupụta Ọnwụ →',
  'cashflow.noTransactions':'Ọ dịghị njikọ','cashflow.addTransactionsFirst':'Dee njikọ gị mbụ',
  'cashflow.confirmAddStock':'Kwenye Tinye Ngwongwo','cashflow.confirmReduceStock':'Kwenye Mbelata Ngwongwo',
  'cashflow.recordIncoming':'Dee Ego Na-abata','cashflow.recordOutgoing':'Dee Ego Na-aga',
  'cashflow.loan':'Ụgwọ','cashflow.investment':'Ntinye ego','cashflow.personal':'Nke onwe','cashflow.other':'Ọzọ',
  'statement.title':'Nchịkọta & Ọnọdụ','statement.downloadPdf':'Budata PDF',
  'settings.title':'Ntọala','settings.language':'Asụsụ Igosi',
  'settings.languageDesc':'Họrọ asụsụ ejiri na dashboard Busmo.',
  'settings.theme':'Ọdịdị','settings.themeLight':'Ọcha','settings.themeDark':'Oji',
  'settings.changesSaved':'Agbanweela ihe ndị a chekwaa','settings.logout':'Pụọ','settings.saved':'Echekwara',
  'mo.title':'Jụọ MO','mo.placeholder':'Jụọ MO ihe ọ bụla banyere azụmaahịa gị…','mo.send':'Zipu',
  'mo.thinking':'MO na-eche…','mo.greeting':'Ndewo! Abụ m MO, onye ndụmọdụ Busmo gị. Kedu ka m ga-esi nyere gị aka taa?',
  'mo.openFullPage':'Mepee MO peeji zuru ezu','mo.openAskMO':'Mepee Jụọ MO',
  'mo.suggest.howBusiness':'Ka azụmahịa m dị?',
  'mo.suggest.cashBalance':'Gịnị bụ nguzozi ego m?',
  'mo.suggest.restock':'Gịnị ka m kwesịrị iji mezigharịa?',
  'mo.suggest.expenses':'Ọ̀ bụ na m na-emefu ego karịrị akarị?',
  'mo.suggest.recordSale':'Dekọọ ire: M rere akpa 2 osikapa maka 5000',
  'mo.suggest.addProduct':'Tinye ngwongwo: Osikapa na 25000 na 50 stock',
};

// ════════════════════════════════════════════════════════
const am: TranslationDict = {
  ...en,
  'nav.home':'መነሻ','nav.recordSale':'ሽያጭ ማስመዝገቢያ','nav.addProduct':'ምርት ጨምር',
  'nav.addExpense':'ወጪ ጨምር','nav.cashflow':'የገንዘብ አሰሳ','nav.statement':'የፋይናንስ መግለጫ',
  'nav.reports':'ሪፖርቶች','nav.bankReconciliation':'የባንክ ማስማማት','nav.moneyControl':'የገንዘብ ቁጠባ',
  'nav.salesHistory':'የሽያጭ ታሪክ','nav.inventory':'ዕቃ ክምችት','nav.expenses':'ወጪዎች',
  'nav.capital':'ካፒታል','nav.referrals':'ምክሮች','nav.askMO':'MO ጠይቅ',
  'nav.services':'አገልግሎቶች','nav.staff':'ሠራተኞች','nav.settings':'ቅንጅቶች',
  'nav.market':'ገበያ','nav.section.main':'ዋና','nav.section.money':'ገንዘብ',
  'nav.section.team':'ቡድን','nav.section.grow':'ዕድገት','nav.section.account':'መለያ',
  'branch.switcher.label':'ቅርንጫፔ:','branch.switcher.allBranches':'ሁሉም ቅርንጫፔ',
  'common.save':'አስቀምጥ','common.cancel':'ሰርዝ','common.confirm':'አረጋግጥ',
  'common.close':'ዝጋ','common.back':'ተመለስ','common.search':'ፈልግ',
  'common.total':'ድምር','common.currency':'ብር',
  'topbar.greeting':'እንኳን ደህና መጡ','sidebar.verified':'ተረጋግጧል',
  'home.greeting.morning':'እንደምን አደሩ','home.greeting.afternoon':'እንደምን ዋሉ','home.greeting.evening':'እንደምን አመሹ',
  'home.subtitle':'ይህ የንግድዎ ማጠቃለያ ነው።','home.totalSales':'ጠቅላላ ሽያጮች',
  'home.totalRevenue':'ጠቅላላ ገቢ','home.netProfit':'ተጣራ ትርፍ',
  'home.totalExpenses':'ጠቅላላ ወጪዎች','home.cashBalance':'የጥሬ ገንዘብ ቀሪ','home.stockValue':'የዕቃ ዋጋ',
  'home.businessHealth':'የንግድ ጤና','home.fullStatement':'ሙሉ መግለጫ',
  'home.topInsight':'ዋና ግንዛቤ','home.forecasts':'ትንበያዎች','home.forecastDays':'30 ቀናት',
  'home.insight.profitMargin':'ትርፍ','home.insight.healthy':'ጤናማ በ 29%',
  'home.insight.runsOut':'በ ~','home.insight.days':'ቀናት ውስጥ ያልቃል',
  'home.insight.revenue':'የገቢ','home.insight.diversify':'— አዳድስ',
  'home.insight.cashRunway':'የገንዘብ ፍሰት','home.insight.strong':'ጠንካራ በ ~45 ቀናት',
  'sale.title':'ሽያጭ ማስመዝገቢያ','sale.cash':'ጥሬ ገንዘብ','sale.transfer':'ዝውውር','sale.card':'ካርድ',
  'sale.completeSale':'ሽያጩን ጨርስ','sale.saleComplete':'ሽያጩ ተጠናቋል!',
  'product.title':'ምርት ጨምር','product.name':'የምርት ስም',
  'product.sellingPrice':'የሽያጭ ዋጋ','product.costPrice':'የግዢ ዋጋ','product.save':'ምርቱን አስቀምጥ',
  'expense.title':'ወጪ ጨምር','expense.record':'ወጪ ምዝገብ',
  'cashflow.title':'የገንዘብ ፍሰት','cashflow.addStock':'ዕቃ ጨምር','cashflow.reduceStock':'ዕቃ ቀንስ',
  'cashflow.addMoney':'ገንዘብ ጨምር','cashflow.takeMoney':'ገንዘብ ውሰድ',
  'cashflow.addStockDesc':'አዲስ ዕቃ መዝገብ','cashflow.reduceStockDesc':'ዕቃ ቀንስ - ጉዳት, መሰረቅ',
  'cashflow.addMoneyDesc':'ገንዘብ መዝገብ - ሽያጭ, ብድር','cashflow.takeMoneyDesc':'ገንዘብ መውሰድ - መውጣት, ክፍያ',
  'cashflow.recentTransactions':'በጣም ቅርብ ያሉ ግብይቶች','cashflow.viewStatement':'ሙሉ መግለጫ ይመልከቱ →',
  'cashflow.noTransactions':'ምንም ግብይት የለም','cashflow.addTransactionsFirst':'የመጀመሪያውን ግብይት ይመዝገቡ',
  'cashflow.confirmAddStock':'ዕቃ መጨመር ያረጋግጡ','cashflow.confirmReduceStock':'ዕቃ መቀንስ ያረጋግጡ',
  'cashflow.recordIncoming':'የሚገባ ገንዘብ ይመዝገቡ','cashflow.recordOutgoing':'የሚወጣ ገንዘብ ይመዝገቡ',
  'cashflow.loan':'ብድር','cashflow.investment':'ኢንቨስትመንት','cashflow.personal':'የግል','cashflow.other':'ሌላ',
  'statement.title':'ማጠቃለያ & መግለጫ','statement.downloadPdf':'PDF አውርድ',
  'settings.title':'ቅንጅቶች','settings.language':'የማሳያ ቋንቋ',
  'settings.languageDesc':'በ Busmo ዳሽቦርድ ላይ ጥቅም ላይ የሚውለውን ቋንቋ ይምረጡ።',
  'settings.theme':'ገጽታ','settings.themeLight':'ብርሃን','settings.themeDark':'ጨለማ',
  'settings.changesSaved':'ለውጦች ተቀምጠዋል','settings.logout':'ውጣ','settings.saved':'ተቀምጧል',
  'mo.title':'MO ጠይቅ','mo.placeholder':'ስለ ንግድዎ ለ MO ይጠይቁ…','mo.send':'ላክ',
};

// ════════════════════════════════════════════════════════
//  ARABIC (ar) — RTL
// ════════════════════════════════════════════════════════
const ar: TranslationDict = {
  ...en,
  'nav.home':'الرئيسية','nav.recordSale':'تسجيل بيع','nav.addProduct':'إضافة منتج',
  'nav.addExpense':'إضافة مصروف','nav.cashflow':'التدفق النقدي','nav.statement':'كشف الحساب',
  'nav.reports':'التقارير','nav.bankReconciliation':'مطابقة البنك','nav.moneyControl':'التحكم في المال',
  'nav.salesHistory':'سجل المبيعات','nav.inventory':'المخزون','nav.expenses':'المصروفات',
  'nav.capital':'رأس المال','nav.referrals':'الإحالات','nav.askMO':'اسأل MO',
  'nav.services':'الخدمات','nav.staff':'الموظفون','nav.settings':'الإعدادات',
  'nav.market':'السوق','nav.section.main':'رئيسي','nav.section.money':'المال',
  'nav.section.team':'الفريق','nav.section.grow':'النمو','nav.section.account':'الحساب',
  'branch.switcher.label':'الفرع:','branch.switcher.allBranches':'جميع الفروع',
  'common.save':'حفظ','common.cancel':'إلغاء','common.confirm':'تأكيد',
  'common.close':'إغلاق','common.back':'رجوع','common.search':'بحث',
  'common.total':'المجموع','common.currency':'د.أ.','common.yes':'نعم','common.no':'لا',
  'common.loading':'جارٍ التحميل…','common.viewAll':'عرض الكل',
  'topbar.greeting':'مرحباً بعودتك','sidebar.verified':'موثّق',
  'home.greeting.morning':'صباح الخير','home.greeting.afternoon':'مساء الخير','home.greeting.evening':'مساء النور',
  'home.subtitle':'إ��يك نظرة عامة على أعمالك.','home.totalSales':'إجمالي المبيعات',
  'home.totalRevenue':'إجمالي الإيرادات','home.netProfit':'صافي الربح',
  'home.totalExpenses':'إجمالي المصروفات','home.cashBalance':'الرصيد النقدي','home.stockValue':'قيمة المخزون',
  'home.businessHealth':'صحة الأعمال','home.fullStatement':'الكشف الكامل',
  'home.topInsight':'الرؤية الرئيسية','home.forecasts':'التوقعات','home.forecastDays':'30 يوم',
  'home.insight.profitMargin':'هامش الربح','home.insight.healthy':'جيد بنسبة 29%',
  'home.insight.runsOut':'ينفد خلال ~','home.insight.days':'أيام',
  'home.insight.revenue':'من الإيرادات','home.insight.diversify':'— نوّع',
  'home.insight.cashRunway':'��لتدفق النقدي','home.insight.strong':'قوي خلال ~45 يوم',
  'sale.title':'ت��جيل بيع','sale.cash':'نق��اً','sale.transfer':'تحويل','sale.card':'بطاقة',
  'sale.completeSale':'إتمام البيع','sale.saleComplete':'اكتمل البيع!',
  'product.title':'إضافة منتج','product.name':'اسم المنتج',
  'product.sellingPrice':'سعر البيع','product.costPrice':'سعر التكلفة','product.save':'حفظ المنتج',
  'expense.title':'إضافة مصروف','expense.record':'تسجيل المصروف',
  'cashflow.title':'التدفق النقدي','cashflow.addStock':'إضافة مخزون','cashflow.reduceStock':'تخفيض المخزون',
  'cashflow.addMoney':'إضافة مال','cashflow.takeMoney':'سحب مال',
  'statement.title':'الملخص وكشف الحساب','statement.downloadPdf':'تحميل PDF',
  'settings.title':'الإعدادات','settings.language':'لغة العرض',
  'settings.languageDesc':'اختر اللغة المستخدمة في لوحة تحكم Busmo.',
  'settings.theme':'المظهر','settings.themeLight':'فاتح','settings.themeDark':'داكن',
  'settings.changesSaved':'تم حفظ التغييرات','settings.logout':'تسجيل الخروج','settings.saved':'تم الحفظ',
  'mo.title':'اسأل MO','mo.placeholder':'اسأل MO أي شيء عن أعمالك…','mo.send':'إرسال',
};

// ════════════════════════════════════════════════════════
//  ZULU (zu)
// ════════════════════════════════════════════════════════
const zu: TranslationDict = {
  ...en,
  'nav.home':'Ikhaya','nav.recordSale':'Bhala Ukuthengisa','nav.addProduct':'Engeza Umkhiqizo',
  'nav.addExpense':'Engeza Izindleko','nav.cashflow':'Ukugeleza Kwemali','nav.statement':'Izitatimende',
  'nav.reports':'Izibalo','nav.bankReconciliation':'Ukulinganisa Kwabenki','nav.moneyControl':'Lawula Imali',
  'nav.salesHistory':'Umlando Wokuthengisa','nav.inventory':'Ukubalwa Kwempahla','nav.expenses':'Izindleko',
  'nav.capital':'Inkunzi','nav.referrals':'Izincomo','nav.askMO':'Buza MO',
  'nav.services':'Izinsizakalo','nav.staff':'Abasebenzi','nav.settings':'Izilungiselelo',
  'nav.market':'Imakethe','nav.section.main':'Oyinhloko','nav.section.money':'Imali',
  'nav.section.team':'Ithimba','nav.section.grow':'Ukukhula','nav.section.account':'I-akhawunti',
  'branch.switcher.label':'Isigaba:','branch.switcher.allBranches':'Zonke Izigaba',
  'common.save':'Gcina','common.cancel':'Khansela','common.confirm':'Qinisekisa',
  'common.close':'Vala','common.back':'Buyela','common.search':'Sesha',
  'common.total':'Isamba','common.currency':'R',
  'topbar.greeting':'Wamukelwa futhi','sidebar.verified':'Kuqinisekisiwe',
  'home.greeting.morning':'Sawubona ekuseni','home.greeting.afternoon':'Sawubona ntambama','home.greeting.evening':'Sawubona ebusuku',
  'home.subtitle':'Nansi isifinyezo seshishini lakho.','home.totalSales':'Isamba Sokuthengisa',
  'home.totalRevenue':'Isamba Semali Engenayo','home.netProfit':'Inzuzo Ehlanzekile',
  'home.totalExpenses':'Isamba Sezindleko','home.cashBalance':'Insali Yemali','home.stockValue':'Inani Lempahla',
  'home.businessHealth':'Impilo Yebhizinisi','home.fullStatement':'Isitatimende Esiphelele',
  'home.topInsight':'Ukuqonda Okuphezulu','home.forecasts':'Ukubikezela','home.forecastDays':'Izinsuku ezingu-30',
  'home.insight.profitMargin':'Umphumela','home.insight.healthy':'muhle ku-29%',
  'home.insight.runsOut':'kuphela kungakapheli ~','home.insight.days':'izinsuku',
  'home.insight.revenue':'yemali engenayo','home.insight.diversify':'— hlukahlukene',
  'home.insight.cashRunway':'Ukugeleza kwemali','home.insight.strong':'kuqinile ezinsukwini ezingu-~45',
  'sale.title':'Bhala Ukuthengisa','sale.cash':'Imali','sale.transfer':'Ukudlulisa','sale.card':'Ikhadi',
  'sale.completeSale':'Qeda Ukuthengisa','sale.saleComplete':'Ukuthengisa Kuqediwe!',
  'product.title':'Engeza Umkhiqizo','product.name':'Igama Lomkhiqizo',
  'product.sellingPrice':'Intengo Yokuthengisa','product.costPrice':'Intengo Yokuthenga','product.save':'Gcina Umkhiqizo',
  'expense.title':'Engeza Izindleko','expense.record':'Bhala Izindleko',
  'cashflow.title':'Ukugeleza Kwemali','cashflow.addStock':'Engeza Impahla','cashflow.reduceStock':'Nciphisa Impahla',
  'cashflow.addMoney':'Engeza Imali','cashflow.takeMoney':'Thatha Imali',
  'statement.title':'Isifinyezo & Izitatimende','statement.downloadPdf':'Landa PDF',
  'settings.title':'Izilungiselelo','settings.language':'Ulimi Lokukhombisa',
  'settings.languageDesc':'Khetha ulimi olusetshenziswa kuyo yonke i-dashboard ye-Busmo.',
  'settings.theme':'Isakhiwo','settings.themeLight':'Ukukhanya','settings.themeDark':'Ubumnyama',
  'settings.changesSaved':'Izinguquko zigilindwe','settings.logout':'Phuma','settings.saved':'Kugilindwe',
  'mo.title':'Buza MO','mo.placeholder':'Buza MO noma yini mayelana neshishini lakho…','mo.send':'Thumela',
};

// ════════════════════════════════════════════════════════
//  AFRIKAANS (af)
// ════════════════════════════════════════════════════════
const af: TranslationDict = {
  ...en,
  'nav.home':'Tuis','nav.recordSale':'Teken Verkoop','nav.addProduct':'Voeg Produk By',
  'nav.addExpense':'Voeg Uitgawe By','nav.cashflow':'Kontantvloei','nav.statement':'Finansiële Staat',
  'nav.reports':'Verslae','nav.bankReconciliation':'Bank Versoening','nav.moneyControl':'Geld Beheer',
  'nav.salesHistory':'Verkoopgeskiedenis','nav.inventory':'Voorraad','nav.expenses':'Uitgawes',
  'nav.capital':'Kapitaal','nav.referrals':'Verwysings','nav.askMO':'Vra MO',
  'nav.services':'Dienste','nav.staff':'Personeel','nav.settings':'Instellings',
  'nav.market':'Markplek','nav.section.main':'Hoofmenu','nav.section.money':'Geld',
  'nav.section.team':'Span','nav.section.grow':'Groei','nav.section.account':'Rekening',
  'branch.switcher.label':'Tak:','branch.switcher.allBranches':'Alle Takke',
  'common.save':'Stoor','common.cancel':'Kanselleer','common.confirm':'Bevestig',
  'common.close':'Sluit','common.back':'Terug','common.search':'Soek',
  'common.total':'Totaal','common.currency':'R','common.yes':'Ja','common.no':'Nee',
  'common.loading':'Laai tans…','common.viewAll':'Sien Alles',
  'topbar.greeting':'Welkom terug','sidebar.verified':'Geverifieer','sidebar.viewProfile':'Sien Profiel',
  'home.greeting.morning':'Goeie more','home.greeting.afternoon':'Goeie middag','home.greeting.evening':'Goeie naand',
  'home.subtitle':'Hier is u besigheid in oorsig.','home.totalSales':'Totale Verkope',
  'home.totalRevenue':'Totale Inkomste','home.netProfit':'Netto Wins',
  'home.totalExpenses':'Totale Uitgawes','home.cashBalance':'Kontantsaldo','home.stockValue':'Voorraadwaarde',
  'home.quickActions':'Vinnige Aksies','home.recentSales':'Onlangse Verkope','home.topProducts':'Topprodukte',
  'home.vsLastMonth':'vs verlede maand','home.noSalesYet':'Nog geen verkope vandag nie.',
  'sale.title':'Teken Verkoop','sale.cash':'Kontant','sale.transfer':'Oorbetaling','sale.card':'Kaart',
  'sale.completeSale':'Voltooi Verkoop','sale.saleComplete':'Verkoop Voltooi!',
  'sale.quantity':'Hoeveelheid','sale.grandTotal':'Groottotaal','sale.paymentMethod':'Betaalmetode',
  'product.title':'Voeg Produk By','product.name':'Produknaam',
  'product.sellingPrice':'Verkoopprys','product.costPrice':'Kosprys','product.save':'Stoor Produk',
  'product.saved':'Produk suksesvol gestoor','product.unit':'Eenheid','product.margin':'Winsgrens',
  'expense.title':'Voeg Uitgawe By','expense.record':'Teken Uitgawe','expense.recorded':'Uitgawe suksesvol geteken',
  'cashflow.title':'Kontantvloei','cashflow.cashBalance':'Kontantsaldo','cashflow.stockValue':'Voorraadwaarde',
  'cashflow.monthIn':'Hierdie Maand In','cashflow.monthOut':'Hierdie Maand Uit',
  'cashflow.addStock':'Voeg Voorraad By','cashflow.reduceStock':'Verminder Voorraad',
  'cashflow.addMoney':'Voeg Geld By','cashflow.takeMoney':'Neem Geld',
  'cashflow.addStockDesc':'Nuwe voorraad beskrywing','cashflow.reduceStockDesc':'Voorraad vermindering - beskadiging, diefstal',
  'cashflow.addMoneyDesc':'Geld inkomende beskrywing - verkope, lenings','cashflow.takeMoneyDesc':'Geld uitgaande beskrywing - onttrekkings, betalings',
  'cashflow.recentTransactions':'Onlangse Transaksies','cashflow.viewStatement':'Sien Volledige Staat →',
  'cashflow.noTransactions':'Geen transaksies','cashflow.addTransactionsFirst':'Neem u eerste transaksie',
  'cashflow.confirmAddStock':'Bevestig Voeg Voorraad By','cashflow.confirmReduceStock':'Bevestig Vermindering',
  'cashflow.recordIncoming':'Teken Inkomende Geld','cashflow.recordOutgoing':'Teken Uitgaande Geld',
  'cashflow.loan':'Lening','cashflow.investment':'Belegging','cashflow.personal':'Persoonlik','cashflow.other':'Ander',
  'statement.title':'Opsomming & Finansiële Staat','statement.downloadPdf':'Laai PDF af',
  'statement.totalRevenue':'Totale Inkomste','statement.totalExpenses':'Totale Uitgawes',
  'statement.netProfit':'Netto Wins','statement.closingStock':'Sluitende Voorraadwaarde',
  'settings.title':'Instellings','settings.subtitle':'Bestuur u rekening, besigheidsprofiel en voorkeure.',
  'settings.section.language':'Taal','settings.section.appearance':'Voorkoms',
  'settings.section.account':'Rekening & Profiel','settings.section.notifications':'Kennisgewings',
  'settings.section.privacy':'Privaatheid & Data','settings.section.business':'Besigheidsprofiel',
  'settings.language':'Vertaaltaal','settings.languageDesc':'Kies die taal wat deur die hele Busmo-paneelbord gebruik word.',
  'settings.theme':'Tema','settings.themeLight':'Lig','settings.themeDark':'Donker','settings.themeAuto':'Stelsel',
  'settings.themeDesc':'Kies hoe Busmo op u toestel lyk.',
  'settings.businessName':'Besigheidsnaam','settings.businessCategory':'Besigheidskategorie',
  'settings.businessPhone':'Telefoonnommer','settings.businessEmail':'Besigheids-e-pos',
  'settings.businessAddress':'Besigheidsadres','settings.businessCountry':'Land',
  'settings.currency':'Geldeenheid','settings.currencyDesc':'Geldeenheid wat in u paneelbord vertoon word.',
  'settings.notifSales':'Nuwe Verkoopkennisgewings','settings.notifExpenses':'Uitgaweherinneringe',
  'settings.notifLowStock':'Lae Voorraadwaarskuwings','settings.notifWeeklySummary':'Weeklikse Opsomming',
  'settings.notifMarketing':'Wenke & Kenmerksopdaterings',
  'settings.privacyAnalytics':'Deel Gebruiksdata','settings.privacyAnalyticsDesc':'Help om Busmo te verbeter deur anonieme data te deel.',
  'settings.deleteData':'Vee My Data Uit','settings.deleteDataDesc':'Vee u rekening en alle data permanent uit.',
  'settings.saved':'Gestoor','settings.changesSaved':'Wysigings gestoor',
  'settings.version':'Weergawe','settings.logout':'Teken Uit',
  'settings.logoutConfirm':'Is u seker u wil uitteken?','settings.plan':'Huidige Plan','settings.upgradePlan':'Gradeer Op',
  'mo.title':'Vra MO','mo.placeholder':'Vra MO enigiets oor u besigheid…','mo.send':'Stuur',
  'mo.thinking':'MO dink na…','mo.greeting':'Hallo! Ek is MO, u Busmo-sakekonsultant. Hoe kan ek u vandag help?',
  'staff.title':'Personeel','staff.subtitle':'Bestuur u span en volg werkverrigting.','staff.addMember':'Voeg Lid By',
  'staff.revenue':'Inkomste','staff.transactions':'Transaksies','staff.role':'Rol',
  'services.title':'Dienste','services.subtitle':'Professionele besigheidsdienste om u te help groei.',
  'services.getStarted':'Begin','services.from':'Vanaf','services.delivery':'Leweringstyd',
  'capital.title':'Kapitaal','capital.subtitle':'Kry toegang tot befondsing, lenings en beleggingsgeleenthede.',
  'capital.apply':'Doen Aansoek','capital.checklist':'Geskiktheidslys',
  'capital.eligibility':'Geskiktheid','capital.amount':'Leningsbedrag','capital.rate':'Rentekoers',
  'referrals.title':'Verwysings','referrals.subtitle':'Nooi besighede uit en verdien belonings.',
  'referrals.yourCode':'U Verwysningskode','referrals.copy':'Kopieer Kode',
  'referrals.share':'Deel','referrals.earned':'Verdien','referrals.friends':'Verwysings',
};

// ── Master export ──────────────────────────────────────────────────
export const TRANSLATIONS: Record<LangCode, TranslationDict> = {
  en, fr, ha, sw, yo, ig, am, ar, zu, af,
};
