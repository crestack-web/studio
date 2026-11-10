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
  return `₦${Number(n || 0).toLocaleString()}`;
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

type ModuleSpec = {
  key: string;
  titleField: string;
  amount?: boolean;
  statuses: string[];
  defaultStatus: string;
  subtitle: string;
  placeholders: { title: string; notes?: string; amount?: string };
};

function moduleSpec(edition: string, section: string, label: string): ModuleSpec {
  const money = ['revenue', 'expenses', 'payments', 'billing', 'fees', 'invoices'].includes(section);
  const base: ModuleSpec = {
    key: section,
    titleField: label.replace(/s$/, '') + ' name',
    amount: money,
    statuses: money
      ? ['open', 'pending', 'paid', 'cancelled']
      : ['open', 'in_progress', 'done', 'cancelled'],
    defaultStatus: money ? 'pending' : 'open',
    subtitle: `Manage ${label.toLowerCase()} for this organization. Changes are saved to your ${edition} workspace.`,
    placeholders: {
      title: `New ${label.toLowerCase().replace(/s$/, '')}`,
      notes: 'Notes (optional)',
      amount: money ? 'Amount' : undefined,
    },
  };

  const map: Record<string, Partial<ModuleSpec>> = {
    guests: {
      titleField: 'Guest name',
      statuses: ['active', 'checked_in', 'checked_out', 'vip'],
      defaultStatus: 'active',
      subtitle: 'Guest profiles used at the front desk during check-in and billing.',
    },
    reservations: {
      titleField: 'Guest / reservation',
      amount: true,
      statuses: ['confirmed', 'checked_in', 'checked_out', 'cancelled'],
      defaultStatus: 'confirmed',
    },
    checkin: {
      titleField: 'Guest name',
      statuses: ['arriving', 'checked_in', 'checked_out'],
      defaultStatus: 'arriving',
      subtitle: 'Track arrivals and departures. Live room board stays on the front desk.',
    },
    housekeeping: {
      titleField: 'Room / task',
      statuses: ['dirty', 'cleaning', 'ready', 'blocked'],
      defaultStatus: 'dirty',
    },
    'room-service': {
      titleField: 'Order / room',
      amount: true,
      statuses: ['open', 'preparing', 'delivered', 'cancelled'],
      defaultStatus: 'open',
    },
    staff: {
      titleField: 'Staff name',
      statuses: ['active', 'off_duty', 'on_leave'],
      defaultStatus: 'active',
    },
    tasks: {
      titleField: 'Task',
      statuses: ['open', 'in_progress', 'done'],
      defaultStatus: 'open',
    },
    patients: {
      titleField: 'Patient name',
      statuses: ['active', 'inactive'],
      defaultStatus: 'active',
    },
    appointments: {
      titleField: 'Patient / reason',
      statuses: ['scheduled', 'checked_in', 'completed', 'cancelled'],
      defaultStatus: 'scheduled',
    },
    visits: {
      titleField: 'Patient visit',
      amount: true,
      statuses: ['open', 'in_progress', 'completed'],
      defaultStatus: 'open',
    },
    students: {
      titleField: 'Student name',
      statuses: ['active', 'alumni', 'withdrawn'],
      defaultStatus: 'active',
    },
    classes: {
      titleField: 'Class name',
      statuses: ['active', 'archived'],
      defaultStatus: 'active',
    },
    enrollment: {
      titleField: 'Student · class',
      statuses: ['enrolled', 'pending', 'withdrawn'],
      defaultStatus: 'enrolled',
    },
    attendance: {
      titleField: 'Class / student',
      statuses: ['present', 'absent', 'late'],
      defaultStatus: 'present',
    },
    teachers: {
      titleField: 'Teacher name',
      statuses: ['active', 'on_leave'],
      defaultStatus: 'active',
    },
    clients: {
      titleField: 'Client name',
      statuses: ['active', 'paused', 'closed'],
      defaultStatus: 'active',
    },
    projects: {
      titleField: 'Project name',
      amount: true,
      statuses: ['active', 'on_hold', 'done'],
      defaultStatus: 'active',
    },
    invoices: {
      titleField: 'Invoice / client',
      amount: true,
      statuses: ['draft', 'sent', 'paid', 'overdue'],
      defaultStatus: 'draft',
    },
    reports: {
      titleField: 'Report title',
      statuses: ['draft', 'ready'],
      defaultStatus: 'ready',
      subtitle: 'Save report snapshots and notes for ownership reviews.',
    },
  };

  return { ...base, ...(map[section] || {}) };
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
  const spec = useMemo(() => moduleSpec(config.id, section, label), [config.id, section, label]);
  const [rows, setRows] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ count: 0, open: 0, amount: 0 });
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch(
      `/api/industries/records?edition=${encodeURIComponent(config.id)}&module=${encodeURIComponent(section)}`,
      { headers: h }
    );
    const json = await res.json().catch(() => ({}));
    setRows(json.records || []);
    setMetrics(json.metrics || { count: 0, open: 0, amount: 0 });
    setWarning(json.warning || null);
  }, [config.id, section]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/records', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          edition: config.id,
          module: section,
          title: title.trim(),
          status: spec.defaultStatus,
          amount: spec.amount ? Number(amount) || 0 : 0,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not save');
      setTitle('');
      setAmount('');
      setNotes('');
      setMsg('Saved');
      await load();
    } catch (err: any) {
      setMsg(err?.message || 'Failed - sign in and apply migration 0028 if needed');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
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

  const filtered =
    filter === 'all' ? rows : rows.filter((r) => String(r.status) === filter);

  const desk =
    config.id === 'hospitality'
      ? '/industries/hospitality/front-desk'
      : config.id === 'healthcare'
        ? '/industries/healthcare/front-desk'
        : config.id === 'education'
          ? '/industries/education/front-desk'
          : '/industries/professional/front-desk';

  return (
    <Shell
      title={label}
      subtitle={spec.subtitle}
      actions={
        <Link href={desk} className={styles.btnGhost}>
          Open staff desk
        </Link>
      }
    >
      {warning ? (
        <div className={styles.panel} style={{ borderColor: '#fde68a', background: '#fffbeb' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
            {warning}. Run migration <code>0028_industry_records.sql</code> in Supabase if the table is missing.
          </p>
        </div>
      ) : null}

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Records</div>
          <div className={styles.metricValue}>{metrics.count}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Active / open</div>
          <div className={styles.metricValue}>{metrics.open}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Value</div>
          <div className={styles.metricValue}>{naira(metrics.amount)}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Module</div>
          <div className={styles.metricValue} style={{ fontSize: '1rem' }}>
            {label}
          </div>
        </div>
      </div>

      <div className={styles.split}>
        <Panel title={`Add ${label.toLowerCase()}`}>
          <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={spec.placeholders.title}
              style={inputStyle}
              required
            />
            {spec.amount ? (
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={spec.placeholders.amount}
                type="number"
                min="0"
                style={inputStyle}
              />
            ) : null}
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={spec.placeholders.notes}
              style={inputStyle}
            />
            <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
              {busy ? 'Saving…' : `Save ${label.replace(/s$/, '').toLowerCase()}`}
            </button>
            {msg ? <p style={{ margin: 0, fontSize: 13, color: '#0d7a43' }}>{msg}</p> : null}
          </form>
        </Panel>

        <Panel title="Workflow" meta={`${filtered.length} shown`}>
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
            <p className={styles.empty}>No records yet. Add the first one on the left.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 420, overflow: 'auto' }}>
              {filtered.map((r) => (
                <li key={r.id} style={rowStyle}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {r.notes || '-'}
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

/* Domain-specific modules that already had APIs */
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
    setRooms(json.rooms || []);
  }, []);

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
      if (!res.ok) throw new Error(json.error || 'Could not add room');
      setRoomNumber('');
      setMsg('Room added');
      await load();
    } catch (err: any) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const available = rooms.filter((r) => r.status === 'available').length;
  const occupied = rooms.filter((r) => r.status === 'occupied').length;

  return (
    <Shell
      title="Rooms"
      subtitle="Room inventory powers the front desk board. Add rooms here, operate day-to-day on the desk."
      actions={
        <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
          Open front desk
        </Link>
      }
    >
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total rooms</div>
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
              {busy ? 'Saving…' : 'Add room'}
            </button>
            {msg ? <p style={{ margin: 0, fontSize: 13 }}>{msg}</p> : null}
          </form>
        </Panel>
        <Panel title="Inventory" meta={`${rooms.length} rooms`}>
          {rooms.length === 0 ? (
            <p className={styles.empty}>No rooms yet. Add inventory to unlock the front desk board.</p>
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
    setBookings(json.recentBookings || []);
  }, []);

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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not create booking');
      setGuestName('');
      setAmount('');
      setMsg('Reservation created');
      await load();
    } catch (err: any) {
      setMsg(err?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Reservations"
      subtitle="Create and review bookings. Check-in and room assignment happen on the front desk."
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
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₦)" type="number" style={inputStyle} />
            <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
              {busy ? 'Saving…' : 'Create booking'}
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

function BrandingModule({ config }: { config: IndustryConfig }) {
  return (
    <Shell title="Settings" subtitle="Organization branding for staff desks and client-facing surfaces.">
      <Panel title="Branding">
        <p className={styles.greetingSub} style={{ marginBottom: 14 }}>
          Logo and display name appear on the staff live desk. Keep this updated before inviting staff.
        </p>
        <Link href={`${config.dashboardPath}/settings`} className={styles.btnPrimary}>
          Open branding settings
        </Link>
      </Panel>
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
  const label = config.nav.find((n) => n.id === section)?.label || section;

  if (section === 'ask-mo') {
    return (
      <Shell title="Ask MO" subtitle={`Industry-aware assistant for ${config.productName}.`}>
        <Panel title="Open assistant">
          <p className={styles.greetingSub} style={{ marginBottom: 14 }}>
            MO knows this is the {config.shortName} product. Use the floating Ask MO button or the link below.
          </p>
          <a href="#ask-mo" className={styles.btnPrimary}>
            Open Ask MO
          </a>
        </Panel>
      </Shell>
    );
  }

  if (section === 'settings' || section === 'account') {
    return <BrandingModule config={config} />;
  }

  // Hospitality domain tables
  if (config.id === 'hospitality') {
    if (section === 'rooms') return <HospitalityRooms config={config} />;
    if (section === 'reservations') return <HospitalityReservations config={config} />;
    if (section === 'front-desk' || section === 'checkin') {
      return (
        <Shell title={label} subtitle="Live operations run on the staff front desk.">
          <Panel title="Staff front desk">
            <p className={styles.greetingSub} style={{ marginBottom: 14 }}>
              Occupancy board, check-in/out, and today activity are optimized for the front desk experience.
            </p>
            <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
              Open front desk
            </Link>
          </Panel>
        </Shell>
      );
    }
  }

  if (config.id === 'healthcare' && section === 'front-desk') {
    return (
      <Shell title="Reception" subtitle="Patient queue and walk-ins for clinic staff.">
        <Panel title="Reception desk">
          <Link href="/industries/healthcare/front-desk" className={styles.btnPrimary}>
            Open reception
          </Link>
        </Panel>
      </Shell>
    );
  }

  if (config.id === 'education' && section === 'front-desk') {
    return (
      <Shell title="Front office" subtitle="Fees and student desk for school staff.">
        <Panel title="Front office">
          <Link href="/industries/education/front-desk" className={styles.btnPrimary}>
            Open front office
          </Link>
        </Panel>
      </Shell>
    );
  }

  if (config.id === 'professional' && section === 'front-desk') {
    return (
      <Shell title="Staff workspace" subtitle="Tasks and clients for the team.">
        <Panel title="Workspace">
          <Link href="/industries/professional/front-desk" className={styles.btnPrimary}>
            Open workspace
          </Link>
        </Panel>
      </Shell>
    );
  }

  // All other modules - full CRUD records
  return <RecordsModule config={config} section={section} label={label} />;
}
