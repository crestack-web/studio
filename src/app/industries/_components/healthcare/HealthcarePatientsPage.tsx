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

function ageFromDob(dob?: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return years >= 0 && years < 130 ? years : null;
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
  const [metrics, setMetrics] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dupes, setDupes] = useState<any[] | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sex, setSex] = useState('');
  const [dob, setDob] = useState('');
  const [notes, setNotes] = useState('');
  const [force, setForce] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/industries/healthcare/patients?${params}`, { headers: h });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load patients');
      setPatients(json.patients || []);
      setMetrics(json.metrics || { total: 0, active: 0, inactive: 0 });
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    setDupes(null);
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
      setForce(false);
      setMsg('Patient registered');
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

  const rows = useMemo(() => patients, [patients]);

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Busmo Healthcare</p>
          <h1 className={styles.title}>Patients</h1>
          <p className={styles.sub}>
            Clinic registry — phone-first records linked to appointments, visits and billing.
          </p>
        </div>
        <div className={styles.row}>
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
          <div className={styles.metricLabel}>Inactive</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.inactive}</div>
        </div>
      </div>

      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.msgErr}>{err}</p> : null}
      {dupes?.length ? (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Possible matches</p>
          <ul className={styles.list}>
            {dupes.map((d) => (
              <li key={d.id} className={styles.item}>
                <div>
                  <div className={styles.itemTitle}>{patientName(d)}</div>
                  <div className={styles.itemMeta}>{d.phone || 'No phone'}</div>
                </div>
                <StatusPill status={d.status || 'active'} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => {
              setForce(true);
              setDupes(null);
              setErr('Click “Register patient” again to save anyway.');
            }}
          >
            Save as new patient anyway
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
                placeholder="Ada Okafor"
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
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label className={styles.label}>Sex</label>
                <select className={styles.select} value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="">Unspecified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label className={styles.label}>Date of birth</label>
                <input className={styles.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={styles.label}>Admin notes</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferences, alerts — not a full clinical chart"
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : force ? 'Register anyway' : 'Register patient'}
            </button>
          </form>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Patient list</h3>
            <span className={styles.panelMeta}>{rows.length} shown</span>
          </div>
          <div className={styles.chips}>
            <input
              className={styles.input}
              style={{ flex: '1 1 160px', minWidth: 140 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone…"
            />
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
          ) : !rows.length ? (
            <p className={styles.empty}>
              No patients yet. Register one here or check in a walk-in at Reception.
            </p>
          ) : (
            <ul className={styles.list}>
              {rows.map((p) => {
                const age = ageFromDob(p.date_of_birth);
                const meta = [p.phone, age != null ? `${age}y` : null, p.sex, p.email]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={p.id} className={styles.item}>
                    <div>
                      <div className={styles.itemTitle}>
                        {p.patient_code ? <span className={styles.code}>{p.patient_code}</span> : null}
                        {patientName(p)}
                      </div>
                      <div className={styles.itemMeta}>{meta || 'No contact details'}</div>
                      {p.notes ? (
                        <div className={styles.itemMeta}>{String(p.notes).slice(0, 80)}</div>
                      ) : null}
                    </div>
                    <div className={styles.row}>
                      <StatusPill status={p.status || 'active'} />
                      <Link href={`${config.dashboardPath}/appointments`} className={styles.btnGhost}>
                        Book
                      </Link>
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
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
