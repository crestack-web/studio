'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs, fetchDoc, runBatch } from '@/lib/supabase-client-data';
import { isCreditLayerEligible, getBusinessType } from '@/lib/featureRestrictions';
import styles from './CustomerCreditPage.module.css';

interface CustomerCreditLedger {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  saleId: string;
  saleNumber: string;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  dueDate?: any;
  items: any[];
  payments: any[];
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  createdAt: any;
}

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountType: string;
  currentBalance: number;
  isActive: boolean;
  isDefault: boolean;
}

export function CustomerCreditPage() {
  const { showToast, user } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();

  const [creditLedger, setCreditLedger] = useState<CustomerCreditLedger[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<CustomerCreditLedger | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');

  useEffect(() => {
    checkEligibility();
    loadData();
  }, [businessId]);

  const checkEligibility = async () => {
    if (!user?.id) return;
    try {
      const type = await getBusinessType(user.id);
      const eligible = isCreditLayerEligible(type);
      setIsEligible(eligible);
      if (!eligible) {
        showToast('⚠️ Customer Credit is available for wholesale and retail businesses only');
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setIsEligible(false);
    }
  };

  const loadData = async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const creditCustomers = await fetchDocs<any>(`businesses/${businessId}/credit_customers`, {
        filters: [{ field: 'status', op: '=', value: 'active' }],
        orderBy: { field: 'updated_at', ascending: false },
      });
      const ledgerList: CustomerCreditLedger[] = creditCustomers
        .filter((data: any) => Number(data.currentBalance ?? data.balance ?? 0) > 0)
        .map((data: any) => {
          const balance = Number(data.currentBalance ?? data.balance ?? 0) || 0;
          const totalCredit = Number(data.totalCredit ?? data.total_credit ?? balance) || balance;
          const totalPaid = Number(data.totalPaid ?? data.total_paid ?? 0) || 0;
          return {
            id: data.id,
            customerId: data.id,
            customerName: data.name || data.customerName || 'Customer',
            customerPhone: data.phone,
            saleId: '',
            saleNumber: '',
            totalAmount: totalCredit,
            amountPaid: totalPaid,
            outstandingBalance: balance,
            dueDate: data.updatedAt || data.createdAt,
            items: [],
            payments: [],
            status: totalPaid > 0 ? 'partial' : 'pending',
            createdAt: data.createdAt,
          };
        });
      setCreditLedger(ledgerList);

      const accountsData = await fetchDocs<any>(`businesses/${businessId}/bankAccounts`);
      const accountsList: BankAccount[] = accountsData.map((data: any) => ({
        id: data.id,
        accountName: data.accountName,
        bankName: data.bankName,
        accountType: data.accountType,
        currentBalance: data.currentBalance,
        isActive: data.isActive !== false,
        isDefault: data.isDefault,
      }));
      setBankAccounts(accountsList);
      const defaultAccount = accountsList.find((a) => a.isDefault);
      if (defaultAccount) setBankAccountId(defaultAccount.id);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('❌ Failed to load customer credit data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectionClick = (ledger: CustomerCreditLedger) => {
    setSelectedLedger(ledger);
    setCollectionAmount(ledger.outstandingBalance.toString());
    setShowCollectionModal(true);
  };

  const handleCollectionSubmit = async () => {
    if (!selectedLedger || !collectionAmount) {
      showToast('⚠️ Please enter collection amount');
      return;
    }
    const amount = parseFloat(collectionAmount);
    if (amount <= 0) {
      showToast('⚠️ Please enter a valid amount');
      return;
    }
    if (amount > selectedLedger.outstandingBalance) {
      showToast('⚠️ Collection cannot exceed outstanding balance');
      return;
    }
    setIsProcessing(true);
    try {
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        setIsProcessing(false);
        return;
      }
      const ledgerData = await fetchDoc<any>(`businesses/${businessId}/credit_customers`, selectedLedger.id);
      if (!ledgerData) throw new Error('Credit customer not found');

      const currentBalance = Number(ledgerData.currentBalance ?? ledgerData.balance ?? selectedLedger.outstandingBalance) || 0;
      const currentPaid = Number(ledgerData.totalPaid ?? ledgerData.total_paid ?? selectedLedger.amountPaid) || 0;
      const totalCredit = Number(ledgerData.totalCredit ?? ledgerData.total_credit ?? selectedLedger.totalAmount) || currentBalance + currentPaid;
      const newPaid = currentPaid + amount;
      const newBalance = Math.max(0, currentBalance - amount);

      const batchOps: Array<{ type: 'update' | 'add'; path: string; id?: string; data?: Record<string, unknown> }> = [
        {
          type: 'update',
          path: `businesses/${businessId}/credit_customers`,
          id: selectedLedger.id,
          data: {
            balance: newBalance,
            currentBalance: newBalance,
            total_paid: newPaid,
            totalPaid: newPaid,
            total_credit: totalCredit,
            totalCredit: totalCredit,
            status: newBalance === 0 ? 'paid' : 'active',
          },
        },
        {
          type: 'add',
          path: `businesses/${businessId}/credit_transactions`,
          data: {
            customerId: selectedLedger.id,
            type: 'payment',
            amount,
            paymentMethod,
            note: collectionNotes.trim() || `Collection from ${selectedLedger.customerName}`,
            createdBy: user?.id,
          },
        },
      ];

      if (paymentMethod === 'transfer' && bankAccountId) {
        const bankData = await fetchDoc<any>(`businesses/${businessId}/bankAccounts`, bankAccountId);
        if (bankData) {
          const currentBankBalance = Number(bankData.currentBalance) || 0;
          const newBankBalance = currentBankBalance + amount;
          batchOps.push({
            type: 'update',
            path: `businesses/${businessId}/bankAccounts`,
            id: bankAccountId,
            data: {
              currentBalance: newBankBalance,
              totalMoneyIn: (Number(bankData.totalMoneyIn) || 0) + amount,
            },
          });
          batchOps.push({
            type: 'add',
            path: `businesses/${businessId}/bankTransactions`,
            data: {
              bankAccountId,
              accountId: bankAccountId,
              type: 'money_in',
              amount,
              balanceAfter: newBankBalance,
              description: `Collection from ${selectedLedger.customerName}`,
              reference: selectedLedger.id,
            },
          });
        }
      }

      await runBatch(batchOps);
      showToast('✅ Collection recorded successfully');
      setShowCollectionModal(false);
      setCollectionAmount('');
      setCollectionNotes('');
      setSelectedLedger(null);
      await loadData();
    } catch (error) {
      console.error('Error processing collection:', error);
      showToast('❌ Failed to process collection');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className={styles.page}><div className={styles.loading}>Loading...</div></div>;
  }

  if (isEligible === false) {
    return (
      <div className={styles.page}>
        <h1>Customer Credit</h1>
        <p>Customer Credit is available for wholesale and retail businesses only.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Customer Credit</h1>
          <p className={styles.pageDesc}>Track customer debts and collections</p>
        </div>
      </div>

      {creditLedger.length === 0 ? (
        <div className={styles.empty}>
          <p>No outstanding customer credit</p>
          <p className={styles.hint}>Add credit customers from Credit Tracking, or record credit sales.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {creditLedger.map((ledger) => (
                <tr key={ledger.id}>
                  <td><strong>{ledger.customerName}</strong></td>
                  <td>{ledger.customerPhone || '—'}</td>
                  <td>{formatMoney(ledger.totalAmount)}</td>
                  <td>{formatMoney(ledger.amountPaid)}</td>
                  <td>{formatMoney(ledger.outstandingBalance)}</td>
                  <td>{ledger.status}</td>
                  <td>
                    <button type="button" className={styles.primaryBtn} onClick={() => handleCollectionClick(ledger)}>
                      Collect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCollectionModal && selectedLedger && (
        <div className={styles.modalOverlay} onClick={() => setShowCollectionModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Record Collection</h3>
            <p>{selectedLedger.customerName} — outstanding {formatMoney(selectedLedger.outstandingBalance)}</p>
            <label className={styles.label}>
              Collection Amount
              <input type="number" value={collectionAmount} onChange={(e) => setCollectionAmount(e.target.value)} min={0} step="0.01" />
            </label>
            <label className={styles.label}>
              Payment Method
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
              </select>
            </label>
            {paymentMethod === 'transfer' && (
              <label className={styles.label}>
                Bank Account
                <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
                  <option value="">Select account</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.accountName} ({a.bankName})</option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.label}>
              Notes
              <textarea value={collectionNotes} onChange={(e) => setCollectionNotes(e.target.value)} rows={2} />
            </label>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowCollectionModal(false)}>Cancel</button>
              <button type="button" className={styles.primaryBtn} onClick={handleCollectionSubmit} disabled={isProcessing}>
                {isProcessing ? 'Saving...' : 'Record collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerCreditPage;
