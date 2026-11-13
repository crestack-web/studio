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

function StatusPill({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  let bg = '#f1f5f9';
  let fg = '#64748b';
  if (s === 'completed') {
    bg = '#ecfdf5';
    fg = '#059669';
  } else if (s === 'checked_in' || s === 'in_progress') {
    bg = '#fff7ed';
    fg = '#d97706';
  } else if (s === 'scheduled') {
    bg = '#eff6ff';
    fg = '#2563eb';
  } else if (s === 'cancelled') {
    bg = '#fef2f2';
    fg = '#dc2626';
  }
  return (
    <span className={styles.pill} style={{ background: bg, color: fg }}>
      {s.replace(/_/g, ' ')}
    </span>
  );
}

const STATUSES = ['scheduled', 'checked_in', 'completed', 'cancelled'] as const;

export function HealthcareAppointmentsPage({ config }: { config: IndustryConfig }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = useState('all');
  const [rows, setRows] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [patientId, setPatientId] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('09:00');
  const [reason, setReason] = useState('');

  const loadPatients = useCallback(async () => {
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/healthcare/patients?status=active&limit=100', { headers: h });
      const json = await res.json().catch(() => ({}));
      setPatients(json.patients || []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams({ date });
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/industries/healthcare/appointments?${params}`, { headers: h });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setRows(json.appointments || []);
      setMetrics(json.metrics || {});
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [date, filter]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    load();
  }, [load]);

  const suggestions = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q || patientId) return [];
    return patients
      .filter((p) => {
        const name = String(p.full_name || p.name || '').toLowerCase();
        const ph = String(p.phone || '');
        return name.includes(q) || ph.includes(q);
      })
      .slice(0, 6);
  }, [patients, patientQuery, patientId]);

  function pickPatient(p: any) {
    setPatientId(p.id);
    setPatientName(String(p.full_name || p.name || ''));
    setPatientQuery(String(p.full_name || p.name || ''));
    setPhone(p.phone || '');
  }

  function clearPatient() {
    setPatientId('');
    setPatientName('');
    setPatientQuery('');
    setPhone('');
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const name = patientName.trim() || patientQuery.trim();
    if (!name && !patientId) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/healthcare/appointments', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'appointment_create',
          patientId: patientId || null,
          patientName: name,
          phone: phone.trim() || null,
          date,
          time,
          reason: reason.trim() || null,
          status: 'scheduled',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not book');
      clearPatient();
      setReason('');
      setMsg('Appointment booked');
      await load();
      await loadPatients();
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
      const res = await fetch('/api/industries/healthcare/appointments', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'appointment_update', id, status }),
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

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Busmo Healthcare</p>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.sub}>
            Book and manage the clinic queue — linked to your patient registry.
          </p>
        </div>
        <div className={styles.row}>
          <Link href="/industries/healthcare/front-desk" className={styles.btnGhost}>
            Reception
          </Link>
          <Link href={`${config.dashboardPath}/patients`} className={styles.btnGhost}>
            Patients
          </Link>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Today total</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.total ?? 0}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Scheduled</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.scheduled ?? 0}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Waiting</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.checked_in ?? 0}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Completed</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.completed ?? 0}</div>
        </div>
      </div>

      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.msgErr}>{err}</p> : null}

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Book appointment</h3>
          </div>
          <form className={styles.form} onSubmit={create}>
            <div style={{ position: 'relative' }}>
              <label className={styles.label}>Patient</label>
              <input
                className={styles.input}
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value);
                  setPatientName(e.target.value);
                  setPatientId('');
                }}
                placeholder="Search registry or type new name"
                required
              />
              {suggestions.length ? (
                <ul
                  className={styles.list}
                  style={{
                    position: 'absolute',
                    zIndex: 5,
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    marginTop: 4,
                    maxHeight: 180,
                    overflow: 'auto',
                    boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
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
                          padding: '10px 12px',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <strong>{p.full_name || p.name}</strong>
                        <div className={styles.itemMeta}>{p.phone || 'No phone'}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {patientId ? (
                <p className={styles.itemMeta} style={{ marginTop: 6 }}>
                  Linked to registry ·{' '}
                  <button type="button" className={styles.btnGhost} onClick={clearPatient}>
                    Clear
                  </button>
                </p>
              ) : null}
            </div>
            <div>
              <label className={styles.label}>Phone (new patients)</label>
              <input
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080…"
                disabled={Boolean(patientId)}
              />
            </div>
            <div className={styles.row}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label className={styles.label}>Date</label>
                <input
                  className={styles.input}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <label className={styles.label}>Time</label>
                <input
                  className={styles.input}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className={styles.label}>Reason</label>
              <input
                className={styles.input}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Consultation, follow-up…"
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Book appointment'}
            </button>
          </form>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Day queue</h3>
            <span className={styles.panelMeta}>{rows.length}</span>
          </div>
          <div className={styles.chips}>
            <input
              className={styles.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ flex: '0 0 auto', width: 150 }}
            />
            {['all', ...STATUSES].map((f) => (
              <button
                key={f}
                type="button"
                className={filter === f ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                onClick={() => setFilter(f)}
              >
                {String(f).replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : !rows.length ? (
            <p className={styles.empty}>No appointments for this day.</p>
          ) : (
            <ul className={styles.list}>
              {rows.map((a) => (
                <li key={a.id} className={styles.item}>
                  <div>
                    <div className={styles.itemTitle}>{a.patient_name}</div>
                    <div className={styles.itemMeta}>
                      {a.scheduled_at
                        ? new Date(a.scheduled_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                      {a.reason ? ` · ${a.reason}` : ''}
                      {a.patient_id ? ' · linked' : ''}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <StatusPill status={a.status} />
                    {STATUSES.filter((s) => s !== String(a.status))
                      .slice(0, 3)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={styles.btnGhost}
                          disabled={busy}
                          onClick={() => setStatus(a.id, s)}
                        >
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
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
