'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { Printer, FileText, X, Share2 } from 'lucide-react';
import { templateManager } from './documentTemplates/templateManager';
import { DocumentTemplate, InvoiceData, CATEGORY_DEFAULT_TEMPLATES } from './documentTemplates/types';
import { getTemplateComponent } from './documentTemplates/templates';
import { initializeFirebase } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
  receiptType?: 'supermarket' | 'invoice';
}

export function ReceiptGenerator({ receiptData, onClose, isWholesale = false, receiptType = 'supermarket' }: ReceiptGeneratorProps) {
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
    let message = '';
    
    if (receiptType === 'invoice') {
      // Invoice-style receipt for wholesale/distributor
      message = `
${receiptData.businessName}
${receiptData.businessAddress ? receiptData.businessAddress + '\n' : ''}
${receiptData.businessPhone ? 'Tel: ' + receiptData.businessPhone + '\n' : ''}

INVOICE - ${receiptData.saleNumber}
Date: ${receiptData.date}
${receiptData.customerName ? 'Customer: ' + receiptData.customerName + '\n' : ''}
${receiptData.customerPhone ? 'Phone: ' + receiptData.customerPhone + '\n' : ''}

ITEMS:
${receiptData.items.map(item => `${item.name}\n  ${item.quantity} x ${formatMoney(item.price)} = ${formatMoney(item.total)}`).join('\n')}

Subtotal: ${formatMoney(receiptData.subtotal)}
${receiptData.outstandingBalance > 0 ? `Outstanding Balance: ${formatMoney(receiptData.outstandingBalance)}\n` : ''}Total: ${formatMoney(receiptData.subtotal)}

Payment: ${receiptData.paymentMethod}
${receiptData.sourceLocation ? 'Source: ' + receiptData.sourceLocation + '\n' : ''}
${receiptData.outstandingBalance > 0 ? 'Payment Due: Please settle outstanding balance\n' : ''}Thank you for your business!
      `.trim();
    } else {
      // Supermarket-style receipt (default)
      message = `
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
    }

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
              fontFamily: receiptType === 'invoice' ? 'Arial, sans-serif' : 'monospace',
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
              {receiptType === 'invoice' ? (
                <>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>INVOICE</div>
                  <div>Invoice #: {receiptData.saleNumber}</div>
                  <div>Date: {receiptData.date}</div>
                  {receiptData.customerName && (
                    <div style={{ marginTop: '8px' }}><strong>Bill To:</strong></div>
                  )}
                  {receiptData.customerName && <div>Customer: {receiptData.customerName}</div>}
                  {receiptData.customerPhone && <div>Phone: {receiptData.customerPhone}</div>}
                </>
              ) : (
                <>
                  <div>Receipt #: {receiptData.saleNumber}</div>
                  <div>Date: {receiptData.date}</div>
                  {receiptData.theme?.showCustomerDetails && receiptData.customerName && (
                    <div>Customer: {receiptData.customerName}</div>
                  )}
                  {receiptData.theme?.showCustomerDetails && receiptData.customerPhone && (
                    <div>Phone: {receiptData.customerPhone}</div>
                  )}
                </>
              )}
              {receiptData.sourceLocation && (
                <div style={{ marginTop: '5px' }}>Source: {receiptData.sourceLocation}</div>
              )}
            </div>

            <div 
              className={styles.receiptDivider}
              style={{ borderColor: receiptData.theme?.primaryColor || 'black' }}
            ></div>

            <div className={styles.receiptItems}>
              <div 
                className={styles.receiptItemHeader}
                style={{ 
                  color: receiptData.theme?.secondaryColor || 'black',
                  borderBottom: receiptType === 'invoice' ? '2px solid' : '1px dashed',
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  fontSize: receiptType === 'invoice' ? '14px' : '12px'
                }}
              >
                {receiptType === 'invoice' ? 'DESCRIPTION' : 'ITEM'}
              </div>
              {receiptData.items.map((item, index) => (
                <div 
                  key={index} 
                  className={styles.receiptItem}
                  style={{ 
                    fontSize: receiptData.theme?.fontSize === 'large' ? '14px' : receiptData.theme?.fontSize === 'small' ? '11px' : '12px',
                    borderBottom: receiptType === 'invoice' ? '1px solid #eee' : '1px dashed #000',
                    padding: '8px 0'
                  }}
                >
                  {receiptType === 'invoice' ? (
                    <>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                        <span>{item.quantity} x {formatMoney(item.price)}</span>
                        <span style={{ fontWeight: 'bold', color: '#000' }}>{formatMoney(item.total)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={styles.itemName}>{item.name}</span>
                      <span>{item.quantity}</span>
                      <span>{formatMoney(item.price)}</span>
                      <span>{formatMoney(item.total)}</span>
                    </>
                  )}
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
                style={{ 
                  fontSize: receiptData.theme?.fontSize === 'large' ? '16px' : receiptData.theme?.fontSize === 'small' ? '13px' : '14px',
                  borderTop: receiptType === 'invoice' ? '2px solid #000' : '1px dashed #000',
                  paddingTop: '10px',
                  marginTop: '10px'
                }}
              >
                {receiptType === 'invoice' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Subtotal:</span>
                      <span>{formatMoney(receiptData.subtotal)}</span>
                    </div>
                    {receiptData.outstandingBalance > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#ef4444' }}>
                        <span>Outstanding Balance:</span>
                        <span>{formatMoney(receiptData.outstandingBalance)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #000' }}>
                      <span>TOTAL DUE:</span>
                      <span style={{ color: receiptData.theme?.primaryColor || 'black' }}>{formatMoney(receiptData.subtotal)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                  </>
                )}
              </div>
            </div>

            <div 
              className={styles.receiptDivider}
              style={{ borderColor: receiptData.theme?.primaryColor || 'black' }}
            ></div>

            <div className={styles.receiptFooter}>
              {receiptType === 'invoice' ? (
                <>
                  <div style={{ fontSize: '12px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #000' }}>
                    <strong>Payment Terms:</strong> Payment due within 30 days
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '8px', color: '#666' }}>
                    Thank you for your business!
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '5px', color: '#999' }}>
                    Generated: {new Date().toLocaleString()}
                  </div>
                </>
              ) : (
                <>
                  {receiptData.theme?.customFooter ? (
                    <div>{receiptData.theme.customFooter}</div>
                  ) : (
                    <div>Thank you for your business!</div>
                  )}
                  <div>{new Date().toLocaleDateString()}</div>
                  {receiptData.theme?.showBarcode && (
                    <div className={styles.barcode}>||||| ||||| |||||</div>
                  )}
                </>
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
            <button
              className={styles.actionButton}
              onClick={handleCopyToClipboard}
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

