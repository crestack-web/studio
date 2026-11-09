'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, addDoc as sbAddDoc, updateDoc as sbUpdateDoc } from '@/lib/supabase-client-data';
import { useBranch } from '@/context/BranchContext';
import { Users, RefreshCw, Plus, AlertCircle, Wallet } from 'lucide-react';
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
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer' | 'pos'>('cash');
  const [payAccountId, setPayAccountId] = useState('');
  const [isPaying, setIsPaying] = useState(false);
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
      const [suppliersData, customersData, transactionsData, creditRows, accountsRaw] = await Promise.all([
        fetchDocs<any>(`businesses/${businessId}/suppliers`).catch(() => []),
        fetchDocs<any>(`businesses/${businessId}/credit_customers`).catch(() => []),
        fetchDocs<any>(`businesses/${businessId}/credit_transactions`, { limit: 200 }).catch(() => []),
        fetchDocs<any>(`businesses/${businessId}/supplierCredit`, { limit: 300 }).catch(() => []),
        fetchDocs<any>(`businesses/${businessId}/bankAccounts`).catch(() => []),
      ]);

      const owed = new Map<string, number>();
      for (const c of creditRows as any[]) {
        const sid = String(c.supplierId || c.supplier_id || '');
        if (!sid) continue;
        const bal =
          Number(c.balance ?? Math.max(0, Number(c.amount || 0) - Number(c.paid || 0))) || 0;
        if (bal > 0 && String(c.status || 'open').toLowerCase() !== 'paid') {
          owed.set(sid, (owed.get(sid) || 0) + bal);
        }
      }

      setSuppliers(
        (suppliersData || [])
          .filter((s: any) => s.active !== false && String(s.status || 'active') !== 'inactive')
          .map((data: any) => {
            const creditOwed = owed.get(String(data.id)) || 0;
            const meta = Number(data.currentBalance ?? data.balance ?? 0) || 0;
            return {
              id: data.id,
              name: data.supplierName || data.businessName || data.name || 'Supplier',
              phone: data.phone || '',
              currentBalance: creditOwed > 0 ? creditOwed : meta,
              totalPurchases: Number(data.totalPurchases) || 0,
              totalPayments: Number(data.totalPayments) || 0,
              paymentTerms: data.paymentTerms || 'net_30',
              purchaseCount: Number(data.purchaseCount) || 0,
              paymentCount: Number(data.paymentCount) || 0,
              creditLimit: Number(data.creditLimit) || 0,
            };
          })
      );

      setBankAccounts(
        (accountsRaw || [])
          .filter((a: any) => a.isActive !== false)
          .map((a: any) => ({
            id: a.id,
            accountName: a.accountName || a.name || 'Account',
            bankName: a.bankName || '',
            currentBalance: Number(a.currentBalance) || 0,
            isDefault: Boolean(a.isDefault || a.isPrimary),
            isPosDefault: Boolean(a.isPosDefault),
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

  const openPaySupplier = (supplier: any) => {
    setPayingSupplier(supplier);
    setPayAmount(supplier.currentBalance > 0 ? String(supplier.currentBalance) : '');
    setPayMethod('cash');
    const cashAcc =
      bankAccounts.find((a) => /cash|till|float|drawer/i.test(`${a.accountName} ${a.bankName}`)) ||
      bankAccounts.find((a) => a.isDefault) ||
      bankAccounts[0];
    setPayAccountId(cashAcc?.id || '');
    setShowPayModal(true);
  };

  const handlePaySupplier = async () => {
    if (!businessId || !payingSupplier) return;
    let paymentAmount = parseFloat(payAmount) || 0;
    if (paymentAmount <= 0) {
      showToast('Enter a payment amount');
      return;
    }
    const outstanding = Number(payingSupplier.currentBalance) || 0;
    if (paymentAmount > outstanding + 0.001) {
      showToast(`Capping to outstanding ${formatMoney(outstanding)}`);
      paymentAmount = outstanding;
    }
    if (paymentAmount <= 0) {
      showToast('Nothing outstanding for this supplier');
      return;
    }

    let accountId = payAccountId;
    if (!accountId) {
      const cashAcc =
        bankAccounts.find((a) => /cash|till|float|drawer/i.test(`${a.accountName} ${a.bankName}`)) ||
        bankAccounts.find((a) => a.isDefault) ||
        bankAccounts[0];
      accountId = cashAcc?.id;
    }
    if (!accountId) {
      showToast('Add a bank/cash account first so the payment can update cash balance');
      return;
    }

    setIsPaying(true);
    try {
      const accounts = await fetchDocs(`businesses/${businessId}/bankAccounts`, {
        filters: [{ field: 'id', op: '=', value: accountId }],
        limit: 1,
      });
      if (!accounts[0]) throw new Error('Bank account not found');
      const bankBal = Number((accounts[0] as any).currentBalance) || 0;
      if (bankBal < paymentAmount) throw new Error('Insufficient bank/cash balance');

      const creditRows = await fetchDocs(`businesses/${businessId}/supplierCredit`, { limit: 300 }).catch(
        () => []
      );
      const openCredits = (creditRows as any[]).filter(
        (c) =>
          String(c.supplierId || c.supplier_id) === String(payingSupplier.id) &&
          Number(c.balance ?? Math.max(0, Number(c.amount || 0) - Number(c.paid || 0))) > 0 &&
          String(c.status || 'open').toLowerCase() !== 'paid'
      );

      let remaining = paymentAmount;
      for (const credit of openCredits) {
        if (remaining <= 0) break;
        const bal =
          Number(credit.balance ?? Math.max(0, Number(credit.amount || 0) - Number(credit.paid || 0))) ||
          0;
        if (bal <= 0) continue;
        const apply = Math.min(remaining, bal);
        const newPaid = (Number(credit.paid) || 0) + apply;
        const newBal = Math.max(0, bal - apply);
        await sbUpdateDoc(`businesses/${businessId}/supplierCredit`, credit.id, {
          paid: newPaid,
          balance: newBal,
          status: newBal <= 0 ? 'paid' : 'open',
        });
        remaining -= apply;
      }

      const purchasesForSupplier = (
        await fetchDocs(`businesses/${businessId}/purchases`, {
          orderBy: { field: 'created_at', ascending: true },
          limit: 200,
        }).catch(() => [])
      ).filter((p: any) => {
        if (String(p.supplierId || p.supplier_id) !== String(payingSupplier.id)) return false;
        const bal = Number(p.balance ?? 0) || 0;
        return bal > 0 || String(p.status || '').toLowerCase() !== 'paid';
      });
      let purchaseRemaining = paymentAmount;
      for (const p of purchasesForSupplier as any[]) {
        if (purchaseRemaining <= 0) break;
        const total = Number(p.total ?? p.totalCost ?? 0) || 0;
        const alreadyPaid = Number(p.paid ?? 0) || 0;
        const bal = Number(p.balance ?? Math.max(0, total - alreadyPaid)) || 0;
        if (bal <= 0) continue;
        const apply = Math.min(purchaseRemaining, bal);
        const newPaid = alreadyPaid + apply;
        const newBal = Math.max(0, bal - apply);
        await sbUpdateDoc(`businesses/${businessId}/purchases`, p.id, {
          paid: newPaid,
          balance: newBal,
          status: newBal <= 0 ? 'paid' : 'partial',
        });
        purchaseRemaining -= apply;
      }

      const newBalance = Math.max(0, outstanding - paymentAmount);
      const totalPayments = (Number(payingSupplier.totalPayments) || 0) + paymentAmount;
      const paymentCount = (Number(payingSupplier.paymentCount) || 0) + 1;
      const creditLimit = Number(payingSupplier.creditLimit) || 0;

      await sbUpdateDoc(`businesses/${businessId}/suppliers`, payingSupplier.id, {
        currentBalance: newBalance,
        totalPayments,
        paymentCount,
        lastPaymentDate: new Date().toISOString(),
        creditUtilization: creditLimit > 0 ? (newBalance / creditLimit) * 100 : 0,
      });

      await sbUpdateDoc(`businesses/${businessId}/bankAccounts`, accountId, {
        currentBalance: bankBal - paymentAmount,
      });

      await sbAddDoc(`businesses/${businessId}/bankTransactions`, {
        bankAccountId: accountId,
        accountName: (accounts[0] as any).accountName || (accounts[0] as any).name,
        type: 'money_out',
        amount: paymentAmount,
        balanceAfter: bankBal - paymentAmount,
        description: `Supplier payment: ${payingSupplier.name}`,
        reference: payingSupplier.id,
        referenceType: 'supplier_payment',
        category: 'supplier_payment',
        createdAt: new Date().toISOString(),
      });

      await sbAddDoc(`businesses/${businessId}/supplierLedger`, {
        supplierId: payingSupplier.id,
        supplierName: payingSupplier.name,
        type: 'payment',
        amount: paymentAmount,
        paidAmount: paymentAmount,
        creditAmount: 0,
        balanceAfter: newBalance,
        description: `Payment to supplier (${payMethod})`,
        reference: payingSupplier.id,
        referenceType: 'supplier_payment',
        paymentMethod: payMethod,
        bankAccountId: accountId,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user?.id || null,
        createdByName: user?.name || null,
      });

      showToast(
        newBalance <= 0
          ? `Paid ${formatMoney(paymentAmount)} - supplier is fully settled`
          : `Paid ${formatMoney(paymentAmount)} - still owe ${formatMoney(newBalance)}`
      );
      setShowPayModal(false);
      setPayingSupplier(null);
      setPayAmount('');
      loadData();
    } catch (e: any) {
      console.error(e);
      showToast(`Failed to pay supplier: ${e.message || 'Unknown error'}`);
    } finally {
      setIsPaying(false);
    }
  };

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

  const renderSupplierCard = (s: any, showPay: boolean) => (
    <div key={s.id} className={styles.supplierCreditCard}>
      <div className={styles.supplierCreditHeader}>
        <div>
          <div className={styles.supplierCreditName}>{s.name}</div>
          <p className={styles.supplierCreditMeta}>
            {s.paymentTerms} | {s.purchaseCount} purchases
            {s.phone ? ` | ${s.phone}` : ''}
          </p>
        </div>
        <span className={styles.supplierCreditBadge}>
          {formatMoney(s.currentBalance)}
          {s.currentBalance > 0 ? ' owing' : ''}
        </span>
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
      {showPay && s.currentBalance > 0 && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => openPaySupplier(s)}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Wallet size={16} /> Pay supplier
          </button>
        </div>
      )}
    </div>
  );

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
          placeholder="Search name, phone, amount..."
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
          <p>Loading credit data...</p>
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
                          {tx.dueDate ? ` | due ${tx.dueDate.toLocaleDateString()}` : ''}
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
                filteredSuppliers.filter((s) => s.currentBalance > 0).map((s) => renderSupplierCard(s, true))
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
                filteredSuppliers.map((s) => renderSupplierCard(s, true))
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
                {isAdding ? 'Saving...' : 'Add customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayModal && payingSupplier && (
        <div className={styles.modalOverlay} onClick={() => !isPaying && setShowPayModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Pay {payingSupplier.name}</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-3)' }}>
              Outstanding: <strong>{formatMoney(payingSupplier.currentBalance)}</strong>. This debits cash and updates supplier history.
            </p>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Amount</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Method</label>
                <select className={styles.input} value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)}>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank transfer</option>
                  <option value="pos">POS / Card</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Pay from account</label>
                <select className={styles.input} value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)}>
                  <option value="">Auto (cash / default)</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} {a.bankName ? `| ${a.bankName}` : ''} ({formatMoney(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowPayModal(false)} disabled={isPaying}>
                Cancel
              </button>
              <button type="button" className={styles.submitButton} onClick={handlePaySupplier} disabled={isPaying}>
                {isPaying ? 'Paying...' : 'Record payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditTrackingPage;
