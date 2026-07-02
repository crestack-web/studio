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
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Form states for adding customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCreditLimit, setCustomerCreditLimit] = useState('');

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
        collection(firestore, 'businesses', businessId, 'credit_customers'),
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
        collection(firestore, 'businesses', businessId, 'credit_transactions'),
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

  const handleRecordPayment = async () => {
    if (!businessId || !firestore || !selectedTransaction) return;

    const finalPaymentAmount = paymentAmount || selectedTransaction.remainingAmount;
    const finalPaymentMethod = paymentMethod || 'cash';

    try {
      setIsRecordingPayment(true);
      const transactionRef = doc(firestore, 'businesses', businessId, 'credit_transactions', selectedTransaction.id);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        showToast('Transaction not found');
        setIsRecordingPayment(false);
        return;
      }

      const transactionData = transactionDoc.data();
      const currentPaidAmount = transactionData.paidAmount || 0;
      const currentRemainingAmount = transactionData.remainingAmount || selectedTransaction.remainingAmount;
      const newPaidAmount = currentPaidAmount + finalPaymentAmount;
      const newRemainingAmount = currentRemainingAmount - finalPaymentAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      await updateDoc(transactionRef, {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, newRemainingAmount),
        status: newStatus,
        paidAt: newStatus === 'paid' ? Timestamp.now() : null,
      });

      // Record payment in history
      const paymentsCollection = collection(firestore, 'businesses', businessId, 'creditPayments');
      await addDoc(paymentsCollection, {
        transactionId: selectedTransaction.id,
        customerId: selectedTransaction.customerId,
        amount: finalPaymentAmount,
        paymentMethod: finalPaymentMethod,
        paymentDate: Timestamp.now(),
        recordedBy: user?.id || 'system',
        recordedByName: user?.name || 'System',
      });

      showToast('Payment recorded successfully');
      setShowPaymentModal(false);
      setSelectedTransaction(null);
      setPaymentAmount(0);
      setPaymentMethod('cash');
      loadData();
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!businessId || !firestore || !customerName.trim()) {
      showToast('Please enter customer name');
      return;
    }

    try {
      setIsAddingCustomer(true);
      
      const customerData = {
        name: customerName.trim(),
        phone: customerPhone.trim() || '',
        email: customerEmail.trim() || '',
        totalCreditLimit: parseFloat(customerCreditLimit) || 0,
        currentBalance: 0,
        isRegularCustomer: false,
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: user?.id || 'system',
        createdByName: user?.name || 'System',
        businessId: businessId,
      };

      await addDoc(collection(firestore, 'businesses', businessId, 'credit_customers'), customerData);
      
      showToast('Customer added successfully');
      setShowAddModal(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerCreditLimit('');
      loadData();
    } catch (error) {
      console.error('Error adding customer:', error);
      showToast('Failed to add customer');
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const handleDownloadStatement = async () => {
    if (!businessId || !firestore || isDownloading) return;

    try {
      setIsDownloading(true);

      // Get business info
      const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
      const businessData = businessDoc.data();
      const businessName = businessData?.businessName || 'Your Business';

      // Generate CSV content
      let csvContent = 'CREDIT TRACKING STATEMENT\n';
      csvContent += `Business: ${businessName}\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `${'='.repeat(80)}\n\n`;

      // Summary Section
      csvContent += 'SUMMARY\n';
      csvContent += `${'='.repeat(80)}\n`;
      csvContent += `Total Outstanding,${formatMoney(summary.totalOutstanding).replace(/[^0-9.,]/g, '')}\n`;
      csvContent += `Overdue Amount,${formatMoney(summary.overdueAmount).replace(/[^0-9.,]/g, '')}\n`;
      csvContent += `Due This Week,${formatMoney(summary.dueThisWeek).replace(/[^0-9.,]/g, '')}\n`;
      csvContent += `Due This Month,${formatMoney(summary.dueThisMonth).replace(/[^0-9.,]/g, '')}\n`;
      csvContent += `Total Customers,${summary.totalCustomers}\n`;
      csvContent += `Active Credits,${summary.activeCredits}\n`;
      csvContent += `Paid This Month,${formatMoney(summary.paidThisMonth).replace(/[^0-9.,]/g, '')}\n`;
      csvContent += `\n`;

      // Customers Section
      csvContent += 'CREDIT CUSTOMERS\n';
      csvContent += `${'='.repeat(80)}\n`;
      csvContent += `Name,Phone,Email,Current Balance,Credit Limit\n`;
      
      customers.forEach(customer => {
        csvContent += `${customer.name},${customer.phone || 'N/A'},${customer.email || 'N/A'},${customer.currentBalance},${customer.totalCreditLimit || 0}\n`;
      });
      csvContent += `\n`;

      // Transactions Section
      csvContent += 'CREDIT TRANSACTIONS\n';
      csvContent += `${'='.repeat(80)}\n`;
      csvContent += `Customer Name,Transaction Date,Due Date,Original Amount,Paid Amount,Remaining,Status\n`;
      
      transactions.forEach(transaction => {
        csvContent += `${transaction.customerName},${transaction.issuedDate.toLocaleDateString()},${transaction.dueDate.toLocaleDateString()},${transaction.originalAmount},${transaction.paidAmount},${transaction.remainingAmount},${transaction.status}\n`;
      });
      csvContent += `\n`;

      // Detailed Transaction Information
      csvContent += 'DETAILED TRANSACTIONS WITH PRODUCTS\n';
      csvContent += `${'='.repeat(80)}\n`;
      
      transactions.forEach((transaction, index) => {
        csvContent += `\nTransaction #${index + 1}\n`;
        csvContent += `Customer: ${transaction.customerName}\n`;
        csvContent += `Sale ID: ${transaction.saleId}\n`;
        csvContent += `Date: ${transaction.issuedDate.toLocaleDateString()}\n`;
        csvContent += `Due Date: ${transaction.dueDate.toLocaleDateString()}\n`;
        csvContent += `Status: ${transaction.status}\n`;
        csvContent += `Original Amount: ${transaction.originalAmount}\n`;
        csvContent += `Paid Amount: ${transaction.paidAmount}\n`;
        csvContent += `Remaining Amount: ${transaction.remainingAmount}\n`;
        csvContent += `Recorded By: ${transaction.recordedByName}\n`;
        
        if (transaction.products && transaction.products.length > 0) {
          csvContent += `Products:\n`;
          transaction.products.forEach((product, pIndex) => {
            csvContent += `  ${pIndex + 1}. ${product.name} - Qty: ${product.quantity} × Price: ${product.price} = ${product.price * product.quantity}\n`;
          });
        }
        
        if (transaction.notes) {
          csvContent += `Notes: ${transaction.notes}\n`;
        }
        
        csvContent += `${'-'.repeat(80)}\n`;
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `credit_statement_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Statement downloaded successfully');
    } catch (error) {
      console.error('Error downloading statement:', error);
      showToast('Failed to download statement');
    } finally {
      setIsDownloading(false);
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={styles.secondaryButton}
            onClick={handleDownloadStatement}
            disabled={isDownloading || loading}
          >
            <Download size={18} style={{ marginRight: '8px' }} />
            {isDownloading ? 'Downloading...' : 'Download Statement'}
          </button>
          <button className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={18} style={{ marginRight: '8px' }} />
            Add Customer
          </button>
        </div>
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
                          disabled={loading}
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
              
              {/* Products List */}
              {selectedTransaction.products && selectedTransaction.products.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>
                    Products:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedTransaction.products.map((product, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: 'var(--text-1)',
                        padding: '4px 8px',
                        background: 'var(--bg)',
                        borderRadius: '4px'
                      }}>
                        <span>{product.name} × {product.quantity}</span>
                        <span>{formatMoney(product.price * product.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Amount</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="Enter amount"
                  max={selectedTransaction.remainingAmount}
                  value={paymentAmount || ''}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Method</label>
                <select 
                  className={styles.select}
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="pos">POS</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={() => {
                setShowPaymentModal(false);
                setPaymentAmount(0);
                setPaymentMethod('cash');
              }}>Cancel</button>
              <button 
                className={styles.submitButton}
                onClick={handleRecordPayment}
                disabled={isRecordingPayment || !paymentAmount || paymentAmount > selectedTransaction.remainingAmount}
              >
                {isRecordingPayment ? 'Recording...' : 'Record Payment'}
              </button>
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
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Enter name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="Enter phone"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="Enter email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Credit Limit</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0.00"
                  value={customerCreditLimit}
                  onChange={e => setCustomerCreditLimit(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddModal(false);
                  setCustomerName('');
                  setCustomerPhone('');
                  setCustomerEmail('');
                  setCustomerCreditLimit('');
                }}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleAddCustomer}
                disabled={isAddingCustomer || !customerName.trim()}
              >
                {isAddingCustomer ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
