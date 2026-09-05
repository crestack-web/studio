'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, fetchDoc, addDoc, updateDoc, deleteDoc, runBatch, toISOString, toDate } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
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
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary?: number;
  salary?: number;
  active?: boolean;
  status?: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
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
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankStaffId, setBankStaffId] = useState('');
  const [bankForm, setBankForm] = useState({
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  const [resolvingAccount, setResolvingAccount] = useState(false);
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

  const authHeaders = useCallback(async () => {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const loadWallet = useCallback(async () => {
    if (!businessId) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/wallet?businessId=${encodeURIComponent(businessId)}`, {
        headers,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load wallet');
      setWalletBalance(Number(json.balance) || 0);
      const list: WalletTx[] = (Array.isArray(json.transactions) ? json.transactions : []).map(
        (row: any) => ({
          id: row.id,
          type: row.type === 'debit' ? 'payout' : 'deposit',
          amount: Number(row.amount) || 0,
          note: row.description || row.purpose || undefined,
          balanceAfter: Number(row.balanceAfter) || 0,
          createdAt: row.createdAt ? new Date(row.createdAt) : null,
        })
      );
      setWalletTx(list.slice(0, 20));
    } catch (e) {
      console.error('Failed to load wallet', e);
    }
  }, [businessId, authHeaders]);

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
        bankName: data.bankName || data.bank_name || '',
        bankCode: data.bankCode || data.bank_code || '',
        accountNumber: data.accountNumber || data.account_number || '',
        accountName: data.accountName || data.account_name || '',
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
        name: data.name || data.fullName || 'Staff',
        role: data.role || 'Staff',
        baseSalary: Number(data.baseSalary ?? data.salary) || 0,
        salary: Number(data.salary ?? data.baseSalary) || 0,
        active: data.active !== false,
        status: data.status,
        bankName: data.bankName || data.bank_name || '',
        bankCode: data.bankCode || data.bank_code || '',
        accountNumber: data.accountNumber || data.account_number || '',
        accountName: data.accountName || data.account_name || '',
      })) as StaffMember[];
      setStaffMembers(
        staff.filter((s) => s.status !== 'removed' && s.status !== 'banned')
      );
    } catch (e) {
      console.error('Failed to load staff', e);
    }
  }, [businessId]);

  const loadBanks = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/payroll/banks', { headers });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json.banks)) setBanks(json.banks);
    } catch (e) {
      console.error('Failed to load banks', e);
    }
  }, [authHeaders]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await Promise.all([loadPayrollEntries(), loadStaffMembers(), loadWallet(), loadBanks()]);
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPayrollEntries, loadStaffMembers, loadWallet, loadBanks]);

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
    if (!Number.isFinite(amount) || amount < 100) {
      showToast('Enter at least ₦100 to fund the Busmo wallet');
      return;
    }
    setIsFunding(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          amount,
          callbackUrl: `${window.location.origin}/owner/dashboard?walletFunded=1`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not start funding');
      if (json.reference) sessionStorage.setItem('busmo_wallet_ref', json.reference);
      if (json.authorizationUrl) {
        window.location.href = json.authorizationUrl;
        return;
      }
      throw new Error('No payment URL returned');
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'Failed to fund wallet');
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

  const openBankModal = (staffId: string) => {
    const s = staffMembers.find((x) => x.id === staffId);
    setBankStaffId(staffId);
    setBankForm({
      bankCode: s?.bankCode || '',
      bankName: s?.bankName || '',
      accountNumber: s?.accountNumber || '',
      accountName: s?.accountName || '',
    });
    setShowBankModal(true);
  };

  const resolveAccountName = async () => {
    if (!bankForm.bankCode || bankForm.accountNumber.replace(/\D/g, '').length < 10) {
      showToast('Select a bank and enter a 10-digit account number');
      return;
    }
    setResolvingAccount(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/payroll/resolve-account', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bankCode: bankForm.bankCode,
          accountNumber: bankForm.accountNumber,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not resolve account');
      setBankForm((f) => ({ ...f, accountName: json.accountName || f.accountName }));
      showToast(`Account name: ${json.accountName}`);
    } catch (e: any) {
      showToast(e?.message || 'Account resolve failed');
    } finally {
      setResolvingAccount(false);
    }
  };

  const saveStaffBank = async () => {
    if (!businessId || !bankStaffId) return;
    const accountNumber = bankForm.accountNumber.replace(/\D/g, '');
    if (!bankForm.bankCode || accountNumber.length < 10) {
      showToast('Bank and 10-digit account number are required');
      return;
    }
    setIsSaving(true);
    try {
      const bankName =
        bankForm.bankName ||
        banks.find((b) => b.code === bankForm.bankCode)?.name ||
        '';
      await updateDoc(`businesses/${businessId}/staff`, bankStaffId, {
        bankCode: bankForm.bankCode,
        bankName,
        accountNumber,
        accountName: bankForm.accountName || '',
      });
      showToast('Staff bank details saved');
      setShowBankModal(false);
      await loadStaffMembers();
    } catch (e: any) {
      showToast(e?.message || 'Failed to save bank details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkPay = async () => {
    if (!businessId || selectedEntries.length === 0) return;
    if (walletBalance < selectedTotal) {
      showToast('Insufficient Busmo wallet balance. Fund your wallet first.');
      return;
    }
    // Require bank details on staff for each entry
    for (const entry of selectedEntries) {
      const staff = staffMembers.find((s) => s.id === entry.staffId);
      const hasBank =
        (entry.accountNumber && entry.bankCode) ||
        (staff?.accountNumber && staff?.bankCode);
      if (!hasBank) {
        showToast(`Add bank details for ${entry.staffName} before paying`);
        if (entry.staffId) openBankModal(entry.staffId);
        return;
      }
    }

    setIsPaying(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/payroll/pay', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          entryIds: selectedEntries.map((e) => e.id),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.error === 'insufficient_balance') {
          showToast('Insufficient Busmo wallet balance. Fund your wallet first.');
        } else {
          throw new Error(json.error || 'Payroll payout failed');
        }
        return;
      }

      if (typeof json.balance === 'number') setWalletBalance(json.balance);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      const paid = Number(json.paid) || 0;
      const failed = Number(json.failed) || 0;
      if (failed > 0) {
        showToast(`Paid ${paid} staff. ${failed} failed — wallet refunded for failures.`);
      } else {
        showToast(`Paid ${paid} staff via Paystack — ${formatMoney(selectedTotal)}`);
      }
      await Promise.all([loadPayrollEntries(), loadWallet()]);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'Bulk payout failed. Try again.');
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
          <div className={styles.walletLabel}>Busmo wallet</div>
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
            <h3 className={styles.modalTitle}>Add money to Busmo wallet</h3>
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
              You are about to transfer salaries to <strong>{selectedEntries.length}</strong> staff
              (total <strong>{formatMoney(selectedTotal)}</strong>) from your Busmo wallet via Paystack
              to each staff bank account.
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
              {selectedEntries.slice(0, 8).map((e) => {
                const staff = staffMembers.find((s) => s.id === e.staffId);
                const bank = e.accountNumber || staff?.accountNumber;
                return (
                  <li key={e.id}>
                    {e.staffName} — {formatMoney(e.netSalary)}
                    {bank ? (
                      <span className={styles.muted}> · ···{String(bank).slice(-4)}</span>
                    ) : (
                      <span className={styles.errorText}> · no bank</span>
                    )}
                  </li>
                );
              })}
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


      {showBankModal && (
        <div className={styles.overlay} onClick={() => setShowBankModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Staff bank details</h3>
            <p className={styles.modalDesc}>
              Required for salary transfers. Account name should match the bank records.
            </p>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Staff</span>
                <select
                  value={bankStaffId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setBankStaffId(id);
                    const s = staffMembers.find((x) => x.id === id);
                    setBankForm({
                      bankCode: s?.bankCode || '',
                      bankName: s?.bankName || '',
                      accountNumber: s?.accountNumber || '',
                      accountName: s?.accountName || '',
                    });
                  }}
                >
                  <option value="">Select staff</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.accountNumber ? '✓' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Bank</span>
                <select
                  value={bankForm.bankCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const b = banks.find((x) => x.code === code);
                    setBankForm((f) => ({
                      ...f,
                      bankCode: code,
                      bankName: b?.name || f.bankName,
                    }));
                  }}
                >
                  <option value="">Select bank</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Account number</span>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  value={bankForm.accountNumber}
                  onChange={(e) =>
                    setBankForm((f) => ({
                      ...f,
                      accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                    }))
                  }
                  placeholder="0123456789"
                />
              </label>
              <label className={styles.field}>
                <span>Account name</span>
                <div className={styles.inlineRow}>
                  <input
                    value={bankForm.accountName}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountName: e.target.value }))}
                    placeholder="As on bank account"
                  />
                  <button
                    type="button"
                    className={styles.btnSubtle}
                    disabled={resolvingAccount}
                    onClick={resolveAccountName}
                  >
                    {resolvingAccount ? '…' : 'Verify'}
                  </button>
                </div>
              </label>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSubtle} onClick={() => setShowBankModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={isSaving || !bankStaffId}
                onClick={saveStaffBank}
              >
                {isSaving ? 'Saving…' : 'Save bank details'}
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
