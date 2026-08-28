'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { CashReconciliation, detectShift, Shift } from './types';
import { fetchDocs } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import styles from './CashReconciliationPage.module.css';

interface SaleData {
  id: string;
  totalRevenue: number;
  paymentBreakdown?: any[];
  createdAt: Date;
  recordedBy?: string;
  recordedByName?: string;
  shift?: Shift;
  paymentMethod?: string;
}

function toDate(v: any): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : new Date();
}

/** Cash portion of a sale from breakdown, paymentMethods map, or single cash method */
function cashAmountFromSale(sale: any, meta: any = {}): number {
  const breakdown =
    sale.paymentBreakdown ||
    meta.paymentBreakdown ||
    sale.payment_breakdown ||
    [];
  if (Array.isArray(breakdown) && breakdown.length > 0) {
    return breakdown
      .filter((pb: any) => String(pb.method || '').toLowerCase() === 'cash')
      .reduce((s: number, pb: any) => s + (Number(pb.amount) || 0), 0);
  }
  const methods = sale.paymentMethods || meta.paymentMethods || {};
  if (methods && typeof methods === 'object' && methods.cash != null) {
    return Number(methods.cash) || 0;
  }
  const method = String(
    sale.paymentMethod || sale.payment_method || meta.paymentMethod || ''
  ).toLowerCase();
  const total =
    Number(
      sale.totalRevenue ??
        sale.total_revenue ??
        sale.total ??
        sale.total_amount ??
        meta.totalRevenue ??
        meta.total ??
        0
    ) || 0;
  if (method === 'cash') return total;
  return 0;
}

interface StaffData {
  id: string;
  name: string;
}

export default function CashReconciliationPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [reconciliations, setReconciliations] = useState<CashReconciliation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedCash, setExpectedCash] = useState(0);
  const [actualCash, setActualCash] = useState(0);
  const [notes, setNotes] = useState('');
  const [shift, setShift] = useState<Shift>('morning');
  const [salesForShift, setSalesForShift] = useState<SaleData[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, StaffData>>({});
  const [autoCalculated, setAutoCalculated] = useState(false);

  const resolveBusinessId = () =>
    String(user.businessId || user.id || '').trim();

  useEffect(() => {
    loadReconciliations();
    loadStaffData();
  }, [user.businessId, user.id]);

  useEffect(() => {
    if (selectedDate && shift) {
      loadSalesForShift();
    }
  }, [selectedDate, shift, user.businessId]);

  const loadStaffData = async () => {
    if (!resolveBusinessId()) return;
    try {
      const rows = await fetchDocs(`businesses/${resolveBusinessId()}/staff`);
      const staff: Record<string, StaffData> = {};
      for (const data of rows as any[]) {
        const id = String(data.id || '');
        const name = data.name || 'Unknown';
        if (id) staff[id] = { id, name };
        if (data.staffId) staff[String(data.staffId)] = { id: String(data.staffId), name };
        if (data.userId || data.user_id) {
          staff[String(data.userId || data.user_id)] = {
            id: String(data.userId || data.user_id),
            name,
          };
        }
      }
      setStaffMap(staff);
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  };

  const loadSalesForShift = async () => {
    if (!resolveBusinessId() || !selectedDate) return;

    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      const startMs = startDate.getTime();
      const endMs = endDate.getTime();

      const rows = await fetchDocs(`businesses/${resolveBusinessId()}/sales`);

      const sales: SaleData[] = (rows as any[])
        .map((data) => {
          const meta =
            data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
          const saleDate = toDate(
            data.createdAt || data.created_at || meta.createdAt
          );
          const ms = saleDate.getTime();
          if (ms < startMs || ms > endMs) return null;

          const recordedBy =
            meta.soldBy ||
            meta.recordedBy?.uid ||
            meta.recordedBy?.staffId ||
            data.soldBy ||
            data.staffId ||
            '';
          const recordedByName =
            meta.soldByName ||
            meta.recordedBy?.displayName ||
            meta.recordedBy?.name ||
            '';

          const totalRevenue =
            Number(
              data.totalRevenue ??
                data.total_revenue ??
                data.total ??
                data.total_amount ??
                meta.totalRevenue ??
                meta.total ??
                0
            ) || 0;

          const paymentBreakdown =
            data.paymentBreakdown ||
            meta.paymentBreakdown ||
            (meta.paymentMethods
              ? Object.entries(meta.paymentMethods).map(([method, amount]) => ({
                  method,
                  amount: Number(amount) || 0,
                }))
              : []);

          // Ensure cash is represented when payment method is cash only
          let breakdown = Array.isArray(paymentBreakdown) ? [...paymentBreakdown] : [];
          if (
            breakdown.length === 0 &&
            String(data.paymentMethod || data.payment_method || meta.paymentMethod || '').toLowerCase() ===
              'cash' &&
            totalRevenue > 0
          ) {
            breakdown = [{ method: 'cash', amount: totalRevenue }];
          }

          return {
            id: String(data.id),
            totalRevenue,
            paymentBreakdown: breakdown,
            createdAt: saleDate,
            recordedBy: recordedBy ? String(recordedBy) : undefined,
            recordedByName: recordedByName ? String(recordedByName) : undefined,
            shift: detectShift(saleDate),
            paymentMethod: String(
              data.paymentMethod || data.payment_method || meta.paymentMethod || ''
            ),
          } as SaleData;
        })
        .filter(Boolean) as SaleData[];

      const shiftSales = sales.filter((sale) => sale.shift === shift);
      // Newest first
      shiftSales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setSalesForShift(shiftSales);

      const expectedCashFromSales = shiftSales.reduce((sum, sale) => {
        const meta = {};
        return sum + cashAmountFromSale(sale, meta);
      }, 0);

      setExpectedCash(expectedCashFromSales);
      setAutoCalculated(true);
    } catch (error) {
      console.error('Error loading sales for shift:', error);
      setSalesForShift([]);
      setExpectedCash(0);
    }
  };

  const loadReconciliations = async () => {
    const businessId = resolveBusinessId();
    if (!businessId) return;

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setReconciliations([]);
        return;
      }
      const res = await fetch(
        `/api/cash-reconciliation?businessId=${encodeURIComponent(businessId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load reconciliations');
      }
      const recs: CashReconciliation[] = (json.reconciliations || []).map((data: any) => ({
        id: String(data.id),
        merchantId: data.merchantId || businessId,
        staffId: data.staffId || user.id,
        date: toDate(data.date),
        expectedCash: Number(data.expectedCash) || 0,
        actualCash: Number(data.actualCash) || 0,
        variance: Number(data.variance) || 0,
        notes: data.notes || '',
        shift: data.shift || '',
        reconciledBy: data.reconciledBy || '',
        reconciledAt: toDate(data.reconciledAt || data.date),
      }));
      setReconciliations(recs);
    } catch (error) {
      console.error('Error loading reconciliations:', error);
      showToast('Failed to load reconciliations');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    const businessId = resolveBusinessId();
    if (!businessId) {
      showToast('Business ID not found');
      return;
    }

    const variance = actualCash - expectedCash;

    try {
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        showToast('Session expired. Please sign in again.');
        return;
      }

      const saleIds = salesForShift.map((s) => s.id);
      const res = await fetch('/api/cash-reconciliation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          date: new Date(selectedDate).toISOString(),
          expectedCash,
          actualCash,
          variance,
          notes,
          shift,
          saleIds,
          salesCount: salesForShift.length,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || json.message || `Save failed (${res.status})`);
      }

      showToast('Cash reconciliation saved successfully');
      setExpectedCash(0);
      setActualCash(0);
      setNotes('');
      setAutoCalculated(false);
      loadReconciliations();
      loadSalesForShift();
    } catch (error: any) {
      console.error('Error saving reconciliation:', error);
      showToast(error?.message || 'Failed to save reconciliation');
    }
  };

  const variance = actualCash - expectedCash;
  const variancePercent = expectedCash > 0 ? ((variance / expectedCash) * 100).toFixed(2) : '0';

  const ReconciliationRow = ({ rec }: { rec: CashReconciliation }) => (
    <div className={styles.reconciliationRow}>
      <div className={styles.recDate}>{rec.date.toLocaleDateString()}</div>
      <div className={styles.recShift}>{rec.shift}</div>
      <div className={styles.recExpected}>{formatMoney(rec.expectedCash)}</div>
      <div className={styles.recActual}>{formatMoney(rec.actualCash)}</div>
      <div className={`${styles.recVariance} ${rec.variance >= 0 ? styles.positive : styles.negative}`}>
        {rec.variance >= 0 ? '+' : ''}{formatMoney(rec.variance)}
      </div>
      <div className={styles.recNotes}>{rec.notes || '-'}</div>
    </div>
  );

  const SalesRow = ({ sale }: { sale: SaleData }) => {
    const staffName =
      sale.recordedByName ||
      (sale.recordedBy ? staffMap[sale.recordedBy]?.name : '') ||
      'Staff';
    const cashAmount = cashAmountFromSale(sale, {});

    return (
      <div className={styles.saleRow}>
        <div className={styles.saleTime}>
          {sale.createdAt?.toLocaleTimeString?.() || '—'}
        </div>
        <div className={styles.saleStaff}>{staffName}</div>
        <div className={styles.saleTotal}>{formatMoney(sale.totalRevenue)}</div>
        <div className={styles.saleCash}>{formatMoney(cashAmount)}</div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Cash Reconciliation</h1>
          <p className={styles.pageDesc}>Track daily cash collections and identify variances</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('money-control')}>← Back to Money Control</Button>
      </div>

      <div className={styles.content}>
        {/* New Reconciliation Form */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--green-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </CardIcon>
            New Cash Reconciliation
          </CardHeader>
          
          <div className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Shift</label>
                <select
                  className={styles.formInput}
                  value={shift}
                  onChange={(e) => setShift(e.target.value as any)}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Expected Cash</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={expectedCash}
                  onChange={(e) => {
                    setExpectedCash(Number(e.target.value));
                    setAutoCalculated(false);
                  }}
                  placeholder="0.00"
                />
                {autoCalculated && (
                  <div className={styles.autoCalculatedBadge}>
                    ✓ Auto-calculated from {salesForShift.length} sales
                  </div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Actual Cash</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className={styles.varianceDisplay}>
              <div className={styles.varianceLabel}>Variance</div>
              <div className={`${styles.varianceValue} ${variance >= 0 ? styles.positive : styles.negative}`}>
                {variance >= 0 ? '+' : ''}{formatMoney(variance)} ({variancePercent}%)
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notes (Optional)</label>
              <input
                className={styles.formInput}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this reconciliation..."
              />
            </div>

            <Button variant="primary" onClick={handleReconcile} className={styles.submitBtn}>
              Save Reconciliation
            </Button>
          </div>
        </Card>

        {/* Sales for Selected Shift */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </CardIcon>
            Sales for {shift.charAt(0).toUpperCase() + shift.slice(1)} Shift ({selectedDate})
          </CardHeader>
          
          {salesForShift.length === 0 ? (
            <div className={styles.empty}>No sales recorded for this shift</div>
          ) : (
            <div className={styles.tableScroll}>
              <div className={styles.salesList}>
                <div className={styles.salesHeader}>
                  <div className={styles.headerTime}>Time</div>
                  <div className={styles.headerStaff}>Staff</div>
                  <div className={styles.headerTotal}>Total</div>
                  <div className={styles.headerCash}>Cash</div>
                </div>
                {salesForShift.map(sale => (
                  <SalesRow key={sale.id} sale={sale} />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Reconciliation History */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </CardIcon>
            Reconciliation History
          </CardHeader>
          
          {loading ? (
            <div className={styles.loading}>Loading…</div>
          ) : reconciliations.length === 0 ? (
            <div className={styles.empty}>No reconciliations yet</div>
          ) : (
            <div className={styles.tableScroll}>
              <div className={styles.reconciliationsList}>
                <div className={styles.reconciliationHeader}>
                  <div className={styles.headerDate}>Date</div>
                  <div className={styles.headerShift}>Shift</div>
                  <div className={styles.headerExpected}>Expected</div>
                  <div className={styles.headerActual}>Actual</div>
                  <div className={styles.headerVariance}>Variance</div>
                  <div className={styles.headerNotes}>Notes</div>
                </div>
                {reconciliations.map(rec => (
                  <ReconciliationRow key={rec.id} rec={rec} />
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

