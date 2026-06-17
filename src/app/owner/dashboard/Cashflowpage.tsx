'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Pagination } from '@/components/Pagination';
import { getUserPlan } from '@/lib/featureRestrictions';
import styles from './Cashflowpage.module.css';

// ═══════════════════════════════════════════
//  CashflowPage — Cash flow tracking with bank integration
// ═══════════════════════════════════════════

type ViewPeriod = 'daily' | 'weekly' | 'monthly';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  currentBalance: number;
  isActive: boolean;
  isDefault: boolean;
}

interface CashFlowRecord {
  id: string;
  date: Timestamp;
  moneyIn: {
    sales: number;
    collections: number;
    deposits: number;
    transfers: number;
    other: number;
    total: number;
  };
  moneyOut: {
    expenses: number;
    supplierPayments: number;
    withdrawals: number;
    transfers: number;
    purchases: number;
    other: number;
    total: number;
  };
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

interface BankTransaction {
  id: string;
  transactionNumber: string;
  bankAccountId: string;
  accountName: string;
  type: 'money_in' | 'money_out';
  category: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: Timestamp;
}

export function CashflowPage() {
  const { showToast, user } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('daily');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashFlowRecords, setCashFlowRecords] = useState<CashFlowRecord[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isProUser, setIsProUser] = useState<boolean | null>(null);

  useEffect(() => {
    checkPlan();
    setCurrentPage(1);
    loadData();
  }, [businessId, firestore, viewPeriod]);

  const checkPlan = async () => {
    if (!user?.id) return;

    try {
      const plan = await getUserPlan(user.id);
      const isStandardOrPro = plan === 'standard' || plan === 'pro';
      setIsProUser(isStandardOrPro);

      if (!isStandardOrPro) {
        showToast('⚠️ Cash Flow tracking requires a Standard or Pro plan');
      }
    } catch (error) {
      console.error('Error checking plan:', error);
      setIsProUser(false);
    }
  };

  const loadData = async () => {
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load bank accounts
      const accountsQuery = query(
        collection(firestore, 'businesses', businessId, 'bankAccounts'),
        where('isActive', '==', true)
      );
      
      const accountsSnapshot = await getDocs(accountsQuery);
      const accountsList: BankAccount[] = [];
      
      accountsSnapshot.forEach(doc => {
        const data = doc.data();
        accountsList.push({
          id: doc.id,
          accountName: data.accountName,
          bankName: data.bankName,
          currentBalance: data.currentBalance,
          isActive: data.isActive,
          isDefault: data.isDefault,
        });
      });
      
      setBankAccounts(accountsList);
      
      // Load cash flow records based on view period
      const now = new Date();
      let startDate: Date;
      
      if (viewPeriod === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (viewPeriod === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const cashFlowQuery = query(
        collection(firestore, 'businesses', businessId, 'cashFlow'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc')
      );
      
      const cashFlowSnapshot = await getDocs(cashFlowQuery);
      const cashFlowList: CashFlowRecord[] = [];
      
      cashFlowSnapshot.forEach(doc => {
        const data = doc.data();
        cashFlowList.push({
          id: doc.id,
          date: data.date,
          moneyIn: data.moneyIn,
          moneyOut: data.moneyOut,
          netCashFlow: data.netCashFlow,
          openingBalance: data.openingBalance,
          closingBalance: data.closingBalance,
        });
      });
      
      setCashFlowRecords(cashFlowList);
      
      // Load recent bank transactions
      const transactionsQuery = query(
        collection(firestore, 'businesses', businessId, 'bankTransactions'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsList: BankTransaction[] = [];
      
      transactionsSnapshot.forEach(doc => {
        const data = doc.data();
        transactionsList.push({
          id: doc.id,
          transactionNumber: data.transactionNumber,
          bankAccountId: data.bankAccountId,
          accountName: data.accountName,
          type: data.type,
          category: data.category,
          amount: data.amount,
          balanceAfter: data.balanceAfter,
          description: data.description,
          createdAt: data.createdAt,
        });
      });
      
      setBankTransactions(transactionsList);
    } catch (error) {
      console.error('Error loading cash flow data:', error);
      showToast('❌ Failed to load cash flow data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalBalance = () => {
    return bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  };

  const getTotalMoneyIn = () => {
    return cashFlowRecords.reduce((sum, r) => sum + r.moneyIn.total, 0);
  };

  const getTotalMoneyOut = () => {
    return cashFlowRecords.reduce((sum, r) => sum + r.moneyOut.total, 0);
  };

  const getNetCashFlow = () => {
    return getTotalMoneyIn() - getTotalMoneyOut();
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  // Pagination logic
  const totalPages = Math.ceil(bankTransactions.length / itemsPerPage);
  const paginatedTransactions = bankTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Cash Flow</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (isProUser === false) {
    // Freemium model: Show limited data with upgrade prompts
    const limitedTransactions = bankTransactions.slice(0, 5); // Show only 5 transactions
    const limitedMoneyIn = getTotalMoneyIn();
    const limitedMoneyOut = getTotalMoneyOut();
    const limitedNetFlow = limitedMoneyIn - limitedMoneyOut;
    
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Cash Flow</h2>
            <p className={styles.pageDesc}>Track money in and out across all accounts</p>
          </div>
          <div className={styles.freemiumBadge}>
            <span className={styles.freemiumBadgeText}>Starter Plan</span>
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className={styles.upgradeBanner}>
          <div className={styles.upgradeBannerContent}>
            <div className={styles.upgradeBannerIcon}>�</div>
            <div className={styles.upgradeBannerText}>
              <h3 className={styles.upgradeBannerTitle}>Unlock Full Cash Flow Insights</h3>
              <p className={styles.upgradeBannerMessage}>
                You're viewing limited data. Upgrade to Pro for complete tracking, analytics, and bank integration.
              </p>
            </div>
            <button className={styles.upgradeButton}>Upgrade to Pro</button>
          </div>
        </div>

        {/* Limited Summary Cards */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Money In</span>
            <span className={`${styles.summaryValue} ${styles.moneyIn}`}>
              {formatMoney(limitedMoneyIn)}
            </span>
            <span className={styles.summaryNote}>Limited view</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Money Out</span>
            <span className={`${styles.summaryValue} ${styles.moneyOut}`}>
              {formatMoney(limitedMoneyOut)}
            </span>
            <span className={styles.summaryNote}>Limited view</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Net Flow</span>
            <span className={`${styles.summaryValue} ${limitedNetFlow >= 0 ? styles.moneyIn : styles.moneyOut}`}>
              {formatMoney(limitedNetFlow)}
            </span>
            <span className={styles.summaryNote}>Limited view</span>
          </div>
        </div>

        {/* Limited Transactions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Recent Transactions</h3>
            <span className={styles.limitedBadge}>Showing 5 of {bankTransactions.length}</span>
          </div>
          {limitedTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No transactions recorded</p>
            </div>
          ) : (
            <div className={styles.transactionList}>
              {limitedTransactions.map(txn => (
                <div key={txn.id} className={styles.transactionCard}>
                  <div className={styles.transactionIcon}>
                    {txn.type === 'money_in' ? '💰' : '💸'}
                  </div>
                  <div className={styles.transactionDetails}>
                    <div className={styles.transactionHeader}>
                      <span className={styles.transactionName}>{txn.accountName}</span>
                      <span className={`${styles.transactionAmount} ${txn.type === 'money_in' ? styles.moneyIn : styles.moneyOut}`}>
                        {txn.type === 'money_in' ? '+' : '-'}{formatMoney(txn.amount)}
                      </span>
                    </div>
                    <div className={styles.transactionInfo}>
                      <span className={styles.transactionCategory}>{txn.category}</span>
                      <span className={styles.transactionDate}>{formatDate(txn.createdAt)}</span>
                    </div>
                    <p className={styles.transactionDescription}>{txn.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upgrade Prompt at Bottom */}
        <div className={styles.upgradePrompt}>
          <div className={styles.upgradePromptContent}>
            <h4 className={styles.upgradePromptTitle}>Need More Cash Flow Data?</h4>
            <p className={styles.upgradePromptMessage}>
              Upgrade to Pro to see all transactions, filter by date range, export reports, and connect your bank accounts for automatic tracking.
            </p>
            <button className={styles.upgradeButton}>Upgrade Now</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Cash Flow</h2>
          <p className={styles.pageDesc}>Track money in and out across all accounts</p>
        </div>
        <div className={styles.viewPeriodToggle}>
          <button
            className={`${styles.periodButton} ${viewPeriod === 'daily' ? styles.active : ''}`}
            onClick={() => setViewPeriod('daily')}
          >
            Daily
          </button>
          <button
            className={`${styles.periodButton} ${viewPeriod === 'weekly' ? styles.active : ''}`}
            onClick={() => setViewPeriod('weekly')}
          >
            Weekly
          </button>
          <button
            className={`${styles.periodButton} ${viewPeriod === 'monthly' ? styles.active : ''}`}
            onClick={() => setViewPeriod('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💰</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Total Balance</span>
            <span className={styles.summaryValue}>{formatMoney(getTotalBalance())}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📥</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Money In</span>
            <span className={`${styles.summaryValue} ${styles.moneyIn}`}>+{formatMoney(getTotalMoneyIn())}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📤</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Money Out</span>
            <span className={`${styles.summaryValue} ${styles.moneyOut}`}>-{formatMoney(getTotalMoneyOut())}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📊</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Net Cash Flow</span>
            <span className={`${styles.summaryValue} ${getNetCashFlow() >= 0 ? styles.moneyIn : styles.moneyOut}`}>
              {getNetCashFlow() >= 0 ? '+' : ''}{formatMoney(getNetCashFlow())}
            </span>
          </div>
        </div>
      </div>

      {/* Bank Accounts Summary */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Bank Accounts</h3>
        {bankAccounts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No bank accounts added yet</p>
          </div>
        ) : (
          <div className={styles.accountsGrid}>
            {bankAccounts.map(account => (
              <div key={account.id} className={styles.accountCard}>
                <div className={styles.accountHeader}>
                  <div className={styles.accountIcon}>🏦</div>
                  <div className={styles.accountInfo}>
                    <h4 className={styles.accountName}>{account.accountName}</h4>
                    <span className={styles.accountBank}>{account.bankName}</span>
                  </div>
                  {account.isDefault && (
                    <div className={styles.defaultBadge}>Default</div>
                  )}
                </div>
                <div className={styles.accountBalance}>
                  {formatMoney(account.currentBalance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cash Flow Records */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cash Flow History</h3>
        {cashFlowRecords.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No cash flow records for this period</p>
          </div>
        ) : (
          <div className={styles.cashFlowList}>
            {cashFlowRecords.map(record => (
              <div key={record.id} className={styles.cashFlowCard}>
                <div className={styles.cashFlowDate}>
                  {formatDate(record.date)}
                </div>
                <div className={styles.cashFlowDetails}>
                  <div className={styles.cashFlowItem}>
                    <span className={styles.cashFlowLabel}>Money In:</span>
                    <span className={`${styles.cashFlowValue} ${styles.moneyIn}`}>
                      +{formatMoney(record.moneyIn.total)}
                    </span>
                  </div>
                  <div className={styles.cashFlowItem}>
                    <span className={styles.cashFlowLabel}>Money Out:</span>
                    <span className={`${styles.cashFlowValue} ${styles.moneyOut}`}>
                      -{formatMoney(record.moneyOut.total)}
                    </span>
                  </div>
                  <div className={styles.cashFlowItem}>
                    <span className={styles.cashFlowLabel}>Net Flow:</span>
                    <span className={`${styles.cashFlowValue} ${record.netCashFlow >= 0 ? styles.moneyIn : styles.moneyOut}`}>
                      {record.netCashFlow >= 0 ? '+' : ''}{formatMoney(record.netCashFlow)}
                    </span>
                  </div>
                </div>
                <div className={styles.cashFlowBalance}>
                  {formatMoney(record.closingBalance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bank Transactions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Transactions</h3>
        {bankTransactions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No recent transactions</p>
          </div>
        ) : (
          <>
            <div className={styles.transactionsList}>
              {paginatedTransactions.map(transaction => (
                <div key={transaction.id} className={styles.transactionCard}>
                  <div className={styles.transactionHeader}>
                    <span className={styles.transactionNumber}>{transaction.transactionNumber}</span>
                    <span className={`${styles.transactionType} ${transaction.type === 'money_in' ? styles.moneyIn : styles.moneyOut}`}>
                      {transaction.type === 'money_in' ? '↑' : '↓'} {transaction.category}
                    </span>
                  </div>
                  <div className={styles.transactionDetails}>
                    <div className={styles.transactionDetail}>
                      <span className={styles.transactionLabel}>Account:</span>
                      <span className={styles.transactionValue}>{transaction.accountName}</span>
                    </div>
                    <div className={styles.transactionDetail}>
                      <span className={styles.transactionLabel}>Description:</span>
                      <span className={styles.transactionValue}>{transaction.description}</span>
                    </div>
                    <div className={styles.transactionDetail}>
                      <span className={styles.transactionLabel}>Date:</span>
                      <span className={styles.transactionValue}>{formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>
                  <div className={`${styles.transactionAmount} ${transaction.type === 'money_in' ? styles.moneyIn : styles.moneyOut}`}>
                    {transaction.type === 'money_in' ? '+' : '-'}{formatMoney(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={bankTransactions.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
