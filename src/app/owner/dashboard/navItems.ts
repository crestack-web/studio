import { NavSection } from './types';

export const NAV_ITEM_REQUIREMENTS: Record<string, { 
  requiredFeatures?: string[]; 
  requiredCategories?: string[];
  excludedCategories?: string[];
  requiredPlan?: 'starter' | 'standard' | 'pro';
}> = {
  'sale': { requiredFeatures: ['Sales Recording'] },
  'inventory': { requiredFeatures: ['Inventory Tracking'], excludedCategories: ['education', 'services'] },
  'add-expense': { requiredFeatures: ['Expense Management'], excludedCategories: ['education', 'services'] },
  'cashflow': { requiredFeatures: ['Cash Flow Analysis'], excludedCategories: ['education', 'services'] },
  'reports': { requiredFeatures: ['Profit/Loss Reports', 'Business Analytics'], excludedCategories: ['education', 'services'] },
  'bank-reconciliation': { requiredPlan: 'standard' },
  'money-control': { requiredPlan: 'standard' },
  'credit-tracking': { requiredFeatures: ['Credit Tracking'], requiredPlan: 'standard' },
  'capital': { requiredCategories: ['wholesale', 'retail', 'manufacturing', 'distributor'] },
  'referrals': {},
  'wallet': {},
  'mo': { requiredFeatures: ['Ask MO AI Assistant'] },
  'mo-sales': {},
  'services': {},
  'staff': { requiredFeatures: ['Staff Management'] },
  'document-templates': { requiredFeatures: ['Document Templates'], requiredPlan: 'standard' },
  'branches': { requiredFeatures: ['Multi-branch Support'], requiredPlan: 'pro', excludedCategories: ['wholesale', 'distributor'] },
  'menu-management': { requiredFeatures: ['Menu Management'], requiredCategories: ['restaurant', 'cafe'], requiredPlan: 'standard' },
  'margin-calculator': {},
  'ingredient-tracking': { requiredFeatures: ['Ingredient Tracking'], requiredCategories: ['restaurant', 'cafe'], requiredPlan: 'standard' },
  'expiry-alerts': { requiredFeatures: ['Expiry Alerts'], requiredCategories: ['grocery', 'pharmacy', 'supermarket', 'restaurant', 'cafe', 'healthcare'], requiredPlan: 'standard' },
  'production-tracking': { requiredFeatures: ['Production Tracking'], requiredCategories: ['manufacturing'], requiredPlan: 'pro' },
  'payroll': { requiredFeatures: ['Payroll Management'], requiredPlan: 'pro' },
  'customer-management': { requiredFeatures: ['Customer Management'] },
  'supplier-management': { requiredFeatures: ['Supplier Management'], excludedCategories: ['education', 'services'] },
  'warehouse': { requiredCategories: ['retail', 'wholesale', 'distributor'], excludedCategories: ['restaurant', 'cafe', 'services', 'education', 'healthcare'] },
  'stock-transfers': { requiredFeatures: ['Warehouse Management'], requiredCategories: ['retail', 'wholesale', 'distributor'], excludedCategories: ['restaurant', 'cafe', 'services', 'education', 'healthcare'] },
};

export const SIDEBAR_TRANSLATIONS: { [key: string]: { [key: string]: string } } = {
  'Main': { en: 'Main', yo: 'Àkọ́kọ́', ig: 'Isi', ha: 'Babban', sw: 'Kuu', fr: 'Principal', pt: 'Principal', pcm: 'Main' },
  'Growth': { en: 'Growth', yo: 'Ìdàgbàsókè', ig: 'Ụ́mụba', ha: 'Haɓaka', sw: 'Ukuaji', fr: 'Croissance', pt: 'Crescimento', pcm: 'Growth' },
  'Account': { en: 'Account', yo: 'Akáùnìtì', ig: 'Akaụntị', ha: 'Lissafi', sw: 'Akaunti', fr: 'Compte', pt: 'Conta', pcm: 'Account' },
  'Home': { en: 'Home', yo: 'Ilé', ig: 'Ụlọ', ha: 'Gida', sw: 'Nyumbani', fr: 'Accueil', pt: 'Início', pcm: 'Home' },
  'Record Sale': { en: 'Record Sale', yo: 'Gbìgbésílẹ̀ Tà', ig: 'Dekọọ Rezi', ha: 'Rikodi Sayarwa', sw: 'Rekodi Mauzo', fr: 'Enregistrer Vente', pt: 'Registrar Venda', pcm: 'Record Sale' },
  'Inventory': { en: 'Inventory', yo: 'Ìkójọpọ̀', ig: 'Ngwaahịa', ha: 'Kayayyaki', sw: 'Hifadhi', fr: 'Inventaire', pt: 'Inventário', pcm: 'Inventory' },
  'Add Product': { en: 'Add Product', yo: 'Àfikún Ọjà', ig: 'Tinye Ngwaahịa', ha: 'Ƙara Samfur', sw: 'Ongeza Bidhaa', fr: 'Ajouter Produit', pt: 'Adicionar Produto', pcm: 'Add Product' },
  'Add Expense': { en: 'Add Expense', yo: 'Àfikún Nàwó', ig: 'Tinye Mefu', ha: 'Ƙara Kudi', sw: 'Ongeza Gharama', fr: 'Ajouter Dépense', pt: 'Adicionar Despesa', pcm: 'Add Expense' },
  'Cashflow': { en: 'Cashflow', yo: 'Ṣíṣàn Owó', ig: 'Asọmpi Ego', ha: 'Kwararar Kuɗi', sw: 'Mtiririko wa Pesa', fr: 'Flux Trésorerie', pt: 'Fluxo Caixa', pcm: 'Cashflow' },
  'Statement': { en: 'Statement', yo: 'Ìgbésókè', ig: 'Nkwupụta', ha: 'Bayani', sw: 'Taarifa', fr: 'Relevé', pt: 'Extrato', pcm: 'Statement' },
  'Reports': { en: 'Reports', yo: 'Riportì', ig: 'Akụkọ', ha: 'Rahoto', sw: 'Ripoti', fr: 'Rapports', pt: 'Relatórios', pcm: 'Reports' },
  'Bank Reconciliation': { en: 'Bank Reconciliation', yo: 'Ìṣòwò Báǹkì', ig: 'Njikọta Bank', ha: 'Daidaita Banki', sw: 'Urejeshaji wa Benki', fr: 'Rapprochement Bancaire', pt: 'Reconciliação Bancária', pcm: 'Bank Reconciliation' },
  'Access Capital': { en: 'Access Capital', yo: 'Irúwọ́sí Olówó', ig: 'Nweta Isi Obodo', ha: 'Samun Jari', sw: 'Pata Malipo', fr: 'Accès Capital', pt: 'Acesso Capital', pcm: 'Access Capital' },
  'Referrals': { en: 'Referrals', yo: 'Àwọn ìtọ́kasí', ig: 'Ndị E Zigara', ha: 'Bincike', sw: 'Rudufu', fr: 'Parrainages', pt: 'Indicações', pcm: 'Referrals' },
  'MO Sales': { en: 'MO Sales', yo: 'MO Tàjà', ig: 'MO Ahịa', ha: 'MO Tallace', sw: 'MO Mauzo', fr: 'MO Ventes', pt: 'MO Vendas', pcm: 'MO Sales' },
  'Ask MO': { en: 'Ask MO', yo: 'Béèrè MO', ig: 'Jụọ MO', ha: 'Tambayi MO', sw: 'Uliza MO', fr: 'Demander MO', pt: 'Perguntar MO', pcm: 'Ask MO' },
  'Business Services': { en: 'Business Services', yo: 'Àwọn Ìṣẹ́ Iṣòwò', ig: 'Ọrụ Azụmahịa', ha: 'Ayyukan Kasuwanci', sw: 'Huduma za Biashara', fr: 'Services Entreprise', pt: 'Serviços Empresa', pcm: 'Business Services' },
  'Staff': { en: 'Staff', yo: 'Òṣìṣẹ́', ig: 'Ndị Ọrụ', ha: "Ma'aikata", sw: 'Wafanyakazi', fr: 'Personnel', pt: 'Equipe', pcm: 'Staff' },
  'Branches': { en: 'Branches', yo: 'Àwọn Ẹ̀ka', ig: 'Alaka', ha: 'Rassa', sw: 'Tawi', fr: 'Succursales', pt: 'Filiais', pcm: 'Branches' },
  'Settings': { en: 'Settings', yo: 'Ètò', ig: 'Ntọala', ha: 'Saituna', sw: 'Mipangilio', fr: 'Paramètres', pt: 'Configurações', pcm: 'Settings' },
  'Money Control': { en: 'Money Control', yo: 'Ìṣàkóso Owó', ig: 'Nchịkwa Ego', ha: 'Sarrafa Kuɗi', sw: 'Udhibiti Wa Pesa', fr: 'Contrôle Argent', pt: 'Controle de Dinheiro', pcm: 'Money Control' },
  'Credit Tracking': { en: 'Credit Tracking', yo: 'Ìṣàkóso Kárẹ́dì', ig: 'Nchịkwa Kredit', ha: 'Sarrafa Kredit', sw: 'Udhibiti wa Mikopo', fr: 'Suivi Crédit', pt: 'Rastreamento Crédito', pcm: 'Credit Tracking' },
  'Suppliers': { en: 'Suppliers', yo: 'Àwọn oníṣòwò', ig: 'Ndị Na-ere', ha: 'Masu Samfura', sw: 'Wauzaji', fr: 'Fournisseurs', pt: 'Fornecedores', pcm: 'Suppliers' },
  'Customers': { en: 'Customers', yo: 'Àwọn oníṣàjẹ', ig: 'Ndị Ahịa', ha: 'Abokin ciniki', sw: 'Wateja', fr: 'Clients', pt: 'Clientes', pcm: 'Customers' },
  'Menu Management': { en: 'Menu Management', yo: 'Ìṣàkóso Àkànyẹ̀', ig: 'Nchịkwa Menu', ha: 'Sarrafa Menu', sw: 'Usimamizi wa Menyu', fr: 'Gestion Menu', pt: 'Gestão Menu', pcm: 'Menu Management' },
  'Ingredients': { en: 'Ingredients', yo: 'Àwọn Eroja', ig: 'Ngwaahịa', ha: 'Abubuwan da ke', sw: 'Viungo', fr: 'Ingrédients', pt: 'Ingredientes', pcm: 'Ingredients' },
  'Expiry Alerts': { en: 'Expiry Alerts', yo: 'Ìbànújẹ́ Akókò', ig: 'Ntịrị Mbụ', ha: 'Maye Mai ƙare', sw: 'Matangazo ya Muda', fr: 'Alertes Expiration', pt: 'Alertas Validade', pcm: 'Expiry Alerts' },
  'Production': { en: 'Production', yo: 'Ṣiṣe', ig: 'Mmepụta', ha: 'Samfura', sw: 'Uzalishaji', fr: 'Production', pt: 'Produção', pcm: 'Production' },
  'Payroll': { en: 'Payroll', yo: 'Isánwó', ig: 'Ụgwọ Ọrụ', ha: 'Alawar kuɗi', sw: 'Mshahara', fr: 'Paie', pt: 'Folha de Pagamento', pcm: 'Payroll' },
};

export function getSidebarTranslation(text: string, language: string = 'en'): string {
  const translations = SIDEBAR_TRANSLATIONS[text];
  if (!translations) return text;
  return translations[language] || translations['en'] || text;
}

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
      { id: 'reports', label: 'Reports', tip: 'Business insights', iconClass: 'ni-chart' },
      { id: 'margin-calculator', label: 'Margin Calculator', tip: 'Healthy pricing & margins', iconClass: 'ni-chart' },
      { id: 'bank-reconciliation', label: 'Bank Reconciliation', tip: 'Bank Reconciliation', iconClass: 'ni-bank' },
      { id: 'money-control', label: 'Money Control', tip: 'Money Control', iconClass: 'ni-cash' },
      { id: 'credit-tracking', label: 'Credit Tracking', tip: 'Credit Tracking', iconClass: 'ni-credit' },
      { id: 'menu-management', label: 'Menu Management', tip: 'Menu Management', iconClass: 'ni-menu' },
      { id: 'ingredient-tracking', label: 'Ingredients', tip: 'Ingredients', iconClass: 'ni-ingredient' },
      { id: 'expiry-alerts', label: 'Expiry Alerts', tip: 'Expiry Alerts', iconClass: 'ni-expiry' },
      { id: 'production-tracking', label: 'Production', tip: 'Production', iconClass: 'ni-production', badge: 'Pro' },
    ],
    icon: '',
    id: undefined
  },
  {
    label: 'Growth',
    items: [
      { id: 'capital', label: 'Access Capital', tip: 'Access Capital', iconClass: 'ni-fund' },
      { id: 'referrals', label: 'Referrals', tip: 'Referrals', iconClass: 'ni-gift' },
      { id: 'mo-sell', label: 'MO Sell', tip: 'MO Sell — Commerce Hub', iconClass: 'ni-ecommerce', badge: 'Beta' },
      { id: 'mo-sales', label: 'MO Sales', tip: 'MO Sales — WhatsApp AI salesperson', iconClass: 'mo' },
    ],
    icon: '',
    id: undefined
  },
  {
    label: 'Account',
    items: [
      { id: 'mo', label: 'Ask MO', tip: 'Ask MO', iconClass: 'mo' },
      { id: 'services', label: 'Business Services', tip: 'Business Services', iconClass: 'ni-svc' },
      { id: 'staff', label: 'Staff', tip: 'Staff', iconClass: 'ni-staff', badge: 0 },
      { id: 'supplier-management', label: 'Suppliers', tip: 'Suppliers', iconClass: 'ni-supplier' },
      { id: 'customer-management', label: 'Customers', tip: 'Customers', iconClass: 'ni-customer' },
      { id: 'warehouse', label: 'Warehouse', tip: 'Warehouse', iconClass: 'ni-warehouse' },
      { id: 'stock-transfers', label: 'Stock Transfers', tip: 'Stock Transfers', iconClass: 'ni-transfer' },
      { id: 'document-templates', label: 'Document Templates', tip: 'Document Templates', iconClass: 'ni-template' },
      { id: 'branches', label: 'Branches', tip: 'Branches', iconClass: 'ni-branch', badge: 'Pro' },
      { id: 'payroll', label: 'Payroll', tip: 'Payroll', iconClass: 'ni-payroll', badge: 'Pro' },
      { id: 'wallet', label: 'Wallet', tip: 'Busmo Wallet', iconClass: 'ni-cash' },
      { id: 'settings', label: 'Settings', tip: 'Settings', iconClass: 'ni-set' },
    ],
    icon: '',
    id: undefined
  },
];

export const MOBILE_NAV_ITEMS = ['home', 'sale', 'cashflow', 'mo', 'staff'] as const;
