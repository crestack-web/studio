// ═══════════════════════════════════════════
//  BUSMO — Document Template Types
// ═══════════════════════════════════════════

export type DocumentType = 
  | 'sales_invoice'
  | 'payment_receipt'
  | 'delivery_note'
  | 'quotation'
  | 'purchase_order'
  | 'proforma_invoice'
  | 'credit_note';

export type TemplateStyle = 'modern-corporate' | 'nigerian-wholesale' | 'compact-a5' | 'thermal-receipt';
export type FontFamily = 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins';
export type FontSize = 'small' | 'medium' | 'large';

export interface BusinessInfo {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  businessTIN?: string;
  businessVAT?: string;
  businessRegNumber?: string;
  logoUrl?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  type: 'logo' | 'text' | 'none';
  text?: string;
  opacity: number;
}

export interface DocumentTemplate {
  id: string;
  businessId: string;
  documentType: DocumentType;
  templateStyle: TemplateStyle;
  
  // Branding
  businessInfo: BusinessInfo;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Typography
  fontFamily: FontFamily;
  fontSize: FontSize;
  
  // Layout options
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  
  // Section visibility
  sections: {
    header: boolean;
    businessInfo: boolean;
    invoiceInfo: boolean;
    customerInfo: boolean;
    itemTable: boolean;
    sku: boolean;
    discount: boolean;
    totals: boolean;
    amountInWords: boolean;
    notes: boolean;
    termsAndConditions: boolean;
    signatures: boolean;
    warehouseNote: boolean;
    qrCode: boolean;
    watermark: WatermarkConfig;
    footer: boolean;
  };
  
  // Custom text
  customHeader?: string;
  customFooter?: string;
  warehouseNote?: string;
  termsAndConditions?: string;
  
  // Paper size
  paperSize: 'a4' | 'a5' | 'thermal-58mm' | 'thermal-80mm';
  
  // Version tracking for backward compatibility
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceData {
  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  salesRepresentative?: string;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
  paymentMethod?: string;
  
  // Customer info
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  customerAddress?: string;
  
  // Items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  discountAmount: number;
  discountPercentage?: number;
  vatAmount: number;
  vatPercentage: number;
  otherCharges: number;
  grandTotal: number;
  
  // Additional
  amountInWords?: string;
  notes?: string;
  warehouse?: string;
  
  // Template info
  templateId?: string;
  templateVersion?: string;
}

export interface InvoiceItem {
  serialNumber: number;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface ReceiptData {
  // Receipt details
  receiptNumber: string;
  receiptDate: string;
  paymentMethod: string;
  amountPaid: number;
  change?: number;
  
  // Customer
  customerName?: string;
  customerPhone?: string;
  
  // Items
  items: ReceiptItem[];
  
  // Totals
  subtotal: number;
  tax: number;
  total: number;
  
  // Additional
  sourceLocation?: string;
  cashier?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface DeliveryNoteData {
  deliveryNoteNumber: string;
  deliveryDate: string;
  expectedReturnDate?: string;
  
  customerName: string;
  customerCompany?: string;
  customerAddress?: string;
  
  items: DeliveryNoteItem[];
  
  driverName?: string;
  vehicleNumber?: string;
  notes?: string;
}

export interface DeliveryNoteItem {
  serialNumber: number;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  delivered: number;
}

export interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  customerAddress?: string;
  
  items: QuotationItem[];
  
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  grandTotal: number;
  
  notes?: string;
  termsAndConditions?: string;
}

export interface QuotationItem {
  serialNumber: number;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrderData {
  poNumber: string;
  poDate: string;
  expectedDeliveryDate: string;
  
  supplierName: string;
  supplierCompany?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  
  items: PurchaseOrderItem[];
  
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  
  notes?: string;
  authorizedBy?: string;
}

export interface PurchaseOrderItem {
  serialNumber: number;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface ProformaInvoiceData {
  proformaNumber: string;
  proformaDate: string;
  validUntil: string;
  
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  customerAddress?: string;
  
  items: ProformaItem[];
  
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  grandTotal: number;
  
  notes?: string;
}

export interface ProformaItem {
  serialNumber: number;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface CreditNoteData {
  creditNoteNumber: string;
  creditNoteDate: string;
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  
  customerName: string;
  customerCompany?: string;
  
  reason: string;
  
  items: CreditNoteItem[];
  
  totalCredit: number;
  
  notes?: string;
  authorizedBy?: string;
}

export interface CreditNoteItem {
  serialNumber: number;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

// Default template configurations for each document type
export const DEFAULT_DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  {
    value: 'sales_invoice',
    label: 'Sales Invoice',
    description: 'Standard invoice for sales transactions'
  },
  {
    value: 'payment_receipt',
    label: 'Payment Receipt',
    description: 'Receipt for payment confirmation'
  },
  {
    value: 'delivery_note',
    label: 'Delivery Note',
    description: 'Document for goods delivery'
  },
  {
    value: 'quotation',
    label: 'Quotation',
    description: 'Price quote for potential customers'
  },
  {
    value: 'purchase_order',
    label: 'Purchase Order',
    description: 'Order sent to suppliers'
  },
  {
    value: 'proforma_invoice',
    label: 'Proforma Invoice',
    description: 'Pre-invoice for approval'
  },
  {
    value: 'credit_note',
    label: 'Credit Note',
    description: 'Credit memo for returns/adjustments'
  }
];

export const DEFAULT_TEMPLATE_STYLES: { value: TemplateStyle; label: string; description: string }[] = [
  {
    value: 'modern-corporate',
    label: 'Modern Corporate',
    description: 'Minimal, professional layout for distributors and manufacturers'
  },
  {
    value: 'nigerian-wholesale',
    label: 'Nigerian Wholesale',
    description: 'Dense information layout optimized for A4, warehouse operations'
  },
  {
    value: 'compact-a5',
    label: 'Compact A5',
    description: 'Smaller version for medium businesses'
  },
  {
    value: 'thermal-receipt',
    label: 'Thermal Receipt',
    description: 'POS receipt for supermarkets and convenience stores'
  }
];

export const CATEGORY_DEFAULT_TEMPLATES: Record<string, TemplateStyle> = {
  wholesale: 'nigerian-wholesale',
  distributor: 'nigerian-wholesale',
  retail: 'nigerian-wholesale',
  supermarket: 'nigerian-wholesale',
  grocery: 'nigerian-wholesale',
  restaurant: 'modern-corporate',
  cafe: 'modern-corporate',
  food: 'modern-corporate',
  pharmacy: 'compact-a5',
  healthcare: 'compact-a5',
  manufacturing: 'modern-corporate',
  fashion: 'modern-corporate',
  electronics: 'modern-corporate',
  services: 'modern-corporate',
  education: 'modern-corporate',
  other: 'modern-corporate',
};
