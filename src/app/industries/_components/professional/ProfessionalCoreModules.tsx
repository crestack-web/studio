'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './ProfessionalWorkspace.module.css';
import { Shell, useWorkspace, naira, StatusPill } from './ProfessionalShared';

export function ProfessionalOverviewPage({ config }: { config: IndustryConfig }) {
  const { data, loading, error } = useWorkspace();
  const m = data?.metrics || {};

  return (
    <Shell
      title="Firm overview"
      subtitle="Clients, projects, delivery and cash — one workspace for agencies, consultancies and service firms."
      actions={
        <Link href="/industries/professional/front-desk" className={styles.btnGhost}>
          Staff workspace
        </Link>
      }
    >
      <div className={styles.aiBanner}>
        <div>
          <strong>Ask MO · AI for your firm</strong>
          <p>Ask about open tasks, workload, or overdue invoices — MO is tied to this workspace.</p>
        </div>
        <a href="#ask-mo" className={styles.btnPrimary}>
          Ask MO
        </a>
      </div>

      {error ? <p className={styles.msg}>{error}</p> : null}

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
          <div className={styles.metricLabel}>Outstanding</div>
          <div className={styles.metricValue} style={{ fontSize: '1.05rem' }}>
            {loading ? '—' : naira(Number(m.outstanding || 0))}
          </div>
          <div className={styles.metricHint}>Unpaid invoices</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Today&apos;s focus</h3>
          </div>
          <ul className={styles.list}>
            {(data?.tasks || [])
              .filter((t) => ['open', 'in_progress'].includes(String(t.status)))
              .slice(0, 6)
              .map((t) => (
                <li key={t.id} className={styles.item}>
                  <div>
                    <div className={styles.itemTitle}>{t.title}</div>
                    <div className={styles.itemMeta}>
                      {t.client_name || 'Internal'}
                      {t.due_date ? ` · due ${new Date(t.due_date).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <StatusPill status={t.status} />
                </li>
              ))}
            {!loading && !(data?.tasks || []).length ? (
              <li className={styles.empty}>No open tasks. Create work on the Tasks board.</li>
            ) : null}
          </ul>
          <div className={styles.row} style={{ marginTop: 12 }}>
            <Link href={`${config.dashboardPath}/tasks`} className={styles.btnGhost}>
              Open tasks
            </Link>
            <Link href={`${config.dashboardPath}/projects`} className={styles.btnGhost}>
              Projects
            </Link>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Cash pulse</h3>
          </div>
          <div className={styles.metrics} style={{ marginBottom: 12 }}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Collected</div>
              <div className={styles.metricValue} style={{ fontSize: '1rem' }}>
                {naira(Number(m.paid || 0))}
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Outstanding</div>
              <div className={styles.metricValue} style={{ fontSize: '1rem' }}>
                {naira(Number(m.outstanding || 0))}
              </div>
            </div>
          </div>
          <ul className={styles.list}>
            {(data?.invoices || []).slice(0, 5).map((inv) => (
              <li key={inv.id} className={styles.item}>
                <div>
                  <div className={styles.itemTitle}>{inv.title}</div>
                  <div className={styles.itemMeta}>{naira(Number(inv.amount || 0))}</div>
                </div>
                <StatusPill status={inv.status} />
              </li>
            ))}
            {!loading && !(data?.invoices || []).length ? (
              <li className={styles.empty}>No invoices yet.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </Shell>
  );
}

export function ProfessionalClientsPage({ config }: { config: IndustryConfig }) {
  const { data, loading, post } = useWorkspace();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = data?.clients || [];
    return list.filter((c) => {
      if (filter !== 'all' && String(c.status || 'active') !== filter) return false;
      if (!q.trim()) return true;
      const hay = `${c.name} ${c.email || ''} ${c.company || ''} ${c.phone || ''}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [data, q, filter]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await post({
        action: 'client_create',
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        notes: notes.trim() || null,
      });
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setNotes('');
      setMsg('Client added');
    } catch (err: any) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Clients"
      subtitle="CRM-lite for service firms — contacts tied to projects, tasks and invoices."
      actions={
        <Link href={`${config.dashboardPath}/projects`} className={styles.btnGhost}>
          Projects
        </Link>
      }
    >
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Add client</h3>
          </div>
          <form className={styles.form} onSubmit={create}>
            <div>
              <label className={styles.label}>Name</label>
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Acme Ltd / Jane Doe" />
            </div>
            <div>
              <label className={styles.label}>Company</label>
              <input className={styles.input} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={styles.label}>Phone</label>
              <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={styles.label}>Notes</label>
              <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Add client'}
            </button>
          </form>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Client list</h3>
            <span className={styles.panelMeta}>{rows.length} shown</span>
          </div>
          <div className={styles.chips}>
            <input
              className={styles.input}
              style={{ flex: '1 1 160px', minWidth: 140 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients…"
            />
            {['all', 'active', 'paused', 'closed'].map((f) => (
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
            <p className={styles.empty}>Loading clients…</p>
          ) : !rows.length ? (
            <p className={styles.empty}>No clients yet.</p>
          ) : (
            <ul className={styles.list}>
              {rows.map((c) => (
                <li key={c.id} className={styles.item}>
                  <div>
                    <div className={styles.itemTitle}>{c.name}</div>
                    <div className={styles.itemMeta}>
                      {[c.company, c.email, c.phone].filter(Boolean).join(' · ') || 'No contact details'}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <StatusPill status={c.status || 'active'} />
                    {['active', 'paused', 'closed']
                      .filter((s) => s !== String(c.status || 'active'))
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={styles.btnGhost}
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await post({ action: 'client_update', id: c.id, status: s });
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          {s}
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

const PROJECT_STATUSES = ['active', 'on_hold', 'done'] as const;

export function ProfessionalProjectsPage({ config }: { config: IndustryConfig }) {
  const { data, loading, post } = useWorkspace();
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await post({
        action: 'record_create',
        module: 'projects',
        title: title.trim(),
        status: 'active',
        amount: amount ? Number(amount) : 0,
        notes: [client && `Client: ${client}`, notes].filter(Boolean).join(' · ') || null,
        metadata: { clientName: client || null },
      });
      setTitle('');
      setClient('');
      setAmount('');
      setNotes('');
      setMsg('Project created');
    } catch (err: any) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const byStatus = (st: string) => (data?.projects || []).filter((p) => String(p.status) === st);

  return (
    <Shell
      title="Projects"
      subtitle="Engagements and retainers — status, value and client context on one board."
      actions={
        <Link href={`${config.dashboardPath}/tasks`} className={styles.btnGhost}>
          Tasks
        </Link>
      }
    >
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>New project</h3>
          </div>
          <form className={styles.form} onSubmit={create}>
            <div>
              <label className={styles.label}>Project name</label>
              <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Brand refresh Q1" />
            </div>
            <div>
              <label className={styles.label}>Client</label>
              <input className={styles.input} value={client} onChange={(e) => setClient(e.target.value)} list="pro-clients" placeholder="Select or type" />
              <datalist id="pro-clients">
                {(data?.clients || []).map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={styles.label}>Contract value (₦)</label>
              <input className={styles.input} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className={styles.label}>Notes</label>
              <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Create project'}
            </button>
          </form>
        </div>
        <div>
          {loading ? (
            <p className={styles.empty}>Loading projects…</p>
          ) : (
            <div className={styles.board}>
              {PROJECT_STATUSES.map((st) => (
                <div key={st} className={styles.column}>
                  <p className={styles.columnTitle}>
                    {st.replace(/_/g, ' ')} · {byStatus(st).length}
                  </p>
                  {byStatus(st).map((p) => (
                    <div key={p.id} className={styles.card}>
                      <div className={styles.cardTitle}>{p.title}</div>
                      <div className={styles.cardMeta}>
                        {Number(p.amount) ? naira(Number(p.amount)) : 'No value set'}
                      </div>
                      <div className={styles.row} style={{ marginTop: 8 }}>
                        {PROJECT_STATUSES.filter((s) => s !== st).map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={styles.btnGhost}
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await post({ action: 'record_update', id: p.id, status: s });
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            {s.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!byStatus(st).length ? <p className={styles.empty}>Empty</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

const TASK_STATUSES = ['open', 'in_progress', 'done'] as const;

export function ProfessionalTasksPage({ config }: { config: IndustryConfig }) {
  const { data, loading, post } = useWorkspace();
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = data?.tasks || [];
    if (filter === 'all') return list;
    return list.filter((t) => String(t.status) === filter);
  }, [data, filter]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await post({
        action: 'task_create',
        title: title.trim(),
        clientName: clientName.trim() || null,
        dueDate: dueDate || null,
        priority,
        status: 'open',
      });
      setTitle('');
      setClientName('');
      setDueDate('');
      setMsg('Task added');
    } catch (err: any) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Tasks"
      subtitle="Day-to-day work for the firm — prioritize, update status, close the loop."
      actions={
        <Link href={`${config.dashboardPath}/workload`} className={styles.btnGhost}>
          Workload
        </Link>
      }
    >
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Add task</h3>
          </div>
          <form className={styles.form} onSubmit={create}>
            <div>
              <label className={styles.label}>Task</label>
              <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className={styles.label}>Client</label>
              <input className={styles.input} value={clientName} onChange={(e) => setClientName(e.target.value)} list="pro-clients-t" />
              <datalist id="pro-clients-t">
                {(data?.clients || []).map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={styles.label}>Due date</label>
              <input className={styles.input} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className={styles.label}>Priority</label>
              <select className={styles.select} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Add task'}
            </button>
          </form>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Task list</h3>
            <span className={styles.panelMeta}>{rows.length}</span>
          </div>
          <div className={styles.chips}>
            {['all', ...TASK_STATUSES].map((f) => (
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
            <p className={styles.empty}>No tasks in this view.</p>
          ) : (
            <ul className={styles.list}>
              {rows.map((t) => (
                <li key={t.id} className={styles.item}>
                  <div>
                    <div className={styles.itemTitle}>{t.title}</div>
                    <div className={styles.itemMeta}>
                      {t.client_name || 'Internal'}
                      {t.due_date ? ` · due ${new Date(t.due_date).toLocaleDateString()}` : ''}
                      {t.priority ? ` · ${t.priority}` : ''}
                    </div>
                  </div>
                  <div className={styles.row}>
                    <StatusPill status={t.status} />
                    {TASK_STATUSES.filter((s) => s !== String(t.status)).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={styles.btnGhost}
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await post({ action: 'task_update', id: t.id, status: s });
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
