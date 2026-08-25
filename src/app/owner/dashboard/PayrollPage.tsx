'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, fetchDoc, addDoc, updateDoc, deleteDoc, runBatch, toISOString, toDate } from '@/lib/supabase-client-data';
import styles from './PayrollPage.module.css';

interface PayrollEntry {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  period: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paidDate?: Date | null;
  notes?: string;
  createdAt?: Date | null;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary?: number;
  salary?: number;
  active?: boolean;
  status?: string;
}

interface WalletTx {
  id: string;
  type: 'deposit' | 'payout';
  amount: number;
  note?: string;
  balanceAfter: number;
  createdAt?: Date | null;
  entryIds?: string[];
}

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function PayrollPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();

  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTx, setWalletTx] = useState<WalletTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundNote, setFundNote] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    staffId: '',
    period: currentPeriod(),
    baseSalary: '',
    bonuses: '',
    deductions: '',
    overtimeHours: '',
    overtimeRate: '',
    notes: '',
  });

  const businessId = user?.businessId;

  const loadWallet = useCallback(async () => {
    if (!businessId) return;
    try {
      const walletPath = `businesses/${businessId}/settings`;
      const walletSnap = await fetchDoc<{ balance?: number }>(walletPath, 'payrollWallet');
      setWalletBalance(Number(walletSnap?.balance) || 0);

      const txPath = `businesses/${businessId}/walletTransactions`;
      const txDocs = await fetchDocs(txPath);
      const txs: WalletTx[] = txDocs.map((data: any) => ({
        id: data.id,
        type: data.type === 'payout' ? 'payout' : 'deposit',
        amount: Number(data.amount) || 0,
        note: data.note || '',
        balanceAfter: Number(data.balanceAfter) || 0,
        createdAt: toDate(data.createdAt),
        entryIds: data.entryIds || [],
      }));
      txs.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      setWalletTx(txs.slice(0, 20));
    } catch (e) {
      console.error('Failed to load wallet', e);
    }
  }, [businessId]);

  const loadPayrollEntries = useCallback(async () => {
    if (!businessId) return;
    try {
      const path = `businesses/${businessId}/payroll`;
      const docs = await fetchDocs(path);
      const entries: PayrollEntry[] = docs.map((data: any) => ({
        id: data.id,
        staffId: data.staffId || '',
        staffName: data.staffName || 'Unknown',
        staffRole: data.staffRole || 'Staff',
        period: data.period || '',
        baseSalary: Number(data.baseSalary) || 0,
        bonuses: Number(data.bonuses) || 0,
        deductions: Number(data.deductions) || 0,
        overtimeHours: Number(data.overtimeHours) || 0,
        overtimeRate: Number(data.overtimeRate) || 0,
        overtimePay: Number(data.overtimePay) || 0,
        netSalary: Number(data.netSalary) || 0,
        status: (data.status as PayrollEntry['status']) || 'pending',
        paidDate: toDate(data.paidDate),
        notes: data.notes || '',
        createdAt: toDate(data.createdAt),
      }));
      entries.sort((a, b) => (b.period || '').localeCompare(a.period || '') || a.staffName.localeCompare(b.staffName));
      setPayrollEntries(entries);
    } catch (e) {
      console.error('Failed to load payroll', e);
    }
  }, [businessId]);

  const loadStaffMembers = useCallback(async () => {
    if (!businessId) return;
    try {
      const path = `businesses/${businessId}/staff`;
      const docs = await fetchDocs(path);
      const staff = docs.map((data: any) => ({
        id: data.id,
        ...data,
      })) as StaffMember[];
      setStaffMembers(
        staff.filter((s) => s.status !== 'removed' && s.status !== 'banned')
      );
    } catch (e) {
      console.error('Failed to load staff', e);
    }
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await Promise.all([loadPayrollEntries(), loadStaffMembers(), loadWallet()]);
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPayrollEntries, loadStaffMembers, loadWallet]);

  const resetForm = () => {
    setFormData({
      staffId: '',
      period: currentPeriod(),
      baseSalary: '',
      bonuses: '',
      deductions: '',
      overtimeHours: '',
      overtimeRate: '',
      notes: '',
    });
  };

  const handleSave = async () => {
    if (!businessId) return;
    if (!formData.staffId || !formData.period || !formData.baseSalary) {
      showToast('Staff, period and base salary are required');
      return;
    }
    setIsSaving(true);
    try {
      const path = `businesses/${businessId}/payroll`;
      const overtimeHours = parseFloat(formData.overtimeHours) || 0;
      const overtimeRate = parseFloat(formData.overtimeRate) || 0;
      const overtimePay = overtimeHours * overtimeRate;
      const baseSalary = parseFloat(formData.baseSalary) || 0;
      const bonuses = parseFloat(formData.bonuses) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      const netSalary = baseSalary + bonuses + overtimePay - deductions;
      const staffMember = staffMembers.find((s) => s.id === formData.staffId);

      const entryData = {
        staffId: formData.staffId,
        staffName: staffMember?.name || 'Unknown',
        staffRole: staffMember?.role || 'Staff',
        period: formData.period,
        baseSalary,
        bonuses,
        deductions,
        overtimeHours,
        overtimeRate,
        overtimePay,
        netSalary,
        status: editingEntry?.status || 'pending',
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
        ...(editingEntry ? {} : { createdAt: new Date().toISOString() }),
      };

      if (editingEntry) {
        await updateDoc(path, editingEntry.id, entryData);
        showToast('Payroll entry updated');
      } else {
        await addDoc(path, { ...entryData, id: crypto.randomUUID() });
        showToast('Payroll entry created');
      }
      setShowAddModal(false);
      setEditingEntry(null);
      resetForm();
      await loadPayrollEntries();
    } catch (e) {
      console.error(e);
      showToast('Failed to save payroll entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!businessId) return;
    if (!confirm('Delete this payroll entry?')) return;
    try {
      const path = `businesses/${businessId}/payroll`;
      await deleteDoc(path, entryId);
      showToast('Payroll entry deleted');
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(entryId);
        return n;
      });
      await loadPayrollEntries();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete entry');
    }
  };

  const handleFundWallet = async () => {
    if (!businessId) return;
    const amount = parseFloat(fundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a valid amount greater than 0');
      return;
    }
    setIsFunding(true);
    try {
      const walletPath = `businesses/${businessId}/settings`;
      const currentSnap = await fetchDoc<{ balance?: number }>(walletPath, 'payrollWallet');
      const currentBalance = Number(currentSnap?.balance) || 0;
      const newBalance = currentBalance + amount;
      await updateDoc(walletPath, 'payrollWallet', { balance: newBalance, updatedAt: new Date().toISOString() });

      const txPath = `businesses/${businessId}/walletTransactions`;
      await addDoc(txPath, {
        type: 'deposit',
        amount,
        note: fundNote.trim() || 'Wallet top-up',
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
        createdBy: user?.id || null,
      });
      setWalletBalance(newBalance);
      setShowFundModal(false);
      setFundAmount('');
      setFundNote('');
      showToast(`Added ${formatMoney(amount)} to payroll wallet`);
      await loadWallet();
    } catch (e) {
      console.error(e);
      showToast('Failed to fund wallet');
    } finally {
      setIsFunding(false);
    }
  };

  const selectedEntries = useMemo(
    () => payrollEntries.filter((e) => selectedIds.has(e.id) && e.status !== 'paid'),
    [payrollEntries, selectedIds]
  );
  const selectedTotal = useMemo(
    () => selectedEntries.reduce((s, e) => s + e.netSalary, 0),
    [selectedEntries]
  );

  const handleBulkPay = async () => {
    if (!businessId || selectedEntries.length === 0) return;
    if (walletBalance < selectedTotal) {
      showToast('Insufficient wallet balance. Fund your wallet first.');
      return;
    }
    setIsPaying(true);
    try {
      const walletPath = `businesses/${businessId}/settings`;
      const payrollPath = `businesses/${businessId}/payroll`;
      const txPath = `businesses/${businessId}/walletTransactions`;

      const newBalance = walletBalance - selectedTotal;
      await runBatch([
        { type: 'update', path: walletPath, id: 'payrollWallet', data: { balance: newBalance, updatedAt: new Date().toISOString() } },
        ...selectedEntries.map((entry) => ({
          type: 'update' as const,
          path: payrollPath,
          id: entry.id,
          data: {
            status: 'paid',
            paidDate: new Date().toISOString(),
            paidFromWallet: true,
          },
        })),
      ]);

      await addDoc(txPath, {
        type: 'payout',
        amount: selectedTotal,
        note: `Bulk salary payout (${selectedEntries.length} staff)`,
        balanceAfter: newBalance,
        entryIds: selectedEntries.map((e) => e.id),
        staffNames: selectedEntries.map((e) => e.staffName),
        createdAt: new Date().toISOString(),
        createdBy: user?.id || null,
      });

      setWalletBalance(newBalance);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      showToast(`Paid ${selectedEntries.length} staff — ${formatMoney(selectedTotal)}`);
      await Promise.all([loadPayrollEntries(), loadWallet()]);
    } catch (e) {
      console.error(e);
      showToast('Bulk payout failed. Try again.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleGeneratePeriod = async () => {
    if (!businessId) return;
    const period = currentPeriod();
    const existing = new Set(
      payrollEntries.filter((e) => e.period === period).map((e) => e.staffId)
    );
    const toCreate = staffMembers.filter((s) => !existing.has(s.id));
    if (toCreate.length === 0) {
      showToast(`All staff already have entries for ${period}`);
      return;
    }
    if (!confirm(`Create pending payroll for ${toCreate.length} staff for ${period}?`)) return;
    try {
      const path = `businesses/${businessId}/payroll`;
      await Promise.all(
        toCreate.map((s) => {
          const base = Number(s.baseSalary ?? s.salary) || 0;
          return addDoc(path, {
            staffId: s.id,
            staffName: s.name || 'Staff',
            staffRole: s.role || 'Staff',
            period,
            baseSalary: base,
            bonuses: 0,
            deductions: 0,
            overtimeHours: 0,
            overtimeRate: 0,
            overtimePay: 0,
            netSalary: base,
            status: 'pending',
            notes: '',
            createdAt: new Date().toISOString(),
          });
        })
      );
      showToast(`Created ${toCreate.length} payroll entries for ${period}`);
      await loadPayrollEntries();
    } catch (e) {
      console.error(e);
      showToast('Failed to generate payroll');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const pendingVisible = useMemo(
    () =>
      payrollEntries.filter((e) => {
        if (e.status === 'paid') return false;
        const matchesSearch =
          e.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.staffRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.period.includes(searchQuery);
        const matchesPeriod = filterPeriod === 'all' || e.period === filterPeriod;
        const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
        return matchesSearch && matchesPeriod && matchesStatus;
      }),
    [payrollEntries, searchQuery, filterPeriod, filterStatus]
  );

  const filteredEntries = useMemo(
    () =>
      payrollEntries.filter((e) => {
        const matchesSearch =
          e.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.staffRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.period.includes(searchQuery);
        const matchesPeriod = filterPeriod === 'all' || e.period === filterPeriod;
        const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
        return matchesSearch && matchesPeriod && matchesStatus;
      }),
    [payrollEntries, searchQuery, filterPeriod, filterStatus]
  );

  const toggleSelectAllPending = () => {
    const ids = pendingVisible.map((e) => e.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(id));
        return n;
      });
    } else {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        ids.forEach((id) => n.add(id));
        return n;
      });
    }
  };

  const uniquePeriods = useMemo(() => {
    const periods = new Set(payrollEntries.map((e) => e.period));
    return Array.from(periods).sort().reverse();
  }, [payrollEntries]);

  const pendingTotal = payrollEntries
    .filter((e) => e.status === 'pending' || e.status === 'processed')
    .reduce((s, e) => s + e.netSalary, 0);
  const paidTotal = payrollEntries
    .filter((e) => e.status === 'paid')
    .reduce((s, e) => s + e.netSalary, 0);

  const openEdit = (entry: PayrollEntry) => {
    setEditingEntry(entry);
    setFormData({
      staffId: entry.staffId,
      period: entry.period,
      baseSalary: String(entry.baseSalary),
      bonuses: String(entry.bonuses),
      deductions: String(entry.deductions),
      overtimeHours: String(entry.overtimeHours),
      overtimeRate: String(entry.overtimeRate),
      notes: entry.notes || '',
    });
    setShowAddModal(true);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading payroll…</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Payroll</h2>
          <p className={styles.pageDesc}>
            Fund your wallet and pay staff salaries in bulk — even when you are not at the shop.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnSubtle} onClick={handleGeneratePeriod}>
            Generate this month
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              resetForm();
              setEditingEntry(null);
              setShowAddModal(true);
            }}
          >
            + Add entry
          </button>
        </div>
      </div>

      <div className={styles.walletCard}>
        <div className={styles.walletLeft}>
          <div className={styles.walletLabel}>Payroll wallet</div>
          <div className={styles.walletBalance}>{formatMoney(walletBalance)}</div>
          <div className={styles.walletHint}>
            Add money here, then pay selected staff in one go.
          </div>
        </div>
        <div className={styles.walletActions}>
          <button type="button" className={styles.btnPrimary} onClick={() => setShowFundModal(true)}>
            + Add money
          </button>
          <button
            type="button"
            className={styles.btnSubtle}
            disabled={selectedEntries.length === 0}
            onClick={() => setShowBulkConfirm(true)}
          >
            Pay selected ({selectedEntries.length})
          </button>
        </div>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Wallet</span>
          <span className={styles.summaryValue}>{formatMoney(walletBalance)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Unpaid</span>
          <span className={styles.summaryValue}>{formatMoney(pendingTotal)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Paid (all time)</span>
          <span className={styles.summaryValue}>{formatMoney(paidTotal)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Selected</span>
          <span className={styles.summaryValue}>{formatMoney(selectedTotal)}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search staff or period…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className={styles.select}
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
        >
          <option value="all">All periods</option>
          {uniquePeriods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processed">Processed</option>
          <option value="paid">Paid</option>
        </select>
        <button type="button" className={styles.btnSubtle} onClick={toggleSelectAllPending}>
          Select unpaid
        </button>
      </div>

      <div className={styles.tableWrap}>
        {filteredEntries.length === 0 ? (
          <div className={styles.empty}>
            <p>No payroll entries yet.</p>
            <p className={styles.emptyHint}>
              Use “Generate this month” to create pending salaries from staff base pay, or add an entry
              manually.
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colCheck}>
                  <span className={styles.srOnly}>Select</span>
                </th>
                <th>Staff</th>
                <th>Period</th>
                <th>Base</th>
                <th>Net</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const canSelect = entry.status !== 'paid';
                return (
                  <tr key={entry.id} className={selectedIds.has(entry.id) ? styles.rowSelected : undefined}>
                    <td className={styles.colCheck}>
                      <input
                        type="checkbox"
                        disabled={!canSelect}
                        checked={selectedIds.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        aria-label={`Select ${entry.staffName}`}
                      />
                    </td>
                    <td>
                      <div className={styles.staffCell}>
                        <strong>{entry.staffName}</strong>
                        <span>{entry.staffRole}</span>
                      </div>
                    </td>
                    <td>{entry.period}</td>
                    <td>{formatMoney(entry.baseSalary)}</td>
                    <td>
                      <strong>{formatMoney(entry.netSalary)}</strong>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${entry.status}`]}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {entry.status !== 'paid' && (
                          <button type="button" className={styles.linkBtn} onClick={() => openEdit(entry)}>
                            Edit
                          </button>
                        )}
                        {entry.status !== 'paid' && (
                          <button
                            type="button"
                            className={styles.linkDanger}
                            onClick={() => handleDelete(entry.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {walletTx.length > 0 && (
        <div className={styles.txSection}>
          <h3 className={styles.txTitle}>Recent wallet activity</h3>
          <ul className={styles.txList}>
            {walletTx.map((tx) => (
              <li key={tx.id} className={styles.txItem}>
                <span className={tx.type === 'deposit' ? styles.txIn : styles.txOut}>
                  {tx.type === 'deposit' ? '+' : '−'}
                  {formatMoney(tx.amount)}
                </span>
                <span className={styles.txNote}>{tx.note || tx.type}</span>
                <span className={styles.txBal}>Bal {formatMoney(tx.balanceAfter)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showFundModal && (
        <div className={styles.overlay} onClick={() => setShowFundModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add money to payroll wallet</h3>
            <p className={styles.modalDesc}>
              Record funds available to pay staff. This balance is used for bulk salary payouts.
            </p>
            <label className={styles.label}>
              Amount (₦)
              <input
                type="number"
                min="1"
                step="100"
                className={styles.input}
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="e.g. 500000"
                autoFocus
              />
            </label>
            <label className={styles.label}>
              Note (optional)
              <input
                type="text"
                className={styles.input}
                value={fundNote}
                onChange={(e) => setFundNote(e.target.value)}
                placeholder="Bank transfer, cash, etc."
              />
            </label>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSubtle} onClick={() => setShowFundModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={isFunding}
                onClick={handleFundWallet}
              >
                {isFunding ? 'Adding…' : 'Add to wallet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkConfirm && (
        <div className={styles.overlay} onClick={() => setShowBulkConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Pay selected staff</h3>
            <p className={styles.modalDesc}>
              You are about to pay <strong>{selectedEntries.length}</strong> staff a total of{' '}
              <strong>{formatMoney(selectedTotal)}</strong> from your payroll wallet.
            </p>
            <div className={styles.confirmBox}>
              <div>
                Wallet balance: <strong>{formatMoney(walletBalance)}</strong>
              </div>
              <div>
                After payout:{' '}
                <strong>{formatMoney(walletBalance - selectedTotal)}</strong>
              </div>
            </div>
            {walletBalance < selectedTotal && (
              <p className={styles.errorText}>
                Insufficient balance. Add at least {formatMoney(selectedTotal - walletBalance)} more.
              </p>
            )}
            <ul className={styles.confirmList}>
              {selectedEntries.slice(0, 8).map((e) => (
                <li key={e.id}>
                  {e.staffName} — {formatMoney(e.netSalary)}
                </li>
              ))}
              {selectedEntries.length > 8 && <li>…and {selectedEntries.length - 8} more</li>}
            </ul>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSubtle} onClick={() => setShowBulkConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={isPaying || walletBalance < selectedTotal}
                onClick={handleBulkPay}
              >
                {isPaying ? 'Paying…' : `Pay ${formatMoney(selectedTotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className={styles.overlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{editingEntry ? 'Edit payroll entry' : 'Add payroll entry'}</h3>
            <label className={styles.label}>
              Staff
              <select
                className={styles.input}
                value={formData.staffId}
                disabled={!!editingEntry}
                onChange={(e) => {
                  const id = e.target.value;
                  const s = staffMembers.find((m) => m.id === id);
                  setFormData((f) => ({
                    ...f,
                    staffId: id,
                    baseSalary: s
                      ? String(Number(s.baseSalary ?? s.salary) || f.baseSalary || '')
                      : f.baseSalary,
                  }));
                }}
              >
                <option value="">Select staff…</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role || 'Staff'})
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Period (YYYY-MM)
              <input
                type="month"
                className={styles.input}
                value={formData.period}
                onChange={(e) => setFormData((f) => ({ ...f, period: e.target.value }))}
              />
            </label>
            <div className={styles.formGrid}>
              <label className={styles.label}>
                Base salary
                <input
                  type="number"
                  className={styles.input}
                  value={formData.baseSalary}
                  onChange={(e) => setFormData((f) => ({ ...f, baseSalary: e.target.value }))}
                />
              </label>
              <label className={styles.label}>
                Bonuses
                <input
                  type="number"
                  className={styles.input}
                  value={formData.bonuses}
                  onChange={(e) => setFormData((f) => ({ ...f, bonuses: e.target.value }))}
                />
              </label>
              <label className={styles.label}>
                Deductions
                <input
                  type="number"
                  className={styles.input}
                  value={formData.deductions}
                  onChange={(e) => setFormData((f) => ({ ...f, deductions: e.target.value }))}
                />
              </label>
              <label className={styles.label}>
                Overtime hours
                <input
                  type="number"
                  className={styles.input}
                  value={formData.overtimeHours}
                  onChange={(e) => setFormData((f) => ({ ...f, overtimeHours: e.target.value }))}
                />
              </label>
              <label className={styles.label}>
                Overtime rate
                <input
                  type="number"
                  className={styles.input}
                  value={formData.overtimeRate}
                  onChange={(e) => setFormData((f) => ({ ...f, overtimeRate: e.target.value }))}
                />
              </label>
            </div>
            <label className={styles.label}>
              Notes
              <input
                type="text"
                className={styles.input}
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSubtle} onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button type="button" className={styles.btnPrimary} disabled={isSaving} onClick={handleSave}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
