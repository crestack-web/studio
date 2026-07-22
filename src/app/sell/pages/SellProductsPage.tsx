'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, ChangeEvent } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import styles from './SellProductsPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductType = 'physical' | 'digital' | 'service';

interface StoreProduct {
  id: string;
  productId: string;
  productType: ProductType;
  displayName: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  collectionIds: string[];
  tags: string[];
  stock: number;
  sku: string | null;
  available: boolean;
  featured: boolean;
  digitalFileUrl: string | null;
  deliveryNote: string | null;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

type FormData = {
  productType: ProductType;
  displayName: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: string;
  tags: string;
  stock: string;
  sku: string;
  lowStockThreshold: string;
  available: boolean;
  featured: boolean;
  digitalFileUrl: string;
  deliveryNote: string;
  imageUrl: string;
};

const EMPTY_FORM: FormData = {
  productType: 'physical', displayName: '', description: '',
  price: '', compareAtPrice: '', category: '', tags: '',
  stock: '', sku: '', lowStockThreshold: '5',
  available: true, featured: false,
  digitalFileUrl: '', deliveryNote: '', imageUrl: '',
};

const CATEGORIES = [
  'Fashion & Clothing','Beauty & Personal Care','Food & Groceries',
  'Electronics','Home & Kitchen','Health & Wellness',
  'Sports & Fitness','Art & Crafts','Services','Other',
];

function emoji(cat: string) {
  const m: Record<string, string> = {
    fashion:'👗', beauty:'💄', food:'🍔', electronics:'📱',
    home:'🏠', health:'💊', services:'⚙️',
  };
  return m[cat?.toLowerCase().split(' ')[0]] ?? '📦';
}

function fmt(n: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  if (n >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${s}${(n / 1_000).toFixed(1)}K`;
  return `${s}${n.toLocaleString()}`;
}

// ─── Inventory Import Modal ───────────────────────────────────────────────────

interface ImportModalProps {
  products: InventoryProduct[];
  onSelect: (p: InventoryProduct) => void;
  onClose: () => void;
  currency: string;
}

function InventoryImportModal({ products, onSelect, onClose, currency }: ImportModalProps) {
  const [search, setSearch] = useState('');
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.inventoryModal}>
        <div className={styles.inventoryModalBox}>
          <div className={styles.inventoryModalHeader}>
            <div>
              <p className={styles.inventoryModalTitle}>Import from Inventory</p>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
            <input
              className={styles.searchInput}
              style={{ width: '100%' }}
              placeholder="Search inventory…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.inventoryModalBody}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--sell-text-3)', padding: '24px 0', fontSize: '0.875rem' }}>
                No inventory products found
              </p>
            ) : filtered.map(p => (
              <div key={p.id} className={styles.inventoryRow} onClick={() => onSelect(p)}>
                <div style={{ fontSize: '1.3rem' }}>{emoji(p.category)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={styles.inventoryRowName}>{p.name}</p>
                  <p className={styles.inventoryRowMeta}>{p.category} · Stock: {p.stock}</p>
                </div>
                <p className={styles.inventoryRowMeta} style={{ fontWeight: 600, color: 'var(--sell-text-1)' }}>
                  {fmt(p.price, currency)}
                </p>
              </div>
            ))}
          </div>
          <div className={styles.inventoryModalFooter}>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Product Slide-Over Form ──────────────────────────────────────────────────

interface SlideOverProps {
  product: StoreProduct | null; // null = add mode
  onClose: () => void;
  onSaved: () => void;
  businessId: string;
  currency: string;
  storeSlug: string;
}

function ProductSlideOver({ product, onClose, onSaved, businessId, currency, storeSlug }: SlideOverProps) {
  const [form, setForm] = useState<FormData>(() => {
    if (!product) return { ...EMPTY_FORM };
    return {
      productType: product.productType,
      displayName: product.displayName,
      description: product.description,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
      category: product.category,
      tags: product.tags.join(', '),
      stock: String(product.stock),
      sku: product.sku ?? '',
      lowStockThreshold: String(product.lowStockThreshold),
      available: product.available,
      featured: product.featured,
      digitalFileUrl: product.digitalFileUrl ?? '',
      deliveryNote: product.deliveryNote ?? '',
      imageUrl: product.images[0] ?? '',
    };
  });

  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(form.imageUrl);
  const [showImport, setShowImport] = useState(false);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  const price = parseFloat(form.price) || 0;
  const cost = 0; // cost not stored on storeProducts — just show sell price margin
  const compareAt = parseFloat(form.compareAtPrice) || 0;
  const discount = compareAt > price && compareAt > 0
    ? Math.round((1 - price / compareAt) * 100)
    : null;

  // Load inventory for import
  const loadInventory = useCallback(async () => {
    try {
      const { firestore } = initializeFirebase();
      const snap = await getDocs(
        collection(firestore, 'businesses', businessId, 'products')
      );
      const items = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name ?? '',
        price: d.data().price ?? 0,
        stock: d.data().stock ?? 0,
        category: d.data().category ?? '',
        description: d.data().description,
        imageUrl: d.data().imageUrl,
      })) as InventoryProduct[];
      setInventoryProducts(items);
    } catch { /* non-fatal */ }
  }, [businessId]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImportSelect = (p: InventoryProduct) => {
    set('displayName', p.name);
    set('price', String(p.price));
    set('stock', String(p.stock));
    set('category', p.category);
    if (p.description) set('description', p.description);
    if (p.imageUrl) { set('imageUrl', p.imageUrl); setImagePreview(p.imageUrl); }
    setShowImport(false);
  };

  const handleGenerateDesc = useCallback(async () => {
    if (!form.displayName) return;
    setGeneratingDesc(true);
    try {
      const res = await fetch('/api/sell/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Write a short, compelling product description (2–3 sentences) for: "${form.displayName}" in the "${form.category || 'general'}" category. No bullet points. Speak directly to a customer.`,
          businessId,
          conversationHistory: [],
        }),
      });
      const data = await res.json() as { answer: string };
      if (data.answer) set('description', data.answer.trim());
    } catch { /* non-fatal */ }
    finally { setGeneratingDesc(false); }
  }, [form.displayName, form.category, businessId, set]);

  const handleSave = useCallback(async () => {
    if (!form.displayName.trim()) return;
    if (!form.price || parseFloat(form.price) <= 0) return;
    setSaving(true);
    try {
      const { firestore } = initializeFirebase();
      let finalImageUrl = form.imageUrl;

      if (imageFile) {
        const { storage } = initializeFirebase();
        const imgRef = storageRef(storage, `storeProducts/${businessId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imgRef, imageFile);
        finalImageUrl = await getDownloadURL(imgRef);
      }

      const payload = {
        productType: form.productType,
        displayName: form.displayName.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        images: finalImageUrl ? [finalImageUrl] : [],
        category: form.category,
        collectionIds: product?.collectionIds ?? [],
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        stock: parseInt(form.stock) || 0,
        sku: form.sku.trim() || null,
        available: form.available,
        featured: form.featured,
        digitalFileUrl: form.productType === 'digital' ? form.digitalFileUrl.trim() || null : null,
        deliveryNote: form.productType === 'service' ? form.deliveryNote.trim() || null : null,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        updatedAt: serverTimestamp(),
      };

      const colRef = collection(firestore, 'businesses', businessId, 'storeProducts');
      if (product) {
        await updateDoc(doc(colRef, product.id), payload);
      } else {
        await addDoc(colRef, { ...payload, productId: '', createdAt: serverTimestamp() });
      }
      onSaved();
    } catch (err) {
      console.error('[ProductSlideOver] Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [form, imageFile, product, businessId, onSaved]);

  return (
    <>
      {showImport && (
        <InventoryImportModal
          products={inventoryProducts}
          onSelect={handleImportSelect}
          onClose={() => setShowImport(false)}
          currency={currency}
        />
      )}

      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.slideover}>
        {/* Header */}
        <div className={styles.slideoverHeader}>
          <div>
            <p className={styles.slideoverTitle}>{product ? 'Edit Product' : 'Add Product'}</p>
            <p className={styles.slideoverSub}>
              {product ? `Editing ${product.displayName}` : 'Add a product to your store catalog'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.slideoverBody}>

          {/* Import from inventory */}
          {!product && (
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              style={{ alignSelf: 'flex-start' }}
              onClick={() => { loadInventory(); setShowImport(true); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/>
              </svg>
              Import from Busmo inventory
            </button>
          )}

          {/* Section: Product type */}
          <div className={styles.formSection}>
            <p className={styles.formSectionLabel}>Product type</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['physical', 'digital', 'service'] as ProductType[]).map(type => (
                <button
                  key={type}
                  onClick={() => set('productType', type)}
                  className={`${styles.btn} ${form.productType === type ? styles.btnPrimary : styles.btnGhost}`}
                  style={{ flex: 1, justifyContent: 'center', padding: '7px 8px', fontSize: '0.8rem' }}
                >
                  {type === 'physical' ? '📦' : type === 'digital' ? '💾' : '⚙️'}&nbsp;
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Basic info */}
          <div className={styles.formSection}>
            <p className={styles.formSectionLabel}>Basic information</p>

            <div className={styles.formRow}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Product name *</label>
                <input
                  className={styles.formInput}
                  placeholder="e.g. Premium Ribbed Polo"
                  value={form.displayName}
                  onChange={e => set('displayName', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select className={styles.formSelect} value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SKU</label>
                <input className={styles.formInput} placeholder="Auto-generated if blank" value={form.sku} onChange={e => set('sku', e.target.value)} />
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className={styles.formLabel}>Description</label>
                <button
                  className={styles.moBtn}
                  onClick={handleGenerateDesc}
                  disabled={generatingDesc || !form.displayName}
                  title={!form.displayName ? 'Enter a product name first' : 'Ask MO to write description'}
                >
                  {generatingDesc ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
                  )}
                  {generatingDesc ? 'Writing…' : 'Write with MO'}
                </button>
              </div>
              <textarea
                className={styles.formTextarea}
                placeholder="Describe the product — materials, key features, who it's for…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tags (comma-separated)</label>
              <input className={styles.formInput} placeholder="e.g. new, sale, summer" value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
          </div>

          {/* Section: Pricing */}
          <div className={styles.formSection}>
            <p className={styles.formSectionLabel}>Pricing & stock</p>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Price *</label>
                <div className={styles.priceWrap}>
                  <span className={styles.pricePrefix}>{currency === 'NGN' ? '₦' : '$'}</span>
                  <input
                    className={`${styles.formInput} ${styles.priceInput}`}
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Compare-at price</label>
                <div className={styles.priceWrap}>
                  <span className={styles.pricePrefix}>{currency === 'NGN' ? '₦' : '$'}</span>
                  <input
                    className={`${styles.formInput} ${styles.priceInput}`}
                    type="number" min="0" step="0.01"
                    placeholder="Original / crossed-out"
                    value={form.compareAtPrice}
                    onChange={e => set('compareAtPrice', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {discount !== null && (
              <div className={styles.marginRow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Showing <strong>{discount}% off</strong> discount badge on storefront
              </div>
            )}

            {form.productType === 'physical' && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock quantity</label>
                  <input className={styles.formInput} type="number" min="0" placeholder="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Low stock alert at</label>
                  <input className={styles.formInput} type="number" min="0" placeholder="5" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)} />
                  <p className={styles.formHint}>MO alerts you when stock hits this number</p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Type-specific fields */}
          {form.productType === 'digital' && (
            <div className={styles.formSection}>
              <p className={styles.formSectionLabel}>Digital product</p>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Download URL</label>
                <input className={styles.formInput} placeholder="https://…" value={form.digitalFileUrl} onChange={e => set('digitalFileUrl', e.target.value)} />
                <p className={styles.formHint}>Customers receive this link after purchase</p>
              </div>
            </div>
          )}

          {form.productType === 'service' && (
            <div className={styles.formSection}>
              <p className={styles.formSectionLabel}>Service details</p>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Delivery note</label>
                <textarea className={styles.formTextarea} placeholder="How will this service be delivered? e.g. 'We'll contact you within 24 hours to schedule.'" value={form.deliveryNote} onChange={e => set('deliveryNote', e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {/* Section: Image */}
          <div className={styles.formSection}>
            <p className={styles.formSectionLabel}>Product image</p>
            {imagePreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={styles.imagePreviewWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                  <button
                    className={styles.imageRemoveBtn}
                    onClick={() => { setImagePreview(''); setImageFile(null); set('imageUrl', ''); }}
                  >✕</button>
                </div>
                <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: '0.78rem' }} onClick={() => fileInputRef.current?.click()}>
                  Replace image
                </button>
              </div>
            ) : (
              <div className={styles.imageUploadArea} onClick={() => fileInputRef.current?.click()}>
                <label className={styles.imageUploadLabel}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Click to upload</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>PNG, JPG, WebP · max 5MB</span>
                </label>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleImageChange} />
          </div>

          {/* Section: Visibility */}
          <div className={styles.formSection}>
            <p className={styles.formSectionLabel}>Visibility</p>
            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Available in store</p>
                <p className={styles.toggleSub}>Customers can see and buy this product</p>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} />
                <span className={styles.toggleTrack} />
                <span className={styles.toggleThumb} />
              </label>
            </div>
            <div className={styles.toggleRow} style={{ marginTop: 10 }}>
              <div>
                <p className={styles.toggleLabel}>Featured product</p>
                <p className={styles.toggleSub}>Shown in the featured section on your homepage</p>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
                <span className={styles.toggleTrack} />
                <span className={styles.toggleThumb} />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.slideoverFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSave}
            disabled={saving || !form.displayName.trim() || !form.price}
          >
            {saving ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {product ? 'Save changes' : 'Add product'}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export function SellProductsPage() {
  const { user, storeConfig, showToast, refreshQuickStats } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [products, setProducts]         = useState<StoreProduct[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState<'all' | ProductType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'hidden'>('all');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [slideOver, setSlideOver]       = useState<'add' | StoreProduct | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [bulkBusy, setBulkBusy]         = useState(false);

  // ── Load products ─────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const snap = await getDocs(
        collection(firestore, 'businesses', user.businessId, 'storeProducts')
      );
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      })) as StoreProduct[];
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setProducts(items);
    } catch (err) {
      console.error('[SellProductsPage] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ── Filtered products ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search ||
        p.displayName.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchType   = typeFilter === 'all' || p.productType === typeFilter;
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'available' && p.available) ||
        (statusFilter === 'hidden' && !p.available);
      return matchSearch && matchType && matchStatus;
    });
  }, [products, search, typeFilter, statusFilter]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  };

  // ── Toggle availability ───────────────────────────────────────────────────
  const handleToggle = useCallback(async (product: StoreProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      await updateDoc(
        doc(collection(firestore, 'businesses', user.businessId, 'storeProducts'), product.id),
        { available: !product.available, updatedAt: serverTimestamp() }
      );
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, available: !p.available } : p));
      showToast(product.available ? 'Product hidden from store' : 'Product now visible', 'success');
    } catch {
      showToast('Failed to update product', 'error');
    }
  }, [user?.businessId, showToast]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (product: StoreProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remove "${product.displayName}" from your store?`)) return;
    setDeleting(product.id);
    try {
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(collection(firestore, 'businesses', user!.businessId, 'storeProducts'), product.id));
      setProducts(prev => prev.filter(p => p.id !== product.id));
      showToast('Product removed', 'info');
      refreshQuickStats();
    } catch {
      showToast('Failed to remove product', 'error');
    } finally {
      setDeleting(null);
    }
  }, [user, showToast, refreshQuickStats]);

  // ── Bulk toggle ───────────────────────────────────────────────────────────
  const handleBulkToggle = useCallback(async (available: boolean) => {
    if (!user?.businessId || selected.size === 0) return;
    setBulkBusy(true);
    try {
      const { firestore } = initializeFirebase();
      await Promise.all([...selected].map(id =>
        updateDoc(
          doc(collection(firestore, 'businesses', user.businessId, 'storeProducts'), id),
          { available, updatedAt: serverTimestamp() }
        )
      ));
      setProducts(prev => prev.map(p => selected.has(p.id) ? { ...p, available } : p));
      setSelected(new Set());
      showToast(`${selected.size} products ${available ? 'made visible' : 'hidden'}`, 'success');
    } catch {
      showToast('Bulk update failed', 'error');
    } finally {
      setBulkBusy(false);
    }
  }, [user?.businessId, selected, showToast]);

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const handleBulkDelete = useCallback(async () => {
    if (!user?.businessId || selected.size === 0) return;
    if (!confirm(`Remove ${selected.size} products from your store?`)) return;
    setBulkBusy(true);
    try {
      const { firestore } = initializeFirebase();
      await Promise.all([...selected].map(id =>
        deleteDoc(doc(collection(firestore, 'businesses', user.businessId, 'storeProducts'), id))
      ));
      setProducts(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
      showToast(`${selected.size} products removed`, 'info');
      refreshQuickStats();
    } catch {
      showToast('Bulk delete failed', 'error');
    } finally {
      setBulkBusy(false);
    }
  }, [user?.businessId, selected, showToast, refreshQuickStats]);

  const onSaved = useCallback(async () => {
    setSlideOver(null);
    await loadProducts();
    refreshQuickStats();
    showToast('Product saved', 'success');
  }, [loadProducts, refreshQuickStats, showToast]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.heading}>Products</h2>
            <p className={styles.sub}>Manage what's available in your online store.</p>
          </div>
          <div className={styles.headerRight}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSlideOver('add')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add product
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className={styles.searchInput}
              placeholder="Search products, SKU, tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select className={styles.filterSelect} value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}>
            <option value="all">All types</option>
            <option value="physical">Physical</option>
            <option value="digital">Digital</option>
            <option value="service">Service</option>
          </select>

          <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All status</option>
            <option value="available">Available</option>
            <option value="hidden">Hidden</option>
          </select>

          <div className={styles.toolbarRight}>
            {!loading && (
              <span className={styles.countPill}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>{selected.size} selected</span>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => handleBulkToggle(true)} disabled={bulkBusy} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Show all
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleBulkToggle(false)} disabled={bulkBusy} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Hide all
            </button>
            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleBulkDelete} disabled={bulkBusy} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Delete
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setSelected(new Set())} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.empty}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Loading products…
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🛍️</div>
              <p className={styles.emptyTitle}>{products.length === 0 ? 'No products yet' : 'No results'}</p>
              <p className={styles.emptySub}>
                {products.length === 0
                  ? 'Add your first product or import from your Busmo inventory.'
                  : 'Try a different search or filter.'}
              </p>
              {products.length === 0 && (
                <div className={styles.emptyActions}>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSlideOver('add')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add product
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const discount = p.compareAtPrice && p.compareAtPrice > p.price
                    ? Math.round((1 - p.price / p.compareAtPrice) * 100)
                    : null;
                  const stockClass = p.stock === 0 ? styles.stockZero : p.stock <= p.lowStockThreshold ? styles.stockLow : styles.stockOk;

                  return (
                    <tr
                      key={p.id}
                      className={selected.has(p.id) ? styles.rowSelected : ''}
                      onClick={() => setSlideOver(p)}
                    >
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className={styles.checkbox} checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                      </td>
                      <td>
                        <div className={styles.productCell}>
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt={p.displayName} className={styles.productImg} />
                          ) : (
                            <div className={styles.productImgPlaceholder}>{emoji(p.category)}</div>
                          )}
                          <div>
                            <p className={styles.productName}>
                              {p.featured && <span className={styles.featuredStar}>★ </span>}
                              {p.displayName}
                            </p>
                            <p className={styles.productCategory}>{p.category || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.typeBadge} ${
                          p.productType === 'physical' ? styles.typePhysical :
                          p.productType === 'digital'  ? styles.typeDigital  : styles.typeService
                        }`}>
                          {p.productType === 'physical' ? '📦' : p.productType === 'digital' ? '💾' : '⚙️'}
                          &nbsp;{p.productType}
                        </span>
                      </td>
                      <td>
                        <span className={styles.price}>{fmt(p.price, currency)}</span>
                        {p.compareAtPrice && (
                          <span className={styles.comparePrice}>{fmt(p.compareAtPrice, currency)}</span>
                        )}
                        {discount && <span className={styles.discountBadge}>-{discount}%</span>}
                      </td>
                      <td>
                        {p.productType === 'physical' ? (
                          <span className={`${styles.stockBadge} ${stockClass}`}>
                            {p.stock === 0 ? 'Out of stock' : p.stock <= p.lowStockThreshold ? `⚠ ${p.stock} left` : p.stock}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--sell-text-3)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className={`${styles.statusToggle} ${p.available ? styles.statusActive : styles.statusHidden}`}
                          onClick={e => handleToggle(p, e)}
                          title={p.available ? 'Click to hide' : 'Click to show'}
                        >
                          <span className={styles.statusDot} />
                          {p.available ? 'Live' : 'Hidden'}
                        </button>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className={styles.rowActions}>
                          <button className={styles.iconBtn} onClick={() => setSlideOver(p)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={e => handleDelete(p, e)}
                            disabled={deleting === p.id}
                            title="Remove from store"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-over */}
      {slideOver !== null && user?.businessId && (
        <ProductSlideOver
          product={slideOver === 'add' ? null : slideOver}
          onClose={() => setSlideOver(null)}
          onSaved={onSaved}
          businessId={user.businessId}
          currency={currency}
          storeSlug={storeConfig?.storeSlug ?? ''}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
