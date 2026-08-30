'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { PaymentTraceability } from './types';
import { fetchDocs } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import styles from './PaymentTraceabilityPage.module.css';

function asDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  if (typeof value === 'number') return new Date(value);
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function getPeriodStart(period: 'week' | 'month' | 'quarter' | 'all'): Date | null {
  if (period === 'all') return null;
  const d = new Date();
  if (period === 'week') d.setDate(d.getDate() - 7);
  else if (period === 'month') d.setMonth(d.getMonth() - 1);
  else d.setMonth(d.getMonth() - 3);
  return d;
}

export default function PaymentTraceabilityPage() {
  const { user, showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [traceabilityData, setTraceabilityData] = useState<PaymentTraceability[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('month');
  const [selectedSale, setSelectedSale] = useState<PaymentTraceability | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTraceabilityData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let resolvedBusinessId = user.businessId || '';
      if (!resolvedBusinessId && user.id) {
        try {
          const { resolveOwnerScopeBusinessId } = await import('@/lib/resolve-business-scope');
          resolvedBusinessId =
            (await resolveOwnerScopeBusinessId(user.id, user.businessId)) || '';
        } catch (e) {
          console.warn('[PaymentTraceability] businessId lookup failed', e);
        }
      }
      if (!resolvedBusinessId) {
        setTraceabilityData([]);
        setLoadError('Business not found for this account.');
        return;
      }

      const periodStart = getPeriodStart(selectedPeriod);
      const startMs = periodStart ? periodStart.getTime() : 0;

      // Sales from Supabase (same path as Money Control / Record Sale)
      const salesDocs = await fetchDocs(`businesses/${resolvedBusinessId}/sales`);
      let sales = (salesDocs || []).map((data: any) => {
        const meta =
          data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
        let breakdown: any[] = Array.isArray(data.paymentBreakdown)
          ? data.paymentBreakdown
          : Array.isArray(data.payment_breakdown)
            ? data.payment_breakdown
            : Array.isArray(meta.paymentBreakdown)
              ? meta.paymentBreakdown
              : [];
        if (
          (!breakdown || breakdown.length === 0) &&
          meta.paymentMethods &&
          typeof meta.paymentMethods === 'object'
        ) {
          breakdown = Object.entries(meta.paymentMethods).map(([method, amount]) => ({
            method,
            amount: Number(amount) || 0,
            received: true,
          }));
        }
        const totalRevenue =
          Number(
            data.totalRevenue ??
              data.total_revenue ??
              data.total ??
              data.totalAmount ??
              data.total_amount ??
              meta.totalRevenue ??
              meta.total ??
              0
          ) || 0;
        const primary = String(
          data.paymentMethod || data.payment_method || meta.paymentMethod || ''
        ).toLowerCase();
        if ((!breakdown || breakdown.length === 0) && primary && totalRevenue > 0) {
          if (primary === 'split') {
            breakdown = [
              { method: 'cash', amount: totalRevenue / 2, received: true },
              { method: 'transfer', amount: totalRevenue / 2, received: true },
            ];
          } else {
            breakdown = [{ method: primary, amount: totalRevenue, received: true }];
          }
        }
        const productsRaw = data.products || data.items || meta.products || [];
        const products = Array.isArray(productsRaw)
          ? productsRaw.map((p: any) => ({
              name: p.name || 'Item',
              quantity: Number(p.quantity ?? p.qty) || 0,
              price: Number(p.price) || 0,
            }))
          : [];
        const recordedBy = data.recordedBy || data.recorded_by || meta.recordedBy || {};
        return {
          id: String(data.id),
          createdAt: asDate(data.createdAt ?? data.created_at ?? meta.createdAt),
          totalRevenue,
          paymentBreakdown: breakdown,
          customerName:
            data.customerName ||
            data.customer_name ||
            meta.customerName ||
            'Walk-in Customer',
          products,
          staffId: recordedBy.uid || recordedBy.staffId || data.staffId || 'unknown',
          staffName:
            recordedBy.displayName ||
            recordedBy.display_name ||
            data.staffName ||
            'Unknown',
        };
      });

      if (periodStart) {
        sales = sales.filter((s) => s.createdAt.getTime() >= startMs);
      }
      sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Reconciliation map (API + client fallback — same as Money Control)
      const saleToReconciliation = new Map<
        string,
        { reconciled: boolean; reconciledAt?: Date }
      >();
      let reconciliations: any[] = [];
      try {
        const supabase = getSupabase();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          const res = await fetch(
            `/api/cash-reconciliation?businessId=${encodeURIComponent(resolvedBusinessId)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            }
          );
          const json = await res.json().catch(() => ({}));
          if (res.ok) reconciliations = json.reconciliations || [];
        }
      } catch (e) {
        console.warn('[PaymentTraceability] reconciliation API failed', e);
      }
      if (!reconciliations.length) {
        try {
          const rows = await fetchDocs(
            `businesses/${resolvedBusinessId}/cashReconciliations`
          );
          reconciliations = rows || [];
        } catch {
          /* ignore */
        }
      }

      reconciliations.forEach((rec: any) => {
        const meta =
          rec.metadata && typeof rec.metadata === 'object' ? rec.metadata : {};
        const saleIds = rec.saleIds || meta.saleIds || rec.sale_ids || [];
        const reconciledAt = asDate(
          rec.reconciledAt || meta.reconciledAt || rec.createdAt || rec.created_at
        );
        if (Array.isArray(saleIds)) {
          saleIds.forEach((saleId: string) => {
            if (saleId) {
              saleToReconciliation.set(String(saleId), {
                reconciled: true,
                reconciledAt,
              });
            }
          });
        }
      });

      const traceability: PaymentTraceability[] = sales.map((sale) => {
        const breakdown = sale.paymentBreakdown || [];
        const totalAmount =
          breakdown.reduce((sum: number, pb: any) => sum + (Number(pb.amount) || 0), 0) ||
          sale.totalRevenue ||
          0;
        const reconData = saleToReconciliation.get(sale.id);
        return {
          saleId: sale.id,
          saleDate: sale.createdAt,
          totalAmount,
          customerName: sale.customerName,
          products: sale.products,
          staffId: sale.staffId,
          staffName: sale.staffName,
          paymentBreakdown: breakdown,
          paymentReceived: totalAmount > 0,
          reconciled: reconData?.reconciled || false,
          reconciledAt: reconData?.reconciledAt,
        };
      });

      setTraceabilityData(traceability);
    } catch (error: any) {
      console.error('Error loading traceability data:', error);
      setLoadError(error?.message || 'Failed to load traceability data');
      showToast('Failed to load traceability data');
      setTraceabilityData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, user.businessId, user.id, showToast]);

  useEffect(() => {
    loadTraceabilityData();
  }, [loadTraceabilityData]);

  const TraceabilityRow = ({ data }: { data: PaymentTraceability }) => (
    <div className={styles.traceRow} onClick={() => setSelectedSale(data)}>
      <div className={styles.traceDate}>{data.saleDate.toLocaleDateString()}</div>
      <div className={styles.traceCustomer}>{data.customerName}</div>
      <div className={styles.traceAmount}>{formatMoney(data.totalAmount)}</div>
      <div className={styles.traceStaff}>{data.staffName}</div>
      <div
        className={`${styles.traceStatus} ${data.reconciled ? styles.reconciled : styles.pending}`}
      >
        {data.reconciled ? '✓ Reconciled' : '⏳ Pending'}
      </div>
    </div>
  );

  const PaymentBreakdownItem = ({ method, amount }: { method: string; amount: number }) => (
    <div className={styles.breakdownItem}>
      <span className={styles.breakdownMethod}>{method}</span>
      <span className={styles.breakdownAmount}>{formatMoney(amount)}</span>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Payment Traceability</h1>
          <p className={styles.pageDesc}>
            Track full payment journey from sale to bank reconciliation
          </p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('money-control')}>
          ← Back to Money Control
        </Button>
      </div>

      <div className={styles.content}>
        <Card>
          <div className={styles.periodSelector}>
            {(['week', 'month', 'quarter', 'all'] as const).map((period) => (
              <button
                key={period}
                className={`${styles.periodBtn} ${selectedPeriod === period ? styles.active : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {loadError && (
          <Card>
            <div className={styles.empty}>
              <p style={{ marginBottom: 12 }}>{loadError}</p>
              <Button variant="primary" onClick={() => loadTraceabilityData()}>
                Retry
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <Card>
            <div className={styles.loading}>Loading…</div>
          </Card>
        ) : !loadError && traceabilityData.length === 0 ? (
          <Card>
            <div className={styles.empty}>No traceability data available</div>
          </Card>
        ) : traceabilityData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardIcon bg="var(--purple-lt)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </CardIcon>
              Payment Traceability ({traceabilityData.length})
            </CardHeader>

            <div className={styles.traceList}>
              <div className={styles.traceHeader}>
                <div className={styles.headerDate}>Date</div>
                <div className={styles.headerCustomer}>Customer</div>
                <div className={styles.headerAmount}>Amount</div>
                <div className={styles.headerStaff}>Staff</div>
                <div className={styles.headerStatus}>Status</div>
              </div>
              {traceabilityData.map((data) => (
                <TraceabilityRow key={data.saleId} data={data} />
              ))}
            </div>
          </Card>
        ) : null}

        {selectedSale && (
          <Card>
            <CardHeader>
              <CardIcon bg="var(--green-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </CardIcon>
              Sale Details
              <Button variant="subtle" onClick={() => setSelectedSale(null)}>
                ✕
              </Button>
            </CardHeader>

            <div className={styles.saleDetail}>
              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Sale Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Sale ID:</span>
                  <span className={styles.detailValue}>{selectedSale.saleId}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date:</span>
                  <span className={styles.detailValue}>
                    {selectedSale.saleDate.toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Customer:</span>
                  <span className={styles.detailValue}>{selectedSale.customerName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total Amount:</span>
                  <span className={styles.detailValue}>
                    {formatMoney(selectedSale.totalAmount)}
                  </span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Staff Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Staff ID:</span>
                  <span className={styles.detailValue}>{selectedSale.staffId}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Staff Name:</span>
                  <span className={styles.detailValue}>{selectedSale.staffName}</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Products</h3>
                {selectedSale.products.map((product, idx) => (
                  <div key={idx} className={styles.productItem}>
                    <span className={styles.productName}>{product.name}</span>
                    <span className={styles.productQty}>×{product.quantity}</span>
                    <span className={styles.productPrice}>{formatMoney(product.price)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Payment Breakdown</h3>
                {selectedSale.paymentBreakdown.map((pb, idx) => (
                  <PaymentBreakdownItem key={idx} method={pb.method} amount={pb.amount} />
                ))}
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailTitle}>Reconciliation Status</h3>
                <div
                  className={`${styles.statusBadge} ${selectedSale.reconciled ? styles.reconciled : styles.pending}`}
                >
                  {selectedSale.reconciled ? '✓ Reconciled' : '⏳ Pending'}
                </div>
                {selectedSale.reconciledAt && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Reconciled At:</span>
                    <span className={styles.detailValue}>
                      {selectedSale.reconciledAt.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
