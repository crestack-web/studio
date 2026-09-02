'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs, updateDoc, addDoc } from '@/lib/supabase-client-data';
import { isCreditLayerEligible, getBusinessType } from '@/lib/featureRestrictions';
import { Supplier, SupplierLedgerTransaction } from './types';
import styles from './SupplierCreditPage.module.css';

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountType?: string;
  currentBalance: number;
  isActive: boolean;
  isDefault: boolean;
  isPosDefault?: boolean;
}

export function SupplierCreditPage() {
  const { showToast, user } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [businessType, setBusinessType] = useState<string>('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    checkEligibility();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

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
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const [suppliersRaw, creditRows, accountsRaw] = await Promise.all([
        fetchDocs(`businesses/${businessId}/suppliers`),
        fetchDocs(`businesses/${businessId}/supplierCredit`, {
          orderBy: { field: 'created_at', ascending: false },
          limit: 300,
        }),
        fetchDocs(`businesses/${businessId}/bankAccounts`),
      ]);

      // Outstanding per supplier from open credit lines (source of truth)
      const owedBySupplier = new Map<string, number>();
      const ledgerList: SupplierLedgerTransaction[] = [];

      for (const c of creditRows as any[]) {
        const sid = String(c.supplierId || c.supplier_id || '');
        if (!sid) continue;
        const amount = Number(c.amount) || 0;
        const paid = Number(c.paid) || 0;
        const bal = Number(c.balance ?? Math.max(0, amount - paid)) || 0;
        const status = String(c.status || (bal <= 0 ? 'paid' : 'open')).toLowerCase();
        if (status !== 'paid' && bal > 0) {
          owedBySupplier.set(sid, (owedBySupplier.get(sid) || 0) + bal);
        }
        const created = c.createdAt || c.created_at;
        const createdDate = created ? new Date(created) : new Date();
        ledgerList.push({
          id: String(c.id),
          supplierId: sid,
          businessId: businessId,
          type: status === 'paid' && paid > 0 ? 'payment' : 'purchase',
          amount: status === 'paid' ? paid || amount : amount,
          balanceAfter: bal,
          description:
            status === 'paid'
              ? `Credit line settled (${formatMoney(paid || amount)})`
              : `Credit purchase · owed ${formatMoney(bal)}`,
          reference: String(c.id).slice(0, 8),
          date: createdDate,
          createdAt: createdDate,
          createdBy: '',
          createdByName: '',
          metadata: { status, paid, balance: bal },
        });
      }

      const suppliersList: Supplier[] = (suppliersRaw as any[])
        .filter((data) => {
          const status = String(data.status || (data.active === false ? 'inactive' : 'active')).toLowerCase();
          return status === 'active';
        })
        .map((data) => {
          const metaOwed = Number(data.currentBalance) || 0;
          const creditOwed = owedBySupplier.get(String(data.id)) || 0;
          // Prefer live credit lines; fall back to stored balance
          const currentBalance = creditOwed > 0 ? creditOwed : metaOwed;
          return {
            id: data.id,
            businessId: businessId,
            supplierName: data.supplierName || data.businessName || data.name || '',
            businessName: data.businessName || data.supplierName || data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            notes: data.notes || '',
            paymentTerms: data.paymentTerms || 'net_30',
            customPaymentDays: data.customPaymentDays || 30,
            creditLimit: Number(data.creditLimit) || 0,
            openingBalance: Number(data.openingBalance) || 0,
            currentBalance,
            category: data.category || 'general',
            status: data.status || 'active',
            taxId: data.taxId || '',
            bankAccount: data.bankAccount || null,
            contactPerson: data.contactPerson || null,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            lastPurchaseDate: data.lastPurchaseDate ? new Date(data.lastPurchaseDate) : undefined,
            lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : undefined,
            totalPurchases: Number(data.totalPurchases) || 0,
            totalPayments: Number(data.totalPayments) || 0,
            purchaseCount: Number(data.purchaseCount) || 0,
            paymentCount: Number(data.paymentCount) || 0,
            averagePaymentDays: Number(data.averagePaymentDays) || 0,
            creditUtilization: Number(data.creditUtilization) || 0,
          } as Supplier;
        });

      setSuppliers(suppliersList);
      setSupplierLedger(ledgerList);

      const accountsList: BankAccount[] = (accountsRaw as any[])
        .filter((a) => a.isActive !== false)
        .map((a) => ({
          id: a.id,
          accountName: a.accountName || a.name || 'Account',
          bankName: a.bankName || '',
          accountType: a.accountType || 'bank',
          currentBalance: Number(a.currentBalance) || 0,
          isActive: a.isActive !== false,
          isDefault: Boolean(a.isDefault || a.isPrimary),
          isPosDefault: Boolean(a.isPosDefault),
        }));
      setBankAccounts(accountsList);

      const defaultAccount =
        accountsList.find((a) => a.isDefault) || accountsList.find((a) => a.isPosDefault) || accountsList[0];
      if (defaultAccount) setBankAccountId(defaultAccount.id);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('❌ Failed to load supplier credit data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPaymentAmount(String(supplier.currentBalance || ''));
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedSupplier || !paymentAmount) {
      showToast('⚠️ Please enter payment amount');
      return;
    }

    let amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      showToast('⚠️ Please enter a valid amount');
      return;
    }

    if (amount > selectedSupplier.currentBalance + 0.001) {
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

      const openCredits = (
        await fetchDocs(`businesses/${businessId}/supplierCredit`, {
          orderBy: { field: 'created_at', ascending: true },
          limit: 200,
        })
      ).filter(
        (c: any) =>
          String(c.supplierId || c.supplier_id) === String(selectedSupplier.id) &&
          Number(c.balance ?? Math.max(0, Number(c.amount || 0) - Number(c.paid || 0))) > 0 &&
          String(c.status || 'open').toLowerCase() !== 'paid'
      );

      let remaining = amount;
      for (const credit of openCredits as any[]) {
        if (remaining <= 0) break;
        const bal =
          Number(credit.balance ?? Math.max(0, Number(credit.amount || 0) - Number(credit.paid || 0))) ||
          0;
        if (bal <= 0) continue;
        const apply = Math.min(remaining, bal);
        const newPaid = (Number(credit.paid) || 0) + apply;
        const newBal = Math.max(0, bal - apply);
        await updateDoc(`businesses/${businessId}/supplierCredit`, credit.id, {
          paid: newPaid,
          balance: newBal,
          status: newBal <= 0 ? 'paid' : 'open',
        });
        remaining -= apply;
      }

      // Open purchases
      let purchaseRemaining = amount;
      const purchases = (
        await fetchDocs(`businesses/${businessId}/purchases`, {
          orderBy: { field: 'created_at', ascending: true },
          limit: 200,
        })
      ).filter((p: any) => String(p.supplierId || p.supplier_id) === String(selectedSupplier.id));
      for (const p of purchases as any[]) {
        if (purchaseRemaining <= 0) break;
        const total = Number(p.total ?? 0) || 0;
        const alreadyPaid = Number(p.paid ?? 0) || 0;
        const bal = Number(p.balance ?? Math.max(0, total - alreadyPaid)) || 0;
        if (bal <= 0) continue;
        const apply = Math.min(purchaseRemaining, bal);
        await updateDoc(`businesses/${businessId}/purchases`, p.id, {
          paid: alreadyPaid + apply,
          balance: Math.max(0, bal - apply),
          status: bal - apply <= 0 ? 'paid' : 'partial',
        });
        purchaseRemaining -= apply;
      }

      const newBalance = Math.max(0, (selectedSupplier.currentBalance || 0) - amount);
      const totalPayments = (selectedSupplier.totalPayments || 0) + amount;
      const paymentCount = (selectedSupplier.paymentCount || 0) + 1;
      const creditLimit = selectedSupplier.creditLimit || 0;

      await updateDoc(`businesses/${businessId}/suppliers`, selectedSupplier.id, {
        currentBalance: newBalance,
        totalPayments,
        paymentCount,
        lastPaymentDate: new Date().toISOString(),
        creditUtilization: creditLimit > 0 ? (newBalance / creditLimit) * 100 : 0,
      });

      // Debit bank/cash account
      let accountId = bankAccountId;
      if (!accountId || paymentMethod === 'cash') {
        const cash =
          bankAccounts.find((a) => /cash/i.test(a.accountName)) ||
          bankAccounts.find((a) => a.isDefault) ||
          bankAccounts[0];
        if (paymentMethod === 'cash' && cash) accountId = cash.id;
      }
      if (accountId) {
        const acct = bankAccounts.find((a) => a.id === accountId);
        const bal = Number(acct?.currentBalance) || 0;
        if (bal < amount) {
          showToast('⚠️ Insufficient account balance — supplier balance still updated');
        } else {
          await updateDoc(`businesses/${businessId}/bankAccounts`, accountId, {
            currentBalance: bal - amount,
          });
          await addDoc(`businesses/${businessId}/bankTransactions`, {
            id: crypto.randomUUID(),
            bankAccountId: accountId,
            accountName: acct?.accountName || 'Account',
            type: 'money_out',
            amount,
            balanceAfter: bal - amount,
            description: `Supplier payment: ${selectedSupplier.businessName || selectedSupplier.supplierName}${
              paymentNotes.trim() ? ` — ${paymentNotes.trim()}` : ''
            }`,
            reference: selectedSupplier.id,
            createdAt: new Date().toISOString(),
          });
        }
      }

      showToast(
        newBalance <= 0
          ? '✅ Fully settled with this supplier'
          : `✅ Payment recorded — still owe ${formatMoney(newBalance)}`
      );
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

  const formatDate = (value: Date | string | undefined | null) => {
    if (!value) return 'N/A';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  const isOverdue = (supplier: Supplier) => {
    if (!supplier.lastPurchaseDate) return false;
    const paymentDays =
      supplier.paymentTerms === 'cash'
        ? 0
        : supplier.paymentTerms === 'net_7'
          ? 7
          : supplier.paymentTerms === 'net_14'
            ? 14
            : supplier.paymentTerms === 'net_30'
              ? 30
              : supplier.paymentTerms === 'net_60'
                ? 60
                : supplier.paymentTerms === 'net_90'
                  ? 90
                  : supplier.customPaymentDays || 30;
    const base =
      supplier.lastPurchaseDate instanceof Date
        ? supplier.lastPurchaseDate
        : new Date(supplier.lastPurchaseDate as any);
    const dueDate = new Date(base.getTime() + paymentDays * 24 * 60 * 60 * 1000);
    return dueDate < new Date();
  };

  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
  const overdueCount = suppliers.filter((s) => isOverdue(s)).length;

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

      {suppliers.filter((s) => s.currentBalance > 0).length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <h3>No Outstanding Credit</h3>
          <p>All supplier payments are up to date</p>
        </div>
      ) : (
        <div className={styles.ledgerList}>
          {suppliers
            .filter((s) => s.currentBalance > 0)
            .map((supplier) => {
              const supplierTransactions = supplierLedger.filter((l) => l.supplierId === supplier.id);
              const lastPurchase =
                supplier.lastPurchaseDate instanceof Date
                  ? supplier.lastPurchaseDate
                  : supplier.lastPurchaseDate
                    ? new Date(supplier.lastPurchaseDate as any)
                    : null;
              const termDays =
                supplier.paymentTerms === 'cash'
                  ? 0
                  : supplier.paymentTerms === 'net_7'
                    ? 7
                    : supplier.paymentTerms === 'net_14'
                      ? 14
                      : supplier.paymentTerms === 'net_30'
                        ? 30
                        : supplier.paymentTerms === 'net_60'
                          ? 60
                          : supplier.paymentTerms === 'net_90'
                            ? 90
                            : supplier.customPaymentDays || 30;
              const daysUntilDue = lastPurchase
                ? Math.ceil(
                    (lastPurchase.getTime() + termDays * 24 * 60 * 60 * 1000 - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 30;
              const overdue = daysUntilDue < 0;

              return (
                <div key={supplier.id} className={styles.ledgerCard}>
                  <div className={styles.ledgerHeader}>
                    <div className={styles.ledgerSupplier}>
                      <div className={styles.supplierIcon}>🏢</div>
                      <div>
                        <h3 className={styles.supplierName}>
                          {supplier.businessName || supplier.supplierName}
                        </h3>
                        <span className={styles.receiptNumber}>
                          {String(supplier.paymentTerms || 'net_30').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`${styles.statusBadge} ${overdue ? styles.overdue : styles.pending}`}
                    >
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
                      <span className={`${styles.detailValue} ${styles.outstanding}`}>
                        {formatMoney(supplier.currentBalance)}
                      </span>
                    </div>
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Credit Limit</span>
                      <span className={styles.detailValue}>{formatMoney(supplier.creditLimit)}</span>
                    </div>
                    <div className={styles.detail}>
                      <span className={styles.detailLabel}>Due In</span>
                      <span className={`${styles.detailValue} ${overdue ? styles.overdue : ''}`}>
                        {overdue
                          ? `${Math.abs(daysUntilDue)} days overdue`
                          : `${daysUntilDue} days`}
                      </span>
                    </div>
                    {supplier.lastPaymentDate && (
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Last payment</span>
                        <span className={styles.detailValue}>{formatDate(supplier.lastPaymentDate)}</span>
                      </div>
                    )}
                  </div>

                  {supplierTransactions.length > 0 && (
                    <div className={styles.paymentsSection}>
                      <span className={styles.paymentsLabel}>
                        Credit lines ({supplierTransactions.length}):
                      </span>
                      <div className={styles.paymentsList}>
                        {supplierTransactions.slice(0, 5).map((transaction, index) => (
                          <div key={transaction.id || index} className={styles.paymentLine}>
                            <span>{transaction.date.toLocaleDateString()}</span>
                            <span>{transaction.type.toUpperCase()}</span>
                            <span>{formatMoney(transaction.amount)}</span>
                            <span>{transaction.description}</span>
                          </div>
                        ))}
                        {supplierTransactions.length > 5 && (
                          <div className={styles.paymentLine}>
                            <span>+{supplierTransactions.length - 5} more</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button className={styles.payButton} onClick={() => handlePaymentClick(supplier)}>
                    Record Payment
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {showPaymentModal && selectedSupplier && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record Payment</h3>
              <button className={styles.modalClose} onClick={() => setShowPaymentModal(false)}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.ledgerSummary}>
                <span className={styles.ledgerSummaryLabel}>Supplier:</span>
                <span className={styles.ledgerSummaryValue}>
                  {selectedSupplier.businessName || selectedSupplier.supplierName}
                </span>
              </div>
              <div className={styles.ledgerSummary}>
                <span className={styles.ledgerSummaryLabel}>Outstanding:</span>
                <span className={styles.ledgerSummaryValue}>
                  {formatMoney(selectedSupplier.currentBalance)}
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Amount</label>
                <input
                  type="number"
                  className={styles.input}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedSupplier.currentBalance}
                  min={0}
                  step="0.01"
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
                  <option value="pos">POS / Card</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Pay from account</label>
                <select
                  className={styles.select}
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                >
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName} ({formatMoney(account.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

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
