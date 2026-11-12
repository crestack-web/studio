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
  const specs: Record<string, Partial<ModuleSpec>> = {
    clients: {
      titleField: 'Client name',
      statuses: ['active', 'paused', 'closed'],
      defaultStatus: 'active',
      subtitle: 'Client accounts for the firm.',
      cta: 'Add client',
    },
    projects: {
      titleField: 'Project name',
      amount: true,
      statuses: ['active', 'on_hold', 'done'],
      defaultStatus: 'active',
      subtitle: 'Projects and retainers.',
      cta: 'Add project',
    },
    tasks: {
      titleField: 'Task title',
      statuses: ['open', 'in_progress', 'done'],
      defaultStatus: 'open',
      subtitle: 'Operational tasks for the team.',
      cta: 'Add task',
    },
    team: {
      titleField: 'Team member',
      statuses: ['active', 'inactive'],
      defaultStatus: 'active',
      subtitle: 'Team directory.',
      cta: 'Add member',
    },
    invoices: {
      titleField: 'Invoice / client',
      amount: true,
      statuses: ['draft', 'sent', 'paid', 'overdue'],
      defaultStatus: 'draft',
      subtitle: 'Client billing.',
      cta: 'Create invoice',
    },
    calendar: {
      titleField: 'Event',
      statuses: ['scheduled', 'done', 'cancelled'],
      defaultStatus: 'scheduled',
      subtitle: 'Schedule items for the team.',
      cta: 'Add event',
    },
    patients: {
      titleField: 'Patient name',
      statuses: ['active', 'inactive'],
      defaultStatus: 'active',
      subtitle: 'Patient register for the clinic.',
      cta: 'Add patient',
    },
    appointments: {
      titleField: 'Patient / reason',
      statuses: ['scheduled', 'checked_in', 'completed', 'cancelled'],
      defaultStatus: 'scheduled',
      subtitle: 'Appointment book.',
      cta: 'Book appointment',
    },
    visits: {
      titleField: 'Patient visit',
      amount: true,
      statuses: ['open', 'in_progress', 'completed'],
      defaultStatus: 'open',
      subtitle: 'Visit episodes and outcomes.',
      cta: 'Open visit',
    },
    students: {
      titleField: 'Student name',
      statuses: ['active', 'alumni', 'withdrawn'],
      defaultStatus: 'active',
      subtitle: 'Student register for the school.',
      cta: 'Add student',
    },
    classes: {
      titleField: 'Class name',
      statuses: ['active', 'archived'],
      defaultStatus: 'active',
      subtitle: 'Classes and arms.',
      cta: 'Add class',
    },
    attendance: {
      titleField: 'Class or student',
      statuses: ['present', 'absent', 'late'],
      defaultStatus: 'present',
      subtitle: 'Daily attendance marks.',
      cta: 'Mark attendance',
    },
    teachers: {
      titleField: 'Teacher name',
      statuses: ['active', 'on_leave'],
      defaultStatus: 'active',
      subtitle: 'Teaching staff roster.',
      cta: 'Add teacher',
    },
    fees: {
      titleField: 'Student / fee type',
      amount: true,
      statuses: ['recorded', 'pending', 'reversed'],
      defaultStatus: 'recorded',
      subtitle: 'Fee payments.',
      cta: 'Record fee',
    },
    staff: {
      titleField: 'Staff name',
      statuses: ['active', 'off_duty', 'on_leave'],
      defaultStatus: 'active',
      subtitle: 'Team roster.',
      cta: 'Add staff',
    },
    expenses: {
      titleField: 'Expense',
      amount: true,
      statuses: ['recorded', 'pending', 'approved'],
      defaultStatus: 'recorded',
      subtitle: 'Track spend.',
      cta: 'Add expense',
    },
    payments: {
      titleField: 'Payment reference',
      amount: true,
      statuses: ['pending', 'paid', 'failed'],
      defaultStatus: 'paid',
      subtitle: 'Payments ledger.',
      cta: 'Record payment',
    },
    reports: {
      titleField: 'Report name',
      statuses: ['draft', 'ready'],
      defaultStatus: 'ready',
      subtitle: 'Saved report snapshots.',
      cta: 'Save report note',
    },
    workload: {
      titleField: 'Assignment',
      statuses: ['open', 'in_progress', 'done'],
      defaultStatus: 'open',
      subtitle: 'Workload assignments.',
      cta: 'Assign work',
    },
    deliverables: {
      titleField: 'Deliverable',
      statuses: ['pending', 'delivered', 'accepted'],
      defaultStatus: 'pending',
      subtitle: 'Client deliverables.',
      cta: 'Add deliverable',
    },
    'time-tracking': {
      titleField: 'Work item',
      amount: true,
      statuses: ['logged', 'approved'],
      defaultStatus: 'logged',
      subtitle: 'Time entries.',
      cta: 'Log time',
    },
    enrollment: {
      titleField: 'Student and class',
      statuses: ['enrolled', 'pending', 'withdrawn'],
      defaultStatus: 'enrolled',
      subtitle: 'Enrollment records.',
      cta: 'Enroll',
    },
    timetable: {
      titleField: 'Period / class',
      statuses: ['scheduled', 'done'],
      defaultStatus: 'scheduled',
      subtitle: 'School timetable.',
      cta: 'Add period',
    },
    billing: {
      titleField: 'Bill / patient',
      amount: true,
      statuses: ['open', 'paid', 'void'],
      defaultStatus: 'open',
      subtitle: 'Clinic billing.',
      cta: 'Create bill',
    },
  };

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
  const key = section.replace(/_/g, '-');
  return { ...base, ...(specs[section] || specs[key] || {}) };
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
      setMsg(res.status === 401 ? 'Saved on this device (sign in to sync)' : 'Saved on this device');
    } catch {
      const row = {
        id: `local-${Date.now()}`,
        title: payload.title,
        status: payload.status,
        amount: payload.amount,
        notes: payload.notes,
        occurred_at: payload.occurredAt,
      };
      const next = [row, ...readLocal(config.id, section)];
      writeLocal(config.id, section, next);
      setRows(next);
      setMsg('Saved on this device');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      if (String(id).startsWith('local-') || source === 'local') {
        const next = readLocal(config.id, section).map((r) => (r.id === id ? { ...r, status } : r));
        const merged = rows.map((r) => (r.id === id ? { ...r, status } : r));
        writeLocal(config.id, section, next.length ? next : merged);
        setRows(merged);
        return;
      }
      const h = await authHeaders();
      const res = await fetch('/api/industries/records', {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ edition: config.id, id, status }),
      });
      if (!res.ok) {
        const merged = rows.map((r) => (r.id === id ? { ...r, status } : r));
        setRows(merged);
        writeLocal(config.id, section, merged);
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (filter !== 'all' && String(r.status) !== filter) return false;
    if (!q) return true;
    return `${r.title || ''} ${r.notes || ''} ${r.status || ''}`.toLowerCase().includes(q);
  });
  const openCount = rows.filter(
    (r) =>
      !['done', 'completed', 'paid', 'closed', 'checked_out', 'cancelled', 'ready', 'delivered', 'inactive'].includes(
        String(r.status)
      )
  ).length;
  const totalAmount = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <Shell
      title={label}
      subtitle={spec.subtitle}
      actions={
        <Link href={deskPath(config)} className={styles.btnGhost}>
          Staff desk
        </Link>
      }
    >
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Records</div>
          <div className={styles.metricValue}>{rows.length}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Active</div>
          <div className={styles.metricValue}>{openCount}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>{spec.amount ? 'Value' : 'Showing'}</div>
          <div className={styles.metricValue} style={{ fontSize: spec.amount ? '1.1rem' : undefined }}>
            {spec.amount ? naira(totalAmount) : filtered.length}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Storage</div>
          <div className={styles.metricValue} style={{ fontSize: '0.95rem' }}>
            {source === 'api' ? 'Cloud' : 'Device'}
          </div>
        </div>
      </div>

      {msg ? <p className={styles.greetingSub} style={{ color: '#5b21b6', marginBottom: 12 }}>{msg}</p> : null}

      <div className={styles.split}>
        <Panel title={spec.cta}>
          <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={spec.titleField} style={inputStyle} required />
            {spec.amount ? (
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₦)" type="number" min="0" style={inputStyle} />
            ) : null}
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" style={inputStyle} />
            <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
              {busy ? 'Saving…' : spec.cta}
            </button>
          </form>
        </Panel>

        <Panel title={`${label} list`} meta={`${filtered.length} shown`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ ...inputStyle, flex: '1 1 140px', minWidth: 120 }}
            />
            <button type="button" onClick={() => setFilter('all')} className={filter === 'all' ? styles.btnPrimary : styles.btnGhost} style={{ border: filter === 'all' ? 'none' : undefined, padding: '8px 12px', fontSize: 12 }}>
              All
            </button>
            {spec.statuses.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={filter === st ? styles.btnPrimary : styles.btnGhost}
                style={{ border: filter === st ? 'none' : undefined, padding: '8px 12px', fontSize: 12, textTransform: 'capitalize' }}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {!filtered.length ? (
            <p className={styles.greetingSub} style={{ padding: '16px 0', textAlign: 'center' }}>
              No {label.toLowerCase()} yet. Add the first record with the form.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {filtered.map((r) => (
                <li
                  key={r.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '12px 0',
                    borderBottom: '1px solid #f1f5f9',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0, flex: '1 1 160px' }}>
                    <div style={{ fontWeight: 700 }}>{r.title || '—'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {r.notes ? String(r.notes).slice(0, 80) : ''}
                      {r.occurred_at || r.occurredAt ? ` · ${new Date(r.occurred_at || r.occurredAt).toLocaleDateString()}` : ''}
                      {spec.amount && Number(r.amount) ? ` · ${naira(Number(r.amount))}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        color: '#5b21b6',
                        background: '#f3f0ff',
                        padding: '3px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {String(r.status || '').replace(/_/g, ' ')}
                    </span>
                    {spec.statuses
                      .filter((st) => st !== String(r.status))
                      .slice(0, 3)
                      .map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={busy}
                          onClick={() => setStatus(String(r.id), st)}
                          className={styles.btnGhost}
                          style={{ padding: '4px 8px', fontSize: 11, textTransform: 'capitalize' }}
                        >
                          {st.replace(/_/g, ' ')}
                        </button>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
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
          <p className={styles.greetingSub}>MO is industry-aware for {config.shortName}. Use the floating button on this console.</p>
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
      <Shell title={`${config.shortName} settings`} subtitle={`Branding and organization defaults for ${config.productName}.`}>
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
          <Panel title="Quick links">
            <div className={styles.actionsStack}>
              <Link href={config.dashboardPath} className={styles.actionRow}>
                <span>Owner overview</span>
                <span aria-hidden>→</span>
              </Link>
              <Link href={desk} className={styles.actionRow}>
                <span>Staff desk</span>
                <span aria-hidden>→</span>
              </Link>
              <Link href={`${config.dashboardPath}/account`} className={styles.actionRow}>
                <span>Account settings</span>
                <span aria-hidden>→</span>
              </Link>
            </div>
            <p className={styles.panelHint} style={{ marginTop: 12 }}>
              Module data is stored per organization and available on the owner console and staff desk.
            </p>
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
    if (section === 'front-desk') {
      return (
        <Shell title="Front desk" subtitle="Staff operational desk for the property.">
          <Panel title="Open front desk">
            <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
              Go to front desk
            </Link>
          </Panel>
        </Shell>
      );
    }
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
