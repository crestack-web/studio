import React, { useState, useMemo, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { fetchProducts } from '../services/dataService';
import { formatCurrency } from '@/lib/currency';
import { ReceiptGenerator } from '../../../owner/dashboard/ReceiptGenerator';

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
        const { firestore } = initializeFirebase();
        if (!firestore) {
          console.error('[SalePage] Firestore unavailable');
          return;
        }

        const fetchedProducts = await fetchProducts(firestore, businessId);
        if (cancelled) return;
        setProducts(fetchedProducts);

        const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
        if (cancelled) return;

        if (businessDoc.exists()) {
          const businessData = businessDoc.data();
          const currency =
            businessData.currency ||
            businessData.businessCurrency ||
            businessData.defaultCurrency ||
            currencyProp ||
            '₦';
          setBusinessCurrency(currency);
          if (businessData.receiptTheme) setReceiptTheme(businessData.receiptTheme);
          if (businessData.logoUrl) setBusinessLogo(businessData.logoUrl);
          if (businessData.receiptType) setReceiptType(businessData.receiptType);
          setBusinessName(businessData.businessName || businessData.name || '');
          setBusinessAddress(businessData.address || '');
          setBusinessPhone(businessData.phone || '');
          setBusinessCategory(businessData.category || '');
        }
      } catch (error) {
        console.error('[SalePage] Error loading data:', error);
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
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
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
      const { firestore } = initializeFirebase();
      if (!firestore) throw new Error('Data service unavailable');

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

      const expectedCash = getCashAmount();
      const expectedBank = getBankAmount();
      const profit = saleProducts.reduce(
        (acc, p) => acc + (p.price - (p.costPrice || 0)) * p.quantity,
        0
      );

      const saleData = {
        products: saleProducts,
        totalRevenue: total,
        total: total,
        totalCost: saleProducts.reduce(
          (s, p) => s + (p.costPrice || 0) * p.quantity,
          0
        ),
        profit,
        paymentBreakdown: paymentMethods.map((pm) => ({
          method: pm.method,
          amount: pm.amount,
          received: pm.received !== false,
        })),
        paymentMethod:
          paymentMethods.length === 1 ? paymentMethods[0].method : 'split',
        expectedCash,
        expectedBank,
        note: '',
        businessId,
        sourceLocation: 'main_store',
        sourceLocationName: 'Main Store',
        recordedBy: {
          uid: staffId,
          displayName: staffName,
          role: staffRole,
          staffId: staffId,
        },
        soldBy: staffId,
        soldByName: staffName,
        createdAt: Timestamp.now(),
        recordedAt: Timestamp.now(),
      };

      await addDoc(
        collection(firestore, 'businesses', businessId, 'sales'),
        saleData
      );

      if (expectedBank > 0) {
        try {
          const bankAccountsQuery = query(
            collection(firestore, 'businesses', businessId, 'bankAccounts'),
            where('isActive', '==', true)
          );
          const bankAccountsSnapshot = await getDocs(bankAccountsQuery);
          let posDefaultAccount: string | null = null;
          bankAccountsSnapshot.forEach((d) => {
            if (d.data().isPosDefault) posDefaultAccount = d.id;
          });
          if (posDefaultAccount) {
            const bankAccountRef = doc(
              firestore,
              'businesses',
              businessId,
              'bankAccounts',
              posDefaultAccount
            );
            const bankAccountDoc = await getDoc(bankAccountRef);
            if (bankAccountDoc.exists()) {
              const currentBalance = bankAccountDoc.data().currentBalance || 0;
              await updateDoc(bankAccountRef, {
                currentBalance: currentBalance + expectedBank,
              });
            }
          }
        } catch (error) {
          console.error('[SalePage] bank update failed', error);
        }
      }

      for (const item of cart) {
        const productRef = doc(
          firestore,
          'businesses',
          businessId,
          'products',
          item.productId
        );
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          const currentStock = productDoc.data().stock || 0;
          await updateDoc(productRef, {
            stock: Math.max(0, currentStock - item.quantity),
            lastSaleDate: new Date(),
            updatedAt: Timestamp.now(),
          });
        }
      }

      try {
        const staffRef = doc(
          firestore,
          'businesses',
          businessId,
          'staff',
          staffId
        );
        const staffDoc = await getDoc(staffRef);
        if (staffDoc.exists()) {
          const currentRevenue = staffDoc.data().revenue || 0;
          const currentTransactions = staffDoc.data().transactions || 0;
          await updateDoc(staffRef, {
            revenue: currentRevenue + total,
            transactions: currentTransactions + 1,
            lastSaleAt: Timestamp.now(),
          });
        }
      } catch (error) {
        console.warn('[SalePage] staff revenue update skipped', error);
      }

      const receiptId = `REC-${Date.now().toString().slice(-6)}`;
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
        paymentMethod:
          paymentMethods.length === 1 ? paymentMethods[0].method : 'split',
        logoUrl: businessLogo,
        theme: receiptTheme,
      };

      setLastSale(receiptData);
      setShowPrintDialog(true);
      setCart([]);
      setSearchQuery('');
      setPaymentMethods([{ method: 'cash', amount: 0, received: true }]);
      onComplete?.(receiptData);
    } catch (error) {
      console.error('[SalePage] Error recording sale:', error);
      alert('Failed to record sale. Please try again.');
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

      {showPrintDialog && lastSale && (
        <ReceiptGenerator
          receiptData={lastSale}
          onClose={() => {
            setShowPrintDialog(false);
            onComplete?.();
          }}
          isWholesale={
            businessCategory.toLowerCase().includes('wholesale') ||
            businessCategory.toLowerCase().includes('distributor')
          }
          receiptType={receiptType}
        />
      )}
    </div>
  );
}

export default SalePage;
