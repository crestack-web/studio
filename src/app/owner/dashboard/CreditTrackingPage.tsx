'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, addDoc as sbAddDoc } from '@/lib/supabase-client-data';
import { useBranch } from '@/context/BranchContext';
import { Users, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import styles from './CreditTrackingPage.module.css';

export function CreditTrackingPage() {
  const { showToast, user } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables' | 'customers' | 'suppliers'>('receivables');
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCreditLimit, setCustomerCreditLimit] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadData = async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [suppliersData, customersData, transactionsData] = await Promise.all([
        fetchDocs<any>(`businesses/${businessId}/suppliers`).catch(() => []),
        fetchDocs<any>(`businesses/${businessId}/credit_customers`).catch(() => []),
        fetchDocs<any>(`businesses/${businessId}/credit_transactions`, { limit: 200 }).catch(() => []),
      ]);

      setSuppliers(
        (suppliersData || [])
          .filter((s: any) => s.active !== false && String(s.status || 'active') !== 'inactive')
          .map((data: any) => ({
            id: data.id,
            name: data.supplierName || data.businessName || data.name || 'Supplier',
            phone: data.phone || '',
            currentBalance: Number(data.currentBalance ?? data.balance ?? 0) || 0,
            totalPurchases: Number(data.totalPurchases) || 0,
            totalPayments: Number(data.totalPayments) || 0,
            paymentTerms: data.paymentTerms || 'net_30',
            purchaseCount: Number(data.purchaseCount) || 0,
          }))
      );

      setCustomers(
        (customersData || [])
          .filter((c: any) => c.isActive !== false && String(c.status || 'active') !== 'inactive')
          .map((data: any) => ({
            id: data.id,
            name: data.name || data.customerName || 'Customer',
            phone: data.phone,
            email: data.email,
            currentBalance: Number(data.currentBalance ?? data.balance ?? 0) || 0,
            totalCreditLimit: Number(data.totalCreditLimit ?? data.creditLimit ?? 0) || 0,
          }))
      );

      const now = new Date();
      const txs = (transactionsData || []).map((data: any) => {
        const remaining = Number(data.remainingAmount ?? data.amount ?? 0) || 0;
        const paid = Number(data.paidAmount) || 0;
        const due = data.dueDate ? new Date(data.dueDate) : null;
        let status = data.status || 'pending';
        if (remaining <= 0) status = 'paid';
        else if (due && due < now && status !== 'paid') status = 'overdue';
        return {
          id: data.id,
          customerId: data.customerId || '',
          customerName: data.customerName || 'Customer',
          amount: Number(data.amount || data.originalAmount) || 0,
          paidAmount: paid,
          remainingAmount: remaining,
          status,
          dueDate: due,
          issuedDate: data.issuedDate ? new Date(data.issuedDate) : data.createdAt ? new Date(data.createdAt) : new Date(),
        };
      });
      setTransactions(txs);
    } catch (e) {
      console.error(e);
      showToast('Failed to load credit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const totalReceivable = useMemo(
    () => transactions.filter((t) => t.status !== 'paid').reduce((s, t) => s + (t.remainingAmount || 0), 0),
    [transactions]
  );
  const totalPayable = useMemo(
    () => suppliers.reduce((s, x) => s + (x.currentBalance || 0), 0),
    [suppliers]
  );
  const overdueAmount = useMemo(
    () => transactions.filter((t) => t.status === 'overdue').reduce((s, t) => s + (t.remainingAmount || 0), 0),
    [transactions]
  );
  const net = totalReceivable - totalPayable;
  const q = searchQuery.trim().toLowerCase();

  const filteredTx = transactions.filter((t) => {
    if (!q) return true;
    return t.customerName.toLowerCase().includes(q) || String(t.amount).includes(q);
  });
  const filteredCustomers = customers.filter((c) => {
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.phone || '').includes(q);
  });
  const filteredSuppliers = suppliers.filter((s) => {
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || (s.phone || '').includes(q);
  });

  const handleAddCustomer = async () => {
    if (!businessId || !customerName.trim()) {
      showToast('Enter customer name');
      return;
    }
    setIsAdding(true);
    try {
      await sbAddDoc(`businesses/${businessId}/credit_customers`, {
        name: customerName.trim(),
        phone: customerPhone.trim() || '',
        email: customerEmail.trim() || '',
        totalCreditLimit: parseFloat(customerCreditLimit) || 0,
        currentBalance: 0,
        balance: 0,
        isActive: true,
        status: 'active',
        businessId,
        createdAt: new Date().toISOString(),
        createdBy: user?.id || 'system',
      });
      showToast('Customer added');
      setShowAddModal(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerCreditLimit('');
      loadData();
    } catch (e) {
      console.error(e);
      showToast('Failed to add customer');
    } finally {
      setIsAdding(false);
    }
  };

  if (!businessId && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <AlertCircle size={40} />
          <h3>No business selected</h3>
          <p>Finish onboarding or refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Credit tracking</h1>
          <p className={styles.subtitle}>Customer credit and supplier credit in one place</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className={styles.cancelButton} onClick={() => loadData()} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button type="button" className={styles.primaryButton} onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add customer
          </button>
        </div>
      </div>

      <div className={styles.netPositionRow}>
        <div className={styles.netPositionCard}>
          <span className={styles.netPositionLabel}>Customers owe you</span>
          <span className={styles.netPositionValue} style={{ color: '#16a34a' }}>{formatMoney(totalReceivable)}</span>
        </div>
        <div className={styles.netPositionCard}>
          <span className={styles.netPositionLabel}>You owe suppliers</span>
          <span className={styles.netPositionValue} style={{ color: '#dc2626' }}>{formatMoney(totalPayable)}</span>
        </div>
        <div className={styles.netPositionCard}>
          <span className={styles.netPositionLabel}>Net position</span>
          <span className={styles.netPositionValue}>
            {formatMoney(Math.abs(net))}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginLeft: 6 }}>
              {net >= 0 ? 'net receivable' : 'net payable'}
            </span>
          </span>
        </div>
        <div className={styles.netPositionCard}>
          <span className={styles.netPositionLabel}>Overdue</span>
          <span className={styles.netPositionValue} style={{ color: '#d97706' }}>{formatMoney(overdueAmount)}</span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className={styles.input}
          placeholder="Search name, phone, amount…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div className={styles.tabNavigation}>
        {(['receivables', 'payables', 'customers', 'suppliers'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading credit data…</p>
        </div>
      ) : (
        <div className={styles.contentArea}>
          {activeTab === 'receivables' && (
            <div className={styles.transactionsList}>
              {filteredTx.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>No credit sales yet</h3>
                  <p>Customer credit invoices will show here</p>
                </div>
              ) : (
                filteredTx.map((tx) => (
                  <div key={tx.id} className={styles.transactionCard}>
                    <div className={styles.transactionHeader}>
                      <div>
                        <div className={styles.customerName}>{tx.customerName}</div>
                        <div className={styles.transactionDate}>
                          {tx.issuedDate ? new Date(tx.issuedDate).toLocaleDateString() : ''}
                          {tx.dueDate ? ` · due ${tx.dueDate.toLocaleDateString()}` : ''}
                        </div>
                      </div>
                      <span className={`${styles.statusBadge} ${
                        tx.status === 'overdue' ? styles.statusOverdue :
                        tx.status === 'paid' ? styles.statusPaid :
                        tx.status === 'partial' ? styles.statusPartial : styles.statusPending
                      }`}>{tx.status}</span>
                    </div>
                    <div className={styles.transactionAmounts}>
                      <div className={styles.amountRow}>
                        <span className={styles.amountLabel}>Original</span>
                        <span className={styles.amountValue}>{formatMoney(tx.amount)}</span>
                      </div>
                      <div className={styles.amountRow}>
                        <span className={styles.amountLabel}>Paid</span>
                        <span className={`${styles.amountValue} ${styles.amountPaid}`}>{formatMoney(tx.paidAmount)}</span>
                      </div>
                      <div className={`${styles.amountRow} ${styles.amountRowHighlight}`}>
                        <span className={styles.amountLabel}>Remaining</span>
                        <span className={`${styles.amountValue} ${styles.amountRemaining}`}>{formatMoney(tx.remainingAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'payables' && (
            <div className={styles.transactionsList}>
              {filteredSuppliers.filter((s) => s.currentBalance > 0).length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>No supplier balances</h3>
                  <p>Balances appear when purchases are tied to suppliers</p>
                </div>
              ) : (
                filteredSuppliers.filter((s) => s.currentBalance > 0).map((s) => (
                  <div key={s.id} className={styles.supplierCreditCard}>
                    <div className={styles.supplierCreditHeader}>
                      <div>
                        <div className={styles.supplierCreditName}>{s.name}</div>
                        <p className={styles.supplierCreditMeta}>{s.paymentTerms} · {s.purchaseCount} purchases</p>
                      </div>
                      <span className={styles.supplierCreditBadge}>{formatMoney(s.currentBalance)}</span>
                    </div>
                    <div className={styles.supplierCreditStats}>
                      <div className={styles.supplierCreditStat}>
                        <span className={styles.supplierCreditLabel}>Purchases</span>
                        <span className={styles.supplierCreditValue}>{formatMoney(s.totalPurchases)}</span>
                      </div>
                      <div className={styles.supplierCreditStat}>
                        <span className={styles.supplierCreditLabel}>Payments</span>
                        <span className={styles.supplierCreditValue}>{formatMoney(s.totalPayments)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'customers' && (
            <div className={styles.customersList}>
              {filteredCustomers.length === 0 ? (
                <div className={styles.emptyState}>
                  <Users size={40} style={{ opacity: 0.4 }} />
                  <h3>No credit customers</h3>
                  <p>Add customers who buy on credit</p>
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div key={c.id} className={styles.customerCard}>
                    <div className={styles.customerInfo}>
                      <div className={styles.customerName}>{c.name}</div>
                      {c.phone && <div className={styles.customerContact}>{c.phone}</div>}
                      {c.email && <div className={styles.customerContact}>{c.email}</div>}
                    </div>
                    <div className={styles.customerBalance}>
                      <div className={styles.balanceLabel}>Outstanding</div>
                      <div className={styles.balanceValue}>{formatMoney(c.currentBalance)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className={styles.suppliersList}>
              {filteredSuppliers.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>No suppliers</h3>
                  <p>Add suppliers from the Suppliers page</p>
                </div>
              ) : (
                filteredSuppliers.map((s) => (
                  <div key={s.id} className={styles.supplierCreditCard}>
                    <div className={styles.supplierCreditHeader}>
                      <div>
                        <div className={styles.supplierCreditName}>{s.name}</div>
                        <p className={styles.supplierCreditMeta}>{s.phone || 'No phone'}</p>
                      </div>
                      <span className={styles.supplierCreditBadge}>{formatMoney(s.currentBalance)} owing</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => !isAdding && setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add credit customer</h3>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input className={styles.input} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone</label>
                <input className={styles.input} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Credit limit</label>
                <input className={styles.input} type="number" value={customerCreditLimit} onChange={(e) => setCustomerCreditLimit(e.target.value)} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowAddModal(false)} disabled={isAdding}>Cancel</button>
              <button type="button" className={styles.submitButton} onClick={handleAddCustomer} disabled={isAdding}>
                {isAdding ? 'Saving…' : 'Add customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditTrackingPage;
