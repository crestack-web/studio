'use client';

import React from 'react';
import { DocumentTemplate, InvoiceData, InvoiceItem } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface ModernCorporateTemplateProps {
  template: DocumentTemplate;
  data: InvoiceData;
}

export function ModernCorporateTemplate({ template, data }: ModernCorporateTemplateProps) {
  const { businessInfo, primaryColor, secondaryColor, sections, logoPosition, logoSize, showLogo, fontSize } = template;
  
  const logoSizeMap = { small: 60, medium: 80, large: 100 };
  const logoHeight = logoSizeMap[logoSize];
  const watermark = sections.watermark;
  
  const fontSizeMap = { small: '12px', medium: '14px', large: '16px' };
  const baseFontSize = fontSizeMap[fontSize];

  return (
    <div className={`modern-corporate-template paper-${template.paperSize}`} style={{ fontFamily: template.fontFamily }}>
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
        <div className="template-header" style={{ borderBottomColor: primaryColor }}>
          <div className={`logo-container logo-${logoPosition}`}>
            {showLogo && businessInfo.logoUrl && (
              <img 
                src={businessInfo.logoUrl} 
                alt="Logo" 
                style={{ height: logoHeight }}
                className="business-logo"
              />
            )}
          </div>
          
          <div className="header-text" style={{ textAlign: logoPosition === 'center' ? 'center' : 'left' }}>
            <h1 style={{ color: primaryColor, fontSize: baseFontSize }}>{businessInfo.businessName}</h1>
            {sections.businessInfo && (
              <div className="business-details" style={{ fontSize: baseFontSize }}>
                {businessInfo.businessAddress && <div>{businessInfo.businessAddress}</div>}
                {businessInfo.businessPhone && <div>Phone: {businessInfo.businessPhone}</div>}
                {businessInfo.businessEmail && <div>Email: {businessInfo.businessEmail}</div>}
                {businessInfo.businessWebsite && <div>Web: {businessInfo.businessWebsite}</div>}
                {businessInfo.businessTIN && <div>TIN: {businessInfo.businessTIN}</div>}
                {businessInfo.businessVAT && <div>VAT: {businessInfo.businessVAT}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Info */}
      {sections.invoiceInfo && (
        <div className="invoice-info-section" style={{ backgroundColor: `${primaryColor}10` }}>
          <div className="invoice-details">
            <div className="invoice-number" style={{ color: primaryColor }}>
              <strong>{data.invoiceNumber}</strong>
            </div>
            <div className="invoice-meta">
              <div>Date: {data.invoiceDate}</div>
              {data.dueDate && <div>Due Date: {data.dueDate}</div>}
              {data.salesRepresentative && <div>Sales Rep: {data.salesRepresentative}</div>}
              <div>Status: <span className={`status-${data.paymentStatus}`}>{data.paymentStatus.toUpperCase()}</span></div>
              {data.paymentMethod && <div>Payment: {data.paymentMethod}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Customer Info */}
      {sections.customerInfo && (
        <div className="customer-section">
          <h3 style={{ color: secondaryColor }}>Bill To:</h3>
          <div className="customer-details">
            <div style={{ fontWeight: 'bold' }}>{data.customerName}</div>
            {data.customerCompany && <div>{data.customerCompany}</div>}
            {data.customerPhone && <div>Phone: {data.customerPhone}</div>}
            {data.customerAddress && <div>Address: {data.customerAddress}</div>}
          </div>
        </div>
      )}

      {/* Items Table */}
      {sections.itemTable && (
        <div className="items-section">
          <table className="invoice-table">
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th style={{ color: 'white' }}>S/N</th>
                {sections.sku && <th style={{ color: 'white' }}>SKU</th>}
                <th style={{ color: 'white' }}>Product</th>
                <th style={{ color: 'white' }}>Qty</th>
                <th style={{ color: 'white' }}>Unit</th>
                <th style={{ color: 'white' }}>Price</th>
                {sections.discount && <th style={{ color: 'white' }}>Discount</th>}
                <th style={{ color: 'white', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.serialNumber}</td>
                  {sections.sku && <td>{item.sku || '-'}</td>}
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>{item.unitPrice.toLocaleString()}</td>
                  {sections.discount && <td>{item.discount > 0 ? item.discount.toLocaleString() : '-'}</td>}
                  <td style={{ textAlign: 'right' }}>{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      {sections.totals && (
        <div className="totals-section">
          <div className="totals-table">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{data.subtotal.toLocaleString()}</span>
            </div>
            {sections.discount && data.discountAmount > 0 && (
              <div className="total-row">
                <span>Discount:</span>
                <span>-{data.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="total-row">
              <span>VAT ({data.vatPercentage}%):</span>
              <span>{data.vatAmount.toLocaleString()}</span>
            </div>
            {data.otherCharges > 0 && (
              <div className="total-row">
                <span>Other Charges:</span>
                <span>{data.otherCharges.toLocaleString()}</span>
              </div>
            )}
            <div className="total-row grand-total" style={{ borderTopColor: primaryColor, color: primaryColor }}>
              <span>Grand Total:</span>
              <span style={{ fontSize: '1.2em' }}>{data.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Amount in Words */}
      {sections.amountInWords && data.amountInWords && (
        <div className="amount-in-words">
          <strong>Amount in Words:</strong> {data.amountInWords}
        </div>
      )}

      {/* Notes */}
      {sections.notes && data.notes && (
        <div className="notes-section">
          <h3 style={{ color: secondaryColor }}>Notes:</h3>
          <p>{data.notes}</p>
        </div>
      )}

      {/* Terms and Conditions */}
      {sections.termsAndConditions && template.termsAndConditions && (
        <div className="terms-section">
          <h3 style={{ color: secondaryColor }}>Terms & Conditions:</h3>
          <p>{template.termsAndConditions}</p>
        </div>
      )}

      {/* Warehouse Note */}
      {sections.warehouseNote && template.warehouseNote && (
        <div className="warehouse-note" style={{ backgroundColor: `${primaryColor}15`, borderLeftColor: primaryColor }}>
          <strong>Warehouse Note:</strong> {template.warehouseNote}
        </div>
      )}

      {/* Signatures */}
      {sections.signatures && (
        <div className="signatures-section">
          <div className="signature-box">
            <div className="signature-line"></div>
            <div className="signature-label">Customer Signature</div>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <div className="signature-label">Sales Officer</div>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <div className="signature-label">Warehouse Officer</div>
          </div>
        </div>
      )}

      {/* QR Code */}
      {sections.qrCode && (
        <div className="qr-section">
          <QRCodeSVG
            value={JSON.stringify({
              invoiceId: data.invoiceNumber,
              businessId: template.businessId,
            })}
            size={80}
            level="M"
          />
          <div className="qr-label">Scan for verification</div>
        </div>
      )}

      {/* Footer */}
      {sections.footer && (
        <div className="template-footer" style={{ borderTopColor: primaryColor, color: secondaryColor }}>
          {template.customFooter || 'Thank you for your business!'}
        </div>
      )}

      <style jsx>{`
        .modern-corporate-template {
          position: relative;
          padding: 40px;
          background: white;
          color: #333;
          max-width: 210mm;
          margin: 0 auto;
          min-height: 297mm;
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
          max-width: 300px;
          max-height: 300px;
          opacity: 0.3;
          transform: rotate(-30deg);
        }

        .watermark-text {
          font-size: 72px;
          font-weight: bold;
          color: ${primaryColor};
          transform: rotate(-30deg);
          white-space: nowrap;
        }

        .template-header {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid;
        }

        .logo-container {
          flex: 0 0 auto;
        }

        .logo-left {
          text-align: left;
        }

        .logo-center {
          text-align: center;
          width: 100%;
        }

        .logo-right {
          text-align: right;
          margin-left: auto;
        }

        .business-logo {
          max-height: 100px;
          max-width: 200px;
          object-fit: contain;
        }

        .header-text {
          flex: 1;
        }

        .header-text h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }

        .business-details {
          line-height: 1.6;
        }

        .invoice-info-section {
          padding: 20px;
          margin-bottom: 30px;
          border-radius: 4px;
        }

        .invoice-details {
          display: flex;
          justify-content: space-between;
        }

        .invoice-number {
          font-size: 24px;
        }

        .invoice-meta {
          text-align: right;
          line-height: 1.8;
        }

        .status-pending { color: #f59e0b; font-weight: bold; }
        .status-paid { color: #10b981; font-weight: bold; }
        .status-partial { color: #3b82f6; font-weight: bold; }
        .status-overdue { color: #ef4444; font-weight: bold; }

        .customer-section {
          margin-bottom: 30px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 4px;
        }

        .customer-section h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
        }

        .customer-details {
          line-height: 1.6;
        }

        .items-section {
          margin-bottom: 30px;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoice-table th, .invoice-table td {
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .invoice-table th {
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }

        .invoice-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }

        .totals-table {
          width: 300px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .grand-total {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid;
          border-bottom: none;
          padding-top: 12px;
          margin-top: 8px;
        }

        .amount-in-words {
          padding: 15px;
          background: #f9fafb;
          border-radius: 4px;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .notes-section, .terms-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 4px;
        }

        .notes-section h3, .terms-section h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        .notes-section p, .terms-section p {
          margin: 0;
          line-height: 1.6;
        }

        .warehouse-note {
          padding: 15px;
          border-left: 4px solid;
          border-radius: 4px;
          margin-bottom: 30px;
          line-height: 1.6;
        }

        .signatures-section {
          display: flex;
          justify-content: space-around;
          margin: 40px 0 30px 0;
          padding: 20px 0;
        }

        .signature-box {
          text-align: center;
          width: 30%;
        }

        .signature-line {
          border-bottom: 1px solid #333;
          margin-bottom: 8px;
          height: 40px;
        }

        .signature-label {
          font-size: 12px;
          color: #666;
        }

        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin: 20px 0;
        }

        .qr-label {
          font-size: 10px;
          color: #666;
        }

        .template-footer {
          padding: 20px 0 0 0;
          border-top: 2px solid;
          text-align: center;
          font-size: 12px;
          margin-top: auto;
        }
      `}</style>
    </div>
  );
}