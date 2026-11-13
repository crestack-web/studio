'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './HealthcareWorkspace.module.css';

async function authHeaders() {
  const { data } = await getSupabase().auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) h.Authorization = `Bearer ${data.session.access_token}`;
  return h;
}

function patientName(p: any) {
  return String(p.full_name || p.name || '—');
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || 'active').toLowerCase();
  const active = s === 'active';
  return (
    <span
      className={styles.pill}
      style={{
        background: active ? '#ecfdf5' : '#f1f5f9',
        color: active ? '#059669' : '#64748b',
      }}
    >
      {s}
    </span>
  );
}

export function HealthcarePatientsPage({ config }: { config: IndustryConfig }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    with_clinician: 0,
  });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dupes, setDupes] = useState<any[]>([]);
  const [force, setForce] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sex, setSex] = useState('');
  const [dob, setDob] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');

  const loadStaff = useCallback(async () => {
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/healthcare/staff?status=active&limit=100', { headers: h });
      const json = await res.json().catch(() => ({}));
      setStaff(json.staff || []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (q.trim()) params.set('q', q.trim());
      if (staffFilter) params.set('staffId', staffFilter);
      const res = await fetch(`/api/industries/healthcare/patients?${params}`, { headers: h });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load patients');
      setPatients(json.patients || []);
      setMetrics(
        json.metrics || { total: 0, active: 0, inactive: 0, with_clinician: 0 }
      );
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter, q, staffFilter]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const activeStaff = useMemo(
    () =>
      staff.filter((s) => String(s.status || 'active') === 'active'),
    [staff]
  );

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    setDupes([]);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/healthcare/patients', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'patient_create',
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          sex: sex || null,
          dateOfBirth: dob || null,
          notes: notes.trim() || null,
          assignedStaffId: assignedStaffId || null,
          force,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && json.duplicates) {
        setDupes(json.duplicates);
        setErr(json.error || 'Possible duplicate');
        return;
      }
      if (!res.ok) throw new Error(json.error || 'Could not save');
      setFullName('');
      setPhone('');
      setEmail('');
      setSex('');
      setDob('');
      setNotes('');
      setAssignedStaffId('');
      setForce(false);
      setMsg(
        json.patient?.assigned_clinician_name
          ? `Patient registered · clinician ${json.patient.assigned_clinician_name}`
          : 'Patient registered'
      );
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/healthcare/patients', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'patient_update', id, status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Update failed');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function assignClinician(patientId: string, staffId: string) {
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/healthcare/patients', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'patient_update',
          id: patientId,
          assignedStaffId: staffId || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not assign');
      if (json.warning) setMsg(json.warning);
      else setMsg(staffId ? 'Clinician assigned' : 'Clinician cleared');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Assign failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Busmo Healthcare</p>
          <h1 className={styles.title}>Patients</h1>
          <p className={styles.sub}>
            Clinic registry with primary clinician — linked to appointments, visits and billing.
          </p>
        </div>
        <div className={styles.row}>
          <Link href={`${config.dashboardPath}/staff`} className={styles.btnGhost}>
            Clinical staff
          </Link>
          <Link href="/industries/healthcare/front-desk" className={styles.btnGhost}>
            Reception
          </Link>
          <Link href={`${config.dashboardPath}/appointments`} className={styles.btnGhost}>
            Appointments
          </Link>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Total</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.total}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Active</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.active}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>With clinician</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.with_clinician ?? 0}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Inactive</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.inactive}</div>
        </div>
      </div>

      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.msgErr}>{err}</p> : null}
      {dupes.length ? (
        <div className={styles.panel} style={{ marginBottom: 12 }}>
          <p className={styles.itemMeta}>
            Possible duplicates — review or force save.
          </p>
          <ul className={styles.list}>
            {dupes.map((d) => (
              <li key={d.id} className={styles.item}>
                <div>
                  <strong>{patientName(d)}</strong>
                  <div className={styles.itemMeta}>{d.phone}</div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => {
              setForce(true);
              setDupes([]);
              setErr(null);
            }}
          >
            Allow save anyway
          </button>
        </div>
      ) : null}

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Register patient</h3>
          </div>
          <form className={styles.form} onSubmit={create}>
            <div>
              <label className={styles.label}>Full name</label>
              <input
                className={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Patient full name"
              />
            </div>
            <div>
              <label className={styles.label}>Phone</label>
              <input
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080…"
              />
            </div>
            <div>
              <label className={styles.label}>Primary clinician</label>
              <select
                className={styles.select}
                value={assignedStaffId}
                onChange={(e) => setAssignedStaffId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.name || s.title}
                    {s.role ? ` · ${s.role}` : ''}
                  </option>
                ))}
              </select>
              {!activeStaff.length ? (
                <p className={styles.itemMeta} style={{ marginTop: 6 }}>
                  No active staff yet.{' '}
                  <Link href={`${config.dashboardPath}/staff`}>Add clinical staff</Link>
                </p>
              ) : null}
            </div>
            <div>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Sex</label>
                <select className={styles.select} value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="">—</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Date of birth</label>
                <input
                  className={styles.input}
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={styles.label}>Notes</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, preferred language…"
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : force ? 'Save anyway' : 'Register patient'}
            </button>
          </form>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Registry</h3>
            <span className={styles.panelMeta}>{patients.length} shown</span>
          </div>
          <div className={styles.chips}>
            <input
              className={styles.input}
              style={{ flex: '1 1 140px', minWidth: 120 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, clinician…"
            />
            <select
              className={styles.select}
              style={{ flex: '0 1 160px', minWidth: 120 }}
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
            >
              <option value="">All clinicians</option>
              {activeStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.name || s.title}
                </option>
              ))}
            </select>
            {['all', 'active', 'inactive'].map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          {loading ? (
            <p className={styles.empty}>Loading patients…</p>
          ) : !patients.length ? (
            <p className={styles.empty}>No patients match. Register one or clear filters.</p>
          ) : (
            <ul className={styles.list}>
              {patients.map((p) => (
                <li key={p.id} className={styles.item}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.itemTitle}>{patientName(p)}</div>
                    <div className={styles.itemMeta}>
                      {[p.phone, p.sex, p.email].filter(Boolean).join(' · ') || 'No contact yet'}
                    </div>
                    <div className={styles.itemMeta} style={{ marginTop: 6 }}>
                      Clinician:{' '}
                      <select
                        className={styles.select}
                        style={{ display: 'inline-block', width: 'auto', minWidth: 140, padding: '4px 8px' }}
                        value={p.assigned_staff_id || ''}
                        disabled={busy}
                        onChange={(e) => assignClinician(p.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {activeStaff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name || s.name || s.title}
                            {s.role ? ` · ${s.role}` : ''}
                          </option>
                        ))}
                      </select>
                      {!p.assigned_staff_id && p.assigned_clinician_name ? (
                        <span> ({p.assigned_clinician_name})</span>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <StatusPill status={p.status || 'active'} />
                    {String(p.status || 'active') === 'active' ? (
                      <button
                        type="button"
                        className={styles.btnGhost}
                        disabled={busy}
                        onClick={() => setStatus(p.id, 'inactive')}
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.btnGhost}
                        disabled={busy}
                        onClick={() => setStatus(p.id, 'active')}
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
