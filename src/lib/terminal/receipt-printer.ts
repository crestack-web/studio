/**
 * Hardware-independent receipt printer for Busmo One.
 * BrowserMockPrinter opens a print dialog / downloads text.
 * Z90 thermal adapter will implement ReceiptPrinter using manufacturer SDK later.
 */

export type PrinterStatus = {
  ready: boolean;
  paperOk: boolean;
  message?: string;
};

export type ReceiptLineItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

export type ReceiptData = {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  receiptNumber: string;
  date: string;
  cashier?: string;
  branchName?: string;
  items: ReceiptLineItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  currency?: string;
  note?: string;
};

export interface ReceiptPrinter {
  printReceipt(receipt: ReceiptData): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
}

function formatReceiptText(r: ReceiptData): string {
  const cur = r.currency || '₦';
  const lines: string[] = [];
  lines.push(r.businessName);
  if (r.businessAddress) lines.push(r.businessAddress);
  if (r.businessPhone) lines.push(r.businessPhone);
  if (r.branchName) lines.push(`Branch: ${r.branchName}`);
  lines.push('--------------------------------');
  lines.push(`Receipt: ${r.receiptNumber}`);
  lines.push(`Date: ${r.date}`);
  if (r.cashier) lines.push(`Cashier: ${r.cashier}`);
  lines.push('--------------------------------');
  for (const item of r.items) {
    lines.push(`${item.name}`);
    lines.push(`  ${item.quantity} x ${cur}${item.price.toLocaleString()} = ${cur}${item.total.toLocaleString()}`);
  }
  lines.push('--------------------------------');
  lines.push(`TOTAL: ${cur}${r.total.toLocaleString()}`);
  lines.push(`Paid: ${r.paymentMethod}`);
  if (r.note) lines.push(r.note);
  lines.push('--------------------------------');
  lines.push('Thank you');
  return lines.join('\n');
}

/** Dev/browser adapter — window.print on a simple preformatted block */
export class BrowserMockPrinter implements ReceiptPrinter {
  async getStatus(): Promise<PrinterStatus> {
    return { ready: true, paperOk: true, message: 'Browser mock printer' };
  }

  async printReceipt(receipt: ReceiptData): Promise<void> {
    const text = formatReceiptText(receipt);
    if (typeof window === 'undefined') return;
    const w = window.open('', '_blank', 'width=360,height=600');
    if (!w) {
      console.log('[ReceiptPrinter mock]\\n' + text);
      return;
    }
    w.document.write(
      `<html><head><title>Receipt ${receipt.receiptNumber}</title>
      <style>
        body{font-family:ui-monospace,Menlo,monospace;font-size:12px;padding:16px;white-space:pre-wrap}
        @media print{body{padding:0}}
      </style></head><body>${text.replace(/</g, '&lt;')}</body></html>`
    );
    w.document.close();
    w.focus();
    setTimeout(() => {
      try {
        w.print();
      } catch {
        /* ignore */
      }
    }, 300);
  }
}

/**
 * Placeholder for Z90 thermal printer via manufacturer Android SDK.
 * Do not call real SDK methods until the device SDK is integrated.
 */
export class Z90ThermalPrinterStub implements ReceiptPrinter {
  async getStatus(): Promise<PrinterStatus> {
    return {
      ready: false,
      paperOk: false,
      message: 'Z90 SDK not integrated — use BrowserMockPrinter in development',
    };
  }

  async printReceipt(_receipt: ReceiptData): Promise<void> {
    throw new Error(
      'Z90 thermal printer SDK is not integrated. Wire manufacturer SDK in the Android container.'
    );
  }
}

export function createDefaultPrinter(): ReceiptPrinter {
  return new BrowserMockPrinter();
}

export { formatReceiptText };
