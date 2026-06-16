import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, Timestamp, runTransaction } from 'firebase/firestore';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { CreditCustomer, CreditTransaction, CreditPayment, CreditStatus, CreditSummary } from './types';
import { initializeFirebase } from '@/firebase';
import styles from './CreditTrackingPage.module.css';

export function CreditTrackingPage() {
  const { navigateTo, showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currencyCode } = useCurrency();
  const firestore = useFirestore();

  const [customers, setCustomers] = useState<CreditCustomer[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [summary, setSummary] = useState<CreditSummary>({
    totalOutstanding: 0,
    overdueAmount: 0,
    dueThisWeek: 0,
    dueThisMonth: 0,
    totalCustomers: 0,
    activeCredits: 0,
    paidThisMonth: 0,
    averageCollectionDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'customers' | 'transactions'>('overview');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CreditTransaction | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Add customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    businessType: 'individual' as 'individual' | 'business',
    notes: '',
    creditLimit: '',
  });

  // Record payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'pos' | 'card',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      if (!firestore || !user) return;

      try {
        setLoading(true);

        // Get business ID
        const userDoc = await getDoc(doc(firestore, 'users', user.id));
        const bId = userDoc.data()?.businessId;
        if (!bId) {
          showToast('Business ID not found');
          return;
        }
        setBusinessId(bId);

        // Load customers
        const customersQuery = query(
          collection(firestore, 'businesses', bId, 'credit_customers'),
          orderBy('createdAt', 'desc')
        );
        const customersSnapshot = await getDocs(customersQuery);
        const loadedCustomers: CreditCustomer[] = [];
        customersSnapshot.forEach(doc => {
          const data = doc.data();
          loadedCustomers.push({
            id: doc.id,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            businessType: data.businessType || 'individual',
            notes: data.notes || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            totalCreditLimit: data.totalCreditLimit,
            currentBalance: data.currentBalance || 0,
            isRegularCustomer: data.isRegularCustomer || false,
          });
        });
        setCustomers(loadedCustomers);

        // Load transactions
        const transactionsQuery = query(
          collection(firestore, 'businesses', bId, 'credit_transactions'),
          orderBy('issuedDate', 'desc')
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const loadedTransactions: CreditTransaction[] = [];
        transactionsSnapshot.forEach(doc => {
          const data = doc.data();
          const paymentHistory: CreditPayment[] = [];
          if (data.paymentHistory && Array.isArray(data.paymentHistory)) {
            data.paymentHistory.forEach((p: any) => {
              paymentHistory.push({
                id: p.id,
                amount: p.amount,
                paymentDate: p.paymentDate?.toDate() || new Date(),
                paymentMethod: p.paymentMethod,
                reference: p.reference,
                notes: p.notes,
                recordedBy: p.recordedBy,
                recordedByName: p.recordedByName,
              });
            });
          }

          loadedTransactions.push({
            id: doc.id,
            customerId: data.customerId || '',
            customerName: data.customerName || '',
            saleId: data.saleId || '',
            amount: data.amount || 0,
            originalAmount: data.originalAmount || data.amount || 0,
            status: data.status || 'pending',
            dueDate: data.dueDate?.toDate() || new Date(),
            issuedDate: data.issuedDate?.toDate() || new Date(),
            paidAmount: data.paidAmount || 0,
            remainingAmount: data.remainingAmount || data.amount || 0,
            paymentHistory,
            notes: data.notes || '',
            reminderSent: data.reminderSent || false,
            reminderCount: data.reminderCount || 0,
            lastReminderDate: data.lastReminderDate?.toDate(),
            writtenOffAt: data.writtenOffAt?.toDate(),
            writtenOffReason: data.writtenOffReason || '',
            products: data.products || [],
            branchId: data.branchId,
            recordedBy: data.recordedBy || '',
            recordedByName: data.recordedByName || '',
          });
        });
        setTransactions(loadedTransactions);

        console.log('Loaded credit transactions:', loadedTransactions.length);
        console.log('Loaded credit customers:', loadedCustomers.length);

        // Calculate summary
        calculateSummary(loadedTransactions, loadedCustomers);
      } catch (error) {
        console.error('Error loading credit data:', error);
        showToast('Failed to load credit data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [firestore, user, showToast]);

  function calculateSummary(transs: CreditTransaction[], custs: CreditCustomer[]) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalOutstanding = 0;
    let overdueAmount = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;
    let activeCredits = 0;
    let paidThisMonth = 0;
    let totalCollectionDays = 0;
    let collectionCount = 0;

    transs.forEach(t => {
      if (t.status === 'paid') {
        if (t.issuedDate >= monthStart) {
          paidThisMonth += t.amount;
        }
        const daysToCollect = Math.ceil((t.paymentHistory[0]?.paymentDate.getTime() - t.issuedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToCollect > 0) {
          totalCollectionDays += daysToCollect;
          collectionCount++;
        }
      } else if (t.status !== 'written_off') {
        totalOutstanding += t.remainingAmount;
        activeCredits++;

        if (t.dueDate < now) {
          overdueAmount += t.remainingAmount;
        } else if (t.dueDate <= weekFromNow) {
          dueThisWeek += t.remainingAmount;
        } else if (t.dueDate <= monthFromNow) {
          dueThisMonth += t.remainingAmount;
        }
      }
    });

    setSummary({
      totalOutstanding,
      overdueAmount,
      dueThisWeek,
      dueThisMonth,
      totalCustomers: custs.length,
      activeCredits,
      paidThisMonth,
      averageCollectionDays: collectionCount > 0 ? Math.round(totalCollectionDays / collectionCount) : 0,
    });
  }

  async function handleAddCustomer() {
    if (!newCustomer.name || !businessId) return showToast('Customer name is required');

    try {
      const { firestore } = initializeFirebase();
      const customerRef = await addDoc(collection(firestore, 'businesses', businessId, 'credit_customers'), {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        businessType: newCustomer.businessType,
        notes: newCustomer.notes,
        totalCreditLimit: newCustomer.creditLimit ? Number(newCustomer.creditLimit) : null,
        currentBalance: 0,
        isRegularCustomer: false,
        createdAt: new Date(),
      });

      setCustomers(prev => [...prev, {
        id: customerRef.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        businessType: newCustomer.businessType,
        notes: newCustomer.notes,
        createdAt: new Date(),
        totalCreditLimit: newCustomer.creditLimit ? Number(newCustomer.creditLimit) : undefined,
        currentBalance: 0,
        isRegularCustomer: false,
      }]);

      setNewCustomer({ name: '', phone: '', email: '', address: '', businessType: 'individual', notes: '', creditLimit: '' });
      setShowAddCustomer(false);
      showToast('Customer added successfully');
    } catch (error) {
      console.error('Error adding customer:', error);
      showToast('Failed to add customer');
    }
  }

  async function handleRecordPayment() {
    if (!selectedTransaction || !paymentForm.amount || !businessId) return showToast('Amount is required');

    try {
      const { firestore } = initializeFirebase();
      const amount = Number(paymentForm.amount);
      const newPaidAmount = selectedTransaction.paidAmount + amount;
      const newRemainingAmount = selectedTransaction.remainingAmount - amount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      const payment: CreditPayment = {
        id: Date.now().toString(),
        amount,
        paymentDate: new Date(),
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        recordedBy: user.id,
        recordedByName: user.name || 'Unknown',
      };

      await updateDoc(doc(firestore, 'businesses', businessId, 'credit_transactions', selectedTransaction.id), {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, newRemainingAmount),
        status: newStatus,
        paymentHistory: [...selectedTransaction.paymentHistory, payment],
        updatedAt: new Date(),
      });

      // Update customer balance
      const customerRef = doc(firestore, 'businesses', businessId, 'credit_customers', selectedTransaction.customerId);
      const customerDoc = await getDoc(customerRef);
      if (customerDoc.exists()) {
        const currentBalance = customerDoc.data().currentBalance || 0;
        await updateDoc(customerRef, {
          currentBalance: Math.max(0, currentBalance - amount),
        });
      }

      setTransactions(prev => prev.map(t => 
        t.id === selectedTransaction.id 
          ? { 
              ...t, 
              paidAmount: newPaidAmount, 
              remainingAmount: Math.max(0, newRemainingAmount), 
              status: newStatus,
              paymentHistory: [...t.paymentHistory, payment],
            }
          : t
      ));

      setCustomers(prev => prev.map(c => 
        c.id === selectedTransaction.customerId 
          ? { ...c, currentBalance: Math.max(0, c.currentBalance - amount) }
          : c
      ));

      setPaymentForm({ amount: '', paymentMethod: 'cash', reference: '', notes: '' });
      setShowRecordPayment(false);
      setSelectedTransaction(null);
      showToast('Payment recorded successfully');
      calculateSummary(transactions, customers);
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Failed to record payment');
    }
  }

  async function handleSendReminder(transaction: CreditTransaction) {
    if (!businessId) return;

    try {
      const { firestore } = initializeFirebase();
      await updateDoc(doc(firestore, 'businesses', businessId, 'credit_transactions', transaction.id), {
        reminderSent: true,
        reminderCount: (transaction.reminderCount || 0) + 1,
        lastReminderDate: new Date(),
      });

      setTransactions(prev => prev.map(t => 
        t.id === transaction.id 
          ? { 
              ...t, 
              reminderSent: true, 
              reminderCount: (t.reminderCount || 0) + 1,
              lastReminderDate: new Date(),
            }
          : t
      ));

      showToast('Reminder sent successfully');
    } catch (error) {
      console.error('Error sending reminder:', error);
      showToast('Failed to send reminder');
    }
  }

  async function handleWriteOff(transaction: CreditTransaction) {
    if (!businessId) return;

    const reason = prompt('Reason for writing off this credit:');
    if (!reason) return;

    try {
      const { firestore } = initializeFirebase();
      await updateDoc(doc(firestore, 'businesses', businessId, 'credit_transactions', transaction.id), {
        status: 'written_off',
        writtenOffAt: new Date(),
        writtenOffReason: reason,
      });

      setTransactions(prev => prev.map(t => 
        t.id === transaction.id 
          ? { 
              ...t, 
              status: 'written_off',
              writtenOffAt: new Date(),
              writtenOffReason: reason,
            }
          : t
      ));

      showToast('Credit written off successfully');
      calculateSummary(transactions, customers);
    } catch (error) {
      console.error('Error writing off credit:', error);
      showToast('Failed to write off credit');
    }
  }

  function getStatusColor(status: CreditStatus): string {
    switch (status) {
      case 'pending': return 'var(--amber)';
      case 'partial': return 'var(--blue)';
      case 'paid': return 'var(--green)';
      case 'overdue': return 'var(--red)';
      case 'written_off': return 'var(--text-3)';
      default: return 'var(--text-2)';
    }
  }

  function isOverdue(transaction: CreditTransaction): boolean {
    return transaction.status !== 'paid' && 
           transaction.status !== 'written_off' && 
           transaction.dueDate < new Date();
  }

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 48, height: 48, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
          </svg>
          <div>Loading credit data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Credit Tracking</h2>
          <p className={styles.pageDesc}>Manage customer credits and track payments</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </CardIcon>
            Total Outstanding
          </CardHeader>
          <div className={styles.summaryValue}>{formatMoney(summary.totalOutstanding)}</div>
          <div className={styles.summaryLabel}>{summary.activeCredits} active credits</div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--red-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2} width={20} height={20}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </CardIcon>
            Overdue
          </CardHeader>
          <div className={styles.summaryValue} style={{ color: 'var(--red)' }}>{formatMoney(summary.overdueAmount)}</div>
          <div className={styles.summaryLabel}>Requires attention</div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--amber-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} width={20} height={20}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </CardIcon>
            Due This Week
          </CardHeader>
          <div className={styles.summaryValue}>{formatMoney(summary.dueThisWeek)}</div>
          <div className={styles.summaryLabel}>Upcoming payments</div>
        </Card>

        <Card>
          <CardHeader>
            <CardIcon bg="var(--green-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2} width={20} height={20}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </CardIcon>
            Paid This Month
          </CardHeader>
          <div className={styles.summaryValue} style={{ color: 'var(--green)' }}>{formatMoney(summary.paidThisMonth)}</div>
          <div className={styles.summaryLabel}>Collected payments</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={[styles.tab, selectedTab === 'overview' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button 
          className={[styles.tab, selectedTab === 'customers' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('customers')}
        >
          Customers ({customers.length})
        </button>
        <button 
          className={[styles.tab, selectedTab === 'transactions' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('transactions')}
        >
          Transactions ({transactions.length})
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} width={20} height={20}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </CardIcon>
            Active Credit Transactions
          </CardHeader>
          <div className={styles.transactionList}>
            {transactions.filter(t => t.status !== 'paid' && t.status !== 'written_off').length === 0 ? (
              <div className={styles.emptyState}>No active credit transactions</div>
            ) : (
              transactions
                .filter(t => t.status !== 'paid' && t.status !== 'written_off')
                .slice(0, 10)
                .map(transaction => (
                  <div key={transaction.id} className={styles.transactionItem}>
                    <div className={styles.transactionMain}>
                      <div className={styles.transactionCustomer}>{transaction.customerName}</div>
                      <div className={styles.transactionAmount}>{formatMoney(transaction.remainingAmount)}</div>
                    </div>
                    <div className={styles.transactionDetails}>
                      <span className={styles.transactionDate}>
                        Due: {transaction.dueDate.toLocaleDateString()}
                        {isOverdue(transaction) && <span className={styles.overdueBadge}>OVERDUE</span>}
                      </span>
                      <span className={styles.transactionStatus} style={{ color: getStatusColor(transaction.status) }}>
                        {transaction.status.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.transactionActions}>
                      <Button size="xs" variant="ghost" onClick={() => { setSelectedTransaction(transaction); setShowRecordPayment(true); }}>
                        Record Payment
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => handleSendReminder(transaction)}>
                        Remind
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>
      )}

      {selectedTab === 'customers' && (
        <Card>
          <CardHeader action={<Button size="sm" onClick={() => setShowAddCustomer(true)}>+ Add Customer</Button>}>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} width={20} height={20}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
            </CardIcon>
            Credit Customers
          </CardHeader>
          <div className={styles.customerList}>
            {customers.length === 0 ? (
              <div className={styles.emptyState}>No credit customers yet</div>
            ) : (
              customers.map(customer => (
                <div key={customer.id} className={styles.customerItem}>
                  <div className={styles.customerMain}>
                    <div className={styles.customerName}>{customer.name}</div>
                    <div className={styles.customerBalance}>{formatMoney(customer.currentBalance)} outstanding</div>
                  </div>
                  <div className={styles.customerDetails}>
                    {customer.phone && <div className={styles.customerContact}>{customer.phone}</div>}
                    {customer.email && <div className={styles.customerContact}>{customer.email}</div>}
                  </div>
                  <div className={styles.customerMeta}>
                    <span className={styles.customerType}>{customer.businessType}</span>
                    {customer.isRegularCustomer && <span className={styles.regularBadge}>Regular</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {selectedTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </CardIcon>
            All Transactions
          </CardHeader>
          <div className={styles.transactionList}>
            {transactions.length === 0 ? (
              <div className={styles.emptyState}>No credit transactions yet</div>
            ) : (
              transactions.map(transaction => (
                <div key={transaction.id} className={styles.transactionItem}>
                  <div className={styles.transactionMain}>
                    <div className={styles.transactionCustomer}>{transaction.customerName}</div>
                    <div className={styles.transactionAmount}>{formatMoney(transaction.amount)}</div>
                  </div>
                  <div className={styles.transactionDetails}>
                    <span className={styles.transactionDate}>
                      Issued: {transaction.issuedDate.toLocaleDateString()} | Due: {transaction.dueDate.toLocaleDateString()}
                    </span>
                    <span className={styles.transactionStatus} style={{ color: getStatusColor(transaction.status) }}>
                      {transaction.status.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.transactionProgress}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${(transaction.paidAmount / transaction.amount) * 100}%`,
                          backgroundColor: getStatusColor(transaction.status)
                        }}
                      />
                    </div>
                    <div className={styles.progressText}>
                      {formatMoney(transaction.paidAmount)} paid of {formatMoney(transaction.amount)}
                    </div>
                  </div>
                  {transaction.status !== 'paid' && transaction.status !== 'written_off' && (
                    <div className={styles.transactionActions}>
                      <Button size="xs" variant="ghost" onClick={() => { setSelectedTransaction(transaction); setShowRecordPayment(true); }}>
                        Record Payment
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => handleSendReminder(transaction)}>
                        Remind
                      </Button>
                      <Button size="xs" variant="danger" onClick={() => handleWriteOff(transaction)}>
                        Write Off
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className={styles.modalOverlay} onClick={() => setShowAddCustomer(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Credit Customer</h3>
              <button className={styles.modalClose} onClick={() => setShowAddCustomer(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Customer Name *</label>
                <input 
                  className={styles.formInput} 
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input 
                  className={styles.formInput} 
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input 
                  className={styles.formInput} 
                  type="email"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Address</label>
                <input 
                  className={styles.formInput} 
                  value={newCustomer.address}
                  onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Customer Type</label>
                <select 
                  className={styles.formInput}
                  value={newCustomer.businessType}
                  onChange={e => setNewCustomer({ ...newCustomer, businessType: e.target.value as 'individual' | 'business' })}
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Credit Limit (Optional)</label>
                <input 
                  className={styles.formInput} 
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={e => setNewCustomer({ ...newCustomer, creditLimit: e.target.value })}
                  placeholder="Enter credit limit"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <textarea 
                  className={styles.formInput} 
                  value={newCustomer.notes}
                  onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="subtle" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddCustomer}>Add Customer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPayment && selectedTransaction && (
        <div className={styles.modalOverlay} onClick={() => setShowRecordPayment(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Record Payment</h3>
              <button className={styles.modalClose} onClick={() => setShowRecordPayment(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.paymentSummary}>
                <div className={styles.paymentSummaryItem}>
                  <span className={styles.paymentSummaryLabel}>Customer:</span>
                  <span className={styles.paymentSummaryValue}>{selectedTransaction.customerName}</span>
                </div>
                <div className={styles.paymentSummaryItem}>
                  <span className={styles.paymentSummaryLabel}>Total Amount:</span>
                  <span className={styles.paymentSummaryValue}>{formatMoney(selectedTransaction.amount)}</span>
                </div>
                <div className={styles.paymentSummaryItem}>
                  <span className={styles.paymentSummaryLabel}>Remaining:</span>
                  <span className={styles.paymentSummaryValue}>{formatMoney(selectedTransaction.remainingAmount)}</span>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Payment Amount *</label>
                <input 
                  className={styles.formInput} 
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Enter payment amount"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Payment Method</label>
                <select 
                  className={styles.formInput}
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as 'cash' | 'transfer' | 'pos' | 'card' })}
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="pos">POS</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reference (Optional)</label>
                <input 
                  className={styles.formInput} 
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="Transaction reference"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <textarea 
                  className={styles.formInput} 
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Payment notes"
                  rows={2}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="subtle" onClick={() => setShowRecordPayment(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleRecordPayment}>Record Payment</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
