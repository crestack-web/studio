'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './FrontDesk.module.css';

type Room = {
  id: string;
  room_number: string;
  floor: string | null;
  category: string;
  rate_amount: number;
  capacity: number;
  status: string;
};

type Booking = {
  id: string;
  guest_name: string;
  status: string;
  amount: number;
  check_in_date: string;
  created_at: string;
  room_id?: string;
  hospitality_rooms?: { room_number?: string; category?: string } | null;
};

type DeskData = {
  settings: { property_name?: string | null; logo_url?: string | null; currency?: string };
  metrics: {
    occupancyRate: number;
    checkInsToday: number;
    availableRooms: number;
    totalRooms: number;
    occupiedRooms: number;
    totalRevenue: number;
  };
  floors: string[];
  rooms: Room[];
  recentBookings: Booking[];
  schemaReady?: boolean;
  warnings?: string[];
};

function money(n: number, currency = 'NGN') {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'NGN',
      maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `₦${(n || 0).toLocaleString()}`;
  }
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 60) return `${Math.max(0, mins)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  return `${Math.round(hrs / 24)} day${hrs < 48 ? '' : 's'} ago`;
}

export function FrontDeskDashboard({
  config,
  mode = 'staff',
}: {
  config: IndustryConfig;
  mode?: 'staff' | 'owner-preview';
}) {
  const router = useRouter();
  const [data, setData] = useState<DeskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floor, setFloor] = useState<string>('all');
  const [busy, setBusy] = useState(false);

  const authHeaders = useCallback(async () => {
    const supabase = getSupabase();
    // TEMP: auth optional for QA
    const { data: sess } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sess.session?.access_token) headers.Authorization = `Bearer ${sess.session.access_token}`;
    return headers;
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const headers = await authHeaders();
      const res = await fetch('/api/industries/hospitality/front-desk', { headers });
      const json = await res.json().catch(() => ({}));
      // TEMP: ignore 401 during QA — show empty desk
      if (res.status === 401) {
        setData({
          settings: { property_name: config.productName, logo_url: null, currency: 'NGN' },
          metrics: { occupancyRate: 0, checkInsToday: 0, availableRooms: 0, totalRooms: 0, occupiedRooms: 0, totalRevenue: 0 },
          floors: [],
          rooms: [],
          recentBookings: [],
        } as any);
        return;
      }
      if (!res.ok) throw new Error(json.error || 'Failed to load front desk');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, config.loginPath, router]);

  useEffect(() => {
    load();
  }, [load]);

  const rooms = useMemo(() => {
    const list = data?.rooms || [];
    if (floor === 'all') return list;
    return list.filter((r) => String(r.floor) === floor);
  }, [data, floor]);

  async function setRoomStatus(room: Room, status: string) {
    setBusy(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/industries/hospitality/rooms', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: room.id, status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Update failed');
      }
      await load();
    } catch (e: any) {
      alert(e?.message || 'Could not update room');
    } finally {
      setBusy(false);
    }
  }

  async function updateBooking(id: string, status: string) {
    setBusy(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/industries/hospitality/bookings', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Update failed');
      }
      await load();
    } catch (e: any) {
      alert(e?.message || 'Could not update booking');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading front desk…</div>
      </div>
    );
  }

  const settings = data?.settings || {};
  const metrics = data?.metrics || {
    occupancyRate: 0,
    checkInsToday: 0,
    availableRooms: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    totalRevenue: 0,
  };
  const currency = settings.currency || 'NGN';
  const propertyName = settings.property_name || 'Front Desk';
  const logoUrl = settings.logo_url || '/email-logo.png';

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" className={styles.logo} />
          <div>
            <div className={styles.brandName}>{propertyName}</div>
            <div className={styles.brandSub}>Front desk</div>
          </div>
        </div>
        <nav className={styles.nav}>
          <span className={styles.navActive}>Dashboard</span>
          <Link href={`${config.dashboardPath}/reservations`}>Bookings</Link>
          <Link href={`${config.dashboardPath}/rooms`}>Rooms</Link>
          <Link href={`${config.dashboardPath}/guests`}>Guests</Link>
          {mode === 'owner-preview' ? (
            <Link href={`${config.dashboardPath}/settings`}>Hotel settings</Link>
          ) : null}
        </nav>
        <div className={styles.sidebarFoot}>
          <Link href={config.dashboardPath} className={styles.linkQuiet}>
            Owner overview →
          </Link>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1>Dashboard</h1>
            <p className={styles.topHint}>Live room status and today’s front-desk activity</p>
          </div>
          <Link href={`${config.dashboardPath}/reservations`} className={styles.primaryBtn}>
            + New Booking
          </Link>
        </header>

        {error ? <div className={styles.error}>{error}</div> : null}
        {data?.warnings?.length ? (
          <div className={styles.warn}>
            Run migration <code>0026_hospitality_front_desk.sql</code> if tables are missing. Owner can add
            rooms under Rooms and set the hotel logo in Hotel Settings.
          </div>
        ) : null}

        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Occupancy Rate</div>
            <div className={styles.metricValue}>{metrics.occupancyRate}%</div>
            <div className={styles.metricHint}>of total room capacity</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Today&apos;s Check-ins</div>
            <div className={styles.metricValue}>{metrics.checkInsToday}</div>
            <div className={styles.metricHint}>guests arriving today</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Available Rooms</div>
            <div className={styles.metricValue}>{metrics.availableRooms}</div>
            <div className={styles.metricHint}>rooms ready for booking</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Total Revenue</div>
            <div className={styles.metricValue}>{money(metrics.totalRevenue, currency)}</div>
            <div className={styles.metricHint}>from all bookings</div>
          </div>
        </div>

        <div className={styles.grid2}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Rooms</h2>
              <div className={styles.badges}>
                <span className={styles.badgeAvail}>Available: {metrics.availableRooms}</span>
                <span className={styles.badgeOcc}>Occupied: {metrics.occupiedRooms}</span>
              </div>
            </div>
            <div className={styles.floorTabs}>
              <button
                type="button"
                className={floor === 'all' ? styles.tabOn : styles.tab}
                onClick={() => setFloor('all')}
              >
                All Floors
              </button>
              {(data?.floors || []).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={floor === f ? styles.tabOn : styles.tab}
                  onClick={() => setFloor(f)}
                >
                  Floor {f}
                </button>
              ))}
            </div>
            <div className={styles.roomGrid}>
              {rooms.length === 0 ? (
                <p className={styles.empty}>
                  No rooms yet.{' '}
                  <Link href={`${config.dashboardPath}/rooms`}>Add rooms in the owner dashboard</Link>
                </p>
              ) : (
                rooms.map((room) => {
                  const occ = room.status === 'occupied';
                  return (
                    <button
                      key={room.id}
                      type="button"
                      disabled={busy}
                      className={occ ? styles.roomCardOcc : styles.roomCardAvail}
                      onClick={() =>
                        setRoomStatus(room, occ ? 'available' : 'occupied')
                      }
                      title="Tap to toggle available / occupied"
                    >
                      <div className={styles.roomNum}>{room.room_number}</div>
                      <div className={styles.roomRate}>
                        {money(Number(room.rate_amount), currency)}
                        <span>/night</span>
                      </div>
                      <div className={styles.roomCat}>{room.category}</div>
                      <div className={styles.roomStatus}>
                        {occ ? 'Occupied' : room.status === 'available' ? 'Available' : room.status} ·{' '}
                        {room.capacity} pax
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Recent Bookings</h2>
            </div>
            <ul className={styles.bookingList}>
              {(data?.recentBookings || []).length === 0 ? (
                <li className={styles.empty}>No bookings yet.</li>
              ) : (
                (data?.recentBookings || []).map((b) => (
                  <li key={b.id} className={styles.bookingRow}>
                    <div>
                      <div className={styles.guestName}>{b.guest_name}</div>
                      <div className={styles.bookingMeta}>
                        {b.hospitality_rooms?.room_number
                          ? `Room ${b.hospitality_rooms.room_number}`
                          : 'Room TBD'}{' '}
                        · {money(Number(b.amount), currency)} · {timeAgo(b.created_at)}
                      </div>
                    </div>
                    <div className={styles.bookingActions}>
                      <span className={styles.statusPill}>{b.status.replace('_', ' ')}</span>
                      {b.status === 'confirmed' ? (
                        <button type="button" disabled={busy} onClick={() => updateBooking(b.id, 'checked_in')}>
                          Check in
                        </button>
                      ) : null}
                      {b.status === 'checked_in' ? (
                        <button type="button" disabled={busy} onClick={() => updateBooking(b.id, 'checked_out')}>
                          Check out
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
