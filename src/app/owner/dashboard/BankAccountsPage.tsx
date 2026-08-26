'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import {
  fetchDocs,
  addDoc as sbAddDoc,
  updateDoc as sbUpdateDoc,
  deleteDoc as sbDeleteDoc,
} from '@/lib/supabase-client-data';
import { requiresProPlan, getUserPlan } from '@/lib/featureRestrictions';
import styles from './BankAccountsPage.module.css';

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber?: string;
  bankName: string;
  accountType: 'cash' | 'bank' | 'mobile_money' | 'pos';
  openingBalance: number;
  currentBalance: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function BankAccountsPage() {
  const { showToast, user } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProUser, setIsProUser] = useState<boolean | null>(null);
  
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'mobile_money' | 'pos'>('bank');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    checkPlan();
    loadAccounts();
  }, [businessId]);

  const checkPlan = async () => {
    if (!user?.id) return;
    try {
      const plan = await getUserPlan(user.id);
      const isPro = plan === 'pro';
      setIsProUser(isPro);
      if (!isPro) {
        showToast('⚠️ Bank Accounts management requires a Pro plan');
      }
    } catch (error) {
      console.error('Error checking plan:', error);
      setIsProUser(false);
    }
  };

  const loadAccounts = async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const rows = await fetchDocs(`businesses/${businessId}/bankAccounts`, {
        orderBy: { field: 'created_at', ascending: false },
      });
      const accountsList: BankAccount[] = (rows || []).map((data: any) => ({
        id: data.id,
        accountName: data.accountName || data.account_name || data.name || '',
        accountNumber: data.accountNumber || data.account_number,
        bankName: data.bankName || data.bank_name || '',
        accountType: data.accountType || 'bank',
        openingBalance: Number(data.openingBalance) || 0,
        currentBalance: Number(data.currentBalance) || 0,
        totalMoneyIn: Number(data.totalMoneyIn) || 0,
        totalMoneyOut: Number(data.totalMoneyOut) || 0,
        isActive: data.isActive !== false,
        isDefault: Boolean(data.isDefault || data.isPrimary),
        createdAt: data.createdAt || data.created_at || null,
        updatedAt: data.updatedAt || data.updated_at || null,
      }));
      setAccounts(accountsList);
    } catch (error) {
      console.error('Error loading accounts:', error);
      showToast('❌ Failed to load bank accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountName || !bankName || !openingBalance) {
      showToast('⚠️ Please fill all required fields');
      return;
    }
    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      showToast('⚠️ Please enter a valid opening balance');
      return;
    }
    setIsProcessing(true);
    try {
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        setIsProcessing(false);
        return;
      }
      if (isDefault) {
        for (const account of accounts) {
          if (account.isDefault) {
            await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, account.id, {
              isDefault: false,
              isPrimary: false,
            });
          }
        }
      }
      await sbAddDoc(`businesses/${businessId}/bankAccounts`, {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        bankName: bankName.trim(),
        accountType,
        openingBalance: balance,
        currentBalance: balance,
        totalMoneyIn: 0,
        totalMoneyOut: 0,
        isActive: true,
        isDefault: isDefault || accounts.length === 0,
      });
      showToast('✅ Bank account added successfully');
      setShowAddModal(false);
      resetForm();
      await loadAccounts();
    } catch (error: any) {
      console.error('Error adding account:', error);
      const detail = error?.message || error?.details || '';
      showToast(detail ? `❌ Failed to add bank account: ${String(detail).slice(0, 120)}` : '❌ Failed to add bank account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    setIsProcessing(true);
    try {
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        setIsProcessing(false);
        return;
      }
      for (const account of accounts) {
        await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, account.id, {
          isDefault: account.id === accountId,
          isPrimary: account.id === accountId,
        });
      }
      showToast('✅ Default account updated');
      await loadAccounts();
    } catch (error) {
      console.error('Error setting default:', error);
      showToast('❌ Failed to update default account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (accountId: string, currentStatus: boolean) => {
    setIsProcessing(true);
    try {
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        setIsProcessing(false);
        return;
      }
      await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, accountId, {
        isActive: !currentStatus,
      });
      showToast('✅ Account status updated');
      await loadAccounts();
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast('❌ Failed to update account status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }
    setIsProcessing(true);
    try {
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        setIsProcessing(false);
        return;
      }
      await sbDeleteDoc(`businesses/${businessId}/bankAccounts`, accountId);
      showToast('✅ Account deleted successfully');
      await loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('❌ Failed to delete account');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setAccountName('');
    setAccountNumber('');
    setBankName('');
    setAccountType('bank');
    setOpeningBalance('');
    setIsDefault(false);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash': return '💵';
      case 'bank': return '🏦';
      case 'mobile_money': return '📱';
      case 'pos': return '💳';
      default: return '💰';
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.isActive ? a.currentBalance : 0), 0);
  const totalMoneyIn = accounts.reduce((sum, a) => sum + (a.isActive ? a.totalMoneyIn : 0), 0);
  const totalMoneyOut = accounts.reduce((sum, a) => sum + (a.isActive ? a.totalMoneyOut : 0), 0);

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Loading bank accounts...</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bank Accounts</h1>
          <p className={styles.subtitle}>Manage your business cash and bank accounts</p>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setShowAddModal(true)}
          disabled={isProUser === false}
        >
          + Add Account
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Balance</span>
          <span className={styles.statValue}>{formatMoney(totalBalance)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Money In</span>
          <span className={styles.statValuePositive}>{formatMoney(totalMoneyIn)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Money Out</span>
          <span className={styles.statValueNegative}>{formatMoney(totalMoneyOut)}</span>
        </div>
      </div>

      <div className={styles.list}>
        {accounts.length === 0 ? (
          <div className={styles.empty}>No bank accounts yet. Add one to get started.</div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className={styles.card}>
              <div className={styles.cardMain}>
                <span className={styles.cardIcon}>{getAccountIcon(account.accountType)}</span>
                <div>
                  <div className={styles.cardTitle}>
                    {account.accountName}
                    {account.isDefault && <span className={styles.badge}>Default</span>}
                    {!account.isActive && <span className={styles.badgeMuted}>Inactive</span>}
                  </div>
                  <div className={styles.cardMeta}>
                    {account.bankName}
                    {account.accountNumber ? ` · ${account.accountNumber}` : ''}
                  </div>
                </div>
                <div className={styles.cardBalance}>{formatMoney(account.currentBalance)}</div>
              </div>
              <div className={styles.cardActions}>
                {!account.isDefault && (
                  <button type="button" onClick={() => handleSetDefault(account.id)} disabled={isProcessing}>
                    Set default
                  </button>
                )}
                <button type="button" onClick={() => handleToggleActive(account.id, account.isActive)} disabled={isProcessing}>
                  {account.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" onClick={() => handleDeleteAccount(account.id)} disabled={isProcessing}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Add Bank Account</h2>
            <div className={styles.form}>
              <label>
                Account name *
                <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Main operating account" />
              </label>
              <label>
                Bank name *
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="GTBank" />
              </label>
              <label>
                Account number
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Optional" />
              </label>
              <label>
                Account type
                <select value={accountType} onChange={(e) => setAccountType(e.target.value as any)}>
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile money</option>
                  <option value="pos">POS</option>
                </select>
              </label>
              <label>
                Opening balance *
                <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="0" />
              </label>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                Set as default account
              </label>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
              <button type="button" onClick={handleAddAccount} disabled={isProcessing}>
                {isProcessing ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
