import { NavSection } from './types';

// ═══════════════════════════════════════════
//  BUSMO — Navigation Configuration
//  With Multi-language Support
// ═══════════════════════════════════════════

// Mapping of nav items to required features and categories
export const NAV_ITEM_REQUIREMENTS: Record<string, { 
  requiredFeatures?: string[]; 
  requiredCategories?: string[];
  excludedCategories?: string[];
  requiredPlan?: 'starter' | 'standard' | 'pro';
}> = {
  // Main navigation items
  'sale': {
    requiredFeatures: ['Sales Recording'],
  },
  'inventory': {
    requiredFeatures: ['Inventory Tracking'],
    excludedCategories: ['education', 'services'],
  },
  'add-expense': {
    requiredFeatures: ['Expense Management'],
    excludedCategories: ['education', 'services'],
  },
  'cashflow': {
    requiredFeatures: ['Cash Flow Analysis'],
    excludedCategories: ['education', 'services'],
  },
  'reports': {
    requiredFeatures: ['Profit/Loss Reports', 'Business Analytics'],
    excludedCategories: ['education', 'services'],
  },
  'bank-reconciliation': {
    requiredPlan: 'pro',
  },
  'money-control': {
    requiredPlan: 'standard',
  },
  'credit-tracking': {
    requiredFeatures: ['Credit Tracking'],
    requiredPlan: 'standard',
  },
  
  // Growth navigation items
  'capital': {
    requiredCategories: ['wholesale', 'retail', 'manufacturing', 'distributor'],
  },
  'referrals': {
    // Available to all users
  },
  
  // Account navigation items
  'mo': {
    requiredFeatures: ['Ask MO AI Assistant'],
  },
  'services': {
    // Available to all users
  },
  'staff': {
    requiredFeatures: ['Staff Management'],
  },
  'document-templates': {
    requiredFeatures: ['Document Templates'],
    requiredPlan: 'standard',
  },
  'branches': {
    requiredFeatures: ['Multi-branch Support'],
    requiredPlan: 'pro',
    excludedCategories: ['wholesale', 'distributor'],
  },
  
  // Specialized features (not yet in main nav but mapped for future use)
  'menu-management': {
    requiredFeatures: ['Menu Management'],
    requiredCategories: ['restaurant', 'cafe'],
    requiredPlan: 'standard',
  },
  'ingredient-tracking': {
    requiredFeatures: ['Ingredient Tracking'],
    requiredCategories: ['restaurant', 'cafe'],
    requiredPlan: 'standard',
  },
  'expiry-alerts': {
    requiredFeatures: ['Expiry Alerts'],
    requiredCategories: ['grocery', 'pharmacy', 'supermarket', 'restaurant', 'cafe', 'healthcare'],
  },
  'production-tracking': {
    requiredFeatures: ['Production Tracking'],
    requiredCategories: ['manufacturing'],
    requiredPlan: 'pro',
  },
  'ecommerce-storefront': {
    requiredFeatures: ['E-commerce Storefront'],
    requiredCategories: ['retail', 'fashion', 'electronics'],
    requiredPlan: 'pro',
  },
  'payroll': {
    requiredFeatures: ['Payroll Management'],
    requiredPlan: 'pro',
  },
  'customer-management': {
    requiredFeatures: ['Customer Management'],
  },
  'supplier-management': {
    requiredFeatures: ['Supplier Management'],
    excludedCategories: ['education', 'services'],
  },
  'warehouse': {
    requiredCategories: ['retail', 'wholesale', 'distributor'],
  },
  'stock-transfers': {
    requiredFeatures: ['Warehouse Management'],
    requiredCategories: ['retail', 'wholesale', 'distributor'],
  },
};

// Translation dictionary for sidebar items
export const SIDEBAR_TRANSLATIONS: { [key: string]: { [key: string]: string } } = {
  // Section Labels
  'Main': {
    en: 'Main',
    yo: 'Àkọ́kọ́',           // Yoruba
    ig: 'Isi',              // Igbo
    ha: 'Babban',           // Hausa
    sw: 'Kuu',              // Swahili
    fr: 'Principal',        // French
    pt: 'Principal',        // Portuguese
    pcm: 'Main',            // Pidgin
  },
  'Growth': {
    en: 'Growth',
    yo: 'Ìdàgbàsókè',       // Yoruba
    ig: 'Ụ́mụba',             // Igbo
    ha: 'Haɓaka',           // Hausa
    sw: 'Ukuaji',           // Swahili
    fr: 'Croissance',       // French
    pt: 'Crescimento',      // Portuguese
    pcm: 'Growth',          // Pidgin
  },
  'Account': {
    en: 'Account',
    yo: 'Akáùnìtì',         // Yoruba
    ig: 'Akaụntị',          // Igbo
    ha: 'Lissafi',          // Hausa
    sw: 'Akaunti',          // Swahili
    fr: 'Compte',           // French
    pt: 'Conta',            // Portuguese
    pcm: 'Account',         // Pidgin
  },
  
  // Menu Items
  'Home': {
    en: 'Home',
    yo: 'Ilé',              // Yoruba
    ig: 'Ụlọ',              // Igbo
    ha: 'Gida',             // Hausa
    sw: 'Nyumbani',         // Swahili
    fr: 'Accueil',          // French
    pt: 'Início',           // Portuguese
    pcm: 'Home',            // Pidgin
  },
  'Record Sale': {
    en: 'Record Sale',
    yo: 'Gbìgbésílẹ̀ Tà',    // Yoruba
    ig: 'Dekọọ Rezi',       // Igbo
    ha: 'Rikodi Sayarwa',   // Hausa
    sw: 'Rekodi Mauzo',     // Swahili
    fr: 'Enregistrer Vente',// French
    pt: 'Registrar Venda',  // Portuguese
    pcm: 'Record Sale',     // Pidgin
  },
  'Inventory': {
    en: 'Inventory',
    yo: 'Ìkójọpọ̀',          // Yoruba
    ig: 'Ngwaahịa',         // Igbo
    ha: 'Kayayyaki',        // Hausa
    sw: 'Hifadhi',          // Swahili
    fr: 'Inventaire',       // French
    pt: 'Inventário',       // Portuguese
    pcm: 'Inventory',       // Pidgin
  },
  'Add Product': {
    en: 'Add Product',
    yo: 'Àfikún Ọjà',       // Yoruba
    ig: 'Tinye Ngwaahịa',   // Igbo
    ha: 'Ƙara Samfur',      // Hausa
    sw: 'Ongeza Bidhaa',    // Swahili
    fr: 'Ajouter Produit',  // French
    pt: 'Adicionar Produto',// Portuguese
    pcm: 'Add Product',     // Pidgin
  },
  'Add Expense': {
    en: 'Add Expense',
    yo: 'Àfikún Nàwó',      // Yoruba
    ig: 'Tinye Mefu',       // Igbo
    ha: 'Ƙara Kudi',        // Hausa
    sw: 'Ongeza Gharama',   // Swahili
    fr: 'Ajouter Dépense',  // French
    pt: 'Adicionar Despesa',// Portuguese
    pcm: 'Add Expense',     // Pidgin
  },
  'Cashflow': {
    en: 'Cashflow',
    yo: 'Ṣíṣàn Owó',         // Yoruba
    ig: 'Asọmpi Ego',       // Igbo
    ha: 'Kwararar Kuɗi',    // Hausa
    sw: 'Mtiririko wa Pesa',// Swahili
    fr: 'Flux Trésorerie',  // French
    pt: 'Fluxo Caixa',      // Portuguese
    pcm: 'Cashflow',        // Pidgin
  },
  'Statement': {
    en: 'Statement',
    yo: 'Ìgbésókè',          // Yoruba
    ig: 'Nkwupụta',         // Igbo
    ha: 'Bayani',           // Hausa
    sw: 'Taarifa',          // Swahili
    fr: 'Relevé',           // French
    pt: 'Extrato',          // Portuguese
    pcm: 'Statement',       // Pidgin
  },
  'Reports': {
    en: 'Reports',
    yo: 'Riportì',          // Yoruba
    ig: 'Akụkọ',            // Igbo
    ha: 'Rahoto',           // Hausa
    sw: 'Ripoti',           // Swahili
    fr: 'Rapports',         // French
    pt: 'Relatórios',       // Portuguese
    pcm: 'Reports',         // Pidgin
  },
  'Bank Reconciliation': {
    en: 'Bank Reconciliation',
    yo: 'Ìṣòwò Báǹkì',     // Yoruba
    ig: 'Njikọta Bank',     // Igbo
    ha: 'Daidaita Banki',   // Hausa
    sw: 'Urejeshaji wa Benki', // Swahili
    fr: 'Rapprochement Bancaire', // French
    pt: 'Reconciliação Bancária', // Portuguese
    pcm: 'Bank Reconciliation', // Pidgin
  },
  'My Market': {
    en: 'My Market',
    yo: 'Ọjà Mi',            // Yoruba
    ig: 'Ahịa M',           // Igbo
    ha: 'Kasuwata',         // Hausa
    sw: 'Soko Yangu',       // Swahili
    fr: 'Mon Marché',       // French
    pt: 'Meu Mercado',      // Portuguese
    pcm: 'My Market',       // Pidgin
  },
  'Access Capital': {
    en: 'Access Capital',
    yo: 'Irúwọ́sí Olówó',    // Yoruba
    ig: 'Nweta Isi Obodo',  // Igbo
    ha: 'Samun Jari',       // Hausa
    sw: 'Pata Malipo',      // Swahili
    fr: 'Accès Capital',    // French
    pt: 'Acesso Capital',   // Portuguese
    pcm: 'Access Capital',  // Pidgin
  },
  'Referrals': {
    en: 'Referrals',
    yo: 'Àwọn ìtọ́kasí',      // Yoruba
    ig: 'Ndị E Zigara',     // Igbo
    ha: 'Bincike',          // Hausa
    sw: 'Rudufu',           // Swahili
    fr: 'Parrainages',      // French
    pt: 'Indicações',       // Portuguese
    pcm: 'Referrals',       // Pidgin
  },
  'Ask MO': {
    en: 'Ask MO',
    yo: 'Béèrè MO',          // Yoruba
    ig: 'Jụọ MO',           // Igbo
    ha: 'Tambayi MO',       // Hausa
    sw: 'Uliza MO',          // Swahili
    fr: 'Demander MO',      // French
    pt: 'Perguntar MO',     // Portuguese
    pcm: 'Ask MO',          // Pidgin
  },
  'Business Services': {
    en: 'Business Services',
    yo: 'Àwọn Ìṣẹ́ Iṣòwò',   // Yoruba
    ig: 'Ọrụ Azụmahịa',     // Igbo
    ha: 'Ayyukan Kasuwanci',// Hausa
    sw: 'Huduma za Biashara',// Swahili
    fr: 'Services Entreprise',// French
    pt: 'Serviços Empresa', // Portuguese
    pcm: 'Business Services',// Pidgin
  },
  'Staff': {
    en: 'Staff',
    yo: 'Òṣìṣẹ́',            // Yoruba
    ig: 'Ndị Ọrụ',          // Igbo
    ha: "Ma'aikata",        // Hausa
    sw: 'Wafanyakazi',      // Swahili
    fr: 'Personnel',        // French
    pt: 'Equipe',           // Portuguese
    pcm: 'Staff',           // Pidgin
  },
  'Branches': {
    en: 'Branches',
    yo: 'Àwọn Ẹ̀ka',         // Yoruba
    ig: 'Alaka',            // Igbo
    ha: 'Rassa',            // Hausa
    sw: 'Tawi',             // Swahili
    fr: 'Succursales',      // French
    pt: 'Filiais',          // Portuguese
    pcm: 'Branches',        // Pidgin
  },
  'Settings': {
    en: 'Settings',
    yo: 'Ètò',               // Yoruba
    ig: 'Ntọala',           // Igbo
    ha: 'Saituna',          // Hausa
    sw: 'Mipangilio',       // Swahili
    fr: 'Paramètres',       // French
    pt: 'Configurações',    // Portuguese
    pcm: 'Settings',        // Pidgin
  },
  'Email Campaigns': {
    en: 'Email Campaigns',
    yo: 'Kámẹ́pẹ́ẹ́nì Iròyìn', // Yoruba
    ig: 'Mgbasa Ozi Ozi',   // Igbo
    ha: 'Yakinakin E-mail', // Hausa
    sw: 'Kampeni za Barua pepe', // Swahili
    fr: 'Campagnes Email',  // French
    pt: 'Campanhas de Email', // Portuguese
    pcm: 'Email Campaigns', // Pidgin
  },
  'Money Control': {
    en: 'Money Control',
    yo: 'Ìṣàkóso Owó',     // Yoruba
    ig: 'Nchịkwa Ego',      // Igbo
    ha: 'Sarrafa Kuɗi',    // Hausa
    sw: 'Udhibiti Wa Pesa', // Swahili
    fr: 'Contrôle Argent',  // French
    pt: 'Controle de Dinheiro', // Portuguese
    pcm: 'Money Control',   // Pidgin
  },
  'Credit Tracking': {
    en: 'Credit Tracking',
    yo: 'Ìṣàkóso Kárẹ́dì', // Yoruba
    ig: 'Nchịkwa Kredit',   // Igbo
    ha: 'Sarrafa Kredit',   // Hausa
    sw: 'Udhibiti wa Mikopo', // Swahili
    fr: 'Suivi Crédit',     // French
    pt: 'Rastreamento Crédito', // Portuguese
    pcm: 'Credit Tracking', // Pidgin
  },
  'Suppliers': {
    en: 'Suppliers',
    yo: 'Àwọn oníṣòwò',    // Yoruba
    ig: 'Ndị Na-ere',       // Igbo
    ha: 'Masu Samfura',     // Hausa
    sw: 'Wauzaji',          // Swahili
    fr: 'Fournisseurs',     // French
    pt: 'Fornecedores',     // Portuguese
    pcm: 'Suppliers',       // Pidgin
  },
  'Customers': {
    en: 'Customers',
    yo: 'Àwọn oníṣàjẹ',     // Yoruba
    ig: 'Ndị Ahịa',         // Igbo
    ha: 'Abokin ciniki',     // Hausa
    sw: 'Wateja',           // Swahili
    fr: 'Clients',          // French
    pt: 'Clientes',         // Portuguese
    pcm: 'Customers',       // Pidgin
  },
  'Menu Management': {
    en: 'Menu Management',
    yo: 'Ìṣàkóso Àkànyẹ̀',  // Yoruba
    ig: 'Nchịkwa Menu',     // Igbo
    ha: 'Sarrafa Menu',     // Hausa
    sw: 'Usimamizi wa Menyu', // Swahili
    fr: 'Gestion Menu',     // French
    pt: 'Gestão Menu',      // Portuguese
    pcm: 'Menu Management', // Pidgin
  },
  'Ingredients': {
    en: 'Ingredients',
    yo: 'Àwọn Eroja',       // Yoruba
    ig: 'Ngwaahịa',         // Igbo
    ha: 'Abubuwan da ke',   // Hausa
    sw: 'Viungo',           // Swahili
    fr: 'Ingrédients',      // French
    pt: 'Ingredientes',     // Portuguese
    pcm: 'Ingredients',     // Pidgin
  },
  'Expiry Alerts': {
    en: 'Expiry Alerts',
    yo: 'Ìbànújẹ́ Akókò',   // Yoruba
    ig: 'Ntịrị Mbụ',       // Igbo
    ha: 'Maye Mai ƙare',    // Hausa
    sw: 'Matangazo ya Muda', // Swahili
    fr: 'Alertes Expiration', // French
    pt: 'Alertas Validade', // Portuguese
    pcm: 'Expiry Alerts',   // Pidgin
  },
  'Production': {
    en: 'Production',
    yo: 'Ṣiṣe',            // Yoruba
    ig: 'Mmepụta',          // Igbo
    ha: 'Samfura',          // Hausa
    sw: 'Uzalishaji',       // Swahili
    fr: 'Production',       // French
    pt: 'Produção',         // Portuguese
    pcm: 'Production',      // Pidgin
  },
  'E-commerce': {
    en: 'E-commerce',
    yo: 'Ètò Ìṣòwò Lórí Ayélujára', // Yoruba
    ig: 'Ahịa Intanet',     // Igbo
    ha: 'Kasuwanci akan layi', // Hausa
    sw: 'Biashara ya Mtandaoni', // Swahili
    fr: 'E-commerce',      // French
    pt: 'E-commerce',       // Portuguese
    pcm: 'E-commerce',      // Pidgin
  },
  'Payroll': {
    en: 'Payroll',
    yo: 'Isánwó',          // Yoruba
    ig: 'Ụgwọ Ọrụ',        // Igbo
    ha: 'Alawar kuɗi',     // Hausa
    sw: 'Mshahara',         // Swahili
    fr: 'Paie',            // French
    pt: 'Folha de Pagamento', // Portuguese
    pcm: 'Payroll',         // Pidgin
  },
};

// Get translation for a text
export function getSidebarTranslation(text: string, language: string = 'en'): string {
  const translations = SIDEBAR_TRANSLATIONS[text];
  if (!translations) return text;
  return translations[language] || translations['en'] || text;
}

// ═══════════════════════════════════════════
//  NAVIGATION ITEMS (BusmoPay & BusmoGo Removed)
// ═══════════════════════════════════════════

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Main',
    items: [
      { id: 'home', label: 'Home', tip: 'Home', iconClass: 'home' },
      { id: 'sale', label: 'Record Sale', tip: 'Record Sale', iconClass: 'sale' },
      { id: 'inventory', label: 'Inventory', tip: 'Inventory', iconClass: 'inventory' },
      { id: 'add-product', label: 'Add Product', tip: 'Add Product', iconClass: 'add-product' },
      { id: 'add-expense', label: 'Add Expense', tip: 'Add Expense', iconClass: 'add-expense' },
      { id: 'cashflow', label: 'Cashflow', tip: 'Cashflow', iconClass: 'cashflow' },
      { id: 'statement', label: 'Statement', tip: 'Statement', iconClass: 'statement' },
      { id: 'reports', label: 'Reports', tip: 'Reports', iconClass: 'ni-chart' },
      { id: 'bank-reconciliation', label: 'Bank Reconciliation', tip: 'Bank Reconciliation', iconClass: 'ni-bank' },
      { id: 'money-control', label: 'Money Control', tip: 'Money Control', iconClass: 'ni-cash' },
      { id: 'credit-tracking', label: 'Credit Tracking', tip: 'Credit Tracking', iconClass: 'ni-credit' },
      { id: 'menu-management', label: 'Menu Management', tip: 'Menu Management', iconClass: 'ni-menu', badge: 'Standard' },
      { id: 'ingredient-tracking', label: 'Ingredients', tip: 'Ingredients', iconClass: 'ni-ingredient', badge: 'Standard' },
      { id: 'expiry-alerts', label: 'Expiry Alerts', tip: 'Expiry Alerts', iconClass: 'ni-expiry' },
      { id: 'production-tracking', label: 'Production', tip: 'Production', iconClass: 'ni-production', badge: 'Pro' },
      { id: 'ecommerce-storefront', label: 'E-commerce', tip: 'E-commerce', iconClass: 'ni-ecommerce', badge: 'Pro' },
    ],
    icon: '',
    id: undefined
  },
  {
    label: 'Growth',
    items: [
      // BusmoPay removed - integrated into main flow
      // BusmoGo removed - integrated into main flow
      // My Market removed for this release
      { id: 'capital', label: 'Access Capital', tip: 'Access Capital', iconClass: 'ni-fund' },
      { id: 'referrals', label: 'Referrals', tip: 'Referrals', iconClass: 'ni-gift' },
    ],
    icon: '',
    id: undefined
  },
  {
    label: 'Account',
    items: [
      { id: 'services', label: 'Business Services', tip: 'Business Services', iconClass: 'ni-svc' },
      { id: 'staff', label: 'Staff', tip: 'Staff', iconClass: 'ni-staff', badge: 0 },
      { id: 'supplier-management', label: 'Suppliers', tip: 'Suppliers', iconClass: 'ni-supplier' },
      { id: 'customer-management', label: 'Customers', tip: 'Customers', iconClass: 'ni-customer' },
      { id: 'warehouse', label: 'Warehouse', tip: 'Warehouse', iconClass: 'ni-warehouse' },
      { id: 'stock-transfers', label: 'Stock Transfers', tip: 'Stock Transfers', iconClass: 'ni-transfer' },
      { id: 'document-templates', label: 'Document Templates', tip: 'Document Templates', iconClass: 'ni-template' },
      { id: 'branches', label: 'Branches', tip: 'Branches', iconClass: 'ni-branch', badge: 'Pro' },
      { id: 'payroll', label: 'Payroll', tip: 'Payroll', iconClass: 'ni-payroll', badge: 'Pro' },
      { id: 'settings', label: 'Settings', tip: 'Settings', iconClass: 'ni-set' },
    ],
    icon: '',
    id: undefined
  },
];

// Pages shown in mobile bottom nav
export const MOBILE_NAV_ITEMS = ['home', 'sale', 'cashflow', 'mo', 'staff'] as const;
