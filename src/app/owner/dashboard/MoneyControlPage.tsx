'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { MoneyControlSummary, PaymentBreakdown } from './types';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { isRestaurantBusiness } from './utils/restaurantHelpers';
import styles from './MoneyControlPage.module.css';

interface SaleData {
  id: string;
  totalRevenue: number;
  paymentBreakdown?: PaymentBreakdown[];
  createdAt: Timestamp;
  [key: string]: any;
}

export default function MoneyControlPage() {
  const { user, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const [summary, setSummary] = useState<MoneyControlSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [salesWithPayments, setSalesWithPayments] = useState<SaleData[]>([]);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [restaurantProfitMetrics, setRestaurantProfitMetrics] = useState<{
    inventoryPurchases: number;
    operatingExpenses: number;
    payrollExpenses: number;
    estimatedProfit: number;
    foodCostPercentage: number;
  } | null>(null);

  useEffect(() => {
    loadSummary();
  }, [selectedPeriod, user.businessId]);

  const loadSummary = async () => {
    if (!user.businessId) return;
    
    setLoading(true);
    try {
      const { firestore } = initializeFirebase();
      
      // Check if business is a restaurant
      const restaurant = await isRestaurantBusiness(user.businessId);
      setIsRestaurant(restaurant);
      
      const salesRef = collection(firestore, 'businesses', user.businessId, 'sales');
      
      let q = query(salesRef);
      
      if (selectedPeriod === 'today') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        q = query(salesRef, where('createdAt', '>=', Timestamp.fromDate(startOfDay)));
      } else if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        q = query(salesRef, where('createdAt', '>=', Timestamp.fromDate(weekAgo)));
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        q = query(salesRef, where('createdAt', '>=', Timestamp.fromDate(monthAgo)));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const sales: SaleData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          totalRevenue: data.totalRevenue || data.total || 0,
          paymentBreakdown: data.paymentBreakdown || [],
          createdAt: data.createdAt || Timestamp.now(),
          ...data,
        };
      });
      setSalesWithPayments(sales);
      
      // Calculate summary
      const totalSales = sales.reduce((sum, sale) => sum + (sale.totalRevenue || 0), 0);
      
      // Calculate profit from sales
      let totalProfit = 0;
      sales.forEach(sale => {
        totalProfit += sale.profit || 0;
      });
      
      // Calculate payment method breakdown
      const cashSales = sales.reduce((sum, sale) => {
        const breakdown = sale.paymentBreakdown || [];
        const cashAmount = breakdown.filter((pb: PaymentBreakdown) => pb.method === 'cash').reduce((s: number, pb: PaymentBreakdown) => s + pb.amount, 0);
        return sum + cashAmount;
      }, 0);
      const transferSales = sales.reduce((sum, sale) => {
        const breakdown = sale.paymentBreakdown || [];
        const transferAmount = breakdown.filter((pb: PaymentBreakdown) => pb.method === 'transfer').reduce((s: number, pb: PaymentBreakdown) => s + pb.amount, 0);
        return sum + transferAmount;
      }, 0);
      const posSales = sales.reduce((sum, sale) => {
        const breakdown = sale.paymentBreakdown || [];
        const posAmount = breakdown.filter((pb: PaymentBreakdown) => pb.method === 'pos').reduce((s: number, pb: PaymentBreakdown) => s + pb.amount, 0);
        return sum + posAmount;
      }, 0);
      const splitPayments = sales.reduce((sum, sale) => {
        const breakdown = sale.paymentBreakdown || [];
        const splitAmount = breakdown.filter((pb: PaymentBreakdown) => pb.method === 'split').reduce((s: number, pb: PaymentBreakdown) => s + pb.amount, 0);
        return sum + splitAmount;
      }, 0);
      const creditSales = sales.reduce((sum, sale) => {
        const breakdown = sale.paymentBreakdown || [];
        const creditAmount = breakdown.filter((pb: PaymentBreakdown) => pb.method === 'credit').reduce((s: number, pb: PaymentBreakdown) => s + pb.amount, 0);
        return sum + creditAmount;
      }, 0);
      
      const expectedCashCollections = cashSales + splitPayments * 0.5;
      const expectedBankCollections = transferSales + posSales + splitPayments * 0.5;
      
      // TODO: Fetch actual reconciliation data from database
      // For now, use expected values as confirmed (will be replaced with real reconciliation data)
      const confirmedCashCollections = expectedCashCollections;
      const confirmedBankCollections = expectedBankCollections;
      
      const outstandingCollections = 0; // Will be calculated from actual reconciliation data
      
      const matchedTransactions = sales.length; // Will be calculated from actual reconciliation data
      const unmatchedSales = 0; // Will be calculated from actual reconciliation data
      const unmatchedBankTransactions = 0; // Will be calculated from actual reconciliation data
      const pendingReconciliation = 0; // Will be calculated from actual reconciliation data
      
      const alerts = {
        cashShortages: 0,
        missingTransfers: 0,
        unmatchedDeposits: 0,
        overpayments: 0,
        duplicatePayments: 0,
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

      // Load restaurant-specific profit metrics
      if (restaurant) {
        await loadRestaurantProfitMetrics(firestore, user.businessId, selectedPeriod, totalSales, totalProfit);
      }
    } catch (error) {
      console.error('Error loading money control summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantProfitMetrics = async (
    firestore: any,
    businessId: string,
    period: 'today' | 'week' | 'month' | 'all',
    totalSales: number,
    totalProfit: number
  ) => {
    try {
      let startDate: Date;
      if (period === 'today') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate = new Date(0); // All time
      }

      // Load expenses
      const expensesQuery = query(
        collection(firestore, 'businesses', businessId, 'expenses'),
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      
      let inventoryPurchases = 0;
      let operatingExpenses = 0;
      let payrollExpenses = 0;

      expensesSnapshot.forEach(doc => {
        const data = doc.data();
        const category = data.category?.toLowerCase() || '';
        const amount = data.amount || 0;

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
  };

  const StatCard = ({ icon, label, value, trend, color }: { 
    icon: string; 
    label: string; 
    value: string; 
    trend?: string;
    color?: string;
  }) => (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color || '#EDE8FC' }}>
        <span>{icon}</span>
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
    const total = breakdown.reduce((sum, pb) => sum + pb.amount, 0);
    const cashAmount = breakdown.filter(pb => pb.method === 'cash').reduce((sum, pb) => sum + pb.amount, 0);
    const bankAmount = breakdown.filter(pb => ['transfer', 'pos', 'card'].includes(pb.method)).reduce((sum, pb) => sum + pb.amount, 0);
    // TODO: Fetch actual reconciliation status from database
    const isReconciled = true; // Placeholder - will be replaced with actual reconciliation data
    
    return (
      <div className={styles.saleRow}>
        <div className={styles.saleInfo}>
          <div className={styles.saleDate}>{sale.createdAt?.toDate()?.toLocaleDateString()}</div>
          <div className={styles.saleTotal}>{formatMoney(total)}</div>
        </div>
        <div className={styles.salePayments}>
          {breakdown.map((pb, idx) => (
            <div key={idx} className={styles.salePayment}>
              <span className={styles.paymentMethod}>{pb.method}</span>
              <span className={styles.paymentAmount}>{formatMoney(pb.amount)}</span>
            </div>
          ))}
        </div>
        <div className={styles.saleReconciliation}>
          <div className={`${styles.reconStatus} ${isReconciled ? styles.reconMatched : styles.reconPending}`}>
            {isReconciled ? '✓ Matched' : '⏳ Pending'}
          </div>
        </div>
      </div>
    );
  };

  const AlertItem = ({ type, count }: { type: string; count: number }) => (
    <div className={styles.alertItem}>
      <div className={styles.alertIcon}>⚠️</div>
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

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : summary ? (
        <div className={styles.content}>
          {/* Sales Summary */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Sales Summary</h2>
            <div className={styles.statsGrid}>
              <StatCard icon="💰" label="Total Sales" value={formatMoney(summary.totalSales)} />
              <StatCard icon="💵" label="Cash Sales" value={formatMoney(summary.cashSales)} color="#DCFCE7" />
              <StatCard icon="📱" label="Transfer Sales" value={formatMoney(summary.transferSales)} color="#DBEAFE" />
              <StatCard icon="💳" label="POS Sales" value={formatMoney(summary.posSales)} color="#FCE7F3" />
              <StatCard icon="🔄" label="Split Payments" value={formatMoney(summary.splitPayments)} color="#FEF3C7" />
              <StatCard icon="📝" label="Credit Sales" value={formatMoney(summary.creditSales)} color="#FEE2E2" />
            </div>
          </section>

          {/* Restaurant Profit Tracking - Only for restaurants */}
          {isRestaurant && restaurantProfitMetrics && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Restaurant Profit Tracking</h2>
              <div className={styles.statsGrid}>
                <StatCard icon="📦" label="Inventory Purchases" value={formatMoney(restaurantProfitMetrics.inventoryPurchases)} color="#DBEAFE" />
                <StatCard icon="⚡" label="Operating Expenses" value={formatMoney(restaurantProfitMetrics.operatingExpenses)} color="#FEE2E2" />
                <StatCard icon="👥" label="Payroll Expenses" value={formatMoney(restaurantProfitMetrics.payrollExpenses)} color="#FEF3C7" />
                <StatCard icon="📊" label="Estimated Profit" value={formatMoney(restaurantProfitMetrics.estimatedProfit)} color="#DCFCE7" />
                <StatCard icon="🍽️" label="Food Cost %" value={`${restaurantProfitMetrics.foodCostPercentage.toFixed(1)}%`} color="#FCE7F3" />
              </div>
            </section>
          )}

          {/* Collections Summary */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Collections Summary</h2>
            <div className={styles.statsGrid}>
              <StatCard icon="📥" label="Expected Cash" value={formatMoney(summary.expectedCashCollections)} color="#DCFCE7" />
              <StatCard icon="🏦" label="Expected Bank" value={formatMoney(summary.expectedBankCollections)} color="#DBEAFE" />
              <StatCard icon="✅" label="Confirmed Cash" value={formatMoney(summary.confirmedCashCollections)} color="#DCFCE7" />
              <StatCard icon="✅" label="Confirmed Bank" value={formatMoney(summary.confirmedBankCollections)} color="#DBEAFE" />
              <StatCard icon="⏳" label="Outstanding" value={formatMoney(summary.outstandingCollections)} color="#FEF3C7" />
            </div>
          </section>

          {/* Reconciliation Summary */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Reconciliation Summary</h2>
            <div className={styles.statsGrid}>
              <StatCard icon="🔗" label="Matched Transactions" value={summary.matchedTransactions.toString()} color="#DCFCE7" />
              <StatCard icon="❓" label="Unmatched Sales" value={summary.unmatchedSales.toString()} color="#FEE2E2" />
              <StatCard icon="❓" label="Unmatched Bank" value={summary.unmatchedBankTransactions.toString()} color="#FEE2E2" />
              <StatCard icon="⏳" label="Pending Reconciliation" value={summary.pendingReconciliation.toString()} color="#FEF3C7" />
            </div>
          </section>

          {/* Alerts */}
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

          {/* Sales with Payment Breakdown */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Sales & Reconciliation</h2>
            <div className={styles.salesList}>
              {salesWithPayments.slice(0, 10).map(sale => (
                <SaleRow key={sale.id} sale={sale} />
              ))}
            </div>
          </section>

          {/* Business Insights & Analytics */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Business Insights & Analytics</h2>
            <div className={styles.insightsGrid}>
              {/* Sales Trend */}
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}>📈</span>
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
                              {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(trend))}%
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

              {/* Payment Method Preference */}
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}>💳</span>
                  <span className={styles.insightTitle}>Payment Preference</span>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightValue}>
                    {summary ? (() => {
                      const total = summary.cashSales + summary.transferSales + summary.posSales + summary.splitPayments;
                      if (total === 0) return <span className={styles.noData}>No data</span>;
                      
                      const methods = [
                        { name: 'Cash', value: summary.cashSales, icon: '💵' },
                        { name: 'Transfer', value: summary.transferSales, icon: '📱' },
                        { name: 'POS', value: summary.posSales, icon: '💳' },
                        { name: 'Split', value: summary.splitPayments, icon: '🔄' },
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

              {/* Collection Efficiency */}
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}>🎯</span>
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

              {/* Cash Flow Health */}
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}>💰</span>
                  <span className={styles.insightTitle}>Cash Flow Health</span>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightValue}>
                    {summary ? (() => {
                      const cashRatio = summary.cashSales / (summary.totalSales || 1);
                      const bankRatio = (summary.transferSales + summary.posSales) / (summary.totalSales || 1);
                      
                      let health = 'Balanced';
                      let color = '#16A34A';
                      
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

            {/* Recommendations */}
            <div className={styles.recommendations}>
              <h3 className={styles.recommendationsTitle}>💡 Recommendations</h3>
              <div className={styles.recommendationsList}>
                {summary ? (() => {
                  const recommendations = [];
                  
                  // Cash shortage recommendation
                  if (summary.alerts.cashShortages > 0) {
                    recommendations.push({
                      priority: 'high',
                      text: `Address ${summary.alerts.cashShortages} cash shortage${summary.alerts.cashShortages > 1 ? 'es' : ''} by improving cash handling procedures`
                    });
                  }
                  
                  // Collection efficiency recommendation
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
                  
                  // Reconciliation recommendation
                  if (summary.pendingReconciliation > 5) {
                    recommendations.push({
                      priority: 'medium',
                      text: `Reconcile ${summary.pendingReconciliation} pending transactions to ensure accurate records`
                    });
                  }
                  
                  // Payment method recommendation
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
