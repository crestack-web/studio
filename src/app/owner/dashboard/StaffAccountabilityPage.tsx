'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { StaffAccountability } from './types';
import { fetchDocs } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import styles from './StaffAccountabilityPage.module.css';

function cashFromSale(sale: any): number {
  const meta = sale.metadata && typeof sale.metadata === 'object' ? sale.metadata : {};
  const breakdown =
    sale.paymentBreakdown ||
    sale.payment_breakdown ||
    meta.paymentBreakdown ||
    meta.paymentMethods ||
    [];
  if (Array.isArray(breakdown) && breakdown.length) {
    return breakdown.reduce((sum: number, pb: any) => {
      const method = String(pb.method || pb.type || '').toLowerCase();
      const amt = Number(pb.amount ?? pb.value ?? 0) || 0;
      if (method === 'cash') return sum + amt;
      if (method === 'split') return sum + amt * 0.5;
      return sum;
    }, 0);
  }
  const method = String(
    sale.paymentMethod || sale.payment_method || meta.paymentMethod || 'cash'
  ).toLowerCase();
  const total =
    Number(
      sale.totalRevenue ??
        sale.total_revenue ??
        sale.total ??
        sale.total_amount ??
        meta.totalRevenue ??
        0
    ) || 0;
  if (method === 'cash') return total;
  if (method === 'split') return total * 0.5;
  return 0;
}

function bankFromSale(sale: any): number {
  const meta = sale.metadata && typeof sale.metadata === 'object' ? sale.metadata : {};
  const breakdown =
    sale.paymentBreakdown ||
    sale.payment_breakdown ||
    meta.paymentBreakdown ||
    meta.paymentMethods ||
    [];
  if (Array.isArray(breakdown) && breakdown.length) {
    return breakdown.reduce((sum: number, pb: any) => {
      const method = String(pb.method || pb.type || '').toLowerCase();
      const amt = Number(pb.amount ?? pb.value ?? 0) || 0;
      if (method === 'transfer' || method === 'pos' || method === 'card') return sum + amt;
      if (method === 'split') return sum + amt * 0.5;
      return sum;
    }, 0);
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
        0
    ) || 0;
  if (['transfer', 'pos', 'card'].includes(method)) return total;
  if (method === 'split') return total * 0.5;
  return 0;
}

function creditFromSale(sale: any): number {
  const method = String(
    sale.paymentMethod || sale.payment_method || sale.metadata?.paymentMethod || ''
  ).toLowerCase();
  if (method !== 'credit') return 0;
  return (
    Number(sale.totalRevenue ?? sale.total_revenue ?? sale.total ?? sale.total_amount ?? 0) || 0
  );
}

function staffFromSale(sale: any): { id: string; name: string } {
  const meta = sale.metadata && typeof sale.metadata === 'object' ? sale.metadata : {};
  const recorded = meta.recordedBy || sale.recordedBy || {};
  const id = String(
    meta.soldBy ||
      recorded.uid ||
      recorded.staffId ||
      sale.soldBy ||
      sale.staffId ||
      sale.user_id ||
      'unknown'
  );
  const name = String(
    meta.soldByName ||
      recorded.displayName ||
      recorded.name ||
      sale.soldByName ||
      sale.staffName ||
      'Staff'
  );
  return { id, name };
}

export default function StaffAccountabilityPage() {
  const { user, showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [accountabilityData, setAccountabilityData] = useState<StaffAccountability[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>(
    'month'
  );

  const businessId = String(user?.businessId || user?.id || '').trim();

  const loadAccountabilityData = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      let startDate = new Date();
      if (selectedPeriod === 'week') startDate.setDate(startDate.getDate() - 7);
      else if (selectedPeriod === 'month') startDate.setMonth(startDate.getMonth() - 1);
      else if (selectedPeriod === 'quarter') startDate.setMonth(startDate.getMonth() - 3);
      else startDate.setFullYear(startDate.getFullYear() - 1);
      const startMs = startDate.getTime();

      const salesRaw = await fetchDocs(`businesses/${businessId}/sales`, {
        orderBy: { field: 'created_at', ascending: false },
        limit: 500,
      });
      const sales = (salesRaw as any[]).filter((s) => {
        const raw = s.createdAt || s.created_at;
        const ms = raw ? new Date(raw).getTime() : 0;
        return !ms || ms >= startMs;
      });

      // Load reconciliations from same API as cash recon save
      let reconciliations: any[] = [];
      try {
        const supabase = getSupabase();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          const res = await fetch(
            `/api/cash-reconciliation?businessId=${encodeURIComponent(businessId)}`,
            { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
          );
          const json = await res.json().catch(() => ({}));
          if (res.ok) reconciliations = json.reconciliations || [];
        }
      } catch (e) {
        console.warn('[StaffAccountability] recon load', e);
      }
      if (!reconciliations.length) {
        try {
          reconciliations = (await fetchDocs(
            `businesses/${businessId}/cashReconciliations`
          )) as any[];
        } catch {
          reconciliations = [];
        }
      }

      // Shift closes from staff clock-out (pending cash until reconciled)
      let shiftCloses: any[] = [];
      try {
        const { data: biz } = await getSupabase()
          .from('businesses')
          .select('metadata')
          .eq('id', businessId)
          .maybeSingle();
        const meta =
          biz?.metadata && typeof biz.metadata === 'object' ? (biz.metadata as any) : {};
        shiftCloses = Array.isArray(meta.shiftCloses) ? meta.shiftCloses : [];
        shiftCloses = shiftCloses.filter((sc: any) => {
          const raw = sc.checkOut || sc.createdAt;
          const ms = raw ? new Date(raw).getTime() : 0;
          return !ms || ms >= startMs;
        });
      } catch (e) {
        console.warn('[StaffAccountability] shiftCloses', e);
      }

      // saleId → actual cash attributed after reconciliation
      const saleToCashMap = new Map<string, number>();
      const reconciledSaleIds = new Set<string>();
      // staffId → shortage recorded on recon variance (negative only)
      const staffShortageFromRecon = new Map<string, number>();

      for (const rec of reconciliations) {
        const meta =
          rec.metadata && typeof rec.metadata === 'object' ? rec.metadata : {};
        const saleIds: string[] = rec.saleIds || meta.saleIds || rec.sale_ids || [];
        const actualCash =
          Number(rec.actualCash ?? meta.actualCash ?? rec.actual_cash ?? 0) || 0;
        const expectedCash =
          Number(rec.expectedCash ?? meta.expectedCash ?? rec.expected_cash ?? 0) || 0;
        const variance =
          Number(rec.variance ?? meta.variance ?? actualCash - expectedCash) || 0;

        if (Array.isArray(saleIds) && saleIds.length > 0) {
          // Distribute actual cash across sales (clears shortage when actual matches)
          const perSale = actualCash / saleIds.length;
          for (const sid of saleIds) {
            if (!sid) continue;
            reconciledSaleIds.add(String(sid));
            saleToCashMap.set(String(sid), (saleToCashMap.get(String(sid)) || 0) + perSale);
          }
        }

        // Attribute residual shortage to staff on those sales after distribution
        if (variance < 0 && saleIds.length) {
          // shortage already reflected as expected - actual per sale
        }
      }

      const staffMap = new Map<string, any>();

      for (const sale of sales) {
        const { id: staffId, name: staffName } = staffFromSale(sale);
        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            staffId,
            staffName,
            salesRecorded: 0,
            expectedCash: 0,
            cashSubmitted: 0,
            bankCollections: 0,
            shortages: 0,
            outstandingPayments: 0,
            reconciledSales: 0,
            unreconciledCash: 0,
          });
        }
        const row = staffMap.get(staffId);
        row.salesRecorded += 1;

        const cashAmt = cashFromSale(sale);
        const bankAmt = bankFromSale(sale);
        const creditAmt = creditFromSale(sale);

        row.expectedCash += cashAmt;
        row.bankCollections += bankAmt;
        row.outstandingPayments += creditAmt;

        const saleId = String(sale.id);
        if (reconciledSaleIds.has(saleId)) {
          row.reconciledSales += 1;
          // Submitted cash comes from reconciliation allocation
          const submitted = saleToCashMap.get(saleId) || 0;
          row.cashSubmitted += submitted;
          // Shortage only if expected cash for this sale exceeds allocated actual
          row.shortages += Math.max(0, cashAmt - submitted);
        } else if (cashAmt > 0) {
          // Unreconciled cash sale → full amount still outstanding as shortage risk
          row.unreconciledCash += cashAmt;
          row.cashSubmitted += 0;
          row.shortages += cashAmt;
        }
      }

      // Apply shift-close pending cash when sales weren't fully reconciled yet
      for (const sc of shiftCloses) {
        const sid = String(sc.staffId || '');
        if (!sid) continue;
        if (!staffMap.has(sid)) {
          staffMap.set(sid, {
            staffId: sid,
            staffName: sc.staffName || 'Staff',
            salesRecorded: Number(sc.salesCount) || 0,
            expectedCash: 0,
            cashSubmitted: 0,
            bankCollections: Number(sc.bankTotal) || 0,
            shortages: 0,
            outstandingPayments: 0,
            reconciledSales: 0,
            unreconciledCash: 0,
          });
        }
        const row = staffMap.get(sid);
        // If shift still pending recon and saleIds not all in reconciled set
        const scSaleIds: string[] = Array.isArray(sc.saleIds) ? sc.saleIds.map(String) : [];
        const allReconciled =
          scSaleIds.length > 0 && scSaleIds.every((id) => reconciledSaleIds.has(id));
        if (!allReconciled && Number(sc.expectedCash) > 0) {
          // Prefer sale-level math when we already counted sales; only top-up gaps
          const alreadyExpected = row.expectedCash || 0;
          const scExpected = Number(sc.expectedCash) || 0;
          if (scExpected > alreadyExpected + 0.01) {
            const gap = scExpected - alreadyExpected;
            row.expectedCash += gap;
            row.unreconciledCash += gap;
            row.shortages += gap;
          }
        }
        if (Number(sc.bankTotal) > 0 && !(row.bankCollections > 0)) {
          row.bankCollections = Number(sc.bankTotal) || 0;
        }
      }

      const accountabilityData: StaffAccountability[] = Array.from(staffMap.values())
        .filter((s) => s.staffId !== 'unknown' || s.salesRecorded > 0)
        .map((staff) => {
          const reconciliationRate =
            staff.expectedCash > 0
              ? Math.min(100, (staff.cashSubmitted / staff.expectedCash) * 100)
              : staff.unreconciledCash > 0
                ? 0
                : 100;

          return {
            staffId: staff.staffId,
            staffName: staff.staffName,
            period: {
              start: startDate,
              end: new Date(),
            },
            salesRecorded: staff.salesRecorded,
            expectedCash: staff.expectedCash,
            cashSubmitted: staff.cashSubmitted,
            bankCollections: staff.bankCollections,
            shortages: staff.shortages,
            outstandingPayments: staff.outstandingPayments,
            reconciliationRate,
          } as StaffAccountability;
        })
        .sort((a, b) => (b.shortages || 0) - (a.shortages || 0));

      setAccountabilityData(accountabilityData);
    } catch (error) {
      console.error('Error loading accountability data:', error);
      showToast('Failed to load staff accountability');
    } finally {
      setLoading(false);
    }
  }, [businessId, selectedPeriod, showToast]);

  useEffect(() => {
    loadAccountabilityData();
  }, [loadAccountabilityData]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Staff Accountability</h1>
          <p className={styles.pageDesc}>
            Cash expected vs reconciled by staff. Shortages clear when a shift is reconciled.
          </p>
        </div>
        <div className={styles.periodSelector}>
          {(['week', 'month', 'quarter', 'all'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.periodBtn} ${selectedPeriod === p ? styles.active : ''}`}
              onClick={() => setSelectedPeriod(p)}
            >
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading accountability…</div>
      ) : accountabilityData.length === 0 ? (
        <Card>
          <div className={styles.empty}>
            No staff sales in this period. Record sales and run cash reconciliation to see
            shortages.
          </div>
          <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => navigateTo('cash-reconciliation')}>
              Cash reconciliation
            </Button>
            <Button variant="secondary" onClick={() => loadAccountabilityData()}>
              Refresh
            </Button>
          </div>
        </Card>
      ) : (
        <div className={styles.list}>
          {accountabilityData.map((row) => (
            <Card key={row.staffId} className={styles.staffCard}>
              <div className={styles.staffHead}>
                <div>
                  <div className={styles.staffName}>{row.staffName}</div>
                  <div className={styles.staffMeta}>
                    {row.salesRecorded} sale{row.salesRecorded === 1 ? '' : 's'} ·{' '}
                    {(row.reconciliationRate || 0).toFixed(0)}% reconciled
                  </div>
                </div>
                <div
                  className={`${styles.shortageBadge} ${
                    (row.shortages || 0) > 0 ? styles.shortageBad : styles.shortageOk
                  }`}
                >
                  {(row.shortages || 0) > 0
                    ? `Shortage ${formatMoney(row.shortages || 0)}`
                    : 'Clear'}
                </div>
              </div>
              <div className={styles.metrics}>
                <div>
                  <div className={styles.metricLabel}>Expected cash</div>
                  <div className={styles.metricValue}>{formatMoney(row.expectedCash || 0)}</div>
                </div>
                <div>
                  <div className={styles.metricLabel}>Cash submitted</div>
                  <div className={styles.metricValue}>{formatMoney(row.cashSubmitted || 0)}</div>
                </div>
                <div>
                  <div className={styles.metricLabel}>Bank / transfer</div>
                  <div className={styles.metricValue}>{formatMoney(row.bankCollections || 0)}</div>
                </div>
                <div>
                  <div className={styles.metricLabel}>Credit outstanding</div>
                  <div className={styles.metricValue}>
                    {formatMoney(row.outstandingPayments || 0)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
