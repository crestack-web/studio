'use client';

import React, { useState } from 'react';
import { Check, Package, TrendingUp, DollarSign, X, MessageCircle, Download, Printer } from 'lucide-react';

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  costPrice?: number;
}

interface SaleConfirmationCardProps {
  items: SaleItem[];
  totalRevenue: number;
  totalProfit?: number;
  timestamp?: Date;
  mode?: 'pending' | 'recorded';
  onConfirm?: () => void;
  onCancel?: () => void;
  isExecuting?: boolean;
}

function generateReceiptHTML(items: SaleItem[], totalRevenue: number, totalProfit?: number, timestamp?: Date): string {
  const date = timestamp || new Date();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Sale Receipt</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
  .receipt { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { text-align: center; border-bottom: 2px dashed #e0e0e0; padding-bottom: 16px; margin-bottom: 16px; }
  .header h1 { margin: 0; font-size: 22px; color: #1a1a1a; }
  .header .subtitle { color: #666; font-size: 13px; margin-top: 4px; }
  .items { margin: 16px 0; }
  .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .item:last-child { border-bottom: none; }
  .item-name { font-weight: 500; color: #333; }
  .item-details { font-size: 13px; color: #666; }
  .item-total { font-weight: 600; color: #1a1a1a; }
  .summary { background: #f0fdf4; border-radius: 8px; padding: 12px; margin-top: 12px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .summary-row.total { font-weight: 700; font-size: 16px; border-top: 1px solid #d1fae5; padding-top: 8px; margin-top: 4px; }
  .profit { color: #059669; }
  .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #e0e0e0; font-size: 12px; color: #999; }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <h1>Sale Receipt</h1>
    <div class="subtitle">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
  </div>
  <div class="items">
    ${items.map(item => `
    <div class="item">
      <div>
        <div class="item-name">${item.name}</div>
        <div class="item-details">${item.quantity} x ₦${item.price.toLocaleString()}${item.costPrice ? ` (Cost: ₦${item.costPrice.toLocaleString()})` : ''}</div>
      </div>
      <div class="item-total">₦${(item.price * item.quantity).toLocaleString()}</div>
    </div>`).join('')}
  </div>
  <div class="summary">
    <div class="summary-row"><span>Items Sold</span><span>${totalItems}</span></div>
    <div class="summary-row total"><span>Total Revenue</span><span>₦${totalRevenue.toLocaleString()}</span></div>
    ${totalProfit !== undefined && totalProfit > 0 ? `<div class="summary-row"><span class="profit">Profit</span><span class="profit">₦${totalProfit.toLocaleString()}</span></div>` : ''}
  </div>
  <div class="footer">Recorded via Busmo AI</div>
</div>
</body>
</html>`;
}

export function SaleConfirmationCard({ items, totalRevenue, totalProfit, timestamp, mode = 'pending', onConfirm, onCancel, isExecuting }: SaleConfirmationCardProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const [showReceipt, setShowReceipt] = useState(false);

  const handleWhatsAppShare = () => {
    const date = timestamp || new Date();
    let text = `🧾 *Sale Receipt*\n📅 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n\n`;
    items.forEach(item => {
      text += `• ${item.name}: ${item.quantity} x ₦${item.price.toLocaleString()} = ₦${(item.price * item.quantity).toLocaleString()}\n`;
    });
    text += `\n💰 *Total: ₦${totalRevenue.toLocaleString()}*`;
    if (totalProfit !== undefined && totalProfit > 0) {
      text += `\n📈 Profit: ₦${totalProfit.toLocaleString()}`;
    }
    text += `\n\nRecorded via Busmo AI`;
    
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleDownload = () => {
    const html = generateReceiptHTML(items, totalRevenue, totalProfit, timestamp);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const html = generateReceiptHTML(items, totalRevenue, totalProfit, timestamp);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (showReceipt) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: '1px solid #bae6fd',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#0369a1', fontWeight: 600 }}>Receipt</h4>
          <button
            onClick={() => setShowReceipt(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '13px' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #e0e0e0', paddingBottom: '8px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Sale Receipt</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {timestamp?.toLocaleDateString()} {timestamp?.toLocaleTimeString()}
            </div>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {item.quantity} x ₦{item.price.toLocaleString()}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>₦{(item.price * item.quantity).toLocaleString()}</div>
            </div>
          ))}
          <div style={{ background: '#f0fdf4', borderRadius: '6px', padding: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px' }}>
              <span>Total</span>
              <span>₦{totalRevenue.toLocaleString()}</span>
            </div>
            {totalProfit !== undefined && totalProfit > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontSize: '13px' }}>
                <span>Profit</span>
                <span>₦{totalProfit.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleWhatsAppShare}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button
            onClick={handleDownload}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={14} /> Download
          </button>
          <button
            onClick={handlePrint}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-5 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mode === 'recorded' ? 'bg-green-500' : 'bg-amber-500'}`}>
          {mode === 'recorded' ? <Check className="w-5 h-5 text-white" /> : <DollarSign className="w-5 h-5 text-white" />}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
            {mode === 'recorded' ? 'Sale Recorded' : 'Confirm Sale'}
          </h3>
          {timestamp && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 px-3 bg-white/50 dark:bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  {item.name}
                </span>
                {item.costPrice !== undefined && item.costPrice > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Cost: ₦{item.costPrice.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ×{item.quantity} — ₦{(item.price * item.quantity).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ₦{item.price.toLocaleString()} each
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white/70 dark:bg-white/10 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Revenue</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            ₦{totalRevenue.toLocaleString()}
          </span>
        </div>
        
        {totalProfit !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Profit</span>
            </div>
            <span className={`font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₦{totalProfit.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Items</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{totalItems}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {mode === 'pending' && onConfirm && onCancel && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            style={{
              flex: 1, padding: '10px', background: isExecuting ? '#94a3b8' : '#16a34a',
              color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: isExecuting ? 'not-allowed' : 'pointer', fontSize: '14px',
            }}
          >
            {isExecuting ? 'Recording...' : '✓ Confirm Sale'}
          </button>
          <button
            onClick={onCancel}
            disabled={isExecuting}
            style={{
              flex: 1, padding: '10px', background: 'var(--bg-2, #f1f5f9)',
              color: 'var(--text-1, #334155)', border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '8px', fontWeight: 600, cursor: isExecuting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Receipt & Share Buttons (after recording) */}
      {mode === 'recorded' && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => setShowReceipt(true)}
            style={{
              width: '100%', padding: '10px', background: '#0ea5e9', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
              fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            View Receipt & Share
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-green-200 dark:border-green-800">
        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
          <Package className="w-3 h-3" />
          <span>Inventory Updated</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
          <TrendingUp className="w-3 h-3" />
          <span>Sales Logged</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
          <DollarSign className="w-3 h-3" />
          <span>Profit Updated</span>
        </div>
      </div>
    </div>
  );
}
