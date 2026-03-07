import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Product, CartItem, PaymentMethod } from './types';
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
  const [note, setNote] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
        const productsQuery = query(
          collection(firestore, 'products'),
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
            costPrice: data.costPrice || 0,
            stock: data.stock || 0,
            emoji: data.emoji || '📦',
            lowStockThreshold: data.lowStockThreshold || 10,
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

  function confirmSale() {
    if (!cart.length) return showToast(t('sale.selectProducts'));
    showToast(`${t('sale.saleComplete')} - ${formatMoney(subtotal)}`);
    clearCart();
    navigateTo('home');
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
                      <div className={styles.productEmoji}>{p.emoji}</div>
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
            <CardHeader action={<Button variant="danger" size="xs" onClick={clearCart}>{t('common.clear')}</Button>}>
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

            {/* Payment method */}
            <div className={styles.paymentSection}>
              <div className={styles.paymentLabel}>{t('sale.paymentMethod')}</div>
              <div className={styles.paymentGrid}>
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.id}
                    className={[styles.payMethod, payment === pm.id ? styles.payActive : ''].join(' ')}
                    onClick={() => setPayment(pm.id as PaymentMethod)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
                      <path d={pm.icon}/>
                    </svg>
                    <div className={styles.payLabel}>{pm.label === 'Cash' ? t('sale.cash') : pm.label === 'Transfer' ? t('sale.transfer') : t('sale.card')}</div>
                  </button>
                ))}
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
  { id: 'card',     label: 'Card/POS',  icon: 'M1 4h22v16a2 2 0 01-2 2H3a2 2 0 01-2-2V4zM1 10h22' },
];
