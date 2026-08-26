'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs, addDoc as sbAddDoc, updateDoc as sbUpdateDoc } from '@/lib/supabase-client-data';
import styles from './Cashflowpage.module.css';

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

const MONEY_IN_CATEGORIES = [
  'Sales Deposit',
  'Owner Investment',
  'Loan Received',
  'Refund',
  'Transfer In',
  'Other Income',
];

const MONEY_OUT_CATEGORIES = [
  'Withdrawal',
  'Supplier Payment',
  'Expense',
  'Bank Charges / Fees',
  'Tax / Government Fees',
  'Salary',
  'Transfer Out',
  'Purchase',
  'Other',
];

export default function Cashflowpage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId: branchBusinessId } = useBranch();
  const businessId = branchBusinessId || user?.businessId;

  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showMoneyIn, setShowMoneyIn] = useState(false);
  const [showMoneyOut, setShowMoneyOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newAccount, setNewAccount] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    accountType: 'bank',
    openingBalance: 0,
  });

  const [moneyForm, setMoneyForm] = useState({
    accountId: '',
    amount: 0,
    description: '',
    category: '',
  });

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
      accountsList.forEach((a) => {
        nameById[a.id] = a.accountName;
      });
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalBalance = bankAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);

  const handleAddAccount = async () => {
    if (!businessId) {
      showToast('Business not found');
      return;
    }
    if (!newAccount.accountName.trim() || !newAccount.bankName.trim()) {
      showToast('Account name and bank name are required');
      return;
    }
    try {
      setIsSaving(true);
      await sbAddDoc(`businesses/${businessId}/bankAccounts`, {
        accountName: newAccount.accountName.trim(),
        bankName: newAccount.bankName.trim(),
        accountNumber: newAccount.accountNumber.trim() || null,
        accountType: newAccount.accountType || 'bank',
        currentBalance: Number(newAccount.openingBalance) || 0,
        openingBalance: Number(newAccount.openingBalance) || 0,
        isActive: true,
        isDefault: bankAccounts.length === 0,
        isPosDefault: bankAccounts.length === 0,
      });
      showToast('Account added');
      setShowAddAccount(false);
      setNewAccount({ accountName: '', bankName: '', accountNumber: '', accountType: 'bank', openingBalance: 0 });
      await loadData();
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : 'Failed to add account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoneyMove = async (direction: 'in' | 'out') => {
    if (!businessId) {
      showToast('Business not found');
      return;
    }
    if (!moneyForm.accountId || !moneyForm.amount || moneyForm.amount <= 0) {
      showToast('Select an account and enter a valid amount');
      return;
    }
    const account = bankAccounts.find((a) => a.id === moneyForm.accountId);
    if (!account) {
      showToast('Account not found');
      return;
    }
    if (direction === 'out' && moneyForm.amount > account.currentBalance) {
      showToast('Insufficient balance');
      return;
    }
    try {
      setIsSaving(true);
      const delta = direction === 'in' ? moneyForm.amount : -moneyForm.amount;
      const newBalance = (account.currentBalance || 0) + delta;
      await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, account.id, {
        currentBalance: newBalance,
        totalMoneyIn: direction === 'in' ? moneyForm.amount : 0,
        totalMoneyOut: direction === 'out' ? moneyForm.amount : 0,
      });
      await sbAddDoc(`businesses/${businessId}/bankTransactions`, {
        accountId: account.id,
        bankAccountId: account.id,
        type: direction === 'in' ? 'money_in' : 'money_out',
        amount: moneyForm.amount,
        balanceAfter: newBalance,
        description: moneyForm.description || moneyForm.category || (direction === 'in' ? 'Money in' : 'Money out'),
        category: moneyForm.category || (direction === 'in' ? 'Deposit' : 'Withdrawal'),
        reference: null,
      });
      showToast(direction === 'in' ? 'Money in recorded' : 'Money out recorded');
      setShowMoneyIn(false);
      setShowMoneyOut(false);
      setMoneyForm({ accountId: '', amount: 0, description: '', category: '' });
      await loadData();
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : 'Failed to record transaction');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Cashflow</h1>
        </div>
        <p style={{ padding: 24, color: 'var(--text-3)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cashflow</h1>
          <p className={styles.subtitle}>Track money in, money out, and bank balances</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className={styles.primaryButton} onClick={() => setShowAddAccount(true)}>
            Add account
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setMoneyForm({ accountId: bankAccounts[0]?.id || '', amount: 0, description: '', category: '' });
              setShowMoneyIn(true);
            }}
          >
            Money in
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setMoneyForm({
                accountId: bankAccounts[0]?.id || '',
                amount: 0,
                description: '',
                category: 'Bank Charges / Fees',
              });
              setShowMoneyOut(true);
            }}
          >
            Money out
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'var(--bg-2, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Total balance</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{formatMoney(totalBalance)}</div>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'var(--bg-2, #f8fafc)',
            border: '1px solid var(--border, #e2e8f0)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Accounts</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{bankAccounts.length}</div>
        </div>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Bank accounts</h2>
      {bankAccounts.length === 0 ? (
        <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>
          No accounts yet. Add one to start tracking cashflow.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
          {bankAccounts.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border, #e2e8f0)',
              }}
            >
              <div>
                <strong>{a.accountName}</strong>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  {a.bankName}
                  {a.isDefault ? ' · Default' : ''}
                </div>
              </div>
              <strong>{formatMoney(a.currentBalance)}</strong>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recent transactions</h2>
      {transactions.length === 0 ? (
        <p style={{ color: 'var(--text-3)' }}>No transactions yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {transactions.slice(0, 50).map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border, #e2e8f0)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{t.category || t.type}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {t.accountName || 'Account'} · {t.createdAt.toLocaleDateString()}
                  {t.description ? ` · ${t.description}` : ''}
                </div>
              </div>
              <span style={{ fontWeight: 700, color: t.direction === 'in' ? '#16a34a' : '#dc2626' }}>
                {t.direction === 'in' ? '+' : '−'}
                {formatMoney(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {showAddAccount && (
        <div
          onClick={() => setShowAddAccount(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg, #fff)',
              padding: 24,
              borderRadius: 12,
              width: 'min(420px, 92vw)',
            }}
          >
            <h3>Add bank account</h3>
            <label style={{ display: 'block', marginTop: 12 }}>
              Account name
              <input
                value={newAccount.accountName}
                onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <label style={{ display: 'block', marginTop: 12 }}>
              Bank name
              <input
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <label style={{ display: 'block', marginTop: 12 }}>
              Account number
              <input
                value={newAccount.accountNumber}
                onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <label style={{ display: 'block', marginTop: 12 }}>
              Opening balance
              <input
                type="number"
                value={newAccount.openingBalance || ''}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, openingBalance: parseFloat(e.target.value) || 0 })
                }
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddAccount(false)}>
                Cancel
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleAddAccount} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(showMoneyIn || showMoneyOut) && (
        <div
          onClick={() => {
            setShowMoneyIn(false);
            setShowMoneyOut(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg, #fff)',
              padding: 24,
              borderRadius: 12,
              width: 'min(420px, 92vw)',
            }}
          >
            <h3>{showMoneyIn ? 'Money in' : 'Money out'}</h3>
            <label style={{ display: 'block', marginTop: 12 }}>
              Account
              <select
                value={moneyForm.accountId}
                onChange={(e) => setMoneyForm({ ...moneyForm, accountId: e.target.value })}
                style={{ width: '100%', marginTop: 4 }}
              >
                <option value="">Select account</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} ({formatMoney(a.currentBalance)})
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block', marginTop: 12 }}>
              Amount
              <input
                type="number"
                value={moneyForm.amount || ''}
                onChange={(e) => setMoneyForm({ ...moneyForm, amount: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <label style={{ display: 'block', marginTop: 12 }}>
              Category
              <select
                value={moneyForm.category}
                onChange={(e) => setMoneyForm({ ...moneyForm, category: e.target.value })}
                style={{ width: '100%', marginTop: 4 }}
              >
                <option value="">Select category</option>
                {(showMoneyIn ? MONEY_IN_CATEGORIES : MONEY_OUT_CATEGORIES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block', marginTop: 12 }}>
              Description
              <input
                value={moneyForm.description}
                onChange={(e) => setMoneyForm({ ...moneyForm, description: e.target.value })}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowMoneyIn(false);
                  setShowMoneyOut(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => handleMoneyMove(showMoneyIn ? 'in' : 'out')}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
