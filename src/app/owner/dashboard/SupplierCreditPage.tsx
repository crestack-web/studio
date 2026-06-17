'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, doc, updateDoc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { isCreditLayerEligible, getBusinessType } from '@/lib/featureRestrictions';
import styles from './SupplierCreditPage.module.css';

interface SupplierCreditLedger {
  id: string;
  supplierId: string;
  supplierName: string;
  stockReceiptId: string;
  receiptNumber: string;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  dueDate?: Timestamp;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  payments: Array<{
    paymentId: string;
    amount: number;
    paymentDate: Timestamp;
    paymentMethod: string;
    bankAccountId?: string;
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

export function SupplierCreditPage() {
  const { showToast, user } = useApp();
  const { formatMoney, currency } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [creditLedger, setCreditLedger] = useState<SupplierCreditLedger[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<SupplierCreditLedger | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [businessType, setBusinessType] = useState<string>('');
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

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
        showToast('⚠️ Supplier Credit is available for wholesale and retail businesses only');
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
      
      // Load supplier credit ledger
      const ledgerQuery = query(
        collection(firestore, 'businesses', businessId, 'supplierCreditLedger'),
        where('status', '!=', 'paid'),
        orderBy('dueDate', 'asc')
      );
      
      const ledgerSnapshot = await getDocs(ledgerQuery);
      const ledgerList: SupplierCreditLedger[] = [];
      
      ledgerSnapshot.forEach(doc => {
        const data = doc.data();
        ledgerList.push({
          id: doc.id,
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          stockReceiptId: data.stockReceiptId,
          receiptNumber: data.receiptNumber,
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
      showToast('❌ Failed to load supplier credit data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentClick = (ledger: SupplierCreditLedger) => {
    setSelectedLedger(ledger);
    setPaymentAmount(ledger.outstandingBalance.toString());
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedLedger || !paymentAmount) {
      showToast('⚠️ Please enter payment amount');
      return;
    }
    
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      showToast('⚠️ Please enter a valid amount');
      return;
    }
    
    if (amount > selectedLedger.outstandingBalance) {
      showToast('⚠️ Payment cannot exceed outstanding balance');
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
        // Update supplier credit ledger
        const ledgerRef = doc(firestore, 'businesses', businessId, 'supplierCreditLedger', selectedLedger.id);
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
          notes: paymentNotes.trim() || undefined,
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
            const newBankBalance = currentBalance - amount;
            
            transaction.update(bankRef, {
              currentBalance: newBankBalance,
              totalMoneyOut: (bankData.totalMoneyOut || 0) + amount,
              updatedAt: Timestamp.now(),
            });
            
            // Create bank transaction record
            const txnRef = doc(collection(firestore, 'businesses', businessId, 'bankTransactions'));
            const transactionNumber = `TXN-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
            transaction.set(txnRef, {
              transactionNumber,
              bankAccountId,
              accountName: bankData.accountName,
              type: 'money_out',
              category: 'supplier_payment',
              amount,
              balanceAfter: newBankBalance,
              referenceId: selectedLedger.id,
              referenceType: 'supplier_credit',
              description: `Payment to ${selectedLedger.supplierName}`,
              paymentMethod,
              performedBy: user.id,
              performedByName: user.name || user.email || 'Unknown',
              notes: paymentNotes.trim() || undefined,
              createdAt: Timestamp.now(),
            });
          }
        }
      });
      
      showToast('✅ Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedLedger(null);
      
      await loadData();
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast('❌ Failed to process payment');
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
          <h2 className={styles.pageTitle}>Supplier Credit</h2>
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
          <h2 className={styles.pageTitle}>Supplier Credit</h2>
          <p className={styles.pageDesc}>Track outstanding balances to suppliers</p>
        </div>
        <div className={styles.notEligible}>
          <div className={styles.notEligibleIcon}>🔒</div>
          <h3 className={styles.notEligibleTitle}>Feature Not Available</h3>
          <p className={styles.notEligibleMessage}>
            Supplier Credit management is available for wholesale and retail businesses only.
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
          <h2 className={styles.pageTitle}>Supplier Credit</h2>
          <p className={styles.pageDesc}>Track outstanding balances to suppliers</p>
        </div>
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total Outstanding</span>
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
          <p>All supplier payments are up to date</p>
        </div>
      ) : (
        <div className={styles.ledgerList}>
          {creditLedger.map(ledger => (
            <div key={ledger.id} className={styles.ledgerCard}>
              <div className={styles.ledgerHeader}>
                <div className={styles.ledgerSupplier}>
                  <div className={styles.supplierIcon}>🏢</div>
                  <div>
                    <h3 className={styles.supplierName}>{ledger.supplierName}</h3>
                    <span className={styles.receiptNumber}>{ledger.receiptNumber}</span>
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
                  <span className={styles.itemsLabel}>Items Received:</span>
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
            </div>
            ))}
          </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && selectedLedger && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record Payment</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowPaymentModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.ledgerSummary}>
                <span className={styles.ledgerSummaryLabel}>Supplier:</span>
                <span className={styles.ledgerSummaryValue}>{selectedLedger.supplierName}</span>
              </div>
              <div className={styles.ledgerSummary}>
                <span className={styles.ledgerSummaryLabel}>Outstanding:</span>
                <span className={styles.ledgerSummaryValue}>{formatMoney(selectedLedger.outstandingBalance)}</span>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Amount</label>
                <input
                  type="number"
                  className={styles.input}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
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
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              <button
                className={styles.submitButton}
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay ${formatMoney(parseFloat(paymentAmount) || 0)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}
