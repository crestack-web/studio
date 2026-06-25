'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, doc, updateDoc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { isCreditLayerEligible, getBusinessType } from '@/lib/featureRestrictions';
import { Supplier, SupplierLedgerTransaction } from './types';
import styles from './SupplierCreditPage.module.css';

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
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
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
      
      // Load suppliers
      const suppliersQuery = query(
        collection(firestore, 'businesses', businessId, 'suppliers'),
        where('status', '==', 'active')
      );
      
      const suppliersSnapshot = await getDocs(suppliersQuery);
      const suppliersList: Supplier[] = [];
      
      suppliersSnapshot.forEach(doc => {
        const data = doc.data();
        suppliersList.push({
          id: doc.id,
          businessId: data.businessId || '',
          supplierName: data.supplierName || '',
          businessName: data.businessName || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          notes: data.notes || '',
          paymentTerms: data.paymentTerms || 'net_30',
          customPaymentDays: data.customPaymentDays || 30,
          creditLimit: data.creditLimit || 0,
          openingBalance: data.openingBalance || 0,
          currentBalance: data.currentBalance || 0,
          category: data.category || 'general',
          status: data.status || 'active',
          taxId: data.taxId || '',
          bankAccount: data.bankAccount || null,
          contactPerson: data.contactPerson || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastPurchaseDate: data.lastPurchaseDate?.toDate(),
          lastPaymentDate: data.lastPaymentDate?.toDate(),
          totalPurchases: data.totalPurchases || 0,
          totalPayments: data.totalPayments || 0,
          purchaseCount: data.purchaseCount || 0,
          paymentCount: data.paymentCount || 0,
          averagePaymentDays: data.averagePaymentDays || 0,
          creditUtilization: data.creditUtilization || 0,
        });
      });
      
      setSuppliers(suppliersList);
      
      // Load supplier ledger
      const ledgerQuery = query(
        collection(firestore, 'businesses', businessId, 'supplierLedger'),
        orderBy('date', 'desc')
      );
      
      const ledgerSnapshot = await getDocs(ledgerQuery);
      const ledgerList: SupplierLedgerTransaction[] = [];
      
      ledgerSnapshot.forEach(doc => {
        const data = doc.data();
        ledgerList.push({
          id: doc.id,
          supplierId: data.supplierId || '',
          businessId: data.businessId || '',
          type: data.type || 'purchase',
          amount: data.amount || 0,
          balanceAfter: data.balanceAfter || 0,
          description: data.description || '',
          reference: data.reference || '',
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || '',
          metadata: data.metadata || {},
        });
      });
      
      setSupplierLedger(ledgerList);
      
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

  const handlePaymentClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPaymentAmount(supplier.currentBalance.toString());
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedSupplier || !paymentAmount) {
      showToast('⚠️ Please enter payment amount');
      return;
    }
    
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      showToast('⚠️ Please enter a valid amount');
      return;
    }
    
    if (amount > selectedSupplier.currentBalance) {
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
        // Update supplier balance
        const supplierRef = doc(firestore, 'businesses', businessId, 'suppliers', selectedSupplier.id);
        const supplierDoc = await transaction.get(supplierRef);
        
        if (!supplierDoc.exists()) {
          throw new Error('Supplier not found');
        }
        
        const supplierData = supplierDoc.data();
        const currentBalance = supplierData.currentBalance || 0;
        const newBalance = currentBalance - amount;
        const totalPayments = supplierData.totalPayments || 0;
        const paymentCount = supplierData.paymentCount || 0;
        
        transaction.update(supplierRef, {
          currentBalance: newBalance,
          totalPayments: totalPayments + amount,
          paymentCount: paymentCount + 1,
          lastPaymentDate: Timestamp.now(),
          creditUtilization: supplierData.creditLimit > 0 ? (newBalance / supplierData.creditLimit) * 100 : 0,
          updatedAt: Timestamp.now(),
        });
        
        // Create supplier ledger entry
        const ledgerRef = doc(collection(firestore, 'businesses', businessId, 'supplierLedger'));
        const paymentNumber = `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
        transaction.set(ledgerRef, {
          supplierId: selectedSupplier.id,
          businessId,
          type: 'payment',
          amount: amount,
          balanceAfter: newBalance,
          description: `Payment ${paymentNumber}`,
          reference: paymentNumber,
          date: Timestamp.now(),
          createdAt: Timestamp.now(),
          createdBy: user.id,
          createdByName: user.name || user.email || 'Unknown',
          metadata: {
            paymentMethod,
            notes: paymentNotes.trim() || undefined,
          },
        });
        
        // Create bank transaction if payment method is transfer
        if (paymentMethod === 'transfer' && bankAccountId) {
          const bankRef = doc(firestore, 'businesses', businessId, 'bankAccounts', bankAccountId);
          const bankDoc = await transaction.get(bankRef);
          
          if (bankDoc.exists()) {
            const bankData = bankDoc.data();
            const currentBankBalance = bankData.currentBalance || 0;
            const newBankBalance = currentBankBalance - amount;
            
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
              referenceId: selectedSupplier.id,
              referenceType: 'supplier_payment',
              description: `Payment to ${selectedSupplier.businessName}`,
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
      setSelectedSupplier(null);
      
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

  const isOverdue = (supplier: Supplier) => {
    if (!supplier.lastPurchaseDate) return false;
    const paymentDays = supplier.paymentTerms === 'cash' ? 0 : 
      supplier.paymentTerms === 'net_7' ? 7 :
      supplier.paymentTerms === 'net_14' ? 14 :
      supplier.paymentTerms === 'net_30' ? 30 :
      supplier.paymentTerms === 'net_60' ? 60 :
      supplier.paymentTerms === 'net_90' ? 90 :
      supplier.customPaymentDays || 30;
    const dueDate = new Date(supplier.lastPurchaseDate.getTime() + paymentDays * 24 * 60 * 60 * 1000);
    return dueDate < new Date();
  };

  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
  const overdueCount = suppliers.filter(s => isOverdue(s)).length;

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

      {suppliers.filter(s => s.currentBalance > 0).length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <h3>No Outstanding Credit</h3>
          <p>All supplier payments are up to date</p>
        </div>
      ) : (
        <div className={styles.ledgerList}>
          {suppliers.filter(s => s.currentBalance > 0).map(supplier => {
            const supplierTransactions = supplierLedger.filter(l => l.supplierId === supplier.id);
            const daysUntilDue = supplier.lastPurchaseDate ? 
              Math.ceil((supplier.lastPurchaseDate.getTime() + 
                (supplier.paymentTerms === 'cash' ? 0 : 
                 supplier.paymentTerms === 'net_7' ? 7 :
                 supplier.paymentTerms === 'net_14' ? 14 :
                 supplier.paymentTerms === 'net_30' ? 30 :
                 supplier.paymentTerms === 'net_60' ? 60 :
                 supplier.paymentTerms === 'net_90' ? 90 :
                 supplier.customPaymentDays || 30) * 24 * 60 * 60 * 1000 - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30;
            const overdue = daysUntilDue < 0;
            
            return (
              <div key={supplier.id} className={styles.ledgerCard}>
                <div className={styles.ledgerHeader}>
                  <div className={styles.ledgerSupplier}>
                    <div className={styles.supplierIcon}>🏢</div>
                    <div>
                      <h3 className={styles.supplierName}>{supplier.businessName}</h3>
                      <span className={styles.receiptNumber}>{supplier.paymentTerms.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className={`${styles.statusBadge} ${overdue ? styles.overdue : styles.pending}`}>
                    {overdue ? 'OVERDUE' : 'ACTIVE'}
                  </div>
                </div>
                
                <div className={styles.ledgerDetails}>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Total Purchases</span>
                    <span className={styles.detailValue}>{formatMoney(supplier.totalPurchases)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Total Payments</span>
                    <span className={styles.detailValue}>{formatMoney(supplier.totalPayments)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Outstanding</span>
                    <span className={`${styles.detailValue} ${styles.outstanding}`}>{formatMoney(supplier.currentBalance)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Credit Limit</span>
                    <span className={styles.detailValue}>{formatMoney(supplier.creditLimit)}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Due In</span>
                    <span className={`${styles.detailValue} ${overdue ? styles.overdue : ''}`}>
                      {overdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                    </span>
                  </div>
                </div>
                
                {supplierTransactions.length > 0 && (
                  <div className={styles.paymentsSection}>
                    <span className={styles.paymentsLabel}>Recent Transactions ({supplierTransactions.length}):</span>
                    <div className={styles.paymentsList}>
                      {supplierTransactions.slice(0, 5).map((transaction, index) => (
                        <div key={index} className={styles.paymentLine}>
                          <span>{transaction.date.toLocaleDateString()}</span>
                          <span>{transaction.type.toUpperCase()}</span>
                          <span>{formatMoney(transaction.amount)}</span>
                          <span>{transaction.description}</span>
                        </div>
                      ))}
                      {supplierTransactions.length > 5 && (
                        <div className={styles.paymentLine}>
                          <span>+{supplierTransactions.length - 5} more transactions</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <button 
                  className={styles.payButton}
                  onClick={() => handlePaymentClick(supplier)}
                >
                  Record Payment
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && selectedSupplier && (
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
                <span className={styles.ledgerSummaryValue}>{selectedSupplier.businessName}</span>
              </div>
              <div className={styles.ledgerSummary}>
                <span className={styles.ledgerSummaryLabel}>Outstanding:</span>
                <span className={styles.ledgerSummaryValue}>{formatMoney(selectedSupplier.currentBalance)}</span>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Amount</label>
                <input
                  type="number"
                  className={styles.input}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedSupplier.currentBalance}
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
