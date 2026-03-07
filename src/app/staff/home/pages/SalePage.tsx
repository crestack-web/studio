import React, { useState, useMemo, useRef } from 'react';
import { PRODUCTS } from '../data';
import { formatCurrency } from '@/lib/currency';

interface SalePageProps {
  onComplete?: (saleData?: any) => void;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface PrintedReceipt {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  date: string;
}

export function SalePage({ onComplete }: SalePageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSale, setLastSale] = useState<PrintedReceipt | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return PRODUCTS;
    const query = searchQuery.toLowerCase();
    return PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleComplete = () => {
    if (cart.length === 0) return;
    
    const receipt: PrintedReceipt = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      total: getTotal(),
      paymentMethod,
      date: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };
    
    setLastSale(receipt);
    setShowPrintDialog(true);
    setCart([]);
    setSearchQuery('');
    onComplete?.(receipt);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt - ${lastSale?.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .store-name { font-size: 16px; font-weight: bold; }
              .items { border-bottom: 1px dashed #000; padding: 10px 0; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .item-name { flex: 1; }
              .item-qty { margin: 0 10px; }
              .item-total { font-weight: bold; }
              .totals { padding: 10px 0; }
              .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
              .grand-total { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
              .footer { text-align: center; font-size: 10px; margin-top: 10px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="receipt">${printContent}</div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
    setShowPrintDialog(false);
  };

  const getProduct = (productId: string) => {
    return PRODUCTS.find((p) => p.id === productId);
  };

  return (
    <div className="pg act full" id="pg-sale">
      <div className="phd">
        <h2>Record Sale</h2>
        <p>Select products and process the sale.</p>
      </div>

      <div className="rs-lay">
        {/* Left Side - Product Grid with Search */}
        <div>
          {/* Search Bar */}
          <div className="srch" style={{ marginBottom: '12px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search products by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Product Grid */}
          <div className="prod-g">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((c) => c.productId === product.id);
              const isSelected = !!cartItem;
              const isLowStock = product.stock <= 5;
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className={`pc${isSelected ? ' sel' : ''}${isOutOfStock ? ' oos' : ''}`}
                  onClick={() => !isOutOfStock && addToCart(product.id)}
                  style={{ cursor: isOutOfStock ? 'not-allowed' : 'pointer', opacity: isOutOfStock ? 0.5 : 1 }}
                >
                  <div className="p-em" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                    {product.emoji || '📦'}
                  </div>
                  <div className="p-nm" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                    {product.name}
                  </div>
                  <div className="p-pr" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    {formatCurrency(product.price)}
                  </div>
                  {isLowStock && !isOutOfStock && (
                    <div className="p-ls" style={{ fontSize: '0.6rem', marginTop: '4px' }}>
                      ⚠️ Only {product.stock} left
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="p-oos" style={{ fontSize: '0.6rem', color: 'var(--red)', fontWeight: 700, marginTop: '4px' }}>
                      Out of Stock
                    </div>
                  )}
                  {isSelected && (
                    <div className="p-qt">
                      {cartItem?.quantity}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48, margin: '0 auto 10px', opacity: 0.3 }}>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No products found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Right Side - Cart */}
        <div className="cit-w">
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                  </svg>
                </div>
                Current Sale
              </div>
              {cart.length > 0 && (
                <button className="btn bxs bamb" onClick={() => setCart([])}>
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48, color: 'var(--t3)' }}>
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                </svg>
                <p style={{ color: 'var(--t3)', fontSize: '0.8rem' }}>No items selected</p>
                <p style={{ color: 'var(--t3)', fontSize: '0.7rem' }}>Search and click products to add them</p>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map((item) => {
                  const product = getProduct(item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="ci-row">
                      <div className="ci-info">
                        <div className="ci-nm">{product.name}</div>
                        <div className="ci-pr">{formatCurrency(product.price)} each</div>
                      </div>
                      <div className="ci-qt">
                        <button className="ci-btn" onClick={() => updateQuantity(item.productId, -1)}>−</button>
                        <span className="ci-val">{item.quantity}</span>
                        <button className="ci-btn" onClick={() => updateQuantity(item.productId, 1)}>+</button>
                      </div>
                      <div className="ci-tot">
                        {formatCurrency(product.price * item.quantity)}
                      </div>
                      <button className="ci-rm" onClick={() => removeFromCart(item.productId)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="cart-sum">
              <div className="cs-row">
                <span className="cs-lbl">Subtotal ({getItemCount()} items)</span>
                <span className="cs-val">{formatCurrency(getTotal())}</span>
              </div>
              <div className="cs-row">
                <span className="cs-lbl">Tax (0%)</span>
                <span className="cs-val">{formatCurrency(0)}</span>
              </div>
              <div className="cs-row cs-tot">
                <span className="cs-lbl">Total</span>
                <span className="cs-val">{formatCurrency(getTotal())}</span>
              </div>
            </div>

            <div className="pay-meth">
              <div className="pm-lbl">Payment Method</div>
              <div className="pm-opts">
                <button
                  className={`pm-opt${paymentMethod === 'cash' ? ' sel' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  💵 Cash
                </button>
                <button
                  className={`pm-opt${paymentMethod === 'transfer' ? ' sel' : ''}`}
                  onClick={() => setPaymentMethod('transfer')}
                >
                  📱 Transfer
                </button>
              </div>
            </div>

            <button
              className="btn bpw"
              onClick={handleComplete}
              disabled={cart.length === 0}
              style={{ opacity: cart.length === 0 ? 0.5 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              Complete Sale - {formatCurrency(getTotal())}
            </button>
          </div>
        </div>
      </div>

      {/* Print Dialog */}
      {showPrintDialog && lastSale && (
        <div className="modal-ov" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowPrintDialog(false)}>
          <div className="card" style={{
            maxWidth: '320px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div className="chd">
              <div className="cttl">Print Receipt</div>
              <button
                className="btn bxs bamb"
                onClick={() => setShowPrintDialog(false)}
              >
                ✕
              </button>
            </div>

            {/* Receipt Preview */}
            <div ref={printRef} className="receipt-preview" style={{
              fontFamily: "'Courier New', monospace",
              fontSize: '11px',
              padding: '10px',
              background: '#fff',
              color: '#000',
            }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>🏪 Busmo Store</div>
                <div style={{ fontSize: '9px', color: '#666' }}>123 Business Street</div>
                <div style={{ fontSize: '9px', color: '#666' }}>Lagos, Nigeria</div>
                <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>{lastSale.date}</div>
                <div style={{ fontSize: '9px', color: '#666' }}>Receipt: {lastSale.id}</div>
              </div>

              <div style={{ borderBottom: '1px dashed #000', padding: '10px 0', marginBottom: '10px' }}>
                {lastSale.items.map((item, idx) => {
                  const product = getProduct(item.productId);
                  if (!product) return null;
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ flex: 1 }}>{product.name}</span>
                      <span style={{ margin: '0 8px' }}>x{item.quantity}</span>
                      <span style={{ fontWeight: 'bold' }}>{formatCurrency(product.price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastSale.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Tax (0%)</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #000', paddingTop: '5px', marginTop: '5px', fontSize: '13px', fontWeight: 'bold' }}>
                  <span>TOTAL</span>
                  <span>{formatCurrency(lastSale.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px' }}>
                  <span>Payment</span>
                  <span>{lastSale.paymentMethod === 'cash' ? '💵 Cash' : '📱 Transfer'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '10px', color: '#666' }}>
                <div>Thank you for your business!</div>
                <div>Powered by Busmo</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                className="btn bpw"
                onClick={handlePrint}
                style={{ flex: 1 }}
              >
                🖨️ Print Receipt
              </button>
              <button
                className="btn bgh"
                onClick={() => setShowPrintDialog(false)}
                style={{ flex: 1, background: 'var(--bg)', color: 'var(--t1)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
