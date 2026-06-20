'use client';

import React, { useState, useRef } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { Printer, FileText, X, Share2 } from 'lucide-react';
import styles from './ReceiptGenerator.module.css';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
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
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
    fontSize: 'small' | 'medium' | 'large';
    showLogo: boolean;
    showBusinessAddress: boolean;
    showCustomerDetails: boolean;
    showBarcode: boolean;
    customHeader?: string;
    customFooter?: string;
  };
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onClose: () => void;
  isWholesale?: boolean;
}

export function ReceiptGenerator({ receiptData, onClose, isWholesale = false }: ReceiptGeneratorProps) {
  const { showToast } = useApp();
  const { formatMoney, currencyCode } = useCurrency();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Simple PDF generation using browser's print to PDF
      // In production, you'd use a library like jsPDF or html2pdf
      const printContent = receiptRef.current;
      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Receipt - ${receiptData.saleNumber}</title>
                <style>
                  body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                  .receipt-header { text-align: center; margin-bottom: 20px; }
                  .receipt-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                  .receipt-info { font-size: 12px; margin-bottom: 5px; }
                  .receipt-divider { border-top: 1px dashed #000; margin: 10px 0; }
                  .receipt-item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
                  .receipt-total { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; }
                  .receipt-footer { text-align: center; margin-top: 20px; font-size: 11px; }
                </style>
              </head>
              <body>
                ${printContent.innerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
          showToast('✅ PDF download started');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('❌ Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopyToClipboard = () => {
    const message = `
${receiptData.businessName}
${receiptData.businessAddress ? receiptData.businessAddress + '\n' : ''}

RECEIPT - ${receiptData.saleNumber}
Date: ${receiptData.date}
${receiptData.customerName ? 'Customer: ' + receiptData.customerName + '\n' : ''}

ITEMS:
${receiptData.items.map(item => `${item.name} x${item.quantity} = ${formatMoney(item.total)}`).join('\n')}

Subtotal: ${formatMoney(receiptData.subtotal)}
Paid: ${formatMoney(receiptData.amountPaid)}
${receiptData.outstandingBalance > 0 ? `Outstanding: ${formatMoney(receiptData.outstandingBalance)}\n` : ''}Payment: ${receiptData.paymentMethod}
${receiptData.sourceLocation ? `Source: ${receiptData.sourceLocation}\n` : ''}Thank you for your business!
    `.trim();

    navigator.clipboard.writeText(message).then(() => {
      showToast('✅ Receipt copied to clipboard');
    }).catch(() => {
      showToast('❌ Failed to copy to clipboard');
    });
  };


  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Receipt</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Receipt Preview */}
          <div 
            className={styles.receiptPreview} 
            ref={receiptRef}
            style={{
              backgroundColor: receiptData.theme?.backgroundColor || 'white',
              color: receiptData.theme?.textColor || 'black',
            }}
          >
            {receiptData.theme?.showLogo && receiptData.logoUrl && (
              <div className={styles.receiptLogo}>
                <img src={receiptData.logoUrl} alt="Logo" className={styles.logoImage} />
              </div>
            )}
            <div className={styles.receiptHeader}>
              {receiptData.theme?.customHeader && (
                <div className={styles.receiptCustomHeader}>{receiptData.theme.customHeader}</div>
              )}
              <div 
                className={styles.receiptTitle}
                style={{ color: receiptData.theme?.primaryColor || 'black' }}
              >
                {receiptData.businessName}
              </div>
              {receiptData.theme?.showBusinessAddress && receiptData.businessAddress && (
                <div className={styles.receiptInfo}>{receiptData.businessAddress}</div>
              )}
              {receiptData.businessPhone && (
                <div className={styles.receiptInfo}>{receiptData.businessPhone}</div>
              )}
            </div>

            <div 
              className={styles.receiptDivider}
              style={{ borderColor: receiptData.theme?.primaryColor || 'black' }}
            ></div>

            <div className={styles.receiptInfo}>
              <div>Receipt #: {receiptData.saleNumber}</div>
              <div>Date: {receiptData.date}</div>
              {receiptData.theme?.showCustomerDetails && receiptData.customerName && (
                <div>Customer: {receiptData.customerName}</div>
              )}
              {receiptData.theme?.showCustomerDetails && receiptData.customerPhone && (
                <div>Phone: {receiptData.customerPhone}</div>
              )}
              {receiptData.sourceLocation && (
                <div>Source: {receiptData.sourceLocation}</div>
              )}
            </div>

            <div 
              className={styles.receiptDivider}
              style={{ borderColor: receiptData.theme?.primaryColor || 'black' }}
            ></div>

            <div className={styles.receiptItems}>
              <div 
                className={styles.receiptItemHeader}
                style={{ color: receiptData.theme?.secondaryColor || 'black' }}
              >
                <span>ITEM</span>
                <span>QTY</span>
                <span>PRICE</span>
                <span>TOTAL</span>
              </div>
              {receiptData.items.map((item, index) => (
                <div 
                  key={index} 
                  className={styles.receiptItem}
                  style={{ fontSize: receiptData.theme?.fontSize === 'large' ? '14px' : receiptData.theme?.fontSize === 'small' ? '11px' : '12px' }}
                >
                  <span className={styles.itemName}>{item.name}</span>
                  <span>{item.quantity}</span>
                  <span>{formatMoney(item.price)}</span>
                  <span>{formatMoney(item.total)}</span>
                </div>
              ))}
            </div>

            <div 
              className={styles.receiptDivider}
              style={{ borderColor: receiptData.theme?.primaryColor || 'black' }}
            ></div>

            <div className={styles.receiptTotals}>
              <div 
                className={styles.receiptTotal}
                style={{ fontSize: receiptData.theme?.fontSize === 'large' ? '16px' : receiptData.theme?.fontSize === 'small' ? '13px' : '14px' }}
              >
                <span>Subtotal:</span>
                <span>{formatMoney(receiptData.subtotal)}</span>
              </div>
              <div className={styles.receiptTotal}>
                <span>Amount Paid:</span>
                <span>{formatMoney(receiptData.amountPaid)}</span>
              </div>
              {receiptData.outstandingBalance > 0 && (
                <div className={styles.receiptTotal}>
                  <span>Outstanding:</span>
                  <span>{formatMoney(receiptData.outstandingBalance)}</span>
                </div>
              )}
              <div className={styles.receiptTotal}>
                <span>Payment:</span>
                <span>{receiptData.paymentMethod}</span>
              </div>
            </div>

            <div 
              className={styles.receiptDivider}
              style={{ borderColor: receiptData.theme?.primaryColor || 'black' }}
            ></div>

            <div className={styles.receiptFooter}>
              {receiptData.theme?.customFooter ? (
                <div>{receiptData.theme.customFooter}</div>
              ) : (
                <div>Thank you for your business!</div>
              )}
              <div>{new Date().toLocaleDateString()}</div>
              {receiptData.theme?.showBarcode && (
                <div className={styles.barcode}>||||| ||||| |||||</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={styles.actionButton}
              onClick={handlePrint}
              disabled={isPrinting}
            >
              <Printer size={18} />
              {isPrinting ? 'Printing...' : 'Print'}
            </button>
            <button
              className={styles.actionButton}
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              <FileText size={18} />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            {isWholesale && (
              <button
                className={styles.actionButton}
                onClick={handleCopyToClipboard}
              >
                <Share2 size={18} />
                Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
