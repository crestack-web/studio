'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { getIndustryConfig } from '@/lib/industries/config';

const config = getIndustryConfig('hospitality')!;

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [category, setCategory] = useState('Standard');
  const [rate, setRate] = useState('25000');
  const [msg, setMsg] = useState<string | null>(null);

  async function headers() {
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) {
      router.replace(config.loginPath);
      throw new Error('auth');
    }
    return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
  }

  async function load() {
    const h = await headers();
    const res = await fetch('/api/industries/hospitality/front-desk', { headers: h });
    const json = await res.json();
    setRooms(json.rooms || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const h = await headers();
      const res = await fetch('/api/industries/hospitality/rooms', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          roomNumber,
          floor,
          category,
          rateAmount: Number(rate) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setRoomNumber('');
      setMsg('Room added');
      await load();
    } catch (err: any) {
      setMsg(err?.message || 'Error');
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <Link href={config.dashboardPath} style={{ color: '#6b3fe7', fontWeight: 600 }}>← Owner dashboard</Link>
      {' · '}
      <Link href="/industries/hospitality/front-desk" style={{ color: '#6b3fe7', fontWeight: 600 }}>Front desk</Link>
      <h1>Rooms</h1>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Owner setup — rooms appear on the staff front desk board.</p>
      <form onSubmit={addRoom} style={{ display: 'grid', gap: 10, margin: '16px 0', padding: 16, border: '1px solid #e8e8f0', borderRadius: 12 }}>
        <input required placeholder="Room number e.g. 205" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e8e8f0' }} />
        <input placeholder="Floor e.g. 2" value={floor} onChange={(e) => setFloor(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e8e8f0' }} />
        <input placeholder="Category e.g. Deluxe" value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e8e8f0' }} />
        <input placeholder="Rate per night" value={rate} onChange={(e) => setRate(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e8e8f0' }} />
        <button type="submit" style={{ background: '#6b3fe7', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700 }}>Add room</button>
        {msg ? <p style={{ fontSize: 13 }}>{msg}</p> : null}
      </form>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rooms.map((r) => (
          <li key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{r.room_number}</strong> · {r.category} · Floor {r.floor || '—'} · ₦{Number(r.rate_amount).toLocaleString()}/night</span>
            <span style={{ color: r.status === 'available' ? '#047857' : '#b91c1c', fontWeight: 600 }}>{r.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
