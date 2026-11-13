'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './ProfessionalWorkspace.module.css';
import { Shell, useWorkspace, naira, StatusPill } from './ProfessionalShared';

function RecordModulePage({
  module: moduleName,
  title,
  subtitle,
  titleField,
  amount,
  statuses,
  defaultStatus,
  cta,
}: {
  module: string;
  title: string;
  subtitle: string;
  titleField: string;
  amount?: boolean;
  statuses: string[];
  defaultStatus: string;
  cta: string;
}) {
  const { data, loading, post } = useWorkspace();
  const keyMap: Record<string, string> = {
    invoices: 'invoices',
    'time-tracking': 'timeEntries',
    calendar: 'events',
    deliverables: 'deliverables',
    expenses: 'expenses',
    team: 'team',
    workload: 'workload',
    payments: 'payments',
    projects: 'projects',
  };
  const key = keyMap[moduleName] || moduleName;
  const rows = (data as any)?.[key] || [];
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = filter === 'all' ? rows : rows.filter((r: any) => String(r.status) === filter);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await post({
        action: 'record_create',
        module: moduleName,
        title: name.trim(),
        status: defaultStatus,
        amount: amount ? Number(value) || 0 : 0,
        notes: notes.trim() || null,
      });
      setName('');
      setValue('');
      setNotes('');
      setMsg('Saved');
    } catch (err: any) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={title} subtitle={subtitle}>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>{cta}</h3>
          </div>
          <form className={styles.form} onSubmit={create}>
            <div>
              <label className={styles.label}>{titleField}</label>
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {amount ? (
              <div>
                <label className={styles.label}>
                  {moduleName === 'time-tracking' ? 'Hours / amount' : 'Amount (₦)'}
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            ) : null}
            <div>
              <label className={styles.label}>Notes</label>
              <input
                className={styles.input}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : cta}
            </button>
          </form>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>{title}</h3>
            <span className={styles.panelMeta}>{filtered.length}</span>
          </div>
          <div className={styles.chips}>
            {['all', ...statuses].map((f) => (
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
          ) : !filtered.length ? (
            <p className={styles.empty}>Nothing here yet.</p>
          ) : (
            <ul className={styles.list}>
              {filtered.map((r: any) => (
                <li key={r.id} className={styles.item}>
                  <div>
                    <div className={styles.itemTitle}>{r.title}</div>
                    <div className={styles.itemMeta}>
                      {amount && Number(r.amount) ? naira(Number(r.amount)) : null}
                      {r.notes ? ` · ${String(r.notes).slice(0, 70)}` : ''}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <StatusPill status={r.status} />
                    {statuses
                      .filter((s) => s !== String(r.status))
                      .slice(0, 3)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={styles.btnGhost}
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await post({ action: 'record_update', id: r.id, status: s });
                            } finally {
                              setBusy(false);
                            }
                          }}
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
    </Shell>
  );
}

export function ProfessionalInvoicesPage({ config }: { config: IndustryConfig }) {
  void config;
  return (
    <RecordModulePage
      module="invoices"
      title="Invoices"
      subtitle="Raise, send and track client invoices — outstanding vs collected at a glance."
      titleField="Invoice / client"
      amount
      statuses={['draft', 'sent', 'paid', 'overdue']}
      defaultStatus="draft"
      cta="Create invoice"
    />
  );
}

export function ProfessionalTimePage({ config }: { config: IndustryConfig }) {
  void config;
  return (
    <RecordModulePage
      module="time-tracking"
      title="Time tracking"
      subtitle="Log billable and non-billable time against work. Amount can be hours or value."
      titleField="Work item"
      amount
      statuses={['logged', 'approved']}
      defaultStatus="logged"
      cta="Log time"
    />
  );
}

export function ProfessionalCalendarPage({ config }: { config: IndustryConfig }) {
  void config;
  return (
    <RecordModulePage
      module="calendar"
      title="Calendar"
      subtitle="Meetings, deadlines and client sessions for the firm."
      titleField="Event"
      statuses={['scheduled', 'done', 'cancelled']}
      defaultStatus="scheduled"
      cta="Add event"
    />
  );
}

export function ProfessionalTeamPage({ config }: { config: IndustryConfig }) {
  void config;
  return (
    <RecordModulePage
      module="team"
      title="Team"
      subtitle="People in the firm — start with a clear roster."
      titleField="Team member"
      statuses={['active', 'inactive']}
      defaultStatus="active"
      cta="Add member"
    />
  );
}

export function ProfessionalWorkloadPage({ config }: { config: IndustryConfig }) {
  void config;
  return (
    <RecordModulePage
      module="workload"
      title="Workload"
      subtitle="Balance assignments across the team so delivery stays realistic."
      titleField="Assignment"
      statuses={['open', 'in_progress', 'done']}
      defaultStatus="open"
      cta="Assign work"
    />
  );
}

export function ProfessionalDeliverablesPage({ config }: { config: IndustryConfig }) {
  void config;
  return (
    <RecordModulePage
      module="deliverables"
      title="Deliverables"
      subtitle="Track what you owe clients — pending, delivered, accepted."
      titleField="Deliverable"
      statuses={['pending', 'delivered', 'accepted']}
      defaultStatus="pending"
      cta="Add deliverable"
    />
  );
}

export function ProfessionalExpensesPage({ config }: { config: IndustryConfig }) {
  void config;
  return (
    <RecordModulePage
      module="expenses"
      title="Expenses"
      subtitle="Firm and project spend so profitability stays honest."
      titleField="Expense"
      amount
      statuses={['recorded', 'pending', 'approved']}
      defaultStatus="recorded"
      cta="Add expense"
    />
  );
}

export function ProfessionalPaymentsPage({ config }: { config: IndustryConfig }) {
  void config;
  return (
    <RecordModulePage
      module="payments"
      title="Payments"
      subtitle="Money received against invoices and retainers."
      titleField="Payment reference"
      amount
      statuses={['pending', 'paid', 'failed']}
      defaultStatus="paid"
      cta="Record payment"
    />
  );
}

export function ProfessionalReportsPage({ config }: { config: IndustryConfig }) {
  const { data, loading } = useWorkspace();
  const m = data?.metrics || {};
  return (
    <Shell
      title="Reports"
      subtitle="Ownership view of delivery and cash — export-grade reports come next."
    >
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Clients</div>
          <div className={styles.metricValue}>{loading ? '—' : m.clients ?? 0}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Active projects</div>
          <div className={styles.metricValue}>{loading ? '—' : m.activeProjects ?? 0}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Open tasks</div>
          <div className={styles.metricValue}>{loading ? '—' : m.openTasks ?? 0}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Collected</div>
          <div className={styles.metricValue} style={{ fontSize: '1.05rem' }}>
            {naira(Number(m.paid || 0))}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Outstanding</div>
          <div className={styles.metricValue} style={{ fontSize: '1.05rem' }}>
            {naira(Number(m.outstanding || 0))}
          </div>
        </div>
      </div>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3 className={styles.panelTitle}>How to use this workspace</h3>
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
          <li>Add clients, then create projects with contract value.</li>
          <li>Break work into tasks with due dates and priority.</li>
          <li>Log time and raise invoices as delivery progresses.</li>
          <li>Use Ask MO for a daily brief on what needs attention.</li>
        </ol>
        <div className={styles.row} style={{ marginTop: 14 }}>
          <Link href={config.dashboardPath} className={styles.btnGhost}>
            Overview
          </Link>
          <Link href={`${config.dashboardPath}/invoices`} className={styles.btnGhost}>
            Invoices
          </Link>
        </div>
      </div>
    </Shell>
  );
}
