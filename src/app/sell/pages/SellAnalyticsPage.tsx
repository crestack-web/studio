'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import styles from './SellAnalyticsPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderData {
  total: number;
  paymentStatus: string;
  status: string;
  createdAt: Date;
  lineItems?: { displayName: string; quantity: number; lineTotal: number }[];
}

interface AnalyticsEvent {
  eventType: string;
  timestamp: { seconds: number };
  productId?: string;
}

interface DailyRevenue { label: string; amount: number; }
interface TopProduct   { name: string; units: number; revenue: number; }

function fmt(n: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : '$';
  if (n >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${s}${(n / 1_000).toFixed(1)}K`;
  return `${s}${n.toLocaleString()}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function SellAnalyticsPage() {
  const { user, storeConfig, navigateTo } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [orders, setOrders]     = useState<OrderData[]>([]);
  const [events, setEvents]     = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState<'30d' | '90d' | '12m'>('30d');

  const load = useCallback(async () => {
    if (!user?.businessId) return;
    setLoading(true);
    try {
      const { firestore } = initializeFirebase();
      const biz = user.businessId;

      // Orders
      const ordersSnap = await getDocs(collection(firestore, 'businesses', biz, 'storeOrders'));
      const orderList = ordersSnap.docs.map(d => ({
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      })) as OrderData[];
      setOrders(orderList);

      // Analytics events (last 500)
      const evSnap = await getDocs(
        query(collection(firestore, 'businesses', biz, 'storeAnalytics'),
          orderBy('timestamp', 'desc'), limit(500))
      );
      setEvents(evSnap.docs.map(d => d.data() as AnalyticsEvent));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user?.businessId]);

  useEffect(() => { load(); }, [load]);

  // ── Computed metrics ──────────────────────────────────────────────────────
  const now = new Date();

  const cutoff = useMemo(() => {
    const d = new Date();
    if (range === '30d') d.setDate(d.getDate() - 30);
    else if (range === '90d') d.setDate(d.getDate() - 90);
    else d.setFullYear(d.getFullYear() - 1);
    return d;
  }, [range]);

  const rangeOrders = useMemo(
    () => orders.filter(o => o.createdAt >= cutoff && o.paymentStatus === 'paid'),
    [orders, cutoff]
  );

  const totalRevenue = rangeOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalOrders  = rangeOrders.length;
  const uniqueCustomers = new Set(orders.map(o => (o as any).customerEmail).filter(Boolean)).size;

  // Checkout sessions (initiated events) vs completed orders for conversion
  const checkoutInitiated = events.filter(e => e.eventType === 'checkout_initiated').length;
  const conversionRate    = checkoutInitiated > 0 ? ((totalOrders / checkoutInitiated) * 100).toFixed(1) : '—';

  // ── Daily/monthly revenue chart data ─────────────────────────────────────
  const chartData = useMemo((): DailyRevenue[] => {
    if (range === '12m') {
      const buckets: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets[`${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`] = 0;
      }
      rangeOrders.forEach(o => {
        const key = `${MONTHS[o.createdAt.getMonth()]} ${o.createdAt.getFullYear().toString().slice(2)}`;
        if (key in buckets) buckets[key] = (buckets[key] ?? 0) + (o.total ?? 0);
      });
      return Object.entries(buckets).map(([label, amount]) => ({ label, amount }));
    }
    const days = range === '30d' ? 30 : 90;
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      buckets[key] = 0;
    }
    rangeOrders.forEach(o => {
      const key = `${o.createdAt.getDate()}/${o.createdAt.getMonth() + 1}`;
      if (key in buckets) buckets[key] = (buckets[key] ?? 0) + (o.total ?? 0);
    });
    const entries = Object.entries(buckets).map(([label, amount]) => ({ label, amount }));
    // Show every Nth label to avoid crowding
    const step = range === '30d' ? 5 : 10;
    return entries.map((e, i) => ({ ...e, label: i % step === 0 ? e.label : '' }));
  }, [rangeOrders, range]);

  const chartMax = Math.max(...chartData.map(d => d.amount), 1);

  // ── Top products ──────────────────────────────────────────────────────────
  const topProducts = useMemo((): TopProduct[] => {
    const map: Record<string, TopProduct> = {};
    rangeOrders.forEach(o => {
      (o.lineItems ?? []).forEach(item => {
        if (!map[item.displayName]) map[item.displayName] = { name: item.displayName, units: 0, revenue: 0 };
        map[item.displayName].units   += item.quantity;
        map[item.displayName].revenue += item.lineTotal;
      });
    });
    return Object.values(map).sort((a, b) => b.units - a.units).slice(0, 5);
  }, [rangeOrders]);

  const topUnits = topProducts[0]?.units ?? 1;

  // ── Funnel ────────────────────────────────────────────────────────────────
  const pageViews   = events.filter(e => e.eventType === 'page_view').length;
  const addToCart   = events.filter(e => e.eventType === 'add_to_cart').length;
  const funnelMax   = Math.max(pageViews, 1);
  const funnelSteps = [
    { label: 'Page views',          count: pageViews,          color: '#0EA5E9' },
    { label: 'Add to cart',         count: addToCart,           color: '#6366F1' },
    { label: 'Checkout initiated',  count: checkoutInitiated,   color: '#8B5CF6' },
    { label: 'Orders completed',    count: totalOrders,         color: '#16A34A' },
  ];

  const liveUrl = storeConfig?.customDomainStatus === 'verified' && storeConfig?.customDomain
    ? `https://${storeConfig.customDomain}`
    : storeConfig?.storeSlug ? `busmo.io/store/${storeConfig.storeSlug}` : null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}><div><h2 className={styles.heading}>Analytics</h2></div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sell-text-3)', fontSize: '0.875rem', padding: '40px 0' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          Loading analytics…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div><h2 className={styles.heading}>Analytics</h2><p className={styles.sub}>How your store is performing.</p></div>
        <select className={styles.filterSelect} value={range} onChange={e => setRange(e.target.value as typeof range)}>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="12m">Last 12 months</option>
        </select>
      </div>

      {/* Store URL card */}
      {liveUrl && (
        <div className={styles.urlCard}>
          <div className={styles.urlCardIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
          </div>
          <div className={styles.urlCardBody}>
            <p className={styles.urlCardTitle}>Your store is live</p>
            <p className={styles.urlCardUrl}>{liveUrl}</p>
          </div>
          <div className={styles.urlCardActions}>
            <a href={`/store/${storeConfig?.storeSlug}`} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnPrimary}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              View store
            </a>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => navigateTo('settings')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33"/></svg>
              Settings
            </button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Revenue', value: fmt(totalRevenue, currency), sub: `${range} · paid orders`,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
            bg: 'var(--sell-primary-lt)', color: 'var(--sell-primary)' },
          { label: 'Orders', value: String(totalOrders), sub: 'Completed & paid',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
            bg: 'var(--sell-amber-bg)', color: 'var(--sell-amber)' },
          { label: 'Customers', value: String(uniqueCustomers), sub: 'All time unique',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
            bg: 'var(--sell-teal-bg)', color: 'var(--sell-teal)' },
          { label: 'Conversion', value: conversionRate === '—' ? '—' : `${conversionRate}%`, sub: 'Checkout → Order',
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
            bg: 'var(--sell-green-bg)', color: 'var(--sell-green)' },
        ].map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: k.bg, color: k.color }}>{k.icon}</div>
            <div className={styles.kpiBody}>
              <p className={styles.kpiLabel}>{k.label}</p>
              <p className={styles.kpiValue}>{k.value}</p>
              <p className={styles.kpiSub}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className={styles.chartCard}>
        <p className={styles.chartTitle}>Revenue — {range === '30d' ? 'last 30 days' : range === '90d' ? 'last 90 days' : 'last 12 months'}</p>
        {totalRevenue === 0 ? (
          <div className={styles.emptyChart}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <p>No revenue data for this period yet</p>
          </div>
        ) : (
          <div className={styles.chartArea}>
            {chartData.map((d, i) => (
              <div key={i} className={styles.chartBarWrap}>
                <div className={styles.chartBar} style={{ height: `${Math.max((d.amount / chartMax) * 180, 4)}px` }} title={d.amount > 0 ? fmt(d.amount, currency) : ''} />
                <span className={styles.chartBarLabel}>{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Funnel + Top products */}
      <div className={styles.twoCol}>
        {/* Funnel */}
        <div className={styles.funnelCard}>
          <p className={styles.funnelTitle}>Conversion funnel</p>
          {pageViews === 0 ? (
            <div style={{ color: 'var(--sell-text-3)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No storefront activity recorded yet</div>
          ) : funnelSteps.map(step => (
            <div key={step.label} className={styles.funnelStep}>
              <div className={styles.funnelBar} style={{ background: step.color, width: `${Math.max((step.count / funnelMax) * 100, 8)}%`, minWidth: 0 }}>
                {step.count > 0 && step.count}
              </div>
              <span className={styles.funnelMeta}>{step.label}</span>
            </div>
          ))}
        </div>

        {/* Top products */}
        <div className={styles.topCard}>
          <p className={styles.topCardTitle}>Top products</p>
          {topProducts.length === 0 ? (
            <div style={{ color: 'var(--sell-text-3)', fontSize: '0.85rem', padding: '20px 16px' }}>No product sales in this period</div>
          ) : (
            <table className={styles.topTable}>
              <thead><tr><th>#</th><th>Product</th><th>Units</th><th>Revenue</th></tr></thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td><span className={styles.rank}>{i + 1}</span></td>
                    <td>
                      <span className={styles.topProductName}>{p.name}</span>
                      {i === 0 && <span className={styles.topBadge}>Top</span>}
                      <div className={styles.bar} style={{ width: `${(p.units / topUnits) * 100}%`, marginTop: 4 }} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.units}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(p.revenue, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
