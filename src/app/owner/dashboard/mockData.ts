// Define Service type locally (remove import if './types' does not export Service)
type Service = {
  id: number;
  category: string;
  name: string;
  description: string;
  price: string;
  delivery: string;
  rating: string;
  iconBg: string;
  iconStroke: string;
};

// Define MetricItem type locally
type MetricItem = {
  label: string;
  value: string;
  trend: string;
  trendType: 'up' | 'down' | 'neutral';
};

// Define ChecklistItem type locally
type ChecklistItem = {
  id: number;
  label: string;
  detail: string;
  status: 'done' | 'pending' | 'todo';
  action?: string;
};

// Define AvatarOption type locally
type AvatarOption = {
  id: string;
  type: 'color' | 'emoji';
  content: string;
  bg: string;
  color: string;
};

// Define StaffMember type locally since it's not exported from './types'
type StaffMember = {
  id: number;
  initials: string;
  name: string;
  role: string;
  revenue: string;
  transactions: number;
  avatarBg: string;
  avatarColor: string;
};

// Define FundingOption type locally
type FundingOption = {
  id: number;
  icon: string;
  name: string;
  description: string;
  rangeLabel: string;
  rangeValue: string;
  secondLabel: string;
  secondValue: string;
  tag: string;
  tagType: string;
};

// Define Product type locally
type Product = {
  id: number;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  emoji: string;
};

// ═══════════════════════════════════════════
//  BUSMO — Mock / Seed Data
//  Replace with real API calls in production
// ═══════════════════════════════════════════

export const CURRENT_USER = {
  id: '123',
  name: 'Jane Doe',
  shortName: 'Jane',
  initials: 'JD',
  role: 'owner',
  plan: 'pro',
  avatarContent: 'JD',
  avatarStyle: { background: '#2196f3', color: '#fff' },
  email: 'jane.doe@example.com', // <-- Add this line
};

// ── Home metrics ─────────────────────────────
// Note: These are mock values. In production, use formatCurrency() from @/lib/currency
export const HOME_METRICS = [
  { label: "Today's Sales",  value: '₦45,000', valueNum: 45000, trend: '↑ 12%',  trendType: 'up'      },
  { label: "Today's Profit", value: '₦13,050', valueNum: 13050, trend: '↑ 8%',   trendType: 'up'      },
  { label: 'Profit Margin',  value: '29%',      valueNum: 29,    trend: 'Healthy', trendType: 'up'      },
  { label: 'Cash Balance',   value: '₦150K',    valueNum: 150000, trend: '~45d runway', trendType: 'neutral' },
];

export const INSIGHTS = [
  { color: 'var(--green)',  text: 'Profit margin', strong: 'healthy at 29%' },
  { color: 'var(--red)',    text: '',               strong: 'Bottled Water', suffix: ' runs out in ~3 days' },
  { color: 'var(--blue)',   text: 'Sabuni is ',     strong: '96% of revenue', suffix: ' — diversify' },
  { color: 'var(--purple)', text: 'Cash runway strong at ', strong: '~45 days' },
];

export const FORECASTS = [
  { label: 'Next Week',   value: '~₦91K',         alert: false },
  { label: 'Busiest Day', value: 'Saturday',      alert: false },
  { label: 'Cash Runway', value: '~45 days',      alert: false },
  { label: 'Stock Alert', value: 'Water out in 3d', alert: true },
];

// ── Products ─────────────────────────────────
export const PRODUCTS: Product[] = [
  { id: 1, name: 'Bottled Water',     price: 150,  costPrice: 90,  stock: 4,  emoji: '💧' },
  { id: 2, name: 'Sabuni (Omo 500g)', price: 500,  costPrice: 350, stock: 7,  emoji: '🧴' },
  { id: 3, name: 'Indomie Noodles',   price: 300,  costPrice: 180, stock: 25, emoji: '🍜' },
  { id: 4, name: 'Milo (400g)',        price: 2200, costPrice: 1700,stock: 12, emoji: '☕' },
  { id: 5, name: 'Bread (Loaf)',       price: 800,  costPrice: 550, stock: 8,  emoji: '🍞' },
  { id: 6, name: 'Coca-Cola (35cl)',   price: 250,  costPrice: 160, stock: 48, emoji: '🥤' },
  { id: 7, name: 'Sugar (1kg)',        price: 900,  costPrice: 680, stock: 15, emoji: '🍬' },
  { id: 8, name: 'Rice (1kg)',         price: 1200, costPrice: 900, stock: 20, emoji: '🍚' },
];

// ── Staff ────────────────────────────────────
export const STAFF_MEMBERS: StaffMember[] = [
  { id: 1, initials: 'FK', name: 'Fatima Kabir',  role: 'Cashier',       revenue: '₦22,400', transactions: 120, avatarBg: '#EDE8FC', avatarColor: '#6B3FE7' },
  { id: 2, initials: 'IO', name: 'Ibrahim Ojo',   role: 'Stock Manager', revenue: '₦8,900',  transactions: 45,  avatarBg: '#DCFCE7', avatarColor: '#16A34A' },
  { id: 3, initials: 'AM', name: 'Amaka Musa',    role: 'Sales Staff',   revenue: '₦14,200', transactions: 89,  avatarBg: '#FEF3C7', avatarColor: '#D97706' },
];

// ── Services ─────────────────────────────────
export const SERVICES: Service[] = [
  { id: 1, category: 'setup',     name: 'Store Setup & Config',       description: 'Full professional setup of your Busmo storefront, product layout, and branding.',          price: '₦8,500',  delivery: '3–5 days',      rating: '4.9', iconBg: '#EDE8FC', iconStroke: '#6B3FE7' },
  { id: 2, category: 'marketing', name: 'Product Photography',        description: 'Professional product photos optimised for Busmo Market to boost conversions.',              price: '₦12,000', delivery: 'Per 10 items',  rating: '4.8', iconBg: '#DCFCE7', iconStroke: '#16A34A' },
  { id: 3, category: 'marketing', name: 'Advertising Campaign',       description: 'Targeted ad campaign on social media & Busmo Market to drive more buyers.',                price: '₦15,000', delivery: 'Monthly',       rating: '4.7', iconBg: '#FFEDD5', iconStroke: '#EA580C' },
  { id: 4, category: 'finance',   name: 'Business Audit & Advice',    description: 'Expert review of your Busmo data: profit leaks, pricing strategy, growth plan.',           price: '₦20,000', delivery: 'One-time',      rating: '5.0', iconBg: '#DCFCE7', iconStroke: '#16A34A' },
  { id: 5, category: 'legal',     name: 'Legal & CAC Registration',   description: 'Complete CAC business registration, tax ID, and all legal compliance requirements.',       price: '₦35,000', delivery: '5–10 days',     rating: '4.9', iconBg: '#FCE7F3', iconStroke: '#DB2777' },
  { id: 6, category: 'finance',   name: 'Bookkeeping Setup',          description: 'Set up proper bookkeeping so your Busmo data maps to formal accounting.',                  price: '₦10,000', delivery: 'One-time',      rating: '4.8', iconBg: '#EFF6FF', iconStroke: '#2563EB' },
  { id: 7, category: 'tech',      name: 'WhatsApp Business Bot',      description: 'Automated WhatsApp chatbot that takes orders and updates your Busmo inventory.',           price: '₦25,000', delivery: '7–10 days',     rating: '4.7', iconBg: '#CCFBF1', iconStroke: '#0D9488' },
  { id: 8, category: 'setup',     name: 'Product Listing Boost',      description: 'Expert rewriting of all product names, descriptions, and pricing for max visibility.',     price: '₦6,000',  delivery: '2–3 days',      rating: '4.8', iconBg: '#FEF3C7', iconStroke: '#D97706' },
];

// ── Capital ──────────────────────────────────
export const FUNDING_OPTIONS: FundingOption[] = [
  {
    id: 1,
    icon: 'cash',
    name: 'Revenue-Based Loan',
    description: 'Get an advance against future revenue. Repaid as % of daily sales.',
    rangeLabel: 'Range', rangeValue: '₦50K–₦500K',
    secondLabel: 'Rate',  secondValue: '2.5%/mo',
    tag: '⏳ Requires 90 days data',
    tagType: 'pending',
  },
  {
    id: 2,
    icon: 'users',
    name: 'Profit-Sharing Deal',
    description: 'Investor funds growth in exchange for a share of profits for a set period.',
    rangeLabel: 'Range', rangeValue: '₦100K–₦2M',
    secondLabel: 'Share',  secondValue: '10–30%',
    tag: '✓ You may qualify',
    tagType: 'qualify',
  },
  {
    id: 3,
    icon: 'trend',
    name: 'Equity Investment',
    description: 'Raise capital from investors in exchange for a stake in your business.',
    rangeLabel: 'Range',  rangeValue: '₦500K–₦10M',
    secondLabel: 'Equity', secondValue: '5–25%',
    tag: 'ℹ Company plan required',
    tagType: 'info',
  },
];

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 1, label: 'Business verified',    detail: 'owner account active',       status: 'done'    },
  { id: 2, label: '45+ days data',        detail: 'recorded consistently',      status: 'done'    },
  { id: 3, label: 'Positive margin',      detail: 'currently 29%',              status: 'done'    },
  { id: 4, label: '90 days required',     detail: '45 more days to go',         status: 'pending', action: 'Tips'       },
  { id: 5, label: 'Connect bank account', detail: 'required for payout',        status: 'todo',    action: 'Connect →'  },
  { id: 6, label: 'Upload business ID',   detail: 'CAC or valid ID',            status: 'todo',    action: 'Upload →'   },
];

// ── Avatar options ───────────────────────────
export const AVATAR_COLORS: AvatarOption[] = [
  { id: 'c0',  type: 'color', content: 'AU', bg: '#6B3FE7',                                   color: '#fff' },
  { id: 'c1',  type: 'color', content: 'AU', bg: '#16A34A',                                   color: '#fff' },
  { id: 'c2',  type: 'color', content: 'AU', bg: '#2563EB',                                   color: '#fff' },
  { id: 'c3',  type: 'color', content: 'AU', bg: '#DC2626',                                   color: '#fff' },
  { id: 'c4',  type: 'color', content: 'AU', bg: '#D97706',                                   color: '#fff' },
  { id: 'c5',  type: 'color', content: 'AU', bg: '#0D9488',                                   color: '#fff' },
  { id: 'c6',  type: 'color', content: 'AU', bg: '#DB2777',                                   color: '#fff' },
  { id: 'c7',  type: 'color', content: 'AU', bg: '#7C3AED',                                   color: '#fff' },
  { id: 'c8',  type: 'color', content: 'AU', bg: '#0F172A',                                   color: '#fff' },
  { id: 'c9',  type: 'color', content: 'AU', bg: 'linear-gradient(135deg,#6B3FE7,#EC4899)',   color: '#fff' },
  { id: 'c10', type: 'color', content: 'AU', bg: 'linear-gradient(135deg,#16A34A,#0D9488)',   color: '#fff' },
  { id: 'c11', type: 'color', content: 'AU', bg: 'linear-gradient(135deg,#2563EB,#7C3AED)',   color: '#fff' },
];

export const AVATAR_EMOJIS: AvatarOption[] = [
  '😊','🦁','🐯','🦊','🐺','🦋','🌟','🔥','⚡','💎','🚀','🎯','💡','🌿','🎭','🏆','👑','🎨',
].map((emoji, i) => ({
  id: `e${i}`,
  type: 'emoji',
  content: emoji,
  bg: 'var(--bg)',
  color: 'var(--text-1)',
}));

// ── MO quick suggestions ─────────────────────
export const MO_SUGGESTIONS = [
  'Profit today?',
  'Restock advice',
  'Check expenses',
  'Cash status',
  'Add a product',
];

export const MO_ASK_CHIPS = [
  { label: 'Am I spending too much?',   reply: 'Your expenses this month: ₦28,400 (24% of revenue). Slightly above the 20% healthy threshold. Top: Restocking ₦18K, Logistics ₦6K, Utilities ₦4.4K. Consider reducing logistics cost.', replyNum: { expenses: 28400, percentage: 24, restocking: 18000, logistics: 6000, utilities: 4400 } },
  { label: 'Which product to restock?', reply: 'Priority 1: Bottled Water (4 units, runs out in ~2 days). Priority 2: Sabuni (7 units). Order 48 Bottled Water and 30 Sabuni ASAP. These two drive 60% of your revenue.' },
  { label: 'Why did profit drop?',      reply: 'Profit dropped 18% vs last week. 2 causes: Cost of goods up ₦4,200 (Bottled Water price hike) + 2 high-margin products out of stock for 1.5 days, losing ~₦6,800 in revenue.', replyNum: { costIncrease: 4200, lostRevenue: 6800 } },
  { label: 'Can I afford to grow?',     reply: 'Yes — ₦150K cash, 45-day runway. You can safely invest up to ₦30K this month. Best ROI: restock high-margin items first, then activate your Busmo Market storefront.', replyNum: { cash: 150000, runway: 45, maxInvest: 30000 } },
];
