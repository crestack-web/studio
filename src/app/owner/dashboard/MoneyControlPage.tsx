'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Button } from './Button';
import { MoneyControlSummary, PaymentBreakdown } from './types';
import { fetchDocs } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { isRestaurantBusiness } from './utils/restaurantHelpers';
import { DollarSign, Banknote, Smartphone, CreditCard, RefreshCw, FileText, Package, Zap, Users, BarChart3, Utensils, Download, Building2, Check, Clock, Link, HelpCircle, TrendingUp, Target, Wallet, Lightbulb, ChevronRight, ChevronDown, AlertTriangle, Plus } from 'lucide-react';
import styles from './MoneyControlPage.module.css';

interface SaleData {
  id: string;
  totalRevenue: number;
  paymentBreakdown?: PaymentBreakdown[];
  createdAt: Date | string | null;
  [key: string]: any;
}

/** Safely format sale / doc timestamps (Timestamp, Date, or millis). */
function formatSaleDate(value: unknown): string {
  try {
    if (!value) return '—';
    if (typeof value === 'object' && value !== null && typeof (value as any).toDate === 'function') {
      return (value as any).toDate().toLocaleDateString();
    }
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'number') return new Date(value).toLocaleDateString();
    if (typeof value === 'string') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
    }
  } catch {
    /* ignore */
  }
  return '—';
}

function getPeriodStart(period: 'today' | 'week' | 'month' | 'all'): Date | null {
  if (period === 'all') return null;
  const d = new Date();
  if (period === 'today') {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'week') {
    d.setDate(d.getDate() - 7);
    return d;
  }
  d.setDate(d.getDate() - 30);
  return d;
}

function saleTimestampMs(sale: SaleData): number {
  const v = sale.createdAt as any;
  if (!v) return 0;
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return new Date(v).getTime() || 0;
  return 0;
}

function paymentAmount(pb: any): number {
  const n = Number(pb?.amount);
  return Number.isFinite(n) ? n : 0;
}

export default function MoneyControlPage() {
  const { user, navigateTo, showToast } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const [summary, setSummary] = useState<MoneyControlSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [salesWithPayments, setSalesWithPayments] = useState<SaleData[]>([]);
  const [reconciledSaleIds, setReconciledSaleIds] = useState<Set<string>>(new Set());
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [restaurantProfitMetrics, setRestaurantProfitMetrics] = useState<{
    inventoryPurchases: number;
    operatingExpenses: number;
    payrollExpenses: number;
    estimatedProfit: number;
    foodCostPercentage: number;
  } | null>(null);

  const loadRestaurantProfitMetrics = useCallback(async (
    businessId: string,
    period: 'today' | 'week' | 'month' | 'all',
    totalSales: number
  ) => {
    try {
      const startDate = getPeriodStart(period) ?? new Date(0);
      const expenses = await fetchDocs(`businesses/${businessId}/expenses`);

      let inventoryPurchases = 0;
      let operatingExpenses = 0;
      let payrollExpenses = 0;
      const startMs = startDate.getTime();

      (expenses || []).forEach((data: any) => {
        const created = data.createdAt || data.created_at;
        let createdMs = 0;
        if (created?.toDate) createdMs = created.toDate().getTime();
        else if (created instanceof Date) createdMs = created.getTime();
        else if (typeof created === 'string') createdMs = new Date(created).getTime() || 0;
        if (period !== 'all' && createdMs && createdMs < startMs) return;

        const category = (data.category || '').toLowerCase();
        const amount = Number(data.amount) || 0;

        if (category.includes('inventory') || category.includes('stock') || category.includes('ingredient')) {
          inventoryPurchases += amount;
        } else if (category.includes('payroll') || category.includes('salary') || category.includes('wage')) {
          payrollExpenses += amount;
        } else {
          operatingExpenses += amount;
        }
      });

      const totalExpenses = inventoryPurchases + operatingExpenses + payrollExpenses;
      const estimatedProfit = totalSales - totalExpenses;
      const foodCostPercentage = totalSales > 0 ? (inventoryPurchases / totalSales) * 100 : 0;

      setRestaurantProfitMetrics({
        inventoryPurchases,
        operatingExpenses,
        payrollExpenses,
        estimatedProfit,
        foodCostPercentage,
      });
    } catch (error) {
      console.error('Error loading restaurant profit metrics:', error);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    if (!user.businessId && !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      // Resolve businessId the same way as Home (Supabase users table)
      let resolvedBusinessId = user.businessId || '';
      if (!resolvedBusinessId && user.id) {
        try {
          const { resolveOwnerScopeBusinessId } = await import('@/lib/resolve-business-scope');
          resolvedBusinessId =
            (await resolveOwnerScopeBusinessId(user.id, user.businessId)) || '';
        } catch (e) {
          console.warn('Money Control businessId lookup failed', e);
        }
      }
      if (!resolvedBusinessId) {
        setLoading(false);
        setLoadError('Business not found for this account.');
        return;
      }

      const restaurant = await isRestaurantBusiness(resolvedBusinessId);
      setIsRestaurant(restaurant);

      const periodStart = getPeriodStart(selectedPeriod);
      const startMs = periodStart ? periodStart.getTime() : 0;

      // Sales live in Supabase (same path as Record Sale / Home)
      const salesDocs = await fetchDocs(`businesses/${resolvedBusinessId}/sales`);
      let sales: SaleData[] = (salesDocs || []).map((data: any) => {
        const meta =
          data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
        let breakdown: any[] =
          Array.isArray(data.paymentBreakdown)
            ? data.paymentBreakdown
            : Array.isArray(data.payment_breakdown)
              ? data.payment_breakdown
              : Array.isArray(meta.paymentBreakdown)
                ? meta.paymentBreakdown
                : [];
        // paymentMethods map → breakdown rows
        if ((!breakdown || breakdown.length === 0) && meta.paymentMethods && typeof meta.paymentMethods === 'object') {
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
            // Unknown split — treat half as cash heuristic only if no detail
            breakdown = [
              { method: 'cash', amount: totalRevenue / 2, received: true },
              { method: 'transfer', amount: totalRevenue / 2, received: true },
            ];
          } else {
            breakdown = [{ method: primary, amount: totalRevenue, received: true }];
          }
        }
        return {
          id: data.id,
          ...data,
          totalRevenue,
          paymentMethod: primary || data.paymentMethod,
          paymentBreakdown: breakdown,
          createdAt: data.createdAt ?? data.created_at ?? meta.createdAt ?? null,
        } as SaleData;
      });

      if (periodStart) {
        sales = sales.filter((s) => saleTimestampMs(s) >= startMs);
      }
      sales.sort((a, b) => saleTimestampMs(b) - saleTimestampMs(a));
      setSalesWithPayments(sales);
      
      const totalSales = sales.reduce((sum, sale) => sum + (sale.totalRevenue || 0), 0);
      
      const sumByMethod = (method: string) =>
        sales.reduce((sum, sale) => {
          const breakdown = sale.paymentBreakdown || [];
          const fromBreakdown = breakdown
            .filter((pb: PaymentBreakdown) => pb.method === method)
            .reduce((s: number, pb: PaymentBreakdown) => s + paymentAmount(pb), 0);
          if (fromBreakdown > 0) return sum + fromBreakdown;
          // Fallback when paymentBreakdown was not persisted: use primary paymentMethod
          const primary = String(sale.paymentMethod || sale.payment_method || '').toLowerCase();
          if (primary === method) return sum + (sale.totalRevenue || 0);
          return sum;
        }, 0);

      const cashSales = sumByMethod('cash');
      const transferSales = sumByMethod('transfer');
      const posSales = sumByMethod('pos') + sumByMethod('card');
      const splitPayments = sumByMethod('split');
      const creditSales = sumByMethod('credit');
      
      const expectedCashCollections = cashSales + splitPayments * 0.5;
      const expectedBankCollections = transferSales + posSales + splitPayments * 0.5;
      
      // Same source as Cash Reconciliation save API (service role + fallbacks)
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
          if (res.ok) {
            reconciliations = json.reconciliations || [];
          }
        }
      } catch (e) {
        console.warn('[MoneyControl] reconciliation load failed', e);
      }
      // Client fallback if API empty
      if (!reconciliations.length) {
        try {
          const rows = await fetchDocs(
            `businesses/${resolvedBusinessId}/cashReconciliations`
          );
          reconciliations = (rows as any[]).map((r) => {
            const meta =
              r.metadata && typeof r.metadata === 'object' ? r.metadata : {};
            return {
              ...r,
              actualCash: r.actualCash ?? meta.actualCash ?? r.actual_cash ?? 0,
              variance: r.variance ?? meta.variance ?? 0,
              saleIds: r.saleIds || meta.saleIds || r.sale_ids || [],
            };
          });
        } catch {
          /* ignore */
        }
      }

      let confirmedCashCollections = 0;
      let confirmedBankCollections = 0;
      const recSaleIds = new Set<string>();

      reconciliations.forEach((rec: any) => {
        const meta =
          rec.metadata && typeof rec.metadata === 'object' ? rec.metadata : {};
        const actualCash = Number(
          rec.actualCash ?? meta.actualCash ?? rec.actual_cash ?? 0
        ) || 0;
        confirmedCashCollections += actualCash;

        const saleIds = rec.saleIds || meta.saleIds || rec.sale_ids || [];
        if (Array.isArray(saleIds)) {
          saleIds.forEach((saleId: string) => {
            if (saleId) recSaleIds.add(String(saleId));
          });
        }
      });
      
      confirmedBankCollections = expectedBankCollections;
      
      const outstandingCollections = Math.max(0, expectedCashCollections - confirmedCashCollections);
      
      const matchedTransactions = recSaleIds.size;
      
      const cashSalesNeedingReconciliation = sales.filter(sale => {
        const breakdown = sale.paymentBreakdown || [];
        const hasCash = breakdown.some((pb: PaymentBreakdown) => pb.method === 'cash');
        const hasSplit = breakdown.some((pb: PaymentBreakdown) => pb.method === 'split');
        return hasCash || hasSplit;
      });
      
      const unmatchedSales = cashSalesNeedingReconciliation.length - matchedTransactions;
      const unmatchedBankTransactions = 0;
      const pendingReconciliation = Math.max(0, unmatchedSales);
      
      let cashShortages = 0;
      let missingTransfers = 0;
      let unmatchedDeposits = 0;
      let overpayments = 0;
      let duplicatePayments = 0;
      
      reconciliations.forEach((rec: any) => {
        const meta =
          rec.metadata && typeof rec.metadata === 'object' ? rec.metadata : {};
        const variance = Number(rec.variance ?? meta.variance ?? 0) || 0;
        if (variance < 0) {
          cashShortages++;
        } else if (variance > 0) {
          overpayments++;
        }
      });
      
      const transferConfirmationRate = transferSales > 0 ? (confirmedBankCollections / (transferSales + posSales)) : 1;
      if (transferConfirmationRate < 0.9 && transferSales > 0) {
        missingTransfers = Math.ceil(transferSales * (1 - transferConfirmationRate));
      }
      
      const alerts = {
        cashShortages,
        missingTransfers,
        unmatchedDeposits,
        overpayments,
        duplicatePayments,
      };
      
      setSummary({
        totalSales,
        cashSales,
        transferSales,
        posSales,
        splitPayments,
        creditSales,
        expectedCashCollections,
        expectedBankCollections,
        confirmedCashCollections,
        confirmedBankCollections,
        outstandingCollections,
        matchedTransactions,
        unmatchedSales,
        unmatchedBankTransactions,
        pendingReconciliation,
        alerts,
      });
      setReconciledSaleIds(recSaleIds);

      if (restaurant) {
        await loadRestaurantProfitMetrics(resolvedBusinessId, selectedPeriod, totalSales);
      }
    } catch (error: any) {
      console.error('Error loading money control summary:', error);
      setLoadError(error?.message || 'Failed to load Money Control data. Please try again.');
      setSummary({
        totalSales: 0,
        cashSales: 0,
        transferSales: 0,
        posSales: 0,
        splitPayments: 0,
        creditSales: 0,
        expectedCashCollections: 0,
        expectedBankCollections: 0,
        confirmedCashCollections: 0,
        confirmedBankCollections: 0,
        outstandingCollections: 0,
        matchedTransactions: 0,
        unmatchedSales: 0,
        unmatchedBankTransactions: 0,
        pendingReconciliation: 0,
        alerts: {
          cashShortages: 0,
          missingTransfers: 0,
          unmatchedDeposits: 0,
          overpayments: 0,
          duplicatePayments: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [user.businessId, selectedPeriod, loadRestaurantProfitMetrics]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const StatCard = ({ icon, label, value, trend, color }: { 
    icon: React.ReactNode; 
    label: string; 
    value: string; 
    trend?: string;
    color?: string;
  }) => (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color || 'rgba(124, 58, 237, 0.08)' }}>
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
      </div>
      <div className={styles.statContent}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
        {trend && <div className={styles.statTrend}>{trend}</div>}
      </div>
    </div>
  );

  const SaleRow = ({ sale }: { sale: SaleData }) => {
    const breakdown = sale.paymentBreakdown || [];
    const total = breakdown.reduce((sum, pb) => sum + paymentAmount(pb), 0);
    const isReconciled = reconciledSaleIds.has(sale.id);
    
    return (
      <div className={styles.saleRow}>
        <div className={styles.saleInfo}>
          <div className={styles.saleDate}>{formatSaleDate(sale.createdAt)}</div>
          <div className={styles.saleTotal}>{formatMoney(total || sale.totalRevenue || 0)}</div>
        </div>
        <div className={styles.salePayments}>
          {breakdown.map((pb, idx) => (
            <div key={idx} className={styles.salePayment}>
              <span className={styles.paymentMethod}>{pb.method || 'other'}</span>
              <span className={styles.paymentAmount}>{formatMoney(paymentAmount(pb))}</span>
            </div>
          ))}
        </div>
        <div className={styles.saleReconciliation}>
          <div className={`${styles.reconStatus} ${isReconciled ? styles.reconMatched : styles.reconPending}`}>
            {isReconciled ? 'Matched' : 'Pending'}
          </div>
        </div>
      </div>
    );
  };

  const AlertItem = ({ type, count }: { type: string; count: number }) => (
    <div className={styles.alertItem}>
      <div className={styles.alertIcon}><AlertTriangle size={16} /></div>
      <div className={styles.alertContent}>
        <div className={styles.alertType}>{type}</div>
        <div className={styles.alertCount}>{count}</div>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Money Control</h1>
          <p className={styles.pageDesc}>Track every sale, payment, and collection from point of sale to bank reconciliation</p>
        </div>
        <div className={styles.periodSelector}>
          {(['today', 'week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              className={`${styles.periodBtn} ${selectedPeriod === period ? styles.active : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className={styles.empty} style={{ marginBottom: 16 }}>
          <p style={{ color: 'var(--text-2)', marginBottom: 12 }}>{loadError}</p>
          <Button variant="primary" onClick={() => loadSummary()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : summary ? (
        <div className={styles.content}>
          {/* Sales Summary */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Sales Summary</h2>
            <div className={styles.statsGrid}>
              <StatCard icon={<DollarSign size={18} />} label="Total Sales" value={formatMoney(summary.totalSales)} color="rgba(124, 58, 237, 0.08)" />
              <StatCard icon={<Banknote size={18} />} label="Cash Sales" value={formatMoney(summary.cashSales)} color="rgba(16, 185, 129, 0.1)" />
              <StatCard icon={<Smartphone size={18} />} label="Transfer Sales" value={formatMoney(summary.transferSales)} color="rgba(59, 130, 246, 0.1)" />
              <StatCard icon={<CreditCard size={18} />} label="POS Sales" value={formatMoney(summary.posSales)} color="rgba(236, 72, 153, 0.1)" />
              <StatCard icon={<RefreshCw size={18} />} label="Split Payments" value={formatMoney(summary.splitPayments)} color="rgba(245, 158, 11, 0.1)" />
              <StatCard icon={<FileText size={18} />} label="Credit Sales" value={formatMoney(summary.creditSales)} color="rgba(239, 68, 68, 0.1)" />
            </div>
          </section>

          {/* Restaurant Profit Tracking */}
          {isRestaurant && restaurantProfitMetrics && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Restaurant Profit Tracking</h2>
              <div className={styles.statsGrid}>
                <StatCard icon={<Package size={18} />} label="Inventory Purchases" value={formatMoney(restaurantProfitMetrics.inventoryPurchases)} color="rgba(59, 130, 246, 0.1)" />
                <StatCard icon={<Zap size={18} />} label="Operating Expenses" value={formatMoney(restaurantProfitMetrics.operatingExpenses)} color="rgba(239, 68, 68, 0.1)" />
                <StatCard icon={<Users size={18} />} label="Payroll Expenses" value={formatMoney(restaurantProfitMetrics.payrollExpenses)} color="rgba(245, 158, 11, 0.1)" />
                <StatCard icon={<BarChart3 size={18} />} label="Estimated Profit" value={formatMoney(restaurantProfitMetrics.estimatedProfit)} color="rgba(16, 185, 129, 0.1)" />
                <StatCard icon={<Utensils size={18} />} label="Food Cost %" value={`${restaurantProfitMetrics.foodCostPercentage.toFixed(1)}%`} color="rgba(236, 72, 153, 0.1)" />
              </div>
            </section>
          )}

          {/* Collections Summary */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Collections Summary</h2>
            <div className={styles.statsGrid}>
              <StatCard icon={<Download size={18} />} label="Expected Cash" value={formatMoney(summary.expectedCashCollections)} color="rgba(16, 185, 129, 0.1)" />
              <StatCard icon={<Building2 size={18} />} label="Expected Bank" value={formatMoney(summary.expectedBankCollections)} color="rgba(59, 130, 246, 0.1)" />
              <StatCard icon={<Check size={18} />} label="Confirmed Cash" value={formatMoney(summary.confirmedCashCollections)} color="rgba(16, 185, 129, 0.1)" />
              <StatCard icon={<Check size={18} />} label="Confirmed Bank" value={formatMoney(summary.confirmedBankCollections)} color="rgba(59, 130, 246, 0.1)" />
              <StatCard icon={<Clock size={18} />} label="Outstanding" value={formatMoney(summary.outstandingCollections)} color="rgba(245, 158, 11, 0.1)" />
            </div>
          </section>

          {/* Reconciliation Summary */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Reconciliation Summary</h2>
            <div className={styles.statsGrid}>
              <StatCard icon={<Link size={18} />} label="Matched Transactions" value={summary.matchedTransactions.toString()} color="rgba(16, 185, 129, 0.1)" />
              <StatCard icon={<HelpCircle size={18} />} label="Unmatched Sales" value={summary.unmatchedSales.toString()} color="rgba(239, 68, 68, 0.1)" />
              <StatCard icon={<HelpCircle size={18} />} label="Unmatched Bank" value={summary.unmatchedBankTransactions.toString()} color="rgba(239, 68, 68, 0.1)" />
              <StatCard icon={<Clock size={18} />} label="Pending Reconciliation" value={summary.pendingReconciliation.toString()} color="rgba(245, 158, 11, 0.1)" />
            </div>
          </section>

          {/* Alerts */}
          {(summary.alerts.cashShortages > 0 || summary.alerts.missingTransfers > 0 || summary.alerts.unmatchedDeposits > 0 || summary.alerts.overpayments > 0 || summary.alerts.duplicatePayments > 0) && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Alerts</h2>
              <div className={styles.alertsGrid}>
                {summary.alerts.cashShortages > 0 && (
                  <AlertItem type="Cash Shortages" count={summary.alerts.cashShortages} />
                )}
                {summary.alerts.missingTransfers > 0 && (
                  <AlertItem type="Missing Transfers" count={summary.alerts.missingTransfers} />
                )}
                {summary.alerts.unmatchedDeposits > 0 && (
                  <AlertItem type="Unmatched Deposits" count={summary.alerts.unmatchedDeposits} />
                )}
                {summary.alerts.overpayments > 0 && (
                  <AlertItem type="Overpayments" count={summary.alerts.overpayments} />
                )}
                {summary.alerts.duplicatePayments > 0 && (
                  <AlertItem type="Duplicate Payments" count={summary.alerts.duplicatePayments} />
                )}
              </div>
            </section>
          )}

          {/* Sales with Payment Breakdown */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Sales &amp; Reconciliation</h2>
            <div className={styles.salesList}>
              {salesWithPayments.slice(0, 10).map(sale => (
                <SaleRow key={sale.id} sale={sale} />
              ))}
            </div>
          </section>

          {/* Business Insights & Analytics */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Business Insights</h2>
            <div className={styles.insightsGrid}>
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}><TrendingUp size={16} /></span>
                  <span className={styles.insightTitle}>Sales Trend</span>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightValue}>
                    {salesWithPayments.length > 1 ? (
                      (() => {
                        const recentSales = salesWithPayments.slice(0, 7).reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
                        const olderSales = salesWithPayments.slice(7, 14).reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
                        const trend = olderSales > 0 ? ((recentSales - olderSales) / olderSales * 100).toFixed(1) : '0';
                        const isPositive = parseFloat(trend) >= 0;
                        return (
                          <div className={styles.trendValue}>
                            <span className={isPositive ? styles.trendUp : styles.trendDown}>
                              {isPositive ? '+' : ''}{trend}%
                            </span>
                            <span className={styles.trendLabel}>vs previous period</span>
                          </div>
                        );
                      })()
                    ) : (
                      <span className={styles.noData}>Insufficient data</span>
                    )}
                  </div>
                  <div className={styles.insightDesc}>
                    {salesWithPayments.length > 1 ? 'Sales performance compared to previous period' : 'Need more sales data for trend analysis'}
                  </div>
                </div>
              </div>

              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}><CreditCard size={16} /></span>
                  <span className={styles.insightTitle}>Payment Preference</span>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightValue}>
                    {summary ? (() => {
                      const total = summary.cashSales + summary.transferSales + summary.posSales + summary.splitPayments;
                      if (total === 0) return <span className={styles.noData}>No data</span>;
                      
                      const methods = [
                        { name: 'Cash', value: summary.cashSales, icon: <Banknote size={14} /> },
                        { name: 'Transfer', value: summary.transferSales, icon: <Smartphone size={14} /> },
                        { name: 'POS', value: summary.posSales, icon: <CreditCard size={14} /> },
                        { name: 'Split', value: summary.splitPayments, icon: <RefreshCw size={14} /> },
                      ].sort((a, b) => b.value - a.value);
                      
                      const top = methods[0];
                      const percentage = ((top.value / total) * 100).toFixed(0);
                      
                      return (
                        <div className={styles.preferenceValue}>
                          <span className={styles.prefIcon}>{top.icon}</span>
                          <span className={styles.prefName}>{top.name}</span>
                          <span className={styles.prefPercent}>{percentage}%</span>
                        </div>
                      );
                    })() : <span className={styles.noData}>Loading...</span>}
                  </div>
                  <div className={styles.insightDesc}>
                    Most preferred payment method by customers
                  </div>
                </div>
              </div>

              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}><Target size={16} /></span>
                  <span className={styles.insightTitle}>Collection Efficiency</span>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightValue}>
                    {summary ? (() => {
                      const totalExpected = summary.expectedCashCollections + summary.expectedBankCollections;
                      const totalConfirmed = summary.confirmedCashCollections + summary.confirmedBankCollections;
                      if (totalExpected === 0) return <span className={styles.noData}>No data</span>;
                      
                      const efficiency = ((totalConfirmed / totalExpected) * 100).toFixed(0);
                      const isGood = parseFloat(efficiency) >= 80;
                      
                      return (
                        <div className={styles.efficiencyValue}>
                          <span className={isGood ? styles.efficiencyGood : styles.efficiencyPoor}>
                            {efficiency}%
                          </span>
                          <span className={styles.efficiencyLabel}>
                            {isGood ? 'Excellent' : 'Needs Improvement'}
                          </span>
                        </div>
                      );
                    })() : <span className={styles.noData}>Loading...</span>}
                  </div>
                  <div className={styles.insightDesc}>
                    Percentage of expected collections confirmed
                  </div>
                </div>
              </div>

              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}><Wallet size={16} /></span>
                  <span className={styles.insightTitle}>Cash Flow Health</span>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightValue}>
                    {summary ? (() => {
                      const cashRatio = summary.cashSales / (summary.totalSales || 1);
                      const bankRatio = (summary.transferSales + summary.posSales) / (summary.totalSales || 1);
                      
                      let health = 'Balanced';
                      let color = '#10B981';
                      
                      if (cashRatio > 0.7) {
                        health = 'Cash Heavy';
                        color = '#F59E0B';
                      } else if (bankRatio > 0.7) {
                        health = 'Digital Heavy';
                        color = '#3B82F6';
                      }
                      
                      return (
                        <div className={styles.healthValue}>
                          <span className={styles.healthLabel} style={{ color }}>{health}</span>
                        </div>
                      );
                    })() : <span className={styles.noData}>Loading...</span>}
                  </div>
                  <div className={styles.insightDesc}>
                    Balance between cash and digital payments
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.recommendations}>
              <h3 className={styles.recommendationsTitle}><Lightbulb size={16} /> Recommendations</h3>
              <div className={styles.recommendationsList}>
                {summary ? (() => {
                  const recommendations: { priority: string; text: string }[] = [];
                  
                  if (summary.alerts.cashShortages > 0) {
                    recommendations.push({
                      priority: 'high',
                      text: `Address ${summary.alerts.cashShortages} cash shortage${summary.alerts.cashShortages > 1 ? 'es' : ''} by improving cash handling procedures`
                    });
                  }
                  
                  const totalExpected = summary.expectedCashCollections + summary.expectedBankCollections;
                  const totalConfirmed = summary.confirmedCashCollections + summary.confirmedBankCollections;
                  if (totalExpected > 0) {
                    const efficiency = (totalConfirmed / totalExpected) * 100;
                    if (efficiency < 80) {
                      recommendations.push({
                        priority: 'high',
                        text: 'Improve collection efficiency by following up on outstanding payments daily'
                      });
                    }
                  }
                  
                  if (summary.pendingReconciliation > 5) {
                    recommendations.push({
                      priority: 'medium',
                      text: `Reconcile ${summary.pendingReconciliation} pending transactions to ensure accurate records`
                    });
                  }
                  
                  const cashRatio = summary.cashSales / (summary.totalSales || 1);
                  if (cashRatio > 0.7) {
                    recommendations.push({
                      priority: 'low',
                      text: 'Consider encouraging digital payments to reduce cash handling risks'
                    });
                  }
                  
                  if (recommendations.length === 0) {
                    recommendations.push({
                      priority: 'low',
                      text: 'Your money control is in good shape. Keep monitoring regularly.'
                    });
                  }
                  
                  return recommendations.map((rec, idx) => (
                    <div key={idx} className={`${styles.recommendation} ${styles[rec.priority]}`}>
                      <span className={styles.recPriority}>{rec.priority.toUpperCase()}</span>
                      <span className={styles.recText}>{rec.text}</span>
                    </div>
                  ));
                })() : <div className={styles.noData}>Loading recommendations...</div>}
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.actionsGrid}>
              <Button className={styles.actionBtn} onClick={() => navigateTo('bank-statement-import')}>
                Import Bank Statement
              </Button>
              <Button className={styles.actionBtn} onClick={() => navigateTo('bank-reconciliation')}>
                Reconcile Transactions
              </Button>
              <Button className={styles.actionBtn} onClick={() => navigateTo('cash-reconciliation')}>
                Cash Reconciliation
              </Button>
              <Button className={styles.actionBtn} onClick={() => navigateTo('staff-accountability')}>
                Staff Accountability
              </Button>
              <Button className={styles.actionBtn} onClick={() => navigateTo('money-leakage')}>
                Money Leakage Report
              </Button>
              <Button className={styles.actionBtn} onClick={() => navigateTo('payment-traceability')}>
                Payment Traceability
              </Button>
            </div>
          </section>
        </div>
      ) : (
        <div className={styles.empty}>No data available</div>
      )}
    </div>
  );
}
