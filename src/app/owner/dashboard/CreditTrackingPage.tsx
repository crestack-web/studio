import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, Timestamp, runTransaction } from 'firebase/firestore';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { CreditCustomer, CreditTransaction, CreditPayment, CreditStatus, CreditSummary, PayableSummary, CreditTrackingSummary, Supplier, SupplierLedgerTransaction } from './types';
import { initializeFirebase } from '@/firebase';
import { checkFeatureAccess } from '@/lib/featureRestrictions';
import styles from './CreditTrackingPage.module.css';

export function CreditTrackingPage() {
  const { navigateTo, showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currencyCode } = useCurrency();
  const firestore = useFirestore();

  const [customers, setCustomers] = useState<CreditCustomer[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerTransaction[]>([]);
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
  const [payableSummary, setPayableSummary] = useState<PayableSummary>({
    totalOutstanding: 0,
    overdueAmount: 0,
    dueThisWeek: 0,
    dueThisMonth: 0,
    totalSuppliers: 0,
    activePayables: 0,
    paidThisMonth: 0,
    averagePaymentDays: 0,
  });
  const [creditTrackingSummary, setCreditTrackingSummary] = useState<CreditTrackingSummary>({
    receivables: {
      totalOutstanding: 0,
      overdueAmount: 0,
      dueThisWeek: 0,
      dueThisMonth: 0,
      totalCustomers: 0,
      activeCredits: 0,
      paidThisMonth: 0,
      averageCollectionDays: 0,
    },
    payables: {
      totalOutstanding: 0,
      overdueAmount: 0,
      dueThisWeek: 0,
      dueThisMonth: 0,
      totalSuppliers: 0,
      activePayables: 0,
      paidThisMonth: 0,
      averagePaymentDays: 0,
    },
    netCreditPosition: 0,
    totalCreditExposure: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'receivables' | 'payables' | 'customers' | 'transactions'>('overview');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CreditTransaction | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CreditCustomer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [accessReason, setAccessReason] = useState('');

  useEffect(() => {
    checkCreditAccess();
  }, [user]);

  const checkCreditAccess = async () => {
    if (!user?.id) return;
    
    const accessResult = await checkFeatureAccess(user.id, 'creditTracking');
    if (!accessResult.eligible) {
      setHasAccess(false);
      setAccessReason(accessResult.reason || 'This feature is not available for your plan');
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Not Available</h3>
          <p className="text-gray-600">{accessReason}</p>
        </div>
      </div>
    );
  }

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

        // Load suppliers
        const suppliersQuery = query(
          collection(firestore, 'businesses', bId, 'suppliers'),
          where('status', '==', 'active')
        );
        const suppliersSnapshot = await getDocs(suppliersQuery);
        const loadedSuppliers: Supplier[] = [];
        suppliersSnapshot.forEach(doc => {
          const data = doc.data();
          loadedSuppliers.push({
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
        setSuppliers(loadedSuppliers);

        // Load supplier ledger
        const ledgerQuery = query(
          collection(firestore, 'businesses', bId, 'supplierLedger'),
          orderBy('date', 'desc')
        );
        const ledgerSnapshot = await getDocs(ledgerQuery);
        const loadedLedger: SupplierLedgerTransaction[] = [];
        ledgerSnapshot.forEach(doc => {
          const data = doc.data();
          loadedLedger.push({
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
        setSupplierLedger(loadedLedger);

        // Calculate summaries
        calculateSummary(loadedTransactions, loadedCustomers);
        calculatePayableSummary(loadedSuppliers, loadedLedger);
        calculateCreditTrackingSummary();
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

  function calculatePayableSummary(supps: Supplier[], ledger: SupplierLedgerTransaction[]) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalOutstanding = 0;
    let overdueAmount = 0;
    let dueThisWeek = 0;
    let dueThisMonth = 0;
    let activePayables = 0;
    let paidThisMonth = 0;
    let totalPaymentDays = 0;
    let paymentCount = 0;

    // Calculate from supplier balances
    supps.forEach(supplier => {
      if (supplier.currentBalance > 0) {
        totalOutstanding += supplier.currentBalance;
        activePayables++;

        // Calculate due date based on payment terms
        const daysUntilDue = getDaysUntilDue(supplier);
        if (daysUntilDue < 0) {
          overdueAmount += supplier.currentBalance;
        } else if (daysUntilDue <= 7) {
          dueThisWeek += supplier.currentBalance;
        } else if (daysUntilDue <= 30) {
          dueThisMonth += supplier.currentBalance;
        }
      }

      // Track payments made this month
      if (supplier.lastPaymentDate && supplier.lastPaymentDate >= monthStart) {
        paidThisMonth += supplier.totalPayments;
      }

      // Calculate average payment days
      if (supplier.averagePaymentDays > 0) {
        totalPaymentDays += supplier.averagePaymentDays;
        paymentCount++;
      }
    });

    setPayableSummary({
      totalOutstanding,
      overdueAmount,
      dueThisWeek,
      dueThisMonth,
      totalSuppliers: supps.length,
      activePayables,
      paidThisMonth,
      averagePaymentDays: paymentCount > 0 ? Math.round(totalPaymentDays / paymentCount) : 0,
    });
  }

  function getDaysUntilDue(supplier: Supplier): number {
    if (!supplier.lastPurchaseDate) return 30; // Default to 30 days if no purchase date
    
    const purchaseDate = supplier.lastPurchaseDate;
    let paymentDays = 30; // Default
    
    switch (supplier.paymentTerms) {
      case 'cash':
        return 0;
      case 'net_7':
        paymentDays = 7;
        break;
      case 'net_14':
        paymentDays = 14;
        break;
      case 'net_30':
        paymentDays = 30;
        break;
      case 'net_60':
        paymentDays = 60;
        break;
      case 'net_90':
        paymentDays = 90;
        break;
      case 'custom':
        paymentDays = supplier.customPaymentDays || 30;
        break;
    }
    
    const dueDate = new Date(purchaseDate.getTime() + paymentDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function calculateCreditTrackingSummary() {
    const netPosition = summary.totalOutstanding - payableSummary.totalOutstanding;
    const totalExposure = summary.totalOutstanding + payableSummary.totalOutstanding;
    
    setCreditTrackingSummary({
      receivables: summary,
      payables: payableSummary,
      netCreditPosition: netPosition,
      totalCreditExposure: totalExposure,
    });
  }

  async function handleAddCustomer() {
    if (!newCustomer.name || !businessId) return showToast('Customer name is required');
    if (isAddingCustomer) return; // Prevent duplicate submissions

    setIsAddingCustomer(true);

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
    } finally {
      setIsAddingCustomer(false);
    }
  }

  async function handleRecordPayment() {
    if (!selectedTransaction || !paymentForm.amount || !businessId) return showToast('Amount is required');
    if (isRecordingPayment) return; // Prevent duplicate submissions

    setIsRecordingPayment(true);

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
    } finally {
      setIsRecordingPayment(false);
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

  async function handleDeleteCustomer(customerId: string) {
    if (!businessId) return;

    // Check if customer has associated transactions
    const customerTransactions = transactions.filter(t => t.customerId === customerId);
    
    if (customerTransactions.length > 0) {
      const activeTransactions = customerTransactions.filter(t => t.status !== 'paid' && t.status !== 'written_off');
      
      if (activeTransactions.length > 0) {
        showToast(`Cannot delete customer with ${activeTransactions.length} active credit transactions`);
        return;
      }
    }

    const confirmed = window.confirm(
      customerTransactions.length > 0
        ? 'This customer has historical transactions but no active credits. Delete anyway?'
        : 'Are you sure you want to delete this customer?'
    );

    if (!confirmed) return;

    try {
      const { firestore } = initializeFirebase();
      await deleteDoc(doc(firestore, 'businesses', businessId, 'credit_customers', customerId));

      setCustomers(prev => prev.filter(c => c.id !== customerId));
      showToast('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      showToast('Failed to delete customer');
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

  function handleCustomerClick(customer: CreditCustomer) {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  }

  function getCustomerTransactions(customerId: string): CreditTransaction[] {
    return transactions.filter(t => t.customerId === customerId);
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

      {/* Summary Cards - Receivables */}
      <div className={styles.summarySection}>
        <h3 className={styles.summarySectionTitle}>Receivables (Money Customers Owe You)</h3>
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
      </div>

      {/* Summary Cards - Payables */}
      <div className={styles.summarySection}>
        <h3 className={styles.summarySectionTitle}>Payables (Money You Owe Suppliers)</h3>
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
            <div className={styles.summaryValue}>{formatMoney(payableSummary.totalOutstanding)}</div>
            <div className={styles.summaryLabel}>{payableSummary.activePayables} active payables</div>
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
            <div className={styles.summaryValue} style={{ color: 'var(--red)' }}>{formatMoney(payableSummary.overdueAmount)}</div>
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
            <div className={styles.summaryValue}>{formatMoney(payableSummary.dueThisWeek)}</div>
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
            <div className={styles.summaryValue} style={{ color: 'var(--green)' }}>{formatMoney(payableSummary.paidThisMonth)}</div>
            <div className={styles.summaryLabel}>Payments made</div>
          </Card>
        </div>
      </div>

      {/* Net Credit Position */}
      <Card>
        <CardHeader>
          <CardIcon bg="var(--blue-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2} width={20} height={20}>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </CardIcon>
          Net Credit Position
        </CardHeader>
        <div className={styles.netCreditSummary}>
          <div className={styles.netCreditItem}>
            <span className={styles.netCreditLabel}>Total Receivables:</span>
            <span className={styles.netCreditValue}>{formatMoney(creditTrackingSummary.receivables.totalOutstanding)}</span>
          </div>
          <div className={styles.netCreditItem}>
            <span className={styles.netCreditLabel}>Total Payables:</span>
            <span className={styles.netCreditValue} style={{ color: 'var(--red)' }}>{formatMoney(creditTrackingSummary.payables.totalOutstanding)}</span>
          </div>
          <div className={styles.netCreditDivider}></div>
          <div className={styles.netCreditItem}>
            <span className={styles.netCreditLabel}>Net Position:</span>
            <span className={`${styles.netCreditValue} ${styles.netCreditMain}`} style={{ 
              color: creditTrackingSummary.netCreditPosition >= 0 ? 'var(--green)' : 'var(--red)' 
            }}>
              {creditTrackingSummary.netCreditPosition >= 0 ? '+' : ''}{formatMoney(creditTrackingSummary.netCreditPosition)}
            </span>
          </div>
          <div className={styles.netCreditItem}>
            <span className={styles.netCreditLabel}>Total Credit Exposure:</span>
            <span className={styles.netCreditValue}>{formatMoney(creditTrackingSummary.totalCreditExposure)}</span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={[styles.tab, selectedTab === 'overview' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button 
          className={[styles.tab, selectedTab === 'receivables' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('receivables')}
        >
          Receivables ({summary.activeCredits})
        </button>
        <button 
          className={[styles.tab, selectedTab === 'payables' ? styles.tabActive : ''].join(' ')}
          onClick={() => setSelectedTab('payables')}
        >
          Payables ({payableSummary.activePayables})
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

      {selectedTab === 'receivables' && (
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
            </CardIcon>
            Customer Receivables
          </CardHeader>
          <div className={styles.transactionList}>
            {transactions.filter(t => t.status !== 'paid' && t.status !== 'written_off').length === 0 ? (
              <div className={styles.emptyState}>No outstanding receivables</div>
            ) : (
              transactions
                .filter(t => t.status !== 'paid' && t.status !== 'written_off')
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

      {selectedTab === 'payables' && (
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-lt)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={20} height={20}>
                <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
              </svg>
            </CardIcon>
            Supplier Payables
          </CardHeader>
          <div className={styles.transactionList}>
            {suppliers.filter(s => s.currentBalance > 0).length === 0 ? (
              <div className={styles.emptyState}>No outstanding payables</div>
            ) : (
              suppliers
                .filter(s => s.currentBalance > 0)
                .map(supplier => {
                  const daysUntilDue = getDaysUntilDue(supplier);
                  const isOverdue = daysUntilDue < 0;
                  return (
                    <div key={supplier.id} className={styles.transactionItem}>
                      <div className={styles.transactionMain}>
                        <div className={styles.transactionCustomer}>{supplier.businessName}</div>
                        <div className={styles.transactionAmount}>{formatMoney(supplier.currentBalance)}</div>
                      </div>
                      <div className={styles.transactionDetails}>
                        <span className={styles.transactionDate}>
                          {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `Due in ${daysUntilDue} days`}
                          {isOverdue && <span className={styles.overdueBadge}>OVERDUE</span>}
                        </span>
                        <span className={styles.transactionStatus} style={{ color: isOverdue ? 'var(--red)' : 'var(--amber)' }}>
                          {supplier.paymentTerms.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.transactionMeta}>
                        <span className={styles.transactionMetaLabel}>Credit Limit:</span>
                        <span className={styles.transactionMetaValue}>{formatMoney(supplier.creditLimit)}</span>
                        <span className={styles.transactionMetaLabel} style={{ marginLeft: '16px' }}>Utilization:</span>
                        <span className={styles.transactionMetaValue}>{supplier.creditUtilization.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })
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
                <div key={customer.id} className={styles.customerItem} onClick={() => handleCustomerClick(customer)} style={{ cursor: 'pointer' }}>
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
                    <span className={styles.transactionCount}>{getCustomerTransactions(customer.id).length} credits</span>
                  </div>
                  <Button 
                    size="xs" 
                    variant="ghost" 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                    style={{ color: 'var(--red)' }}
                  >
                    Delete
                  </Button>
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
              <Button variant="subtle" onClick={() => setShowAddCustomer(false)} disabled={isAddingCustomer}>Cancel</Button>
              <Button variant="primary" onClick={handleAddCustomer} disabled={isAddingCustomer}>
                {isAddingCustomer ? 'Adding...' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showCustomerDetail && selectedCustomer && (
        <div className={styles.modalOverlay} onClick={() => setShowCustomerDetail(false)}>
          <div className={styles.modal} style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Credit Summary - {selectedCustomer.name}</h3>
              <button className={styles.modalClose} onClick={() => setShowCustomerDetail(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.customerSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Outstanding:</span>
                  <span className={styles.summaryValue} style={{ color: 'var(--red)' }}>{formatMoney(selectedCustomer.currentBalance)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Credits:</span>
                  <span className={styles.summaryValue}>{getCustomerTransactions(selectedCustomer.id).length}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Phone:</span>
                    <span className={styles.summaryValue}>{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Email:</span>
                    <span className={styles.summaryValue}>{selectedCustomer.email}</span>
                  </div>
                )}
              </div>

              <div className={styles.creditHistory}>
                <h4>Credit History</h4>
                {getCustomerTransactions(selectedCustomer.id).length === 0 ? (
                  <div className={styles.emptyState}>No credit transactions found</div>
                ) : (
                  getCustomerTransactions(selectedCustomer.id).map(transaction => (
                    <div key={transaction.id} className={styles.creditDetailCard}>
                      <div className={styles.creditDetailHeader}>
                        <div className={styles.creditDetailMain}>
                          <span className={styles.creditDetailAmount}>{formatMoney(transaction.amount)}</span>
                          <span className={styles.creditDetailStatus} style={{ color: getStatusColor(transaction.status) }}>
                            {transaction.status.toUpperCase()}
                          </span>
                        </div>
                        <div className={styles.creditDetailDates}>
                          <span>Issued: {transaction.issuedDate.toLocaleDateString()}</span>
                          <span>Due: {transaction.dueDate.toLocaleDateString()}</span>
                          {isOverdue(transaction) && <span className={styles.overdueBadge}>OVERDUE</span>}
                        </div>
                      </div>
                      
                      <div className={styles.creditDetailProducts}>
                        <span className={styles.productsLabel}>Items Purchased:</span>
                        <div className={styles.productsList}>
                          {transaction.products && transaction.products.length > 0 ? (
                            transaction.products.map((product, idx) => (
                              <div key={idx} className={styles.productItem}>
                                {product.name} × {product.quantity} ({formatMoney(product.price)})
                              </div>
                            ))
                          ) : (
                            <span className={styles.noProducts}>No product details</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.creditDetailProgress}>
                        <div className={styles.progressInfo}>
                          <span>Paid: {formatMoney(transaction.paidAmount)}</span>
                          <span>Remaining: {formatMoney(transaction.remainingAmount)}</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ 
                              width: `${(transaction.paidAmount / transaction.amount) * 100}%`,
                              backgroundColor: getStatusColor(transaction.status)
                            }}
                          />
                        </div>
                      </div>

                      {transaction.paymentHistory && transaction.paymentHistory.length > 0 && (
                        <div className={styles.paymentHistorySection}>
                          <span className={styles.paymentHistoryLabel}>Payment History:</span>
                          <div className={styles.paymentHistoryList}>
                            {transaction.paymentHistory.map((payment, idx) => (
                              <div key={idx} className={styles.paymentHistoryItem}>
                                <div className={styles.paymentHistoryMain}>
                                  <span className={styles.paymentAmount}>{formatMoney(payment.amount)}</span>
                                  <span className={styles.paymentDate}>{payment.paymentDate.toLocaleDateString()}</span>
                                </div>
                                <div className={styles.paymentHistoryDetails}>
                                  <span>Method: {payment.paymentMethod}</span>
                                  {payment.reference && <span>Ref: {payment.reference}</span>}
                                  {payment.recordedByName && <span>By: {payment.recordedByName}</span>}
                                </div>
                                {payment.notes && <div className={styles.paymentNotes}>{payment.notes}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {transaction.status !== 'paid' && transaction.status !== 'written_off' && (
                        <div className={styles.creditDetailActions}>
                          <Button 
                            size="xs" 
                            variant="primary" 
                            onClick={() => { setSelectedTransaction(transaction); setShowRecordPayment(true); setShowCustomerDetail(false); }}
                          >
                            Record Payment
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => handleSendReminder(transaction)}>
                            Remind
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="subtle" onClick={() => setShowCustomerDetail(false)}>Close</Button>
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
              <Button variant="subtle" onClick={() => setShowRecordPayment(false)} disabled={isRecordingPayment}>Cancel</Button>
              <Button variant="primary" onClick={handleRecordPayment} disabled={isRecordingPayment}>
                {isRecordingPayment ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
