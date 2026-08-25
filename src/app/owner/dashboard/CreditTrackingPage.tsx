'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, fetchDoc, addDoc as sbAddDoc, updateDoc as sbUpdateDoc, toISOString } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { useBranch } from '@/context/BranchContext';
import { UserCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, Plus, ArrowUpRight, ArrowDownRight, Users, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { sendCustomerPaymentOverdueEmail } from '@/services/email/credit-emails';
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

interface Supplier {
  id: string;
  businessId: string;
  supplierName: string;
  businessName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  paymentTerms: string;
  customPaymentDays?: number;
  creditLimit: number;
  openingBalance: number;
  currentBalance: number;
  category: string;
  status: string;
  taxId?: string;
  bankAccount?: any;
  contactPerson?: string;
  createdAt: Date;
  updatedAt: Date;
  lastPurchaseDate?: Date;
  lastPaymentDate?: Date;
  totalPurchases: number;
  totalPayments: number;
  purchaseCount: number;
  paymentCount: number;
  averagePaymentDays: number;
  creditUtilization: number;
}

export function CreditTrackingPage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currencyCode } = useCurrency();
  const { businessId } = useBranch();
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
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Form states for adding customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCreditLimit, setCustomerCreditLimit] = useState('');

  useEffect(() => {
    loadData();
  }, [businessId, dateFilter]);

  const loadData = async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load suppliers for the suppliers tab
      const suppliersData = await fetchDocs<any>(`businesses/${businessId}/suppliers`, {
        filters: [{ field: 'status', op: '=', value: 'active' }],
      });
      const suppliersList: Supplier[] = suppliersData.map((data: any) => ({
        id: data.id,
        businessId: data.businessId || businessId,
        supplierName: data.supplierName || data.businessName || 'Unnamed Supplier',
        businessName: data.businessName || data.supplierName || 'Unnamed Supplier',
        phone: data.phone || '',
        email: data.email,
        address: data.address,
        notes: data.notes,
        paymentTerms: data.paymentTerms || 'net_30',
        customPaymentDays: data.customPaymentDays,
        creditLimit: data.creditLimit || 0,
        openingBalance: data.openingBalance || 0,
        currentBalance: data.currentBalance || 0,
        category: data.category || 'general',
        status: data.status || 'active',
        taxId: data.taxId,
        bankAccount: data.bankAccount,
        contactPerson: data.contactPerson,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        lastPurchaseDate: data.lastPurchaseDate ? new Date(data.lastPurchaseDate) : undefined,
        lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : undefined,
        totalPurchases: data.totalPurchases || 0,
        totalPayments: data.totalPayments || 0,
        purchaseCount: data.purchaseCount || 0,
        paymentCount: data.paymentCount || 0,
        averagePaymentDays: data.averagePaymentDays || 0,
        creditUtilization: data.creditUtilization || 0,
      }));
      
      setSuppliers(suppliersList);

      // Load credit customers
      const customersData = await fetchDocs<any>(`businesses/${businessId}/credit_customers`, {
        filters: [{ field: 'isActive', op: '=', value: true }],
      });
      const customersList: CreditCustomer[] = customersData.map((data: any) => ({
        id: data.id,
        name: data.name || data.customerName || '',
        phone: data.phone,
        email: data.email,
        address: data.address,
        businessType: data.businessType || 'individual',
        notes: data.notes,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        totalCreditLimit: data.totalCreditLimit || 0,
        currentBalance: data.currentBalance || 0,
        isRegularCustomer: data.isRegularCustomer || false,
      }));
      
      setCustomers(customersList);

      // Load credit transactions with date filter
      const transactionsData = await fetchDocs<any>(`businesses/${businessId}/credit_transactions`, {
        orderBy: { field: 'issuedDate', ascending: false },
        limit: 100,
      });
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

      for (const data of transactionsData) {
        const transaction: CreditTransaction = {
          id: data.id,
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          saleId: data.saleId || '',
          amount: data.amount || 0,
          originalAmount: data.originalAmount || data.amount || 0,
          status: data.status || 'pending',
          dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
          issuedDate: data.issuedDate ? new Date(data.issuedDate) : new Date(),
          paidAmount: data.paidAmount || 0,
          remainingAmount: data.remainingAmount || data.amount || 0,
          paymentHistory: data.paymentHistory || [],
          notes: data.notes,
          reminderSent: data.reminderSent || false,
          reminderCount: data.reminderCount || 0,
          lastReminderDate: data.lastReminderDate ? new Date(data.lastReminderDate) : undefined,
          writtenOffAt: data.writtenOffAt ? new Date(data.writtenOffAt) : undefined,
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
      }

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
    if (!businessId || !selectedTransaction) return;

    const finalPaymentAmount = paymentAmount || selectedTransaction.remainingAmount;
    const finalPaymentMethod = paymentMethod || 'cash';

    try {
      setIsRecordingPayment(true);
      const transactionData = await fetchDoc<any>(
        `businesses/${businessId}/credit_transactions`,
        selectedTransaction.id
      );
      
      if (!transactionData) {
        showToast('Transaction not found');
        setIsRecordingPayment(false);
        return;
      }

      const currentPaidAmount = transactionData.paidAmount || 0;
      const currentRemainingAmount = transactionData.remainingAmount || selectedTransaction.remainingAmount;
      const newPaidAmount = currentPaidAmount + finalPaymentAmount;
      const newRemainingAmount = currentRemainingAmount - finalPaymentAmount;
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

      await sbUpdateDoc(`businesses/${businessId}/credit_transactions`, selectedTransaction.id, {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, newRemainingAmount),
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date().toISOString() : null,
      });

      // Record payment in history
      await sbAddDoc(`businesses/${businessId}/creditPayments`, {
        transactionId: selectedTransaction.id,
        customerId: selectedTransaction.customerId,
        amount: finalPaymentAmount,
        paymentMethod: finalPaymentMethod,
        paymentDate: new Date().toISOString(),
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

  const handleSendReminder = async (transaction: CreditTransaction) => {
    if (!businessId) return;

    try {
      setIsSendingReminder(true);

      // Get customer details
      const customerData = await fetchDoc<any>(
        `businesses/${businessId}/credit_customers`,
        transaction.customerId
      );
      
      if (!customerData) {
        showToast('Customer not found');
        setIsSendingReminder(false);
        return;
      }

      const customerEmail = customerData.email;
      const customerName = customerData.name;

      // Get business details
      const businessData = await fetchDoc<any>('businesses', businessId);
      const businessName = businessData?.businessName || 'Your Business';
      const ownerEmail = businessData?.email;

      if (customerEmail && ownerEmail) {
        // Calculate days overdue
        const daysOverdue = Math.floor((new Date().getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send overdue payment email
        await sendCustomerPaymentOverdueEmail({
          email: customerEmail,
          customerName,
          businessName,
          amount: transaction.remainingAmount,
          dueDate: transaction.dueDate.toLocaleDateString(),
          daysOverdue,
          currency: currencyCode,
        });

        // Update transaction reminder status
        await sbUpdateDoc(`businesses/${businessId}/credit_transactions`, transaction.id, {
          reminderSent: true,
          reminderCount: (transaction.reminderCount || 0) + 1,
          lastReminderDate: new Date().toISOString(),
        });

        showToast('Reminder email sent successfully');
        loadData();
      } else {
        showToast('Customer email not available');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      showToast('Failed to send reminder');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!businessId || !customerName.trim()) {
      showToast('Please enter customer name');
      return;
    }

    try {
      setIsAddingCustomer(true);
      
      await sbAddDoc(`businesses/${businessId}/credit_customers`, {
        name: customerName.trim(),
        phone: customerPhone.trim() || '',
        email: customerEmail.trim() || '',
        totalCreditLimit: parseFloat(customerCreditLimit) || 0,
        currentBalance: 0,
        isRegularCustomer: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: user?.id || 'system',
        createdByName: user?.name || 'System',
        businessId: businessId,
      });
      
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleDownloadStatement = async () => {
    if (!businessId || isDownloading) return;

    try {
      setIsDownloading(true);

      // Get business info
      const businessData = await fetchDoc<any>('businesses', businessId);
      const businessName = businessData?.businessName || 'Your Business';
      const businessAddress = businessData?.address || businessData?.businessAddress || '';
      const businessPhone = businessData?.phone || businessData?.businessPhone || '';
      const businessEmail = businessData?.email || '';

      // Generate PDF-ready HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Credit Statement - ${businessName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .header .subtitle {
              color: #666;
              font-size: 14px;
            }
            .business-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .business-info p {
              margin: 5px 0;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              background: #2563eb;
              color: white;
              padding: 10px 15px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
              border-radius: 4px 4px 0 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border: 1px solid #ddd;
            }
            th {
              background: #f1f5f9;
              color: #334155;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            tr:hover {
              background: #f8f9fa;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-card {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              color: #1e293b;
            }
            .status-paid { color: #16a34a; }
            .status-overdue { color: #dc2626; }
            .status-pending { color: #f59e0b; }
            .status-partial { color: #3b82f6; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #64748b;
              font-size: 12px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            .transaction-details {
              margin-top: 15px;
              padding: 15px;
              background: #f8f9fa;
              border-left: 3px solid #2563eb;
            }
            .transaction-details h4 {
              color: #1e293b;
              margin-bottom: 10px;
            }
            .products-list {
              list-style: none;
              padding-left: 0;
            }
            .products-list li {
              padding: 5px 0;
              border-bottom: 1px dashed #ddd;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <h1>CREDIT TRACKING STATEMENT</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
          </div>

          <!-- Business Information -->
          <div class="business-info">
            <p><strong>Business:</strong> ${businessName}</p>
            ${businessAddress ? `<p><strong>Address:</strong> ${businessAddress}</p>` : ''}
            ${businessPhone ? `<p><strong>Phone:</strong> ${businessPhone}</p>` : ''}
            ${businessEmail ? `<p><strong>Email:</strong> ${businessEmail}</p>` : ''}
            <p><strong>Report Period:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <!-- Summary Section -->
          <div class="section">
            <div class="section-title">EXECUTIVE SUMMARY</div>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">Total Outstanding</div>
                <div class="summary-value">${formatMoney(summary.totalOutstanding)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Overdue Amount</div>
                <div class="summary-value status-overdue">${formatMoney(summary.overdueAmount)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Due This Week</div>
                <div class="summary-value status-pending">${formatMoney(summary.dueThisWeek)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Due This Month</div>
                <div class="summary-value">${formatMoney(summary.dueThisMonth)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Paid This Month</div>
                <div class="summary-value status-paid">${formatMoney(summary.paidThisMonth)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Customers</div>
                <div class="summary-value">${summary.totalCustomers}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Active Credits</div>
                <div class="summary-value">${summary.activeCredits}</div>
              </div>
            </div>
          </div>

          <!-- Receivables Section -->
          <div class="section">
            <div class="section-title">CREDIT TRANSACTIONS (RECEIVABLES)</div>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Sale ID</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Original</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map(transaction => `
                  <tr>
                    <td><strong>${transaction.customerName}</strong></td>
                    <td>${transaction.saleId}</td>
                    <td>${transaction.issuedDate.toLocaleDateString()}</td>
                    <td>${transaction.dueDate.toLocaleDateString()}</td>
                    <td>${formatMoney(transaction.originalAmount)}</td>
                    <td class="status-paid">${formatMoney(transaction.paidAmount)}</td>
                    <td><strong>${formatMoney(transaction.remainingAmount)}</strong></td>
                    <td><span class="status-${transaction.status}">${transaction.status.toUpperCase()}</span></td>
                    <td>${transaction.recordedByName}</td>
                  </tr>
                  ${transaction.products && transaction.products.length > 0 ? `
                    <tr>
                      <td colspan="9">
                        <div class="transaction-details">
                          <h4>Products:</h4>
                          <ul class="products-list">
                            ${transaction.products.map((product, idx) => `
                              <li>${idx + 1}. ${product.name} - Qty: ${product.quantity} × ${formatMoney(product.price)} = ${formatMoney(product.quantity * product.price)}</li>
                            `).join('')}
                          </ul>
                          ${transaction.notes ? `<p><strong>Notes:</strong> ${transaction.notes}</p>` : ''}
                        </div>
                      </td>
                    </tr>
                  ` : ''}
                `).join('')}
              </tbody>
            </table>
            ${transactions.length === 0 ? '<p style="text-align: center; padding: 20px; color: #666;">No credit transactions found</p>' : ''}
          </div>

          <!-- Customers Section -->
          <div class="section">
            <div class="section-title">CREDIT CUSTOMERS</div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Current Balance</th>
                  <th>Credit Limit</th>
                  <th>Customer Type</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(customer => `
                  <tr>
                    <td><strong>${customer.name}</strong></td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${customer.email || 'N/A'}</td>
                    <td><strong>${formatMoney(customer.currentBalance)}</strong></td>
                    <td>${formatMoney(customer.totalCreditLimit || 0)}</td>
                    <td>${customer.businessType === 'business' ? 'Business' : 'Individual'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${customers.length === 0 ? '<p style="text-align: center; padding: 20px; color: #666;">No credit customers found</p>' : ''}
          </div>

          <!-- Payables Section -->
          <div class="section">
            <div class="section-title">PAYABLES (SUPPLIERS)</div>
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Total Purchases</th>
                  <th>Total Payments</td>
                  <th>Current Balance</th>
                  <th>Payment Terms</th>
                  <th>Last Purchase</th>
                  <th>Last Payment</th>
                </tr>
              </thead>
              <tbody>
                ${suppliers.map(supplier => `
                  <tr>
                    <td><strong>${supplier.businessName || supplier.supplierName}</strong></td>
                    <td>${supplier.category}</td>
                    <td>${formatMoney(supplier.totalPurchases)}</td>
                    <td>${formatMoney(supplier.totalPayments)}</td>
                    <td><strong>${formatMoney(supplier.currentBalance)}</strong></td>
                    <td>${supplier.paymentTerms}${supplier.customPaymentDays ? ` (${supplier.customPaymentDays} days)` : ''}</td>
                    <td>${supplier.lastPurchaseDate ? supplier.lastPurchaseDate.toLocaleDateString() : 'N/A'}</td>
                    <td>${supplier.lastPaymentDate ? supplier.lastPaymentDate.toLocaleDateString() : 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${suppliers.length === 0 ? '<p style="text-align: center; padding: 20px; color: #666;">No suppliers found</p>' : ''}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>This statement was generated automatically by Busmo</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;

      // Open print window for PDF generation
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
        showToast('PDF download started - use print dialog to save as PDF');
      }
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
         <button
           className={`${styles.tabButton} ${activeTab === 'suppliers' ? styles.tabButtonActive : ''}`}
           onClick={() => setActiveTab('suppliers')}
         >
           <TrendingUp size={18} />
           Suppliers
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
          <div className={styles.payablesList}>
            {suppliers.length === 0 ? (
              <div className={styles.emptyState}>
                <EyeOff size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3>No Payables</h3>
                <p>Payables will appear here when you have outstanding supplier invoices</p>
              </div>
            ) : (
              <>
                {/* Summary Stats for Payables */}
                <div className={styles.payablesSummary}>
                  <div className={styles.payableStatCard}>
                    <div className={styles.payableStatLabel}>Total Outstanding</div>
                    <div className={styles.payableStatValue}>
                      {formatMoney(suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0))}
                    </div>
                  </div>
                  <div className={styles.payableStatCard}>
                    <div className={styles.payableStatLabel}>Total Purchases</div>
                    <div className={styles.payableStatValue}>
                      {formatMoney(suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0))}
                    </div>
                  </div>
                  <div className={styles.payableStatCard}>
                    <div className={styles.payableStatLabel}>Total Payments</div>
                    <div className={styles.payableStatValue}>
                      {formatMoney(suppliers.reduce((sum, s) => sum + (s.totalPayments || 0), 0))}
                    </div>
                  </div>
                </div>

                {/* Supplier Payables List */}
                <div className={styles.supplierPayablesList}>
                  {suppliers
                    .filter(supplier => (supplier.currentBalance || 0) > 0)
                    .map(supplier => (
                      <div key={supplier.id} className={styles.supplierPayableCard}>
                        <div className={styles.supplierPayableHeader}>
                          <div>
                            <div className={styles.supplierPayableName}>
                              {supplier.businessName || supplier.supplierName}
                            </div>
                            <div className={styles.supplierPayableMeta}>
                              {supplier.purchaseCount} purchases • avg {supplier.averagePaymentDays || 0} days
                            </div>
                          </div>
                          <div className={styles.supplierPayableAmount}>
                            {formatMoney(supplier.currentBalance)}
                          </div>
                        </div>
                        
                        <div className={styles.supplierPayableDetails}>
                          <div className={styles.supplierPayableDetail}>
                            <span className={styles.supplierPayableLabel}>Payment Terms:</span>
                            <span>{supplier.paymentTerms}{supplier.customPaymentDays ? ` (${supplier.customPaymentDays} days)` : ''}</span>
                          </div>
                          <div className={styles.supplierPayableDetail}>
                            <span className={styles.supplierPayableLabel}>Last Purchase:</span>
                            <span>{supplier.lastPurchaseDate ? formatDate(supplier.lastPurchaseDate) : 'Never'}</span>
                          </div>
                          <div className={styles.supplierPayableDetail}>
                            <span className={styles.supplierPayableLabel}>Last Payment:</span>
                            <span>{supplier.lastPaymentDate ? formatDate(supplier.lastPaymentDate) : 'Never'}</span>
                          </div>
                        </div>

                        <div className={styles.supplierPayableActions}>
                          <button
                            className={styles.paySupplierButton}
                            onClick={() => {
                              // Navigate to Cashflow page to record payment
                              window.location.href = '/owner/dashboard/cashflow';
                            }}
                          >
                            <DollarSign size={16} />
                            Record Payment
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {suppliers.filter(supplier => (supplier.currentBalance || 0) > 0).length === 0 && (
                  <div className={styles.emptyState}>
                    <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <h3>All Caught Up!</h3>
                    <p>No outstanding supplier payments</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className={styles.suppliersList}>
            {suppliers.length === 0 ? (
              <div className={styles.emptyState}>
                <TrendingUp size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3>No Suppliers Yet</h3>
                <p>Add suppliers when receiving stock or create them in the Suppliers page</p>
              </div>
            ) : (
              suppliers.map(supplier => (
                <div key={supplier.id} className={styles.supplierCreditCard}>
                  <div className={styles.supplierCreditHeader}>
                    <div>
                      <div className={styles.supplierCreditName}>{supplier.businessName || supplier.supplierName}</div>
                      <div className={styles.supplierCreditMeta}>
                        {supplier.purchaseCount} purchases • Last: {supplier.lastPurchaseDate ? formatDate(supplier.lastPurchaseDate) : 'Never'}
                      </div>
                    </div>
                    {(supplier.currentBalance || 0) > 0 && (
                      <div className={styles.supplierCreditBadge}>
                        Owing: {formatMoney(supplier.currentBalance)}
                      </div>
                    )}
                  </div>
                  <div className={styles.supplierCreditStats}>
                    <div className={styles.supplierCreditStat}>
                      <span className={styles.supplierCreditLabel}>Total Purchases</span>
                      <span className={styles.supplierCreditValue}>{formatMoney(supplier.totalPurchases)}</span>
                    </div>
                    <div className={styles.supplierCreditStat}>
                      <span className={styles.supplierCreditLabel}>Current Balance</span>
                      <span className={`${styles.supplierCreditValue} ${supplier.currentBalance > 0 ? styles.supplierCreditOwing : ''}`}>
                        {formatMoney(supplier.currentBalance)}
                      </span>
                    </div>
                    <div className={styles.supplierCreditStat}>
                      <span className={styles.supplierCreditLabel}>Average Payment</span>
                      <span className={styles.supplierCreditValue}>{supplier.averagePaymentDays || 0} days</span>
                    </div>
                  </div>
                </div>
              ))
            )}
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
