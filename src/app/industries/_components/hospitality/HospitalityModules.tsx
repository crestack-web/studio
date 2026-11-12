'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from '../IndustryShell.module.css';

async function authHeaders() {
  const { data } = await getSupabase().auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) h.Authorization = `Bearer ${data.session.access_token}`;
  return h;
}

function money(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function Shell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className={styles.greetingRow}>
        <div>
          <p className={styles.eyebrow}>Hospitality</p>
          <h1 className={styles.greeting}>{title}</h1>
          {subtitle ? <p className={styles.greetingSub}>{subtitle}</p> : null}
        </div>
        {actions ? <div className={styles.topbarRight}>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Panel({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.panel} style={{ marginBottom: 16 }}>
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{title}</h3>
        {meta ? <span className={styles.panelMeta}>{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
      {hint ? <div className={styles.metricHint}>{hint}</div> : null}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const color =
    s === 'available' || s === 'confirmed' || s === 'checked_in' || s === 'clean'
      ? '#059669'
      : s === 'occupied' || s === 'dirty' || s === 'cleaning'
        ? '#d97706'
        : s === 'maintenance' || s === 'cancelled' || s === 'blocked'
          ? '#dc2626'
          : '#6b7280';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: `${color}18`,
        color,
        textTransform: 'capitalize',
      }}
    >
      {s.replace(/_/g, ' ')}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  fontSize: 14,
  marginBottom: 10,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  marginBottom: 4,
};

/* ─────────────── Rooms ─────────────── */
export function HospitalityRoomsPage({ config }: { config: IndustryConfig }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({
    roomNumber: '',
    floor: '1',
    category: 'Standard',
    rate: '25000',
    capacity: '2',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/front-desk', { headers: h });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Failed to load rooms');
        setRooms([]);
        return;
      }
      setRooms(json.rooms || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!form.roomNumber.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/rooms', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          roomNumber: form.roomNumber.trim(),
          floor: form.floor,
          category: form.category,
          rateAmount: Number(form.rate) || 0,
          capacity: Number(form.capacity) || 2,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || 'Could not add room');
        return;
      }
      setForm((f) => ({ ...f, roomNumber: '' }));
      setMsg('Room added');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    const h = await authHeaders();
    await fetch('/api/industries/hospitality/rooms', {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  const filtered = rooms.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [r.room_number, r.category, r.floor, r.status].join(' ').toLowerCase().includes(s);
  });

  const available = rooms.filter((r) => r.status === 'available').length;
  const occupied = rooms.filter((r) => r.status === 'occupied').length;
  const cleaning = rooms.filter((r) => r.status === 'cleaning').length;

  return (
    <Shell
      title="Rooms"
      subtitle="Room inventory, rates, and status for the front desk."
      actions={
        <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
          Open front desk
        </Link>
      }
    >
      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Total rooms" value={rooms.length} />
        <Kpi label="Available" value={available} />
        <Kpi label="Occupied" value={occupied} />
        <Kpi label="Cleaning" value={cleaning} />
      </div>

      <div className={styles.split}>
        <Panel title="Room list" meta={loading ? 'Loading…' : `${filtered.length} shown`}>
          <input
            style={inputStyle}
            placeholder="Search room, floor, category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {error ? <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p> : null}
          {msg ? <p style={{ color: '#059669', fontSize: 13 }}>{msg}</p> : null}
          {!loading && filtered.length === 0 ? (
            <p className={styles.greetingSub}>No rooms yet. Add your first room on the right.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                    <th style={{ padding: '8px 6px' }}>Room</th>
                    <th style={{ padding: '8px 6px' }}>Category</th>
                    <th style={{ padding: '8px 6px' }}>Rate</th>
                    <th style={{ padding: '8px 6px' }}>Status</th>
                    <th style={{ padding: '8px 6px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 6px' }}>
                        <strong>{r.room_number}</strong>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Floor {r.floor || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 6px' }}>{r.category || 'Standard'}</td>
                      <td style={{ padding: '10px 6px' }}>{money(r.rate_amount)}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <StatusPill status={r.status} />
                      </td>
                      <td style={{ padding: '10px 6px' }}>
                        <select
                          value={r.status}
                          onChange={(e) => setStatus(r.id, e.target.value)}
                          style={{ ...inputStyle, marginBottom: 0, width: 'auto' }}
                        >
                          {['available', 'occupied', 'cleaning', 'maintenance', 'blocked'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Add room">
          <form onSubmit={addRoom}>
            <label style={labelStyle}>Room number</label>
            <input
              style={inputStyle}
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              placeholder="e.g. 101"
              required
            />
            <label style={labelStyle}>Floor</label>
            <input
              style={inputStyle}
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
            />
            <label style={labelStyle}>Category</label>
            <select
              style={inputStyle}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {['Standard', 'Deluxe', 'Suite', 'Executive', 'Family'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label style={labelStyle}>Nightly rate (₦)</label>
            <input
              style={inputStyle}
              type="number"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
            <label style={labelStyle}>Capacity</label>
            <input
              style={inputStyle}
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
            <button type="submit" className={styles.btnPrimary} disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Add room'}
            </button>
          </form>
        </Panel>
      </div>
    </Shell>
  );
}

/* ─────────────── Reservations (PMS-style) ─────────────── */
export function HospitalityReservationsPage({ config }: { config: IndustryConfig }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    roomId: '',
    checkInDate: new Date().toISOString().slice(0, 10),
    checkOutDate: '',
    adults: '1',
    children: '0',
    ratePerNight: '',
    amount: '',
    depositAmount: '0',
    specialRequests: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = await authHeaders();
      const [bRes, dRes] = await Promise.all([
        fetch('/api/industries/hospitality/bookings', { headers: h }),
        fetch('/api/industries/hospitality/front-desk', { headers: h }),
      ]);
      const bJson = await bRes.json().catch(() => ({}));
      const dJson = await dRes.json().catch(() => ({}));
      if (!bRes.ok && !dRes.ok) {
        setError(bJson.error || dJson.error || 'Failed to load');
        return;
      }
      setBookings(bJson.bookings || dJson.recentBookings || []);
      setRooms(dJson.rooms || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto nights + amount from room rate
  useEffect(() => {
    const room = rooms.find((r) => r.id === form.roomId);
    const rate = form.ratePerNight
      ? Number(form.ratePerNight)
      : room
        ? Number(room.rate_amount || 0)
        : 0;
    if (form.roomId && room && !form.ratePerNight) {
      setForm((f) => ({ ...f, ratePerNight: String(room.rate_amount || 0) }));
    }
    if (form.checkInDate && form.checkOutDate) {
      const a = new Date(form.checkInDate + 'T12:00:00');
      const b = new Date(form.checkOutDate + 'T12:00:00');
      const nights = Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
      const amount = rate * nights;
      if (!Number.isNaN(amount) && amount >= 0) {
        setForm((f) => ({ ...f, amount: String(amount) }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.roomId, form.checkInDate, form.checkOutDate, form.ratePerNight, rooms]);

  async function createBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!form.guestName.trim()) return;
    if (!form.checkInDate || !form.checkOutDate) {
      setMsg('Check-in and check-out dates are required');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/bookings', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          guestName: form.guestName.trim(),
          guestPhone: form.guestPhone || null,
          guestEmail: form.guestEmail || null,
          roomId: form.roomId || null,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          adults: Number(form.adults) || 1,
          children: Number(form.children) || 0,
          ratePerNight: form.ratePerNight ? Number(form.ratePerNight) : undefined,
          amount: form.amount ? Number(form.amount) : undefined,
          depositAmount: Number(form.depositAmount) || 0,
          specialRequests: form.specialRequests || null,
          notes: form.notes || null,
          status: 'confirmed',
          source: 'owner_dashboard',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || 'Could not create reservation');
        return;
      }
      setForm({
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        roomId: '',
        checkInDate: new Date().toISOString().slice(0, 10),
        checkOutDate: '',
        adults: '1',
        children: '0',
        ratePerNight: '',
        amount: '',
        depositAmount: '0',
        specialRequests: '',
        notes: '',
      });
      setMsg('Reservation created');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patchBooking(id: string, body: Record<string, unknown>) {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/bookings', {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ id, ...body }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json.error || 'Update failed');
      return false;
    }
    setMsg('Updated');
    await load();
    if (selected?.id === id) {
      setSelected(json.booking || { ...selected, ...body });
    }
    return true;
  }

  const shown = bookings.filter((b) => (filter === 'all' ? true : b.status === filter));
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const inHouse = bookings.filter((b) => b.status === 'checked_in').length;
  const revenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((s, b) => s + Number(b.amount || 0), 0);

  const roomLabel = (id: string | null) => {
    if (!id) return 'Unassigned';
    const r = rooms.find((x) => x.id === id);
    return r ? `${r.room_number} (${r.category})` : 'Room';
  };

  return (
    <Shell
      title="Reservations"
      subtitle="Create stays with dates, rates, room assignment, deposits, and guest details — the same core flow as a modern PMS."
      actions={
        <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
          Front desk board
        </Link>
      }
    >
      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Total bookings" value={bookings.length} />
        <Kpi label="Confirmed" value={confirmed} />
        <Kpi label="In-house" value={inHouse} />
        <Kpi label="Booked revenue" value={money(revenue)} />
      </div>

      <div className={styles.split}>
        <Panel title="Bookings" meta={loading ? 'Loading…' : `${shown.length} shown`}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={filter === s ? styles.btnPrimary : styles.topGhost}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {error ? <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p> : null}
          {msg ? <p style={{ color: '#059669', fontSize: 13 }}>{msg}</p> : null}
          {!loading && shown.length === 0 ? (
            <p className={styles.greetingSub}>No reservations yet. Use the form to create one.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                    <th style={{ padding: '8px 6px' }}>Guest</th>
                    <th style={{ padding: '8px 6px' }}>Room</th>
                    <th style={{ padding: '8px 6px' }}>Stay</th>
                    <th style={{ padding: '8px 6px' }}>Balance</th>
                    <th style={{ padding: '8px 6px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((b) => (
                    <tr
                      key={b.id}
                      style={{
                        borderTop: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        background: selected?.id === b.id ? '#f5f3ff' : undefined,
                      }}
                      onClick={() => setSelected(b)}
                    >
                      <td style={{ padding: '10px 6px' }}>
                        <strong>{b.guest_name}</strong>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {b.guest_phone || b.guest_email || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 6px' }}>{roomLabel(b.room_id)}</td>
                      <td style={{ padding: '10px 6px', fontSize: 13 }}>
                        {b.check_in_date}
                        {b.check_out_date ? ` → ${b.check_out_date}` : ''}
                        {b.nights ? (
                          <div style={{ color: '#9ca3af', fontSize: 12 }}>{b.nights} night(s)</div>
                        ) : null}
                      </td>
                      <td style={{ padding: '10px 6px' }}>
                        {money(b.balance_amount != null ? b.balance_amount : b.amount)}
                      </td>
                      <td style={{ padding: '10px 6px' }}>
                        <StatusPill status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selected ? (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 12,
                border: '1px solid #e8e8f0',
                background: '#fafbff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <strong>Reservation · {selected.guest_name}</strong>
                <button type="button" className={styles.topGhost} onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
              <label style={labelStyle}>Assign / change room</label>
              <select
                style={inputStyle}
                value={selected.room_id || ''}
                onChange={async (e) => {
                  const roomId = e.target.value || null;
                  await patchBooking(selected.id, { roomId });
                }}
              >
                <option value="">Unassigned</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} · {r.category} · {r.status} · {money(r.rate_amount)}
                  </option>
                ))}
              </select>
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
                value={selected.status}
                onChange={async (e) => {
                  const status = e.target.value;
                  const ok = await patchBooking(selected.id, {
                    status,
                    roomId: selected.room_id,
                  });
                  if (ok) setSelected({ ...selected, status });
                }}
              >
                {['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'].map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>
                Check-in requires a room. Check-out moves the room to cleaning (housekeeping).
              </p>
            </div>
          ) : null}
        </Panel>

        <Panel title="New reservation">
          <form onSubmit={createBooking}>
            <label style={labelStyle}>Guest full name *</label>
            <input
              style={inputStyle}
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              required
              placeholder="As on ID"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  style={inputStyle}
                  value={form.guestPhone}
                  onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                  placeholder="080…"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.guestEmail}
                  onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                />
              </div>
            </div>
            <label style={labelStyle}>Room assignment</label>
            <select
              style={inputStyle}
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            >
              <option value="">Assign later (or at check-in)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} · {r.category} · {r.status} · {money(r.rate_amount)}/night
                </option>
              ))}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Check-in *</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.checkInDate}
                  onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Check-out *</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.checkOutDate}
                  onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Adults</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  value={form.adults}
                  onChange={(e) => setForm({ ...form, adults: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Children</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={form.children}
                  onChange={(e) => setForm({ ...form, children: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={labelStyle}>Rate / night (₦)</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.ratePerNight}
                  onChange={(e) => setForm({ ...form, ratePerNight: e.target.value })}
                  placeholder="From room or custom"
                />
              </div>
              <div>
                <label style={labelStyle}>Stay total (₦)</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>
            <label style={labelStyle}>Deposit paid (₦)</label>
            <input
              style={inputStyle}
              type="number"
              value={form.depositAmount}
              onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
            />
            <label style={labelStyle}>Special requests</label>
            <input
              style={inputStyle}
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
              placeholder="Late arrival, extra bed…"
            />
            <label style={labelStyle}>Internal notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: 56 }}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <button type="submit" className={styles.btnPrimary} disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Create reservation'}
            </button>
          </form>
        </Panel>
      </div>
    </Shell>
  );
}

/* ─────────────── Guests (derived from bookings) ─────────────── */
export function HospitalityGuestsPage({ config }: { config: IndustryConfig }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/bookings', { headers: h });
      const json = await res.json().catch(() => ({}));
      setBookings(json.bookings || []);
      setLoading(false);
    })();
  }, []);

  const guests = useMemo(() => {
    const map = new Map<string, any>();
    for (const b of bookings) {
      const key = `${(b.guest_name || '').toLowerCase()}|${b.guest_phone || ''}`;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, {
          name: b.guest_name,
          phone: b.guest_phone,
          email: b.guest_email,
          stays: 1,
          lastStay: b.check_in_date,
          spent: Number(b.amount || 0),
          statuses: [b.status],
        });
      } else {
        prev.stays += 1;
        prev.spent += Number(b.amount || 0);
        if (b.check_in_date > prev.lastStay) prev.lastStay = b.check_in_date;
        prev.statuses.push(b.status);
      }
    }
    return Array.from(map.values());
  }, [bookings]);

  const filtered = guests.filter((g) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [g.name, g.phone, g.email].join(' ').toLowerCase().includes(s);
  });

  return (
    <Shell title="Guests" subtitle="Guest profiles built from reservation history.">
      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Unique guests" value={guests.length} />
        <Kpi label="Total stays" value={bookings.length} />
      </div>
      <Panel title="Guest directory" meta={loading ? 'Loading…' : `${filtered.length} guests`}>
        <input
          style={inputStyle}
          placeholder="Search guest name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {!loading && filtered.length === 0 ? (
          <p className={styles.greetingSub}>
            Guests appear here after you create reservations.{' '}
            <Link href={`${config.dashboardPath}/reservations`}>Add a reservation</Link>
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                  <th style={{ padding: '8px 6px' }}>Guest</th>
                  <th style={{ padding: '8px 6px' }}>Contact</th>
                  <th style={{ padding: '8px 6px' }}>Stays</th>
                  <th style={{ padding: '8px 6px' }}>Last stay</th>
                  <th style={{ padding: '8px 6px' }}>Spent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 6px' }}>
                      <strong>{g.name}</strong>
                    </td>
                    <td style={{ padding: '10px 6px', fontSize: 13 }}>
                      {g.phone || '—'}
                      <div style={{ color: '#9ca3af' }}>{g.email || ''}</div>
                    </td>
                    <td style={{ padding: '10px 6px' }}>{g.stays}</td>
                    <td style={{ padding: '10px 6px' }}>{g.lastStay || '—'}</td>
                    <td style={{ padding: '10px 6px' }}>{money(g.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </Shell>
  );
}

/* ─────────────── Housekeeping ─────────────── */
export function HospitalityHousekeepingPage({ config }: { config: IndustryConfig }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/front-desk', { headers: h });
    const json = await res.json().catch(() => ({}));
    setRooms(json.rooms || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    const h = await authHeaders();
    await fetch('/api/industries/hospitality/rooms', {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  const dirty = rooms.filter((r) => r.status === 'cleaning' || r.status === 'occupied');
  const available = rooms.filter((r) => r.status === 'available');

  return (
    <Shell title="Housekeeping" subtitle="Mark rooms clean, dirty, or under maintenance.">
      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Need attention" value={dirty.length} />
        <Kpi label="Ready (available)" value={available.length} />
      </div>
      <Panel title="Room status board" meta={loading ? 'Loading…' : `${rooms.length} rooms`}>
        {rooms.length === 0 && !loading ? (
          <p className={styles.greetingSub}>
            Add rooms first. <Link href={`${config.dashboardPath}/rooms`}>Rooms</Link>
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {rooms.map((r) => (
              <div
                key={r.id}
                style={{
                  border: '1px solid #eef2ff',
                  borderRadius: 14,
                  padding: 14,
                  background: '#fafbff',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 18 }}>{r.room_number}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                  {r.category} · Floor {r.floor || '—'}
                </div>
                <StatusPill status={r.status} />
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    type="button"
                    className={styles.topGhost}
                    style={{ fontSize: 12 }}
                    onClick={() => setStatus(r.id, 'available')}
                  >
                    Mark clean / available
                  </button>
                  <button
                    type="button"
                    className={styles.topGhost}
                    style={{ fontSize: 12 }}
                    onClick={() => setStatus(r.id, 'cleaning')}
                  >
                    Needs cleaning
                  </button>
                  <button
                    type="button"
                    className={styles.topGhost}
                    style={{ fontSize: 12 }}
                    onClick={() => setStatus(r.id, 'maintenance')}
                  >
                    Maintenance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </Shell>
  );
}

/* ─────────────── Check-in console ─────────────── */
export function HospitalityCheckinPage({ config }: { config: IndustryConfig }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const [bRes, dRes] = await Promise.all([
      fetch('/api/industries/hospitality/bookings', { headers: h }),
      fetch('/api/industries/hospitality/front-desk', { headers: h }),
    ]);
    const bJson = await bRes.json().catch(() => ({}));
    const dJson = await dRes.json().catch(() => ({}));
    setBookings(bJson.bookings || []);
    setRooms(dJson.rooms || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const arriving = bookings.filter(
    (b) => b.status === 'confirmed' && (!b.check_in_date || b.check_in_date <= today)
  );
  const inHouse = bookings.filter((b) => b.status === 'checked_in');

  async function checkIn(id: string, roomId?: string) {
    const h = await authHeaders();
    const body: any = { id, status: 'checked_in' };
    if (roomId) body.roomId = roomId;
    const res = await fetch('/api/industries/hospitality/bookings', {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json.error || 'Check-in failed');
      return;
    }
    setMsg('Guest checked in');
    await load();
  }

  async function checkOut(id: string) {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/bookings', {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ id, status: 'checked_out' }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setMsg(json.error || 'Check-out failed');
      return;
    }
    setMsg('Guest checked out — room set to cleaning');
    await load();
  }

  const freeRooms = rooms.filter((r) => r.status === 'available');

  return (
    <Shell
      title="Check-in / Check-out"
      subtitle="Process arrivals and departures. Room status updates automatically."
      actions={
        <Link href="/industries/hospitality/front-desk" className={styles.btnPrimary}>
          Live board
        </Link>
      }
    >
      {msg ? <p style={{ color: '#059669', fontSize: 13, marginBottom: 12 }}>{msg}</p> : null}
      <div className={styles.split}>
        <Panel title="Arrivals" meta={loading ? '…' : `${arriving.length} waiting`}>
          {arriving.length === 0 ? (
            <p className={styles.greetingSub}>No pending arrivals.</p>
          ) : (
            arriving.map((b) => (
              <div
                key={b.id}
                style={{
                  borderTop: '1px solid #f3f4f6',
                  padding: '12px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong>{b.guest_name}</strong>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {b.check_in_date}
                    {b.guest_phone ? ` · ${b.guest_phone}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!b.room_id && freeRooms.length > 0 ? (
                    <select
                      id={`room-${b.id}`}
                      style={{ ...inputStyle, marginBottom: 0, width: 120 }}
                      defaultValue={freeRooms[0]?.id}
                    >
                      {freeRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.room_number}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    style={{ fontSize: 13 }}
                    onClick={() => {
                      const sel = document.getElementById(`room-${b.id}`) as HTMLSelectElement | null;
                      checkIn(b.id, b.room_id || sel?.value);
                    }}
                  >
                    Check in
                  </button>
                </div>
              </div>
            ))
          )}
        </Panel>

        <Panel title="In-house" meta={`${inHouse.length} guests`}>
          {inHouse.length === 0 ? (
            <p className={styles.greetingSub}>No guests currently in-house.</p>
          ) : (
            inHouse.map((b) => (
              <div
                key={b.id}
                style={{
                  borderTop: '1px solid #f3f4f6',
                  padding: '12px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{b.guest_name}</strong>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{money(b.amount)}</div>
                </div>
                <button
                  type="button"
                  className={styles.topGhost}
                  onClick={() => checkOut(b.id)}
                >
                  Check out
                </button>
              </div>
            ))
          )}
        </Panel>
      </div>
    </Shell>
  );
}

/* ─────────────── Revenue ─────────────── */
export function HospitalityRevenuePage({ config }: { config: IndustryConfig }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/bookings', { headers: h });
      const json = await res.json().catch(() => ({}));
      setBookings(json.bookings || []);
      setLoading(false);
    })();
  }, []);

  const active = bookings.filter((b) => b.status !== 'cancelled');
  const total = active.reduce((s, b) => s + Number(b.amount || 0), 0);
  const checkedOut = bookings.filter((b) => b.status === 'checked_out');
  const collected = checkedOut.reduce((s, b) => s + Number(b.amount || 0), 0);
  const inHouse = bookings.filter((b) => b.status === 'checked_in');
  const outstanding = inHouse.reduce((s, b) => s + Number(b.amount || 0), 0);

  return (
    <Shell title="Revenue" subtitle="Stay revenue from reservations (cash/transfer recording stays on front desk).">
      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Gross booked" value={money(total)} />
        <Kpi label="Checked-out collected" value={money(collected)} />
        <Kpi label="In-house outstanding" value={money(outstanding)} />
        <Kpi label="Bookings" value={active.length} />
      </div>
      <Panel title="Recent booking amounts" meta={loading ? 'Loading…' : undefined}>
        {active.length === 0 ? (
          <p className={styles.greetingSub}>
            Revenue appears when reservations have amounts.{' '}
            <Link href={`${config.dashboardPath}/reservations`}>Create reservation</Link>
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                  <th style={{ padding: '8px 6px' }}>Guest</th>
                  <th style={{ padding: '8px 6px' }}>Check-in</th>
                  <th style={{ padding: '8px 6px' }}>Status</th>
                  <th style={{ padding: '8px 6px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {active.slice(0, 50).map((b) => (
                  <tr key={b.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 6px' }}>{b.guest_name}</td>
                    <td style={{ padding: '10px 6px' }}>{b.check_in_date}</td>
                    <td style={{ padding: '10px 6px' }}>
                      <StatusPill status={b.status} />
                    </td>
                    <td style={{ padding: '10px 6px' }}>{money(b.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </Shell>
  );
}
