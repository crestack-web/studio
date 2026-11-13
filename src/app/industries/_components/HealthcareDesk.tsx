'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import { StaffDeskShell } from './StaffDeskShell';
import styles from './FrontDesk.module.css';

export function HealthcareDesk({ config }: { config: IndustryConfig }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [registry, setRegistry] = useState<any[]>([]);

  const headers = useCallback(async () => {
    const { data: s } = await getSupabase().auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (s.session?.access_token) headers.Authorization = `Bearer ${s.session.access_token}`;
    return headers;
  }, []);

  const load = useCallback(async () => {
    try {
      const h = await headers();
      const [deskRes, patientsRes] = await Promise.all([
        fetch('/api/industries/healthcare/desk', { headers: h }),
        fetch('/api/industries/healthcare/patients?status=active&limit=100', { headers: h }),
      ]);
      const json = await deskRes.json();
      if (!deskRes.ok) throw new Error(json.error || 'Failed');
      setData(json);
      const pj = await patientsRes.json().catch(() => ({}));
      setRegistry(pj.patients || json.patients || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    }
  }, [headers]);

  useEffect(() => {
    load();
  }, [load]);

  const suggestions = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q || patientId) return [];
    return registry
      .filter((p) => {
        const name = String(p.full_name || p.name || '').toLowerCase();
        const ph = String(p.phone || '');
        return name.includes(q) || ph.includes(q);
      })
      .slice(0, 6);
  }, [registry, patientQuery, patientId]);

  function pickPatient(p: any) {
    setPatientId(p.id);
    const name = String(p.full_name || p.name || '');
    setPatientName(name);
    setPatientQuery(name);
    setPhone(p.phone || '');
  }

  function clearPick() {
    setPatientId(null);
    setPatientName('');
    setPatientQuery('');
    setPhone('');
  }

  async function walkIn(e: React.FormEvent) {
    e.preventDefault();
    const name = patientName.trim() || patientQuery.trim();
    if (!name) return;
    setBusy(true);
    try {
      const h = await headers();
      // Prefer appointments API so new walk-ins also create/link patient
      await fetch('/api/industries/healthcare/appointments', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'appointment_create',
          patientId: patientId || null,
          patientName: name,
          phone: phone.trim() || null,
          status: 'checked_in',
          scheduledAt: new Date().toISOString(),
          reason: 'Walk-in',
        }),
      });
      clearPick();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      const h = await headers();
      await fetch('/api/industries/healthcare/appointments', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'appointment_update', id, status }),
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
      subtitle="Today's appointments and walk-ins"
      brandName={brand.display_name || 'Clinic reception'}
      logoUrl={data?.branding?.logo_url || config.logoSrc || null}
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
      warning={null}
      actions={
        <form onSubmit={walkIn} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start', position: 'relative' }}>
          <div style={{ position: 'relative', minWidth: 180 }}>
            <input
              value={patientQuery}
              onChange={(e) => {
                setPatientQuery(e.target.value);
                setPatientName(e.target.value);
                setPatientId(null);
              }}
              placeholder="Name or phone — search registry"
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e8e8f0', minWidth: 180, width: '100%' }}
            />
            {suggestions.length ? (
              <ul
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  margin: '4px 0 0',
                  padding: 0,
                  listStyle: 'none',
                  background: '#fff',
                  border: '1px solid #e8e8f0',
                  borderRadius: 10,
                  boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                  maxHeight: 160,
                  overflow: 'auto',
                }}
              >
                {suggestions.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pickPatient(p)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        background: 'transparent',
                        padding: '10px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      <strong>{p.full_name || p.name}</strong>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{p.phone || 'No phone'}</div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {!patientId ? (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (new)"
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e8e8f0', width: 120 }}
            />
          ) : (
            <button type="button" onClick={clearPick} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e8e8f0', background: '#fff', cursor: 'pointer' }}>
              Clear
            </button>
          )}
          <button type="submit" disabled={busy} className={styles.primaryBtn} style={{ border: 'none', cursor: 'pointer' }}>
            {busy ? '…' : 'Check in'}
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
                      {a.patient_id ? ' · on file' : ''}
                    </div>
                  </div>
                  <div className={styles.bookingActions}>
                    <span className={styles.statusPill}>{String(a.status || '').replace(/_/g, ' ')}</span>
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
                    {a.status !== 'cancelled' && a.status !== 'completed' ? (
                      <button type="button" disabled={busy} onClick={() => setStatus(a.id, 'cancelled')}>
                        Cancel
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
            <h2>Quick links</h2>
          </div>
          <ul className={styles.bookingList}>
            <li className={styles.bookingRow}>
              <div>
                <div className={styles.guestName}>Patient registry</div>
                <div className={styles.bookingMeta}>Register or update patient details</div>
              </div>
              <button type="button" onClick={() => router.push(`${config.dashboardPath}/patients`)}>
                Open
              </button>
            </li>
            <li className={styles.bookingRow}>
              <div>
                <div className={styles.guestName}>Book appointment</div>
                <div className={styles.bookingMeta}>Schedule for later today or another day</div>
              </div>
              <button type="button" onClick={() => router.push(`${config.dashboardPath}/appointments`)}>
                Open
              </button>
            </li>
          </ul>
        </section>
      </div>
    </StaffDeskShell>
  );
}
