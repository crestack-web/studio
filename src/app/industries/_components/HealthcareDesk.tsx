'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import { StaffDeskShell } from './StaffDeskShell';
import styles from './FrontDesk.module.css';

export function HealthcareDesk({ config }: { config: IndustryConfig }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [busy, setBusy] = useState(false);

  const headers = useCallback(async () => {
    const { data: s } = await getSupabase().auth.getSession();
    if (!s.session) {
      router.replace(config.loginPath);
      throw new Error('auth');
    }
    return { Authorization: `Bearer ${s.session.access_token}`, 'Content-Type': 'application/json' };
  }, [config.loginPath, router]);

  const load = useCallback(async () => {
    try {
      const h = await headers();
      const res = await fetch('/api/industries/healthcare/desk', { headers: h });
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

  async function walkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) return;
    setBusy(true);
    try {
      const h = await headers();
      await fetch('/api/industries/healthcare/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'appointment',
          patientName: patientName.trim(),
          status: 'checked_in',
          scheduledAt: new Date().toISOString(),
        }),
      });
      setPatientName('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      const h = await headers();
      await fetch('/api/industries/healthcare/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'update_appointment', id, status }),
      });
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
      title="Reception"
      subtitle="Today’s appointments and walk-ins"
      brandName={brand.display_name || 'Clinic reception'}
      logoUrl={brand.logo_url}
      ownerHref={config.dashboardPath}
      nav={[
        { label: 'Reception', href: '/industries/healthcare/front-desk', active: true },
        { label: 'Patients', href: `${config.dashboardPath}/patients` },
        { label: 'Appointments', href: `${config.dashboardPath}/appointments` },
      ]}
      metrics={[
        { label: 'Appointments today', value: m.appointmentsToday ?? 0, hint: 'scheduled on calendar' },
        { label: 'Waiting / due', value: m.waiting ?? 0, hint: 'need attention' },
        { label: 'Completed', value: m.completed ?? 0, hint: 'finished today' },
        { label: 'Patients on file', value: m.patients ?? 0, hint: 'registered' },
      ]}
      error={error}
      warning={data?.warnings?.length ? 'Apply migration 0027_solution_staff_desks.sql if tables are missing. Set logo under Branding.' : null}
      actions={
        <form onSubmit={walkIn} style={{ display: 'flex', gap: 8 }}>
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Walk-in patient name"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e8e8f0', minWidth: 160 }}
          />
          <button type="submit" disabled={busy} className={styles.primaryBtn} style={{ border: 'none', cursor: 'pointer' }}>
            Check in
          </button>
        </form>
      }
    >
      <div className={styles.grid2}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Today&apos;s queue</h2>
          </div>
          <ul className={styles.bookingList}>
            {(data?.appointmentsToday || []).length === 0 ? (
              <li className={styles.empty}>No appointments yet today.</li>
            ) : (
              (data?.appointmentsToday || []).map((a: any) => (
                <li key={a.id} className={styles.bookingRow}>
                  <div>
                    <div className={styles.guestName}>{a.patient_name}</div>
                    <div className={styles.bookingMeta}>
                      {new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {a.reason ? ` · ${a.reason}` : ''}
                    </div>
                  </div>
                  <div className={styles.bookingActions}>
                    <span className={styles.statusPill}>{a.status.replace('_', ' ')}</span>
                    {a.status === 'scheduled' ? (
                      <button type="button" disabled={busy} onClick={() => setStatus(a.id, 'checked_in')}>
                        Check in
                      </button>
                    ) : null}
                    {a.status === 'checked_in' || a.status === 'in_progress' ? (
                      <button type="button" disabled={busy} onClick={() => setStatus(a.id, 'completed')}>
                        Complete
                      </button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Recent patients</h2>
          </div>
          <ul className={styles.bookingList}>
            {(data?.patients || []).slice(0, 12).map((p: any) => (
              <li key={p.id} className={styles.bookingRow}>
                <div>
                  <div className={styles.guestName}>{p.full_name}</div>
                  <div className={styles.bookingMeta}>{p.phone || 'No phone'}</div>
                </div>
              </li>
            ))}
            {(data?.patients || []).length === 0 ? (
              <li className={styles.empty}>No patients on file yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </StaffDeskShell>
  );
}
