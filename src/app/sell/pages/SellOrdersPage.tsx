'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import styles from './SellOrdersPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderLineItem {
  productId: string;
  productType: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface StatusEntry {
  status: string;
  timestamp: { seconds: number } | null;
  changedBy: string;
}

interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryOption: 'delivery' | 'pickup';
  shippingAddress: string | null;
  shippingCost: number;
  lineItems: OrderLineItem[];
  subtotal: number;
  total: number;
  paystackReference: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingNumber: string | null;
  carrier: string | null;
  statusHistory: StatusEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PIPELINE: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending', paid: 'Paid', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};

function statusBadgeClass(s: OrderStatus): string {
  return {
    pending_payment: styles.statusPending, paid: styles.statusPaid,
    processing: styles.statusProcessing, shipped: styles.statusShipped,
    delivered: styles.statusDelivered, cancelled: styles.statusCancelled,
    refunded: styles.statusRefunded,
  }[s] ?? styles.statusPending;
}

function payBadgeClass(s: PaymentStatus): string {
  return { paid: styles.payPaid, pending: styles.payPending, failed: styles.payFailed, refunded: styles.payRefunded }[s] ?? styles.payPending;
}

function fmt(n: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : '$';
  return `${s}${n.toLocaleString()}`;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: Date) {
  return d.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Order detail slide-over ──────────────────────────────────────────────────

interface SlideOverProps {
  order: StoreOrder;
  currency: string;
  businessId: string;
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

function OrderSlideOver({ order, currency, businessId, userId, onClose, onUpdated }: SlideOverProps) {
  const { showToast } = useSell();
  const [busy, setBusy] = useState(false);
  const [trackingNum, setTrackingNum] = useState(order.trackingNumber ?? '');
  const [carrier, setCarrier] = useState(order.carrier ?? '');
  const [showTracking, setShowTracking] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [refundOnCancel, setRefundOnCancel] = useState(false);

  const pipelineIndex = PIPELINE.indexOf(order.status);

  const advance = useCallback(async () => {
    const next = PIPELINE[pipelineIndex + 1];
    if (!next) return;
    if (next === 'shipped') { setShowTracking(true); return; }
    setBusy(true);
    try {
      const { firestore } = initializeFirebase();
      const entry: StatusEntry = { status: next, timestamp: { seconds: Math.floor(Date.now() / 1000) }, changedBy: userId };
      await updateDoc(doc(firestore, 'businesses', businessId, 'storeOrders', order.id), {
        status: next,
        statusHistory: [...(order.statusHistory ?? []), entry],
        updatedAt: serverTimestamp(),
      });
      showToast(`Order marked as ${STATUS_LABELS[next]}`, 'success');
      onUpdated();
    } catch { showToast('Failed to update order', 'error'); }
    finally { setBusy(false); }
  }, [pipelineIndex, order, businessId, userId, showToast, onUpdated]);

  const saveTracking = useCallback(async () => {
    setBusy(true);
    try {
      const { firestore } = initializeFirebase();
      const entry: StatusEntry = { status: 'shipped', timestamp: { seconds: Math.floor(Date.now() / 1000) }, changedBy: userId };
      await updateDoc(doc(firestore, 'businesses', businessId, 'storeOrders', order.id), {
        status: 'shipped', trackingNumber: trackingNum || null, carrier: carrier || null,
        statusHistory: [...(order.statusHistory ?? []), entry], updatedAt: serverTimestamp(),
      });
      showToast('Order marked as shipped', 'success');
      setShowTracking(false);
      onUpdated();
    } catch { showToast('Failed to update order', 'error'); }
    finally { setBusy(false); }
  }, [trackingNum, carrier, order, businessId, userId, showToast, onUpdated]);

  const cancelOrder = useCallback(async () => {
    setBusy(true);
    try {
      const { firestore } = initializeFirebase();
      const entry: StatusEntry = { status: 'cancelled', timestamp: { seconds: Math.floor(Date.now() / 1000) }, changedBy: userId };
      await updateDoc(doc(firestore, 'businesses', businessId, 'storeOrders', order.id), {
        status: 'cancelled', statusHistory: [...(order.statusHistory ?? []), entry], updatedAt: serverTimestamp(),
      });
      if (refundOnCancel) {
        // Trigger Paystack refund via API route
        await fetch('/api/store/orders/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: order.paystackReference, businessId, orderId: order.id }),
        });
      }
      showToast('Order cancelled', 'info');
      setShowCancel(false);
      onUpdated();
    } catch { showToast('Failed to cancel order', 'error'); }
    finally { setBusy(false); }
  }, [order, businessId, userId, refundOnCancel, showToast, onUpdated]);

  const nextStatus = PIPELINE[pipelineIndex + 1];
  const canAdvance = !!nextStatus && order.status !== 'cancelled' && order.status !== 'refunded';
  const canCancel  = order.status === 'paid' || order.status === 'processing';

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.slideover}>
        {/* Header */}
        <div className={styles.slideoverHeader}>
          <div>
            <p className={styles.slideoverTitle}>{order.orderNumber}</p>
            <p className={styles.slideoverSub}>{fmtDateTime(order.createdAt)} · {order.customerName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className={styles.slideoverBody}>
          {/* Pipeline */}
          <div>
            <p className={styles.sectionLabel}>Order status</p>
            <div className={styles.pipeline}>
              {PIPELINE.map((step, i) => {
                const isDone   = pipelineIndex > i || order.status === 'delivered';
                const isActive = pipelineIndex === i;
                return (
                  <div key={step} className={styles.pipelineStep}>
                    <div className={[styles.pipelineDot, isDone ? styles.pipelineDotDone : isActive ? styles.pipelineDotActive : ''].join(' ')}>
                      {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span className={[styles.pipelineLabel, isDone ? styles.pipelineLabelDone : isActive ? styles.pipelineLabelActive : ''].join(' ')}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          {(canAdvance || canCancel) && !showTracking && !showCancel && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canAdvance && (
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={advance} disabled={busy}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Mark as {STATUS_LABELS[nextStatus]}
                </button>
              )}
              {canCancel && (
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowCancel(true)} disabled={busy}>
                  Cancel order
                </button>
              )}
            </div>
          )}

          {/* Tracking entry */}
          {showTracking && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, background: 'var(--sell-surface-2)', borderRadius: 'var(--sell-radius-sm)', border: '1px solid var(--sell-border)' }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--sell-text-1)' }}>Enter tracking details (optional)</p>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tracking number</label>
                <input className={styles.formInput} placeholder="e.g. GIG123456789" value={trackingNum} onChange={e => setTrackingNum(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Carrier</label>
                <input className={styles.formInput} placeholder="e.g. GIG Logistics, DHL" value={carrier} onChange={e => setCarrier(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveTracking} disabled={busy}>Confirm shipment</button>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowTracking(false)}>Back</button>
              </div>
            </div>
          )}

          {/* Cancel confirm */}
          {showCancel && (
            <div className={styles.confirmBox}>
              <p className={styles.confirmTitle}>Cancel this order?</p>
              <p className={styles.confirmSub}>This cannot be undone. The order status will be set to Cancelled.</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                <input type="checkbox" checked={refundOnCancel} onChange={e => setRefundOnCancel(e.target.checked)} />
                Initiate Paystack refund for {fmt(order.total, currency)}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={cancelOrder} disabled={busy}>Yes, cancel</button>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowCancel(false)}>Go back</button>
              </div>
            </div>
          )}

          {/* Line items */}
          <div>
            <p className={styles.sectionLabel}>Items</p>
            {order.lineItems?.map((item, i) => (
              <div key={i} className={styles.lineItem}>
                <span style={{ fontSize: '1.1rem' }}>{item.productType === 'digital' ? '💾' : item.productType === 'service' ? '⚙️' : '📦'}</span>
                <span className={styles.lineItemName}>{item.displayName}</span>
                <span className={styles.lineItemQty}>× {item.quantity}</span>
                <span className={styles.lineItemPrice}>{fmt(item.lineTotal, currency)}</span>
              </div>
            ))}
            <div className={styles.totalsBox} style={{ marginTop: 10 }}>
              <div className={styles.totalRow}><span>Subtotal</span><span>{fmt(order.subtotal, currency)}</span></div>
              {order.shippingCost > 0 && <div className={styles.totalRow}><span>Shipping</span><span>{fmt(order.shippingCost, currency)}</span></div>}
              <div className={[styles.totalRow, styles.totalRowBold].join(' ')}><span>Total</span><span>{fmt(order.total, currency)}</span></div>
            </div>
          </div>

          {/* Customer & delivery */}
          <div>
            <p className={styles.sectionLabel}>Customer</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}><p className={styles.infoKey}>Name</p><p className={styles.infoVal}>{order.customerName}</p></div>
              <div className={styles.infoItem}><p className={styles.infoKey}>Email</p><p className={styles.infoVal}>{order.customerEmail}</p></div>
              <div className={styles.infoItem}><p className={styles.infoKey}>Phone</p><p className={styles.infoVal}>{order.customerPhone || '—'}</p></div>
              <div className={styles.infoItem}><p className={styles.infoKey}>Delivery</p><p className={styles.infoVal}>{order.deliveryOption}</p></div>
              {order.shippingAddress && <div className={styles.infoItem} style={{ gridColumn: '1/-1' }}><p className={styles.infoKey}>Address</p><p className={styles.infoVal}>{order.shippingAddress}</p></div>}
              {order.trackingNumber && <div className={styles.infoItem}><p className={styles.infoKey}>Tracking</p><p className={styles.infoVal}>{order.trackingNumber} {order.carrier ? `(${order.carrier})` : ''}</p></div>}
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className={styles.sectionLabel}>Payment</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}><p className={styles.infoKey}>Status</p><span className={`${styles.badge} ${payBadgeClass(order.paymentStatus)}`}>{order.paymentStatus}</span></div>
              <div className={styles.infoItem}><p className={styles.infoKey}>Reference</p><p className={styles.infoVal} style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{order.paystackReference || '—'}</p></div>
            </div>
          </div>

          {/* Status timeline */}
          {order.statusHistory?.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>History</p>
              <div className={styles.timeline}>
                {[...order.statusHistory].reverse().map((entry, i) => {
                  const ts = entry.timestamp?.seconds ? new Date(entry.timestamp.seconds * 1000) : null;
                  return (
                    <div key={i} className={styles.timelineItem}>
                      <div className={styles.timelineDot}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--sell-primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="4"/></svg>
                      </div>
                      <div className={styles.timelineBody}>
                        <p className={styles.timelineStatus}>{STATUS_LABELS[entry.status as OrderStatus] ?? entry.status}</p>
                        <p className={styles.timelineTime}>{ts ? fmtDateTime(ts) : '—'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.slideoverFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SellOrdersPage() {
  const { user, storeConfig, showToast, refreshQuickStats } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [orders, setOrders]         = useState<StoreOrder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState<'all' | OrderStatus>('all');
  const [payFilter, setPayFilter]   = useState<'all' | PaymentStatus>('all');
  const [selected, setSelected]     = useState<StoreOrder | null>(null);

  const load = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const snap = await getDocs(collection(firestore, 'businesses', user.businessId, 'storeOrders'));
      const items = snap.docs.map(d => ({
        id: d.id, ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      })) as StoreOrder[];
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setOrders(items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user?.businessId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchPay    = payFilter === 'all'    || o.paymentStatus === payFilter;
    return matchSearch && matchStatus && matchPay;
  }), [orders, search, statusFilter, payFilter]);

  // Stats
  const pending   = orders.filter(o => o.status === 'paid' || o.status === 'processing').length;
  const revenue   = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  const delivered = orders.filter(o => o.status === 'delivered').length;

  const onUpdated = useCallback(async () => {
    await load();
    refreshQuickStats();
    setSelected(prev => {
      if (!prev) return null;
      const updated = orders.find(o => o.id === prev.id);
      return updated ?? null;
    });
  }, [load, refreshQuickStats, orders]);

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div><h2 className={styles.heading}>Orders</h2><p className={styles.sub}>Manage and fulfill orders from your store.</p></div>
        </div>

        {/* Stat strip */}
        <div className={styles.statStrip}>
          <div className={styles.statCard}><p className={styles.statLabel}>Pending</p><p className={styles.statValue}>{pending}</p><p className={styles.statSub}>Need action</p></div>
          <div className={styles.statCard}><p className={styles.statLabel}>Total orders</p><p className={styles.statValue}>{orders.length}</p><p className={styles.statSub}>All time</p></div>
          <div className={styles.statCard}><p className={styles.statLabel}>Revenue</p><p className={styles.statValue}>{fmt(revenue, currency)}</p><p className={styles.statSub}>Paid orders</p></div>
          <div className={styles.statCard}><p className={styles.statLabel}>Delivered</p><p className={styles.statValue}>{delivered}</p><p className={styles.statSub}>Completed</p></div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className={styles.searchInput} placeholder="Search orders, customers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatus(e.target.value as typeof statusFilter)}>
            <option value="all">All statuses</option>
            {(['paid','processing','shipped','delivered','cancelled','refunded'] as OrderStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select className={styles.filterSelect} value={payFilter} onChange={e => setPayFilter(e.target.value as typeof payFilter)}>
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <span className={styles.countPill}>{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.empty}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                Loading orders…
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <p className={styles.emptyTitle}>{orders.length === 0 ? 'No orders yet' : 'No results'}</p>
              <p className={styles.emptySub}>{orders.length === 0 ? 'Orders will appear here when customers complete a purchase.' : 'Try clearing your filters.'}</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead><tr>
                <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th style={{ width: 40 }} />
              </tr></thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)}>
                    <td><p className={styles.orderNum}>{o.orderNumber}</p><p className={styles.orderDate}>{fmtDate(o.createdAt)}</p></td>
                    <td><p className={styles.customer}>{o.customerName}</p><p className={styles.customerEmail}>{o.customerEmail}</p></td>
                    <td><span className={styles.itemCount}>{o.lineItems?.length ?? 0} item{(o.lineItems?.length ?? 0) !== 1 ? 's' : ''}</span></td>
                    <td><span className={styles.total}>{fmt(o.total, currency)}</span></td>
                    <td><span className={`${styles.badge} ${statusBadgeClass(o.status)}`}><span className={styles.badgeDot} />{STATUS_LABELS[o.status]}</span></td>
                    <td><span className={`${styles.badge} ${payBadgeClass(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className={styles.rowActions}>
                        <button className={styles.iconBtn} onClick={() => setSelected(o)} title="View order">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && user && (
        <OrderSlideOver
          order={selected}
          currency={currency}
          businessId={user.businessId}
          userId={user.id}
          onClose={() => setSelected(null)}
          onUpdated={onUpdated}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
