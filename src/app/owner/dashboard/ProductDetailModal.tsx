import React, { useState, useEffect } from 'react';
import {
  Product, StockMovementEntry,
  getStockStatus, getDaysSinceLastSale,
  getDaysUntilStockout,
} from './inventoryData';
import { useCurrency } from './CurrencyContext';
import { getAuthCurrentUser, getFirestoreUserId } from '@/lib/supabase-auth';
import { fetchDoc, updateDoc } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';

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
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [removeImage, setRemoveImage] = useState(false);
  const [imageBusy, setImageBusy]     = useState(false);
  const [imageError, setImageError]   = useState<string | null>(null);

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
      setImageFile(null);
      setImagePreview(product.imageUrl || '');
      setRemoveImage(false);
      setImageError(null);
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

  const handleSaveAdjustment = async () => {
    const qty = parseInt(adjustQty, 10);
    if (!qty || isNaN(qty) || !product) return;

    try {
      const userIds = getFirestoreUserId();
      
      if (!userIds) return;

      const user = {
        uid: userIds.firestoreUid,
        email: userIds.email,
        displayName: getAuthCurrentUser()?.displayName || null,
      };

      const businessId = user.uid;
      const collectionPath = `businesses/${businessId}/products`;

      const currentProduct = await fetchDoc<Record<string, unknown>>(collectionPath, product.id);
      const currentMovement = Array.isArray(currentProduct?.movement) ? (currentProduct.movement as unknown[]) : Array.isArray(product.movement) ? product.movement : [];
      
      let newStock = product.stock;
      if (adjustType === 'add') newStock = product.stock + qty;
      else if (adjustType === 'remove') newStock = Math.max(0, product.stock - qty);
      else if (adjustType === 'set') newStock = qty;

      const movementEntry = {
        type: 'adjustment' as const,
        qty: adjustType === 'add' ? qty : adjustType === 'remove' ? -qty : qty - product.stock,
        balance: newStock,
        note: adjustNote || 'Manual stock adjustment',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        recordedBy: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Owner',
          timestamp: Date.now(),
        },
      };

      await updateDoc(collectionPath, product.id, {
        stock: newStock,
        movement: [...currentMovement, movementEntry],
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setAdjustQty('');
      setAdjustNote('');
      
      if (onSave) onSave({ ...product, stock: newStock });
    } catch (error) {
      console.error('Error saving adjustment:', error);
      alert('Failed to save adjustment. Please try again.');
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be under 5MB');
      return;
    }
    setImageError(null);
    setRemoveImage(false);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(true);
    setImageError(null);
  };

  const handleSaveDetails = async () => {
    if (!product) return;
    setImageBusy(true);
    setImageError(null);
    try {
      const user = getAuthCurrentUser();
      if (!user) {
        setImageError('Sign in required');
        return;
      }

      let businessId = '';
      try {
        const { data: userDoc } = await getSupabase()
          .from('users')
          .select('business_id, businessId')
          .eq('id', user.uid)
          .maybeSingle();
        businessId = (userDoc as any)?.business_id || (userDoc as any)?.businessId || '';
      } catch { /* fall through */ }
      if (!businessId) {
        const { resolveOwnerScopeBusinessId } = await import('@/lib/resolve-business-scope');
        businessId = (await resolveOwnerScopeBusinessId(user.uid, undefined)) || '';
      }
      if (!businessId) {
        setImageError('Business not found');
        return;
      }

      let nextImageUrl = product.imageUrl || '';

      if (removeImage) {
        nextImageUrl = '';
        // Best-effort delete of previous object if it lives in our products bucket
        try {
          const prev = product.imageUrl || '';
          const marker = '/storage/v1/object/public/products/';
          const idx = prev.indexOf(marker);
          if (idx >= 0) {
            const objectPath = decodeURIComponent(prev.slice(idx + marker.length).split('?')[0]);
            if (objectPath) {
              await getSupabase().storage.from('products').remove([objectPath]);
            }
          }
        } catch (e) {
          console.warn('Could not delete previous image object', e);
        }
      } else if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${businessId}/${Date.now()}_${safeName}`;
        const { error: uploadError } = await getSupabase()
          .storage
          .from('products')
          .upload(filePath, imageFile, { upsert: true, contentType: imageFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = getSupabase().storage.from('products').getPublicUrl(filePath);
        nextImageUrl = urlData.publicUrl;
      }

      const updated: Product = {
        ...product,
        sellingPrice: parseFloat(editedPrice) || product.sellingPrice,
        costPrice: parseFloat(editedCost) || product.costPrice,
        reorderThreshold: parseInt(threshold, 10) || product.reorderThreshold,
        imageUrl: nextImageUrl,
      };

      // Persist image + pricing on the product row (inventory onSave also updates prices)
      await updateDoc(`businesses/${businessId}/products`, product.id, {
        imageUrl: nextImageUrl,
        image_url: nextImageUrl,
        price: updated.sellingPrice,
        cost: updated.costPrice,
        lowStockThreshold: updated.reorderThreshold,
        updatedAt: new Date().toISOString(),
      });

      if (onSave) onSave(updated);
      setImageFile(null);
      setRemoveImage(false);
      setImagePreview(nextImageUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error('Save product details failed', err);
      setImageError(err?.message || 'Failed to save');
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>

        {/* ── Modal header ── */}
        <div className="inv-modal-header">
          <div className="inv-modal-prod">
            <div className="inv-modal-emoji">
              {imagePreview ? (
                <img src={imagePreview} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
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
                <div className="inv-adjust-row" style={{ marginBottom: 16 }}>
                  <label className="inv-adjust-label">Product image</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        border: '1px solid #e6e6ef',
                        background: '#f8fafc',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                      }}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        product.emoji || '📦'
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label
                        className="btn bsm bgh"
                        style={{ cursor: imageBusy ? 'not-allowed' : 'pointer', margin: 0 }}
                      >
                        {imageFile ? 'Change photo' : 'Upload photo'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={imageBusy}
                          onChange={handleImagePick}
                        />
                      </label>
                      {(imagePreview || product.imageUrl) && !removeImage ? (
                        <button
                          type="button"
                          className="btn bsm"
                          style={{ color: '#b91c1c' }}
                          disabled={imageBusy}
                          onClick={handleRemoveImage}
                        >
                          Remove photo
                        </button>
                      ) : null}
                      {removeImage ? (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Photo will be removed on save</span>
                      ) : null}
                    </div>
                  </div>
                  {imageError ? (
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#b91c1c' }}>{imageError}</p>
                  ) : null}
                </div>

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
                  disabled={imageBusy}
                  onClick={() => { void handleSaveDetails(); }}
                >
                  {imageBusy ? 'Saving...' : 'Save Changes'}
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

