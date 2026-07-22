'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import styles from './SellCollectionsPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreProduct {
  id: string;
  displayName: string;
  images: string[];
  category: string;
  price: number;
  available: boolean;
}

interface StoreCollection {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

type FormData = {
  title: string;
  description: string;
  coverImageUrl: string;
};

const EMPTY_FORM: FormData = { title: '', description: '', coverImageUrl: '' };

function fmt(n: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : '$';
  return `${s}${n.toLocaleString()}`;
}

// ─── Product Picker Modal ─────────────────────────────────────────────────────

interface ProductPickerProps {
  all: StoreProduct[];
  selected: string[];
  currency: string;
  onSave: (ids: string[]) => void;
  onClose: () => void;
}

function ProductPickerModal({ all, selected, currency, onSave, onClose }: ProductPickerProps) {
  const [picked, setPicked] = useState<Set<string>>(new Set(selected));
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => all.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  ), [all, search]);

  const toggle = (id: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>Add products to collection</p>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--sell-border)' }}>
          <input
            className={styles.searchInput}
            style={{ width: '100%' }}
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.modalBody}>
          {filtered.length === 0
            ? <p style={{ textAlign: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem', padding: '24px 0' }}>No products found</p>
            : filtered.map(p => (
              <label key={p.id} className={`${styles.productPickRow} ${picked.has(p.id) ? styles.productPickRowSelected : ''}`}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={picked.has(p.id)}
                  onChange={() => toggle(p.id)}
                />
                {p.images[0]
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.images[0]} alt={p.displayName} className={styles.pickImg} />
                  : <div className={styles.pickImgPlaceholder}>📦</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={styles.pickName}>{p.displayName}</p>
                  <p className={styles.pickMeta}>{p.category} · {fmt(p.price, currency)}</p>
                </div>
                {!p.available && <span className={styles.hiddenPill}>Hidden</span>}
              </label>
            ))}
        </div>
        <div className={styles.modalFooter}>
          <span className={styles.pickCount}>{picked.size} selected</span>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onSave([...picked])}>
            Save
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Collection Slide-Over Form ───────────────────────────────────────────────

interface SlideOverProps {
  col: StoreCollection | null;
  allProducts: StoreProduct[];
  onClose: () => void;
  onSaved: () => void;
  businessId: string;
  currency: string;
}

function CollectionSlideOver({ col, allProducts, onClose, onSaved, businessId, currency }: SlideOverProps) {
  const { showToast } = useSell();
  const [form, setForm] = useState<FormData>(() => col
    ? { title: col.title, description: col.description, coverImageUrl: col.coverImageUrl ?? '' }
    : { ...EMPTY_FORM }
  );
  const [productIds, setProductIds]   = useState<string[]>(col?.productIds ?? []);
  const [saving, setSaving]           = useState(false);
  const [showPicker, setShowPicker]   = useState(false);
  const [dragId, setDragId]           = useState<string | null>(null);
  const [dragOverId, setDragOverId]   = useState<string | null>(null);

  const set = useCallback(<K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver  = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop      = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const arr = [...productIds];
    const fromIdx = arr.indexOf(dragId);
    const toIdx   = arr.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, dragId);
    setProductIds(arr);
    setDragId(null);
    setDragOverId(null);
  };

  const removeProduct = (id: string) => setProductIds(prev => prev.filter(x => x !== id));

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const { firestore } = initializeFirebase();
      const payload = {
        title:         form.title.trim(),
        description:   form.description.trim(),
        coverImageUrl: form.coverImageUrl.trim() || null,
        productIds,
        updatedAt:     serverTimestamp(),
      };
      const colRef = collection(firestore, 'businesses', businessId, 'storeCollections');
      if (col) {
        await updateDoc(doc(colRef, col.id), payload);
      } else {
        await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
      }
      onSaved();
    } catch (err) {
      console.error('[CollectionSlideOver] Save error:', err);
      showToast('Failed to save collection', 'error');
    } finally {
      setSaving(false);
    }
  }, [form, productIds, col, businessId, onSaved, showToast]);

  // Products in this collection with their info
  const collectionProducts = productIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean) as StoreProduct[];

  return (
    <>
      {showPicker && (
        <ProductPickerModal
          all={allProducts}
          selected={productIds}
          currency={currency}
          onSave={ids => { setProductIds(ids); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.slideover}>
        <div className={styles.slideoverHeader}>
          <div>
            <p className={styles.slideoverTitle}>{col ? 'Edit Collection' : 'New Collection'}</p>
            <p className={styles.slideoverSub}>{col ? `Editing ${col.title}` : 'Group products into a collection'}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className={styles.slideoverBody}>
          {/* Title */}
          <div className={styles.formSection}>
            <p className={styles.formSectionLabel}>Collection details</p>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Collection name *</label>
              <input
                className={styles.formInput}
                placeholder="e.g. New Arrivals, Best Sellers, Men's Fashion…"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Brief description shown on the storefront…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cover image URL</label>
              <input
                className={styles.formInput}
                placeholder="https://…"
                value={form.coverImageUrl}
                onChange={e => set('coverImageUrl', e.target.value)}
              />
              <p className={styles.formHint}>Paste a direct image URL for the collection banner</p>
            </div>
          </div>

          {/* Products */}
          <div className={styles.formSection}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className={styles.formSectionLabel}>Products ({productIds.length})</p>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                onClick={() => setShowPicker(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add products
              </button>
            </div>

            {collectionProducts.length === 0 ? (
              <div className={styles.productsEmpty}>
                <span>📂</span>
                <p>No products yet — click &quot;Add products&quot; to start</p>
              </div>
            ) : (
              <div className={styles.productsList}>
                <p className={styles.dragHint}>Drag to reorder</p>
                {collectionProducts.map(p => (
                  <div
                    key={p.id}
                    className={`${styles.productDragRow} ${dragOverId === p.id ? styles.dragOver : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(p.id)}
                    onDragOver={e => handleDragOver(e, p.id)}
                    onDrop={() => handleDrop(p.id)}
                    onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                  >
                    <div className={styles.dragHandle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                    </div>
                    {p.images[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.images[0]} alt={p.displayName} className={styles.pickImg} />
                      : <div className={styles.pickImgPlaceholder}>📦</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className={styles.pickName}>{p.displayName}</p>
                      <p className={styles.pickMeta}>{fmt(p.price, currency)}</p>
                    </div>
                    <button
                      className={styles.removeProductBtn}
                      onClick={() => removeProduct(p.id)}
                      title="Remove from collection"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.slideoverFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
          >
            {saving ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                Saving…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {col ? 'Save changes' : 'Create collection'}
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SellCollectionsPage() {
  const { user, storeConfig, showToast } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [collections, setCollections]   = useState<StoreCollection[]>([]);
  const [allProducts, setAllProducts]   = useState<StoreProduct[]>([]);
  const [loading, setLoading]           = useState(true);
  const [slideOver, setSlideOver]       = useState<'add' | StoreCollection | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const [colSnap, prodSnap] = await Promise.all([
        getDocs(collection(firestore, 'businesses', user.businessId, 'storeCollections')),
        getDocs(collection(firestore, 'businesses', user.businessId, 'storeProducts')),
      ]);
      const cols = colSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        productIds: d.data().productIds ?? [],
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      })) as StoreCollection[];
      cols.sort((a, b) => a.title.localeCompare(b.title));
      setCollections(cols);

      const prods = prodSnap.docs.map(d => ({
        id: d.id,
        displayName: d.data().displayName ?? '',
        images: d.data().images ?? [],
        category: d.data().category ?? '',
        price: d.data().price ?? 0,
        available: d.data().available ?? true,
      })) as StoreProduct[];
      setAllProducts(prods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user?.businessId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(async (col: StoreCollection, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete collection "${col.title}"? Products won't be deleted.`)) return;
    setDeleting(col.id);
    try {
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(collection(firestore, 'businesses', user!.businessId, 'storeCollections'), col.id));
      setCollections(prev => prev.filter(c => c.id !== col.id));
      showToast('Collection deleted', 'info');
    } catch { showToast('Failed to delete collection', 'error'); }
    finally { setDeleting(null); }
  }, [user, showToast]);

  const onSaved = useCallback(async () => {
    setSlideOver(null);
    await load();
    showToast('Collection saved', 'success');
  }, [load, showToast]);

  return (
    <>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.heading}>Collections</h2>
            <p className={styles.sub}>Group your products into themed collections shown on your storefront.</p>
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSlideOver('add')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New collection
          </button>
        </div>

        {loading ? (
          <div className={styles.empty}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              Loading collections…
            </div>
          </div>
        ) : collections.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📂</div>
            <p className={styles.emptyTitle}>No collections yet</p>
            <p className={styles.emptySub}>Create collections like &quot;Summer Styles&quot; or &quot;Best Sellers&quot; to help customers discover your products.</p>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSlideOver('add')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create first collection
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {collections.map(col => {
              const prods = col.productIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as StoreProduct[];
              const cover = col.coverImageUrl || prods[0]?.images[0] || null;
              return (
                <div key={col.id} className={styles.card} onClick={() => setSlideOver(col)}>
                  <div className={styles.cardCover}>
                    {cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={cover} alt={col.title} className={styles.cardCoverImg} />
                      : <span className={styles.cardCoverPlaceholder}>📂</span>}
                    <div className={styles.cardProductCount}>{col.productIds.length} product{col.productIds.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardTitle}>{col.title}</p>
                    {col.description && <p className={styles.cardDesc}>{col.description}</p>}
                    {/* Mini product strip */}
                    {prods.length > 0 && (
                      <div className={styles.productStrip}>
                        {prods.slice(0, 5).map(p => (
                          p.images[0]
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img key={p.id} src={p.images[0]} alt={p.displayName} className={styles.stripImg} />
                            : <div key={p.id} className={styles.stripImgPlaceholder}>📦</div>
                        ))}
                        {prods.length > 5 && <span className={styles.moreChip}>+{prods.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                    <button className={styles.iconBtn} onClick={() => setSlideOver(col)} title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={e => handleDelete(col, e)}
                      disabled={deleting === col.id}
                      title="Delete collection"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {slideOver !== null && user?.businessId && (
        <CollectionSlideOver
          col={slideOver === 'add' ? null : slideOver}
          allProducts={allProducts}
          onClose={() => setSlideOver(null)}
          onSaved={onSaved}
          businessId={user.businessId}
          currency={currency}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
