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

function memberName(m: any) {
  return String(m.full_name || m.name || m.title || '—');
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

const ROLES = [
  'Doctor',
  'Nurse',
  'Midwife',
  'Lab technician',
  'Pharmacist',
  'Receptionist',
  'Admin',
  'Other',
];

export function HealthcareStaffPage({ config }: { config: IndustryConfig }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    doctors: 0,
    nurses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Doctor');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/industries/healthcare/staff?${params}`, { headers: h });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load staff');
      setStaff(json.staff || []);
      setMetrics(
        json.metrics || { total: 0, active: 0, inactive: 0, doctors: 0, nurses: 0 }
      );
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(() => load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/healthcare/staff', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'staff_create',
          fullName: fullName.trim(),
          role: role || null,
          specialty: specialty.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          notes: notes.trim() || null,
          status: 'active',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not save');
      setFullName('');
      setSpecialty('');
      setPhone('');
      setEmail('');
      setNotes('');
      setMsg('Staff member added');
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
      const res = await fetch('/api/industries/healthcare/staff', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'staff_update', id, status }),
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

  const rows = useMemo(() => staff, [staff]);

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Busmo Healthcare</p>
          <h1 className={styles.title}>Clinical staff</h1>
          <p className={styles.sub}>
            Roster for doctors, nurses and clinic team — roles for scheduling and accountability.
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
          <div className={styles.metricLabel}>Doctors</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.doctors}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Nurses</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.nurses}</div>
        </div>
      </div>

      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.msgErr}>{err}</p> : null}

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Add staff</h3>
          </div>
          <form className={styles.form} onSubmit={create}>
            <div>
              <label className={styles.label}>Full name</label>
              <input
                className={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Dr. Ada Okafor"
              />
            </div>
            <div>
              <label className={styles.label}>Role</label>
              <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={styles.label}>Specialty</label>
              <input
                className={styles.input}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="GP, Paediatrics, Lab…"
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
            <div>
              <label className={styles.label}>Notes</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shift prefs, licence notes…"
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Add staff member'}
            </button>
          </form>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Roster</h3>
            <span className={styles.panelMeta}>{rows.length} shown</span>
          </div>
          <div className={styles.chips}>
            <input
              className={styles.input}
              style={{ flex: '1 1 160px', minWidth: 140 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, role, phone…"
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
            <p className={styles.empty}>Loading staff…</p>
          ) : !rows.length ? (
            <p className={styles.empty}>No staff yet. Add your first clinician or receptionist.</p>
          ) : (
            <ul className={styles.list}>
              {rows.map((m) => {
                const meta = [m.role, m.specialty, m.phone, m.email].filter(Boolean).join(' · ');
                return (
                  <li key={m.id} className={styles.item}>
                    <div>
                      <div className={styles.itemTitle}>{memberName(m)}</div>
                      <div className={styles.itemMeta}>{meta || 'No details'}</div>
                      {m.notes ? (
                        <div className={styles.itemMeta}>{String(m.notes).slice(0, 80)}</div>
                      ) : null}
                    </div>
                    <div className={styles.row}>
                      <StatusPill status={m.status || 'active'} />
                      {String(m.status || 'active') === 'active' ? (
                        <button
                          type="button"
                          className={styles.btnGhost}
                          disabled={busy}
                          onClick={() => setStatus(m.id, 'inactive')}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.btnGhost}
                          disabled={busy}
                          onClick={() => setStatus(m.id, 'active')}
                        >
                          Activate
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
