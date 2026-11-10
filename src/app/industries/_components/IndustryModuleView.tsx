'use client';

import React, { useCallback, useEffect, useState } from 'react';
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

/* ─── Hospitality ─── */
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

  return (
    <Shell
      title="Rooms"
      subtitle="Define room inventory for the front desk. Status updates when guests check in or out."
      actions={
        <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
          Open Front desk
        </Link>
      }
    >
      <Panel title="Add room">
        <form
          onSubmit={addRoom}
          style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))' }}
        >
          <input
            placeholder="Room number"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            style={inputStyle}
            required
          />
          <input placeholder="Floor" value={floor} onChange={(e) => setFloor(e.target.value)} style={inputStyle} />
          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Rate / night"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            type="number"
            style={inputStyle}
          />
          <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
            {busy ? 'Saving…' : 'Add room'}
          </button>
        </form>
        {msg ? <p style={{ marginTop: 10, fontSize: 13, color: '#0d7a43' }}>{msg}</p> : null}
      </Panel>
      <Panel title={`Room list (${rooms.length})`}>
        {rooms.length === 0 ? (
          <p className={styles.empty}>No rooms yet. Add your first room above, then use Front desk for live status.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {rooms.map((r) => (
              <li
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>{r.room_number}</strong> · {r.category || 'Standard'}
                  {r.floor ? ` · Floor ${r.floor}` : ''} · ₦{Number(r.rate_amount || 0).toLocaleString()}/night
                </span>
                <span style={{ fontWeight: 700, color: r.status === 'available' ? '#047857' : '#b91c1c' }}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Shell>
  );
}

function HospitalityReservations({ config }: { config: IndustryConfig }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [guestName, setGuestName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/front-desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    setBookings(json.recentBookings || json.bookings || []);
    setRooms(json.rooms || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createBooking(e: React.FormEvent) {
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
          roomId: roomId || null,
          checkInDate: checkIn,
          status: 'confirmed',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not create booking');
      setGuestName('');
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
      subtitle="Create and track bookings. Check-in happens on the front desk."
      actions={
        <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
          Front desk
        </Link>
      }
    >
      <Panel title="New reservation">
        <form
          onSubmit={createBooking}
          style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}
        >
          <input
            placeholder="Guest name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            style={inputStyle}
            required
          />
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={inputStyle} />
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={inputStyle}>
            <option value="">Room (optional)</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_number} · {r.status}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
            {busy ? 'Saving…' : 'Create booking'}
          </button>
        </form>
        {msg ? <p style={{ marginTop: 10, fontSize: 13 }}>{msg}</p> : null}
      </Panel>
      <Panel title="Recent bookings">
        {bookings.length === 0 ? (
          <p className={styles.empty}>No bookings yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {bookings.map((b) => (
              <li
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>{b.guest_name}</strong>
                  {b.check_in_date ? ` · ${b.check_in_date}` : ''}
                </span>
                <span style={{ fontWeight: 700, color: '#5b21b6' }}>{b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Shell>
  );
}

function HospitalityOpsLink({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Shell title={title} subtitle={body}>
      <Panel title="Go live">
        <p className={styles.greetingSub} style={{ marginBottom: 16 }}>
          Day-to-day room status, check-in and occupancy live on the staff front desk. Owner modules here are for
          setup and oversight.
        </p>
        <Link href={href} className={styles.btnPrimary}>
          {cta}
        </Link>
      </Panel>
    </Shell>
  );
}

/* ─── Healthcare ─── */
function HealthcarePatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/healthcare/desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    setPatients(json.patients || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const h = await authHeaders();
      await fetch('/api/industries/healthcare/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'patient', fullName: name.trim(), phone }),
      });
      setName('');
      setPhone('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Patients"
      subtitle="Patient register for the clinic. Reception uses this list for walk-ins and appointments."
      actions={
        <Link href="/industries/healthcare/front-desk" className={styles.btnPrimary}>
          Open Reception
        </Link>
      }
    >
      <Panel title="Add patient">
        <form onSubmit={add} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
          <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
            Save patient
          </button>
        </form>
      </Panel>
      <Panel title={`On file (${patients.length})`}>
        {patients.length === 0 ? (
          <p className={styles.empty}>No patients yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {patients.map((p) => (
              <li key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                <strong>{p.full_name}</strong>
                {p.phone ? ` · ${p.phone}` : ''}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Shell>
  );
}

function HealthcareAppointments() {
  const [appts, setAppts] = useState<any[]>([]);
  const [patientName, setPatientName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/healthcare/desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    setAppts(json.appointmentsToday || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) return;
    setBusy(true);
    try {
      const h = await authHeaders();
      await fetch('/api/industries/healthcare/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'appointment',
          patientName: patientName.trim(),
          scheduledAt: new Date().toISOString(),
          status: 'scheduled',
        }),
      });
      setPatientName('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Appointments"
      subtitle="Today’s schedule. Reception can check patients in from the live desk."
      actions={
        <Link href="/industries/healthcare/front-desk" className={styles.btnPrimary}>
          Reception
        </Link>
      }
    >
      <Panel title="Schedule / walk-in">
        <form onSubmit={add} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input
            placeholder="Patient name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
            Add to today
          </button>
        </form>
      </Panel>
      <Panel title="Today">
        {appts.length === 0 ? (
          <p className={styles.empty}>No appointments today.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {appts.map((a) => (
              <li
                key={a.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>{a.patient_name}</strong>
                  {a.scheduled_at
                    ? ` · ${new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                </span>
                <span style={{ fontWeight: 700, color: '#5b21b6' }}>{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Shell>
  );
}

/* ─── Education ─── */
function EducationStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [klass, setKlass] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/education/desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    setStudents(json.students || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const h = await authHeaders();
      await fetch('/api/industries/education/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'student', fullName: name.trim(), className: klass }),
      });
      setName('');
      setKlass('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Students"
      subtitle="Student register for the school. Front office uses this for fee collection."
      actions={
        <Link href="/industries/education/front-desk" className={styles.btnPrimary}>
          Front office
        </Link>
      }
    >
      <Panel title="Add student">
        <form onSubmit={add} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required />
          <input placeholder="Class" value={klass} onChange={(e) => setKlass(e.target.value)} style={inputStyle} />
          <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
            Save student
          </button>
        </form>
      </Panel>
      <Panel title={`Students (${students.length})`}>
        {students.length === 0 ? (
          <p className={styles.empty}>No students yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {students.map((s) => (
              <li key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                <strong>{s.full_name}</strong>
                {s.class_name ? ` · ${s.class_name}` : ''}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Shell>
  );
}

function EducationFees() {
  const [fees, setFees] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/education/desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    setFees(json.recentFees || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName.trim() || !amount) return;
    setBusy(true);
    try {
      const h = await authHeaders();
      await fetch('/api/industries/education/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          action: 'fee',
          studentName: studentName.trim(),
          amount: Number(amount),
          method: 'cash',
        }),
      });
      setStudentName('');
      setAmount('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Fees"
      subtitle="Record fee payments. Staff can also collect from the front office desk."
      actions={
        <Link href="/industries/education/front-desk" className={styles.btnPrimary}>
          Front office
        </Link>
      }
    >
      <Panel title="Record payment">
        <form onSubmit={add} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input
            placeholder="Student name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            placeholder="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
            Record fee
          </button>
        </form>
      </Panel>
      <Panel title="Recent receipts">
        {fees.length === 0 ? (
          <p className={styles.empty}>No fee receipts yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {fees.map((f) => (
              <li
                key={f.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>{f.student_name}</strong>
                </span>
                <span style={{ fontWeight: 700 }}>₦{Number(f.amount || 0).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Shell>
  );
}

/* ─── Professional ─── */
function ProfessionalClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/professional/desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    setClients(json.clients || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const h = await authHeaders();
      await fetch('/api/industries/professional/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'client', name: name.trim() }),
      });
      setName('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Clients"
      subtitle="Client accounts for the firm. Staff see them on the workspace."
      actions={
        <Link href="/industries/professional/front-desk" className={styles.btnPrimary}>
          Staff workspace
        </Link>
      }
    >
      <Panel title="Add client">
        <form onSubmit={add} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required />
          <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
            Save client
          </button>
        </form>
      </Panel>
      <Panel title={`Clients (${clients.length})`}>
        {clients.length === 0 ? (
          <p className={styles.empty}>No clients yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {clients.map((c) => (
              <li key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                <strong>{c.name}</strong>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Shell>
  );
}

function ProfessionalTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/professional/desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    setTasks(json.tasks || []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const h = await authHeaders();
      await fetch('/api/industries/professional/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'task', title: title.trim() }),
      });
      setTitle('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Tasks"
      subtitle="Work items for the team. Staff update status from the workspace."
      actions={
        <Link href="/industries/professional/front-desk" className={styles.btnPrimary}>
          Staff workspace
        </Link>
      }
    >
      <Panel title="New task">
        <form onSubmit={add} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} required />
          <button type="submit" disabled={busy} className={styles.btnPrimary} style={{ border: 'none' }}>
            Add task
          </button>
        </form>
      </Panel>
      <Panel title="Open work">
        {tasks.length === 0 ? (
          <p className={styles.empty}>No open tasks.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tasks.map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>{t.title}</strong>
                  {t.client_name ? ` · ${t.client_name}` : ''}
                </span>
                <span style={{ fontWeight: 700, color: '#5b21b6' }}>{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Shell>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid #e6e6ef',
  fontSize: 14,
  minWidth: 0,
};

function GenericModule({
  config,
  section,
  label,
}: {
  config: IndustryConfig;
  section: string;
  label: string;
}) {
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
      subtitle={`${label} is part of ${config.productName}. Use the tools below to work in this area.`}
    >
      <div className={styles.split}>
        <Panel title="Owner tools">
          <div className={styles.actionsStack}>
            <Link href={`${config.dashboardPath}/settings`} className={styles.actionRow}>
              <span>Branding & settings</span>
              <span>→</span>
            </Link>
            <Link href={config.dashboardPath} className={styles.actionRow}>
              <span>Overview</span>
              <span>→</span>
            </Link>
          </div>
        </Panel>
        <Panel title="Staff operations">
          <p className={styles.greetingSub} style={{ marginBottom: 12 }}>
            Live day-to-day work for this solution runs on the staff desk.
          </p>
          <Link href={desk} className={styles.btnPrimary}>
            Open staff desk
          </Link>
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
  const label = config.nav.find((n) => n.id === section)?.label || section;

  if (config.id === 'hospitality') {
    if (section === 'rooms') return <HospitalityRooms config={config} />;
    if (section === 'reservations') return <HospitalityReservations config={config} />;
    if (section === 'checkin' || section === 'guests' || section === 'housekeeping' || section === 'room-service') {
      return (
        <HospitalityOpsLink
          title={label}
          body={`${label} is handled live on the front desk — occupancy, guests and room status in one place.`}
          href="/industries/hospitality/front-desk"
          cta="Open Front desk"
        />
      );
    }
  }

  if (config.id === 'healthcare') {
    if (section === 'patients') return <HealthcarePatients />;
    if (section === 'appointments' || section === 'visits') return <HealthcareAppointments />;
  }

  if (config.id === 'education') {
    if (section === 'students' || section === 'enrollment') return <EducationStudents />;
    if (section === 'fees') return <EducationFees />;
  }

  if (config.id === 'professional') {
    if (section === 'clients') return <ProfessionalClients />;
    if (section === 'tasks' || section === 'projects') return <ProfessionalTasks />;
  }

  if (section === 'settings' || section === 'account') {
    return (
      <Shell title={label} subtitle="Organization branding and preferences.">
        <Panel title="Branding">
          <p className={styles.greetingSub} style={{ marginBottom: 12 }}>
            Set logo and display name for the staff desk.
          </p>
          <Link href={`${config.dashboardPath}/settings`} className={styles.btnPrimary}>
            Open branding settings
          </Link>
        </Panel>
      </Shell>
    );
  }

  return <GenericModule config={config} section={section} label={label} />;
}
