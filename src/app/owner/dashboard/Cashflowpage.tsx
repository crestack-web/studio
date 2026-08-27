'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs, addDoc as sbAddDoc, updateDoc as sbUpdateDoc } from '@/lib/supabase-client-data';
import styles from './Cashflowpage.module.css';
import CashflowModals from './CashflowModals';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber?: string;
  accountType?: string;
  currentBalance: number;
  isActive: boolean;
  isDefault: boolean;
  isPosDefault?: boolean;
}

interface CashTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  category?: string;
  accountId?: string;
  accountName?: string;
  createdAt: Date;
  direction: 'in' | 'out';
}

export default function Cashflowpage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId: branchBusinessId } = useBranch();
  const businessId = branchBusinessId || user?.businessId;

  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  const [newAccount, setNewAccount] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    accountType: 'bank',
    initialBalance: 0,
    isPosDefault: false,
  });

  const [moneyTransaction, setMoneyTransaction] = useState({
    accountId: '',
    amount: 0,
    description: '',
    category: '',
  });

  // Stubs for modal props not used in compact data path
  const products: any[] = [];
  const suppliers: any[] = [];
  const [stockAddition, setStockAddition] = useState<any>({ productId: '', quantity: 0, costPrice: 0, paymentMethod: 'credit', bankAccountId: '', supplierId: '', paymentAmount: 0, notes: '', referenceNumber: '', purchaseDate: '' });
  const [stockReduction, setStockReduction] = useState<any>({ productId: '', quantity: 0, reason: '' });
  const [supplierPayment, setSupplierPayment] = useState<any>({ supplierId: '', amount: 0, paymentMethod: 'cash', bankAccountId: '', description: '' });
  const [newProduct, setNewProduct] = useState({ name: '', costPrice: 0, sellingPrice: 0, category: '', unit: 'piece' });
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const isAddingPurchase = false;
  const t = (k: string) => k;

  const loadData = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const accountsRaw: any[] = await fetchDocs(`businesses/${businessId}/bankAccounts`);
      const accountsList: BankAccount[] = accountsRaw
        .filter((a) => a.isActive !== false)
        .map((a) => ({
          id: a.id,
          accountName: a.accountName || a.name || 'Account',
          bankName: a.bankName || '',
          accountNumber: a.accountNumber,
          accountType: a.accountType || 'bank',
          currentBalance: Number(a.currentBalance) || 0,
          isActive: a.isActive !== false,
          isDefault: Boolean(a.isDefault || a.isPrimary),
          isPosDefault: Boolean(a.isPosDefault),
        }));
      setBankAccounts(accountsList);

      const txDocs: any[] = await fetchDocs(`businesses/${businessId}/bankTransactions`, {
        orderBy: { field: 'created_at', ascending: false },
        limit: 100,
      });
      const nameById: Record<string, string> = {};
      accountsList.forEach((a) => { nameById[a.id] = a.accountName; });
      const txList: CashTransaction[] = txDocs.map((t) => {
        const type = String(t.type || '').toLowerCase();
        const direction: 'in' | 'out' =
          type.includes('out') || type === 'debit' || type === 'withdrawal' ? 'out' : 'in';
        return {
          id: t.id,
          type: t.type || (direction === 'in' ? 'money_in' : 'money_out'),
          amount: Number(t.amount) || 0,
          description: t.description || t.note || '',
          category: t.category || '',
          accountId: t.accountId || t.bankAccountId,
          accountName: nameById[t.accountId || t.bankAccountId] || t.accountName || '',
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          direction,
        };
      });
      setTransactions(txList);
    } catch (e) {
      console.error('Cashflow load error:', e);
      showToast('Failed to load cashflow data');
    } finally {
      setLoading(false);
    }
  }, [businessId, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalBalance = bankAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);

  const handleAddAccount = async () => {
    if (!businessId) { showToast('Business not found'); return; }
    if (!newAccount.accountName.trim() || !newAccount.bankName.trim()) {
      showToast('Account name and bank name are required');
      return;
    }
    try {
      setIsAddingAccount(true);
      await sbAddDoc(`businesses/${businessId}/bankAccounts`, {
        accountName: newAccount.accountName.trim(),
        bankName: newAccount.bankName.trim(),
        accountNumber: newAccount.accountNumber?.trim() || null,
        accountType: newAccount.accountType || 'bank',
        currentBalance: Number(newAccount.initialBalance) || 0,
        openingBalance: Number(newAccount.initialBalance) || 0,
        isActive: true,
        isDefault: bankAccounts.length === 0,
        isPosDefault: newAccount.isPosDefault || bankAccounts.length === 0,
      });
      showToast('Account added');
      setActiveAction(null);
      setNewAccount({ accountName: '', bankName: '', accountNumber: '', accountType: 'bank', initialBalance: 0, isPosDefault: false });
      await loadData();
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : 'Failed to add account');
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleAddMoney = async () => {
    await handleMoneyMove('in');
  };
  const handleTakeMoney = async () => {
    await handleMoneyMove('out');
  };

  const handleMoneyMove = async (direction: 'in' | 'out') => {
    if (!businessId) { showToast('Business not found'); return; }
    if (!moneyTransaction.accountId || !moneyTransaction.amount || moneyTransaction.amount <= 0) {
      showToast('Select an account and enter a valid amount');
      return;
    }
    const account = bankAccounts.find((a) => a.id === moneyTransaction.accountId);
    if (!account) { showToast('Account not found'); return; }
    if (direction === 'out' && moneyTransaction.amount > account.currentBalance) {
      showToast('Insufficient balance');
      return;
    }
    try {
      setIsSaving(true);
      const delta = direction === 'in' ? moneyTransaction.amount : -moneyTransaction.amount;
      const newBalance = (account.currentBalance || 0) + delta;
      await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, account.id, {
        currentBalance: newBalance,
      });
      await sbAddDoc(`businesses/${businessId}/bankTransactions`, {
        accountId: account.id,
        bankAccountId: account.id,
        type: direction === 'in' ? 'money_in' : 'money_out',
        amount: moneyTransaction.amount,
        balanceAfter: newBalance,
        description: moneyTransaction.description || moneyTransaction.category || (direction === 'in' ? 'Money in' : 'Money out'),
        category: moneyTransaction.category || (direction === 'in' ? 'Deposit' : 'Withdrawal'),
        reference: null,
      });
      showToast(direction === 'in' ? 'Money in recorded' : 'Money out recorded');
      setActiveAction(null);
      setMoneyTransaction({ accountId: '', amount: 0, description: '', category: '' });
      await loadData();
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : 'Failed to record transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPurchase = async () => { showToast('Purchase flow — use Inventory for stock receipts'); setActiveAction(null); };
  const handleReduceStock = async () => { showToast('Stock reduction — use Inventory'); setActiveAction(null); };
  const handlePaySupplier = async () => { showToast('Supplier payment — use Suppliers page'); setActiveAction(null); };
  const handleCreateProduct = async () => { showToast('Create products from Inventory'); setShowNewProductForm(false); };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title || styles.heading}>Cashflow</h1>
        </div>
        <p style={{ padding: 24, color: 'var(--text-3)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow || styles.header}>
        <div>
          <h1 className={styles.heading || styles.title}>Cashflow</h1>
          <p className={styles.sub || styles.subtitle}>Track money in, money out, and bank balances</p>
        </div>
      </div>

      <div className={styles.statsRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        <div className={styles.statCard} style={{ padding: 16, borderRadius: 12, background: 'var(--bg-2, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
          <div className={styles.statLabel} style={{ fontSize: 12, color: 'var(--text-3)' }}>Total balance</div>
          <div className={styles.statValue} style={{ fontSize: 22, fontWeight: 700 }}>{formatMoney(totalBalance)}</div>
        </div>
        <div className={styles.statCard} style={{ padding: 16, borderRadius: 12, background: 'var(--bg-2, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
          <div className={styles.statLabel} style={{ fontSize: 12, color: 'var(--text-3)' }}>Accounts</div>
          <div className={styles.statValue} style={{ fontSize: 22, fontWeight: 700 }}>{bankAccounts.length}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 className={styles.sectionTitle}>Bank Accounts</h2>
          <button className={styles.modalButtonPrimary || styles.primaryButton} onClick={() => setActiveAction('add-account')}>Add account</button>
        </div>
        {bankAccounts.length === 0 ? (
          <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>No accounts yet. Add one to start tracking cashflow.</p>
        ) : (
          <div className={styles.accountsList} style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
            {bankAccounts.map((a) => (
              <div key={a.id} className={styles.accountCard} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border, #e2e8f0)' }}>
                <div>
                  <strong className={styles.accountName}>{a.accountName}</strong>
                  <div className={styles.accountBank} style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {a.bankName}{a.isDefault ? ' · Default' : ''}
                  </div>
                </div>
                <strong className={styles.accountBalance}>{formatMoney(a.currentBalance)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actionButtons} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button className={styles.actionButton || styles.primaryButton} onClick={() => { setMoneyTransaction({ accountId: bankAccounts[0]?.id || '', amount: 0, description: '', category: '' }); setActiveAction('add-money'); }}>Money in</button>
        <button className={styles.actionButton || styles.primaryButton} onClick={() => { setMoneyTransaction({ accountId: bankAccounts[0]?.id || '', amount: 0, description: '', category: 'Bank Charges / Fees' }); setActiveAction('take-money'); }}>Money out</button>
        <button className={styles.actionButton || styles.primaryButton} onClick={() => setActiveAction('add-purchase')}>Add purchase</button>
        <button className={styles.actionButton || styles.primaryButton} onClick={() => setActiveAction('pay-supplier')}>Pay supplier</button>
      </div>

      <h2 className={styles.sectionTitle} style={{ fontSize: 16, marginBottom: 12 }}>Recent transactions</h2>
      {transactions.length === 0 ? (
        <p style={{ color: 'var(--text-3)' }}>No transactions yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {transactions.slice(0, 50).map((tx) => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border, #e2e8f0)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{tx.category || tx.type}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {tx.accountName || 'Account'} · {tx.createdAt.toLocaleDateString()}
                  {tx.description ? ` · ${tx.description}` : ''}
                </div>
              </div>
              <span style={{ fontWeight: 700, color: tx.direction === 'in' ? '#16a34a' : '#dc2626' }}>
                {tx.direction === 'in' ? '+' : '−'}{formatMoney(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <CashflowModals
        activeAction={activeAction}
        setActiveAction={setActiveAction}
        newAccount={newAccount}
        setNewAccount={setNewAccount}
        handleAddAccount={handleAddAccount}
        isAddingAccount={isAddingAccount}
        moneyTransaction={moneyTransaction}
        setMoneyTransaction={setMoneyTransaction}
        handleAddMoney={handleAddMoney}
        handleTakeMoney={handleTakeMoney}
        bankAccounts={bankAccounts}
        products={products}
        suppliers={suppliers}
        stockAddition={stockAddition}
        setStockAddition={setStockAddition}
        handleAddPurchase={handleAddPurchase}
        isAddingPurchase={isAddingPurchase}
        handleReduceStock={handleReduceStock}
        stockReduction={stockReduction}
        setStockReduction={setStockReduction}
        supplierPayment={supplierPayment}
        setSupplierPayment={setSupplierPayment}
        handlePaySupplier={handlePaySupplier}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        handleCreateProduct={handleCreateProduct}
        showNewProductForm={showNewProductForm}
        setShowNewProductForm={setShowNewProductForm}
        formatMoney={formatMoney}
        t={t}
        styles={styles}
      />
    </div>
  );
}
