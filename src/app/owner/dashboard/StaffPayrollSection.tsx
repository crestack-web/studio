'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { initializeFirebase } from '@/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

export interface PayrollStaff {
  id: string;
  name: string;
  role: string;
  salary?: number;
  paymentFrequency?: string;
  nextPaymentDate?: string;
}

interface Props {
  staffMembers: PayrollStaff[];
  businessId: string | undefined;
  userId: string | undefined;
  showToast: (msg: string) => void;
  formatMoney?: (n: number) => string;
  onSalaryConfigured?: (staffId: string, salary: number, frequency: string, nextDate: string) => void;
  onOpenConfigure?: (staff?: PayrollStaff) => void;
}

function fmt(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function StaffPayrollSection({
  staffMembers,
  businessId,
  userId,
  showToast,
  formatMoney = fmt,
  onSalaryConfigured,
}: Props) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFund, setShowFund] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configStaffId, setConfigStaffId] = useState('');
  const [configSalary, setConfigSalary] = useState('');
  const [configFreq, setConfigFreq] = useState('monthly');
  const [configDate, setConfigDate] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundNote, setFundNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<{ id: string; type: string; amount: number; note: string; balanceAfter: number }[]>([]);

  const loadWallet = useCallback(async () => {
    if (!businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const walletRef = doc(firestore, 'businesses', businessId, 'settings', 'payrollWallet');
      const snap = await getDoc(walletRef);
      setWalletBalance(Number(snap.data()?.balance) || 0);
      const txSnap = await getDocs(collection(firestore, 'businesses', businessId, 'walletTransactions'));
      const rows = txSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type || 'deposit',
          amount: Number(data.amount) || 0,
          note: data.note || '',
          balanceAfter: Number(data.balanceAfter) || 0,
        };
      });
      setTx(rows.slice(0, 12));
    } catch (e) {
      console.error(e);
    }
  }, [businessId]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const configured = staffMembers.filter((s) => Number(s.salary) > 0);
  const selectedStaff = configured.filter((s) => selected.has(s.id));
  const selectedTotal = selectedStaff.reduce((s, m) => s + (Number(m.salary) || 0), 0);

  const handleFund = async () => {
    if (!businessId) return;
    const amount = parseFloat(fundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a valid amount');
      return;
    }
    setBusy(true);
    try {
      const { firestore } = initializeFirebase();
      const walletRef = doc(firestore, 'businesses', businessId, 'settings', 'payrollWallet');
      await setDoc(walletRef, { balance: increment(amount), updatedAt: serverTimestamp() }, { merge: true });
      const snap = await getDoc(walletRef);
      const newBalance = Number(snap.data()?.balance) || amount;
      await addDoc(collection(firestore, 'businesses', businessId, 'walletTransactions'), {
        type: 'deposit',
        amount,
        note: fundNote.trim() || 'Wallet top-up',
        balanceAfter: newBalance,
        createdAt: serverTimestamp(),
        createdBy: userId || null,
      });
      setWalletBalance(newBalance);
      setShowFund(false);
      setFundAmount('');
      setFundNote('');
      showToast(`Added ${formatMoney(amount)} to payroll wallet`);
      await loadWallet();
    } catch (e) {
      console.error(e);
      showToast('Failed to fund wallet');
    } finally {
      setBusy(false);
    }
  };

  const handleBulkPay = async () => {
    if (!businessId || selectedStaff.length === 0) return;
    if (walletBalance < selectedTotal) {
      showToast('Insufficient wallet balance. Add money first.');
      return;
    }
    setBusy(true);
    try {
      const { firestore } = initializeFirebase();
      const walletRef = doc(firestore, 'businesses', businessId, 'settings', 'payrollWallet');
      const batch = writeBatch(firestore);
      batch.set(walletRef, { balance: increment(-selectedTotal), updatedAt: serverTimestamp() }, { merge: true });
      const period = new Date().toISOString().slice(0, 7);
      for (const s of selectedStaff) {
        const payRef = doc(collection(firestore, 'businesses', businessId, 'payroll'));
        batch.set(payRef, {
          staffId: s.id,
          staffName: s.name,
          staffRole: s.role || 'Staff',
          period,
          baseSalary: Number(s.salary) || 0,
          bonuses: 0,
          deductions: 0,
          overtimeHours: 0,
          overtimeRate: 0,
          overtimePay: 0,
          netSalary: Number(s.salary) || 0,
          status: 'paid',
          paidDate: serverTimestamp(),
          paidFromWallet: true,
          createdAt: serverTimestamp(),
        });
        // update staff next payment date roughly +1 month
        const staffRef = doc(firestore, 'businesses', businessId, 'staff', s.id);
        batch.set(
          staffRef,
          {
            lastPaidAt: serverTimestamp(),
            lastPaidAmount: Number(s.salary) || 0,
          },
          { merge: true }
        );
      }
      await batch.commit();
      const snap = await getDoc(walletRef);
      const newBalance = Number(snap.data()?.balance) || 0;
      await addDoc(collection(firestore, 'businesses', businessId, 'walletTransactions'), {
        type: 'payout',
        amount: selectedTotal,
        note: `Bulk salary payout (${selectedStaff.length} staff)`,
        balanceAfter: newBalance,
        staffIds: selectedStaff.map((s) => s.id),
        staffNames: selectedStaff.map((s) => s.name),
        createdAt: serverTimestamp(),
        createdBy: userId || null,
      });
      setWalletBalance(newBalance);
      setSelected(new Set());
      setShowPay(false);
      showToast(`Paid ${selectedStaff.length} staff — ${formatMoney(selectedTotal)}`);
      await loadWallet();
    } catch (e) {
      console.error(e);
      showToast('Bulk payout failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!businessId || !configStaffId) return;
    const salary = parseFloat(configSalary);
    if (!Number.isFinite(salary) || salary < 0) {
      showToast('Enter a valid salary');
      return;
    }
    setBusy(true);
    try {
      const { firestore } = initializeFirebase();
      await updateDoc(doc(firestore, 'businesses', businessId, 'staff', configStaffId), {
        salary,
        baseSalary: salary,
        paymentFrequency: configFreq,
        nextPaymentDate: configDate || null,
        updatedAt: serverTimestamp(),
      });
      onSalaryConfigured?.(configStaffId, salary, configFreq, configDate);
      setShowConfig(false);
      showToast('Salary configured');
    } catch (e) {
      console.error(e);
      showToast('Failed to save salary');
    } finally {
      setBusy(false);
    }
  };

  const openConfig = (staff?: PayrollStaff) => {
    if (staff) {
      setConfigStaffId(staff.id);
      setConfigSalary(String(staff.salary || ''));
      setConfigFreq(staff.paymentFrequency || 'monthly');
      setConfigDate(staff.nextPaymentDate || '');
    } else {
      setConfigStaffId(staffMembers[0]?.id || '');
      setConfigSalary('');
      setConfigFreq('monthly');
      setConfigDate('');
    }
    setShowConfig(true);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllConfigured = () => {
    setSelected(new Set(configured.map((s) => s.id)));
  };

  return (
    <div style={{ padding: 4 }}>
      {/* Wallet */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          padding: '16px 18px',
          marginBottom: 16,
          borderRadius: 12,
          border: '1px solid color-mix(in srgb, var(--purple) 25%, var(--border))',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), var(--surface))',
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)' }}>
            Payroll wallet
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)', margin: '4px 0' }}>
            {formatMoney(walletBalance)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            Add money, then pay selected staff in bulk.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="primary" size="sm" onClick={() => setShowFund(true)}>
            + Add money
          </Button>
          <Button
            variant="subtle"
            size="sm"
            disabled={selectedStaff.length === 0}
            onClick={() => setShowPay(true)}
          >
            Pay selected ({selectedStaff.length})
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Button variant="primary" size="sm" onClick={() => openConfig()}>
          + Configure Salary
        </Button>
        <Button variant="subtle" size="sm" onClick={selectAllConfigured} disabled={configured.length === 0}>
          Select all with salary
        </Button>
      </div>

      {staffMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
          Add staff members first, then configure their salaries.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {staffMembers.map((member) => {
            const hasSalary = Number(member.salary) > 0;
            return (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="checkbox"
                  disabled={!hasSalary}
                  checked={selected.has(member.id)}
                  onChange={() => toggle(member.id)}
                  aria-label={`Select ${member.name}`}
                />
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{member.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{member.role || 'Staff'}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>
                  {hasSalary ? formatMoney(Number(member.salary)) : '—'}
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: hasSalary ? 'var(--green-bg, #d1fae5)' : 'var(--amber-bg, #fef3c7)',
                    color: hasSalary ? 'var(--green, #047857)' : 'var(--amber, #b45309)',
                  }}
                >
                  {hasSalary ? 'Configured' : 'Not set'}
                </span>
                <Button variant="subtle" size="sm" onClick={() => openConfig(member)}>
                  {hasSalary ? 'Edit' : 'Set salary'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {tx.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>Recent wallet activity</div>
          {tx.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ fontWeight: 700, color: t.type === 'deposit' ? '#047857' : '#dc2626', minWidth: 90 }}>
                {t.type === 'deposit' ? '+' : '−'}
                {formatMoney(t.amount)}
              </span>
              <span style={{ flex: 1, color: 'var(--text-2)' }}>{t.note}</span>
              <span style={{ color: 'var(--text-3)' }}>Bal {formatMoney(t.balanceAfter)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fund modal */}
      {showFund && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={() => setShowFund(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: 20,
              width: '100%',
              maxWidth: 400,
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-1)' }}>Add money to payroll wallet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: 12 }}>
              Record funds available to pay staff salaries.
            </p>
            <label style={{ display: 'block', marginBottom: 12, fontSize: '0.8rem', fontWeight: 600 }}>
              Amount
              <input
                type="number"
                min="1"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-1)',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 16, fontSize: '0.8rem', fontWeight: 600 }}>
              Note
              <input
                value={fundNote}
                onChange={(e) => setFundNote(e.target.value)}
                placeholder="Bank transfer, cash…"
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-1)',
                }}
              />
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="subtle" onClick={() => setShowFund(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleFund} disabled={busy}>
                {busy ? 'Adding…' : 'Add to wallet'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk pay */}
      {showPay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={() => setShowPay(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: 20,
              width: '100%',
              maxWidth: 420,
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px' }}>Pay selected staff</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
              Pay <strong>{selectedStaff.length}</strong> staff a total of{' '}
              <strong>{formatMoney(selectedTotal)}</strong> from the payroll wallet.
            </p>
            <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, margin: '12px 0', fontSize: '0.85rem' }}>
              <div>Wallet: {formatMoney(walletBalance)}</div>
              <div>After: {formatMoney(walletBalance - selectedTotal)}</div>
            </div>
            {walletBalance < selectedTotal && (
              <p style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>
                Insufficient balance. Add at least {formatMoney(selectedTotal - walletBalance)}.
              </p>
            )}
            <ul style={{ fontSize: '0.85rem', maxHeight: 140, overflow: 'auto', paddingLeft: 18 }}>
              {selectedStaff.map((s) => (
                <li key={s.id}>
                  {s.name} — {formatMoney(Number(s.salary))}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Button variant="subtle" onClick={() => setShowPay(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={busy || walletBalance < selectedTotal}
                onClick={handleBulkPay}
              >
                {busy ? 'Paying…' : `Pay ${formatMoney(selectedTotal)}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Configure salary */}
      {showConfig && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={() => setShowConfig(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: 20,
              width: '100%',
              maxWidth: 420,
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px' }}>Configure salary</h3>
            <label style={{ display: 'block', marginBottom: 12, fontSize: '0.8rem', fontWeight: 600 }}>
              Staff
              <select
                value={configStaffId}
                onChange={(e) => {
                  setConfigStaffId(e.target.value);
                  const s = staffMembers.find((m) => m.id === e.target.value);
                  if (s) {
                    setConfigSalary(String(s.salary || ''));
                    setConfigFreq(s.paymentFrequency || 'monthly');
                    setConfigDate(s.nextPaymentDate || '');
                  }
                }}
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-1)',
                }}
              >
                <option value="">Select…</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 12, fontSize: '0.8rem', fontWeight: 600 }}>
              Salary amount
              <input
                type="number"
                min="0"
                value={configSalary}
                onChange={(e) => setConfigSalary(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-1)',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 12, fontSize: '0.8rem', fontWeight: 600 }}>
              Frequency
              <select
                value={configFreq}
                onChange={(e) => setConfigFreq(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-1)',
                }}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 16, fontSize: '0.8rem', fontWeight: 600 }}>
              Next payment date
              <input
                type="date"
                value={configDate}
                onChange={(e) => setConfigDate(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-1)',
                }}
              />
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="subtle" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveConfig} disabled={busy || !configStaffId}>
                {busy ? 'Saving…' : 'Save salary'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
