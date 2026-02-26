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
  { code:'en', name:'English',   englishName:'English',   flag:'🌐', rtl:false, region:'Global' },
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
  'nav.salesHistory':string; 'nav.inventory':string; 'nav.expenses':string;
  'nav.capital':string; 'nav.referrals':string; 'nav.askMO':string;
  'nav.services':string; 'nav.staff':string; 'nav.settings':string;
  'nav.market':string; 'nav.pay':string;
  'nav.section.main':string; 'nav.section.money':string;
  'nav.section.team':string; 'nav.section.grow':string; 'nav.section.account':string;
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
  'common.currency':string;
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
  // Sale
  'sale.title':string; 'sale.subtitle':string; 'sale.selectProducts':string;
  'sale.cart':string; 'sale.emptyCart':string; 'sale.addToCart':string;
  'sale.quantity':string; 'sale.subtotal':string; 'sale.discount':string;
  'sale.grandTotal':string; 'sale.paymentMethod':string; 'sale.cash':string;
  'sale.transfer':string; 'sale.card':string; 'sale.completeSale':string;
  'sale.saleComplete':string; 'sale.change':string; 'sale.amountPaid':string;
  'sale.customer':string; 'sale.addCustomer':string;
  // Product
  'product.title':string; 'product.subtitle':string; 'product.basicInfo':string;
  'product.name':string; 'product.sku':string; 'product.category':string;
  'product.description':string; 'product.pricing':string; 'product.sellingPrice':string;
  'product.costPrice':string; 'product.openingStock':string; 'product.lowStockAlert':string;
  'product.expiryTracking':string; 'product.variants':string; 'product.images':string;
  'product.salesMode':string; 'product.delivery':string; 'product.save':string;
  'product.saved':string; 'product.unit':string; 'product.margin':string; 'product.perUnit':string;
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
  'cashflow.recentTransactions':string; 'cashflow.viewStatement':string;
  'cashflow.confirmAddStock':string; 'cashflow.confirmReduceStock':string;
  'cashflow.recordIncoming':string; 'cashflow.recordOutgoing':string;
  // Statement
  'statement.title':string; 'statement.subtitle':string; 'statement.period':string;
  'statement.type':string; 'statement.verified':string; 'statement.verifyAt':string;
  'statement.totalRevenue':string; 'statement.totalExpenses':string; 'statement.netProfit':string;
  'statement.closingStock':string; 'statement.profitLoss':string; 'statement.grossRevenue':string;
  'statement.cogs':string; 'statement.grossProfit':string; 'statement.netProfitAfterCosts':string;
  'statement.ownerDrawings':string; 'statement.ledger':string; 'statement.inventory':string;
  'statement.downloadPdf':string; 'statement.preparing':string; 'statement.pdfTip':string;
  'statement.vsLastMonth':string; 'statement.productsTracked':string;
  // MO
  'mo.title':string; 'mo.subtitle':string; 'mo.placeholder':string;
  'mo.send':string; 'mo.thinking':string; 'mo.greeting':string;
  // Staff
  'staff.title':string; 'staff.subtitle':string; 'staff.addMember':string;
  'staff.revenue':string; 'staff.transactions':string; 'staff.role':string;
  // Services
  'services.title':string; 'services.subtitle':string;
  'services.getStarted':string; 'services.from':string; 'services.delivery':string;
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
  'settings.language':string; 'settings.languageDesc':string;
  'settings.theme':string; 'settings.themeLight':string;
  'settings.themeDark':string; 'settings.themeAuto':string; 'settings.themeDesc':string;
  'settings.businessName':string; 'settings.businessCategory':string;
  'settings.businessPhone':string; 'settings.businessEmail':string;
  'settings.businessAddress':string; 'settings.businessCountry':string;
  'settings.currency':string; 'settings.currencyDesc':string;
  'settings.notifSales':string; 'settings.notifExpenses':string;
  'settings.notifLowStock':string; 'settings.notifWeeklySummary':string;
  'settings.notifMarketing':string;
  'settings.privacyAnalytics':string; 'settings.privacyAnalyticsDesc':string;
  'settings.deleteData':string; 'settings.deleteDataDesc':string;
  'settings.saved':string; 'settings.changesSaved':string; 'settings.version':string;
  'settings.logout':string; 'settings.logoutConfirm':string;
  'settings.plan':string; 'settings.upgradePlan':string;
};

// ════════════════════════════════════════════════════════
//  ENGLISH (en) — Master / Default
// ════════════════════════════════════════════════════════
const en: TranslationDict = {
  'nav.home':'Home','nav.recordSale':'Record Sale','nav.addProduct':'Add Product',
  'nav.addExpense':'Add Expense','nav.cashflow':'Cashflow','nav.statement':'Statement',
  'nav.salesHistory':'Sales History','nav.inventory':'Inventory','nav.expenses':'Expenses',
  'nav.capital':'Capital','nav.referrals':'Referrals','nav.askMO':'Ask MO',
  'nav.services':'Services','nav.staff':'Staff','nav.settings':'Settings',
  'nav.market':'Marketplace','nav.pay':'BusmoPay',
  'nav.section.main':'Main','nav.section.money':'Money',
  'nav.section.team':'Team','nav.section.grow':'Grow','nav.section.account':'Account',
  'common.save':'Save','common.cancel':'Cancel','common.confirm':'Confirm',
  'common.close':'Close','common.back':'Back','common.edit':'Edit',
  'common.delete':'Delete','common.add':'Add','common.search':'Search',
  'common.filter':'Filter','common.loading':'Loading…','common.viewAll':'View All',
  'common.download':'Download','common.print':'Print','common.upload':'Upload',
  'common.submit':'Submit','common.yes':'Yes','common.no':'No',
  'common.optional':'optional','common.required':'required','common.select':'Select',
  'common.saveDraft':'Save as Draft','common.draft':'Draft','common.success':'Success',
  'common.error':'Error','common.today':'Today','common.total':'Total','common.currency':'₦',
  'topbar.greeting':'Welcome back','topbar.toggleTheme':'Toggle theme','topbar.notifications':'Notifications',
  'sidebar.verified':'Verified','sidebar.viewProfile':'View Profile',
  'home.greeting.morning':'Good morning','home.greeting.afternoon':'Good afternoon','home.greeting.evening':'Good evening',
  'home.subtitle':"Here's your business at a glance.",'home.totalSales':'Total Sales',
  'home.totalRevenue':'Total Revenue','home.netProfit':'Net Profit','home.totalExpenses':'Total Expenses',
  'home.transactions':'Transactions','home.cashBalance':'Cash Balance','home.stockValue':'Stock Value',
  'home.quickActions':'Quick Actions','home.recentSales':'Recent Sales','home.topProducts':'Top Products',
  'home.vsLastMonth':'vs last month','home.noSalesYet':'No sales yet today.',
  'sale.title':'Record Sale','sale.subtitle':'Select products and record a manual sale.',
  'sale.selectProducts':'Select Products','sale.cart':'Cart','sale.emptyCart':'Your cart is empty. Add products above.',
  'sale.addToCart':'Add to Cart','sale.quantity':'Quantity','sale.subtotal':'Subtotal',
  'sale.discount':'Discount','sale.grandTotal':'Grand Total','sale.paymentMethod':'Payment Method',
  'sale.cash':'Cash','sale.transfer':'Transfer','sale.card':'Card',
  'sale.completeSale':'Complete Sale','sale.saleComplete':'Sale Completed!',
  'sale.change':'Change','sale.amountPaid':'Amount Paid',
  'sale.customer':'Customer','sale.addCustomer':'Add Customer (optional)',
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
  'cashflow.addStock':'Add Stock','cashflow.reduceStock':'Reduce Stock',
  'cashflow.addMoney':'Add Money','cashflow.takeMoney':'Take Money',
  'cashflow.recentTransactions':'Recent Transactions','cashflow.viewStatement':'View Full Statement →',
  'cashflow.confirmAddStock':'Confirm Add Stock','cashflow.confirmReduceStock':'Confirm Stock Reduction',
  'cashflow.recordIncoming':'Record Incoming Money','cashflow.recordOutgoing':'Record Outgoing Money',
  'statement.title':'Summary & Statement','statement.subtitle':'Your verified business financial record. Can be used for loan applications and partner verification.',
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
  'mo.title':'Ask MO','mo.subtitle':'Your AI business advisor, powered by Busmo.',
  'mo.placeholder':'Ask MO anything about your business…','mo.send':'Send',
  'mo.thinking':'MO is thinking…',"mo.greeting":"Hi! I'm MO, your Busmo business advisor. How can I help you today?",
  'staff.title':'Staff','staff.subtitle':'Manage your team and track performance.',
  'staff.addMember':'Add Staff Member','staff.revenue':'Revenue',
  'staff.transactions':'Transactions','staff.role':'Role',
  'services.title':'Services','services.subtitle':'Expert business services to help you grow.',
  'services.getStarted':'Get Started','services.from':'From','services.delivery':'Delivery',
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
  'settings.language':'Display Language','settings.languageDesc':'Choose the language used across the entire Busmo dashboard.',
  'settings.theme':'Theme','settings.themeLight':'Light','settings.themeDark':'Dark',
  'settings.themeAuto':'System','settings.themeDesc':'Choose how Busmo looks on your device.',
  'settings.businessName':'Business Name','settings.businessCategory':'Business Category',
  'settings.businessPhone':'Phone Number','settings.businessEmail':'Business Email',
  'settings.businessAddress':'Business Address','settings.businessCountry':'Country',
  'settings.currency':'Currency','settings.currencyDesc':'Currency displayed across your dashboard.',
  'settings.notifSales':'New Sale Notifications','settings.notifExpenses':'Expense Reminders',
  'settings.notifLowStock':'Low Stock Alerts','settings.notifWeeklySummary':'Weekly Summary Email',
  'settings.notifMarketing':'Tips & Feature Updates',
  'settings.privacyAnalytics':'Share Usage Analytics','settings.privacyAnalyticsDesc':'Help improve Busmo by sharing anonymous usage data.',
  'settings.deleteData':'Delete My Data','settings.deleteDataDesc':'Permanently delete your account and all data.',
  'settings.saved':'Saved','settings.changesSaved':'Changes saved successfully',
  'settings.version':'Version','settings.logout':'Log Out',
  'settings.logoutConfirm':'Are you sure you want to log out?',
  'settings.plan':'Current Plan','settings.upgradePlan':'Upgrade Plan',
};

// ════════════════════════════════════════════════════════
//  FRENCH (fr)
// ════════════════════════════════════════════════════════
const fr: TranslationDict = {
  ...en,
  'nav.home':'Accueil','nav.recordSale':'Enregistrer Vente','nav.addProduct':'Ajouter Produit',
  'nav.addExpense':'Ajouter Dépense','nav.cashflow':'Trésorerie','nav.statement':'Relevé',
  'nav.salesHistory':'Historique des Ventes','nav.inventory':'Inventaire','nav.expenses':'Dépenses',
  'nav.capital':'Capital','nav.referrals':'Parrainages','nav.askMO':'Demander à MO',
  'nav.services':'Services','nav.staff':'Personnel','nav.settings':'Paramètres',
  'nav.market':'Marché','nav.pay':'BusmoPay',
  'nav.section.main':'Principal','nav.section.money':'Argent',
  'nav.section.team':'Équipe','nav.section.grow':'Croissance','nav.section.account':'Compte',
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
  'sale.title':'Enregistrer une Vente','sale.subtitle':'Sélectionnez des produits et enregistrez une vente.',
  'sale.selectProducts':'Sélectionner les Produits','sale.cart':'Panier',
  'sale.emptyCart':'Votre panier est vide.','sale.addToCart':'Ajouter au Panier',
  'sale.quantity':'Quantité','sale.subtotal':'Sous-total','sale.discount':'Remise',
  'sale.grandTotal':'Total Général','sale.paymentMethod':'Mode de Paiement',
  'sale.cash':'Espèces','sale.transfer':'Virement','sale.card':'Carte',
  'sale.completeSale':'Finaliser la Vente','sale.saleComplete':'Vente Finalisée !',
  'sale.change':'Monnaie','sale.amountPaid':'Montant Payé',
  'sale.customer':'Client','sale.addCustomer':'Ajouter un Client (facultatif)',
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
  'cashflow.addStock':'Ajouter du Stock','cashflow.reduceStock':'Réduire le Stock',
  "cashflow.addMoney":"Ajouter de l'Argent",'cashflow.takeMoney':"Retirer de l'Argent",
  'cashflow.recentTransactions':'Transactions Récentes','cashflow.viewStatement':'Voir le Relevé Complet →',
  "cashflow.confirmAddStock":"Confirmer l'Ajout de Stock",'cashflow.confirmReduceStock':'Confirmer la Réduction de Stock',
  'cashflow.recordIncoming':'Enregistrer Entrée','cashflow.recordOutgoing':'Enregistrer Sortie',
  'statement.title':'Résumé & Relevé','statement.subtitle':'Votre relevé financier vérifié. Utilisable pour les demandes de prêt.',
  'statement.period':'Période','statement.type':'Type de Relevé',
  'statement.verified':'Relevé Vérifié Busmo.','statement.verifyAt':'Vérifiez sur busmo.io/verify',
  'statement.totalRevenue':'Revenus Totaux','statement.totalExpenses':'Dépenses Totales',
  'statement.netProfit':'Bénéfice Net','statement.closingStock':'Valeur du Stock Final',
  'statement.profitLoss':'Résumé Profits & Pertes',"statement.grossRevenue":"Chiffre d'Affaires Total",
  'statement.cogs':'Coût des Marchandises Vendues','statement.grossProfit':'Bénéfice Brut',
  'statement.netProfitAfterCosts':'Bénéfice Net (Après Coûts)','statement.ownerDrawings':'Retraits du Propriétaire',
  'statement.ledger':'Grand Livre des Transactions','statement.inventory':"Résumé de l'Inventaire",
  'statement.downloadPdf':'Télécharger PDF','statement.preparing':'Préparation…',
  'statement.pdfTip':'Choisissez "Enregistrer en PDF" dans la boîte de dialogue',
  'statement.vsLastMonth':'vs mois dernier','statement.productsTracked':'produits suivis',
  'mo.title':'Demander à MO','mo.subtitle':'Votre conseiller commercial IA, propulsé par Busmo.',
  'mo.placeholder':'Posez une question à MO sur votre activité…','mo.send':'Envoyer',
  'mo.thinking':'MO réfléchit…','mo.greeting':'Bonjour ! Je suis MO, votre conseiller Busmo. Comment puis-je vous aider ?',
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
};

// ════════════════════════════════════════════════════════
//  HAUSA (ha)
// ════════════════════════════════════════════════════════
const ha: TranslationDict = {
  ...en,
  'nav.home':'Gida','nav.recordSale':'Rubuta Siyarwa','nav.addProduct':'Ƙara Kaya',
  'nav.addExpense':'Ƙara Kashe-kashe','nav.cashflow':'Kuɗin Shiga da Fita','nav.statement':'Rahoton Kuɗi',
  'nav.salesHistory':'Tarihin Siyarwa','nav.inventory':'Kayan Ajiya','nav.expenses':'Kashe-kashe',
  'nav.capital':'Jari','nav.referrals':'Shawarwari','nav.askMO':'Tambaya MO',
  'nav.services':'Ayyuka','nav.staff':"Ma'aikata",'nav.settings':'Saiti',
  'nav.market':'Kasuwa','nav.section.main':'Babba','nav.section.money':'Kuɗi',
  'nav.section.team':'Ƙungiya','nav.section.grow':'Ci Gaba','nav.section.account':'Asusun',
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
  'sale.title':'Rubuta Siyarwa','sale.cash':'Naira','sale.transfer':'Canja Wuri','sale.card':'Kati',
  'sale.completeSale':'Kammala Siyarwa','sale.saleComplete':'An Kammala Siyarwa!',
  'sale.quantity':'Yawa','sale.grandTotal':'Jimila Gaba Ɗaya','sale.paymentMethod':'Hanyar Biyan Kuɗi',
  'product.title':'Ƙara Kaya','product.name':'Sunan Kaya','product.sellingPrice':'Farashin Siyarwa',
  'product.costPrice':'Farashin Saya','product.save':'Ajiye Kaya','product.saved':'An ajiye kaya cikin nasara',
  'expense.title':'Ƙara Kashe-kashe','expense.record':'Rubuta Kashe-kashe','expense.recorded':'An rubuta kashe-kashe cikin nasara',
  'cashflow.title':'Kuɗin Shiga da Fita','cashflow.cashBalance':'Kuɗin Hannun','cashflow.stockValue':'Darajar Kaya',
  'cashflow.monthIn':'Kuɗin da Ya Shigo Wannan Wata','cashflow.monthOut':'Kuɗin da Ya Fita Wannan Wata',
  'cashflow.addStock':'Ƙara Kaya','cashflow.reduceStock':'Rage Kaya','cashflow.addMoney':'Ƙara Kuɗi','cashflow.takeMoney':'Ɗauki Kuɗi',
  'cashflow.recentTransactions':"Ma'amalolin Kwanan Nan",'cashflow.viewStatement':'Duba Cikakken Rahoto →',
  'cashflow.confirmAddStock':'Tabbatar da Ƙara Kaya','cashflow.confirmReduceStock':'Tabbatar da Rage Kaya',
  'cashflow.recordIncoming':'Rubuta Kuɗin Shigowa','cashflow.recordOutgoing':'Rubuta Kuɗin Fita',
  'statement.title':'Taƙaitaccen Rahoto','statement.downloadPdf':'Sauke PDF',
  'statement.totalRevenue':'Jimilar Kuɗin Shiga','statement.totalExpenses':'Jimilar Kashe-kashe',
  'statement.netProfit':'Riba ta Gaskiya','statement.closingStock':'Darajar Kayan Rufe',
  'settings.title':'Saiti','settings.language':'Yaren Nuni',
  'settings.languageDesc':'Zaɓi yaren da ake amfani da shi a duk faɗin allunan Busmo.',
  'settings.theme':'Siga','settings.themeLight':'Haske','settings.themeDark':'Duhu',
  'settings.changesSaved':'An ajiye canje-canje cikin nasara','settings.logout':'Fita',
  'settings.saved':'An Ajiye','settings.plan':'Tsarin Yanzu','settings.upgradePlan':'Inganta Tsari',
  'mo.title':'Tambaya MO','mo.placeholder':'Yi wa MO tambaya game da kasuwancinka…','mo.send':'Aika',
  'mo.thinking':'MO yana tunanin…','mo.greeting':'Sannu! Ni ne MO, mai ba ka shawara na Busmo. Yaya zan taimake ka yau?',
  'staff.title':"Ma'aikata",'staff.addMember':"Ƙara Ma'aikaci",'staff.revenue':'Kuɗin Shiga',
  'referrals.title':'Shawarwari','referrals.yourCode':'Lambar Shawararka',
};

// ════════════════════════════════════════════════════════
//  SWAHILI (sw)
// ════════════════════════════════════════════════════════
const sw: TranslationDict = {
  ...en,
  'nav.home':'Nyumbani','nav.recordSale':'Rekodi Mauzo','nav.addProduct':'Ongeza Bidhaa',
  'nav.addExpense':'Ongeza Gharama','nav.cashflow':'Mtiririko wa Fedha','nav.statement':'Taarifa ya Fedha',
  'nav.salesHistory':'Historia ya Mauzo','nav.inventory':'Hesabu ya Bidhaa','nav.expenses':'Gharama',
  'nav.capital':'Mtaji','nav.referrals':'Mapendekezo','nav.askMO':'Uliza MO',
  'nav.services':'Huduma','nav.staff':'Wafanyakazi','nav.settings':'Mipangilio',
  'nav.market':'Soko','nav.section.main':'Kuu','nav.section.money':'Fedha',
  'nav.section.team':'Timu','nav.section.grow':'Kukua','nav.section.account':'Akaunti',
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
  'sale.title':'Rekodi Mauzo','sale.cash':'Taslimu','sale.transfer':'Uhamisho','sale.card':'Kadi',
  'sale.completeSale':'Kamilisha Mauzo','sale.saleComplete':'Mauzo Yamekamilika!',
  'sale.quantity':'Idadi','sale.grandTotal':'Jumla Kuu','sale.paymentMethod':'Njia ya Malipo',
  'product.title':'Ongeza Bidhaa','product.name':'Jina la Bidhaa',
  'product.sellingPrice':'Bei ya Kuuza','product.costPrice':'Bei ya Kununua',
  'product.save':'Hifadhi Bidhaa','product.saved':'Bidhaa imehifadhiwa',
  'expense.title':'Ongeza Gharama','expense.record':'Rekodi Gharama','expense.recorded':'Gharama imerekodiwa',
  'cashflow.title':'Mtiririko wa Fedha','cashflow.cashBalance':'Salio la Fedha','cashflow.stockValue':'Thamani ya Hisa',
  'cashflow.monthIn':'Ziingialo Mwezi Huu','cashflow.monthOut':'Zitokalo Mwezi Huu',
  'cashflow.addStock':'Ongeza Hisa','cashflow.reduceStock':'Punguza Hisa',
  'cashflow.addMoney':'Ongeza Fedha','cashflow.takeMoney':'Chukua Fedha',
  'cashflow.recentTransactions':'Miamala ya Hivi Karibuni','cashflow.viewStatement':'Ona Taarifa Kamili →',
  'cashflow.confirmAddStock':'Thibitisha Kuongeza Hisa','cashflow.confirmReduceStock':'Thibitisha Kupunguza Hisa',
  'cashflow.recordIncoming':'Rekodi Fedha Zinazoingia','cashflow.recordOutgoing':'Rekodi Fedha Zinazotoka',
  'statement.title':'Muhtasari & Taarifa','statement.downloadPdf':'Pakua PDF',
  'statement.totalRevenue':'Jumla ya Mapato','statement.totalExpenses':'Jumla ya Gharama',
  'statement.netProfit':'Faida Halisi','statement.closingStock':'Thamani ya Hisa ya Mwisho',
  'settings.title':'Mipangilio','settings.language':'Lugha ya Onyesho',
  'settings.languageDesc':'Chagua lugha inayotumiwa katika dashibodi nzima ya Busmo.',
  'settings.theme':'Mandhari','settings.themeLight':'Mwanga','settings.themeDark':'Giza',
  'settings.changesSaved':'Mabadiliko yamehifadhiwa','settings.logout':'Toka','settings.saved':'Imehifadhiwa',
  'mo.title':'Uliza MO','mo.placeholder':'Uliza MO chochote kuhusu biashara yako…','mo.send':'Tuma',
  'mo.thinking':'MO anafikiri…','mo.greeting':'Habari! Mimi ni MO, mshauri wako wa Busmo. Ninawezaje kukusaidia leo?',
  'staff.title':'Wafanyakazi','staff.addMember':'Ongeza Mwanachama','staff.revenue':'Mapato',
  'referrals.title':'Mapendekezo','referrals.yourCode':'Nambari Yako ya Mapendekezo',
};

// ════════════════════════════════════════════════════════
//  YORUBA (yo)
// ════════════════════════════════════════════════════════
const yo: TranslationDict = {
  ...en,
  'nav.home':'Ile','nav.recordSale':'Gbasilẹ Tita','nav.addProduct':'Fi Ọja Kun',
  'nav.addExpense':'Fi Inawo Kun','nav.cashflow':'Ṣiṣan Owo','nav.statement':'Ìdánimọ Owo',
  'nav.salesHistory':'Itan Tita','nav.inventory':'Akojọ Ọja','nav.expenses':'Inawo',
  'nav.capital':'Olu-owo','nav.referrals':'Itọkasi','nav.askMO':'Beere MO',
  'nav.services':'Iṣẹ','nav.staff':'Awọn Oṣiṣẹ','nav.settings':'Ètò',
  'nav.market':'Ọja','nav.section.main':'Akọkọ','nav.section.money':'Owo',
  'nav.section.team':'Ẹgbẹ','nav.section.grow':'Idagbasoke','nav.section.account':'Akọọlẹ',
  'common.save':'Fi pamọ','common.cancel':'Fagilee','common.confirm':'Jẹrisi',
  'common.close':'Pa','common.back':'Pada','common.search':'Wa',
  'common.total':'Apapọ','common.currency':'₦',
  'topbar.greeting':'E kaabọ pada','sidebar.verified':'A ti jẹrisi',
  'home.greeting.morning':'E kaaro','home.greeting.afternoon':'E kaasan','home.greeting.evening':'E kaale',
  'home.subtitle':'Eyi ni apejuwe iṣowo rẹ.','home.totalSales':'Apapọ Tita',
  'home.totalRevenue':'Apapọ Owo-wiwọle','home.netProfit':'Ere Gidi',
  'home.totalExpenses':'Apapọ Inawo','home.cashBalance':'Iyokù Owo','home.stockValue':'Iye Ọja',
  'sale.title':'Gbasilẹ Tita','sale.cash':'Owo','sale.transfer':'Gbigbe Owo','sale.card':'Kaadi',
  'sale.completeSale':'Pari Tita','sale.saleComplete':'Tita Ti Pari!',
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
};

// ════════════════════════════════════════════════════════
//  IGBO (ig)
// ════════════════════════════════════════════════════════
const ig: TranslationDict = {
  ...en,
  'nav.home':'Ulo','nav.recordSale':'Dee Ire Ahia','nav.addProduct':'Tinye Ngwongwo',
  'nav.addExpense':'Tinye Mmefu','nav.cashflow':'Ọghọ Ego','nav.statement':'Ọnọdụ Ego',
  'nav.salesHistory':'Akụkọ Ire Ahia','nav.inventory':'Ọnụọgụ Ngwongwo','nav.expenses':'Mmefu',
  'nav.capital':'Ego Ntọala','nav.referrals':'Ntụziaka','nav.askMO':'Jụọ MO',
  'nav.services':'Ọrụ','nav.staff':'Ndị ọrụ','nav.settings':'Ntọala',
  'nav.market':'Ahịa','nav.section.main':'Isi','nav.section.money':'Ego',
  'nav.section.team':'Otu','nav.section.grow':'Uto','nav.section.account':'Akaụntụ',
  'common.save':'Chekwaa','common.cancel':'Kagbuo','common.confirm':'Kwenye',
  'common.close':'Mechie','common.back':'Laghachi','common.search':'Chọọ',
  'common.total':'Ngụkọta','common.currency':'₦',
  'topbar.greeting':'Nnọọ laghachi','sidebar.verified':'Ejiri ya kwenye',
  'home.greeting.morning':'Ụtụtụ ọma','home.greeting.afternoon':'Ehihie ọma','home.greeting.evening':'Anyasị ọma',
  'home.subtitle':'Nke a bụ nchịkọta azụmaahịa gị.','home.totalSales':'Ngụkọta Ire Ahia',
  'home.totalRevenue':'Ngụkọta Ego Mbata','home.netProfit':'Uru Dị Mma',
  'home.totalExpenses':'Ngụkọta Mmefu','home.cashBalance':'Ego Fọdụrụ','home.stockValue':'Ọnụahịa Ngwongwo',
  'sale.title':'Dee Ire Ahia','sale.cash':'Ego','sale.transfer':'Nnyefe Ego','sale.card':'Kaadị',
  'sale.completeSale':'Mechaa Ire Ahia','sale.saleComplete':'Ire Ahia Mechara!',
  'product.title':'Tinye Ngwongwo','product.name':'Aha Ngwongwo',
  'product.sellingPrice':'Ọnụahịa Ire','product.costPrice':'Ọnụahịa Ịzụta','product.save':'Chekwaa Ngwongwo',
  'expense.title':'Tinye Mmefu','expense.record':'Dee Mmefu',
  'cashflow.title':'Ọghọ Ego','cashflow.addStock':'Tinye Ngwongwo','cashflow.reduceStock':'Belata Ngwongwo',
  'cashflow.addMoney':'Tinye Ego','cashflow.takeMoney':'Were Ego',
  'statement.title':'Nchịkọta & Ọnọdụ','statement.downloadPdf':'Budata PDF',
  'settings.title':'Ntọala','settings.language':'Asụsụ Igosi',
  'settings.languageDesc':'Họrọ asụsụ ejiri na dashboard Busmo.',
  'settings.theme':'Ọdịdị','settings.themeLight':'Ọcha','settings.themeDark':'Oji',
  'settings.changesSaved':'Agbanweela ihe ndị a chekwaa','settings.logout':'Pụọ','settings.saved':'Echekwara',
  'mo.title':'Jụọ MO','mo.placeholder':'Jụọ MO ihe ọ bụla banyere azụmaahịa gị…','mo.send':'Zipu',
};

// ════════════════════════════════════════════════════════
//  AMHARIC (am)
// ════════════════════════════════════════════════════════
const am: TranslationDict = {
  ...en,
  'nav.home':'መነሻ','nav.recordSale':'ሽያጭ ማስመዝገቢያ','nav.addProduct':'ምርት ጨምር',
  'nav.addExpense':'ወጪ ጨምር','nav.cashflow':'የገንዘብ ፍሰት','nav.statement':'የፋይናንስ መግለጫ',
  'nav.salesHistory':'የሽያጭ ታሪክ','nav.inventory':'ዕቃ ክምችት','nav.expenses':'ወጪዎች',
  'nav.capital':'ካፒታል','nav.referrals':'ምክሮች','nav.askMO':'MO ጠይቅ',
  'nav.services':'አገልግሎቶች','nav.staff':'ሠራተኞች','nav.settings':'ቅንጅቶች',
  'nav.market':'ገበያ','nav.section.main':'ዋና','nav.section.money':'ገንዘብ',
  'nav.section.team':'ቡድን','nav.section.grow':'ዕድገት','nav.section.account':'መለያ',
  'common.save':'አስቀምጥ','common.cancel':'ሰርዝ','common.confirm':'አረጋግጥ',
  'common.close':'ዝጋ','common.back':'ተመለስ','common.search':'ፈልግ',
  'common.total':'ድምር','common.currency':'ብር',
  'topbar.greeting':'እንኳን ደህና መጡ','sidebar.verified':'ተረጋግጧል',
  'home.greeting.morning':'እንደምን አደሩ','home.greeting.afternoon':'እንደምን ዋሉ','home.greeting.evening':'እንደምን አመሹ',
  'home.subtitle':'ይህ የንግድዎ ማጠቃለያ ነው።','home.totalSales':'ጠቅላላ ሽያጮች',
  'home.totalRevenue':'ጠቅላላ ገቢ','home.netProfit':'ተጣራ ትርፍ',
  'home.totalExpenses':'ጠቅላላ ወጪዎች','home.cashBalance':'የጥሬ ገንዘብ ቀሪ','home.stockValue':'የዕቃ ዋጋ',
  'sale.title':'ሽያጭ ማስመዝገቢያ','sale.cash':'ጥሬ ገንዘብ','sale.transfer':'ዝውውር','sale.card':'ካርድ',
  'sale.completeSale':'ሽያጩን ጨርስ','sale.saleComplete':'ሽያጩ ተጠናቋል!',
  'product.title':'ምርት ጨምር','product.name':'የምርት ስም',
  'product.sellingPrice':'የሽያጭ ዋጋ','product.costPrice':'የግዢ ዋጋ','product.save':'ምርቱን አስቀምጥ',
  'expense.title':'ወጪ ጨምር','expense.record':'ወጪ ምዝገብ',
  'cashflow.title':'የገንዘብ ፍሰት','cashflow.addStock':'ዕቃ ጨምር','cashflow.reduceStock':'ዕቃ ቀንስ',
  'cashflow.addMoney':'ገንዘብ ጨምር','cashflow.takeMoney':'ገንዘብ ውሰድ',
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
  'nav.salesHistory':'سجل المبيعات','nav.inventory':'المخزون','nav.expenses':'المصروفات',
  'nav.capital':'رأس المال','nav.referrals':'الإحالات','nav.askMO':'اسأل MO',
  'nav.services':'الخدمات','nav.staff':'الموظفون','nav.settings':'الإعدادات',
  'nav.market':'السوق','nav.section.main':'رئيسي','nav.section.money':'المال',
  'nav.section.team':'الفريق','nav.section.grow':'النمو','nav.section.account':'الحساب',
  'common.save':'حفظ','common.cancel':'إلغاء','common.confirm':'تأكيد',
  'common.close':'إغلاق','common.back':'رجوع','common.search':'بحث',
  'common.total':'المجموع','common.currency':'د.أ.','common.yes':'نعم','common.no':'لا',
  'common.loading':'جارٍ التحميل…','common.viewAll':'عرض الكل',
  'topbar.greeting':'مرحباً بعودتك','sidebar.verified':'موثّق',
  'home.greeting.morning':'صباح الخير','home.greeting.afternoon':'مساء الخير','home.greeting.evening':'مساء النور',
  'home.subtitle':'إليك نظرة عامة على أعمالك.','home.totalSales':'إجمالي المبيعات',
  'home.totalRevenue':'إجمالي الإيرادات','home.netProfit':'صافي الربح',
  'home.totalExpenses':'إجمالي المصروفات','home.cashBalance':'الرصيد النقدي','home.stockValue':'قيمة المخزون',
  'sale.title':'تسجيل بيع','sale.cash':'نقداً','sale.transfer':'تحويل','sale.card':'بطاقة',
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
  'nav.salesHistory':'Umlando Wokuthengisa','nav.inventory':'Ukubalwa Kwempahla','nav.expenses':'Izindleko',
  'nav.capital':'Inkunzi','nav.referrals':'Izincomo','nav.askMO':'Buza MO',
  'nav.services':'Izinsizakalo','nav.staff':'Abasebenzi','nav.settings':'Izilungiselelo',
  'nav.market':'Imakethe','nav.section.main':'Oyinhloko','nav.section.money':'Imali',
  'nav.section.team':'Ithimba','nav.section.grow':'Ukukhula','nav.section.account':'I-akhawunti',
  'common.save':'Gcina','common.cancel':'Khansela','common.confirm':'Qinisekisa',
  'common.close':'Vala','common.back':'Buyela','common.search':'Sesha',
  'common.total':'Isamba','common.currency':'R',
  'topbar.greeting':'Wamukelwa futhi','sidebar.verified':'Kuqinisekisiwe',
  'home.greeting.morning':'Sawubona ekuseni','home.greeting.afternoon':'Sawubona ntambama','home.greeting.evening':'Sawubona ebusuku',
  'home.subtitle':'Nansi isifinyezo seshishini lakho.','home.totalSales':'Isamba Sokuthengisa',
  'home.totalRevenue':'Isamba Semali Engenayo','home.netProfit':'Inzuzo Ehlanzekile',
  'home.totalExpenses':'Isamba Sezindleko','home.cashBalance':'Insali Yemali','home.stockValue':'Inani Lempahla',
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
  'nav.salesHistory':'Verkoopgeskiedenis','nav.inventory':'Voorraad','nav.expenses':'Uitgawes',
  'nav.capital':'Kapitaal','nav.referrals':'Verwysings','nav.askMO':'Vra MO',
  'nav.services':'Dienste','nav.staff':'Personeel','nav.settings':'Instellings',
  'nav.market':'Markplek','nav.section.main':'Hoofmenu','nav.section.money':'Geld',
  'nav.section.team':'Span','nav.section.grow':'Groei','nav.section.account':'Rekening',
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
  'cashflow.recentTransactions':'Onlangse Transaksies','cashflow.viewStatement':'Sien Volledige Staat →',
  'cashflow.confirmAddStock':'Bevestig Voeg Voorraad By','cashflow.confirmReduceStock':'Bevestig Vermindering',
  'cashflow.recordIncoming':'Teken Inkomende Geld','cashflow.recordOutgoing':'Teken Uitgaande Geld',
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
