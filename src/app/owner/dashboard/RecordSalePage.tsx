import React, { useState, useMemo } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { Card, CardHeader, CardIcon } from '../../shared/Card';
import { Button } from '../../shared/Button';
import { Product, CartItem, PaymentMethod } from '../../../types';
import { PRODUCTS } from '../../../constants/mockData';
import styles from './RecordSalePage.module.css';

// ═══════════════════════════════════════════
//  RecordSalePage
// ═══════════════════════════════════════════

export function RecordSalePage() {
  const { navigateTo, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  // Custom item form
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [customCost, setCustomCost] = useState('');

  const filtered = useMemo(
    () => PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [search]
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
    if (!customName || !customPrice) return showToast('Fill item name and price');
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
    showToast(`${item.name} added`);
  }

  function clearCart() {
    setCart([]);
    setNote('');
  }

  function confirmSale() {
    if (!cart.length) return showToast('Add products first');
    showToast(`✅ Sale of ₦${subtotal.toLocaleString()} confirmed!`);
    clearCart();
    navigateTo('home');
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const profit   = cart.reduce((s, i) => s + (i.price - i.costPrice) * i.qty, 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Record a Sale</h2>
          <p className={styles.pageDesc}>Select products, set quantities and confirm the sale.</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
      </div>

      <div className={styles.layout}>
        {/* Left — product picker */}
        <div className={styles.left}>
          <Card style={{ marginBottom: 12 }}>
            <CardHeader
              action={<span className={styles.selCount}>{cart.length} selected</span>}
            >
              <CardIcon bg="var(--green-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
              </CardIcon>
              Select Products
            </CardHeader>

            {/* Search */}
            <div className={styles.search}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.productGrid}>
              {filtered.map(p => {
                const inCart = cart.find(i => i.id === p.id);
                return (
                  <div
                    key={p.id}
                    className={[styles.productCard, inCart ? styles.productSelected : ''].join(' ')}
                    onClick={() => addToCart(p)}
                  >
                    <div className={styles.productEmoji}>{p.emoji}</div>
                    <div className={styles.productName}>{p.name}</div>
                    <div className={styles.productPrice}>₦{p.price.toLocaleString()}</div>
                    <div className={styles.productStock}>
                      {p.stock <= 5 ? (
                        <span className={styles.lowStock}>Only {p.stock} left</span>
                      ) : (
                        <span>{p.stock} in stock</span>
                      )}
                    </div>
                    {inCart && (
                      <div className={styles.productQtyBadge}>{inCart.qty}</div>
                    )}
                  </div>
                );
              })}
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
              Add Custom Item
            </CardHeader>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Item Name</label>
                <input className={styles.formInput} placeholder="e.g. Bottled Water" value={customName} onChange={e => setCustomName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Qty</label>
                <input className={styles.formInput} type="number" min={1} placeholder="1" value={customQty} onChange={e => setCustomQty(e.target.value)} />
              </div>
            </div>
            <div className={styles.formRow} style={{ marginTop: 9 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sell Price (₦)</label>
                <div className={styles.inputPrefix}>
                  <span className={styles.prefix}>₦</span>
                  <input className={styles.formInput} type="number" placeholder="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cost Price (₦)</label>
                <div className={styles.inputPrefix}>
                  <span className={styles.prefix}>₦</span>
                  <input className={styles.formInput} type="number" placeholder="0" value={customCost} onChange={e => setCustomCost(e.target.value)} />
                </div>
              </div>
            </div>
            <Button variant="ghost" fullWidth style={{ marginTop: 11 }} onClick={addCustom}>
              + Add to Sale
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
              Sale Summary
            </CardHeader>

            {/* Cart items */}
            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <div className={styles.cartEmpty}>Tap products to add them here</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className={styles.cartItem}>
                    <span className={styles.cartEmoji}>{item.emoji}</span>
                    <div className={styles.cartInfo}>
                      <div className={styles.cartName}>{item.name}</div>
                      <div className={styles.cartPrice}>₦{(item.price * item.qty).toLocaleString()}</div>
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
                  <span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className={[styles.totalRow, styles.totalMain].join(' ')}>
                  <span>Total</span><span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className={[styles.totalRow, styles.totalProfit].join(' ')}>
                  <span>Est. Profit</span><span>₦{profit.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Payment method */}
            <div className={styles.paymentSection}>
              <div className={styles.paymentLabel}>Payment Method</div>
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
                    <div className={styles.payLabel}>{pm.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className={styles.formGroup} style={{ marginBottom: 9 }}>
              <label className={styles.formLabel}>Note (optional)</label>
              <input className={styles.formInput} placeholder="e.g. Bulk order…" value={note} onChange={e => setNote(e.target.value)} />
            </div>

            {/* Actions */}
            <div className={styles.saleActions}>
              <Button variant="subtle" style={{ flex: 1 }}>Save Draft</Button>
              <Button variant="primary" size="lg" style={{ flex: 2 }} onClick={confirmSale}>
                Confirm Sale ✓
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
