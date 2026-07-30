'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, ChangeEvent } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import { EbookPreviewModal } from '@/app/store/components/EbookPreviewModal';
import { ContentIdeasModal } from '../components/ContentIdeasModal';
import styles from './SellProductsPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductType = 'physical' | 'digital' | 'service';

type DigitalSubtype = 'ebook' | 'course' | 'template' | 'ticket' | 'coaching';

interface StoreProduct {
  id: string;
  productId: string;
  productType: ProductType;
  digitalSubtype: DigitalSubtype | null;
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
  digitalFileName: string | null;
  deliveryNote: string | null;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
  // Ebook specific
  pageCount: number | null;
  author: string | null;
  isbn: string | null;
  // Course specific
  courseDuration: string | null;
  lessonCount: number | null;
  accessDuration: string | null;
  difficultyLevel: string | null;
  // Template specific
  fileFormat: string | null;
  compatibleSoftware: string | null;
  licenseType: string | null;
  // Ticket specific
  eventDate: string | null;
  eventTime: string | null;
  venue: string | null;
  ticketType: string | null;
  capacity: number | null;
  // Coaching specific
  sessionType: string | null;
  sessionDuration: number | null;
  sessionFormat: string | null;
  numberOfSessions: number | null;
  coachingDeliverable: string | null;
  // Service slot config
  slotDuration: number | null;
  bufferTime: number | null;
  // Multiple digital files
  digitalFiles?: Array<{ url: string; name: string }>;
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
  digitalSubtype: DigitalSubtype;
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
  digitalFileName: string;
  deliveryNote: string;
  imageUrl: string;
  // Ebook specific
  pageCount: string;
  author: string;
  isbn: string;
  // Course specific
  courseDuration: string;
  lessonCount: string;
  accessDuration: string;
  difficultyLevel: string;
  // Template specific
  fileFormat: string;
  compatibleSoftware: string;
  licenseType: string;
  // Ticket specific
  eventDate: string;
  eventTime: string;
  venue: string;
  ticketType: string;
  capacity: string;
  // Coaching specific
  sessionType: string;
  sessionDuration: string;
  sessionFormat: string;
  numberOfSessions: string;
  coachingDeliverable: string;
  // Service slot config
  slotDuration: string;
  bufferTime: string;
};

const EMPTY_FORM: FormData = {
  productType: 'physical', digitalSubtype: 'ebook', displayName: '', description: '',
  price: '', compareAtPrice: '', category: '', tags: '',
  stock: '', sku: '', lowStockThreshold: '5',
  available: true, featured: false,
  digitalFileUrl: '', digitalFileName: '', deliveryNote: '', imageUrl: '',
  pageCount: '', author: '', isbn: '',
  courseDuration: '', lessonCount: '', accessDuration: 'lifetime', difficultyLevel: '',
  fileFormat: '', compatibleSoftware: '', licenseType: '',
  eventDate: '', eventTime: '', venue: '', ticketType: 'general', capacity: '',
  sessionType: '', sessionDuration: '', sessionFormat: '', numberOfSessions: '', coachingDeliverable: '',
  slotDuration: '60', bufferTime: '15',
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
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

function ProductSlideOver({ product, onClose, onSaved, businessId, currency, storeSlug, showToast }: SlideOverProps) {
  const [form, setForm] = useState<FormData>(() => {
    if (!product) return { ...EMPTY_FORM };
    return {
      productType: product.productType,
      digitalSubtype: product.digitalSubtype ?? 'ebook',
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
      digitalFileName: product.digitalFileName ?? '',
      deliveryNote: product.deliveryNote ?? '',
      imageUrl: product.images[0] ?? '',
      // Ebook specific
      pageCount: product.pageCount ? String(product.pageCount) : '',
      author: product.author ?? '',
      isbn: product.isbn ?? '',
      // Course specific
      courseDuration: product.courseDuration ?? '',
      lessonCount: product.lessonCount ? String(product.lessonCount) : '',
      accessDuration: product.accessDuration ?? 'lifetime',
      difficultyLevel: product.difficultyLevel ?? '',
      // Template specific
      fileFormat: product.fileFormat ?? '',
      compatibleSoftware: product.compatibleSoftware ?? '',
      licenseType: product.licenseType ?? '',
      // Ticket specific
      eventDate: product.eventDate ?? '',
      eventTime: product.eventTime ?? '',
      venue: product.venue ?? '',
      ticketType: product.ticketType ?? 'general',
      capacity: product.capacity ? String(product.capacity) : '',
      sessionType: product.sessionType ?? '',
      sessionDuration: product.sessionDuration ? String(product.sessionDuration) : '',
      sessionFormat: product.sessionFormat ?? '',
      numberOfSessions: product.numberOfSessions ? String(product.numberOfSessions) : '',
      coachingDeliverable: product.coachingDeliverable ?? '',
      slotDuration: product.slotDuration ? String(product.slotDuration) : '60',
      bufferTime: product.bufferTime != null ? String(product.bufferTime) : '15',
    };
  });

  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [showMoPopover, setShowMoPopover] = useState(false);
  const [moPrompt, setMoPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(form.imageUrl);
  const [showImport, setShowImport] = useState(false);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [digitalFiles, setDigitalFiles] = useState<File[]>([]);
  const [uploadingDigital, setUploadingDigital] = useState(false);
  const [showEbookPreview, setShowEbookPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const digitalFileInputRef = useRef<HTMLInputElement>(null);
  const moPopoverRef = useRef<HTMLDivElement>(null);

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
        collection(firestore, 'businesses', businessId, 'storeProducts')
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

  const handleDigitalFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setDigitalFiles(prev => [...prev, ...files]);
    set('digitalFileName', files.map(f => f.name).join(', '));
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

  // Close MO popover on outside click
  useEffect(() => {
    if (!showMoPopover) return;
    const handleClick = (e: MouseEvent) => {
      if (moPopoverRef.current && !moPopoverRef.current.contains(e.target as Node)) {
        setShowMoPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoPopover]);

  const handleMoAssist = useCallback(async (instruction: string) => {
    if (!instruction.trim()) return;
    setGeneratingDesc(true);
    setShowMoPopover(false);
    try {
      const contextParts: string[] = [];
      if (form.displayName) contextParts.push(`Current product name: "${form.displayName}"`);
      if (form.category) contextParts.push(`Current category: "${form.category}"`);
      if (form.price) contextParts.push(`Current price: ₦${form.price}`);
      if (form.productType) contextParts.push(`Product type: ${form.productType}`);
      if (form.digitalSubtype) contextParts.push(`Digital subtype: ${form.digitalSubtype}`);

      const res = await fetch('/api/sell/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate product details. ${instruction}\n\nReturn ONLY a JSON object (no markdown, no code fences, no other text) with these fields:\n{"displayName":"...","description":"2-3 sentence compelling product description","price":number,"category":"one of: Fashion & Clothing, Beauty & Personal Care, Food & Groceries, Electronics, Home & Kitchen, Health & Wellness, Sports & Fitness, Art & Crafts, Services, Other, digital","tags":["tag1","tag2","tag3"]}${form.productType === 'digital' && form.digitalSubtype === 'ebook' ? '\nAlso include "author":"..." and "pageCount":number if relevant.' : ''}${form.productType === 'digital' && form.digitalSubtype === 'course' ? '\nAlso include "courseDuration":"...","lessonCount":number,"difficultyLevel":"..." if relevant.' : ''}${form.productType === 'digital' && form.digitalSubtype === 'template' ? '\nAlso include "fileFormat":"...","compatibleSoftware":"..." if relevant.' : ''}${form.productType === 'digital' && form.digitalSubtype === 'ticket' ? '\nAlso include "eventDate":"...","venue":"..." if relevant.' : ''}${form.productType === 'digital' && form.digitalSubtype === 'coaching' ? '\nAlso include "sessionType":"one-on-one/group","sessionDuration":number,"sessionFormat":"video/phone/in-person","numberOfSessions":number if relevant.' : ''}\n\nContext: ${contextParts.length > 0 ? contextParts.join('. ') : 'New product, no details yet.'}`,
          businessId,
          conversationHistory: [],
        }),
      });
      const data = await res.json() as { answer?: string };
      if (!data.answer) return;

      // Extract JSON from the answer - try plain JSON first, then code-fenced
      let parsed: Record<string, unknown> | null = null;
      const fencedMatch = data.answer.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fencedMatch) {
        try { parsed = JSON.parse(fencedMatch[1].trim()); } catch { /* ignore */ }
      }
      if (!parsed) {
        const jsonMatch = data.answer.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
        }
      }
      if (!parsed) {
        showToast('MO could not parse the response. Try again.', 'error');
        return;
      }

      if (parsed.displayName) set('displayName', String(parsed.displayName));
      if (parsed.description) set('description', String(parsed.description));
      if (parsed.price) set('price', String(parsed.price));
      if (parsed.category) set('category', String(parsed.category));
      if (parsed.tags && Array.isArray(parsed.tags)) set('tags', parsed.tags.join(', '));
      // Digital subtype specific fields
      if (parsed.author) set('author', String(parsed.author));
      if (parsed.pageCount) set('pageCount', String(parsed.pageCount));
      if (parsed.courseDuration) set('courseDuration', String(parsed.courseDuration));
      if (parsed.lessonCount) set('lessonCount', String(parsed.lessonCount));
      if (parsed.difficultyLevel) set('difficultyLevel', String(parsed.difficultyLevel));
      if (parsed.fileFormat) set('fileFormat', String(parsed.fileFormat));
      if (parsed.compatibleSoftware) set('compatibleSoftware', String(parsed.compatibleSoftware));
      if (parsed.eventDate) set('eventDate', String(parsed.eventDate));
      if (parsed.venue) set('venue', String(parsed.venue));
      showToast('MO filled in the product details', 'success');
    } catch {
      showToast('MO could not generate details. Try again.', 'error');
    } finally {
      setGeneratingDesc(false);
      setMoPrompt('');
    }
  }, [form.displayName, form.category, form.price, form.productType, form.digitalSubtype, businessId, set, showToast]);

  const handleSave = useCallback(async () => {
    if (!form.displayName.trim()) {
      showToast('Please enter a product name', 'error');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      showToast('Please enter a valid price', 'error');
      return;
    }
    if (form.productType === 'digital' && !form.digitalFileUrl && digitalFiles.length === 0) {
      showToast('Please upload a file or provide a download URL for digital products', 'error');
      return;
    }
    setSaving(true);
    try {
      const { firestore, storage } = initializeFirebase();
      let finalImageUrl = form.imageUrl;
      let finalDigitalFileUrl = form.digitalFileUrl;
      let finalDigitalFileName = form.digitalFileName;

      // Upload product image
      if (imageFile) {
        const imgRef = storageRef(storage, `storeProducts/${businessId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imgRef, imageFile);
        finalImageUrl = await getDownloadURL(imgRef);
      }

      const uploadedDigitalFiles: Array<{ url: string; name: string }> = [];
      if (digitalFiles.length > 0) {
        setUploadingDigital(true);
        for (let i = 0; i < digitalFiles.length; i++) {
          const df = digitalFiles[i];
          const digitalRef = storageRef(storage, `digitalProducts/${businessId}/${Date.now()}_${i}_${df.name}`);
          await uploadBytes(digitalRef, df);
          const url = await getDownloadURL(digitalRef);
          uploadedDigitalFiles.push({ url, name: df.name });
        }
        if (uploadedDigitalFiles.length > 0) {
          finalDigitalFileUrl = uploadedDigitalFiles[0].url;
          finalDigitalFileName = uploadedDigitalFiles[0].name;
        }
        setUploadingDigital(false);
      } else if (form.digitalFileUrl && form.digitalFileName) {
        uploadedDigitalFiles.push({ url: form.digitalFileUrl, name: form.digitalFileName });
      }

      const payload: Record<string, unknown> = {
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
        digitalFileUrl: form.productType === 'digital' ? finalDigitalFileUrl || null : null,
        digitalFileName: form.productType === 'digital' ? finalDigitalFileName || null : null,
        digitalFiles: form.productType === 'digital' && uploadedDigitalFiles.length > 0 ? uploadedDigitalFiles : null,
        deliveryNote: form.productType === 'service' ? form.deliveryNote.trim() || null : null,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        updatedAt: serverTimestamp(),
      };

      // Add digital subtype and specific fields
      if (form.productType === 'digital') {
        payload.digitalSubtype = form.digitalSubtype;
        
        // Ebook specific
        if (form.digitalSubtype === 'ebook') {
          payload.pageCount = form.pageCount ? parseInt(form.pageCount) : null;
          payload.author = form.author.trim() || null;
          payload.isbn = form.isbn.trim() || null;
        }
        
        // Course specific
        if (form.digitalSubtype === 'course') {
          payload.courseDuration = form.courseDuration.trim() || null;
          payload.lessonCount = form.lessonCount ? parseInt(form.lessonCount) : null;
          payload.accessDuration = form.accessDuration || null;
          payload.difficultyLevel = form.difficultyLevel.trim() || null;
        }
        
        // Template specific
        if (form.digitalSubtype === 'template') {
          payload.fileFormat = form.fileFormat.trim() || null;
          payload.compatibleSoftware = form.compatibleSoftware.trim() || null;
          payload.licenseType = form.licenseType.trim() || null;
        }
        
        // Ticket specific
        if (form.digitalSubtype === 'ticket') {
          payload.eventDate = form.eventDate || null;
          payload.eventTime = form.eventTime || null;
          payload.venue = form.venue.trim() || null;
          payload.ticketType = form.ticketType || null;
          payload.capacity = form.capacity ? parseInt(form.capacity) : null;
        }
        
        // Coaching specific
        if (form.digitalSubtype === 'coaching') {
          payload.sessionType = form.sessionType.trim() || null;
          payload.sessionDuration = form.sessionDuration ? parseInt(form.sessionDuration) : null;
          payload.sessionFormat = form.sessionFormat.trim() || null;
          payload.numberOfSessions = form.numberOfSessions ? parseInt(form.numberOfSessions) : null;
          payload.coachingDeliverable = form.coachingDeliverable.trim() || null;
        }
      }
      
      // Service slot config
      if (form.productType === 'service') {
        payload.slotDuration = parseInt(form.slotDuration) || 60;
        payload.bufferTime = parseInt(form.bufferTime) || 15;
      }

      const colRef = collection(firestore, 'businesses', businessId, 'storeProducts');
      if (product) {
        await updateDoc(doc(colRef, product.id), payload);
        showToast('Product updated successfully', 'success');
      } else {
        const newDocRef = await addDoc(colRef, { ...payload, createdAt: serverTimestamp() });
        await updateDoc(newDocRef, { productId: newDocRef.id });
        showToast('Product added successfully', 'success');
      }
      onSaved();
    } catch (err) {
      console.error('[ProductSlideOver] Save error:', err);
      showToast('Failed to save product. Please try again.', 'error');
    } finally {
      setSaving(false);
      setUploadingDigital(false);
    }
  }, [form, imageFile, digitalFiles, product, businessId, onSaved, showToast]);

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
              {form.productType !== 'digital' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select className={styles.formSelect} value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.formGroup} style={form.productType === 'digital' ? { flex: 1 } : undefined}>
                <label className={styles.formLabel}>SKU</label>
                <input className={styles.formInput} placeholder="Auto-generated if blank" value={form.sku} onChange={e => set('sku', e.target.value)} />
              </div>
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className={styles.formLabel}>Description</label>
                <div style={{ position: 'relative' }} ref={moPopoverRef}>
                  <button
                    className={styles.moBtn}
                    onClick={() => { if (!generatingDesc) setShowMoPopover(prev => !prev); }}
                    disabled={generatingDesc}
                    title="Ask MO to create product details"
                  >
                    {generatingDesc ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74z" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {generatingDesc ? 'Writing…' : 'Create with MO'}
                  </button>
                  {showMoPopover && !generatingDesc && (
                    <div className={styles.moPopover}>
                      <p className={styles.moPopoverTitle}>What should MO help with?</p>
                      <div className={styles.moPopoverChips}>
                        <button className={styles.moChip} onClick={() => handleMoAssist('Fill in all product details — name, description, price, category, and tags based on what this product is about.')}>Fill in everything</button>
                        <button className={styles.moChip} onClick={() => handleMoAssist('Write a short, compelling product description (2-3 sentences). Speak directly to the customer. No bullet points.')}>Write description</button>
                        <button className={styles.moChip} onClick={() => handleMoAssist('Suggest a competitive price for this product. Return the price as a number.')}>Suggest price</button>
                        <button className={styles.moChip} onClick={() => handleMoAssist('Suggest the best category and 3-5 relevant tags for this product.')}>Category & tags</button>
                      </div>
                      <div className={styles.moPopoverInputRow}>
                        <input
                          className={styles.moPopoverInput}
                          placeholder="Or type your own instruction..."
                          value={moPrompt}
                          onChange={e => setMoPrompt(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && moPrompt.trim()) handleMoAssist(moPrompt); }}
                        />
                        <button
                          className={styles.moPopoverGo}
                          onClick={() => { if (moPrompt.trim()) handleMoAssist(moPrompt); }}
                          disabled={!moPrompt.trim()}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
              
              {/* Digital subtype selector */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Digital product type</label>
                <select className={styles.formSelect} value={form.digitalSubtype} onChange={e => set('digitalSubtype', e.target.value as DigitalSubtype)}>
                  <option value="ebook">📚 E-book / PDF</option>
                  <option value="course">🎓 Online Course</option>
                  <option value="template">📄 Template</option>
                  <option value="ticket">🎫 Event Ticket</option>
                  <option value="coaching">🎯 Coaching / Consultation</option>
                </select>
              </div>

              {/* File upload or URL */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Digital files</label>
                {form.digitalFileUrl || digitalFiles.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {digitalFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, padding: '8px 12px', background: 'var(--sell-bg)', borderRadius: 'var(--sell-radius-sm)', border: '1px solid var(--sell-border)' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--sell-text-1)' }}>{f.name}</span>
                        </div>
                        <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: '0.78rem' }} onClick={() => { setDigitalFiles(prev => prev.filter((_, j) => j !== i)); }}>
                          Remove
                        </button>
                      </div>
                    ))}
                    {form.digitalFileUrl && digitalFiles.length === 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, padding: '8px 12px', background: 'var(--sell-bg)', borderRadius: 'var(--sell-radius-sm)', border: '1px solid var(--sell-border)' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--sell-text-1)' }}>{form.digitalFileName || 'File uploaded'}</span>
                        </div>
                        <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: '0.78rem' }} onClick={() => { setDigitalFiles([]); set('digitalFileUrl', ''); set('digitalFileName', ''); }}>
                          Remove
                        </button>
                        {form.digitalFileUrl && (
                          <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: '0.78rem' }} onClick={() => setShowEbookPreview(true)}>
                            Preview
                          </button>
                        )}
                      </div>
                    )}
                    <div className={styles.imageUploadArea} onClick={() => digitalFileInputRef.current?.click()} style={{ padding: '12px', cursor: 'pointer', border: '1px dashed var(--sell-border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--sell-text-3)' }}>+ Add more files</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.imageUploadArea} onClick={() => digitalFileInputRef.current?.click()} style={{ padding: '16px' }}>
                      <label className={styles.imageUploadLabel}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>Upload files</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>PDF, ZIP, MP4, MP3, etc. · max 50MB each</span>
                      </label>
                    </div>
                    <input ref={digitalFileInputRef} type="file" accept=".pdf,.zip,.mp4,.mp3,.wav,.flac,.m4a,.doc,.docx,.ppt,.pptx" multiple style={{ display: 'none' }} onChange={handleDigitalFileChange} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--sell-text-3)' }}>or</span>
                      <input className={styles.formInput} placeholder="Paste download URL" value={form.digitalFileUrl} onChange={e => set('digitalFileUrl', e.target.value)} style={{ flex: 1 }} />
                    </div>
                  </>
                )}
                {uploadingDigital && (
                  <p className={styles.formHint} style={{ color: 'var(--sell-primary)' }}>Uploading files...</p>
                )}
              </div>

              {/* Ebook specific fields */}
              {form.digitalSubtype === 'ebook' && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Author</label>
                      <input className={styles.formInput} placeholder="Author name" value={form.author} onChange={e => set('author', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Page count</label>
                      <input className={styles.formInput} type="number" min="0" placeholder="e.g. 150" value={form.pageCount} onChange={e => set('pageCount', e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ISBN (optional)</label>
                    <input className={styles.formInput} placeholder="978-0-123456-78-9" value={form.isbn} onChange={e => set('isbn', e.target.value)} />
                  </div>
                </>
              )}

              {/* Course specific fields */}
              {form.digitalSubtype === 'course' && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Course duration</label>
                      <input className={styles.formInput} placeholder="e.g. 4 hours, 2 weeks" value={form.courseDuration} onChange={e => set('courseDuration', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Number of lessons</label>
                      <input className={styles.formInput} type="number" min="0" placeholder="e.g. 12" value={form.lessonCount} onChange={e => set('lessonCount', e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Access duration</label>
                      <select className={styles.formSelect} value={form.accessDuration} onChange={e => set('accessDuration', e.target.value)}>
                        <option value="lifetime">Lifetime access</option>
                        <option value="30days">30 days</option>
                        <option value="60days">60 days</option>
                        <option value="90days">90 days</option>
                        <option value="1year">1 year</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Difficulty level</label>
                      <select className={styles.formSelect} value={form.difficultyLevel} onChange={e => set('difficultyLevel', e.target.value)}>
                        <option value="">Select level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Template specific fields */}
              {form.digitalSubtype === 'template' && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>File format</label>
                      <select className={styles.formSelect} value={form.fileFormat} onChange={e => set('fileFormat', e.target.value)}>
                        <option value="">Select format</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">Word (DOCX)</option>
                        <option value="xlsx">Excel (XLSX)</option>
                        <option value="pptx">PowerPoint (PPTX)</option>
                        <option value="zip">ZIP Archive</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Compatible software</label>
                      <input className={styles.formInput} placeholder="e.g. Microsoft Word, Canva" value={form.compatibleSoftware} onChange={e => set('compatibleSoftware', e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>License type</label>
                    <select className={styles.formSelect} value={form.licenseType} onChange={e => set('licenseType', e.target.value)}>
                      <option value="">Select license</option>
                      <option value="personal">Personal use</option>
                      <option value="commercial">Commercial use</option>
                      <option value="resell">Resell rights</option>
                    </select>
                  </div>
                </>
              )}

              {/* Ticket specific fields */}
              {form.digitalSubtype === 'ticket' && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Event date</label>
                      <input className={styles.formInput} type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Event time</label>
                      <input className={styles.formInput} type="time" value={form.eventTime} onChange={e => set('eventTime', e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Venue / Location</label>
                    <input className={styles.formInput} placeholder="e.g. Lagos Convention Center" value={form.venue} onChange={e => set('venue', e.target.value)} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Ticket type</label>
                      <select className={styles.formSelect} value={form.ticketType} onChange={e => set('ticketType', e.target.value)}>
                        <option value="general">General Admission</option>
                        <option value="vip">VIP</option>
                        <option value="early_bird">Early Bird</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Capacity</label>
                      <input className={styles.formInput} type="number" min="0" placeholder="e.g. 500" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {/* Coaching specific fields */}
              {form.digitalSubtype === 'coaching' && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Session type</label>
                      <select className={styles.formSelect} value={form.sessionType} onChange={e => set('sessionType', e.target.value)}>
                        <option value="">Select type</option>
                        <option value="one-on-one">One-on-One</option>
                        <option value="group">Group Session</option>
                        <option value="both">Both Available</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Session duration (min)</label>
                      <input className={styles.formInput} type="number" min="0" placeholder="e.g. 60" value={form.sessionDuration} onChange={e => set('sessionDuration', e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Session format</label>
                      <select className={styles.formSelect} value={form.sessionFormat} onChange={e => set('sessionFormat', e.target.value)}>
                        <option value="">Select format</option>
                        <option value="video">Video Call</option>
                        <option value="phone">Phone Call</option>
                        <option value="in-person">In Person</option>
                        <option value="chat">Chat / Text</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Number of sessions</label>
                      <input className={styles.formInput} type="number" min="0" placeholder="e.g. 4" value={form.numberOfSessions} onChange={e => set('numberOfSessions', e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>What's included / Deliverable</label>
                    <textarea className={styles.formTextarea} placeholder="e.g. Personalized coaching plan, weekly check-ins, and progress tracking" value={form.coachingDeliverable} onChange={e => set('coachingDeliverable', e.target.value)} rows={3} />
                  </div>
                </>
              )}
            </div>
          )}

          {form.productType === 'service' && (
            <div className={styles.formSection}>
              <p className={styles.formSectionLabel}>Service details</p>
              
              {/* Delivery note */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Delivery note</label>
                <textarea className={styles.formTextarea} placeholder="How will this service be delivered? e.g. 'We'll contact you within 24 hours to schedule.'" value={form.deliveryNote} onChange={e => set('deliveryNote', e.target.value)} rows={3} />
              </div>

              {/* Booking slot configuration */}
              <div className={styles.formSection}>
                <p className={styles.formSectionLabel} style={{ borderTop: 'none', paddingTop: 0, marginBottom: 8 }}>Booking slot settings</p>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Slot duration (minutes)</label>
                    <select className={styles.formSelect} value={form.slotDuration} onChange={e => set('slotDuration', e.target.value)}>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">2 hours</option>
                    </select>
                    <p className={styles.formHint}>How long each appointment lasts</p>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Buffer time (minutes)</label>
                    <select className={styles.formSelect} value={form.bufferTime} onChange={e => set('bufferTime', e.target.value)}>
                      <option value="0">None</option>
                      <option value="5">5 min</option>
                      <option value="10">10 min</option>
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                    </select>
                    <p className={styles.formHint}>Gap between appointments</p>
                  </div>
                </div>
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

      {/* Ebook preview modal */}
      {form.digitalFileUrl && (
        <EbookPreviewModal
          open={showEbookPreview}
          onClose={() => setShowEbookPreview(false)}
          fileUrl={form.digitalFileUrl}
          title={form.displayName || 'Ebook Preview'}
          author={form.author || undefined}
          pageCount={form.pageCount ? Number(form.pageCount) : undefined}
        />
      )}
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
  const [contentForProduct, setContentForProduct] = useState<StoreProduct | null>(null);
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
  }, [loadProducts, refreshQuickStats]);

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
                          <button className={styles.iconBtn} onClick={() => setContentForProduct(p)} title="Content ideas">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.2L22 9.6l-5.6 4.8 1.6 7.6L12 17.6 6 22l1.6-7.6L2 9.6l7.6-.4L12 2z"/></svg>
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
          showToast={showToast}
        />
      )}

      {/* Content Ideas Modal */}
      {contentForProduct && (
        <ContentIdeasModal
          product={contentForProduct}
          onClose={() => setContentForProduct(null)}
          showToast={showToast}
          currency={currency}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
