'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from './Cashflowpage.module.css';

// ═══════════════════════════════════════════
//  CashflowPage — Bank accounts + stock + cash flow tracking
// ═══════════════════════════════════════════

type ActionId = 'add-stock' | 'reduce-stock' | 'add-money' | 'take-money' | 'add-account' | null;

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  currentBalance: number;
  isActive: boolean;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  credit: boolean;
  accountName?: string;
}

export function CashflowPage() {
  const { showToast } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  const [activeAction, setActiveAction] = useState<ActionId>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    cashBalance: 0,
    stockValue: 0,
    monthIn: 0,
    monthOut: 0,
  });

  // Form states
  const [newAccount, setNewAccount] = useState({ accountName: '', bankName: '', initialBalance: 0 });
  const [moneyTransaction, setMoneyTransaction] = useState({ accountId: '', amount: 0, description: '', category: '' });
  const [stockReduction, setStockReduction] = useState({ productId: '', quantity: 0, reason: '' });
  const [stockAddition, setStockAddition] = useState({ productId: '', quantity: 0, costPrice: 0, description: '' });

  useEffect(() => {
    loadData();
    loadProducts();
  }, [businessId, firestore]);

  const loadProducts = async () => {
    if (!businessId || !firestore) return;
    try {
      const productsQuery = query(
        collection(firestore, 'businesses', businessId, 'products'),
        where('active', '==', true)
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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
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
      
      // Fetch recent bank transactions
      const transactionsQuery = query(
        collection(firestore, 'businesses', businessId, 'bankTransactions'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(transactionsQuery);
      const fetchedTransactions: Transaction[] = [];
      let cashBalance = 0;
      let monthIn = 0;
      let monthOut = 0;
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        const isCredit = data.type === 'money_in';
        const date = data.createdAt?.toDate() || new Date();
        
        fetchedTransactions.push({
          id: doc.id,
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          type: data.category || 'Other',
          description: data.description || '',
          amount: amount,
          credit: isCredit,
          accountName: data.accountName,
        });
        
        if (isCredit) {
          cashBalance += amount;
          if (date >= monthStart) monthIn += amount;
        } else {
          cashBalance -= amount;
          if (date >= monthStart) monthOut += amount;
        }
      });
      
      setTransactions(fetchedTransactions);
      setStats({
        cashBalance: accountsList.reduce((sum, a) => sum + a.currentBalance, 0),
        stockValue: 0,
        monthIn,
        monthOut,
      });
    } catch (error) {
      console.error('Error fetching cashflow data:', error);
      showToast('Failed to load cashflow data');
    } finally {
      setLoading(false);
    }
  };

  function toggle(id: ActionId) {
    setActiveAction(prev => prev === id ? null : id);
  }

  function confirm(msg: string) {
    showToast(`✅ ${msg}`);
    setActiveAction(null);
  }

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
      setActiveAction(null);
      setNewAccount({ accountName: '', bankName: '', initialBalance: 0 });
      loadData();
    } catch (error) {
      console.error('Error adding account:', error);
      showToast('❌ Failed to add account');
    }
  };

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
        type: 'money_in',
        category: moneyTransaction.category || 'Deposit',
        amount: moneyTransaction.amount,
        balanceAfter: newBalance,
        description: moneyTransaction.description,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      showToast('✅ Money added successfully');
      setActiveAction(null);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      loadData();
    } catch (error) {
      console.error('Error adding money:', error);
      showToast('❌ Failed to add money');
    }
  };

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
        type: 'money_out',
        category: moneyTransaction.category || 'Withdrawal',
        amount: moneyTransaction.amount,
        balanceAfter: newBalance,
        description: moneyTransaction.description,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      showToast('✅ Money taken successfully');
      setActiveAction(null);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      loadData();
    } catch (error) {
      console.error('Error taking money:', error);
      showToast('❌ Failed to take money');
    }
  };

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
          type: 'money_out',
          category: 'Stock Reduction',
          amount: product.costPrice * stockReduction.quantity,
          balanceAfter: defaultAccount.currentBalance,
          description: `Stock reduction: ${product.name} - ${stockReduction.quantity} units. Reason: ${stockReduction.reason}`,
          createdAt: Timestamp.now(),
        };
        await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      }

      showToast('✅ Stock reduced successfully');
      setActiveAction(null);
      setStockReduction({ productId: '', quantity: 0, reason: '' });
      loadProducts();
      loadData();
    } catch (error) {
      console.error('Error reducing stock:', error);
      showToast('❌ Failed to reduce stock');
    }
  };

  const handleAddStock = async () => {
    if (!businessId || !firestore) return;
    try {
      const product = products.find(p => p.id === stockAddition.productId);
      if (!product) {
        showToast('❌ Please select a product');
        return;
      }

      const newStock = product.stock + stockAddition.quantity;
      await updateDoc(doc(firestore, 'businesses', businessId, 'products', stockAddition.productId), {
        stock: newStock,
      });

      // Record as expense transaction
      if (bankAccounts.length > 0) {
        const defaultAccount = bankAccounts.find(a => a.isDefault) || bankAccounts[0];
        const transactionData = {
          transactionNumber: `STK-${Date.now()}`,
          bankAccountId: defaultAccount.id,
          accountName: defaultAccount.accountName,
          type: 'money_out',
          category: 'Stock Addition',
          amount: stockAddition.costPrice * stockAddition.quantity,
          balanceAfter: defaultAccount.currentBalance,
          description: `Stock addition: ${product.name} - ${stockAddition.quantity} units. ${stockAddition.description}`,
          createdAt: Timestamp.now(),
        };
        await addDoc(collection(firestore, 'businesses', businessId, 'bankTransactions'), transactionData);
      }

      showToast('✅ Stock added successfully');
      setActiveAction(null);
      setStockAddition({ productId: '', quantity: 0, costPrice: 0, description: '' });
      loadProducts();
      loadData();
    } catch (error) {
      console.error('Error adding stock:', error);
      showToast('❌ Failed to add stock');
    }
  };

  function handleSubmit(e: React.FormEvent, action: string) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    
    if (!amount || !description) {
      showToast('❌ Please fill all fields');
      return;
    }
    
    confirm(`${action}: ${description} - ${formatMoney(parseFloat(amount))}`);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{t('cashflow.title')}</h1>
      <p className={styles.sub}>{t('cashflow.subtitle')}</p>

      {/* ── QUICK STATS ── */}
      <div className={styles.statsGrid}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            {t('common.loading')}...
          </div>
        ) : (
          [
            { label: t('cashflow.cashBalance'),    value: formatMoney(stats.cashBalance),  color: 'var(--green,#1A7A50)' },
            { label: t('cashflow.stockValue'),     value: formatMoney(stats.stockValue), color: 'var(--text-1)' },
            { label: t('cashflow.monthIn'),   value: '+' + formatMoney(stats.monthIn), color: 'var(--green,#1A7A50)' },
            { label: t('cashflow.monthOut'),  value: '-' + formatMoney(stats.monthOut), color: 'var(--red,#C0392B)' },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
            </div>
          ))
        )}
      </div>

      {/* ── BANK ACCOUNTS ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Bank Accounts</h2>
          <button className={styles.modalButtonPrimary} onClick={() => setActiveAction('add-account')}>
            + Add Account
          </button>
        </div>
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

      {/* ── ACTION CARDS ── */}
      <div className={styles.actionButtons}>
        <button className={styles.actionButton} onClick={() => setActiveAction('add-stock')}>
          <span className={styles.actionIcon}>📦</span>
          <span>Add Stock</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('reduce-stock')}>
          <span className={styles.actionIcon}>📉</span>
          <span>Reduce Stock</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('add-money')}>
          <span className={styles.actionIcon}>💰</span>
          <span>Add Money</span>
        </button>
        <button className={styles.actionButton} onClick={() => setActiveAction('take-money')}>
          <span className={styles.actionIcon}>💸</span>
          <span>Take Money</span>
        </button>
      </div>

      {/* ── ACTION FORMS (shown when active) ── */}
      {activeAction && (
        <div className={styles.actionFormOverlay} onClick={() => setActiveAction(null)}>
          <div className={styles.actionForm} onClick={e => e.stopPropagation()}>
            <button className={styles.closeFormBtn} onClick={() => setActiveAction(null)}>✕</button>
            
            {activeAction === 'add-account' && (
              <div>
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
                  <button className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button className={styles.modalButtonPrimary} onClick={handleAddAccount}>Add Account</button>
                </div>
              </div>
            )}

            {activeAction === 'add-stock' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddStock(); }}>
                <h3 className={styles.modalTitle}>Add Stock</h3>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Product</label>
                  <select
                    className={styles.formInput}
                    value={stockAddition.productId}
                    onChange={(e) => setStockAddition({ ...stockAddition, productId: e.target.value })}
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name} (Stock: {product.stock})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity to Add</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={stockAddition.quantity}
                    onChange={(e) => setStockAddition({ ...stockAddition, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 50"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cost Price per Unit</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={stockAddition.costPrice}
                    onChange={(e) => setStockAddition({ ...stockAddition, costPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="₦0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formInput}
                    value={stockAddition.description}
                    onChange={(e) => setStockAddition({ ...stockAddition, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Add Stock</button>
                </div>
              </form>
            )}

            {activeAction === 'reduce-stock' && (
              <form onSubmit={(e) => { e.preventDefault(); handleReduceStock(); }}>
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
                    onChange={(e) => setStockReduction({ ...stockReduction, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 10"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason</label>
                  <select
                    className={styles.formInput}
                    value={stockReduction.reason}
                    onChange={(e) => setStockReduction({ ...stockReduction, reason: e.target.value })}
                  >
                    <option value="">Select reason</option>
                    <option value="damaged">Damaged</option>
                    <option value="expired">Expired</option>
                    <option value="theft">Theft</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formInput}
                    value={stockReduction.reason}
                    onChange={(e) => setStockReduction({ ...stockReduction, reason: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Reduce Stock</button>
                </div>
              </form>
            )}

            {activeAction === 'add-money' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddMoney(); }}>
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
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Add Money</button>
                </div>
              </form>
            )}

            {activeAction === 'take-money' && (
              <form onSubmit={(e) => { e.preventDefault(); handleTakeMoney(); }}>
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
                  <button type="button" className={styles.modalButton} onClick={() => setActiveAction(null)}>Cancel</button>
                  <button type="submit" className={styles.modalButtonPrimary}>Take Money</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS LIST ── */}
      <div className={styles.transactionsSection}>
        <h2 className={styles.sectionTitle}>{t('cashflow.recentTransactions')}</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            {t('common.loading')}...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('cashflow.noTransactions')}</div>
            <div style={{ fontSize: '0.8rem' }}>{t('cashflow.addTransactionsFirst')}</div>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map(t => (
              <div key={t.id} className={styles.transactionCard}>
                <div className={styles.transactionHeader}>
                  <span className={styles.transactionNumber}>{t.date}</span>
                  <span className={`${styles.transactionType} ${t.credit ? styles.moneyIn : styles.moneyOut}`}>
                    {t.credit ? '↑' : '↓'} {t.type}
                  </span>
                </div>
                <div className={styles.transactionDetails}>
                  <div className={styles.transactionDetail}>
                    <span className={styles.transactionLabel}>Account:</span>
                    <span className={styles.transactionValue}>{t.accountName || 'N/A'}</span>
                  </div>
                  <div className={styles.transactionDetail}>
                    <span className={styles.transactionLabel}>Description:</span>
                    <span className={styles.transactionValue}>{t.description}</span>
                  </div>
                </div>
                <div className={`${styles.transactionAmount} ${t.credit ? styles.moneyIn : styles.moneyOut}`}>
                  {t.credit ? '+' : '-'}{formatMoney(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
