'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryShell.module.css';

async function authHeaders() {
  const { data } = await getSupabase().auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) h.Authorization = `Bearer ${data.session.access_token}`;
  return h;
}

function naira(n: number) {
  return `NGN ${Number(n || 0).toLocaleString()}`;
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
  meta?: string;
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

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 0',
  borderBottom: '1px solid #f1f5f9',
};

const statusStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'capitalize',
  color: '#5b21b6',
  background: '#f3f0ff',
  padding: '3px 8px',
  borderRadius: 999,
};

function chipStyle(on: boolean): React.CSSProperties {
  return {
    border: on ? '1px solid #6b3fe7' : '1px solid #e6e6ef',
    background: on ? '#f3f0ff' : '#fff',
    color: on ? '#5b21b6' : '#4b5563',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

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
    guests: {
      titleField: 'Guest full name',
      statuses: ['active', 'checked_in', 'checked_out', 'vip'],
      defaultStatus: 'active',
      subtitle: 'Guest profiles for reservations, check-in and billing.',
      cta: 'Add guest',
    },
    reservations: {
      titleField: 'Guest name',
      amount: true,
      statuses: ['confirmed', 'checked_in', 'checked_out', 'cancelled'],
      defaultStatus: 'confirmed',
      subtitle: 'Bookings for the property. Check-in runs on the front desk.',
      cta: 'Create reservation',
    },
    checkin: {
      titleField: 'Guest name',
      statuses: ['arriving', 'checked_in', 'checked_out'],
      defaultStatus: 'arriving',
      subtitle: 'Arrival list. Room board stays on the front desk.',
      cta: 'Log arrival',
    },
    housekeeping: {
      titleField: 'Room or task',
      statuses: ['dirty', 'cleaning', 'ready', 'blocked'],
      defaultStatus: 'dirty',
      subtitle: 'Housekeeping queue by room status.',
      cta: 'Add task',
    },
    'room-service': {
      titleField: 'Room / order',
      amount: true,
      statuses: ['open', 'preparing', 'delivered', 'cancelled'],
      defaultStatus: 'open',
      subtitle: 'In-room orders and delivery status.',
      cta: 'Add order',
    },
    staff: {
      titleField: 'Staff name',
      statuses: ['active', 'off_duty', 'on_leave'],
      defaultStatus: 'active',
      subtitle: 'Team roster for this property or branch.',
      cta: 'Add staff',
    },
    tasks: {
      titleField: 'Task title',
      statuses: ['open', 'in_progress', 'done'],
      defaultStatus: 'open',
      subtitle: 'Operational tasks for the team.',
      cta: 'Add task',
    },
    revenue: {
      titleField: 'Revenue source',
      amount: true,
      statuses: ['recorded', 'pending', 'reversed'],
      defaultStatus: 'recorded',
      subtitle: 'Log room revenue, extras and other income.',
      cta: 'Record revenue',
    },
    expenses: {
      titleField: 'Expense',
      amount: true,
      statuses: ['recorded', 'pending', 'approved'],
      defaultStatus: 'recorded',
      subtitle: 'Track property and operations spend.',
      cta: 'Add expense',
    },
    payments: {
      titleField: 'Payment reference',
      amount: true,
      statuses: ['pending', 'paid', 'failed'],
      defaultStatus: 'paid',
      subtitle: 'Guest and vendor payments.',
      cta: 'Record payment',
    },
    reports: {
      titleField: 'Report name',
      statuses: ['draft', 'ready'],
      defaultStatus: 'ready',
      subtitle: 'Saved report snapshots for ownership reviews.',
      cta: 'Save report note',
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
      subtitle: 'Appointment book. Walk-ins also work on Reception.',
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
    enrollment: {
      titleField: 'Student and class',
      statuses: ['enrolled', 'pending', 'withdrawn'],
      defaultStatus: 'enrolled',
      subtitle: 'Enrollment records.',
      cta: 'Enroll',
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
      subtitle: 'Fee payments (also available on Front office desk).',
      cta: 'Record fee',
    },
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
    team: {
      titleField: 'Team member',
      statuses: ['active', 'inactive'],
      defaultStatus: 'active',
      subtitle: 'Team directory.',
      cta: 'Add member',
    },
    'time-tracking': {
      titleField: 'Work item',
      amount: true,
      statuses: ['logged', 'approved'],
      defaultStatus: 'logged',
      subtitle: 'Time entries (amount can be hours or billable value).',
      cta: 'Log time',
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
    supplies: {
      titleField: 'Supply item',
      amount: true,
      statuses: ['in_stock', 'low', 'out'],
      defaultStatus: 'in_stock',
      subtitle: 'Clinic supplies and consumables.',
      cta: 'Add supply',
    },
    'clinical-staff': {
      titleField: 'Clinician name',
      statuses: ['active', 'off_duty'],
      defaultStatus: 'active',
      subtitle: 'Clinical team roster.',
      cta: 'Add clinician',
    },
    'rooms-beds': {
      titleField: 'Room or bed',
      statuses: ['available', 'occupied', 'cleaning'],
      defaultStatus: 'available',
      subtitle: 'Beds and treatment rooms.',
      cta: 'Add bed/room',
    },
    timetable: {
      titleField: 'Period / class',
      statuses: ['scheduled', 'done'],
      defaultStatus: 'scheduled',
      subtitle: 'School timetable entries.',
      cta: 'Add period',
    },
    billing: {
      titleField: 'Bill / patient',
      amount: true,
      statuses: ['open', 'paid', 'void'],
      defaultStatus: 'open',
      subtitle: 'Clinic billing records.',
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
    subtitle: `Manage ${label.toLowerCase()} for this workspace. Add records, update status, and keep the team aligned.`,
    cta: `Add ${label.replace(/s$/, '').toLowerCase()}`,
  };

  // normalize section keys like rooms-beds from nav ids
  const key = section.replace(/_/g, '-');
  return { ...base, ...(specs[section] || specs[key] || {}) };
}

function deskPath(config: IndustryConfig) {
  if (config.id === 'hospitality') return '/industries/hospitality/front-desk';
  if (config.id === 'healthcare') return '/industries/healthcare/front-desk';
  if (config.id === 'education') return '/industries/education/front-desk';
  return '/industries/professional/front-desk';
}

/** Full working module — API + local fallback so UI always works */
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
  const [source, setSource] = useState<'api' | 'local'>('local');

  const load = useCallback(async () => {
    const local = readLocal(config.id, section);
    const h = await authHeaders();
    try {
      const res = await fetch(
        `/api/industries/records?edition=${encodeURIComponent(config.id)}&module=${encodeURIComponent(section)}`,
        { headers: h }
      );
      const json = await res.json().catch(() => ({}));
      const apiRows = Array.isArray(json.records) ? json.records : [];
      if (apiRows.length > 0 || (res.ok && !json.warning && !json.preview)) {
        setRows(apiRows);
        setSource('api');
        writeLocal(config.id, section, apiRows);
        return;
      }
      // merge: prefer local if API empty
      setRows(local);
      setSource(apiRows.length || res.ok ? 'api' : 'local');
    } catch {
      setRows(local);
      setSource('local');
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
      // local fallback
      const row = {
        id: `local-${Date.now()}`,
        ...payload,
        occurred_at: payload.occurredAt,
        status: payload.status,
      };
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
        const next = readLocal(config.id, section).map((r) =>
          r.id === id ? { ...r, status } : r
        );
        // also update in-memory rows that came from api id
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

  const filtered = filter === 'all' ? rows : rows.filter((r) => String(r.status) === filter);
  const openCount = rows.filter(
    (r) => !['done', 'completed', 'paid', 'closed', 'checked_out', 'cancelled', 'ready', 'delivered'].includes(String(r.status))
  ).length;
  const totalAmount = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <Shell
      title={label}
      subtitle={spec.subtitle}
      actions={
        <a href={deskPath(config)} className={styles.btnGhost}>
          Staff portal
        </a>
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
          <div className={styles.metricLabel}>Value</div>
          <div className={styles.metricValue} style={{ fontSize: '1.1rem' }}>
            {naira(totalAmount)}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Storage</div>
          <div className={styles.metricValue} style={{ fontSize: '0.95rem' }}>
            {source === 'api' ? 'Cloud' : 'Device'}
          </div>
        </div>
      </div>

      <div className={styles.split}>
        <Panel title={spec.cta}>
          <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={spec.titleField}
              style={inputStyle}
              required
            />
            {spec.amount ? (
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                type="number"
                min="0"
                style={inputStyle}
              />
            ) : null}
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              style={inputStyle}
            />
            <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
              {busy ? 'Saving...' : spec.cta}
            </button>
            {msg ? <p style={{ margin: 0, fontSize: 13, color: '#0d7a43' }}>{msg}</p> : null}
          </form>
        </Panel>

        <Panel title={`${label} list`} meta={`${filtered.length} shown`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            <button type="button" style={chipStyle(filter === 'all')} onClick={() => setFilter('all')}>
              All
            </button>
            {spec.statuses.map((s) => (
              <button key={s} type="button" style={chipStyle(filter === s)} onClick={() => setFilter(s)}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className={styles.empty}>
              No {label.toLowerCase()} yet. Use the form to add the first record — this module is live.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 440, overflow: 'auto' }}>
              {filtered.map((r) => (
                <li key={r.id} style={rowStyle}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {r.notes || 'No notes'}
                      {Number(r.amount) ? ` · ${naira(Number(r.amount))}` : ''}
                      {r.occurred_at
                        ? ` · ${new Date(r.occurred_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
                        : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span style={statusStyle}>{String(r.status).replace(/_/g, ' ')}</span>
                    <select
                      disabled={busy}
                      value={r.status}
                      onChange={(e) => setStatus(r.id, e.target.value)}
                      style={{ fontSize: 12, borderRadius: 8, border: '1px solid #e6e6ef', padding: '4px 6px' }}
                    >
                      {spec.statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
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

function HospitalityRooms({ config }: { config: IndustryConfig }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('1');
  const [category, setCategory] = useState('Standard');
  const [rate, setRate] = useState('25000');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/front-desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    const apiRooms = json.rooms || [];
    if (apiRooms.length) {
      setRooms(apiRooms);
      writeLocal(config.id, 'rooms', apiRooms);
    } else {
      setRooms(readLocal(config.id, 'rooms'));
    }
  }, [config.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!roomNumber.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/rooms', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          roomNumber: roomNumber.trim(),
          floor,
          category,
          rateAmount: Number(rate) || 0,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setRoomNumber('');
        setMsg('Room added');
        await load();
        return;
      }
      const row = {
        id: `local-${Date.now()}`,
        room_number: roomNumber.trim(),
        floor,
        category,
        rate_amount: Number(rate) || 0,
        status: 'available',
      };
      const next = [row, ...readLocal(config.id, 'rooms')];
      writeLocal(config.id, 'rooms', next);
      setRooms(next);
      setRoomNumber('');
      setMsg('Saved on this device');
    } finally {
      setBusy(false);
    }
  }

  const available = rooms.filter((r) => r.status === 'available').length;
  const occupied = rooms.filter((r) => r.status === 'occupied').length;

  return (
    <Shell
      title="Rooms"
      subtitle="Room inventory for the front desk board."
      actions={
        <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
          Front desk
        </Link>
      }
    >
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total</div>
          <div className={styles.metricValue}>{rooms.length}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Available</div>
          <div className={styles.metricValue}>{available}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Occupied</div>
          <div className={styles.metricValue}>{occupied}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Occupancy</div>
          <div className={styles.metricValue}>
            {rooms.length ? Math.round((occupied / rooms.length) * 100) : 0}%
          </div>
        </div>
      </div>
      <div className={styles.split}>
        <Panel title="Add room">
          <form onSubmit={addRoom} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="Room number" style={inputStyle} required />
            <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor" style={inputStyle} />
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" style={inputStyle} />
            <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Nightly rate" type="number" style={inputStyle} />
            <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
              {busy ? 'Saving...' : 'Add room'}
            </button>
            {msg ? <p style={{ margin: 0, fontSize: 13 }}>{msg}</p> : null}
          </form>
        </Panel>
        <Panel title="Inventory" meta={`${rooms.length} rooms`}>
          {rooms.length === 0 ? (
            <p className={styles.empty}>No rooms yet. Add inventory to power the front desk.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 420, overflow: 'auto' }}>
              {rooms.map((r) => (
                <li key={r.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 800 }}>Room {r.room_number}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Floor {r.floor || '-'} · {r.category || 'Standard'} · {naira(Number(r.rate_amount || 0))}/night
                    </div>
                  </div>
                  <span style={statusStyle}>{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </Shell>
  );
}

function HospitalityReservations({ config }: { config: IndustryConfig }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [guestName, setGuestName] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/front-desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    const api = json.recentBookings || [];
    if (api.length) {
      setBookings(api);
      writeLocal(config.id, 'reservations', api);
    } else {
      setBookings(readLocal(config.id, 'reservations'));
    }
  }, [config.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/bookings', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          guestName: guestName.trim(),
          amount: Number(amount) || 0,
          checkInDate: new Date().toISOString().slice(0, 10),
          status: 'confirmed',
        }),
      });
      if (res.ok) {
        setGuestName('');
        setAmount('');
        setMsg('Reservation created');
        await load();
        return;
      }
      const row = {
        id: `local-${Date.now()}`,
        guest_name: guestName.trim(),
        amount: Number(amount) || 0,
        check_in_date: new Date().toISOString().slice(0, 10),
        status: 'confirmed',
      };
      const next = [row, ...readLocal(config.id, 'reservations')];
      writeLocal(config.id, 'reservations', next);
      setBookings(next);
      setGuestName('');
      setAmount('');
      setMsg('Saved on this device');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Reservations"
      subtitle="Create bookings. Check-in continues on the front desk."
      actions={
        <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
          Front desk
        </Link>
      }
    >
      <div className={styles.split}>
        <Panel title="New reservation">
          <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Guest name" style={inputStyle} required />
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" style={inputStyle} />
            <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
              {busy ? 'Saving...' : 'Create booking'}
            </button>
            {msg ? <p style={{ margin: 0, fontSize: 13 }}>{msg}</p> : null}
          </form>
        </Panel>
        <Panel title="Recent bookings" meta={`${bookings.length}`}>
          {bookings.length === 0 ? (
            <p className={styles.empty}>No bookings yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {bookings.map((b) => (
                <li key={b.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.guest_name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {b.check_in_date || '-'} · {naira(Number(b.amount || 0))}
                    </div>
                  </div>
                  <span style={statusStyle}>{b.status}</span>
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
          <p className={styles.greetingSub} style={{ marginBottom: 14 }}>
            MO is industry-aware for {config.shortName}. Use the floating button or open the panel.
          </p>
          <a href="#ask-mo" className={styles.btnPrimary}>
            Open Ask MO
          </a>
        </Panel>
      </Shell>
    );
  }

  if (section === 'settings' || section === 'account') {
    return (
      <Shell title={label} subtitle="Branding and organization preferences.">
        <Panel title="Branding">
          <p className={styles.greetingSub} style={{ marginBottom: 14 }}>
            Logo and display name appear on the staff desk.
          </p>
          <Link href={`${config.dashboardPath}/settings`} className={styles.btnPrimary}>
            Open branding settings
          </Link>
        </Panel>
      </Shell>
    );
  }

  if (config.id === 'hospitality') {
    if (section === 'rooms') return <HospitalityRooms config={config} />;
    if (section === 'reservations') return <HospitalityReservations config={config} />;
    if (section === 'checkin' || section === 'front-desk') {
      return (
        <Shell title={label} subtitle="Live room board and check-in.">
          <Panel title="Front desk">
            <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
              Open staff portal
            </Link>
          </Panel>
        </Shell>
      );
    }
  }

  if (section === 'front-desk') {
    return (
      <Shell title={label} subtitle="Staff live desk for this solution.">
        <Panel title="Open desk">
          <Link href={deskPath(config)} className={styles.btnPrimary}>
            Open staff desk
          </Link>
        </Panel>
      </Shell>
    );
  }

  // Every other nav item — full smart module (Revenue, Guests, etc.)
  return <RecordsModule config={config} section={section} label={label} />;
}
