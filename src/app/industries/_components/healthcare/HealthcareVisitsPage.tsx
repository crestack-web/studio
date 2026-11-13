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
  const s = String(status || 'open').toLowerCase();
  let bg = '#f1f5f9';
  let fg = '#64748b';
  if (s === 'completed') {
    bg = '#ecfdf5';
    fg = '#059669';
  } else if (s === 'in_progress' || s === 'open') {
    bg = '#fff7ed';
    fg = '#d97706';
  }
  return (
    <span className={styles.pill} style={{ background: bg, color: fg }}>
      {s.replace(/_/g, ' ')}
    </span>
  );
}

const STATUSES = ['open', 'in_progress', 'completed'] as const;

export function HealthcareVisitsPage({ config }: { config: IndustryConfig }) {
  const [visits, setVisits] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, open: 0, completed: 0 });
  const [patients, setPatients] = useState<any[]>([]);
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [patientId, setPatientId] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [patientName, setPatientName] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [complaint, setComplaint] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (q.trim()) params.set('q', q.trim());
      const date = new Date().toISOString().slice(0, 10);
      const [vRes, pRes, aRes] = await Promise.all([
        fetch(`/api/industries/healthcare/visits?${params}`, { headers: h }),
        fetch('/api/industries/healthcare/patients?status=active&limit=100', { headers: h }),
        fetch(`/api/industries/healthcare/appointments?date=${date}`, { headers: h }),
      ]);
      const vj = await vRes.json().catch(() => ({}));
      if (!vRes.ok) throw new Error(vj.error || 'Failed to load visits');
      setVisits(vj.visits || []);
      setMetrics(vj.metrics || { total: 0, open: 0, completed: 0 });
      const pj = await pRes.json().catch(() => ({}));
      setPatients(pj.patients || []);
      const aj = await aRes.json().catch(() => ({}));
      setTodayAppts(
        (aj.appointments || []).filter((a: any) =>
          ['scheduled', 'checked_in', 'in_progress'].includes(String(a.status))
        )
      );
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(() => load(), 150);
    return () => clearTimeout(t);
  }, [load]);

  const suggestions = useMemo(() => {
    const query = patientQuery.trim().toLowerCase();
    if (!query || patientId) return [];
    return patients
      .filter((p) => {
        const name = String(p.full_name || p.name || '').toLowerCase();
        const phone = String(p.phone || '');
        return name.includes(query) || phone.includes(query);
      })
      .slice(0, 6);
  }, [patients, patientQuery, patientId]);

  function pickPatient(p: any) {
    setPatientId(p.id);
    const name = String(p.full_name || p.name || '');
    setPatientName(name);
    setPatientQuery(name);
  }

  function pickFromAppt(a: any) {
    setAppointmentId(a.id);
    setPatientId(a.patient_id || '');
    setPatientName(a.patient_name || '');
    setPatientQuery(a.patient_name || '');
    setComplaint(a.reason || '');
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const name = patientName.trim() || patientQuery.trim();
    if (!name) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/healthcare/visits', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'visit_create',
          patientId: patientId || null,
          patientName: name,
          appointmentId: appointmentId || null,
          chiefComplaint: complaint.trim() || null,
          notes: notes.trim() || null,
          status: 'open',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not start visit');
      setPatientId('');
      setPatientQuery('');
      setPatientName('');
      setAppointmentId('');
      setComplaint('');
      setNotes('');
      setMsg('Visit started');
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
      const res = await fetch('/api/industries/healthcare/visits', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'visit_update', id, status }),
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
          <h1 className={styles.title}>Visits</h1>
          <p className={styles.sub}>
            Clinical encounters — start from a patient or today&apos;s appointment queue.
          </p>
        </div>
        <div className={styles.row}>
          <Link href={`${config.dashboardPath}/appointments`} className={styles.btnGhost}>
            Appointments
          </Link>
          <Link href={`${config.dashboardPath}/billing`} className={styles.btnGhost}>
            Billing
          </Link>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Total</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.total}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Open</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.open}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Completed</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.completed}</div>
        </div>
      </div>

      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.msgErr}>{err}</p> : null}

      {todayAppts.length ? (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Start from today&apos;s queue</h3>
            <span className={styles.panelMeta}>{todayAppts.length} waiting / scheduled</span>
          </div>
          <ul className={styles.list}>
            {todayAppts.slice(0, 8).map((a) => (
              <li key={a.id} className={styles.item}>
                <div>
                  <div className={styles.itemTitle}>{a.patient_name}</div>
                  <div className={styles.itemMeta}>
                    {a.scheduled_at
                      ? new Date(a.scheduled_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                    {a.reason ? ` · ${a.reason}` : ''}
                    {` · ${String(a.status || '').replace(/_/g, ' ')}`}
                  </div>
                </div>
                <button type="button" className={styles.btnGhost} onClick={() => pickFromAppt(a)}>
                  Start visit
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Start visit</h3>
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
                placeholder="Search registry or type name"
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
                    maxHeight: 160,
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
              {appointmentId ? (
                <p className={styles.itemMeta} style={{ marginTop: 6 }}>
                  Linked to appointment · will mark it completed when visit starts
                </p>
              ) : null}
            </div>
            <div>
              <label className={styles.label}>Chief complaint</label>
              <input
                className={styles.input}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Why the patient is here"
              />
            </div>
            <div>
              <label className={styles.label}>Admin notes</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional — not a full clinical chart"
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Start visit'}
            </button>
          </form>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Visit list</h3>
            <span className={styles.panelMeta}>{visits.length}</span>
          </div>
          <div className={styles.chips}>
            <input
              className={styles.input}
              style={{ flex: '1 1 140px', minWidth: 120 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
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
          ) : !visits.length ? (
            <p className={styles.empty}>No visits yet. Start one from a patient or today&apos;s queue.</p>
          ) : (
            <ul className={styles.list}>
              {visits.map((v) => (
                <li key={v.id} className={styles.item}>
                  <div>
                    <div className={styles.itemTitle}>{v.patient_name}</div>
                    <div className={styles.itemMeta}>
                      {v.chief_complaint || v.notes || 'No complaint noted'}
                      {v.created_at
                        ? ` · ${new Date(v.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : ''}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <StatusPill status={v.status} />
                    {STATUSES.filter((s) => s !== String(v.status)).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={styles.btnGhost}
                        disabled={busy}
                        onClick={() => setStatus(v.id, s)}
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
