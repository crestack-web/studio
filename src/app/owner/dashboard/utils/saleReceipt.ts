import { fetchDoc } from '@/lib/supabase-client-data';
import type { ReceiptData, ReceiptTheme } from '../ReceiptGenerator';

export type ReceiptType = 'supermarket' | 'invoice';

export async function loadBusinessReceiptSettings(businessId: string): Promise<{
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  logoUrl?: string;
  receiptType: ReceiptType;
  theme: ReceiptTheme | null;
}> {
  const defaults = {
    businessName: 'Business',
    businessAddress: '',
    businessPhone: '',
    logoUrl: undefined as string | undefined,
    receiptType: 'supermarket' as ReceiptType,
    theme: null as ReceiptTheme | null,
  };
  if (!businessId) return defaults;

  try {
    const data: any = await fetchDoc('businesses', businessId);
    if (!data) return defaults;
    const meta =
      data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
    const receiptTypeRaw =
      data.receiptType || data.receipt_type || meta.receiptType || 'supermarket';
    const receiptType: ReceiptType =
      receiptTypeRaw === 'invoice' ? 'invoice' : 'supermarket';
    const theme =
      data.receiptTheme ||
      data.receipt_theme ||
      meta.receiptTheme ||
      meta.receipt_theme ||
      null;

    return {
      businessName:
        data.name ||
        data.businessName ||
        data.business_name ||
        meta.businessName ||
        'Business',
      businessAddress: data.address || meta.address || '',
      businessPhone: data.phone || meta.phone || '',
      logoUrl: data.logoUrl || data.logo_url || meta.logoUrl || undefined,
      receiptType,
      theme,
    };
  } catch (e) {
    console.warn('[loadBusinessReceiptSettings]', e);
    return defaults;
  }
}

export function buildSaleReceiptData(opts: {
  settings: Awaited<ReturnType<typeof loadBusinessReceiptSettings>>;
  items: Array<{ name: string; quantity: number; price: number }>;
  saleId?: string;
  paymentMethod?: string;
  soldBy?: string;
  customerName?: string;
  customerPhone?: string;
}): ReceiptData {
  const items = opts.items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    price: i.price,
    total: i.price * i.quantity,
  }));
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  return {
    businessName: opts.settings.businessName,
    businessAddress: opts.settings.businessAddress,
    businessPhone: opts.settings.businessPhone,
    customerName: opts.customerName,
    customerPhone: opts.customerPhone,
    saleNumber:
      opts.saleId ||
      `SALE-${Date.now().toString().slice(-8)}`,
    date: new Date().toLocaleString(),
    items,
    subtotal,
    amountPaid: subtotal,
    outstandingBalance: 0,
    paymentMethod: opts.paymentMethod || 'cash',
    logoUrl: opts.settings.logoUrl,
    theme: opts.settings.theme,
    soldBy: opts.soldBy,
  };
}
