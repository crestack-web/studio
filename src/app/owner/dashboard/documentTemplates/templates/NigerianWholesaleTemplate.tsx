'use client';

import React from 'react';
import { DocumentTemplate, InvoiceData } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface NigerianWholesaleTemplateProps {
  template: DocumentTemplate;
  data: InvoiceData;
}

export function NigerianWholesaleTemplate({ template, data }: NigerianWholesaleTemplateProps) {
  const { businessInfo, primaryColor, secondaryColor, sections, logoPosition, logoSize, showLogo } = template;
  
  const logoSizeMap = { small: 80, medium: 120, large: 160 };
  const logoHeight = logoSizeMap[logoSize];
  const watermark = sections.watermark;

  return (
    <div className={`nigerian-wholesale-template paper-${template.paperSize}`} style={{ fontFamily: template.fontFamily }}>
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

      {/* Header with Large Invoice Number */}
      {sections.header && (
        <div className="wholesale-header" style={{ borderBottomColor: primaryColor }}>
          <div className={`wholesale-logo logo-${logoPosition}`}>
            {showLogo && businessInfo.logoUrl && (
              <img 
                src={businessInfo.logoUrl} 
                alt="Logo" 
                style={{ height: logoHeight }}
                className="business-logo"
              />
            )}
          </div>
          
          <div className="wholesale-business-info" style={{ textAlign: logoPosition === 'center' ? 'center' : 'left' }}>
            <h1 style={{ color: primaryColor }}>{businessInfo.businessName}</h1>
            {sections.businessInfo && (
              <div className="wholesale-details">
                {businessInfo.businessAddress && <div>{businessInfo.businessAddress}</div>}
                {businessInfo.businessPhone && <div>Tel: {businessInfo.businessPhone}</div>}
                {businessInfo.businessEmail && <div>Email: {businessInfo.businessEmail}</div>}
                {businessInfo.businessWebsite && <div>Web: {businessInfo.businessWebsite}</div>}
                {businessInfo.businessTIN && <div>TIN: {businessInfo.businessTIN}</div>}
                {businessInfo.businessVAT && <div>VAT: {businessInfo.businessVAT}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Large Invoice Number Display - Warehouse Friendly */}
      {sections.invoiceInfo && (
        <div className="invoice-number-section" style={{ backgroundColor: primaryColor }}>
          <div className="invoice-number-label">INVOICE</div>
          <div className="invoice-number-large">{data.invoiceNumber}</div>
          <div className="invoice-details-grid">
            <div><strong>Date:</strong> {data.invoiceDate}</div>
            {data.dueDate && <div><strong>Due Date:</strong> {data.dueDate}</div>}
            {data.salesRepresentative && <div><strong>Sales Rep:</strong> {data.salesRepresentative}</div>}
            <div><strong>Status:</strong> <span className={`status-${data.paymentStatus}`}>{data.paymentStatus.toUpperCase()}</span></div>
            {data.paymentMethod && <div><strong>Payment:</strong> {data.paymentMethod}</div>}
          </div>
        </div>
      )}

      {/* Customer Information */}
      {sections.customerInfo && (
        <div className="customer-section">
          <div className="section-title" style={{ backgroundColor: secondaryColor }}>
            <strong>CUSTOMER INFORMATION</strong>
          </div>
          <div className="customer-details">
            <div><strong>Name:</strong> {data.customerName}</div>
            {data.customerCompany && <div><strong>Company:</strong> {data.customerCompany}</div>}
            {data.customerPhone && <div><strong>Phone:</strong> {data.customerPhone}</div>}
            {data.customerAddress && <div><strong>Address:</strong> {data.customerAddress}</div>}
          </div>
        </div>
      )}

      {/* Items Table - Large and Clear */}
      {sections.itemTable && (
        <div className="items-section">
          <div className="section-title" style={{ backgroundColor: secondaryColor }}>
            <strong>ITEM DETAILS</strong>
          </div>
          <table className="invoice-table">
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th style={{ color: 'white' }}>S/N</th>
                {sections.sku && <th style={{ color: 'white' }}>SKU</th>}
                <th style={{ color: 'white' }}>PRODUCT</th>
                <th style={{ color: 'white', textAlign: 'center' }}>QTY</th>
                <th style={{ color: 'white' }}>UNIT</th>
                <th style={{ color: 'white', textAlign: 'right' }}>UNIT PRICE</th>
                {sections.discount && <th style={{ color: 'white', textAlign: 'right' }}>DISCOUNT</th>}
                <th style={{ color: 'white', textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.serialNumber}</td>
                  {sections.sku && <td>{item.sku || '-'}</td>}
                  <td><strong>{item.productName}</strong></td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td style={{ textAlign: 'right' }}>{item.unitPrice.toLocaleString()}</td>
                  {sections.discount && <td style={{ textAlign: 'right' }}>{item.discount > 0 ? item.discount.toLocaleString() : '0'}</td>}
                  <td style={{ textAlign: 'right' }}><strong>{item.total.toLocaleString()}</strong></td>
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
              <span style={{ fontSize: '1.1em' }}>{data.subtotal.toLocaleString()}</span>
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
              <span style={{ fontSize: '1.3em' }}>GRAND TOTAL:</span>
              <span style={{ fontSize: '1.5em' }}>{data.grandTotal.toLocaleString()}</span>
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
          <div className="section-title" style={{ backgroundColor: secondaryColor }}>
            <strong>NOTES</strong>
          </div>
          <p>{data.notes}</p>
        </div>
      )}

      {/* Terms and Conditions */}
      {sections.termsAndConditions && template.termsAndConditions && (
        <div className="terms-section">
          <div className="section-title" style={{ backgroundColor: secondaryColor }}>
            <strong>TERMS & CONDITIONS</strong>
          </div>
          <p>{template.termsAndConditions}</p>
        </div>
      )}

      {/* Warehouse Note */}
      {sections.warehouseNote && template.warehouseNote && (
        <div className="warehouse-note" style={{ borderColor: primaryColor }}>
          <strong style={{ color: primaryColor }}>WAREHOUSE COLLECTION NOTE:</strong>
          <p>{template.warehouseNote}</p>
        </div>
      )}

      {/* Signatures */}
      {sections.signatures && (
        <div className="signatures-section">
          <div className="signature-box">
            <div className="signature-line"></div>
            <div className="signature-label">Customer Signature</div>
            <div className="signature-name">Name: _________________</div>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <div className="signature-label">Sales Officer</div>
            <div className="signature-name">Name: _________________</div>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <div className="signature-label">Warehouse Officer</div>
            <div className="signature-name">Name: _________________</div>
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
            size={100}
            level="M"
          />
          <div className="qr-label">Scan for Warehouse Verification</div>
        </div>
      )}

      {/* Footer */}
      {sections.footer && (
        <div className="template-footer" style={{ borderTopColor: primaryColor, backgroundColor: `${primaryColor}10` }}>
          {template.customFooter || 'Thank you for your patronage!'}
        </div>
      )}

      <style jsx>{`
        .nigerian-wholesale-template {
          position: relative;
          padding: 30px;
          background: white;
          color: #000;
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
          max-width: 400px;
          max-height: 400px;
          opacity: 0.15;
          transform: rotate(-30deg);
        }

        .watermark-text {
          font-size: 96px;
          font-weight: bold;
          color: ${primaryColor};
          transform: rotate(-30deg);
          white-space: nowrap;
          opacity: 0.2;
        }

        .wholesale-header {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 4px solid;
        }

        .wholesale-logo {
          flex: 0 0 auto;
        }

        .wholesale-business-info {
          flex: 1;
        }

        .wholesale-business-info h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          font-weight: bold;
        }

        .wholesale-details {
          line-height: 1.8;
          font-size: 14px;
        }

        .invoice-number-section {
          padding: 25px;
          margin-bottom: 25px;
          color: white;
          text-align: center;
          border-radius: 4px;
        }

        .invoice-number-label {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        .invoice-number-large {
          font-size: 48px;
          font-weight: bold;
          letter-spacing: 3px;
          margin-bottom: 15px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .invoice-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          text-align: left;
          font-size: 14px;
          margin-top: 15px;
        }

        .status-pending { color: #fef3c7; font-weight: bold; }
        .status-paid { color: #d1fae5; font-weight: bold; }
        .status-partial { color: #dbeafe; font-weight: bold; }
        .status-overdue { color: #fee2e2; font-weight: bold; }

        .customer-section {
          margin-bottom: 25px;
          border: 2px solid #000;
        }

        .section-title {
          padding: 10px 15px;
          color: white;
          font-size: 14px;
          letter-spacing: 1px;
        }

        .customer-details {
          padding: 15px;
          line-height: 2;
          font-size: 14px;
        }

        .items-section {
          margin-bottom: 25px;
          border: 2px solid #000;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoice-table th, .invoice-table td {
          padding: 14px 12px;
          text-align: left;
          border-bottom: 2px solid #000;
        }

        .invoice-table th {
          font-weight: bold;
          font-size: 13px;
          letter-spacing: 0.5px;
        }

        .invoice-table tbody tr {
          border-bottom: 1px solid #000;
        }

        .invoice-table tbody tr:last-child {
          border-bottom: 2px solid #000;
        }

        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 25px;
        }

        .totals-table {
          width: 350px;
          border: 2px solid #000;
          padding: 15px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #000;
          font-size: 15px;
        }

        .grand-total {
          font-size: 20px;
          font-weight: bold;
          border-top: 3px solid;
          border-bottom: none;
          padding-top: 15px;
          margin-top: 10px;
        }

        .amount-in-words {
          padding: 15px;
          background: #f5f5f5;
          border: 1px solid #000;
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 1.6;
        }

        .notes-section, .terms-section {
          margin-bottom: 20px;
          border: 2px solid #000;
        }

        .notes-section p, .terms-section p {
          padding: 15px;
          margin: 0;
          line-height: 1.8;
          font-size: 13px;
        }

        .warehouse-note {
          padding: 20px;
          border: 3px solid;
          border-radius: 4px;
          margin-bottom: 25px;
          background: #fffbe6;
          font-size: 15px;
          line-height: 1.6;
        }

        .warehouse-note strong {
          display: block;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .signatures-section {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
          padding: 20px 0;
          border-top: 1px solid #000;
        }

        .signature-box {
          text-align: center;
          width: 30%;
        }

        .signature-line {
          border-bottom: 2px solid #000;
          margin-bottom: 10px;
          height: 50px;
        }

        .signature-label {
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .signature-name {
          font-size: 11px;
          margin-top: 5px;
        }

        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin: 25px 0;
          padding: 15px;
          border: 1px dashed #000;
        }

        .qr-label {
          font-size: 11px;
          font-weight: bold;
          text-align: center;
        }

        .template-footer {
          padding: 15px 0 0 0;
          border-top: 3px solid;
          text-align: center;
          font-size: 13px;
          margin-top: auto;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}