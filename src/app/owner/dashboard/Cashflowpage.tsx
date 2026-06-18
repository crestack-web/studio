'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Pagination } from '@/components/Pagination';
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

  // Modal states
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showTakeMoneyModal, setShowTakeMoneyModal] = useState(false);
  const [showReduceStockModal, setShowReduceStockModal] = useState(false);

  // Form states
  const [newAccount, setNewAccount] = useState({ accountName: '', bankName: '', initialBalance: 0 });
  const [moneyTransaction, setMoneyTransaction] = useState({ accountId: '', amount: 0, description: '', category: '' });
  const [stockReduction, setStockReduction] = useState({ productId: '', quantity: 0, reason: '' });
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setCurrentPage(1);
    loadData();
    loadProducts();
  }, [businessId, firestore, viewPeriod]);


  const loadProducts = async () => {
    if (!businessId || !firestore) return;
    try {
      const productsQuery = query(
        collection(firestore, 'businesses', businessId, 'products'),
        where('isActive', '==', true)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsList: any[] = [];
      productsSnapshot.forEach(doc => {
        productsList.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
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

  // Add Account
  const handleAddAccount = async () => {
    if (!businessId || !firestore) return;
    try {
      const accountData = {
        accountName: newAccount.accountName,
        bankName: newAccount.bankName,
        currentBalance: newAccount.initialBalance,
        isActive: true,
        isDefault: bankAccounts.length === 0,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'businesses', businessId, 'bankAccounts'), accountData);
      showToast('✅ Account added successfully');
      setShowAddAccountModal(false);
      setNewAccount({ accountName: '', bankName: '', initialBalance: 0 });
      loadData();
    } catch (error) {
      console.error('Error adding account:', error);
      showToast('❌ Failed to add account');
    }
  };

  // Add Money
  const handleAddMoney = async () => {
    if (!businessId || !firestore) return;
    try {
      const account = bankAccounts.find(a => a.id === moneyTransaction.accountId);
      if (!account) {
        showToast('❌ Please select an account');
        return;
      }

      const newBalance = account.currentBalance + moneyTransaction.amount;
      await updateDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', moneyTransaction.accountId), {
        currentBalance: newBalance,
      });

      const transactionData = {
        transactionNumber: `TXN-${Date.now()}`,
        bankAccountId: moneyTransaction.accountId,
        accountName: account.accountName,
        type: 'money_in' as const,
        category: moneyTransaction.category || 'Deposit',
        amount: moneyTransaction.amount,
        balanceAfter: newBalance,
        description: moneyTransaction.description,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      showToast('✅ Money added successfully');
      setShowAddMoneyModal(false);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      loadData();
    } catch (error) {
      console.error('Error adding money:', error);
      showToast('❌ Failed to add money');
    }
  };

  // Take Money
  const handleTakeMoney = async () => {
    if (!businessId || !firestore) return;
    try {
      const account = bankAccounts.find(a => a.id === moneyTransaction.accountId);
      if (!account) {
        showToast('❌ Please select an account');
        return;
      }

      if (account.currentBalance < moneyTransaction.amount) {
        showToast('❌ Insufficient balance');
        return;
      }

      const newBalance = account.currentBalance - moneyTransaction.amount;
      await updateDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', moneyTransaction.accountId), {
        currentBalance: newBalance,
      });

      const transactionData = {
        transactionNumber: `TXN-${Date.now()}`,
        bankAccountId: moneyTransaction.accountId,
        accountName: account.accountName,
        type: 'money_out' as const,
        category: moneyTransaction.category || 'Withdrawal',
        amount: moneyTransaction.amount,
        balanceAfter: newBalance,
        description: moneyTransaction.description,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      showToast('✅ Money taken successfully');
      setShowTakeMoneyModal(false);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      loadData();
    } catch (error) {
      console.error('Error taking money:', error);
      showToast('❌ Failed to take money');
    }
  };

  // Reduce Stock
  const handleReduceStock = async () => {
    if (!businessId || !firestore) return;
    try {
      const product = products.find(p => p.id === stockReduction.productId);
      if (!product) {
        showToast('❌ Please select a product');
        return;
      }

      if (product.stock < stockReduction.quantity) {
        showToast('❌ Insufficient stock');
        return;
      }

      const newStock = product.stock - stockReduction.quantity;
      await updateDoc(doc(firestore, 'businesses', businessId, 'products', stockReduction.productId), {
        stock: newStock,
      });

      // Record as expense transaction
      if (bankAccounts.length > 0) {
        const defaultAccount = bankAccounts.find(a => a.isDefault) || bankAccounts[0];
        const transactionData = {
          transactionNumber: `STK-${Date.now()}`,
          bankAccountId: defaultAccount.id,
          accountName: defaultAccount.accountName,
          type: 'money_out' as const,
          category: 'Stock Reduction',
          amount: product.costPrice * stockReduction.quantity,
          balanceAfter: defaultAccount.currentBalance,
          description: `Stock reduction: ${product.name} - ${stockReduction.quantity} units. Reason: ${stockReduction.reason}`,
          createdAt: Timestamp.now(),
        };
        await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      }

      showToast('✅ Stock reduced successfully');
      setShowReduceStockModal(false);
      setStockReduction({ productId: '', quantity: 0, reason: '' });
      loadProducts();
      loadData();
    } catch (error) {
      console.error('Error reducing stock:', error);
      showToast('❌ Failed to reduce stock');
    }
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

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button className={styles.actionButton} onClick={() => setShowAddAccountModal(true)}>
          <span className={styles.actionIcon}>🏦</span>
          <span>Add Account</span>
        </button>
        <button className={styles.actionButton} onClick={() => setShowAddMoneyModal(true)}>
          <span className={styles.actionIcon}>📥</span>
          <span>Add Money</span>
        </button>
        <button className={styles.actionButton} onClick={() => setShowTakeMoneyModal(true)}>
          <span className={styles.actionIcon}>📤</span>
          <span>Take Money</span>
        </button>
        <button className={styles.actionButton} onClick={() => setShowReduceStockModal(true)}>
          <span className={styles.actionIcon}>📦</span>
          <span>Reduce Stock</span>
        </button>
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

      {/* Modals */}
      {showAddAccountModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddAccountModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add Bank Account</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Account Name</label>
              <input
                type="text"
                className={styles.formInput}
                value={newAccount.accountName}
                onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                placeholder="e.g., Main Account"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bank Name</label>
              <input
                type="text"
                className={styles.formInput}
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                placeholder="e.g., GTBank"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Initial Balance</label>
              <input
                type="number"
                className={styles.formInput}
                value={newAccount.initialBalance}
                onChange={(e) => setNewAccount({ ...newAccount, initialBalance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalButton} onClick={() => setShowAddAccountModal(false)}>Cancel</button>
              <button className={styles.modalButtonPrimary} onClick={handleAddAccount}>Add Account</button>
            </div>
          </div>
        </div>
      )}

      {showAddMoneyModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddMoneyModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add Money</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Account</label>
              <select
                className={styles.formInput}
                value={moneyTransaction.accountId}
                onChange={(e) => setMoneyTransaction({ ...moneyTransaction, accountId: e.target.value })}
              >
                <option value="">Select an account</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Amount</label>
              <input
                type="number"
                className={styles.formInput}
                value={moneyTransaction.amount}
                onChange={(e) => setMoneyTransaction({ ...moneyTransaction, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select
                className={styles.formInput}
                value={moneyTransaction.category}
                onChange={(e) => setMoneyTransaction({ ...moneyTransaction, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Sales">Sales</option>
                <option value="Deposit">Deposit</option>
                <option value="Transfer">Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <input
                type="text"
                className={styles.formInput}
                value={moneyTransaction.description}
                onChange={(e) => setMoneyTransaction({ ...moneyTransaction, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalButton} onClick={() => setShowAddMoneyModal(false)}>Cancel</button>
              <button className={styles.modalButtonPrimary} onClick={handleAddMoney}>Add Money</button>
            </div>
          </div>
        </div>
      )}

      {showTakeMoneyModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTakeMoneyModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Take Money</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Account</label>
              <select
                className={styles.formInput}
                value={moneyTransaction.accountId}
                onChange={(e) => setMoneyTransaction({ ...moneyTransaction, accountId: e.target.value })}
              >
                <option value="">Select an account</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>{account.accountName} - {account.bankName}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Amount</label>
              <input
                type="number"
                className={styles.formInput}
                value={moneyTransaction.amount}
                onChange={(e) => setMoneyTransaction({ ...moneyTransaction, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select
                className={styles.formInput}
                value={moneyTransaction.category}
                onChange={(e) => setMoneyTransaction({ ...moneyTransaction, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Expense">Expense</option>
                <option value="Withdrawal">Withdrawal</option>
                <option value="Transfer">Transfer</option>
                <option value="Purchase">Purchase</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <input
                type="text"
                className={styles.formInput}
                value={moneyTransaction.description}
                onChange={(e) => setMoneyTransaction({ ...moneyTransaction, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalButton} onClick={() => setShowTakeMoneyModal(false)}>Cancel</button>
              <button className={styles.modalButtonPrimary} onClick={handleTakeMoney}>Take Money</button>
            </div>
          </div>
        </div>
      )}

      {showReduceStockModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReduceStockModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Reduce Stock</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Product</label>
              <select
                className={styles.formInput}
                value={stockReduction.productId}
                onChange={(e) => setStockReduction({ ...stockReduction, productId: e.target.value })}
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name} (Stock: {product.stock})</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Quantity to Reduce</label>
              <input
                type="number"
                className={styles.formInput}
                value={stockReduction.quantity}
                onChange={(e) => setStockReduction({ ...stockReduction, quantity: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Reason</label>
              <input
                type="text"
                className={styles.formInput}
                value={stockReduction.reason}
                onChange={(e) => setStockReduction({ ...stockReduction, reason: e.target.value })}
                placeholder="e.g., Damaged, Expired, etc."
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalButton} onClick={() => setShowReduceStockModal(false)}>Cancel</button>
              <button className={styles.modalButtonPrimary} onClick={handleReduceStock}>Reduce Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
