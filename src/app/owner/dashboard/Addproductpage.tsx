'use client';

import React, { useState, useCallback } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import styles from './Addproductpage.module.css';

// ═══════════════════════════════════════════
//  AddProductPage — full product registration
//  Handles pricing, variants, sales modes,
//  delivery countries, expiry tracking
// ═══════════════════════════════════════════

interface AddProductPageProps {
  onClose?: () => void;
  onProductAdded?: (product: any) => void;
}

const AFRICAN_COUNTRIES = [
  { code: 'NG', flag: '🇳🇬', name: 'Nigeria',      default: true  },
  { code: 'GH', flag: '🇬🇭', name: 'Ghana',         default: true  },
  { code: 'KE', flag: '🇰🇪', name: 'Kenya',          default: true  },
  { code: 'ZA', flag: '🇿🇦', name: 'South Africa',   default: false },
  { code: 'ET', flag: '🇪🇹', name: 'Ethiopia',        default: false },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire",  default: false },
  { code: 'SN', flag: '🇸🇳', name: 'Senegal',         default: false },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroon',        default: false },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzania',        default: false },
  { code: 'UG', flag: '🇺🇬', name: 'Uganda',          default: false },
  { code: 'RW', flag: '🇷🇼', name: 'Rwanda',          default: false },
  { code: 'NE', flag: '🇳🇪', name: 'Niger',           default: false },
  { code: 'ML', flag: '🇲🇱', name: 'Mali',            default: false },
  { code: 'BJ', flag: '🇧🇯', name: 'Benin',           default: false },
  { code: 'TG', flag: '🇹🇬', name: 'Togo',            default: false },
  { code: 'ZM', flag: '🇿🇲', name: 'Zambia',          default: false },
  { code: 'ZW', flag: '🇿🇼', name: 'Zimbabwe',        default: false },
  { code: 'MZ', flag: '🇲🇿', name: 'Mozambique',      default: false },
];

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  description: string;
  sellPrice: string;
  costPrice: string;
  openingStock: string;
  lowStockAlert: string;
  unit: string;
  hasExpiry: boolean;
  expiryDate: string;
  hasVariants: boolean;
  variantType: string;
  variantValues: string;
  useDefaultDelivery: boolean;
  selectedCountries: string[];
  deliveryTime: string;
  shippingFeeOverride: string;
  manualSale: boolean;
  onlineStore: boolean;
}

const today = new Date().toISOString().split('T')[0];

function expiryIsSoon(date: string): boolean {
  if (!date) return false;
  const exp = new Date(date);
  const soon = new Date();
  soon.setDate(soon.getDate() + 90);
  return exp <= soon;
}

export function AddProductPage({ onClose, onProductAdded }: AddProductPageProps) {
  const { showToast } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currencySymbol } = useCurrency();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const [form, setForm] = useState<ProductForm>({
    name: '', sku: '', category: '', description: '',
    sellPrice: '', costPrice: '', openingStock: '', lowStockAlert: '5',
    unit: 'piece', hasExpiry: false, expiryDate: '', hasVariants: false,
    variantType: 'Size', variantValues: '',
    useDefaultDelivery: true,
    selectedCountries: AFRICAN_COUNTRIES.filter(c => c.default).map(c => c.code),
    deliveryTime: 'Same as store default (3–5 days)',
    shippingFeeOverride: '', manualSale: true, onlineStore: true,
  });

  const [variantChips, setVariantChips] = useState<string[]>([]);

  // Coming Soon Modal
  const ComingSoonModal = () => (
    <div className={styles.modalOverlay} onClick={() => setShowComingSoon(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalIcon}>🚧</div>
        <h3>Coming Soon</h3>
        <p>Online storefronts are currently under development. You'll be able to:</p>
        <ul className={styles.modalList}>
          <li>✅ Get a professional online storefront</li>
          <li>✅ Accept payments with BusmoPay</li>
          <li>✅ Use custom domains (Standard+ plans)</li>
          <li>✅ Track sales analytics</li>
        </ul>
        <p>Stay tuned for updates!</p>
        <button className={styles.modalBtn} onClick={() => setShowComingSoon(false)}>Got it</button>
      </div>
    </div>
  );

  const set = useCallback((key: keyof ProductForm, val: ProductForm[keyof ProductForm]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const margin = (() => {
    const sell = parseFloat(form.sellPrice || '0');
    const cost = parseFloat(form.costPrice || '0');
    if (sell > 0 && cost > 0 && sell > cost) {
      const profit = sell - cost;
      const pct = ((profit / sell) * 100).toFixed(1);
      return { profit: profit.toLocaleString(), pct };
    }
    return null;
  })();

  function toggleCountry(code: string) {
    set('selectedCountries',
      form.selectedCountries.includes(code)
        ? form.selectedCountries.filter(c => c !== code)
        : [...form.selectedCountries, code]
    );
  }

  function generateChips() {
    setVariantChips(form.variantValues.split(',').map(v => v.trim()).filter(Boolean));
  }

  async function handleSave(draft = false) {
    if (!form.name.trim()) {
      showToast('⚠️ Please enter a product name');
      return;
    }
    
    if (!form.sellPrice || parseFloat(form.sellPrice) <= 0) {
      showToast('⚠️ Please enter a valid selling price');
      return;
    }

    if (!firestore) {
      showToast('⚠️ Database not connected');
      return;
    }

    setIsLoading(true);
    try {
      // Get business ID from user context
      const businessId = 'default_business'; // TODO: Get from auth context
      
      const productData = {
        name: form.name.trim(),
        description: form.description,
        category: form.category,
        price: parseFloat(form.sellPrice),
        cost: parseFloat(form.costPrice) || 0, // Use 'cost' field for existing structure
        stock: parseInt(form.openingStock) || 0,
        lowStockThreshold: parseInt(form.lowStockAlert) || 5,
        active: !draft,
        attributes: {
          emoji: '📦',
          sku: form.sku.trim() || `SKU-${Date.now()}`,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Use 'merchants' collection to match existing structure
      const docRef = await addDoc(collection(firestore, 'merchants', businessId, 'products'), productData);
      
      const newProduct = {
        id: docRef.id,
        ...productData,
        sellingPrice: productData.price, // Map back for UI
        costPrice: productData.cost,
      };

      if (onProductAdded) {
        onProductAdded(newProduct);
      }

      showToast(draft ? `📝 "${form.name}" saved as draft` : `✅ "${form.name}" added to inventory`);
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      showToast('🔥 Error saving product: ' + (error as any).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Add Product</h1>
      <p className={styles.sub}>Add a product to your inventory. It will appear in your Record Sale flow and, once verified, on your online store.</p>

      {/* ── BASIC INFO ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Basic Information</div>
        <div className={styles.cardSub}>The core details of your product.</div>

        <div className={styles.row2}>
          <div className={styles.group}>
            <label className={styles.label}>Product Name <span className={styles.req}>*</span></label>
            <input className={styles.input} placeholder="e.g. Premium Ribbed Polo Co-Ord" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>SKU / Product Code</label>
            <input className={styles.input} placeholder="e.g. PLO-001 (auto-generated if blank)" value={form.sku} onChange={e => set('sku', e.target.value)} />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.group}>
            <label className={styles.label}>Category <span className={styles.req}>*</span></label>
            <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category</option>
              {['Fashion & Clothing','Food & Groceries','Beauty & Personal Care','Electronics','Books & Education','Home & Kitchen','Health & Wellness','Sports & Fitness','Art & Crafts','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Unit of Measure</label>
            <select className={styles.select} value={form.unit} onChange={e => set('unit', e.target.value)}>
              {['piece','pack','kg','litre','box','set','pair','bundle','bottle','sachet','roll','sheet','bag','carton'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.group} style={{ marginBottom: 0 }}>
          <label className={styles.label}>Product Description</label>
          <textarea className={styles.textarea} placeholder="Describe the product — material, size range, key features..." value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
      </div>

      {/* ── PRICING ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Pricing & Stock</div>
        <div className={styles.cardSub}>Your selling price and cost price are used to calculate your profit margin on every sale.</div>

        <div className={styles.row3}>
          <div className={styles.group}>
            <label className={styles.label}>Selling Price ({currencySymbol}) <span className={styles.req}>*</span></label>
            <div className={styles.prefixWrap}>
              <span className={styles.prefix}>{currencySymbol}</span>
              <input id="sell-price" className={styles.input} style={{ paddingLeft: 28 }} type="number" placeholder="0.00" value={form.sellPrice} onChange={e => set('sellPrice', e.target.value)} />
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Cost Price ({currencySymbol}) <span className={styles.req}>*</span></label>
            <div className={styles.prefixWrap}>
              <span className={styles.prefix}>{currencySymbol}</span>
              <input className={styles.input} style={{ paddingLeft: 28 }} type="number" placeholder="0.00" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} />
            </div>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Compare-at Price</label>
            <div className={styles.prefixWrap}>
              <span className={styles.prefix}>{currencySymbol}</span>
              <input className={styles.input} style={{ paddingLeft: 28 }} type="number" placeholder="(strike-through price)" />
            </div>
          </div>
        </div>

        {margin && (
          <div className={styles.marginIndicator}>
            <span>📈</span>
            <span>Profit margin: <strong>{margin.pct}%</strong> &nbsp;|&nbsp; {currencySymbol}{margin.profit} per unit</span>
          </div>
        )}

        <div className={styles.row2} style={{ marginTop: 14 }}>
          <div className={styles.group}>
            <label className={styles.label}>Opening Stock <span className={styles.req}>*</span></label>
            <input className={styles.input} type="number" placeholder="Units currently in hand" value={form.openingStock} onChange={e => set('openingStock', e.target.value)} />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Low Stock Alert</label>
            <input className={styles.input} type="number" placeholder="e.g. 5" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} />
            <span className={styles.hint}>Busmo alerts you when stock drops to this level</span>
          </div>
        </div>
      </div>

      {/* ── EXPIRY ── */}
      <div className={styles.card}>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.cardTitle} style={{ marginBottom: 2 }}>Expiry Tracking</div>
            <div className={styles.cardSub} style={{ marginBottom: 0 }}>For food, medicine, cosmetics, or any perishable goods</div>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" checked={form.hasExpiry} onChange={e => set('hasExpiry', e.target.checked)} />
            <span className={styles.toggleTrack} />
            <span className={styles.toggleThumb} />
          </label>
        </div>

        {form.hasExpiry && (
          <div style={{ marginTop: 16 }}>
            <div className={styles.row2}>
              <div className={styles.group}>
                <label className={styles.label}>Expiry Date</label>
                <input type="date" className={styles.input} value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Manufacture Date</label>
                <input type="date" className={styles.input} />
              </div>
            </div>
            {expiryIsSoon(form.expiryDate) && (
              <div className={styles.expiryWarn}>⚠️ This product expires within 90 days. Consider discounting it soon.</div>
            )}
          </div>
        )}
      </div>

      {/* ── VARIANTS ── */}
      <div className={styles.card}>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.cardTitle} style={{ marginBottom: 2 }}>Product Variants</div>
            <div className={styles.cardSub} style={{ marginBottom: 0 }}>Sizes, colours, flavours — if this product comes in options</div>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" checked={form.hasVariants} onChange={e => set('hasVariants', e.target.checked)} />
            <span className={styles.toggleTrack} />
            <span className={styles.toggleThumb} />
          </label>
        </div>

        {form.hasVariants && (
          <div style={{ marginTop: 16 }}>
            <div className={styles.row2}>
              <div className={styles.group}>
                <label className={styles.label}>Variant Type</label>
                <select className={styles.select} value={form.variantType} onChange={e => set('variantType', e.target.value)}>
                  {['Size','Colour','Flavour','Material','Weight','Volume','Style'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Values (comma-separated)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className={styles.input} placeholder="e.g. S, M, L, XL" value={form.variantValues} onChange={e => set('variantValues', e.target.value)} />
                  <button type="button" className={styles.btnGhost} onClick={generateChips}>Generate</button>
                </div>
              </div>
            </div>
            {variantChips.length > 0 && (
              <div className={styles.chipRow}>
                {variantChips.map(v => <span key={v} className={styles.chip}>{v}</span>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── IMAGES ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Product Images</div>
        <div className={styles.cardSub}>Upload up to 8 images. First image is the main listing photo. Good images increase sales by 3×.</div>
        <div className={styles.uploadZone} onClick={() => showToast('📷 Image upload coming soon')}>
          <div className={styles.uploadIcon}>🖼️</div>
          <div className={styles.uploadLabel}>Click to upload photos</div>
          <div className={styles.uploadHint}>JPG, PNG · Max 10MB each · Up to 8 images</div>
        </div>
      </div>

      {/* ── SALES MODE ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>How will this product be sold?</div>
        <div className={styles.cardSub}>Select all that apply. You can change this later from your Products page.</div>

        <div className={`${styles.saleGate} ${styles.unlocked}`} style={{ marginBottom: 10 }}>
          <div className={styles.gateHeader}>
            <div className={styles.gateTitle}><span>📋</span> Manual Sales Recording <span className={`${styles.pill} ${styles.pillGreen}`}>Always Available</span></div>
            <label className={styles.toggle}><input type="checkbox" checked onChange={() => {}} /><span className={styles.toggleTrack} /><span className={styles.toggleThumb} /></label>
          </div>
          <div className={styles.gateSub}>Record sales by selecting this product from the "Record Sale" flow. Works offline for in-person sales.</div>
        </div>

        <div className={`${styles.saleGate} ${styles.unlocked}`} style={{ marginBottom: 10 }}>
          <div className={styles.gateHeader}>
            <div className={styles.gateTitle}><span>🛍️</span> Online Store <span className={`${styles.pill} ${styles.pillPurple}`}>Store Verified</span></div>
            <label className={styles.toggle}>
              <input 
                type="checkbox" 
                checked={form.onlineStore} 
                onChange={e => {
                  e.preventDefault();
                  setShowComingSoon(true);
                }} 
              />
              <span className={styles.toggleTrack} />
              <span className={styles.toggleThumb} />
            </label>
          </div>
          <div className={styles.gateSub}>Product will appear on your public storefront. Customers can browse and purchase online.</div>
        </div>

        <div className={styles.saleGateAmber}>
      </div>
      </div>

      {/* ── DELIVERY ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Delivery Countries</div>
        <div className={styles.cardSub}>Choose which African countries you deliver to. Customers outside your selection see "Not available in your region" at checkout.</div>

        <div className={styles.toggleRow} style={{ marginBottom: 14 }}>
          <span className={styles.toggleRowLabel}>Use my default delivery settings</span>
          <label className={styles.toggle}>
            <input type="checkbox" checked={form.useDefaultDelivery} onChange={e => set('useDefaultDelivery', e.target.checked)} />
            <span className={styles.toggleTrack} />
            <span className={styles.toggleThumb} />
          </label>
        </div>

        {!form.useDefaultDelivery && (
          <>
            <div className={styles.row2} style={{ marginTop: 16 }}>
              <div className={styles.group}>
                <label className={styles.label}>Delivery Time</label>
                <select className={styles.select} value={form.deliveryTime} onChange={e => set('deliveryTime', e.target.value)}>
                  {['Same as store default (3–5 days)','1–2 business days','3–5 business days','5–7 business days','7–14 business days'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Shipping Fee Override</label>
                <div className={styles.prefixWrap}>
                  <span className={styles.prefix}>{currencySymbol}</span>
                  <input type="number" className={styles.input} style={{ paddingLeft: 28 }} placeholder="Leave blank for store default" value={form.shippingFeeOverride} onChange={e => set('shippingFeeOverride', e.target.value)} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── ACTIONS ── */}
      <div className={styles.actions}>
        <button type="button" className={styles.btnPrimary} onClick={() => handleSave(false)} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
        <button type="button" className={styles.btnGhost} onClick={() => handleSave(true)} disabled={isLoading}>Save as Draft</button>
        {onClose && (
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
        )}
      </div>

      {showComingSoon && <ComingSoonModal />}
    </div>
  );
}
