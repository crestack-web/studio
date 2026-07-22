'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import styles from './SellEarningsPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Earning {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  status: 'pending' | 'available' | 'paid_out';
  payoutRequestId: string | null;
  createdAt: Date;
}

interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  earningIds: string[];
  status: 'requested' | 'processing' | 'completed' | 'rejected';
  rejectionReason: string | null;
  processedAt: Date | null;
  createdAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMMISSION_RATE = 0.05;

function fmt(n: number, currency = 'NGN') {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number) { return `${(n * 100).toFixed(0)}%`; }

function statusBadge(status: Earning['status']) {
  const map = {
    pending:   { bg: 'var(--sell-amber-bg)',  color: 'var(--sell-amber)',  label: 'Pending' },
    available: { bg: 'var(--sell-green-bg)',  color: 'var(--sell-green)',  label: 'Available' },
    paid_out:  { bg: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', label: 'Paid out' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 100,
      background: s.bg, color: s.color,
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
}

function payoutStatusBadge(status: PayoutRequest['status']) {
  const map = {
    requested:  { bg: 'var(--sell-amber-bg)',   color: 'var(--sell-amber)',   label: 'Requested' },
    processing: { bg: 'var(--sell-primary-lt)',  color: 'var(--sell-primary)', label: 'Processing' },
    completed:  { bg: 'var(--sell-green-bg)',    color: 'var(--sell-green)',   label: 'Completed' },
    rejected:   { bg: 'var(--sell-red-bg)',      color: 'var(--sell-red)',     label: 'Rejected' },
  };
  const s = map[status] ?? map.requested;
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 100,
      background: s.bg, color: s.color,
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SellEarningsPage() {
  const { user, storeConfig, navigateTo, showToast } = useSell();

  const [earnings,      setEarnings]      = useState<Earning[]>([]);
  const [payouts,       setPayouts]       = useState<PayoutRequest[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [requesting,    setRequesting]    = useState(false);
  const [tab,           setTab]           = useState<'earnings' | 'payouts'>('earnings');
  const [confirmOpen,   setConfirmOpen]   = useState(false);

  const managedPayments = (storeConfig as any)?.managedPayments === true;
  const currency = storeConfig?.currency ?? 'NGN';

  // Promote pending → available after 24 h (client-side convenience update)
  const promoteEarnings = useCallback(async (biz: string, items: Earning[]) => {
    const { firestore } = initializeFirebase();
    const now = Date.now();
    const toPromote = items.filter(e =>
      e.status === 'pending' &&
      now - e.createdAt.getTime() >= 24 * 60 * 60 * 1000
    );
    for (const e of toPromote) {
      await updateDoc(
        doc(firestore, 'businesses', biz, 'storeEarnings', e.id),
        { status: 'available', updatedAt: serverTimestamp() }
      );
      e.status = 'available';
    }
    return [...items];
  }, []);

  const load = useCallback(async () => {
    if (!user?.businessId) return;
    setLoading(true);
    try {
      const { firestore } = initializeFirebase();
      const biz = user.businessId;

      // Earnings
      const eSnap = await getDocs(
        query(collection(firestore, 'businesses', biz, 'storeEarnings'), orderBy('createdAt', 'desc'))
      );
      const rawEarnings: Earning[] = eSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Earning, 'id' | 'createdAt'>),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      }));
      const promoted = await promoteEarnings(biz, rawEarnings);
      setEarnings(promoted);

      // Payout requests
      const pSnap = await getDocs(
        query(collection(firestore, 'businesses', biz, 'payoutRequests'), orderBy('createdAt', 'desc'))
      );
      setPayouts(pSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<PayoutRequest, 'id' | 'createdAt' | 'processedAt'>),
        createdAt:   d.data().createdAt?.toDate?.() ?? new Date(),
        processedAt: d.data().processedAt?.toDate?.() ?? null,
      })));
    } catch (err) {
      console.error('[SellEarningsPage] load error:', err);
      showToast('Failed to load earnings', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.businessId, promoteEarnings, showToast]);

  useEffect(() => { load(); }, [load]);

  // Stats
  const totalGross     = earnings.reduce((s, e) => s + e.grossAmount, 0);
  const totalCommission = earnings.reduce((s, e) => s + e.commissionAmount, 0);
  const totalNet       = earnings.reduce((s, e) => s + e.netAmount, 0);
  const available      = earnings.filter(e => e.status === 'available').reduce((s, e) => s + e.netAmount, 0);
  const pendingCount   = earnings.filter(e => e.status === 'pending').length;
  const availableCount = earnings.filter(e => e.status === 'available').length;

  const hasAvailable = availableCount > 0;

  const handleRequestPayout = useCallback(async () => {
    if (!user?.businessId) return;
    const config = storeConfig as any;
    if (!config?.payoutBankName || !config?.payoutAccountNumber || !config?.payoutAccountName) {
      showToast('Add your bank account in Settings before requesting a payout.', 'error');
      navigateTo('settings');
      return;
    }
    setRequesting(true);
    setConfirmOpen(false);
    try {
      const res = await fetch('/api/sell/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId }),
      });
      const data = await res.json() as { payoutRequestId?: string; amount?: number; error?: string };
      if (!res.ok) {
        showToast(data.error ?? 'Payout request failed', 'error');
        return;
      }
      showToast(`Payout of ${fmt(data.amount ?? 0, currency)} requested! We'll process it within 1–3 business days.`, 'success');
      await load();
      setTab('payouts');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setRequesting(false);
    }
  }, [user?.businessId, storeConfig, currency, load, showToast, navigateTo]);

  // ── Not opted in ──────────────────────────────────────────────────────────
  if (!managedPayments) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.heading}>Earnings</h2>
          <p className={styles.sub}>Track sales commissions and request payouts.</p>
        </div>
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>Enable Managed Payments first</p>
          <p className={styles.emptySub}>
            Turn on Managed Payments in Settings to let Busmo collect payments on your behalf.
            A 5% commission is charged per sale — your net earnings appear here and you can request a payout anytime.
          </p>
          <button
            className={styles.btnPrimary}
            onClick={() => navigateTo('settings')}
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading earnings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Earnings</h2>
          <p className={styles.sub}>Busmo collects on your behalf and charges {pct(COMMISSION_RATE)} commission per sale.</p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => setConfirmOpen(true)}
          disabled={!hasAvailable || requesting}
        >
          {requesting ? (
            <><span className={styles.spinner} />Processing…</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 11 21 7 17 3"/><path d="M21 7H3"/>
                <polyline points="7 21 3 17 7 13"/><path d="M15 17H3"/>
              </svg>
              Request payout {hasAvailable ? `(${fmt(available, currency)})` : ''}
            </>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Sales</p>
          <p className={styles.statValue}>{fmt(totalGross, currency)}</p>
          <p className={styles.statSub}>{earnings.length} order{earnings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Commission ({pct(COMMISSION_RATE)})</p>
          <p className={[styles.statValue, styles.statValueRed].join(' ')}>−{fmt(totalCommission, currency)}</p>
          <p className={styles.statSub}>Platform fee deducted</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Earnings</p>
          <p className={[styles.statValue, styles.statValueGreen].join(' ')}>{fmt(totalNet, currency)}</p>
          <p className={styles.statSub}>After {pct(COMMISSION_RATE)} commission</p>
        </div>
        <div className={[styles.statCard, styles.statCardHighlight].join(' ')}>
          <p className={styles.statLabel}>Available to Payout</p>
          <p className={[styles.statValue, styles.statValuePrimary].join(' ')}>{fmt(available, currency)}</p>
          <p className={styles.statSub}>
            {pendingCount > 0 && `${pendingCount} pending (clears in 24h)`}
            {pendingCount === 0 && availableCount === 0 && 'No earnings yet'}
            {pendingCount === 0 && availableCount > 0 && `${availableCount} earning${availableCount !== 1 ? 's' : ''} ready`}
          </p>
        </div>
      </div>

      {/* Info note about pending → available */}
      {pendingCount > 0 && (
        <div className={styles.infoBanner}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{pendingCount} earning{pendingCount !== 1 ? 's are' : ' is'} pending — funds become available 24 hours after the sale to allow for refunds.</span>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={[styles.tab, tab === 'earnings' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('earnings')}>
          Earnings
          {earnings.length > 0 && <span className={styles.tabBadge}>{earnings.length}</span>}
        </button>
        <button className={[styles.tab, tab === 'payouts' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('payouts')}>
          Payout History
          {payouts.length > 0 && <span className={styles.tabBadge}>{payouts.length}</span>}
        </button>
      </div>

      {/* Earnings table */}
      {tab === 'earnings' && (
        earnings.length === 0 ? (
          <div className={styles.tableEmpty}>
            <p>No earnings yet. Sales will appear here once orders are paid.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className={styles.thRight}>Sale</th>
                  <th className={styles.thRight}>Commission</th>
                  <th className={styles.thRight}>You Earn</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map(e => (
                  <tr key={e.id}>
                    <td><span className={styles.orderNum}>{e.orderNumber}</span></td>
                    <td>{e.customerName}</td>
                    <td className={styles.dateCell}>{e.createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className={styles.tdRight}>{fmt(e.grossAmount, currency)}</td>
                    <td className={[styles.tdRight, styles.commission].join(' ')}>−{fmt(e.commissionAmount, currency)}</td>
                    <td className={[styles.tdRight, styles.netAmount].join(' ')}>{fmt(e.netAmount, currency)}</td>
                    <td>{statusBadge(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Payout history */}
      {tab === 'payouts' && (
        payouts.length === 0 ? (
          <div className={styles.tableEmpty}>
            <p>No payout requests yet. Click &quot;Request payout&quot; when you have available earnings.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bank</th>
                  <th>Account</th>
                  <th className={styles.thRight}>Amount</th>
                  <th>Orders</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p.id}>
                    <td className={styles.dateCell}>{p.createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{p.bankName}</td>
                    <td><span className={styles.acctNum}>{p.accountNumber}</span> · {p.accountName}</td>
                    <td className={[styles.tdRight, styles.netAmount].join(' ')}>{fmt(p.amount, currency)}</td>
                    <td>{p.earningIds.length}</td>
                    <td>
                      {payoutStatusBadge(p.status)}
                      {p.status === 'rejected' && p.rejectionReason && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--sell-red)', marginTop: 3 }}>{p.rejectionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Confirm payout modal */}
      {confirmOpen && (
        <div className={styles.modalBackdrop} onClick={() => setConfirmOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirm Payout Request</h3>
            <p className={styles.modalBody}>
              You&apos;re requesting a payout of <strong>{fmt(available, currency)}</strong> from {availableCount} earning{availableCount !== 1 ? 's' : ''}.
            </p>
            <p className={styles.modalBody} style={{ marginTop: 8 }}>
              Funds will be sent to <strong>{(storeConfig as any)?.payoutAccountName}</strong> at <strong>{(storeConfig as any)?.payoutBankName}</strong> ({(storeConfig as any)?.payoutAccountNumber}) within 1–3 business days.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleRequestPayout} disabled={requesting}>
                {requesting ? 'Processing…' : 'Confirm payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
