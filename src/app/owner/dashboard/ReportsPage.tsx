'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, orderBy } from 'firebase/firestore';
import styles from './ReportsPage.module.css';

type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

interface PnLData {
  revenue: number;
  cogs: number; // Cost of Goods Sold
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  profitMargin: number;
  salesCount: number;
  expenseCount: number;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface RevenueBreakdown {
  paymentMethod: string;
  amount: number;
  percentage: number;
}

export function ReportsPage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const firestore = useFirestore();
  
  const [period, setPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown[]>([]);

  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const { auth } = initializeFirebase();
        const currentUser = auth.currentUser;
        
        if (!currentUser) return;

        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBusinessId(userData.businessId || null);
        }
      } catch (error) {
        console.error('Error fetching business ID:', error);
      }
    }

    fetchBusinessId();
  }, [firestore]);

  useEffect(() => {
    if (businessId) {
      fetchPnLData();
    }
  }, [businessId, period, startDate, endDate]);

  async function fetchPnLData() {
    if (!businessId || !firestore) return;

    try {
      setLoading(true);
      
      const now = new Date();
      let start: Date, end: Date;

      switch (period) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          start = new Date(now);
          start.setDate(now.getDate() - 7);
          end = new Date(now);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
          end = endDate ? new Date(endDate) : new Date(now);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now);
      }

      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      // Fetch sales
      const salesQuery = query(
        collection(firestore, 'businesses', businessId, 'sales'),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );
      const salesSnapshot = await getDocs(salesQuery);

      // Fetch expenses
      const expensesQuery = query(
        collection(firestore, 'businesses', businessId, 'expenses'),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );
      const expensesSnapshot = await getDocs(expensesQuery);

      // Calculate P&L
      let revenue = 0;
      let cogs = 0;
      let operatingExpenses = 0;
      let salesCount = 0;
      const paymentMethodTotals: Record<string, number> = {};
      const expenseCategoryTotals: Record<string, number> = {};

      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const total = data.totalRevenue || data.total || 0;
        const profit = data.profit || 0;
        const paymentMethod = data.paymentMethod || 'cash';
        
        revenue += total;
        cogs += (total - profit);
        salesCount++;
        
        paymentMethodTotals[paymentMethod] = (paymentMethodTotals[paymentMethod] || 0) + total;
      });

      expensesSnapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        const category = data.category || 'Other';
        
        operatingExpenses += amount;
        expenseCategoryTotals[category] = (expenseCategoryTotals[category] || 0) + amount;
      });

      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - operatingExpenses;
      const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0;

      setPnlData({
        revenue,
        cogs,
        grossProfit,
        operatingExpenses,
        netProfit,
        profitMargin,
        salesCount,
        expenseCount: expensesSnapshot.size,
      });

      // Calculate expense categories breakdown
      const expenseCategoriesArray = Object.entries(expenseCategoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: operatingExpenses > 0 ? (amount / operatingExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
      setExpenseCategories(expenseCategoriesArray);

      // Calculate revenue breakdown by payment method
      const revenueBreakdownArray = Object.entries(paymentMethodTotals)
        .map(([paymentMethod, amount]) => ({
          paymentMethod,
          amount,
          percentage: revenue > 0 ? (amount / revenue) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
      setRevenueBreakdown(revenueBreakdownArray);

    } catch (error) {
      console.error('Error fetching P&L data:', error);
      showToast('Failed to load P&L data');
    } finally {
      setLoading(false);
    }
  }

  function handleExportReport() {
    if (!pnlData) return;
    
    const csvContent = [
      'Profit & Loss Report',
      `Period: ${period}`,
      '',
      'Revenue,Amount',
      `Total Revenue,${pnlData.revenue}`,
      `Cost of Goods Sold,${pnlData.cogs}`,
      `Gross Profit,${pnlData.grossProfit}`,
      '',
      'Expenses,Amount',
      `Operating Expenses,${pnlData.operatingExpenses}`,
      '',
      'Profit,Amount',
      `Net Profit,${pnlData.netProfit}`,
      `Profit Margin,${pnlData.profitMargin.toFixed(2)}%`,
      '',
      'Summary',
      `Sales Count,${pnlData.salesCount}`,
      `Expense Count,${pnlData.expenseCount}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pnl_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('Report exported successfully');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>P&L Reports</h1>
          <p className={styles.sub}>Track your business financial performance</p>
        </div>
        <button className={styles.exportBtn} onClick={handleExportReport} disabled={!pnlData || loading}>
          Export CSV
        </button>
      </div>

      {/* Period Selector */}
      <div className={styles.periodSelector}>
        {(['today', 'week', 'month', 'year'] as PeriodType[]).map(p => (
          <button
            key={p}
            className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button
          className={`${styles.periodBtn} ${period === 'custom' ? styles.active : ''}`}
          onClick={() => setPeriod('custom')}
        >
          Custom
        </button>
        {period === 'custom' && (
          <div className={styles.dateInputs}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
            <span className={styles.dateSeparator}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading P&L data...</p>
        </div>
      ) : pnlData ? (
        <>
          {/* P&L Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.cardLabel}>Total Revenue</div>
              <div className={`${styles.cardValue} ${styles.positive}`}>{formatMoney(pnlData.revenue)}</div>
              <div className={styles.cardSub}>{pnlData.salesCount} sales</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardLabel}>Gross Profit</div>
              <div className={`${styles.cardValue} ${styles.positive}`}>{formatMoney(pnlData.grossProfit)}</div>
              <div className={styles.cardSub}>Revenue - COGS</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardLabel}>Operating Expenses</div>
              <div className={`${styles.cardValue} ${styles.negative}`}>{formatMoney(pnlData.operatingExpenses)}</div>
              <div className={styles.cardSub}>{pnlData.expenseCount} expenses</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardLabel}>Net Profit</div>
              <div className={`${styles.cardValue} ${pnlData.netProfit >= 0 ? styles.positive : styles.negative}`}>
                {formatMoney(pnlData.netProfit)}
              </div>
              <div className={styles.cardSub}>{pnlData.profitMargin.toFixed(1)}% margin</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className={styles.breakdownGrid}>
            {/* Revenue Breakdown */}
            <div className={styles.breakdownCard}>
              <h3 className={styles.breakdownTitle}>Revenue by Payment Method</h3>
              <div className={styles.breakdownList}>
                {revenueBreakdown.map(item => (
                  <div key={item.paymentMethod} className={styles.breakdownItem}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemLabel}>{item.paymentMethod}</span>
                      <span className={styles.itemPercentage}>{item.percentage.toFixed(1)}%</span>
                    </div>
                    <span className={styles.itemAmount}>{formatMoney(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className={styles.breakdownCard}>
              <h3 className={styles.breakdownTitle}>Expenses by Category</h3>
              <div className={styles.breakdownList}>
                {expenseCategories.map(item => (
                  <div key={item.category} className={styles.breakdownItem}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemLabel}>{item.category}</span>
                      <span className={styles.itemPercentage}>{item.percentage.toFixed(1)}%</span>
                    </div>
                    <span className={`${styles.itemAmount} ${styles.negative}`}>{formatMoney(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* P&L Table */}
          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>Profit & Loss Statement</h3>
            <table className={styles.pnlTable}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className={styles.amountCol}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.sectionRow}>
                  <td colSpan={2} className={styles.sectionHeader}>Revenue</td>
                </tr>
                <tr>
                  <td>Total Sales Revenue</td>
                  <td className={`${styles.amountCol} ${styles.positive}`}>{formatMoney(pnlData.revenue)}</td>
                </tr>
                <tr>
                  <td>Cost of Goods Sold</td>
                  <td className={`${styles.amountCol} ${styles.negative}`}>{formatMoney(pnlData.cogs)}</td>
                </tr>
                <tr className={styles.totalRow}>
                  <td>Gross Profit</td>
                  <td className={`${styles.amountCol} ${styles.positive}`}>{formatMoney(pnlData.grossProfit)}</td>
                </tr>
                <tr className={styles.sectionRow}>
                  <td colSpan={2} className={styles.sectionHeader}>Expenses</td>
                </tr>
                <tr>
                  <td>Operating Expenses</td>
                  <td className={`${styles.amountCol} ${styles.negative}`}>{formatMoney(pnlData.operatingExpenses)}</td>
                </tr>
                <tr className={styles.totalRow}>
                  <td>Net Profit</td>
                  <td className={`${styles.amountCol} ${pnlData.netProfit >= 0 ? styles.positive : styles.negative}`}>
                    {formatMoney(pnlData.netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <p>No data available for the selected period</p>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
