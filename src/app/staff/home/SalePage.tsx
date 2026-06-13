import React, { useState, useMemo, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { getAuth, getFirestore } from 'firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product, CartItem, PageId } from '../types';
import { recordSale, fetchProducts, updateProductStock } from './services/dataService';
import { LockedPage } from '../components/shared';

interface SalePageProps {
  hasAccess: boolean;
  onNav: (p: PageId) => void;
  onSaleComplete: (total: number, itemsSold: number, desc: string) => void;
  onToast: (msg: string) => void;
}

type PayMethod = 'Cash' | 'Transfer' | 'Card';

export const SalePage: React.FC<SalePageProps> = ({
  hasAccess, onNav, onSaleComplete, onToast,
}) => {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [payment, setPayment] = useState<PayMethod>('Cash');
  const [paymentMethods, setPaymentMethods] = useState<{ cash: number; transfer: number; card: number }>({ cash: 0, transfer: 0, card: 0 });
  const [note, setNote] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<{ id: string; name: string } | null>(null);

  // Custom item
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [customNote, setCustomNote] = useState('');

  // Load products from Firestore
  useEffect(() => {
    async function loadData() {
      try {
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) {
          onToast('⚠️ User not authenticated');
          return;
        }

        // Get user's business ID
        const userDoc = await getDoc(doc(getFirestore(), 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBusinessId(userData.businessId || null);
          setStaffInfo({ id: user.uid, name: userData.displayName || user.email || 'Staff' });
          
          // Fetch products if business ID exists
          if (userData.businessId) {
            const fetchedProducts = await fetchProducts(getFirestore(), userData.businessId);
            setProducts(fetchedProducts);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        onToast('⚠️ Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [onToast]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const totalItems = cartItems.reduce((s, { qty }) => s + qty, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: { product, qty: (existing?.qty ?? 0) + 1 },
      };
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...item, qty: newQty } };
    });
  };

  const clearCart = () => setCart({});

  const addCustom = () => {
    if (!customName.trim() || !customPrice) {
      onToast('⚠️ Enter item name and price');
      return;
    }
    const id = `custom-${Date.now()}`;
    const product: Product = {
      id, emoji: '📦', name: customName.trim(),
      price: Number(customPrice), stock: 99,
    };
    setCart((prev) => ({
      ...prev,
      [id]: { product, qty: Number(customQty) || 1 },
    }));
    setCustomName(''); setCustomQty('1'); setCustomPrice(''); setCustomNote('');
    onToast('✅ Custom item added');
  };

  const confirmSale = async () => {
    if (cartItems.length === 0) {
      onToast('⚠️ Add at least one item to the sale');
      return;
    }

    if (!businessId) {
      onToast('⚠️ No business associated with your account');
      return;
    }

    // Validate payment amounts match total
    const totalPayment = Object.values(paymentMethods).reduce((a, b) => a + b, 0);
    if (totalPayment !== subtotal) {
      onToast(`⚠️ Payment total (${totalPayment}) must match sale total (${subtotal})`);
      return;
    }

    try {
      // Prepare sale data
      const saleProducts = cartItems.map(({ product, qty }) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        costPrice: product.costPrice || 0,
        quantity: qty,
      }));

      // Prepare payment methods (only include non-zero amounts)
      const paymentMethodsData = Object.entries(paymentMethods)
        .filter(([_, amount]) => amount > 0)
        .reduce((acc, [method, amount]) => {
          acc[method] = amount;
          return acc;
        }, {} as Record<string, number>);

      // Add recordedBy information
      const { auth } = initializeFirebase();
      const user = auth.currentUser;
      const recordedBy = user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || staffInfo?.name || 'Unknown',
        timestamp: new Date(),
      } : null;

      // Record sale in Firestore
      await recordSale(getFirestore(), businessId, {
        products: saleProducts,
        total: subtotal,
        paymentMethod: Object.keys(paymentMethodsData).length > 1 ? 'split' : payment.toLowerCase(),
        paymentMethods: paymentMethodsData,
        note: note || customNote || '',
        soldBy: staffInfo?.id,
        soldByName: staffInfo?.name,
        recordedBy: recordedBy,
      });

      // Update product stock for each item
      for (const { product, qty } of cartItems) {
        if (!product.id.startsWith('custom-')) {
          const newStock = Math.max(0, (product.stock || 0) - qty);
          await updateProductStock(getFirestore(), businessId, product.id, newStock);
        }
      }

      const desc = cartItems.map(({ product, qty }) => `${product.name} × ${qty}`).join(', ');
      onSaleComplete(subtotal, totalItems, desc);
      clearCart();
      setNote('');
      setCustomNote('');
      setPaymentMethods({ cash: 0, transfer: 0, card: 0 });
      onToast('✅ Sale recorded successfully!');
      onNav('home');
    } catch (error) {
      console.error('Error recording sale:', error);
      onToast('❌ Failed to record sale. Please try again.');
    }
  };

  if (!hasAccess) return <LockedPage pageName="Record Sale"/>;

  return (
    <div className="pg act full" id="pg-sale">
      <div className="phdr">
        <div className="phd">
          <h2>Record a Sale</h2>
          <p>Select products, set quantities and confirm the transaction.</p>
        </div>
        <button className="btn bmd bgh" onClick={() => onNav('home')}>← Back</button>
      </div>

      <div className="rs-lay">
        {/* Left: Products + custom */}
        <div>
          <div className="card" style={{ marginBottom: '12px' }}>
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  </svg>
                </div>
                Products
              </div>
              <span style={{ fontSize: '.7rem', color: 'var(--t3)' }}>
                {totalItems} selected
              </span>
            </div>
            <div className="srch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text" placeholder="Search products…"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="prod-g">
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px' }}>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p style={{ color: 'var(--t3)' }}>Loading products...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                  {search ? (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>No products found</div>
                      <div style={{ fontSize: '0.8rem' }}>Try a different search term</div>
                    </div>
                  ) : products.length === 0 ? (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>No products available</div>
                      <div style={{ fontSize: '0.8rem' }}>Ask the owner to add products first</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>No matching products</div>
                      <div style={{ fontSize: '0.8rem' }}>Try searching for something else</div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {filtered.map((p) => {
                    const qty = cart[p.id]?.qty ?? 0;
                    return (
                      <div
                        key={p.id}
                        className={`pc${qty > 0 ? ' sel' : ''}`}
                        onClick={() => addToCart(p)}
                        role="button" tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && addToCart(p)}
                        aria-label={`Add ${p.name}`}
                      >
                        {qty > 0 && <div className="p-qt">{qty}</div>}
                        <div className="p-em">{p.emoji}</div>
                        <div className="p-nm">{p.name}</div>
                        <div className="p-pr">₦{p.price.toLocaleString()}</div>
                        {p.low && <div className="p-ls">⚠️ Low stock</div>}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Custom item */}
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--amber-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                Add Unlisted Item
              </div>
            </div>
            <div className="frow">
              <div className="fg" style={{ marginBottom: 0 }}>
                <label className="flbl">Item Name</label>
                <input className="fi" placeholder="e.g. Custom item"
                  value={customName} onChange={(e) => setCustomName(e.target.value)}/>
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label className="flbl">Qty</label>
                <input className="fi" type="number" min="1" placeholder="1"
                  value={customQty} onChange={(e) => setCustomQty(e.target.value)}/>
              </div>
            </div>
            <div className="frow" style={{ marginTop: '9px' }}>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label className="flbl">Price (₦)</label>
                <div className="inp-g">
                  <span className="inp-pfx">₦</span>
                  <input className="fi" type="number" placeholder="0"
                    value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}/>
                </div>
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label className="flbl">Note</label>
                <input className="fi" placeholder="Optional"
                  value={customNote} onChange={(e) => setCustomNote(e.target.value)}/>
              </div>
            </div>
            <button className="btn bmd bgh bfull" style={{ marginTop: '10px' }} onClick={addCustom}>
              + Add to Sale
            </button>
          </div>
        </div>

        {/* Right: Cart + payment */}
        <div>
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                  </svg>
                </div>
                Sale Summary
              </div>
              <button className="btn bdn" onClick={clearCart}>Clear</button>
            </div>

            <div className="cit-w">
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                  </svg>
                  Tap products to add them here
                </div>
              ) : (
                cartItems.map(({ product, qty }) => (
                  <div key={product.id} className="ci">
                    <div className="ci-em">{product.emoji}</div>
                    <div className="ci-inf">
                      <div className="ci-nm">{product.name}</div>
                      <div className="ci-pr">₦{product.price.toLocaleString()} each</div>
                    </div>
                    <div className="ci-ctl">
                      <button className="ci-btn del" onClick={() => changeQty(product.id, -1)}>−</button>
                      <div className="ci-q">{qty}</div>
                      <button className="ci-btn" onClick={() => changeQty(product.id, +1)}>+</button>
                    </div>
                    <div className="ci-tot">₦{(product.price * qty).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="totals">
                <div className="trow"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
                <div className="trow main"><span>Total</span><span>₦{subtotal.toLocaleString()}</span></div>
              </div>
            )}

            {/* Payment method - Allow split payments */}
            <div style={{ marginTop: '13px' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '7px' }}>
                Payment Method - Split Payment
              </div>
              <div className="pm-g">
                {(['Cash', 'Transfer', 'Card'] as PayMethod[]).map((m) => (
                  <div key={m.toLowerCase()} className="pm-card">
                    <div
                      className={`pmo${paymentMethods[m.toLowerCase() as keyof typeof paymentMethods] > 0 ? ' act' : ''}`}
                      onClick={() => {
                        const key = m.toLowerCase() as keyof typeof paymentMethods;
                        const current = paymentMethods[key];
                        if (current === 0) {
                          setPaymentMethods(prev => ({ ...prev, [key]: subtotal }));
                        } else {
                          setPaymentMethods(prev => ({ ...prev, [key]: 0 }));
                        }
                      }}
                      role="radio" aria-checked={paymentMethods[m.toLowerCase() as keyof typeof paymentMethods] > 0} tabIndex={0}
                    >
                      <div className="pmo-ic">
                        {m === 'Cash' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M22 10H2"/>
                          </svg>
                        )}
                        {m === 'Transfer' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                            <line x1="12" y1="18" x2="12.01" y2="18"/>
                          </svg>
                        )}
                        {m === 'Card' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                            <line x1="1" y1="10" x2="23" y2="10"/>
                          </svg>
                        )}
                      </div>
                      <div className="pmo-lbl">{m}</div>
                    </div>
                    {paymentMethods[m.toLowerCase() as keyof typeof paymentMethods] > 0 && (
                      <input
                        type="number"
                        className="pm-amount"
                        value={paymentMethods[m.toLowerCase() as keyof typeof paymentMethods]}
                        onChange={(e) => {
                          const key = m.toLowerCase() as keyof typeof paymentMethods;
                          const value = Math.max(0, Number(e.target.value));
                          setPaymentMethods(prev => ({ ...prev, [key]: value }));
                        }}
                        placeholder="Amount"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '8px 0', 
                borderTop: '1px solid var(--border-subtle)', 
                marginTop: '8px',
                fontSize: '.75rem',
                fontWeight: 600,
                color: 'var(--t1)'
              }}>
                <span>Payment Total: ₦{Object.values(paymentMethods).reduce((a, b) => a + b, 0).toLocaleString()}</span>
                {Object.values(paymentMethods).reduce((a, b) => a + b, 0) !== subtotal && (
                  <span style={{ fontSize: '.7rem', color: 'var(--amber)', fontWeight: 600 }}>
                    {Object.values(paymentMethods).reduce((a, b) => a + b, 0) < subtotal ? 
                      `Missing ₦${(subtotal - Object.values(paymentMethods).reduce((a, b) => a + b, 0)).toLocaleString()}` : 
                      `Over by ₦${(Object.values(paymentMethods).reduce((a, b) => a + b, 0) - subtotal).toLocaleString()}`
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="fg" style={{ marginBottom: '9px' }}>
              <label className="flbl">Customer Note (optional)</label>
              <input className="fi" placeholder="e.g. Regular customer, bulk…"
                value={note} onChange={(e) => setNote(e.target.value)}/>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn bmd bgh" style={{ flex: 1 }}>Hold</button>
              <button className="btn blg bpr" style={{ flex: 2 }} onClick={confirmSale}>
                Confirm Sale ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
