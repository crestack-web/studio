'use client';

import React from 'react';
import { DocumentTemplate, InvoiceData } from '../types';

interface ThermalReceiptTemplateProps {
  template: DocumentTemplate;
  data: InvoiceData;
}

export function ThermalReceiptTemplate({ template, data }: ThermalReceiptTemplateProps) {
  const { businessInfo, primaryColor, secondaryColor, sections, showLogo } = template;
  const watermark = sections.watermark;

  return (
    <div className={`thermal-receipt-template paper-${template.paperSize}`} style={{ fontFamily: 'monospace', fontSize: '11px' }}>
      {/* Watermark */}
      {sections.watermark.enabled && watermark.type !== 'none' && (
        <div className="watermark-overlay" style={{ opacity: watermark.opacity }}>
          {watermark.type === 'logo' && businessInfo.logoUrl && (
            <img src={businessInfo.logoUrl} alt="Watermark" className="watermark-logo" />
          )}
          {watermark.type === 'text' && (
            <div className="watermark-text">{watermark.text || businessInfo.businessName}</div>
          )}
        </div>
      )}

      {/* Header */}
      {sections.header && (
        <div className="receipt-header" style={{ borderBottomColor: primaryColor }}>
          {showLogo && businessInfo.logoUrl && (
            <div className="receipt-logo" style={{ textAlign: 'center', marginBottom: '10px' }}>
              <img 
                src={businessInfo.logoUrl} 
                alt="Logo" 
                style={{ height: 60, maxWidth: '100%' }}
              />
            </div>
          )}
          <div className="receipt-business-name" style={{ color: primaryColor, textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
            {businessInfo.businessName}
          </div>
          {sections.businessInfo && (
            <div className="receipt-business-details" style={{ textAlign: 'center', fontSize: '10px', marginTop: '5px' }}>
              {businessInfo.businessAddress && <div>{businessInfo.businessAddress}</div>}
              {businessInfo.businessPhone && <div>Tel: {businessInfo.businessPhone}</div>}
              {businessInfo.businessEmail && <div>{businessInfo.businessEmail}</div>}
            </div>
          )}
        </div>
      )}

      {/* Receipt Info */}
      {sections.invoiceInfo && (
        <div className="receipt-info" style={{ borderBottom: '1px dashed #000', padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div><strong>Receipt:</strong> {data.invoiceNumber}</div>
            <div><strong>Date:</strong> {data.invoiceDate}</div>
          </div>
          {data.dueDate && <div><strong>Due:</strong> {data.dueDate}</div>}
          <div><strong>Status:</strong> <span className={`status-${data.paymentStatus}`}>{data.paymentStatus.toUpperCase()}</span></div>
          {data.paymentMethod && <div><strong>Payment:</strong> {data.paymentMethod}</div>}
        </div>
      )}

      {/* Customer Info */}
      {sections.customerInfo && data.customerName && (
        <div className="receipt-customer" style={{ borderBottom: '1px dashed #000', padding: '8px 0' }}>
          <div><strong>Customer:</strong> {data.customerName}</div>
          {data.customerPhone && <div><strong>Tel:</strong> {data.customerPhone}</div>}
        </div>
      )}

      {/* Items */}
      {sections.itemTable && (
        <div className="receipt-items" style={{ borderBottom: '1px dashed #000' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '8px 0', borderBottom: '1px dashed #000' }}>
            ITEMS
          </div>
          {data.items.map((item, index) => (
            <div key={index} style={{ padding: '6px 0', borderBottom: '1px dashed #000' }}>
              <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  {item.quantity} x {item.unitPrice.toLocaleString()}
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  {item.total.toLocaleString()}
                </div>
              </div>
              {sections.sku && item.sku && (
                <div style={{ fontSize: '9px', color: '#666' }}>SKU: {item.sku}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      {sections.totals && (
        <div className="receipt-totals" style={{ padding: '8px 0', borderBottom: '1px dashed #000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{data.subtotal.toLocaleString()}</span>
          </div>
          {sections.discount && data.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount:</span>
              <span>-{data.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>VAT ({data.vatPercentage}%):</span>
            <span>{data.vatAmount.toLocaleString()}</span>
          </div>
          {data.otherCharges > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Other:</span>
              <span>{data.otherCharges.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '8px', paddingTop: '8px', borderTop: '2px solid #000' }}>
            <span>TOTAL:</span>
            <span style={{ color: primaryColor }}>{data.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Amount in Words */}
      {sections.amountInWords && data.amountInWords && (
        <div className="receipt-amount-words" style={{ padding: '6px 0', borderBottom: '1px dashed #000', fontSize: '10px' }}>
          <strong>Amount in Words:</strong> {data.amountInWords}
        </div>
      )}

      {/* Warehouse Note */}
      {sections.warehouseNote && template.warehouseNote && (
        <div className="receipt-warehouse" style={{ padding: '8px 0', borderBottom: '1px dashed #000', fontSize: '10px', fontWeight: 'bold' }}>
          {template.warehouseNote}
        </div>
      )}

      {/* QR Code */}
      {sections.qrCode && (
        <div className="receipt-qr" style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px dashed #000' }}>
          <div style={{ 
            display: 'inline-block', 
            padding: '5px', 
            border: '1px solid #000',
            backgroundColor: 'white'
          }}>
            <svg viewBox="0 0 100 100" width="60" height="60">
              <rect x="0" y="0" width="100" height="100" fill="white"/>
              <text x="50" y="55" fontSize="12" textAnchor="middle" fill="#000">
                QR CODE
              </text>
            </svg>
          </div>
          <div style={{ fontSize: '9px', marginTop: '5px' }}>Scan to verify</div>
        </div>
      )}

      {/* Footer */}
      {sections.footer && (
        <div className="receipt-footer" style={{ textAlign: 'center', padding: '10px 0', fontSize: '10px' }}>
          {template.customFooter || 'Thank you for your business!'}
          <div style={{ marginTop: '5px', fontSize: '9px' }}>
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      <style jsx>{`
        .thermal-receipt-template {
          position: relative;
          padding: 15px;
          background: white;
          color: #000;
          max-width: ${template.paperSize === 'thermal-80mm' ? '80mm' : '58mm'};
          margin: 0 auto;
          min-height: auto;
        }

        .paper-a4 {
          max-width: 210mm;
          min-height: 297mm;
        }

        .paper-a5 {
          max-width: 148mm;
          min-height: 210mm;
        }

        .paper-thermal-58mm {
          max-width: 58mm;
        }

        .paper-thermal-80mm {
          max-width: 80mm;
        }

        .watermark-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
        }

        .watermark-logo {
          max-width: 150px;
          max-height: 150px;
          opacity: 0.2;
        }

        .watermark-text {
          font-size: 36px;
          font-weight: bold;
          color: ${primaryColor};
          transform: rotate(-30deg);
          white-space: nowrap;
        }

        .receipt-header {
          padding-bottom: 10px;
          margin-bottom: 10px;
          border-bottom: 2px solid;
        }

        .receipt-logo {
          margin-bottom: 8px;
        }

        .receipt-logo img {
          display: block;
          margin: 0 auto;
        }

        .receipt-business-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .receipt-business-details {
          font-size: 10px;
          line-height: 1.4;
        }

        .receipt-info {
          padding: 8px 0;
        }

        .receipt-info div {
          margin-bottom: 3px;
        }

        .status-pending { color: #f59e0b; font-weight: bold; }
        .status-paid { color: #10b981; font-weight: bold; }
        .status-partial { color: #3b82f6; font-weight: bold; }
        .status-overdue { color: #ef4444; font-weight: bold; }

        .receipt-customer {
          padding: 8px 0;
        }

        .receipt-customer div {
          margin-bottom: 3px;
        }

        .receipt-items {
          margin: 10px 0;
        }

        .receipt-items > div {
          text-align: center;
          padding: 6px 0;
        }

        .receipt-items > div > div {
          margin-bottom: 3px;
        }

        .receipt-totals {
          padding: 8px 0;
        }

        .receipt-totals > div {
          margin-bottom: 4px;
        }

        .receipt-amount-words {
          padding: 6px 0;
          font-size: 10px;
        }

        .receipt-warehouse {
          padding: 8px 0;
          font-size: 10px;
          text-align: center;
        }

        .receipt-qr {
          padding: 10px 0;
        }

        .receipt-footer {
          padding: 10px 0;
          text-align: center;
          border-top: 1px dashed #000;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
