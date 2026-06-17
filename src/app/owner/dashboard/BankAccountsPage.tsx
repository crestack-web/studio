'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function BankAccountsPage() {
  const { showToast, user } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProUser, setIsProUser] = useState<boolean | null>(null);
  
  // Form state
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'mobile_money' | 'pos'>('bank');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    checkPlan();
    loadAccounts();
  }, [businessId, firestore]);

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
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const accountsQuery = query(
        collection(firestore, 'businesses', businessId, 'bankAccounts'),
        orderBy('createdAt', 'desc')
      );
      
      const accountsSnapshot = await getDocs(accountsQuery);
      const accountsList: BankAccount[] = [];
      
      accountsSnapshot.forEach(doc => {
        const data = doc.data();
        accountsList.push({
          id: doc.id,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          bankName: data.bankName,
          accountType: data.accountType,
          openingBalance: data.openingBalance,
          currentBalance: data.currentBalance,
          totalMoneyIn: data.totalMoneyIn || 0,
          totalMoneyOut: data.totalMoneyOut || 0,
          isActive: data.isActive,
          isDefault: data.isDefault,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
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

      // If setting as default, remove default from other accounts
      if (isDefault) {
        for (const account of accounts) {
          if (account.isDefault) {
            await updateDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', account.id), {
              isDefault: false,
              updatedAt: Timestamp.now(),
            });
          }
        }
      }
      
      await addDoc(collection(firestore, 'businesses', businessId, 'bankAccounts'), {
        accountName,
        accountNumber: accountNumber.trim() || undefined,
        bankName,
        accountType,
        openingBalance: balance,
        currentBalance: balance,
        totalMoneyIn: 0,
        totalMoneyOut: 0,
        isActive: true,
        isDefault,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      showToast('✅ Bank account added successfully');
      setShowAddModal(false);
      resetForm();
      
      await loadAccounts();
    } catch (error) {
      console.error('Error adding account:', error);
      showToast('❌ Failed to add bank account');
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

      // Remove default from all accounts
      for (const account of accounts) {
        await updateDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', account.id), {
          isDefault: account.id === accountId,
          updatedAt: Timestamp.now(),
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

      await updateDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', accountId), {
        isActive: !currentStatus,
        updatedAt: Timestamp.now(),
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

      await deleteDoc(doc(firestore, 'businesses', businessId, 'bankAccounts', accountId));
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
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Bank Accounts</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (isProUser === false) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Bank Accounts</h2>
            <p className={styles.pageDesc}>Manage your business bank accounts</p>
          </div>
        </div>
        <div className={styles.notEligible}>
          <div className={styles.notEligibleIcon}>🔒</div>
          <h3 className={styles.notEligibleTitle}>Pro Feature</h3>
          <p className={styles.notEligibleMessage}>
            Bank Accounts management is available on the Pro plan only.
          </p>
          <p className={styles.notEligibleSubMessage}>
            Upgrade to Pro to access advanced banking features including:
          </p>
          <ul className={styles.notEligibleFeatures}>
            <li>Multiple bank account management</li>
            <li>Bank transaction tracking</li>
            <li>Cash flow analysis</li>
            <li>Automated reconciliation</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Bank Accounts</h2>
          <p className={styles.pageDesc}>Manage your business bank accounts</p>
        </div>
        <button
          className={styles.addButton}
          onClick={() => setShowAddModal(true)}
        >
          + Add Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💰</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Total Balance</span>
            <span className={styles.summaryValue}>{formatMoney(totalBalance)}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📥</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Total Money In</span>
            <span className={styles.summaryValue}>{formatMoney(totalMoneyIn)}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📤</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Total Money Out</span>
            <span className={styles.summaryValue}>{formatMoney(totalMoneyOut)}</span>
          </div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏦</div>
          <h3>No Bank Accounts</h3>
          <p>Add your first bank account to start tracking your finances</p>
        </div>
      ) : (
        <div className={styles.accountsList}>
          {accounts.map(account => (
            <div key={account.id} className={`${styles.accountCard} ${!account.isActive ? styles.inactive : ''}`}>
              <div className={styles.accountHeader}>
                <div className={styles.accountIcon}>
                  {getAccountIcon(account.accountType)}
                </div>
                <div className={styles.accountInfo}>
                  <h3 className={styles.accountName}>{account.accountName}</h3>
                  <span className={styles.accountBank}>{account.bankName}</span>
                  {account.accountNumber && (
                    <span className={styles.accountNumber}>****{account.accountNumber.slice(-4)}</span>
                  )}
                </div>
                {account.isDefault && (
                  <div className={styles.defaultBadge}>Default</div>
                )}
              </div>
              
              <div className={styles.accountDetails}>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Current Balance</span>
                  <span className={styles.detailValue}>{formatMoney(account.currentBalance)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Opening Balance</span>
                  <span className={styles.detailValue}>{formatMoney(account.openingBalance)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Money In</span>
                  <span className={`${styles.detailValue} ${styles.moneyIn}`}>+{formatMoney(account.totalMoneyIn)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Money Out</span>
                  <span className={`${styles.detailValue} ${styles.moneyOut}`}>-{formatMoney(account.totalMoneyOut)}</span>
                </div>
              </div>
              
              <div className={styles.accountActions}>
                {!account.isDefault && (
                  <button
                    className={styles.actionButton}
                    onClick={() => handleSetDefault(account.id)}
                    disabled={isProcessing}
                    style={{ opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                  >
                    {isProcessing ? 'Setting...' : 'Set as Default'}
                  </button>
                )}
                <button
                  className={styles.actionButton}
                  onClick={() => handleToggleActive(account.id, account.isActive)}
                  disabled={isProcessing}
                  style={{ opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                >
                  {isProcessing ? 'Updating...' : (account.isActive ? 'Deactivate' : 'Activate')}
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDeleteAccount(account.id)}
                  disabled={isProcessing}
                  style={{ opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                >
                  {isProcessing ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Bank Account</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Account Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., Access Bank - Main Account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Bank Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., Access Bank, UBA, Opay"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Account Type *</label>
                <select
                  className={styles.select}
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="pos">POS</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Account Number (Last 4 digits)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g., 1234"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  maxLength={4}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Opening Balance *</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  min={0}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  Set as default account
                </label>
              </div>
              
              <button
                className={styles.submitButton}
                onClick={handleAddAccount}
                disabled={isProcessing}
              >
                {isProcessing ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
