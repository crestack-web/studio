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

function naira(n: number) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || 'sent').toLowerCase();
  let bg = '#f1f5f9';
  let fg = '#64748b';
  if (s === 'paid') {
    bg = '#ecfdf5';
    fg = '#059669';
  } else if (s === 'sent' || s === 'pending' || s === 'open') {
    bg = '#fff7ed';
    fg = '#d97706';
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

const STATUSES = ['draft', 'sent', 'paid', 'cancelled'] as const;

export function HealthcareBillingPage({ config }: { config: IndustryConfig }) {
  const [bills, setBills] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, outstanding: 0, collected: 0, unpaid: 0, paid: 0 });
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [patientId, setPatientId] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [patientName, setPatientName] = useState('');
  const [visitId, setVisitId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (q.trim()) params.set('q', q.trim());
      const [bRes, pRes, vRes] = await Promise.all([
        fetch(`/api/industries/healthcare/billing?${params}`, { headers: h }),
        fetch('/api/industries/healthcare/patients?status=active&limit=100', { headers: h }),
        fetch('/api/industries/healthcare/visits?status=completed&limit=50', { headers: h }),
      ]);
      const bj = await bRes.json().catch(() => ({}));
      if (!bRes.ok) throw new Error(bj.error || 'Failed to load billing');
      setBills(bj.bills || []);
      setMetrics(bj.metrics || { total: 0, outstanding: 0, collected: 0, unpaid: 0, paid: 0 });
      const pj = await pRes.json().catch(() => ({}));
      setPatients(pj.patients || []);
      const vj = await vRes.json().catch(() => ({}));
      // also include open visits for charging mid-care
      const openRes = await fetch('/api/industries/healthcare/visits?limit=50', { headers: h });
      const oj = await openRes.json().catch(() => ({}));
      const allVisits = [...(vj.visits || []), ...(oj.visits || [])];
      const seen = new Set<string>();
      setVisits(
        allVisits.filter((v: any) => {
          if (seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        })
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

  const recentVisits = useMemo(
    () =>
      visits
        .filter((v) => ['completed', 'open', 'in_progress'].includes(String(v.status)))
        .slice(0, 8),
    [visits]
  );

  function pickPatient(p: any) {
    setPatientId(p.id);
    const name = String(p.full_name || p.name || '');
    setPatientName(name);
    setPatientQuery(name);
  }

  function chargeFromVisit(v: any) {
    setVisitId(v.id);
    setPatientId(v.patient_id || '');
    setPatientName(v.patient_name || '');
    setPatientQuery(v.patient_name || '');
    setDescription(v.chief_complaint ? `Visit: ${v.chief_complaint}` : 'Clinic visit');
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
      const res = await fetch('/api/industries/healthcare/billing', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'bill_create',
          patientId: patientId || null,
          patientName: name,
          visitId: visitId || null,
          amount: Number(amount),
          description: description.trim() || null,
          status: 'sent',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not create bill');
      setPatientId('');
      setPatientQuery('');
      setPatientName('');
      setVisitId('');
      setAmount('');
      setDescription('');
      setMsg('Bill created');
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
      const res = await fetch('/api/industries/healthcare/billing', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'bill_update', id, status }),
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
          <h1 className={styles.title}>Billing</h1>
          <p className={styles.sub}>
            Charge for visits and track what is outstanding vs collected.
          </p>
        </div>
        <div className={styles.row}>
          <Link href={`${config.dashboardPath}/visits`} className={styles.btnGhost}>
            Visits
          </Link>
          <Link href={`${config.dashboardPath}/patients`} className={styles.btnGhost}>
            Patients
          </Link>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Outstanding</div>
          <div className={styles.metricValue} style={{ fontSize: '1.05rem' }}>
            {loading ? '—' : naira(metrics.outstanding)}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Collected</div>
          <div className={styles.metricValue} style={{ fontSize: '1.05rem' }}>
            {loading ? '—' : naira(metrics.collected)}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Unpaid bills</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.unpaid}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Paid</div>
          <div className={styles.metricValue}>{loading ? '—' : metrics.paid}</div>
        </div>
      </div>

      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.msgErr}>{err}</p> : null}

      {recentVisits.length ? (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Charge from a visit</h3>
          </div>
          <ul className={styles.list}>
            {recentVisits.map((v) => (
              <li key={v.id} className={styles.item}>
                <div>
                  <div className={styles.itemTitle}>{v.patient_name}</div>
                  <div className={styles.itemMeta}>
                    {v.chief_complaint || v.notes || 'Visit'}
                    {` · ${String(v.status || '').replace(/_/g, ' ')}`}
                  </div>
                </div>
                <button type="button" className={styles.btnGhost} onClick={() => chargeFromVisit(v)}>
                  Charge
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>New bill</h3>
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
              {visitId ? (
                <p className={styles.itemMeta} style={{ marginTop: 6 }}>
                  Linked to visit
                </p>
              ) : null}
            </div>
            <div>
              <label className={styles.label}>Amount (₦)</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="5000"
              />
            </div>
            <div>
              <label className={styles.label}>Description</label>
              <input
                className={styles.input}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Consultation, labs, procedure…"
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Create bill'}
            </button>
          </form>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Bills</h3>
            <span className={styles.panelMeta}>{bills.length}</span>
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
                {f}
              </button>
            ))}
          </div>
          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : !bills.length ? (
            <p className={styles.empty}>No bills yet. Charge a completed visit or create one manually.</p>
          ) : (
            <ul className={styles.list}>
              {bills.map((b) => (
                <li key={b.id} className={styles.item}>
                  <div>
                    <div className={styles.itemTitle}>{b.patient_name || b.title}</div>
                    <div className={styles.itemMeta}>
                      {naira(Number(b.amount || 0))}
                      {b.description || b.notes ? ` · ${String(b.description || b.notes).slice(0, 60)}` : ''}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <StatusPill status={b.status} />
                    {String(b.status) !== 'paid' ? (
                      <button
                        type="button"
                        className={styles.btnGhost}
                        disabled={busy}
                        onClick={() => setStatus(b.id, 'paid')}
                      >
                        Mark paid
                      </button>
                    ) : null}
                    {String(b.status) !== 'cancelled' && String(b.status) !== 'paid' ? (
                      <button
                        type="button"
                        className={styles.btnGhost}
                        disabled={busy}
                        onClick={() => setStatus(b.id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    ) : null}
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
