'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryShell.module.css';
import { HospitalityAccountSettings, HospitalityHotelSettings } from './hospitality/HospitalitySettingsPages';
import {
  HospitalityRoomsPage,
  HospitalityReservationsPage,
  HospitalityGuestsPage,
  HospitalityHousekeepingPage,
  HospitalityCheckinPage,
  HospitalityRevenuePage,
  HospitalityRoomServicePage,
  HospitalityExpensesPage,
  HospitalityReportsPage,
  HospitalityStaffPage,
  HospitalityWebsitePage,
} from './hospitality/HospitalityModules';
import {
  ProfessionalClientsPage,
  ProfessionalProjectsPage,
  ProfessionalTasksPage,
  ProfessionalInvoicesPage,
  ProfessionalTimePage,
  ProfessionalCalendarPage,
  ProfessionalTeamPage,
  ProfessionalWorkloadPage,
  ProfessionalDeliverablesPage,
  ProfessionalExpensesPage,
  ProfessionalPaymentsPage,
  ProfessionalReportsPage,
} from './professional/ProfessionalModules';
import { SolutionBrandingForm } from './SolutionBrandingForm';

async function authHeaders() {
  const { data } = await getSupabase().auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) h.Authorization = `Bearer ${data.session.access_token}`;
  return h;
}

function naira(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function storageKey(edition: string, module: string) {
  return `busmo_mod_${edition}_${module}`;
}

function readLocal(edition: string, module: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(edition, module));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(edition: string, module: string, rows: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(edition, module), JSON.stringify(rows.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

function Shell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div>
      <div className={styles.greetingRow}>
        <div>
          <p className={styles.eyebrow}>Module</p>
          <h1 className={styles.greetingTitle}>{title}</h1>
          {subtitle ? <p className={styles.greetingSub}>{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function Panel({
  title,
  children,
  meta,
}: {
  title: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{title}</h3>
        {meta ? <span className={styles.panelMeta}>{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  borderRadius: 10,
  border: '1.5px solid #e6e6ef',
  fontSize: 14,
};

type ModuleSpec = {
  titleField: string;
  amount: boolean;
  statuses: string[];
  defaultStatus: string;
  subtitle: string;
  cta: string;
};

function getSpec(section: string, label: string): ModuleSpec {
  const money = ['revenue', 'expenses', 'payments', 'billing', 'fees', 'invoices'].includes(section);
  const base: ModuleSpec = {
    titleField: `${label.replace(/s$/, '')} name`,
    amount: money,
    statuses: money
      ? ['recorded', 'pending', 'paid', 'cancelled']
      : ['open', 'in_progress', 'done', 'cancelled'],
    defaultStatus: money ? 'recorded' : 'open',
    subtitle: `Manage ${label.toLowerCase()} for this workspace.`,
    cta: `Add ${label.replace(/s$/, '').toLowerCase()}`,
  };
  return base;
}

function deskPath(config: IndustryConfig) {
  if (config.id === 'hospitality') return '/industries/hospitality/front-desk';
  if (config.id === 'healthcare') return '/industries/healthcare/front-desk';
  if (config.id === 'education') return '/industries/education/front-desk';
  return '/industries/professional/front-desk';
}

function RecordsModule({
  config,
  section,
  label,
}: {
  config: IndustryConfig;
  section: string;
  label: string;
}) {
  const spec = useMemo(() => getSpec(section, label), [section, label]);
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<'api' | 'local'>('api');

  const load = useCallback(async () => {
    try {
      const h = await authHeaders();
      const res = await fetch(
        `/api/industries/records?edition=${encodeURIComponent(config.id)}&module=${encodeURIComponent(section)}`,
        { headers: h }
      );
      const json = await res.json().catch(() => ({}));
      const apiRows = Array.isArray(json.records) ? json.records : [];
      if (res.ok) {
        setRows(apiRows);
        setSource('api');
        writeLocal(config.id, section, apiRows);
        return;
      }
      const local = readLocal(config.id, section);
      setRows(local);
      setSource(local.length ? 'local' : 'api');
    } catch {
      const local = readLocal(config.id, section);
      setRows(local);
      setSource(local.length ? 'local' : 'api');
    }
  }, [config.id, section]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setMsg(null);
    const payload = {
      edition: config.id,
      module: section,
      title: title.trim(),
      status: spec.defaultStatus,
      amount: spec.amount ? Number(amount) || 0 : 0,
      notes: notes.trim() || null,
      occurredAt: new Date().toISOString(),
    };
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/records', {
        method: 'POST',
        headers: h,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.record) {
        setTitle('');
        setAmount('');
        setNotes('');
        setMsg('Saved');
        await load();
        return;
      }
      const row = { id: `local-${Date.now()}`, ...payload, occurred_at: payload.occurredAt };
      const next = [row, ...readLocal(config.id, section)];
      writeLocal(config.id, section, next);
      setRows(next);
      setSource('local');
      setTitle('');
      setAmount('');
      setNotes('');
      setMsg('Saved on this device');
    } catch {
      setMsg('Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      if (String(id).startsWith('local-') || source === 'local') {
        const merged = rows.map((r) => (r.id === id ? { ...r, status } : r));
        writeLocal(config.id, section, merged);
        setRows(merged);
        return;
      }
      const h = await authHeaders();
      await fetch('/api/industries/records', {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ edition: config.id, id, status }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (filter !== 'all' && String(r.status) !== filter) return false;
    if (!q) return true;
    return `${r.title || ''} ${r.notes || ''}`.toLowerCase().includes(q);
  });

  return (
    <Shell title={label} subtitle={spec.subtitle}>
      {msg ? <p className={styles.greetingSub} style={{ color: '#5b21b6' }}>{msg}</p> : null}
      <div className={styles.split}>
        <Panel title={spec.cta}>
          <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={spec.titleField} style={inputStyle} required />
            {spec.amount ? (
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" placeholder="Amount" style={inputStyle} />
            ) : null}
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" style={inputStyle} />
            <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
              {busy ? 'Saving…' : spec.cta}
            </button>
          </form>
        </Panel>
        <Panel title={`${label} list`} meta={`${filtered.length}`}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ ...inputStyle, marginBottom: 10 }} />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {filtered.map((r) => (
              <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <strong>{r.title}</strong>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{r.status}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {spec.statuses.filter((s) => s !== String(r.status)).slice(0, 2).map((s) => (
                    <button key={s} type="button" className={styles.btnGhost} disabled={busy} onClick={() => setStatus(String(r.id), s)} style={{ padding: '4px 8px', fontSize: 11 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Shell>
  );
}

export function IndustryModuleView({
  config,
  section,
}: {
  config: IndustryConfig;
  section: string;
}) {
  const label = config.nav.find((n) => n.id === section)?.label || section.replace(/-/g, ' ');

  if (section === 'ask-mo') {
    return (
      <Shell title="Ask MO" subtitle={`Assistant for ${config.productName}`}>
        <Panel title="Open assistant">
          <p className={styles.greetingSub}>Use the floating MO button on this console.</p>
        </Panel>
      </Shell>
    );
  }

  if (config.id === 'hospitality' && (section === 'settings' || section === 'hotel-settings')) {
    return <HospitalityHotelSettings />;
  }

  if (section === 'account') {
    return <HospitalityAccountSettings productName={config.productName} />;
  }

  if (section === 'settings') {
    const desk = deskPath(config);
    return (
      <Shell title={`${config.shortName} settings`} subtitle={`Branding for ${config.productName}.`}>
        <div className={styles.split}>
          <Panel title="Workspace branding">
            <SolutionBrandingForm
              edition={config.id}
              dashboardPath={config.dashboardPath}
              loginPath={config.loginPath}
              deskPath={desk}
              noun={config.greetingNoun}
            />
          </Panel>
        </div>
      </Shell>
    );
  }

  if (config.id === 'hospitality') {
    if (section === 'rooms') return <HospitalityRoomsPage config={config} />;
    if (section === 'reservations') return <HospitalityReservationsPage config={config} />;
    if (section === 'guests') return <HospitalityGuestsPage config={config} />;
    if (section === 'housekeeping') return <HospitalityHousekeepingPage config={config} />;
    if (section === 'checkin') return <HospitalityCheckinPage config={config} />;
    if (section === 'room-service') return <HospitalityRoomServicePage config={config} />;
    if (section === 'revenue') return <HospitalityRevenuePage config={config} />;
    if (section === 'expenses') return <HospitalityExpensesPage config={config} />;
    if (section === 'reports') return <HospitalityReportsPage config={config} />;
    if (section === 'staff') return <HospitalityStaffPage config={config} />;
    if (section === 'website') return <HospitalityWebsitePage config={config} />;
  }

  if (config.id === 'professional') {
    if (section === 'projects') return <ProfessionalProjectsPage config={config} />;
    if (section === 'clients') return <ProfessionalClientsPage config={config} />;
    if (section === 'tasks') return <ProfessionalTasksPage config={config} />;
    if (section === 'calendar') return <ProfessionalCalendarPage config={config} />;
    if (section === 'team') return <ProfessionalTeamPage config={config} />;
    if (section === 'time' || section === 'time-tracking') return <ProfessionalTimePage config={config} />;
    if (section === 'workload') return <ProfessionalWorkloadPage config={config} />;
    if (section === 'deliverables') return <ProfessionalDeliverablesPage config={config} />;
    if (section === 'invoices') return <ProfessionalInvoicesPage config={config} />;
    if (section === 'payments') return <ProfessionalPaymentsPage config={config} />;
    if (section === 'expenses') return <ProfessionalExpensesPage config={config} />;
    if (section === 'reports') return <ProfessionalReportsPage config={config} />;
  }

  if (section === 'front-desk') {
    return (
      <Shell title="Staff desk" subtitle="Staff operational desk.">
        <Panel title="Open desk">
          <Link href={deskPath(config)} className={styles.btnPrimary}>
            Open staff desk
          </Link>
        </Panel>
      </Shell>
    );
  }

  return <RecordsModule config={config} section={section} label={label} />;
}
