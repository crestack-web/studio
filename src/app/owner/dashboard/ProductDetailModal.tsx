import React, { useState, useEffect } from 'react';
import {
  Product, StockMovementEntry,
  getStockStatus, getDaysSinceLastSale,
  getDaysUntilStockout,
} from './inventoryData';
import { useCurrency } from './CurrencyContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSave?: (updated: Product) => void;
}

type TabKey = 'overview' | 'movement' | 'adjust';

const MovementTypeIcon: React.FC<{ type: StockMovementEntry['type'] }> = ({ type }) => {
  const configs = {
    sale:       { icon: '🛒', cls: 'inv-mv-sale' },
    restock:    { icon: '📦', cls: 'inv-mv-restock' },
    adjustment: { icon: '✏️', cls: 'inv-mv-adj' },
    return:     { icon: '↩️', cls: 'inv-mv-return' },
  };
  const c = configs[type];
  return <span className={`inv-mv-icon ${c.cls}`}>{c.icon}</span>;
};

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onSave }) => {
  const { formatMoney } = useCurrency();
  const [tab, setTab]                 = useState<TabKey>('overview');
  const [adjustQty, setAdjustQty]     = useState('');
  const [adjustType, setAdjustType]   = useState<'add' | 'remove' | 'set'>('add');
  const [adjustNote, setAdjustNote]   = useState('');
  const [threshold, setThreshold]     = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedCost, setEditedCost]   = useState('');
  const [saved, setSaved]             = useState(false);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setTab('overview');
      setAdjustQty('');
      setAdjustNote('');
      setThreshold(String(product.reorderThreshold));
      setEditedPrice(String(product.sellingPrice));
      setEditedCost(String(product.costPrice));
      setSaved(false);
    }
  }, [product]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!product) return null;

  const status      = getStockStatus(product);
  const daysSince   = getDaysSinceLastSale(product);
  const daysLeft    = getDaysUntilStockout(product);
  const profit      = product.sellingPrice - product.costPrice;
  const margin      = ((profit / product.sellingPrice) * 100).toFixed(1);
  const totalValue  = product.costPrice * product.stock;

  const statusColors: Record<string, string> = {
    in_stock: 'var(--green)',
    low: 'var(--amber)',
    out: 'var(--red)',
  };
  const statusLabels: Record<string, string> = {
    in_stock: 'In Stock', low: 'Low Stock', out: 'Out of Stock',
  };

  const handleSaveAdjustment = () => {
    const qty = parseInt(adjustQty, 10);
    if (!qty || isNaN(qty)) return;
    // In real app: call API
    // Here we just show success feedback
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setAdjustQty('');
    setAdjustNote('');
  };

  const handleSaveDetails = () => {
    if (!onSave) return;
    const updated: Product = {
      ...product,
      sellingPrice: parseFloat(editedPrice) || product.sellingPrice,
      costPrice: parseFloat(editedCost) || product.costPrice,
      reorderThreshold: parseInt(threshold, 10) || product.reorderThreshold,
    };
    onSave(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>

        {/* ── Modal header ── */}
        <div className="inv-modal-header">
          <div className="inv-modal-prod">
            <div className="inv-modal-emoji">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                product.emoji
              )}
            </div>
            <div>
              <div className="inv-modal-name">{product.name}</div>
              <div className="inv-modal-meta">{product.sku} · {product.category}</div>
            </div>
          </div>
          <div className="inv-modal-header-right">
            <span
              className="inv-modal-status"
              style={{ background: `${statusColors[status]}20`, color: statusColors[status] }}
            >
              {statusLabels[status]}
            </span>
            <button className="inv-modal-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="inv-modal-tabs">
          {(['overview', 'movement', 'adjust'] as TabKey[]).map(t => (
            <button
              key={t}
              className={`inv-modal-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'overview' ? '📊 Overview' : t === 'movement' ? '📋 Stock History' : '⚙️ Adjust & Edit'}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="inv-modal-body">

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div className="inv-modal-overview">
              {/* Key stats grid */}
              <div className="inv-modal-stats">
                <div className="inv-ms-card">
                  <div className="inv-ms-label">Current Stock</div>
                  <div className="inv-ms-val" style={{ color: statusColors[status] }}>
                    {product.stock}
                  </div>
                  <div className="inv-ms-sub">units on hand</div>
                </div>
                <div className="inv-ms-card">
                  <div className="inv-ms-label">Selling Price</div>
                  <div className="inv-ms-val">{formatMoney(product.sellingPrice)}</div>
                  <div className="inv-ms-sub">per unit</div>
                </div>
                <div className="inv-ms-card">
                  <div className="inv-ms-label">Profit / Unit</div>
                  <div className="inv-ms-val" style={{ color: 'var(--green)' }}>
                    +{formatMoney(profit)}
                  </div>
                  <div className="inv-ms-sub">{margin}% margin</div>
                </div>
                <div className="inv-ms-card">
                  <div className="inv-ms-label">Stock Value</div>
                  <div className="inv-ms-val">{formatMoney(totalValue)}</div>
                  <div className="inv-ms-sub">at cost price</div>
                </div>
              </div>

              {/* Sales & velocity */}
              <div className="inv-modal-section">
                <div className="inv-modal-section-title">Sales Intelligence</div>
                <div className="inv-modal-rows">
                  <div className="inv-modal-row">
                    <span>Units sold (30 days)</span>
                    <strong>{product.unitsSold30d}</strong>
                  </div>
                  <div className="inv-modal-row">
                    <span>Daily sales rate</span>
                    <strong>{(product.unitsSold30d / 30).toFixed(1)} units/day</strong>
                  </div>
                  <div className="inv-modal-row">
                    <span>Last sale</span>
                    <strong>
                      {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`}
                    </strong>
                  </div>
                  {daysLeft !== null && (
                    <div className="inv-modal-row">
                      <span>Estimated days until stockout</span>
                      <strong style={{ color: daysLeft <= 5 ? 'var(--red)' : 'var(--t1)' }}>
                        ~{daysLeft} days
                      </strong>
                    </div>
                  )}
                  <div className="inv-modal-row">
                    <span>Reorder threshold</span>
                    <strong>{product.reorderThreshold} units</strong>
                  </div>
                  <div className="inv-modal-row">
                    <span>Suggested reorder qty</span>
                    <strong>{product.suggestedReorder > 0 ? `${product.suggestedReorder} units` : 'Well stocked'}</strong>
                  </div>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="inv-modal-section">
                <div className="inv-modal-section-title">Pricing Breakdown</div>
                <div className="inv-modal-rows">
                  <div className="inv-modal-row">
                    <span>Cost price</span>
                    <strong>{formatMoney(product.costPrice)}</strong>
                  </div>
                  <div className="inv-modal-row">
                    <span>Selling price</span>
                    <strong>{formatMoney(product.sellingPrice)}</strong>
                  </div>
                  <div className="inv-modal-row">
                    <span>Gross profit / unit</span>
                    <strong style={{ color: 'var(--green)' }}>+{formatMoney(profit)} ({margin}%)</strong>
                  </div>
                  <div className="inv-modal-row">
                    <span>Revenue potential (current stock)</span>
                    <strong>{formatMoney(product.sellingPrice * product.stock)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MOVEMENT / HISTORY TAB ── */}
          {tab === 'movement' && (
            <div>
              <div className="inv-modal-section-title" style={{ marginBottom: 12 }}>
                Stock Movement History
              </div>
              {product.movement.length === 0 ? (
                <div className="inv-dead-empty">No movement history recorded yet.</div>
              ) : (
                <div className="inv-mv-list">
                  {product.movement.map((m, i) => (
                    <div key={i} className="inv-mv-entry" onClick={() => {
                      if (m.recordedBy) {
                        alert(`Recorded by: ${m.recordedBy.displayName || m.recordedBy.email || 'Unknown'}\nDate: ${m.recordedBy.timestamp ? new Date(m.recordedBy.timestamp).toLocaleString() : 'Unknown'}`);
                      }
                    }} style={{ cursor: m.recordedBy ? 'pointer' : 'default' }}>
                      <MovementTypeIcon type={m.type} />
                      <div className="inv-mv-detail">
                        <div className="inv-mv-note">{m.note}</div>
                        <div className="inv-mv-date">{m.date}</div>
                        {m.recordedBy && (
                          <div className="inv-mv-recorded-by">
                            <span className="inv-mv-recorded-by-icon">👤</span>
                            <span>{m.recordedBy.displayName || m.recordedBy.email?.split('@')[0] || 'Unknown'}</span>
                          </div>
                        )}
                      </div>
                      <div className="inv-mv-right">
                        <span className={`inv-mv-qty${m.qty > 0 ? ' pos' : ' neg'}`}>
                          {m.qty > 0 ? `+${m.qty}` : m.qty}
                        </span>
                        <span className="inv-mv-balance">{m.balance} left</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ADJUST & EDIT TAB ── */}
          {tab === 'adjust' && (
            <div className="inv-adjust-form">

              {/* Stock adjustment */}
              <div className="inv-modal-section">
                <div className="inv-modal-section-title">Manual Stock Adjustment</div>
                <div className="inv-adjust-type-row">
                  {(['add', 'remove', 'set'] as const).map(t => (
                    <button
                      key={t}
                      className={`inv-adj-type-btn${adjustType === t ? ' active' : ''}`}
                      onClick={() => setAdjustType(t)}
                    >
                      {t === 'add' ? '+ Add Stock' : t === 'remove' ? '− Remove' : '= Set to'}
                    </button>
                  ))}
                </div>
                <div className="inv-adjust-row">
                  <label className="inv-adjust-label">
                    {adjustType === 'set' ? 'Set stock to' : adjustType === 'add' ? 'Add quantity' : 'Remove quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="inv-adjust-input"
                    placeholder="Enter units…"
                    value={adjustQty}
                    onChange={e => setAdjustQty(e.target.value)}
                  />
                </div>
                <div className="inv-adjust-row">
                  <label className="inv-adjust-label">Reason / Note</label>
                  <input
                    type="text"
                    className="inv-adjust-input"
                    placeholder="e.g. Restock from supplier, Damaged stock…"
                    value={adjustNote}
                    onChange={e => setAdjustNote(e.target.value)}
                  />
                </div>
                <button
                  className="btn bsm bpr"
                  style={{ marginTop: 8 }}
                  onClick={handleSaveAdjustment}
                  disabled={!adjustQty}
                >
                  Apply Adjustment
                </button>
              </div>

              {/* Edit pricing & threshold */}
              <div className="inv-modal-section">
                <div className="inv-modal-section-title">Edit Product Details</div>
                <div className="inv-edit-grid">
                  <div className="inv-adjust-row">
                    <label className="inv-adjust-label">Cost Price</label>
                    <input
                      type="number"
                      className="inv-adjust-input"
                      value={editedCost}
                      onChange={e => setEditedCost(e.target.value)}
                    />
                  </div>
                  <div className="inv-adjust-row">
                    <label className="inv-adjust-label">Selling Price</label>
                    <input
                      type="number"
                      className="inv-adjust-input"
                      value={editedPrice}
                      onChange={e => setEditedPrice(e.target.value)}
                    />
                  </div>
                  <div className="inv-adjust-row">
                    <label className="inv-adjust-label">Reorder Threshold (units)</label>
                    <input
                      type="number"
                      className="inv-adjust-input"
                      value={threshold}
                      onChange={e => setThreshold(e.target.value)}
                    />
                  </div>
                  <div className="inv-adjust-row inv-adjust-preview">
                    <label className="inv-adjust-label">New Profit / Unit</label>
                    <span className="inv-adj-profit-preview">
                      +{formatMoney(
                        (parseFloat(editedPrice) || product.sellingPrice) -
                        (parseFloat(editedCost) || product.costPrice)
                      )}
                    </span>
                  </div>
                </div>
                <button
                  className="btn bsm bpr"
                  style={{ marginTop: 8 }}
                  onClick={handleSaveDetails}
                >
                  Save Changes
                </button>
              </div>

              {/* Success toast within modal */}
              {saved && (
                <div className="inv-adjust-saved">
                  ✓ Saved successfully
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
