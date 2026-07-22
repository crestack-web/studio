import type { Timestamp } from 'firebase-admin/firestore';

// ─── Store Config ─────────────────────────────────────────────────────────────

export interface DomainPurchaseRecord {
  domain: string;
  godaddyRegistrationId: string;
  paystackReference: string;
  purchasedAt: Timestamp;
  renewalDate: Timestamp;
  renewalPriceNgn: number;
  autoRenew: boolean;
  registrationStatus: 'pending' | 'active' | 'failed';
}

export type StorefrontTheme = 'classic' | 'luxe' | 'market' | 'studio' | 'bold' | 'minimal';

// ─── Theme Section Editor ─────────────────────────────────────────────────────

export type StoreSectionType =
  | 'header'
  | 'hero'
  | 'collections'
  | 'featured'
  | 'products'
  | 'announcement'
  | 'footer';

export interface HeroSectionSettings {
  heading?: string;           // override store name
  subheading?: string;        // override tagline
  ctaLabel?: string;          // e.g. "Shop Now →"
  ctaUrl?: string;            // defaults to "#products"
  backgroundImage?: string | null;
  overlayOpacity?: number;    // 0-1
  textAlign?: 'left' | 'center' | 'right';
  showTagline?: boolean;
}

export interface CollectionsSectionSettings {
  heading?: string;
  layout?: 'strip' | 'grid';
  maxItems?: number;
  showCoverImages?: boolean;
}

export interface FeaturedSectionSettings {
  heading?: string;
  maxItems?: number;
  columns?: 2 | 3 | 4;
}

export interface ProductsSectionSettings {
  heading?: string;
  columns?: 2 | 3 | 4;
  showFilters?: boolean;
  defaultSort?: 'newest' | 'price_asc' | 'price_desc';
}

export interface AnnouncementSectionSettings {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  dismissible?: boolean;
  linkLabel?: string;
  linkUrl?: string;
}

export interface HeaderSectionSettings {
  showSearch?: boolean;
  showCartCount?: boolean;
  sticky?: boolean;
}

export interface FooterSectionSettings {
  showPoweredBy?: boolean;
  customText?: string;
  showLogo?: boolean;
  links?: { label: string; url: string }[];
  socials?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
    youtube?: string;
  };
}

export type SectionSettings =
  | HeroSectionSettings
  | CollectionsSectionSettings
  | FeaturedSectionSettings
  | ProductsSectionSettings
  | AnnouncementSectionSettings
  | HeaderSectionSettings
  | FooterSectionSettings;

export interface StoreSection {
  id: string;
  type: StoreSectionType;
  enabled: boolean;
  order: number;
  settings: SectionSettings;
}

export const DEFAULT_SECTIONS: StoreSection[] = [
  { id: 'header',       type: 'header',      enabled: true,  order: 0, settings: { showSearch: false, showCartCount: true, sticky: true } },
  { id: 'hero',         type: 'hero',        enabled: true,  order: 1, settings: { ctaLabel: 'Shop Now', ctaUrl: '#products', textAlign: 'left', showTagline: true } },
  { id: 'collections',  type: 'collections', enabled: true,  order: 2, settings: { heading: 'Collections', layout: 'strip', maxItems: 6, showCoverImages: true } },
  { id: 'featured',     type: 'featured',    enabled: true,  order: 3, settings: { heading: '⭐ Featured', maxItems: 4, columns: 4 } },
  { id: 'products',     type: 'products',    enabled: true,  order: 4, settings: { heading: 'All Products', columns: 3, showFilters: false, defaultSort: 'newest' } },
  { id: 'footer',       type: 'footer',      enabled: true,  order: 5, settings: { showPoweredBy: true } },
];

export interface StoreConfig {
  storeSlug: string;
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  businessCategory: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  status: 'draft' | 'active' | 'paused';
  theme: StorefrontTheme;
  tagline?: string | null;
  storePolicy?: string | null;
  sections?: StoreSection[];
  /** Busmo collects payments on behalf of merchant, charges 5% commission */
  managedPayments?: boolean;
  /** Merchant bank account for payouts (only stored when managedPayments = true) */
  payoutBankName?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
  paystackPublicKey: string;
  enabledProductTypes: Array<'physical' | 'digital' | 'service'>;
  pickupLocations: Array<{ name: string; address: string }>;
  customDomain: string | null;
  customDomainStatus: 'pending' | 'verified' | 'failed';
  customDomainVerifiedAt: Timestamp | null;
  domainPurchaseRecord: DomainPurchaseRecord | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Store Products ───────────────────────────────────────────────────────────

export interface StorefrontProduct {
  productId: string;
  productType: 'physical' | 'digital' | 'service';
  displayName: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  collectionIds: string[];
  tags: string[];
  stock: number;
  sku: string | null;
  available: boolean;
  featured: boolean;
  digitalFileUrl: string | null;
  deliveryNote: string | null;
  lowStockThreshold: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export interface StoreCollection {
  title: string;
  description: string;
  coverImageUrl: string | null;
  productIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending_payment' | 'paid' | 'processing'
  | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: Timestamp;
  changedBy: string;
}

export interface OrderLineItem {
  productId: string;
  productType: 'physical' | 'digital' | 'service';
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface StoreOrder {
  orderNumber: string;
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

// ─── Checkout Sessions ────────────────────────────────────────────────────────

export type CheckoutSessionStatus =
  | 'pending' | 'payment_initiated' | 'payment_confirmed'
  | 'payment_confirmed_integration_pending' | 'completed' | 'expired';

export interface CheckoutSession {
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
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

// ─── Shipping Zones ───────────────────────────────────────────────────────────

export interface ShippingZone {
  zoneName: string;
  regions: string[];
  flatRate: number;
  estimatedDeliveryDays: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'page_view' | 'add_to_cart' | 'checkout_initiated' | 'order_completed';

export interface StoreAnalyticsEvent {
  eventType: AnalyticsEventType;
  storeSlug: string;
  pageType: string | null;
  productId: string | null;
  timestamp: Timestamp;
}

// ─── Cart (client-side) ───────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  displayName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
  productType: 'physical' | 'digital' | 'service';
}

export interface Cart {
  storeSlug: string;
  items: CartItem[];
  updatedAt: number;
}

// ─── Integration Bridge ───────────────────────────────────────────────────────

export interface PaystackTransactionData {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface IntegrationBridgeParams {
  businessId: string;
  sessionId: string;
  paystackData: PaystackTransactionData;
}

export interface IntegrationBridgeResult {
  orderId: string;
}

// ─── Managed Payments — Earnings & Payouts ───────────────────────────────────

export type EarningStatus = 'pending' | 'available' | 'paid_out';

export interface StoreEarning {
  orderId: string;
  orderNumber: string;
  customerName: string;
  grossAmount: number;       // order total
  commissionRate: number;    // e.g. 0.05
  commissionAmount: number;  // grossAmount * commissionRate
  netAmount: number;         // grossAmount - commissionAmount
  currency: string;
  status: EarningStatus;
  payoutRequestId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PayoutStatus = 'requested' | 'processing' | 'completed' | 'rejected';

export interface PayoutRequest {
  businessId: string;
  amount: number;              // total net amount being requested
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  earningIds: string[];        // storeEarnings doc IDs included in this payout
  status: PayoutStatus;
  rejectionReason: string | null;
  processedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
