'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import { StaffDeskShell } from './StaffDeskShell';
import styles from './FrontDesk.module.css';

function naira(n: number) {
  return `₦${(n || 0).toLocaleString()}`;
}

export function EducationDesk({ config }: { config: IndustryConfig }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const headers = useCallback(async () => {
    // TEMP: auth optional for QA
    const { data: s } = await getSupabase().auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (s.session?.access_token) headers.Authorization = `Bearer ${s.session.access_token}`;
    return headers;
  }, [config.loginPath, router]);

  const load = useCallback(async () => {
    try {
      const h = await headers();
      const res = await fetch('/api/industries/education/desk', { headers: h });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    }
  }, [headers]);

  useEffect(() => {
    load();
  }, [load]);

  async function recordFee(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName.trim() || !amount) return;
    setBusy(true);
    try {
      const h = await headers();
      await fetch('/api/industries/education/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'fee',
          studentName: studentName.trim(),
          amount: Number(amount),
          method: 'cash',
        }),
      });
      setStudentName('');
      setAmount('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  const m = data?.metrics || {};
  const brand = data?.branding || {};

  return (
    <StaffDeskShell
      config={config}
      title="Front office"
      subtitle="Fees, students and today’s collections"
      brandName={brand.display_name || 'School office'}
      logoUrl={brand.logo_url}
      ownerHref={config.dashboardPath}
      nav={[
        { label: 'Front office', href: '/industries/education/front-desk', active: true },
        { label: 'Students', href: `${config.dashboardPath}/students` },
        { label: 'Fees', href: `${config.dashboardPath}/fees` },
      ]}
      metrics={[
        { label: 'Students', value: m.students ?? 0, hint: 'on record' },
        { label: 'Fee receipts today', value: m.feesToday ?? 0, hint: 'transactions' },
        { label: 'Collected today', value: naira(m.collectedToday ?? 0), hint: 'cash & transfers' },
        { label: 'Pending', value: m.pending ?? 0, hint: 'awaiting confirmation' },
      ]}
      error={error}
      warning={null}
      actions={
        <form onSubmit={recordFee} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Student name"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e8e8f0' }}
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e8e8f0', width: 120 }}
          />
          <button type="submit" disabled={busy} className={styles.primaryBtn} style={{ border: 'none', cursor: 'pointer' }}>
            Record fee
          </button>
        </form>
      }
    >
      <div className={styles.grid2}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Today&apos;s fee receipts</h2>
          </div>
          <ul className={styles.bookingList}>
            {(data?.recentFees || []).length === 0 ? (
              <li className={styles.empty}>No fees recorded today.</li>
            ) : (
              (data?.recentFees || []).map((f: any) => (
                <li key={f.id} className={styles.bookingRow}>
                  <div>
                    <div className={styles.guestName}>{f.student_name}</div>
                    <div className={styles.bookingMeta}>
                      {f.method || 'cash'} · {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={styles.statusPill}>{naira(Number(f.amount))}</span>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Students</h2>
          </div>
          <ul className={styles.bookingList}>
            {(data?.students || []).slice(0, 15).map((s: any) => (
              <li key={s.id} className={styles.bookingRow}>
                <div>
                  <div className={styles.guestName}>{s.full_name}</div>
                  <div className={styles.bookingMeta}>{s.class_name || 'Class not set'}</div>
                </div>
              </li>
            ))}
            {(data?.students || []).length === 0 ? (
              <li className={styles.empty}>No students yet — add them from the owner dashboard.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </StaffDeskShell>
  );
}
