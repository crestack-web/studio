'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, doc, updateDoc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
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
  dueDate?: Timestamp;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  payments: Array<{
    paymentId: string;
    amount: number;
    paymentDate: Timestamp;
    paymentMethod: string;
    bankAccountId?: string;
    collectedBy: string;
    collectedByName: string;
    notes?: string;
  }>;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  createdAt: Timestamp;
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
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [creditLedger, setCreditLedger] = useState<CustomerCreditLedger[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<CustomerCreditLedger | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [businessType, setBusinessType] = useState<string>('');
  
  // Collection form state
  const [collectionAmount, setCollectionAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');

  useEffect(() => {
    checkEligibility();
    loadData();
  }, [businessId, firestore]);

  const checkEligibility = async () => {
    if (!user?.id) return;
    
    try {
      const type = await getBusinessType(user.id);
      setBusinessType(type);
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
    if (!businessId || !firestore) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Load customer credit ledger
      const ledgerQuery = query(
        collection(firestore, 'businesses', businessId, 'customerCreditLedger'),
        where('status', '!=', 'paid'),
        orderBy('dueDate', 'asc')
      );
      
      const ledgerSnapshot = await getDocs(ledgerQuery);
      const ledgerList: CustomerCreditLedger[] = [];
      
      ledgerSnapshot.forEach(doc => {
        const data = doc.data();
        ledgerList.push({
          id: doc.id,
          customerId: data.customerId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          saleId: data.saleId,
          saleNumber: data.saleNumber,
          totalAmount: data.totalAmount,
          amountPaid: data.amountPaid || 0,
          outstandingBalance: data.outstandingBalance,
          dueDate: data.dueDate,
          items: data.items || [],
          payments: data.payments || [],
          status: data.status,
          createdAt: data.createdAt,
        });
      });
      
      setCreditLedger(ledgerList);
      
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
          accountType: data.accountType,
          currentBalance: data.currentBalance,
          isActive: data.isActive,
          isDefault: data.isDefault,
        });
      });
      
      setBankAccounts(accountsList);
      
      // Set default bank account
      const defaultAccount = accountsList.find(a => a.isDefault);
      if (defaultAccount) {
        setBankAccountId(defaultAccount.id);
      }
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

      await runTransaction(firestore, async (transaction) => {
        // Update customer credit ledger
        const ledgerRef = doc(firestore, 'businesses', businessId, 'customerCreditLedger', selectedLedger.id);
        const ledgerDoc = await transaction.get(ledgerRef);
        
        if (!ledgerDoc.exists()) {
          throw new Error('Ledger not found');
        }
        
        const ledgerData = ledgerDoc.data();
        const currentPaid = ledgerData.amountPaid || 0;
        const newPaid = currentPaid + amount;
        const newBalance = ledgerData.totalAmount - newPaid;
        const newStatus = newBalance === 0 ? 'paid' : newBalance < ledgerData.totalAmount ? 'partial' : 'pending';
        
        const payments = ledgerData.payments || [];
        const paymentId = `PAY-${Date.now()}`;
        payments.push({
          paymentId,
          amount,
          paymentDate: Timestamp.now(),
          paymentMethod,
          bankAccountId: paymentMethod === 'transfer' ? bankAccountId : undefined,
          collectedBy: user.id,
          collectedByName: user.name || user.email || 'Unknown',
          notes: collectionNotes.trim() || undefined,
        });
        
        transaction.update(ledgerRef, {
          amountPaid: newPaid,
          outstandingBalance: newBalance,
          status: newStatus,
          payments,
          updatedAt: Timestamp.now(),
        });
        
        // Create bank transaction if payment method is transfer
        if (paymentMethod === 'transfer' && bankAccountId) {
          const bankRef = doc(firestore, 'businesses', businessId, 'bankAccounts', bankAccountId);
          const bankDoc = await transaction.get(bankRef);
          
          if (bankDoc.exists()) {
            const bankData = bankDoc.data();
            const currentBalance = bankData.currentBalance || 0;
            const newBankBalance = currentBalance + amount;
            
            transaction.update(bankRef, {
              currentBalance: newBankBalance,
              totalMoneyIn: (bankData.totalMoneyIn || 0) + amount,
              updatedAt: Timestamp.now(),
            });
            
            // Create bank transaction record
            const txnRef = doc(collection(firestore, 'businesses', businessId, 'bankTransactions'));
            const transactionNumber = `TXN-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
            transaction.set(txnRef, {
              transactionNumber,
              bankAccountId,
              accountName: bankData.accountName,
              type: 'money_in',
              category: 'collection',
              amount,
              balanceAfter: newBankBalance,
              referenceId: selectedLedger.id,
              referenceType: 'customer_credit',
              description: `Collection from ${selectedLedger.customerName}`,
              paymentMethod,
              performedBy: user.id,
              performedByName: user.name || user.email || 'Unknown',
              notes: collectionNotes.trim() || undefined,
              createdAt: Timestamp.now(),
            });
          }
        }
      });
      
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

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  const isOverdue = (dueDate?: Timestamp) => {
    if (!dueDate) return false;
    return new Date(dueDate.toDate()) < new Date();
  };

  const totalOutstanding = creditLedger.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const overdueCount = creditLedger.filter(l => isOverdue(l.dueDate)).length;

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Customer Credit</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (isEligible === false) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Customer Credit</h2>
          <p className={styles.pageDesc}>Track customer debts and collections</p>
        </div>
        <div className={styles.notEligible}>
          <div className={styles.notEligibleIcon}>🔒</div>
          <h3 className={styles.notEligibleTitle}>Feature Not Available</h3>
          <p className={styles.notEligibleMessage}>
            Customer Credit management is available for wholesale and retail businesses only.
          </p>
          <p className={styles.notEligibleSubMessage}>
            Your business type: <strong>{businessType}</strong>
          </p>
          <p className={styles.notEligibleHelp}>
            Eligible business types: Wholesale, Retail, Whole Seller, Big Retailer, Manufacturer, Distributor
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Customer Credit</h2>
          <p className={styles.pageDesc}>Track outstanding balances from customers</p>
        </div>
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total Receivable</span>
            <span className={styles.summaryValue}>{formatMoney(totalOutstanding)}</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Overdue</span>
            <span className={`${styles.summaryValue} ${styles.overdue}`}>{overdueCount}</span>
          </div>
        </div>
      </div>

      {creditLedger.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <h3>No Outstanding Credit</h3>
          <p>All customer payments are up to date</p>
        </div>
      ) : (
        <div className={styles.ledgerList}>
          {creditLedger.map(ledger => (
            <div key={ledger.id} className={styles.ledgerCard}>
              <div className={styles.ledgerHeader}>
                <div className={styles.ledgerCustomer}>
                  <div className={styles.customerIcon}>👤</div>
                  <div>
                    <h3 className={styles.customerName}>{ledger.customerName}</h3>
                    {ledger.customerPhone && (
                      <span className={styles.customerPhone}>{ledger.customerPhone}</span>
                    )}
                  </div>
                </div>
                <div className={`${styles.statusBadge} ${styles[ledger.status]}`}>
                  {ledger.status}
                </div>
              </div>
              
              <div className={styles.ledgerDetails}>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Total Amount</span>
                  <span className={styles.detailValue}>{formatMoney(ledger.totalAmount)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Amount Paid</span>
                  <span className={styles.detailValue}>{formatMoney(ledger.amountPaid)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Outstanding</span>
                  <span className={`${styles.detailValue} ${styles.outstanding}`}>{formatMoney(ledger.outstandingBalance)}</span>
                </div>
                {ledger.dueDate && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Due Date</span>
                    <span className={`${styles.detailValue} ${isOverdue(ledger.dueDate) ? styles.overdue : ''}`}>
                      {formatDate(ledger.dueDate)}
                    </span>
                  </div>
                )}
              </div>
              
              {ledger.items.length > 0 && (
                <div className={styles.itemsSection}>
                  <span className={styles.itemsLabel}>Items Sold:</span>
                  <div className={styles.itemsList}>
                    {ledger.items.map((item, index) => (
                      <div key={index} className={styles.itemLine}>
                        {item.productName} × {item.quantity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {ledger.payments.length > 0 && (
                <div className={styles.paymentsSection}>
                  <span className={styles.paymentsLabel}>Payment History ({ledger.payments.length}):</span>
                  <div className={styles.paymentsList}>
                    {ledger.payments.slice(-3).map((payment, index) => (
                      <div key={index} className={styles.paymentLine}>
                        <span>{formatDate(payment.paymentDate)}</span>
                        <span>{formatMoney(payment.amount)}</span>
                        <span>{payment.paymentMethod}</span>
                      </div>
                    ))}
                    {ledger.payments.length > 3 && (
                      <div className={styles.paymentLine}>
                        <span>+{ledger.payments.length - 3} more payments</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {ledger.status !== 'paid' && (
                <button
                  className={styles.collectButton}
                  onClick={() => handleCollectionClick(ledger)}
                >
                  Collect Payment
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collection Modal */}
      {showCollectionModal && selectedLedger && (
        <div className={styles.modalOverlay} onClick={() => setShowCollectionModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record Collection</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowCollectionModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.ledgerSummary}>
                <span className={styles.ledgerSummaryLabel}>Customer:</span>
                <span className={styles.ledgerSummaryValue}>{selectedLedger.customerName}</span>
              </div>
              <div className={styles.ledgerSummary}>
                <span className={styles.ledgerSummaryLabel}>Outstanding:</span>
                <span className={styles.ledgerSummaryValue}>{formatMoney(selectedLedger.outstandingBalance)}</span>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Collection Amount</label>
                <input
                  type="number"
                  className={styles.input}
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(e.target.value)}
                  max={selectedLedger.outstandingBalance}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Method</label>
                <select
                  className={styles.select}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                </select>
              </div>
              
              {paymentMethod === 'transfer' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Bank Account</label>
                  <select
                    className={styles.select}
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                  >
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountName} ({formatMoney(account.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Notes (optional)</label>
                <textarea
                  className={styles.textarea}
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              <button
                className={styles.submitButton}
                onClick={handleCollectionSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Collect ${formatMoney(parseFloat(collectionAmount) || 0)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
