'use client';

import React from 'react';
import { DocumentTemplate, InvoiceData } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface CompactA5TemplateProps {
  template: DocumentTemplate;
  data: InvoiceData;
}

export function CompactA5Template({ template, data }: CompactA5TemplateProps) {
  const { businessInfo, primaryColor, secondaryColor, sections, logoPosition, logoSize, showLogo } = template;
  
  const logoSizeMap = { small: 40, medium: 60, large: 80 };
  const logoHeight = logoSizeMap[logoSize];
  const watermark = sections.watermark;

  return (
    <div className={`compact-a5-template paper-${template.paperSize}`} style={{ fontFamily: template.fontFamily }}>
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

      {/* Header - Compact */}
      {sections.header && (
        <div className="compact-header" style={{ borderBottomColor: primaryColor }}>
          <div className={`compact-logo logo-${logoPosition}`}>
            {showLogo && businessInfo.logoUrl && (
              <img 
                src={businessInfo.logoUrl} 
                alt="Logo" 
                style={{ height: logoHeight }}
                className="business-logo"
              />
            )}
          </div>
          
          <div className="compact-business-info" style={{ textAlign: logoPosition === 'center' ? 'center' : 'left' }}>
            <h2 style={{ color: primaryColor, fontSize: '18px' }}>{businessInfo.businessName}</h2>
            {sections.businessInfo && (
              <div className="compact-details">
                {businessInfo.businessPhone && <div>Tel: {businessInfo.businessPhone}</div>}
                {businessInfo.businessEmail && <div>{businessInfo.businessEmail}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Info - Compact */}
      {sections.invoiceInfo && (
        <div className="compact-invoice-info" style={{ backgroundColor: `${primaryColor}15` }}>
          <div className="compact-invoice-header">
            <div className="compact-invoice-number" style={{ color: primaryColor }}>
              <strong>{data.invoiceNumber}</strong>
            </div>
            <div className="compact-invoice-meta">
              <div>Date: {data.invoiceDate}</div>
              {data.dueDate && <div>Due: {data.dueDate}</div>}
              <div>Status: <span className={`status-${data.paymentStatus}`}>{data.paymentStatus.toUpperCase()}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Info - Compact */}
      {sections.customerInfo && (
        <div className="compact-customer">
          <div style={{ color: secondaryColor, fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>
            BILL TO:
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            <div><strong>{data.customerName}</strong></div>
            {data.customerCompany && <div>{data.customerCompany}</div>}
            {data.customerPhone && <div>Tel: {data.customerPhone}</div>}
          </div>
        </div>
      )}

      {/* Items Table - Compact */}
      {sections.itemTable && (
        <div className="compact-items">
          <table className="compact-table">
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th style={{ color: 'white', padding: '8px 5px', fontSize: '11px' }}>#</th>
                {sections.sku && <th style={{ color: 'white', padding: '8px 5px', fontSize: '11px' }}>SKU</th>}
                <th style={{ color: 'white', padding: '8px 5px', fontSize: '11px' }}>PRODUCT</th>
                <th style={{ color: 'white', padding: '8px 5px', fontSize: '11px', textAlign: 'center' }}>QTY</th>
                <th style={{ color: 'white', padding: '8px 5px', fontSize: '11px', textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '6px 5px', fontSize: '11px' }}>{item.serialNumber}</td>
                  {sections.sku && <td style={{ padding: '6px 5px', fontSize: '10px' }}>{item.sku || '-'}</td>}
                  <td style={{ padding: '6px 5px', fontSize: '11px' }}>{item.productName}</td>
                  <td style={{ padding: '6px 5px', fontSize: '11px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '6px 5px', fontSize: '11px', textAlign: 'right' }}>{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals - Compact */}
      {sections.totals && (
        <div className="compact-totals">
          <div className="compact-total-row">
            <span>Subtotal:</span>
            <span>{data.subtotal.toLocaleString()}</span>
          </div>
          {sections.discount && data.discountAmount > 0 && (
            <div className="compact-total-row">
              <span>Discount:</span>
              <span>-{data.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="compact-total-row">
            <span>VAT ({data.vatPercentage}%):</span>
            <span>{data.vatAmount.toLocaleString()}</span>
          </div>
          <div className="compact-total-row compact-grand-total" style={{ borderTopColor: primaryColor, color: primaryColor }}>
            <span>TOTAL:</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{data.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Amount in Words - Compact */}
      {sections.amountInWords && data.amountInWords && (
        <div className="compact-amount-words">
          <strong>Words:</strong> {data.amountInWords}
        </div>
      )}

      {/* Notes */}
      {sections.notes && data.notes && (
        <div className="compact-notes">
          <div style={{ color: secondaryColor, fontWeight: 'bold', fontSize: '11px', marginBottom: '3px' }}>
            NOTES:
          </div>
          <p style={{ fontSize: '11px', margin: 0 }}>{data.notes}</p>
        </div>
      )}

      {/* Terms */}
      {sections.termsAndConditions && template.termsAndConditions && (
        <div className="compact-terms">
          <div style={{ color: secondaryColor, fontWeight: 'bold', fontSize: '11px', marginBottom: '3px' }}>
            TERMS:
          </div>
          <p style={{ fontSize: '10px', margin: 0 }}>{template.termsAndConditions}</p>
        </div>
      )}

      {/* Warehouse Note - Compact */}
      {sections.warehouseNote && template.warehouseNote && (
        <div className="compact-warehouse" style={{ backgroundColor: `${primaryColor}15`, padding: '8px', fontSize: '11px', borderLeft: `3px solid ${primaryColor}` }}>
          <strong>Note:</strong> {template.warehouseNote}
        </div>
      )}

      {/* Signatures - Compact */}
      {sections.signatures && (
        <div className="compact-signatures">
          <div className="compact-sig-box">
            <div className="compact-sig-line"></div>
            <div className="compact-sig-label">Customer</div>
          </div>
          <div className="compact-sig-box">
            <div className="compact-sig-line"></div>
            <div className="compact-sig-label">Sales Officer</div>
          </div>
          <div className="compact-sig-box">
            <div className="compact-sig-line"></div>
            <div className="compact-sig-label">Warehouse</div>
          </div>
        </div>
      )}

      {/* QR Code */}
      {sections.qrCode && (
        <div className="compact-qr">
          <QRCodeSVG
            value={JSON.stringify({
              invoiceId: data.invoiceNumber,
              businessId: template.businessId,
            })}
            size={60}
            level="M"
          />
        </div>
      )}

      {/* Footer - Compact */}
      {sections.footer && (
        <div className="compact-footer" style={{ borderTopColor: primaryColor, color: secondaryColor }}>
          {template.customFooter || 'Thank you!'}
        </div>
      )}

      <style jsx>{`
        .compact-a5-template {
          position: relative;
          padding: 20px;
          background: white;
          color: #333;
          max-width: 148mm;
          margin: 0 auto;
          min-height: 210mm;
          font-size: 12px;
        }

        .paper-a4 {
          max-width: 210mm;
          min-height: 297mm;
        }

        .paper-a5 {
          max-width: 148mm;
          min-height: 210mm;
        }

        .paper-thermal-58mm, .paper-thermal-80mm {
          max-width: ${template.paperSize === 'thermal-80mm' ? '80mm' : '58mm'};
          padding: 10px;
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
          max-width: 200px;
          max-height: 200px;
          opacity: 0.25;
          transform: rotate(-30deg);
        }

        .watermark-text {
          font-size: 48px;
          font-weight: bold;
          color: ${primaryColor};
          transform: rotate(-30deg);
          white-space: nowrap;
        }

        .compact-header {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          padding-bottom: 12px;
          border-bottom: 2px solid;
        }

        .compact-logo {
          flex: 0 0 auto;
        }

        .compact-business-info {
          flex: 1;
        }

        .compact-business-info h2 {
          margin: 0 0 5px 0;
        }

        .compact-details {
          line-height: 1.5;
          font-size: 11px;
        }

        .compact-invoice-info {
          padding: 12px;
          margin-bottom: 15px;
          border-radius: 3px;
        }

        .compact-invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .compact-invoice-number {
          font-size: 16px;
        }

        .compact-invoice-meta {
          text-align: right;
          line-height: 1.5;
          font-size: 11px;
        }

        .status-pending { color: #f59e0b; font-weight: bold; }
        .status-paid { color: #10b981; font-weight: bold; }
        .status-partial { color: #3b82f6; font-weight: bold; }
        .status-overdue { color: #ef4444; font-weight: bold; }

        .compact-customer {
          margin-bottom: 12px;
          padding: 10px;
          background: #f9fafb;
          border-radius: 3px;
        }

        .compact-items {
          margin-bottom: 12px;
        }

        .compact-table {
          width: 100%;
          border-collapse: collapse;
        }

        .compact-table th, .compact-table td {
          border-bottom: 1px solid #e5e7eb;
        }

        .compact-totals {
          margin-bottom: 12px;
          padding: 10px;
          background: #f9fafb;
          border-radius: 3px;
        }

        .compact-total-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .compact-grand-total {
          font-weight: bold;
          border-top: 2px solid;
          border-bottom: none;
          padding-top: 8px;
          margin-top: 5px;
        }

        .compact-amount-words {
          margin-bottom: 8px;
          font-size: 11px;
          padding: 8px;
          background: #f9fafb;
          border-radius: 3px;
        }

        .compact-notes, .compact-terms {
          margin-bottom: 8px;
          font-size: 11px;
        }

        .compact-warehouse {
          margin-bottom: 12px;
          border-radius: 3px;
        }

        .compact-signatures {
          display: flex;
          justify-content: space-between;
          margin: 20px 0 15px 0;
          padding: 15px 0;
        }

        .compact-sig-box {
          text-align: center;
          width: 30%;
        }

        .compact-sig-line {
          border-bottom: 1px solid #333;
          margin-bottom: 5px;
          height: 30px;
        }

        .compact-sig-label {
          font-size: 10px;
          color: #666;
        }

        .compact-qr {
          display: flex;
          justify-content: center;
          margin: 15px 0;
        }

        .compact-footer {
          padding: 10px 0 0 0;
          border-top: 1px solid;
          text-align: center;
          font-size: 11px;
          margin-top: auto;
        }
      `}</style>
    </div>
  );
}