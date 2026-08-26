'use client';

import React, { useRef, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { Printer, FileText, X, Share2 } from 'lucide-react';
import styles from './ReceiptGenerator.module.css';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptTheme {
  id?: string;
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: 'small' | 'medium' | 'large' | string;
  showLogo?: boolean;
  showBusinessAddress?: boolean;
  showCustomerDetails?: boolean;
  showBarcode?: boolean;
  customHeader?: string;
  customFooter?: string;
  logoUrl?: string;
}

export interface ReceiptData {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  customerName?: string;
  customerPhone?: string;
  saleNumber: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentMethod: string;
  sourceLocation?: string;
  logoUrl?: string;
  theme?: ReceiptTheme | null;
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onClose: () => void;
  isWholesale?: boolean;
  receiptType?: 'supermarket' | 'invoice';
}

const FONT_SIZE_MAP: Record<string, string> = {
  small: '11px',
  medium: '12.5px',
  large: '14px',
};

function normalizeTheme(theme?: ReceiptTheme | null): Required<
  Pick<
    ReceiptTheme,
    | 'primaryColor'
    | 'secondaryColor'
    | 'textColor'
    | 'backgroundColor'
    | 'fontSize'
    | 'showLogo'
    | 'showBusinessAddress'
    | 'showCustomerDetails'
    | 'showBarcode'
  >
> &
  Pick<ReceiptTheme, 'customHeader' | 'customFooter' | 'logoUrl'> {
  return {
    primaryColor: theme?.primaryColor || '#111827',
    secondaryColor: theme?.secondaryColor || '#6b7280',
    textColor: theme?.textColor || '#111827',
    backgroundColor: theme?.backgroundColor || '#ffffff',
    fontSize: theme?.fontSize || 'medium',
    showLogo: theme?.showLogo !== false,
    showBusinessAddress: theme?.showBusinessAddress !== false,
    showCustomerDetails: theme?.showCustomerDetails !== false,
    showBarcode: theme?.showBarcode === true,
    customHeader: theme?.customHeader,
    customFooter: theme?.customFooter,
    logoUrl: theme?.logoUrl,
  };
}

export function ReceiptGenerator({
  receiptData,
  onClose,
  isWholesale = false,
  receiptType = 'supermarket',
}: ReceiptGeneratorProps) {
  const { showToast } = useApp();
  const { formatMoney } = useCurrency();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const theme = normalizeTheme(receiptData.theme);
  const logoSrc = receiptData.logoUrl || theme.logoUrl || '';
  const fontPx = FONT_SIZE_MAP[String(theme.fontSize)] || FONT_SIZE_MAP.medium;
  const initial = (receiptData.businessName || 'B').charAt(0).toUpperCase();

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 120);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Browser print-to-PDF is the most reliable path without extra deps
      window.print();
      showToast('Use “Save as PDF” in the print dialog');
    } catch {
      showToast('Could not open print dialog');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const lines = [
        receiptData.businessName,
        `Sale ${receiptData.saleNumber}`,
        receiptData.date,
        '',
        ...receiptData.items.map(
          (i) => `${i.name} ×${i.quantity} — ${formatMoney(i.total)}`
        ),
        '',
        `Total: ${formatMoney(receiptData.subtotal)}`,
        `Paid: ${formatMoney(receiptData.amountPaid)} (${receiptData.paymentMethod})`,
      ];
      if (receiptData.outstandingBalance > 0) {
        lines.push(`Outstanding: ${formatMoney(receiptData.outstandingBalance)}`);
      }
      const text = lines.join('\n');

      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `Receipt ${receiptData.saleNumber}`,
          text,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('Receipt copied to clipboard');
      } else {
        showToast('Sharing is not supported on this device');
      }
    } catch {
      /* user cancelled share */
    } finally {
      setIsSharing(false);
    }
  };

  const paperStyle: React.CSSProperties = {
    ['--rc-primary' as string]: theme.primaryColor,
    ['--rc-secondary' as string]: theme.secondaryColor,
    ['--rc-text' as string]: theme.textColor,
    ['--rc-bg' as string]: theme.backgroundColor,
    ['--rc-font' as string]: fontPx,
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Sale receipt">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {receiptType === 'invoice' ? 'Invoice' : 'Sale receipt'}
          </h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close receipt"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div ref={receiptRef} className={styles.receiptPreview} style={paperStyle}>
            <div className={styles.receiptInner}>
              <header className={styles.receiptHeader}>
                {theme.showLogo && (
                  <div className={styles.receiptLogo}>
                    {logoSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoSrc}
                        alt={receiptData.businessName}
                        className={styles.logoImage}
                      />
                    ) : (
                      <div
                        className={styles.logoFallback}
                        style={{ background: theme.primaryColor }}
                      >
                        {initial}
                      </div>
                    )}
                  </div>
                )}

                {theme.customHeader ? (
                  <div className={styles.receiptCustomHeader}>{theme.customHeader}</div>
                ) : null}

                <h3 className={styles.receiptTitle} style={{ color: theme.primaryColor }}>
                  {receiptData.businessName || 'Business'}
                </h3>

                {theme.showBusinessAddress && receiptData.businessAddress ? (
                  <p className={styles.receiptInfo}>{receiptData.businessAddress}</p>
                ) : null}
                {theme.showBusinessAddress && receiptData.businessPhone ? (
                  <p className={styles.receiptInfo}>{receiptData.businessPhone}</p>
                ) : null}
              </header>

              <hr
                className={styles.receiptDivider}
                style={{ borderColor: theme.primaryColor }}
              />

              <div className={styles.receiptMeta}>
                <div className={styles.receiptMetaRow}>
                  <span className={styles.receiptMetaLabel}>Receipt</span>
                  <span className={styles.receiptMetaValue}>{receiptData.saleNumber}</span>
                </div>
                <div className={styles.receiptMetaRow}>
                  <span className={styles.receiptMetaLabel}>Date</span>
                  <span className={styles.receiptMetaValue}>{receiptData.date}</span>
                </div>
                {receiptData.sourceLocation ? (
                  <div className={styles.receiptMetaRow}>
                    <span className={styles.receiptMetaLabel}>Location</span>
                    <span className={styles.receiptMetaValue}>{receiptData.sourceLocation}</span>
                  </div>
                ) : null}
                {theme.showCustomerDetails && receiptData.customerName ? (
                  <div className={styles.receiptMetaRow}>
                    <span className={styles.receiptMetaLabel}>Customer</span>
                    <span className={styles.receiptMetaValue}>{receiptData.customerName}</span>
                  </div>
                ) : null}
                {theme.showCustomerDetails && receiptData.customerPhone ? (
                  <div className={styles.receiptMetaRow}>
                    <span className={styles.receiptMetaLabel}>Phone</span>
                    <span className={styles.receiptMetaValue}>{receiptData.customerPhone}</span>
                  </div>
                ) : null}
                {isWholesale || receiptType === 'invoice' ? (
                  <div className={styles.receiptMetaRow}>
                    <span className={styles.receiptMetaLabel}>Type</span>
                    <span className={styles.receiptMetaValue}>
                      {receiptType === 'invoice' ? 'Invoice' : 'Wholesale'}
                    </span>
                  </div>
                ) : null}
              </div>

              <hr
                className={styles.receiptDivider}
                style={{ borderColor: theme.primaryColor }}
              />

              <div className={styles.receiptItems}>
                <div className={styles.receiptItemHeader}>
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Amount</span>
                </div>
                {receiptData.items.map((item, idx) => (
                  <React.Fragment key={`${item.name}-${idx}`}>
                    <div className={styles.receiptItem}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemQty}>×{item.quantity}</span>
                      <span className={styles.itemTotal}>{formatMoney(item.total)}</span>
                    </div>
                    <div className={styles.itemUnit}>
                      {formatMoney(item.price)} each
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <hr
                className={styles.receiptDivider}
                style={{ borderColor: theme.primaryColor }}
              />

              <div className={styles.receiptTotals}>
                <div className={styles.receiptTotal}>
                  <span>Subtotal</span>
                  <span>{formatMoney(receiptData.subtotal)}</span>
                </div>
                <div className={styles.receiptTotal}>
                  <span>Amount paid</span>
                  <span>{formatMoney(receiptData.amountPaid)}</span>
                </div>
                {receiptData.outstandingBalance > 0 ? (
                  <div className={styles.receiptTotal} style={{ color: theme.secondaryColor }}>
                    <span>Outstanding</span>
                    <span>{formatMoney(receiptData.outstandingBalance)}</span>
                  </div>
                ) : null}
                <div className={styles.receiptTotal}>
                  <span>Payment</span>
                  <span style={{ textTransform: 'capitalize' }}>
                    {receiptData.paymentMethod || 'cash'}
                  </span>
                </div>
              </div>

              <div className={styles.receiptGrand} style={{ borderColor: theme.primaryColor }}>
                <span>Total</span>
                <span style={{ color: theme.primaryColor }}>
                  {formatMoney(receiptData.subtotal)}
                </span>
              </div>

              <hr
                className={styles.receiptDivider}
                style={{ borderColor: theme.primaryColor }}
              />

              <footer className={styles.receiptFooter} style={{ color: theme.secondaryColor }}>
                {receiptType === 'invoice' ? (
                  <>
                    <div>
                      <strong style={{ color: theme.textColor }}>Payment terms:</strong> due
                      within 30 days
                    </div>
                    <div style={{ marginTop: 6 }}>Thank you for your business!</div>
                  </>
                ) : (
                  <div>
                    {theme.customFooter || 'Thank you for your business!'}
                  </div>
                )}
                {theme.showBarcode ? (
                  <div className={styles.barcode} aria-hidden>
                    ||||| |||| ||||| |||| |||||
                  </div>
                ) : null}
                <div className={styles.saleCode}>{receiptData.saleNumber}</div>
              </footer>
            </div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            onClick={handlePrint}
            disabled={isPrinting}
          >
            <Printer size={18} />
            {isPrinting ? 'Printing…' : 'Print'}
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            <FileText size={18} />
            PDF
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonShare}`}
            onClick={handleShare}
            disabled={isSharing}
          >
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptGenerator;
