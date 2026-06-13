import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, query, where, addDoc, doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Product, CartItem, PaymentMethod, PaymentBreakdown } from './types';
import { initializeFirebase } from '@/firebase';
import { BrevoService } from '@/services/email/brevo-service';
import styles from './RecordSalePage.module.css';

// ═══════════════════════════════════════════
//  RecordSalePage
// ═══════════════════════════════════════════

export function RecordSalePage() {
  const { navigateTo, showToast } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currencyCode } = useCurrency();
  const firestore = useFirestore();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [note, setNote] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Custom item form
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [customCost, setCustomCost] = useState('');

  // Fetch real products from Firestore
  useEffect(() => {
    async function fetchProducts() {
      if (!firestore) return;
      
      try {
        setLoading(true);

        // First, get the user's business ID
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) {
          console.warn('User not authenticated');
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (!userDoc.exists()) {
          console.warn('User document not found');
          setLoading(false);
          return;
        }

        const bId = userDoc.data().businessId;
        if (!bId) {
          console.warn('Business ID not found for user');
          setLoading(false);
          return;
        }

        setBusinessId(bId);

        // Now fetch products from the business-specific collection
        const productsQuery = query(
          collection(firestore, 'businesses', bId, 'products'),
          where('active', '==', true)
        );
        
        const snapshot = await getDocs(productsQuery);
        const fetchedProducts: Product[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          fetchedProducts.push({
            id: doc.id,
            name: data.name || 'Unnamed Product',
            price: data.price || 0,
            costPrice: data.cost || data.costPrice || 0, // Read from 'cost' field (what Addproductpage saves)
            stock: data.stock || 0,
            emoji: data.emoji || '📦',
            lowStockThreshold: data.lowStockThreshold || 10,
            imageUrl: data.imageUrl || '',
          });
        });
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [firestore, showToast]);

  const filtered = useMemo(
    () => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(id: number, delta: number) {
    setCart(prev =>
      prev
        .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    );
  }

  function removeItem(id: number) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function addCustom() {
    if (!customName || !customPrice) return showToast(t('product.name') + ' & ' + t('product.sellingPrice'));
    const item: CartItem = {
      id: Date.now(),
      name: customName,
      price: Number(customPrice),
      costPrice: Number(customCost) || 0,
      stock: 99,
      emoji: '📦',
      qty: Number(customQty) || 1,
    };
    setCart(prev => [...prev, item]);
    setCustomName(''); setCustomQty('1'); setCustomPrice(''); setCustomCost('');
    showToast(`${item.name} ${t('product.saved')}`);
  }

  function clearCart() {
    setCart([]);
    setNote('');
  }

  async function confirmSale() {
    if (!cart.length) return showToast(t('sale.selectProducts'));
    
    // Validate payment amounts match total
    const totalPayment = paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0);
    if (totalPayment !== subtotal) {
      return showToast(`Payment total (${formatMoney(totalPayment)}) must match sale total (${formatMoney(subtotal)})`);
    }
    
    try {
      const { auth, firestore } = initializeFirebase();
      const user = auth.currentUser;
      
      if (!user || !firestore) {
        showToast('Authentication required');
        return;
      }

      // Use the businessId from state (already fetched in useEffect)
      if (!businessId) {
        showToast('Business ID not found. Please ensure you are associated with a business.');
        return;
      }

      // Get current user's role and staff information
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.data();
      const userRole = userData?.role || 'Owner';
      const staffId = userData?.staffId || null;
      const staffName = userData?.displayName || user.displayName || 'Unknown';

      // Calculate expected cash and bank collections
      const expectedCash = paymentBreakdown
        .filter(pb => pb.method === 'cash' || (pb.method === 'split' && pb.amount > 0))
        .reduce((sum, pb) => sum + pb.amount, 0);
      const expectedBank = paymentBreakdown
        .filter(pb => ['transfer', 'pos', 'card'].includes(pb.method) || (pb.method === 'split' && pb.amount > 0))
        .reduce((sum, pb) => sum + pb.amount, 0);

      // Create sale document with staff tracking
      const saleData = {
        products: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          costPrice: item.costPrice,
          quantity: item.qty,
          emoji: item.emoji,
        })),
        totalRevenue: subtotal,
        totalCost: cart.reduce((s, i) => s + i.costPrice * i.qty, 0),
        profit: profit,
        paymentBreakdown: paymentBreakdown,
        paymentMethod: paymentBreakdown.length === 1 ? paymentBreakdown[0].method : 'split',
        expectedCash,
        expectedBank,
        note: note,
        businessId: businessId,
        recordedBy: {
          uid: user.uid,
          email: user.email,
          displayName: staffName,
          role: userRole,
          staffId: staffId,
        },
        createdAt: new Date(),
        recordedAt: new Date(),
      };

      // Save sale to Firestore
      const saleRef = await addDoc(collection(firestore, 'businesses', businessId, 'sales'), saleData);

      // Update product stock in a transaction
      await runTransaction(firestore, async (transaction) => {
        for (const item of cart) {
          const productRef = doc(firestore, 'businesses', businessId, 'products', item.id.toString());
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists()) {
            const currentStock = productDoc.data().stock || 0;
            const newStock = Math.max(0, currentStock - item.qty);
            transaction.update(productRef, { stock: newStock });
          }
        }
      });

      // Check for low stock items and send alert
      try {
        // Check if low stock notifications are enabled
        const ownerDoc = await getDoc(doc(firestore, 'users', user.uid));
        const emailPrefs = ownerDoc.data()?.emailPreferences;
        
        if (emailPrefs?.lowStock !== false) {
          const lowStockItems: Array<{ name: string; stock: number; threshold: number }> = [];
          for (const item of cart) {
            const productRef = doc(firestore, 'businesses', businessId, 'products', item.id.toString());
            const productDoc = await getDoc(productRef);
            
            if (productDoc.exists()) {
              const data = productDoc.data();
              const stock = data.stock || 0;
              const threshold = data.lowStockThreshold || 10;
              
              if (stock <= threshold) {
                lowStockItems.push({
                  name: data.name || item.name,
                  stock,
                  threshold,
                });
              }
            }
          }

          // Send low stock alert if any items are below threshold
          if (lowStockItems.length > 0) {
            const businessName = ownerDoc.data()?.businessName || 'Your Business';
            const ownerEmail = user.email;
            
            if (ownerEmail) {
              await BrevoService.sendLowStockAlertEmail(
                ownerEmail,
                businessName,
                lowStockItems
              );
              console.log('Low stock alert email sent');
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send low stock alert:', emailError);
        // Don't fail the sale if email fails
      }

      // If recorded by staff, update staff's revenue and transaction counts
      if (userRole === 'Staff' && staffId) {
        const staffRef = doc(firestore, 'businesses', businessId, 'staff', user.uid);
        const staffDoc = await getDoc(staffRef);
        
        if (staffDoc.exists()) {
          const currentRevenue = staffDoc.data().revenue || 0;
          const currentTransactions = staffDoc.data().transactions || 0;
          
          await updateDoc(staffRef, {
            revenue: currentRevenue + subtotal,
            transactions: currentTransactions + 1,
            lastSaleAt: new Date(),
          });
        }
      }

      showToast(`${t('sale.saleComplete')} - ${formatMoney(subtotal)}`);
      clearCart();
      setPaymentBreakdown([]);
      navigateTo('home');
    } catch (error) {
      console.error('Error saving sale:', error);
      showToast('Failed to save sale. Please try again.');
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const profit   = cart.reduce((s, i) => s + (i.price - i.costPrice) * i.qty, 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>{t('sale.title')}</h2>
          <p className={styles.pageDesc}>{t('sale.subtitle')}</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('home')}>← {t('common.back')}</Button>
      </div>

      <div className={styles.layout}>
        {/* Left — product picker */}
        <div className={styles.left}>
          <Card style={{ marginBottom: 12 }}>
            <CardHeader
              action={<span className={styles.selCount}>{cart.length} {t('sale.quantity')}</span>}
            >
              <CardIcon bg="var(--green-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
              </CardIcon>
              {t('sale.selectProducts')}
            </CardHeader>

            {/* Search */}
            <div className={styles.search}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder={t('common.search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.productGrid}>
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 32, height: 32, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
                  </svg>
                  {t('common.loading')}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  {search ? (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('sale.noProductsFound')}</div>
                      <div style={{ fontSize: '0.8rem' }}>{t('sale.tryDifferentSearch')}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('sale.noProducts')}</div>
                      <div style={{ fontSize: '0.8rem' }}>{t('sale.addProductsFirst')}</div>
                    </div>
                  )}
                </div>
              ) : (
                filtered.map(p => {
                  const inCart = cart.find(i => i.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className={[styles.productCard, inCart ? styles.productSelected : ''].join(' ')}
                      onClick={() => addToCart(p)}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className={styles.productImage} />
                      ) : (
                        <div className={styles.productEmoji}>{p.emoji}</div>
                      )}
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productPrice}>{formatMoney(p.price)}</div>
                      <div className={styles.productStock}>
                        {p.stock <= 5 ? (
                          <span className={styles.lowStock}>{t('common.loading').replace('Loading', 'Only')} {p.stock} {t('sale.quantity')}</span>
                        ) : (
                          <span>{p.stock} {t('sale.quantity')} {t('product.inStock')}</span>
                        )}
                      </div>
                      {inCart && (
                        <div className={styles.productQtyBadge}>{inCart.qty}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Custom item */}
          <Card>
            <CardHeader>
              <CardIcon bg="var(--amber-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </CardIcon>
              {t('sale.addCustomItem')}
            </CardHeader>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('product.name')}</label>
                <input className={styles.formInput} placeholder={t('product.name')} value={customName} onChange={e => setCustomName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('sale.quantity')}</label>
                <input className={styles.formInput} type="number" min={1} placeholder="1" value={customQty} onChange={e => setCustomQty(e.target.value)} />
              </div>
            </div>
            <div className={styles.formRow} style={{ marginTop: 9 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('product.sellingPrice')} ({currencyCode})</label>
                <div className={styles.inputPrefix}>
                  <span className={styles.prefix}>{currencyCode === 'NGN' ? '₦' : currencyCode + ' '}</span>
                  <input className={styles.formInput} type="number" placeholder="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('product.costPrice')} ({currencyCode})</label>
                <div className={styles.inputPrefix}>
                  <span className={styles.prefix}>{currencyCode === 'NGN' ? '₦' : currencyCode + ' '}</span>
                  <input className={styles.formInput} type="number" placeholder="0" value={customCost} onChange={e => setCustomCost(e.target.value)} />
                </div>
              </div>
            </div>
            <Button variant="ghost" fullWidth style={{ marginTop: 11 }} onClick={addCustom}>
              + {t('sale.addToCart')}
            </Button>
          </Card>
        </div>

        {/* Right — sale summary */}
        <div className={styles.right}>
          <Card>
            <CardHeader action={<Button variant="danger" size="xs" onClick={clearCart}>Clear</Button>}>
              <CardIcon bg="var(--purple-lt)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                </svg>
              </CardIcon>
              {t('sale.cart')}
            </CardHeader>

            {/* Cart items */}
            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <div className={styles.cartEmpty}>{t('sale.emptyCart')}</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className={styles.cartItem}>
                    <span className={styles.cartEmoji}>{item.emoji}</span>
                    <div className={styles.cartInfo}>
                      <div className={styles.cartName}>{item.name}</div>
                      <div className={styles.cartPrice}>{formatMoney(item.price * item.qty)}</div>
                    </div>
                    <div className={styles.cartQtyControl}>
                      <button onClick={() => updateQty(item.id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <button className={styles.cartRemove} onClick={() => removeItem(item.id)}>×</button>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            {cart.length > 0 && (
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>{t('sale.subtotal')}</span><span>{formatMoney(subtotal)}</span>
                </div>
                <div className={[styles.totalRow, styles.totalMain].join(' ')}>
                  <span>{t('sale.grandTotal')}</span><span>{formatMoney(subtotal)}</span>
                </div>
                <div className={[styles.totalRow, styles.totalProfit].join(' ')}>
                  <span>{t('sale.profit')}</span><span>{formatMoney(profit)}</span>
                </div>
              </div>
            )}

            {/* Payment method - Allow split payments */}
            <div className={styles.paymentSection}>
              <div className={styles.paymentLabel}>{t('sale.paymentMethod')} - Split Payment</div>
              <div className={styles.paymentGrid}>
                {PAYMENT_METHODS.map(pm => {
                  const paymentBreakdownItem = paymentBreakdown.find(pb => pb.method === pm.id);
                  const amount = paymentBreakdownItem?.amount || 0;
                  return (
                    <div key={pm.id} className={styles.paymentMethodCard}>
                      <button
                        className={[styles.payMethod, amount > 0 ? styles.payActive : ''].join(' ')}
                        onClick={() => {
                          if (amount === 0) {
                            setPaymentBreakdown(prev => [...prev, { method: pm.id as PaymentMethod, amount: subtotal }]);
                          } else {
                            setPaymentBreakdown(prev => prev.filter(pb => pb.method !== pm.id));
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                          <path d={pm.icon}/>
                        </svg>
                        <div className={styles.payLabel}>{pm.label}</div>
                      </button>
                      {amount > 0 && (
                        <input
                          type="number"
                          className={styles.paymentAmountInput}
                          value={amount}
                          onChange={(e) => {
                            const value = Math.max(0, Number(e.target.value));
                            setPaymentBreakdown(prev => prev.map(pb => pb.method === pm.id ? { ...pb, amount: value } : pb));
                          }}
                          placeholder="Amount"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.paymentTotal}>
                <span>Total: {formatMoney(paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0))}</span>
                {paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0) !== subtotal && (
                  <span className={styles.paymentWarning}>
                    {paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0) < subtotal ? 
                      `Missing ${formatMoney(subtotal - paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0))}` : 
                      `Over by ${formatMoney(paymentBreakdown.reduce((sum, pb) => sum + pb.amount, 0) - subtotal)}`
                    }
                  </span>
                )}
              </div>
            </div>

            {/* Note */}
            <div className={styles.formGroup} style={{ marginBottom: 9 }}>
              <label className={styles.formLabel}>{t('sale.note')} ({t('common.optional')})</label>
              <input className={styles.formInput} placeholder={t('sale.note')} value={note} onChange={e => setNote(e.target.value)} />
            </div>

            {/* Actions */}
            <div className={styles.saleActions}>
              <Button variant="subtle" style={{ flex: 1 }}>{t('sale.saveDraft')}</Button>
              <Button variant="primary" size="lg" style={{ flex: 2 }} onClick={confirmSale}>
                {t('sale.completeSale')} ✓
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Cash',      icon: 'M2 6h20a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V8a2 2 0 012-2zM2 10h20' },
  { id: 'transfer', label: 'Transfer',  icon: 'M5 2h14a2 2 0 012 2v20a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01' },
  { id: 'pos',      label: 'POS',       icon: 'M1 4h22v16a2 2 0 01-2 2H3a2 2 0 01-2-2V4zM1 10h22' },
  { id: 'card',     label: 'Card',      icon: 'M3 10h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2v-8a2 2 0 012-2z' },
  { id: 'credit',   label: 'Credit',    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
];
