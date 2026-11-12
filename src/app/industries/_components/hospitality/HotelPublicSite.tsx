'use client';

import React, { useCallback, useEffect, useState } from 'react';

type Hotel = {
  slug: string;
  propertyName?: string | null;
  tagline?: string | null;
  about?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  amenities?: string[];
  heroImageUrl?: string | null;
  gallery?: string[];
  bookingEnabled?: boolean;
  primaryColor?: string;
};

type Room = {
  id: string;
  room_number: string;
  category: string;
  rate_amount: number;
  capacity: number;
  status: string;
};

function money(n: number) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function HotelPublicSite({ slug }: { slug: string }) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    checkInDate: new Date().toISOString().slice(0, 10),
    checkOutDate: '',
    roomId: '',
    adults: '1',
    specialRequests: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q =
        form.checkInDate && form.checkOutDate
          ? `?checkIn=${encodeURIComponent(form.checkInDate)}&checkOut=${encodeURIComponent(form.checkOutDate)}`
          : '';
      const res = await fetch(`/api/public/hotel/${encodeURIComponent(slug)}${q}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Hotel not found');
        setHotel(null);
        return;
      }
      setHotel(json.hotel);
      setRooms(json.rooms || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [slug, form.checkInDate, form.checkOutDate]);

  useEffect(() => {
    load();
  }, [load]);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/public/hotel/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: form.guestName.trim(),
          guestPhone: form.guestPhone || null,
          guestEmail: form.guestEmail || null,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          roomId: form.roomId || null,
          adults: Number(form.adults) || 1,
          specialRequests: form.specialRequests || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error || 'Booking failed');
        return;
      }
      setMsg(json.message || 'Booking received. We will confirm shortly.');
      setForm((f) => ({ ...f, guestName: '', guestPhone: '', guestEmail: '', specialRequests: '' }));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !hotel) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui' }}>
        Loading hotel…
      </div>
    );
  }
  if (error || !hotel) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 8px' }}>Site unavailable</h1>
          <p style={{ color: '#6b7280' }}>{error || 'Not found'}</p>
        </div>
      </div>
    );
  }

  const color = hotel.primaryColor || '#5b21b6';
  const loc = [hotel.addressLine, hotel.city, hotel.state, hotel.country].filter(Boolean).join(', ');

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: '#fafafa', color: '#0f172a' }}>
      <header
        style={{
          background: hotel.heroImageUrl
            ? `linear-gradient(180deg, rgba(15,23,42,0.45), rgba(15,23,42,0.7)), url(${hotel.heroImageUrl}) center/cover`
            : `linear-gradient(135deg, ${color}, #1e1b4b)`,
          color: '#fff',
          padding: '48px 20px 56px',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>Powered by Busmo Hospitality</div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {hotel.propertyName || 'Hotel'}
          </h1>
          {hotel.tagline ? <p style={{ margin: '10px 0 0', fontSize: '1.05rem', opacity: 0.95 }}>{hotel.tagline}</p> : null}
          {loc ? <p style={{ margin: '14px 0 0', fontSize: 14, opacity: 0.9 }}>{loc}</p> : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18, fontSize: 14 }}>
            {hotel.phone ? <a href={`tel:${hotel.phone}`} style={{ color: '#fff' }}>{hotel.phone}</a> : null}
            {hotel.whatsapp ? (
              <a
                href={`https://wa.me/${String(hotel.whatsapp).replace(/\D/g, '')}`}
                style={{ color: '#fff' }}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
            {hotel.email ? <a href={`mailto:${hotel.email}`} style={{ color: '#fff' }}>{hotel.email}</a> : null}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 64px' }}>
        {hotel.about ? (
          <section style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #eee' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>About</h2>
            <p style={{ margin: 0, lineHeight: 1.6, color: '#374151', whiteSpace: 'pre-wrap' }}>{hotel.about}</p>
          </section>
        ) : null}

        {(hotel.amenities || []).length > 0 ? (
          <section style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #eee' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Amenities</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(hotel.amenities || []).map((a) => (
                <span
                  key={a}
                  style={{
                    background: '#f5f3ff',
                    color: color,
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {(hotel.gallery || []).length > 0 ? (
          <section style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Gallery</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 10,
              }}
            >
              {(hotel.gallery || []).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #eee' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>Book a stay</h2>
          <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>
            Check-in {hotel.checkInTime || '14:00'} · Check-out {hotel.checkOutTime || '12:00'}. Your request goes
            straight to the hotel.
          </p>
          {!hotel.bookingEnabled ? (
            <p>Online booking is paused. Call {hotel.phone || 'the hotel'} to reserve.</p>
          ) : (
            <form onSubmit={book}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={lab}>Check-in *</label>
                  <input
                    style={inp}
                    type="date"
                    required
                    value={form.checkInDate}
                    onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={lab}>Check-out *</label>
                  <input
                    style={inp}
                    type="date"
                    required
                    value={form.checkOutDate}
                    onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                  />
                </div>
              </div>
              <label style={lab}>Room (optional)</label>
              <select
                style={inp}
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              >
                <option value="">Any available / assign later</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} · {r.category} · {money(r.rate_amount)}/night
                  </option>
                ))}
              </select>
              <label style={lab}>Full name *</label>
              <input
                style={inp}
                required
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lab}>Phone</label>
                  <input
                    style={inp}
                    value={form.guestPhone}
                    onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={lab}>Email</label>
                  <input
                    style={inp}
                    type="email"
                    value={form.guestEmail}
                    onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                  />
                </div>
              </div>
              <label style={lab}>Special requests</label>
              <textarea
                style={{ ...inp, minHeight: 72 }}
                value={form.specialRequests}
                onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
              />
              {msg ? (
                <p style={{ color: msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('not') ? '#dc2626' : '#059669', fontSize: 14 }}>
                  {msg}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: color,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                {busy ? 'Sending…' : 'Request booking'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

const lab: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  marginBottom: 4,
};
const inp: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  fontSize: 14,
  marginBottom: 10,
  boxSizing: 'border-box',
};
