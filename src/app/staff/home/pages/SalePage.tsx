'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { fetchProducts } from '../services/dataService';
import { fetchDoc } from '@/lib/supabase-client-data';
import { formatCurrency } from '@/lib/currency';
import { ReceiptGenerator } from '../../../owner/dashboard/ReceiptGenerator';
import { offlineManager } from '@/lib/offline/offline-manager';
import { getSupabase } from '@/lib/supabase';

interface SalePageProps {
  onComplete?: (saleData?: any) => void;
  /** Owner business this staff belongs to — required for correct scoping */
  businessId: string;
  staffId: string;
  staffName?: string;
  staffRole?: string;
  currency?: string;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface PaymentMethod {
  method: 'cash' | 'transfer' | 'credit' | 'pos';
  amount: number;
  received?: boolean;
}

interface ReceiptData {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  saleNumber: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentMethod: string;
  logoUrl?: string;
  theme?: any;
  currency?: string;
  soldBy?: string;
}

export function SalePage({
  onComplete,
  businessId,
  staffId,
  staffName = 'Staff',
  staffRole = 'Staff',
  currency: currencyProp = '₦',
}: SalePageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { method: 'cash', amount: 0, received: true },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSale, setLastSale] = useState<ReceiptData | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [businessCurrency, setBusinessCurrency] = useState(currencyProp);
  const [receiptTheme, setReceiptTheme] = useState<any>(null);
  const [businessLogo, setBusinessLogo] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [receiptType, setReceiptType] = useState<'supermarket' | 'invoice'>('supermarket');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currencyProp) setBusinessCurrency(currencyProp);
  }, [currencyProp]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        if (!offlineManager.isOnline()) {
          const cached = await offlineManager.getCachedProducts(businessId);
          if (!cancelled && cached.length) setProducts(cached as any);
          return;
        }

        // Supabase catalog (same source as owner Record Sale)
        const fetchedProducts = await fetchProducts(undefined, businessId);
        if (cancelled) return;
        setProducts(fetchedProducts);
        if (businessId) void offlineManager.cacheProducts(businessId, fetchedProducts as any);

        const businessData = await fetchDoc<Record<string, any>>(
          'businesses',
          businessId
        );
        if (cancelled) return;

        if (businessData) {
          const currency =
            businessData.currency ||
            businessData.businessCurrency ||
            businessData.defaultCurrency ||
            currencyProp ||
            '₦';
          setBusinessCurrency(currency);
          const meta = (businessData as any).metadata || {};
          const theme =
            (businessData as any).receiptTheme ||
            (businessData as any).receipt_theme ||
            meta.receiptTheme ||
            meta.receipt_theme ||
            null;
          if (theme) setReceiptTheme(theme);
          if (businessData.logoUrl || businessData.logo_url) {
            setBusinessLogo(businessData.logoUrl || businessData.logo_url);
          }
          if (businessData.receiptType || businessData.receipt_type) {
            setReceiptType(businessData.receiptType || businessData.receipt_type);
          }
          setBusinessName(
            businessData.businessName ||
              businessData.business_name ||
              businessData.name ||
              ''
          );
          setBusinessAddress(businessData.address || '');
          setBusinessPhone(businessData.phone || '');
          setBusinessCategory(businessData.category || '');
        }
      } catch (error) {
        console.error('[SalePage] Error loading data:', error);
        try {
          const cached = await offlineManager.getCachedProducts(businessId);
          if (!cancelled && cached.length) setProducts(cached as any);
        } catch { /* ignore */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [businessId, currencyProp]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter((p) => {
      const name = String(p?.name || '').toLowerCase();
      const id = String(p?.id || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [searchQuery, products]);

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
      prev
        .map((item) => {
          if (item.productId === productId) {
            return { ...item, quantity: Math.max(1, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const getProduct = (productId: string) =>
    products.find((p: any) => p.id === productId);

  const getTotal = () =>
    cart.reduce((total, item) => {
      const product = getProduct(item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);

  const getItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPaymentAmount = () =>
    paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

  const getCashAmount = () =>
    paymentMethods
      .filter((pm) => pm.method === 'cash')
      .reduce((sum, pm) => sum + pm.amount, 0);

  const getBankAmount = () =>
    paymentMethods
      .filter((pm) => pm.method === 'transfer' || pm.method === 'pos')
      .reduce((sum, pm) => sum + pm.amount, 0);

  const getCreditAmount = () =>
    paymentMethods
      .filter((pm) => pm.method === 'credit')
      .reduce((sum, pm) => sum + pm.amount, 0);

  const updatePaymentAmount = (index: number, amount: number) => {
    setPaymentMethods((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount };
      return updated;
    });
  };

  const addPaymentMethod = () => {
    setPaymentMethods((prev) => [
      ...prev,
      { method: 'cash', amount: 0, received: true },
    ]);
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (cart.length === 0 || !businessId || submitting) return;

    const total = getTotal();
    const totalPayment = getTotalPaymentAmount();

    if (totalPayment < total) {
      alert('Payment amount must equal total sale amount');
      return;
    }

    setSubmitting(true);
    try {
      const saleProducts = cart.map((item) => {
        const product = getProduct(item.productId);
        return {
          productId: item.productId,
          name: product?.name || 'Unknown',
          price: product?.price || 0,
          costPrice: product?.costPrice || 0,
          quantity: item.quantity,
        };
      });

      // Offline path: queue sale in IndexedDB and finish locally
      if (!offlineManager.isOnline()) {
        const totalCost = saleProducts.reduce(
          (s, p) => s + (p.costPrice || 0) * p.quantity,
          0
        );
        const profit = saleProducts.reduce(
          (acc, p) => acc + (p.price - (p.costPrice || 0)) * p.quantity,
          0
        );
        const primaryMethod =
          paymentMethods.length === 1 ? paymentMethods[0].method : 'cash';
        await offlineManager.queueSale({
          businessId,
          userId: staffId,
          items: saleProducts.map((p) => ({
            productId: p.productId,
            name: p.name,
            quantity: p.quantity,
            price: p.price,
            costPrice: p.costPrice || 0,
          })),
          paymentType: (primaryMethod as any) || 'cash',
          totalRevenue: total,
          totalCost,
          totalProfit: profit,
          recordedBy: {
            uid: staffId,
            email: '',
            displayName: staffName || 'Staff',
            role: staffRole || 'Staff',
            staffId,
          },
        });
        // Optimistic local stock bump
        setProducts((prev: any[]) =>
          prev.map((prod) => {
            const sold = saleProducts.find((s) => s.productId === prod.id);
            if (!sold) return prod;
            return { ...prod, stock: Math.max(0, (prod.stock || 0) - sold.quantity) };
          })
        );
        setCart([]);
        setPaymentMethods([{ method: 'cash', amount: 0, received: true }]);
        alert('Sale saved offline. It will sync when you are back online.');
        onComplete?.({ offline: true, total });
        setSubmitting(false);
        return;
      }

      const primaryMethod =
        paymentMethods.length === 1 ? paymentMethods[0].method : 'split';
      const paymentMethodsMap = paymentMethods.reduce(
        (acc: Record<string, number>, pm) => {
          acc[pm.method] = (acc[pm.method] || 0) + (pm.amount || 0);
          return acc;
        },
        {}
      );

      // Server-side write (service role) — avoids RLS client insert failures
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Session expired. Please sign in again.');
      }

      const res = await fetch('/api/sales/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          products: saleProducts,
          total,
          paymentMethod: primaryMethod,
          paymentMethods: paymentMethodsMap,
          paymentBreakdown: paymentMethods.map((pm) => ({
            method: pm.method,
            amount: pm.amount,
            received: pm.received !== false,
          })),
          staffId,
          staffName,
          staffRole,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          json.error ||
          json.message ||
          json.code ||
          `Sale failed (${res.status})`;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }

      const saleId = json.saleId || '';
      if (json.stockErrors?.length) {
        console.warn('[SalePage] stock update warnings', json.stockErrors);
      }

      // Optimistic local stock
      setProducts((prev: any[]) =>
        prev.map((prod) => {
          const sold = saleProducts.find((s) => s.productId === prod.id);
          if (!sold) return prod;
          return { ...prod, stock: Math.max(0, (prod.stock || 0) - sold.quantity) };
        })
      );

      const receiptId = saleId
        ? `REC-${String(saleId).slice(-6).toUpperCase()}`
        : `REC-${Date.now().toString().slice(-6)}`;
      const receiptData: ReceiptData = {
        businessName,
        businessAddress,
        businessPhone,
        saleNumber: receiptId,
        date: new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        items: cart.map((item) => {
          const product = getProduct(item.productId);
          return {
            name: product?.name || 'Unknown Product',
            quantity: item.quantity,
            price: product?.price || 0,
            total: (product?.price || 0) * item.quantity,
          };
        }),
        subtotal: total,
        amountPaid: totalPayment,
        outstandingBalance: Math.max(0, total - totalPayment),
        paymentMethod: primaryMethod,
        logoUrl: businessLogo,
        theme: receiptTheme,
        currency: businessCurrency,
        soldBy: staffName,
      };

      setLastSale(receiptData);
      setShowPrintDialog(true);
      setCart([]);
      setSearchQuery('');
      setPaymentMethods([{ method: 'cash', amount: 0, received: true }]);
      onComplete?.(receiptData);
    } catch (error: any) {
      console.error('[SalePage] Error recording sale:', error);
      const msg = String(
        error?.message ||
          error?.details ||
          error?.hint ||
          error?.error_description ||
          (typeof error === 'string' ? error : 'Failed to record sale. Please try again.')
      );
      // Network failure while "online" — queue offline so staff is not blocked
      const isNetwork =
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('network') ||
        error?.name === 'TypeError';
      if (isNetwork && cart.length > 0) {
        try {
          const saleProducts = cart.map((item) => {
            const product = getProduct(item.productId);
            return {
              productId: item.productId,
              name: product?.name || 'Unknown',
              price: product?.price || 0,
              costPrice: product?.costPrice || 0,
              quantity: item.quantity,
            };
          });
          const total = getTotal();
          await offlineManager.queueSale({
            businessId,
            userId: staffId,
            items: saleProducts.map((p) => ({
              productId: p.productId,
              name: p.name,
              quantity: p.quantity,
              price: p.price,
              costPrice: p.costPrice || 0,
            })),
            paymentType: 'cash',
            totalRevenue: total,
            totalCost: saleProducts.reduce((s, p) => s + (p.costPrice || 0) * p.quantity, 0),
            totalProfit: saleProducts.reduce(
              (s, p) => s + (p.price - (p.costPrice || 0)) * p.quantity,
              0
            ),
            recordedBy: {
              uid: staffId,
              email: '',
              displayName: staffName || 'Staff',
              role: staffRole || 'Staff',
              staffId,
            },
          });
          setCart([]);
          alert('Network error — sale saved offline and will sync when connection is stable.');
          setSubmitting(false);
          return;
        } catch {
          /* fall through */
        }
      }
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pg act full" id="pg-sale">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
          }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="pg act full" id="pg-sale">
        <div style={{ padding: 24, color: 'var(--t3)', textAlign: 'center' }}>
          No business linked to this staff account. Ask the owner to re-invite
          you.
        </div>
      </div>
    );
  }

  return (
    <div className="pg act full" id="pg-sale">
      <div className="phd">
        <h2>Record Sale</h2>
        <p>Select products and process the sale for this business.</p>
      </div>

      <div className="rs-lay">
        <div>
          <div className="srch" style={{ marginBottom: '12px' }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: 18, height: 18 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search products by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.85rem',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--t3)',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="prod-g">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((c) => c.productId === product.id);
              const isSelected = !!cartItem;
              const isLowStock = product.stock <= 5;
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className={`pc${isSelected ? ' sel' : ''}${
                    isOutOfStock ? ' oos' : ''
                  }`}
                  onClick={() => !isOutOfStock && addToCart(product.id)}
                  style={{
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    opacity: isOutOfStock ? 0.5 : 1,
                  }}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="p-img"
                      style={{
                        width: '100%',
                        height: '80px',
                        borderRadius: 'var(--rsm)',
                        objectFit: 'cover',
                        marginBottom: '6px',
                      }}
                    />
                  ) : (
                    <div
                      className="p-em"
                      style={{ fontSize: '2rem', marginBottom: '8px' }}
                    >
                      {product.emoji || '📦'}
                    </div>
                  )}
                  <div
                    className="p-nm"
                    style={{ fontSize: '0.75rem', marginBottom: '4px' }}
                  >
                    {product.name}
                  </div>
                  <div
                    className="p-pr"
                    style={{ fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {formatCurrency(product.price, businessCurrency)}
                  </div>
                  {isLowStock && !isOutOfStock && (
                    <div
                      className="p-ls"
                      style={{ fontSize: '0.6rem', marginTop: '4px' }}
                    >
                      ⚠️ Only {product.stock} left
                    </div>
                  )}
                  {isOutOfStock && (
                    <div
                      className="p-oos"
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--red)',
                        fontWeight: 700,
                        marginTop: '4px',
                      }}
                    >
                      Out of Stock
                    </div>
                  )}
                  {isSelected && (
                    <div className="p-qt">{cartItem?.quantity}</div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--t3)',
              }}
            >
              <p>
                {products.length === 0
                  ? 'No products in this business yet.'
                  : `No products found matching "${searchQuery}"`}
              </p>
            </div>
          )}
        </div>

        <div className="cit-w">
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="2"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
                  </svg>
                </div>
                Current Sale
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  className="btn bxs bamb"
                  onClick={() => setCart([])}
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <p style={{ color: 'var(--t3)', fontSize: '0.8rem' }}>
                  No items selected
                </p>
                <p style={{ color: 'var(--t3)', fontSize: '0.7rem' }}>
                  Search and click products to add them
                </p>
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
                        <div className="ci-pr">
                          {formatCurrency(product.price, businessCurrency)} each
                        </div>
                      </div>
                      <div className="ci-qt">
                        <button
                          type="button"
                          className="ci-btn"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          −
                        </button>
                        <span className="ci-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="ci-btn"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="ci-tot">
                        {formatCurrency(
                          product.price * item.quantity,
                          businessCurrency
                        )}
                      </div>
                      <button
                        type="button"
                        className="ci-rm"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="cart-sum">
              <div className="cs-row">
                <span className="cs-lbl">
                  Subtotal ({getItemCount()} items)
                </span>
                <span className="cs-val">
                  {formatCurrency(getTotal(), businessCurrency)}
                </span>
              </div>
              <div className="cs-row cs-tot">
                <span className="cs-lbl">Total</span>
                <span className="cs-val">
                  {formatCurrency(getTotal(), businessCurrency)}
                </span>
              </div>
            </div>

            <div className="pay-meth">
              <div className="pm-lbl">Payment Methods (Split Payment)</div>
              <div className="pm-split">
                {paymentMethods.map((pm, index) => (
                  <div key={index} className="pm-row">
                    <select
                      value={pm.method}
                      onChange={(e) => {
                        const updated = [...paymentMethods];
                        updated[index] = {
                          ...updated[index],
                          method: e.target.value as PaymentMethod['method'],
                        };
                        setPaymentMethods(updated);
                      }}
                      className="pm-select"
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="transfer">📱 Transfer</option>
                      <option value="pos">💳 POS</option>
                      <option value="credit">📝 Credit</option>
                    </select>
                    <input
                      type="number"
                      value={pm.amount || ''}
                      onChange={(e) =>
                        updatePaymentAmount(
                          index,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Amount"
                      className="pm-input"
                    />
                    {paymentMethods.length > 1 && (
                      <button
                        type="button"
                        className="pm-remove"
                        onClick={() => removePaymentMethod(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="pm-add"
                  onClick={addPaymentMethod}
                >
                  + Add Payment Method
                </button>
              </div>
              <div className="pm-summary">
                <div className="pm-row">
                  <span>Total Sale:</span>
                  <span>{formatCurrency(getTotal(), businessCurrency)}</span>
                </div>
                <div className="pm-row">
                  <span>Total Payment:</span>
                  <span>
                    {formatCurrency(getTotalPaymentAmount(), businessCurrency)}
                  </span>
                </div>
                <div className="pm-row">
                  <span>💵 Cash (Counter):</span>
                  <span>
                    {formatCurrency(getCashAmount(), businessCurrency)}
                  </span>
                </div>
                <div className="pm-row">
                  <span>📱 Bank/POS:</span>
                  <span>
                    {formatCurrency(getBankAmount(), businessCurrency)}
                  </span>
                </div>
                {getCreditAmount() > 0 && (
                  <div className="pm-row">
                    <span>📝 Credit:</span>
                    <span>
                      {formatCurrency(getCreditAmount(), businessCurrency)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn bpw"
              onClick={handleComplete}
              disabled={cart.length === 0 || submitting}
              style={{
                opacity: cart.length === 0 || submitting ? 0.5 : 1,
                cursor:
                  cart.length === 0 || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting
                ? 'Recording…'
                : `Complete Sale - ${formatCurrency(
                    getTotal(),
                    businessCurrency
                  )}`}
            </button>
          </div>
        </div>
      </div>

      {showPrintDialog && lastSale && lastSale.items?.length >= 0 && (
        <ReceiptGenerator
          receiptData={{
            ...lastSale,
            businessName: lastSale.businessName || 'Business',
            saleNumber: lastSale.saleNumber || 'REC',
            date: lastSale.date || new Date().toLocaleString(),
            items: Array.isArray(lastSale.items) ? lastSale.items : [],
            subtotal: Number(lastSale.subtotal) || 0,
            amountPaid: Number(lastSale.amountPaid) || 0,
            outstandingBalance: Number(lastSale.outstandingBalance) || 0,
            paymentMethod: lastSale.paymentMethod || 'cash',
            currency: lastSale.currency || businessCurrency || '₦',
          }}
          onClose={() => {
            setShowPrintDialog(false);
            try {
              onComplete?.();
            } catch { /* ignore */ }
          }}
          isWholesale={
            String(businessCategory || '')
              .toLowerCase()
              .includes('wholesale') ||
            String(businessCategory || '')
              .toLowerCase()
              .includes('distributor')
          }
          receiptType={receiptType || 'supermarket'}
        />
      )}
    </div>
  );
}

export default SalePage;
