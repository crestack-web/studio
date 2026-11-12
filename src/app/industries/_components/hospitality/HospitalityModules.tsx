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
  meta?: React.ReactNode;
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
  const [showAddRoom, setShowAddRoom] = useState(false);
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
      setShowAddRoom(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patchRoom(id: string, body: Record<string, unknown>) {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/rooms', {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ id, ...body }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(json.error || 'Could not update room');
    else setMsg('Room updated');
    await load();
  }

  async function setStatus(id: string, status: string) {
    await patchRoom(id, { status });
  }

  async function removeRoom(id: string) {
    if (!confirm('Remove this room from the property?')) return;
    const h = await authHeaders();
    const res = await fetch(`/api/industries/hospitality/rooms?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: h,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json.error || 'Could not remove room');
      return;
    }
    setMsg('Room removed');
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
        <button type="button" className={styles.btnPrimary} onClick={() => setShowAddRoom(true)}>
          + Add room
        </button>
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
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {filtered.map((r) => {
                const floor = String(r.floor || '').replace(/^floor\s*/i, '');
                return (
                  <article key={r.id} style={{ border: '1px solid #ececf3', borderRadius: 14, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                      <div>
                        <strong>Room {r.room_number}</strong>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {r.category || 'Standard'}
                          {floor ? ` · Floor ${floor}` : ''}
                          {r.capacity ? ` · ${r.capacity} guests` : ''}
                        </div>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                      <label style={{ fontSize: 12, color: '#6b7280' }}>
                        Nightly rate
                        <input
                          style={{ ...inputStyle, marginTop: 4 }}
                          defaultValue={r.rate_amount}
                          inputMode="decimal"
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (Number.isFinite(next) && next !== Number(r.rate_amount)) patchRoom(r.id, { rateAmount: next });
                          }}
                        />
                      </label>
                      <label style={{ fontSize: 12, color: '#6b7280' }}>
                        Status
                        <select
                          value={r.status}
                          onChange={(e) => setStatus(r.id, e.target.value)}
                          style={{ ...inputStyle, marginTop: 4 }}
                        >
                          {['available', 'occupied', 'cleaning', 'maintenance', 'blocked'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button type="button" onClick={() => removeRoom(r.id)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#b91c1c', fontWeight: 600, padding: 0, cursor: 'pointer' }}>
                      Remove room
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>

        {showAddRoom ? (
        <Panel
          title="Add room"
          meta={
            <button type="button" className={styles.topGhost} onClick={() => setShowAddRoom(false)}>
              Cancel
            </button>
          }
        >
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
        ) : null}
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
  const [showAdd, setShowAdd] = useState(false);
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

  const [availableRoomIds, setAvailableRoomIds] = useState<string[] | null>(null);

  // Load rooms free for selected stay dates (double-booking aware)
  useEffect(() => {
    if (!form.checkInDate || !form.checkOutDate || form.checkOutDate <= form.checkInDate) {
      setAvailableRoomIds(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const h = await authHeaders();
        const res = await fetch(
          `/api/industries/hospitality/bookings?availableFor=${encodeURIComponent(form.checkInDate)}&availableUntil=${encodeURIComponent(form.checkOutDate)}`,
          { headers: h }
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && Array.isArray(json.rooms)) {
          setAvailableRoomIds(json.rooms.map((r: any) => r.id));
        } else {
          setAvailableRoomIds(null);
        }
      } catch {
        if (!cancelled) setAvailableRoomIds(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.checkInDate, form.checkOutDate]);

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
        <button type="button" className={styles.btnPrimary} onClick={() => setShowAdd(true)}>
          + New reservation
        </button>
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

        {showAdd ? (
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
              {rooms.map((r) => {
                const blocked =
                  availableRoomIds != null && !availableRoomIds.includes(r.id);
                const maint = r.status === 'maintenance' || r.status === 'blocked';
                return (
                  <option key={r.id} value={r.id} disabled={blocked || maint}>
                    {r.room_number} · {r.category} · {money(r.rate_amount)}/night
                    {maint ? ' · unavailable' : blocked ? ' · booked for these dates' : ' · free'}
                  </option>
                );
              })}
            </select>
            {form.checkInDate && form.checkOutDate && availableRoomIds != null ? (
              <p style={{ fontSize: 12, color: '#6b7280', margin: '-4px 0 10px' }}>
                {availableRoomIds.length} room(s) free for these dates (double-booking blocked).
              </p>
            ) : null}
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
            <button type="button" className={styles.topGhost} style={{ width: '100%', marginTop: 8 }} onClick={() => setShowAdd(false)}>Cancel</button>
          </form>
        </Panel>
        ) : null}
      </div>
    </Shell>
  );
}

/* ─────────────── Guests (CRM) ─────────────── */
export function HospitalityGuestsPage({ config }: { config: IndustryConfig }) {
  const [guests, setGuests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    idNumber: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/guests', { headers: h });
      const json = await res.json().catch(() => ({}));
      setGuests(json.guests || []);
      setBookings(json.bookings || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/guests', {
        method: 'POST',
        headers: h,
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || 'Could not save guest');
        return;
      }
      setForm({ fullName: '', phone: '', email: '', idNumber: '', notes: '' });
      setMsg('Guest saved');
      setShowAdd(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  // Merge profile guests + unique names from bookings
  const derived = useMemo(() => {
    const map = new Map<string, any>();
    for (const g of guests) {
      map.set(g.id, {
        id: g.id,
        name: g.full_name,
        phone: g.phone,
        email: g.email,
        idNumber: g.id_number,
        notes: g.notes,
        stays: 0,
        spent: 0,
        source: 'profile',
      });
    }
    for (const b of bookings) {
      const key = b.guest_id || `${(b.guest_name || '').toLowerCase()}|${b.guest_phone || ''}`;
      const existing = map.get(key);
      if (existing && existing.source === 'profile') {
        existing.stays += 1;
        existing.spent += Number(b.amount || 0);
      } else if (existing) {
        existing.stays += 1;
        existing.spent += Number(b.amount || 0);
      } else {
        map.set(String(key), {
          id: key,
          name: b.guest_name,
          phone: b.guest_phone,
          email: b.guest_email,
          stays: 1,
          spent: Number(b.amount || 0),
          source: 'booking',
        });
      }
    }
    // attach stays to profiles by name match
    for (const b of bookings) {
      for (const g of map.values()) {
        if (g.source === 'profile' && g.name && b.guest_name && g.name.toLowerCase() === String(b.guest_name).toLowerCase()) {
          if (!g._counted) {
            /* counted via guest_id path above when possible */
          }
        }
      }
    }
    return Array.from(map.values());
  }, [guests, bookings]);

  const filtered = derived.filter((g) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [g.name, g.phone, g.email, g.idNumber].join(' ').toLowerCase().includes(s);
  });

  return (
    <Shell
      title="Guests"
      subtitle="Guest profiles and stay history for the property."
      actions={
        <button type="button" className={styles.btnPrimary} onClick={() => setShowAdd(true)}>
          + Add guest
        </button>
      }
    >
      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Profiles" value={guests.length} />
        <Kpi label="Directory" value={derived.length} />
        <Kpi label="Stays logged" value={bookings.length} />
      </div>
      <div className={styles.split}>
        <Panel title="Guest directory" meta={loading ? 'Loading…' : `${filtered.length} shown`}>
          <input
            style={inputStyle}
            placeholder="Search name, phone, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {msg ? <p style={{ color: '#059669', fontSize: 13 }}>{msg}</p> : null}
          {filtered.length === 0 && !loading ? (
            <p className={styles.greetingSub}>No guests yet. Add a profile or create a reservation.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                    <th style={{ padding: '8px 6px' }}>Guest</th>
                    <th style={{ padding: '8px 6px' }}>Contact</th>
                    <th style={{ padding: '8px 6px' }}>Stays</th>
                    <th style={{ padding: '8px 6px' }}>Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 6px' }}>
                        <strong>{g.name}</strong>
                        {g.idNumber ? (
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>ID {g.idNumber}</div>
                        ) : null}
                      </td>
                      <td style={{ padding: '10px 6px', fontSize: 13 }}>
                        {g.phone || '—'}
                        <div style={{ color: '#9ca3af' }}>{g.email || ''}</div>
                      </td>
                      <td style={{ padding: '10px 6px' }}>{g.stays || '—'}</td>
                      <td style={{ padding: '10px 6px' }}>{money(g.spent || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        {showAdd ? (
        <Panel title="Add guest profile">
          <form onSubmit={addGuest}>
            <label style={labelStyle}>Full name *</label>
            <input
              style={inputStyle}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <label style={labelStyle}>ID / passport</label>
            <input
              style={inputStyle}
              value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            />
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: 56 }}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <button type="submit" className={styles.btnPrimary} disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Save guest'}
            </button>
            <button type="button" className={styles.topGhost} style={{ width: '100%', marginTop: 8 }} onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </form>
        </Panel>
        ) : null}
      </div>
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
                  {r.category} · {r.floor || '—'}
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
  const [walkIn, setWalkIn] = useState({
    guestName: '',
    guestPhone: '',
    roomId: '',
    nights: '1',
    amount: '',
  });
  const [walkBusy, setWalkBusy] = useState(false);

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

  async function submitWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!walkIn.guestName.trim() || !walkIn.roomId) {
      setMsg('Walk-in needs guest name and a free room');
      return;
    }
    setWalkBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const nights = Math.max(1, Number(walkIn.nights) || 1);
      const checkInDate = new Date().toISOString().slice(0, 10);
      const out = new Date();
      out.setDate(out.getDate() + nights);
      const checkOutDate = out.toISOString().slice(0, 10);
      const res = await fetch('/api/industries/hospitality/bookings', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          guestName: walkIn.guestName.trim(),
          guestPhone: walkIn.guestPhone || null,
          roomId: walkIn.roomId,
          checkInDate,
          checkOutDate,
          nights,
          amount: walkIn.amount ? Number(walkIn.amount) : undefined,
          status: 'checked_in',
          source: 'walk_in',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || 'Walk-in failed');
        return;
      }
      setWalkIn({ guestName: '', guestPhone: '', roomId: '', nights: '1', amount: '' });
      setMsg('Walk-in checked in');
      await load();
    } finally {
      setWalkBusy(false);
    }
  }

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

      <Panel title="Walk-in (check in now)" meta="Same-day arrival without prior booking">
        <form
          onSubmit={submitWalkIn}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}
        >
          <div>
            <label style={labelStyle}>Guest name *</label>
            <input
              style={inputStyle}
              value={walkIn.guestName}
              onChange={(e) => setWalkIn({ ...walkIn, guestName: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              value={walkIn.guestPhone}
              onChange={(e) => setWalkIn({ ...walkIn, guestPhone: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Room *</label>
            <select
              style={inputStyle}
              value={walkIn.roomId}
              onChange={(e) => setWalkIn({ ...walkIn, roomId: e.target.value })}
              required
            >
              <option value="">Select free room</option>
              {freeRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} · {money(r.rate_amount)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nights</label>
            <input
              style={inputStyle}
              type="number"
              min={1}
              value={walkIn.nights}
              onChange={(e) => setWalkIn({ ...walkIn, nights: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Amount (₦)</label>
            <input
              style={inputStyle}
              type="number"
              value={walkIn.amount}
              onChange={(e) => setWalkIn({ ...walkIn, amount: e.target.value })}
              placeholder="Auto from rate if empty"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className={styles.btnPrimary} disabled={walkBusy} style={{ width: '100%' }}>
              {walkBusy ? 'Checking in…' : 'Check in walk-in'}
            </button>
          </div>
        </form>
      </Panel>

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


/* ─────────────── Room service / folio charges ─────────────── */
export function HospitalityRoomServicePage({ config }: { config: IndustryConfig }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [lines, setLines] = useState<any[]>([]);
  const [totals, setTotals] = useState({ charges: 0, payments: 0, balance: 0 });
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [lineType, setLineType] = useState('charge');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/bookings', { headers: h });
      const json = await res.json().catch(() => ({}));
      const inHouse = (json.bookings || []).filter((b: any) =>
        ['checked_in', 'confirmed'].includes(b.status)
      );
      setBookings(inHouse);
    })();
  }, []);

  async function loadFolio(id: string) {
    setBookingId(id);
    const h = await authHeaders();
    const res = await fetch(`/api/industries/hospitality/folio?bookingId=${encodeURIComponent(id)}`, {
      headers: h,
    });
    const json = await res.json().catch(() => ({}));
    setLines(json.lines || []);
    setTotals(json.totals || { charges: 0, payments: 0, balance: 0 });
  }

  async function addLine(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId || !desc.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/folio', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          bookingId,
          description: desc.trim(),
          amount: Number(amount) || 0,
          lineType,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || 'Failed');
        return;
      }
      setDesc('');
      setAmount('');
      setMsg('Posted to folio');
      await loadFolio(bookingId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Room service & folio"
      subtitle="Post extras (meals, laundry, minibar) and payments to an in-house guest folio."
    >
      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Charges" value={money(totals.charges)} />
        <Kpi label="Payments" value={money(totals.payments)} />
        <Kpi label="Balance" value={money(totals.balance)} />
      </div>
      <div className={styles.split}>
        <Panel title="Select stay">
          <label style={labelStyle}>In-house / confirmed reservation</label>
          <select
            style={inputStyle}
            value={bookingId}
            onChange={(e) => loadFolio(e.target.value)}
          >
            <option value="">Choose guest…</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.guest_name} · {b.status} · {b.check_in_date}
              </option>
            ))}
          </select>
          {msg ? <p style={{ color: '#059669', fontSize: 13 }}>{msg}</p> : null}
          {lines.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                  <th style={{ padding: 6 }}>Type</th>
                  <th style={{ padding: 6 }}>Description</th>
                  <th style={{ padding: 6 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 6 }}>{l.line_type}</td>
                    <td style={{ padding: 6 }}>{l.description}</td>
                    <td style={{ padding: 6 }}>{money(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : bookingId ? (
            <p className={styles.greetingSub}>No folio lines yet.</p>
          ) : null}
        </Panel>
        <Panel title="Post line">
          <form onSubmit={addLine}>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={lineType} onChange={(e) => setLineType(e.target.value)}>
              <option value="charge">Charge (room service, laundry…)</option>
              <option value="payment">Payment (cash / transfer)</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <label style={labelStyle}>Description</label>
            <input
              style={inputStyle}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Dinner — Room 101"
              required
            />
            <label style={labelStyle}>Amount (₦)</label>
            <input
              style={inputStyle}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={busy || !bookingId}
              style={{ width: '100%' }}
            >
              {busy ? 'Posting…' : 'Post to folio'}
            </button>
          </form>
        </Panel>
      </div>
    </Shell>
  );
}

/* ─────────────── Expenses ─────────────── */
export function HospitalityExpensesPage({ config }: { config: IndustryConfig }) {
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch(
      `/api/industries/records?edition=hospitality&module=expenses`,
      { headers: h }
    );
    const json = await res.json().catch(() => ({}));
    setRows(json.records || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/records', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          module: 'expenses',
          title: title.trim(),
          amount: Number(amount) || 0,
          status: 'recorded',
          notes,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || 'Failed');
        return;
      }
      setTitle('');
      setAmount('');
      setNotes('');
      setMsg('Expense recorded');
      setShowAdd(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <Shell
      title="Expenses"
      subtitle="Property operating costs (supplies, utilities, maintenance)."
      actions={
        <button type="button" className={styles.btnPrimary} onClick={() => setShowAdd(true)}>
          + Add expense
        </button>
      }
    >
      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Recorded total" value={money(total)} />
        <Kpi label="Entries" value={rows.length} />
      </div>
      <div className={styles.split}>
        <Panel title="Expense log">
          {msg ? <p style={{ color: '#059669', fontSize: 13 }}>{msg}</p> : null}
          {rows.length === 0 ? (
            <p className={styles.greetingSub}>No expenses yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                  <th style={{ padding: 6 }}>Title</th>
                  <th style={{ padding: 6 }}>Amount</th>
                  <th style={{ padding: 6 }}>When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8 }}>{r.title}</td>
                    <td style={{ padding: 8 }}>{money(r.amount)}</td>
                    <td style={{ padding: 8, fontSize: 12 }}>
                      {r.occurred_at ? String(r.occurred_at).slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        {showAdd ? (
        <Panel title="Add expense">
          <form onSubmit={add}>
            <label style={labelStyle}>Description *</label>
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Generator fuel"
            />
            <label style={labelStyle}>Amount (₦)</label>
            <input
              style={inputStyle}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: 56 }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button type="submit" className={styles.btnPrimary} disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Record expense'}
            </button>
            <button type="button" className={styles.topGhost} style={{ width: '100%', marginTop: 8 }} onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </form>
        </Panel>
        ) : null}
      </div>
    </Shell>
  );
}

/* ─────────────── Reports + Night audit + Calendar ─────────────── */
export function HospitalityReportsPage({ config }: { config: IndustryConfig }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [audit, setAudit] = useState<any>(null);
  const [cal, setCal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'audit' | 'calendar'>('audit');

  const loadAudit = useCallback(async (d: string) => {
    const h = await authHeaders();
    const res = await fetch(
      `/api/industries/hospitality/night-audit?date=${encodeURIComponent(d)}`,
      { headers: h }
    );
    const json = await res.json().catch(() => ({}));
    if (res.ok) setAudit(json);
  }, []);

  const loadCal = useCallback(async () => {
    const h = await authHeaders();
    const start = new Date().toISOString().slice(0, 10);
    const res = await fetch(
      `/api/industries/hospitality/calendar?start=${encodeURIComponent(start)}&days=14`,
      { headers: h }
    );
    const json = await res.json().catch(() => ({}));
    if (res.ok) setCal(json);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadAudit(date), loadCal()]).finally(() => setLoading(false));
  }, [date, loadAudit, loadCal]);

  const rev = audit?.revenue || {};
  const act = audit?.activity || {};
  const prop = audit?.property || {};

  return (
    <Shell
      title="Reports"
      subtitle="Night audit (close of day) and 14-day room calendar — core PMS views for owners."
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          type="button"
          className={tab === 'audit' ? styles.btnPrimary : styles.topGhost}
          onClick={() => setTab('audit')}
        >
          Night audit
        </button>
        <button
          type="button"
          className={tab === 'calendar' ? styles.btnPrimary : styles.topGhost}
          onClick={() => setTab('calendar')}
        >
          Room calendar
        </button>
      </div>

      {loading ? <p className={styles.greetingSub}>Loading…</p> : null}

      {tab === 'audit' ? (
        <>
          <div style={{ marginBottom: 16, maxWidth: 220 }}>
            <label style={labelStyle}>Business date</label>
            <input
              style={inputStyle}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
            <Kpi label="Occupancy" value={`${rev.occupancyPct ?? 0}%`} hint="Sold nights ÷ sellable rooms" />
            <Kpi label="Room revenue" value={money(rev.roomRevenueToday || 0)} hint="Attributed to this date" />
            <Kpi label="ADR" value={money(rev.adr || 0)} hint="Average daily rate" />
            <Kpi label="RevPAR" value={money(rev.revpar || 0)} hint="Revenue ÷ sellable rooms" />
          </div>
          <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
            <Kpi label="Arrivals" value={act.arrivals ?? 0} />
            <Kpi label="Departures" value={act.departures ?? 0} />
            <Kpi label="In-house" value={act.inHouse ?? 0} />
            <Kpi label="Sold nights" value={act.soldNights ?? 0} />
          </div>
          <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
            <Kpi label="Total rooms" value={prop.totalRooms ?? 0} />
            <Kpi label="Available" value={prop.availableRooms ?? 0} />
            <Kpi label="Cleaning" value={prop.cleaningRooms ?? 0} />
            <Kpi label="Out of order" value={prop.outOfOrder ?? 0} />
          </div>
          <div className={styles.split}>
            <Panel title={`Arrivals · ${date}`} meta={`${(audit?.arrivals || []).length}`}>
              {(audit?.arrivals || []).length === 0 ? (
                <p className={styles.greetingSub}>No arrivals this date.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {(audit?.arrivals || []).map((b: any) => (
                    <li key={b.id} style={{ marginBottom: 6 }}>
                      <strong>{b.guest_name}</strong> — {b.status}
                      {b.amount != null ? ` · ${money(b.amount)}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title={`Departures · ${date}`} meta={`${(audit?.departures || []).length}`}>
              {(audit?.departures || []).length === 0 ? (
                <p className={styles.greetingSub}>No departures this date.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {(audit?.departures || []).map((b: any) => (
                    <li key={b.id} style={{ marginBottom: 6 }}>
                      <strong>{b.guest_name}</strong> — {b.status}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
          <Panel title="In-house tonight">
            {(audit?.inHouse || []).length === 0 ? (
              <p className={styles.greetingSub}>No in-house guests for this date.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                      <th style={{ padding: 6 }}>Guest</th>
                      <th style={{ padding: 6 }}>Stay</th>
                      <th style={{ padding: 6 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(audit?.inHouse || []).map((b: any) => (
                      <tr key={b.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                        <td style={{ padding: 8 }}>{b.guest_name}</td>
                        <td style={{ padding: 8, fontSize: 13 }}>
                          {b.check_in_date} → {b.check_out_date || '—'}
                        </td>
                        <td style={{ padding: 8 }}>{money(b.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      ) : (
        <Panel title="14-day room chart" meta="Reserved / in-house / free / OOO">
          {!cal?.grid?.length ? (
            <p className={styles.greetingSub}>
              Add rooms to see the calendar.{' '}
              <Link href={`${config.dashboardPath}/rooms`}>Rooms</Link>
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        position: 'sticky',
                        left: 0,
                        background: '#fff',
                        padding: 6,
                        textAlign: 'left',
                        zIndex: 1,
                      }}
                    >
                      Room
                    </th>
                    {(cal.dates || []).map((d: string) => (
                      <th key={d} style={{ padding: 4, fontWeight: 600, color: '#6b7280' }}>
                        {d.slice(5)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cal.grid.map((row: any) => (
                    <tr key={row.roomId}>
                      <td
                        style={{
                          position: 'sticky',
                          left: 0,
                          background: '#fff',
                          padding: 6,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.roomNumber}
                      </td>
                      {row.cells.map((c: any) => {
                        const bg =
                          c.state === 'free'
                            ? '#ecfdf5'
                            : c.state === 'reserved'
                              ? '#ede9fe'
                              : c.state === 'in_house'
                                ? '#dbeafe'
                                : '#fee2e2';
                        return (
                          <td
                            key={c.date}
                            title={c.guest ? `${c.guest} (${c.state})` : c.state}
                            style={{
                              padding: 4,
                              background: bg,
                              border: '1px solid #f3f4f6',
                              minWidth: 36,
                              textAlign: 'center',
                            }}
                          >
                            {c.state === 'free'
                              ? '·'
                              : c.state === 'ooo'
                                ? 'X'
                                : (c.guest || '?').slice(0, 1)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
                Green free · Purple reserved · Blue in-house · Red out of order. Hover a cell for guest name.
              </p>
            </div>
          )}
        </Panel>
      )}
    </Shell>
  );
}

/* ─────────────── Staff directory (ops roster) ─────────────── */
export function HospitalityStaffPage({ config }: { config: IndustryConfig }) {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('front_desk');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch(`/api/industries/hospitality/staff`, { headers: h });
    const json = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(json.staff)) {
      setRows(
        json.staff.map((s: any) => ({
          id: s.id,
          title: s.full_name || s.title,
          status: s.status || 'invited',
          meta: { role: s.role, phone: s.phone, email: s.email },
        }))
      );
      return;
    }
    const res2 = await fetch(`/api/industries/records?edition=hospitality&module=staff`, { headers: h });
    const j2 = await res2.json().catch(() => ({}));
    setRows(j2.records || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/staff', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          role,
          phone: phone.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Fallback to records if staff API not migrated
        const res2 = await fetch('/api/industries/records', {
          method: 'POST',
          headers: h,
          body: JSON.stringify({
            module: 'staff',
            title: name.trim(),
            status: 'invited',
            notes: email ? `Email: ${email}` : null,
            meta: { role, phone, email },
          }),
        });
        const j2 = await res2.json().catch(() => ({}));
        if (!res2.ok) {
          setMsg(json.error || j2.error || 'Failed');
          return;
        }
      }
      setName('');
      setEmail('');
      setPhone('');
      setMsg(json.message || 'Staff invited — they can sign in with Google or email on the staff portal');
      setShowAdd(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Staff"
      subtitle="Invite staff by email and role. They sign in on the front desk portal with Google or email."
      actions={
        <button type="button" className={styles.btnPrimary} onClick={() => setShowAdd(true)}>
          + Invite staff
        </button>
      }
    >
      <div className={styles.split}>
        <Panel title="Roster" meta={`${rows.length} people`}>
          {msg ? <p style={{ color: '#059669', fontSize: 13 }}>{msg}</p> : null}
          {rows.length === 0 ? (
            <p className={styles.greetingSub}>No staff listed yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 12 }}>
                  <th style={{ padding: 6 }}>Name</th>
                  <th style={{ padding: 6 }}>Role</th>
                  <th style={{ padding: 6 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8 }}>
                      {r.title}
                      {r.meta?.email ? (
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.meta.email}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: 8 }}>{(r.meta && r.meta.role) || '—'}</td>
                    <td style={{ padding: 8 }}>
                      <StatusPill status={r.status || 'active'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        {showAdd ? (
        <Panel title="Invite staff login">
          <form onSubmit={add}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
            <label style={labelStyle}>Work email *</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="staff@hotel.com" />
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="front_desk">Front desk</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="manager">Manager</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="submit" className={styles.btnPrimary} disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Saving…' : 'Create login invite'}
            </button>
            <button type="button" className={styles.topGhost} style={{ width: '100%', marginTop: 8 }} onClick={() => setShowAdd(false)}>Cancel</button>
          </form>
        </Panel>
        ) : null}
      </div>
    </Shell>
  );
}



/* ─────────────── Hotel website via Mo-sell ─────────────── */
export function HospitalityWebsitePage({ config }: { config: IndustryConfig }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [bioUrl, setBioUrl] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ orders30d?: number; gmv30d?: number; productCount?: number } | null>(null);
  // Optional simple Busmo landing (secondary)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: '',
    published: false,
    propertyName: '',
    tagline: '',
    about: '',
    addressLine: '',
    city: '',
    phone: '',
    whatsapp: '',
    email: '',
    amenities: '',
    heroImageUrl: '',
    gallery: '',
  });

  const loadMoSell = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/mo-sell', { headers: h });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || 'Could not load Mo-sell status');
      return;
    }
    setLinked(Boolean(json.linked));
    setConnectUrl(json.connectUrl || null);
    setStoreUrl(json.moSellStoreUrl || json.store?.publicStoreUrl || null);
    setBioUrl(json.store?.publicBioUrl || null);
    setStoreName(json.store?.name || null);
    setMetrics(json.metrics || null);
  }, []);

  const loadMiniSite = useCallback(async () => {
    const h = await authHeaders();
    const res = await fetch('/api/industries/hospitality/website', { headers: h });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.website) {
      const w = json.website;
      setForm({
        slug: w.slug || '',
        published: Boolean(w.published),
        propertyName: w.property_name || '',
        tagline: w.tagline || '',
        about: w.about || '',
        addressLine: w.address_line || '',
        city: w.city || '',
        phone: w.phone || '',
        whatsapp: w.whatsapp || '',
        email: w.email || '',
        amenities: Array.isArray(w.amenities) ? w.amenities.join(', ') : '',
        heroImageUrl: w.hero_image_url || '',
        gallery: Array.isArray(w.gallery) ? w.gallery.join('\n') : '',
      });
      setPublicUrl(json.publicUrl || null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadMoSell(), loadMiniSite()]);
    } finally {
      setLoading(false);
    }
  }, [loadMoSell, loadMiniSite]);

  useEffect(() => {
    load();
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadMoSell();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load, loadMoSell]);

  function openMoSell() {
    const url =
      connectUrl ||
      'https://mo-sell.store/dashboard/settings?connectFromBusmo=1';
    window.open(url, '_blank', 'noopener,noreferrer');
    setMsg('Finish setup in Mo-sell, then return here — status refreshes automatically.');
  }

  async function saveMini(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/hospitality/website', {
        method: 'PUT',
        headers: h,
        body: JSON.stringify({
          ...form,
          bookingEnabled: true,
          amenities: form.amenities,
          gallery: form.gallery
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || 'Could not save');
        return;
      }
      setPublicUrl(json.publicUrl || null);
      setMsg('Backup landing page saved');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Hotel website"
      subtitle="Build and host your hotel site with Mo-sell. Photos, address, phone, and online interest — orders and leads stay linked to this Busmo property."
    >
      {loading ? <p className={styles.greetingSub}>Loading…</p> : null}
      {error ? <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p> : null}
      {msg ? <p style={{ color: '#059669', fontSize: 13, marginBottom: 12 }}>{msg}</p> : null}

      <div className={styles.metricsGrid} style={{ marginBottom: 16 }}>
        <Kpi label="Mo-sell" value={linked ? 'Connected' : 'Not linked'} />
        <Kpi label="Orders (30d)" value={metrics?.orders30d ?? '—'} />
        <Kpi label="GMV (30d)" value={metrics?.gmv30d != null ? money(metrics.gmv30d) : '—'} />
        <Kpi label="Catalogue items" value={metrics?.productCount ?? '—'} />
      </div>

      {!linked ? (
        <Panel title="Create your hotel website with Mo-sell">
          <p className={styles.greetingSub} style={{ marginBottom: 14 }}>
            Mo-sell is Busmo’s storefront and link-in-bio product. Hotel owners use it to publish a public
            page with images, contact details, and offers. Connect the same business here so activity is
            tracked against this hospitality account.
          </p>
          <ol style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
            <li>Click <strong>Connect Mo-sell</strong> (same email as this account works best).</li>
            <li>In Mo-sell, set your hotel name, photos, address, and phone.</li>
            <li>Publish the store / bio page and share the link with guests.</li>
            <li>Return here — status updates when the tab is visible again.</li>
          </ol>
          <button type="button" className={styles.btnPrimary} onClick={openMoSell}>
            Connect Mo-sell
          </button>
          <button
            type="button"
            className={styles.topGhost}
            style={{ marginLeft: 8 }}
            onClick={() => loadMoSell()}
          >
            Refresh status
          </button>
        </Panel>
      ) : (
        <Panel title="Your Mo-sell hotel site" meta={storeName || 'Connected'}>
          <p className={styles.greetingSub} style={{ marginBottom: 12 }}>
            Edit images, address, phone numbers, and page layout in Mo-sell. This dashboard stays the system of
            record for rooms, stays, and revenue.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {storeUrl ? (
              <a href={storeUrl} target="_blank" rel="noreferrer" className={styles.btnPrimary}>
                Open public site
              </a>
            ) : null}
            {bioUrl ? (
              <a href={bioUrl} target="_blank" rel="noreferrer" className={styles.topGhost}>
                Open bio page
              </a>
            ) : null}
            <a
              href="https://mo-sell.store/dashboard"
              target="_blank"
              rel="noreferrer"
              className={styles.topGhost}
            >
              Edit in Mo-sell
            </a>
            <button type="button" className={styles.topGhost} onClick={() => loadMoSell()}>
              Refresh
            </button>
            <button
              type="button"
              className={styles.topGhost}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  const h = await authHeaders();
                  const res = await fetch('/api/industries/hospitality/mo-sell/sync-orders', {
                    method: 'POST',
                    headers: h,
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok || json.ok === false) {
                    setMsg(json.error || 'Sync failed');
                    return;
                  }
                  setMsg(
                    `Synced Mo-sell orders: ${json.imported || 0} new reservation(s), ${json.skipped || 0} already imported`
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Import orders → Reservations
            </button>
          </div>
          {storeUrl ? (
            <p style={{ fontSize: 13, wordBreak: 'break-all', margin: 0 }}>
              <strong>Link:</strong> {storeUrl}
            </p>
          ) : null}
        </Panel>
      )}

      <Panel title="How revenue stays in one place">
        <p className={styles.greetingSub} style={{ margin: 0 }}>
          Mo-sell is the public website layer. Room inventory, check-in, housekeeping, and night audit stay in
          Busmo Hospitality. When a guest books or pays through your linked Mo-sell property, treat those leads
          and orders as belonging to this business — confirm stays under <strong>Reservations</strong> so ADR
          and occupancy stay accurate.
        </p>
      </Panel>

      <button
        type="button"
        className={styles.topGhost}
        style={{ marginBottom: 12 }}
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? 'Hide' : 'Show'} optional Busmo backup landing page
      </button>

      {showAdvanced ? (
        <form onSubmit={saveMini}>
          <Panel title="Optional /h/slug landing (Busmo-hosted backup)">
            <p className={styles.greetingSub}>
              Only if you need a simple page on busmo.io in addition to Mo-sell. Primary website creation remains Mo-sell.
            </p>
            <label style={labelStyle}>Hotel name</label>
            <input
              style={inputStyle}
              value={form.propertyName}
              onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
            />
            <label style={labelStyle}>Slug</label>
            <input
              style={inputStyle}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="my-hotel"
            />
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <label style={labelStyle}>About</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80 }}
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
            />
            <label style={{ ...labelStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Publish backup page
            </label>
            {publicUrl ? (
              <p style={{ fontSize: 13 }}>
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  {publicUrl}
                </a>
              </p>
            ) : null}
            <button type="submit" className={styles.btnPrimary} disabled={busy}>
              {busy ? 'Saving…' : 'Save backup page'}
            </button>
          </Panel>
        </form>
      ) : null}
    </Shell>
  );
}
