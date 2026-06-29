'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Supplier, SupplierLedgerTransaction } from './types';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import styles from './SupplierDashboardPage.module.css';

export function SupplierDashboardPage() {
  const { navigateTo, showToast, user } = useApp();
  const { formatMoney, currencyCode } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '90' | '180' | '365'>('30');

  useEffect(() => {
    loadData();
  }, [businessId, firestore, selectedPeriod]);

  const loadData = async () => {
    if (!businessId || !firestore) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load suppliers
      const suppliersQuery = query(
        collection(firestore, 'businesses', businessId, 'suppliers'),
        where('status', '==', 'active')
      );
      const suppliersSnapshot = await getDocs(suppliersQuery);
      const suppliersList: Supplier[] = [];
      
      suppliersSnapshot.forEach(doc => {
        const data = doc.data();
        suppliersList.push({
          id: doc.id,
          businessId: data.businessId || '',
          supplierName: data.supplierName || '',
          businessName: data.businessName || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          notes: data.notes || '',
          paymentTerms: data.paymentTerms || 'net_30',
          customPaymentDays: data.customPaymentDays || 30,
          creditLimit: data.creditLimit || 0,
          openingBalance: data.openingBalance || 0,
          currentBalance: data.currentBalance || 0,
          category: data.category || 'general',
          status: data.status || 'active',
          taxId: data.taxId || '',
          bankAccount: data.bankAccount || null,
          contactPerson: data.contactPerson || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastPurchaseDate: data.lastPurchaseDate?.toDate(),
          lastPaymentDate: data.lastPaymentDate?.toDate(),
          totalPurchases: data.totalPurchases || 0,
          totalPayments: data.totalPayments || 0,
          purchaseCount: data.purchaseCount || 0,
          paymentCount: data.paymentCount || 0,
          averagePaymentDays: data.averagePaymentDays || 0,
          creditUtilization: data.creditUtilization || 0,
        });
      });
      
      setSuppliers(suppliersList);

      // Load supplier ledger
      const ledgerQuery = query(
        collection(firestore, 'businesses', businessId, 'supplierLedger'),
        orderBy('date', 'desc')
      );
      const ledgerSnapshot = await getDocs(ledgerQuery);
      const ledgerList: SupplierLedgerTransaction[] = [];
      
      ledgerSnapshot.forEach(doc => {
        const data = doc.data();
        ledgerList.push({
          id: doc.id,
          supplierId: data.supplierId || '',
          businessId: data.businessId || '',
          type: data.type || 'purchase',
          amount: data.amount || 0,
          balanceAfter: data.balanceAfter || 0,
          description: data.description || '',
          reference: data.reference || '',
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || '',
          metadata: data.metadata || {},
        });
      });
      
      setSupplierLedger(ledgerList);
    } catch (error) {
      console.error('Error loading supplier dashboard data:', error);
      showToast('Failed to load supplier data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (supplier: Supplier): number => {
    if (!supplier.lastPurchaseDate) return 30;
    
    const paymentDays = supplier.paymentTerms === 'cash' ? 0 : 
      supplier.paymentTerms === 'net_7' ? 7 :
      supplier.paymentTerms === 'net_14' ? 14 :
      supplier.paymentTerms === 'net_30' ? 30 :
      supplier.paymentTerms === 'net_60' ? 60 :
      supplier.paymentTerms === 'net_90' ? 90 :
      supplier.customPaymentDays || 30;
    
    const dueDate = new Date(supplier.lastPurchaseDate.getTime() + paymentDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (supplier: Supplier): boolean => {
    return getDaysUntilDue(supplier) < 0;
  };

  // Calculate analytics
  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
  const totalCreditLimit = suppliers.reduce((sum, s) => sum + s.creditLimit, 0);
  const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
  const totalPayments = suppliers.reduce((sum, s) => sum + s.totalPayments, 0);
  const overdueSuppliers = suppliers.filter(s => isOverdue(s) && s.currentBalance > 0);
  const overdueAmount = overdueSuppliers.reduce((sum, s) => sum + s.currentBalance, 0);
  const activeSuppliers = suppliers.filter(s => s.currentBalance > 0).length;
  const averageCreditUtilization = suppliers.length > 0 
    ? suppliers.reduce((sum, s) => sum + s.creditUtilization, 0) / suppliers.length 
    : 0;

  // Top suppliers by spend
  const topSuppliersBySpend = [...suppliers]
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, 5);

  // Suppliers with highest outstanding
  const suppliersWithHighestOutstanding = [...suppliers]
    .filter(s => s.currentBalance > 0)
    .sort((a, b) => b.currentBalance - a.currentBalance)
    .slice(0, 5);

  // Recent transactions
  const recentTransactions = supplierLedger.slice(0, 10);

  // Payment terms distribution
  const paymentTermsDistribution = suppliers.reduce((acc, supplier) => {
    acc[supplier.paymentTerms] = (acc[supplier.paymentTerms] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Supplier Dashboard</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Supplier Dashboard</h2>
          <p className={styles.pageDesc}>Analytics and insights for your supplier relationships</p>
        </div>
        <div className={styles.periodSelector}>
          <select
            className={styles.select}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 180 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </CardIcon>
            Total Outstanding
          </CardHeader>
          <div className={styles.summaryValue}>{formatMoney(totalOutstanding)}</div>
          <div className={styles.summaryLabel}>{activeSuppliers} active suppliers</div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--red-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2} width={20} height={20}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </CardIcon>
            Overdue Amount
          </CardHeader>
          <div className={styles.summaryValue} style={{ color: 'var(--red)' }}>{formatMoney(overdueAmount)}</div>
          <div className={styles.summaryLabel}>{overdueSuppliers.length} overdue suppliers</div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--green-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2} width={20} height={20}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </CardIcon>
            Total Purchases
          </CardHeader>
          <div className={styles.summaryValue}>{formatMoney(totalPurchases)}</div>
          <div className={styles.summaryLabel}>All time spend</div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} width={20} height={20}>
                <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
              </svg>
            </CardIcon>
            Total Payments
          </CardHeader>
          <div className={styles.summaryValue}>{formatMoney(totalPayments)}</div>
          <div className={styles.summaryLabel}>Payments made</div>
        </Card>
      </div>

      {/* Credit Health */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Credit Health</h3>
        <div className={styles.creditHealthGrid}>
          <Card>
            <CardHeader>
              <CardIcon bg="var(--amber-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} width={20} height={20}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </CardIcon>
              Average Credit Utilization
            </CardHeader>
            <div className={styles.creditHealthValue}>{averageCreditUtilization.toFixed(1)}%</div>
            <div className={styles.creditHealthBar}>
              <div 
                className={styles.creditHealthFill} 
                style={{ 
                  width: `${Math.min(averageCreditUtilization, 100)}%`,
                  backgroundColor: averageCreditUtilization > 80 ? 'var(--red)' : averageCreditUtilization > 60 ? 'var(--amber)' : 'var(--green)'
                }}
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardIcon bg="var(--purple-lt)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </CardIcon>
              Total Credit Limit
            </CardHeader>
            <div className={styles.creditHealthValue}>{formatMoney(totalCreditLimit)}</div>
            <div className={styles.creditHealthLabel}>Available: {formatMoney(totalCreditLimit - totalOutstanding)}</div>
          </Card>

          <Card>
            <CardHeader>
              <CardIcon bg="var(--blue-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} width={20} height={20}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </CardIcon>
              Total Suppliers
            </CardHeader>
            <div className={styles.creditHealthValue}>{suppliers.length}</div>
            <div className={styles.creditHealthLabel}>{activeSuppliers} with outstanding balance</div>
          </Card>
        </div>
      </div>

      {/* Top Suppliers */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Top Suppliers by Spend</h3>
        <Card>
          <div className={styles.supplierList}>
            {topSuppliersBySpend.length === 0 ? (
              <div className={styles.emptyState}>No supplier data available</div>
            ) : (
              topSuppliersBySpend.map((supplier, index) => (
                <div key={supplier.id} className={styles.supplierItem}>
                  <div className={styles.supplierRank}>{index + 1}</div>
                  <div className={styles.supplierInfo}>
                    <div className={styles.supplierName}>{supplier.businessName}</div>
                    <div className={styles.supplierMeta}>{supplier.purchaseCount} purchases</div>
                  </div>
                  <div className={styles.supplierAmount}>{formatMoney(supplier.totalPurchases)}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Outstanding Balances */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Highest Outstanding Balances</h3>
        <Card>
          <div className={styles.supplierList}>
            {suppliersWithHighestOutstanding.length === 0 ? (
              <div className={styles.emptyState}>No outstanding balances</div>
            ) : (
              suppliersWithHighestOutstanding.map((supplier, index) => {
                const daysUntilDue = getDaysUntilDue(supplier);
                const overdue = daysUntilDue < 0;
                
                return (
                  <div key={supplier.id} className={styles.supplierItem}>
                    <div className={styles.supplierInfo}>
                      <div className={styles.supplierName}>{supplier.businessName}</div>
                      <div className={styles.supplierMeta}>
                        {supplier.paymentTerms.toUpperCase()} • {overdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                      </div>
                    </div>
                    <div className={`${styles.supplierAmount} ${overdue ? styles.overdue : ''}`}>
                      {formatMoney(supplier.currentBalance)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Transactions</h3>
        <Card>
          <div className={styles.transactionList}>
            {recentTransactions.length === 0 ? (
              <div className={styles.emptyState}>No recent transactions</div>
            ) : (
              recentTransactions.map((transaction) => {
                const supplier = suppliers.find(s => s.id === transaction.supplierId);
                return (
                  <div key={transaction.id} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <div className={styles.transactionDescription}>{transaction.description}</div>
                      <div className={styles.transactionMeta}>
                        {supplier?.businessName || 'Unknown Supplier'} • {transaction.date.toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`${styles.transactionAmount} ${transaction.type === 'payment' ? styles.payment : styles.purchase}`}>
                      {transaction.type === 'payment' ? '-' : '+'}{formatMoney(transaction.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Payment Terms Distribution */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Payment Terms Distribution</h3>
        <Card>
          <div className={styles.termsDistribution}>
            {Object.entries(paymentTermsDistribution).map(([term, count]) => (
              <div key={term} className={styles.termItem}>
                <div className={styles.termLabel}>{term.toUpperCase()}</div>
                <div className={styles.termBar}>
                  <div 
                    className={styles.termFill}
                    style={{ width: `${(count / suppliers.length) * 100}%` }}
                  />
                </div>
                <div className={styles.termCount}>{count} suppliers</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

