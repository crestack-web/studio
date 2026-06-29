'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, getDoc, Timestamp, runTransaction, limit } from 'firebase/firestore';
import { useBranch } from '@/context/BranchContext';
import { UserCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, Plus, ArrowUpRight, ArrowDownRight, Users, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import styles from './CreditTrackingPage.module.css';

// ═══════════════════════════════════════════
//  CreditTrackingPage — Receivables & Payables Management
// ═══════════════════════════════════════════

interface CreditCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  businessType?: 'individual' | 'business';
  notes?: string;
  createdAt: Date;
  totalCreditLimit?: number;
  currentBalance: number;
  isRegularCustomer: boolean;
}

interface CreditTransaction {
  id: string;
  customerId: string;
  customerName: string;
  saleId: string;
  amount: number;
  originalAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'written_off';
  dueDate: Date;
  issuedDate: Date;
  paidAmount: number;
  remainingAmount: number;
  paymentHistory: CreditPayment[];
  notes?: string;
  reminderSent: boolean;
  reminderCount: number;
  lastReminderDate?: Date;
  writtenOffAt?: Date;
  writtenOffReason?: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  branchId?: string;
  recordedBy: string;
  recordedByName: string;
}

interface CreditPayment {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'card';
  reference?: string;
  notes?: string;
  recordedBy: string;
  recordedByName: string;
}

interface CreditSummary {
  totalOutstanding: number;
  overdueAmount: number;
  dueThisWeek: number;
  dueThisMonth: number;
  totalCustomers: number;
  activeCredits: number;
  paidThisMonth: number;
  averageCollectionDays: number;
}

type TabView = 'receivables' | 'payables' | 'customers' | 'suppliers';

let firestoreInstance: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

export function CreditTrackingPage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = React.useMemo(() => {
    if (!firestoreInstance) {
      const initialized = initializeFirebase();
      firestoreInstance = initialized.firestore;
    }
    return { firestore: firestoreInstance };
  }, []);
  const [activeTab, setActiveTab] = useState<TabView>('receivables');
  const [loading, setLoading] = useState(true);
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
  const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CreditTransaction | null>(null);
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [businessId, firestore, dateFilter]);

  const loadData = async () => {
    if (!businessId || !firestore) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load credit customers
      const customersQuery = query(
        collection(firestore, 'businesses', businessId, 'creditCustomers'),
        where('isActive', '==', true)
      );
      const customersSnapshot = await getDocs(customersQuery);
      const customersList: CreditCustomer[] = [];
      
      customersSnapshot.forEach(doc => {
        const data = doc.data();
        customersList.push({
          id: doc.id,
          name: data.name || data.customerName || '',
          phone: data.phone,
          email: data.email,
          address: data.address,
          businessType: data.businessType || 'individual',
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          totalCreditLimit: data.totalCreditLimit || 0,
          currentBalance: data.currentBalance || 0,
          isRegularCustomer: data.isRegularCustomer || false,
        });
      });
      
      setCustomers(customersList);

      // Load credit transactions with date filter
      let transactionsQuery = query(
        collection(firestore, 'businesses', businessId, 'creditTransactions'),
        orderBy('issuedDate', 'desc'),
        limit(100)
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsList: CreditTransaction[] = [];
      let totalOutstanding = 0;
      let overdueAmount = 0;
      let dueThisWeek = 0;
      let dueThisMonth = 0;
      let activeCredits = 0;
      let paidThisMonth = 0;

      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      transactionsSnapshot.forEach(doc => {
        const data = doc.data();
        const transaction: CreditTransaction = {
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
          paymentHistory: data.paymentHistory || [],
          notes: data.notes,
          reminderSent: data.reminderSent || false,
          reminderCount: data.reminderCount || 0,
          lastReminderDate: data.lastReminderDate?.toDate(),
          writtenOffAt: data.writtenOffAt?.toDate(),
          writtenOffReason: data.writtenOffReason,
          products: data.products || [],
          branchId: data.branchId,
          recordedBy: data.recordedBy || '',
          recordedByName: data.recordedByName || '',
        };

        transactionsList.push(transaction);

        // Calculate summary stats
        if (transaction.status === 'pending' || transaction.status === 'partial' || transaction.status === 'overdue' || transaction.status === 'written_off') {
          totalOutstanding += transaction.remainingAmount;
          activeCredits++;

        if (transaction.dueDate < now) {
          overdueAmount += transaction.remainingAmount;
        }

          if (transaction.dueDate <= weekEnd && transaction.dueDate >= now) {
            dueThisWeek += transaction.remainingAmount;
          }

          if (transaction.dueDate <= monthEnd && transaction.dueDate >= now) {
            dueThisMonth += transaction.remainingAmount;
          }
        }

        if (transaction.status === 'paid' && transaction.issuedDate.getMonth() === now.getMonth()) {
          paidThisMonth += transaction.amount;
        }
      });

      setTransactions(transactionsList);
      setSummary({
        totalOutstanding,
        overdueAmount,
        dueThisWeek,
        dueThisMonth,
        totalCustomers: customersList.length,
        activeCredits,
        paidThisMonth,
        averageCollectionDays: 0,
      });
    } catch (error) {
      console.error('Error loading credit data:', error);
      showToast('Failed to load credit data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (transactionId: string, paymentAmount: number, paymentMethod: string) => {
    if (!businessId || !firestore || !selectedTransaction) return;

    try {
      const transactionRef = doc(firestore, 'businesses', businessId, 'creditTransactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        showToast('Transaction not found');
        return;
      }

      const transactionData = transactionDoc.data();
      const newPaidAmount = (transactionData.paidAmount || 0) + paymentAmount;
      const newRemainingAmount = (transactionData.remainingAmount || 0) - paymentAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      await updateDoc(transactionRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paidAt: newStatus === 'paid' ? Timestamp.now() : null,
      });

      // Record payment in history
      const paymentRef = doc(firestore, 'businesses', businessId, 'creditPayments', `payment-${Date.now()}`);
      await updateDoc(paymentRef, {
        transactionId,
        customerId: selectedTransaction.customerId,
        amount: paymentAmount,
        paymentMethod,
        paymentDate: Timestamp.now(),
        recordedBy: user?.id || 'system',
        recordedByName: user?.name || 'System',
      });

      showToast('Payment recorded successfully');
      setShowPaymentModal(false);
      setSelectedTransaction(null);
      loadData();
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Failed to record payment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return styles.statusPaid;
      case 'partial':
        return styles.statusPartial;
      case 'overdue':
        return styles.statusOverdue;
      case 'pending':
        return styles.statusPending;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} />;
      case 'partial':
        return <Clock size={16} />;
      case 'overdue':
        return <AlertCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      default:
        return <XCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Credit Tracking</h1>
          <p className={styles.subtitle}>Manage receivables and payables</p>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading credit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Credit Tracking</h1>
          <p className={styles.subtitle}>Manage receivables and payables</p>
        </div>
        <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
          <Plus size={18} style={{ marginRight: '8px' }} />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <DollarSign size={24} />
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Total Outstanding</div>
            <div className={styles.summaryValue}>{formatMoney(summary.totalOutstanding)}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconWarning}`}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Overdue</div>
            <div className={styles.summaryValue}>{formatMoney(summary.overdueAmount)}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconInfo}`}>
            <Clock size={24} />
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Due This Week</div>
            <div className={styles.summaryValue}>{formatMoney(summary.dueThisWeek)}</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconSuccess}`}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Paid This Month</div>
            <div className={styles.summaryValue}>{formatMoney(summary.paidThisMonth)}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'receivables' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('receivables')}
        >
          <ArrowDownRight size={18} />
          Receivables
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'payables' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('payables')}
        >
          <ArrowUpRight size={18} />
          Payables
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'customers' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <Users size={18} />
          Customers
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {activeTab === 'receivables' && (
          <div className={styles.transactionsList}>
            {transactions.length === 0 ? (
              <div className={styles.emptyState}>
                <Eye size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3>No Receivables</h3>
                <p>All credit transactions have been paid</p>
              </div>
            ) : (
              transactions.map(transaction => (
                <div key={transaction.id} className={styles.transactionCard}>
                  <div className={styles.transactionHeader}>
                    <div>
                      <div className={styles.customerName}>{transaction.customerName}</div>
                      <div className={styles.transactionDate}>
                        <Calendar size={14} />
                        {transaction.issuedDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`${styles.statusBadge} ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </div>
                  </div>

                  <div className={styles.transactionBody}>
                    <div className={styles.transactionAmounts}>
                      <div className={styles.amountRow}>
                        <span className={styles.amountLabel}>Original:</span>
                        <span className={styles.amountValue}>{formatMoney(transaction.originalAmount)}</span>
                      </div>
                      <div className={styles.amountRow}>
                        <span className={styles.amountLabel}>Paid:</span>
                        <span className={`${styles.amountValue} ${styles.amountPaid}`}>{formatMoney(transaction.paidAmount)}</span>
                      </div>
                      <div className={`${styles.amountRow} ${styles.amountRowHighlight}`}>
                        <span className={styles.amountLabel}>Remaining:</span>
                        <span className={`${styles.amountValue} ${styles.amountRemaining}`}>{formatMoney(transaction.remainingAmount)}</span>
                      </div>
                    </div>

                    <div className={styles.transactionMeta}>
                      <div className={styles.metaItem}>
                        <Calendar size={14} />
                        <span>Due: {transaction.dueDate.toLocaleDateString()}</span>
                      </div>
                      {transaction.remainingAmount > 0 && (
                        <button
                          className={styles.actionButton}
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowPaymentModal(true);
                          }}
                        >
                          <Plus size={16} />
                          Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'payables' && (
          <div className={styles.emptyState}>
            <EyeOff size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3>No Payables</h3>
            <p>Payables will appear here when you have outstanding supplier invoices</p>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className={styles.customersList}>
            {customers.length === 0 ? (
              <div className={styles.emptyState}>
                <Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3>No Credit Customers</h3>
                <p>Add customers to manage credit transactions</p>
              </div>
            ) : (
              customers.map(customer => (
                <div key={customer.id} className={styles.customerCard}>
                  <div className={styles.customerInfo}>
                    <div className={styles.customerName}>{customer.name}</div>
                    {customer.phone && <div className={styles.customerContact}>{customer.phone}</div>}
                    {customer.email && <div className={styles.customerContact}>{customer.email}</div>}
                  </div>
                  <div className={styles.customerBalance}>
                    <div className={styles.balanceLabel}>Outstanding</div>
                    <div className={styles.balanceValue}>{formatMoney(customer.currentBalance)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedTransaction && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Record Payment</h3>
            <div className={styles.modalBody}>
              <div className={styles.paymentInfo}>
                <div>Customer: <strong>{selectedTransaction.customerName}</strong></div>
                <div>Remaining: <strong>{formatMoney(selectedTransaction.remainingAmount)}</strong></div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Amount</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="Enter amount"
                  max={selectedTransaction.remainingAmount}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Method</label>
                <select className={styles.select}>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="pos">POS</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className={styles.submitButton}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add Credit Customer</h3>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Customer Name</label>
                <input type="text" className={styles.input} placeholder="Enter name" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone</label>
                <input type="tel" className={styles.input} placeholder="Enter phone" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input type="email" className={styles.input} placeholder="Enter email" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Credit Limit</label>
                <input type="number" className={styles.input} placeholder="0.00" />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className={styles.submitButton}>Add Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
