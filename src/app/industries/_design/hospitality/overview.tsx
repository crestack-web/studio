'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Kpi,
  Progress,
  Ring,
  StatusBadge,
} from '../primitives';
import { Sparkline, TrendChart } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money, todayISO } from '../format';
import {
  activity,
  housekeepingRooms,
  occupancy,
  reservationStats,
  revenueSeries,
  rooms,
  todaysArrivals,
  todaysDepartures,
  hotel,
} from './mock';

const kindIcon: Record<string, string> = {
  check_in: 'login',
  check_out: 'logout',
  booking: 'calendar',
  payment: 'card',
  housekeeping: 'sparkles',
  alert: 'bell',
};

export function HospitalityOverview({ hrefFor }: { hrefFor: (s: string) => string }) {
  const today = todayISO();
  const hkDone = housekeepingRooms.filter((r) => r.stage === 'ready' || r.stage === 'inspected').length;
  const vipArrivals = todaysArrivals.filter((b) => b.rate_per_night >= 150000).length;

  const highlightRooms = [
    ...rooms.filter((r) => r.status === 'occupied').slice(0, 4),
    ...rooms.filter((r) => r.status === 'available').slice(0, 4),
    ...rooms.filter((r) => r.status === 'cleaning').slice(0, 2),
    ...rooms.filter((r) => r.status === 'ooo').slice(0, 2),
  ];

  const revenueChart = revenueSeries.map((p) => ({
    label: fmtDate(p.date),
    Rooms: p.rooms,
    'Food & beverage': p.food,
    Services: p.other,
  }));

  const occupancySpark = revenueSeries.map((p) => p.occupancy);
  const revenueSpark = revenueSeries.map((p) => p.rooms + p.food + p.other);

  // Safe access when live hydrate returns empty series (new workspace / no data yet)
  const lastPoint =
    revenueSeries.length > 0
      ? revenueSeries[revenueSeries.length - 1]
      : { rooms: 0, food: 0, other: 0, occupancy: 0, date: today };
  const todayRevenue = lastPoint.rooms + lastPoint.food + lastPoint.other;
  const hkProgress =
    housekeepingRooms.length > 0 ? (hkDone / housekeepingRooms.length) * 100 : 0;

  return (
    <>
      <section className="sol-hero">
        <div className="sol-hero-body">
          <div className="sol-hero-date">
            <Clock size={13} aria-hidden /> {fmtDate(today, { weekday: true, year: true })} · Front desk live
          </div>
          <h1>Welcome back{hotel.ownerName ? `, ${hotel.ownerName.split(' ')[0]}` : ''}.</h1>
          <p className="sol-hero-sub">
            {todaysArrivals.length} guests arriving, {todaysDepartures.length} checking out and{' '}
            {occupancy.available} rooms ready to sell. Here is how {hotel.name || 'your hotel'} is running today.
          </p>
        </div>
        <div className="sol-hero-side">
          <div className="sol-hero-actions">
            <Link href={hrefFor('reservations')} className="sol-btn sol-btn-primary">
              <Icon name="plus" size={15} /> New reservation
            </Link>
            <Link href={hrefFor('checkin')} className="sol-btn sol-btn-subtle">
              <Icon name="login" size={15} /> Check in a guest
            </Link>
          </div>
          <div className="sol-row sol-small sol-muted">
            <span className="sol-dot green" /> All systems normal
          </div>
        </div>
      </section>

      <div className="sol-kpis">
        <Kpi
          label="Occupancy rate"
          value={`${occupancy.rate}%`}
          icon="trend"
          foot="of total rooms"
          accent
          spark={occupancySpark.length ? <Sparkline data={occupancySpark} /> : undefined}
        />
        <Kpi
          label="Available rooms"
          value={occupancy.available}
          icon="bed"
          foot={`of ${occupancy.total} rooms · ${occupancy.cleaning} cleaning`}
        />
        <Kpi
          label="Arrivals today"
          value={todaysArrivals.length}
          icon="calendar"
          delta={vipArrivals ? `${vipArrivals} priority` : undefined}
          deltaDir={vipArrivals ? 'flat' : undefined}
          foot={todaysArrivals.length ? 'expected today' : 'none expected'}
        />
        <Kpi
          label="Revenue today"
          value={compactMoney(todayRevenue)}
          icon="wallet"
          foot="rooms + F&B + services"
          spark={revenueSpark.length ? <Sparkline data={revenueSpark} color="var(--sol-chart-2)" /> : undefined}
        />
      </div>

      <div className="sol-grid sol-grid-main">
        <Card
          title="Revenue performance"
          subtitle="Rooms, food & beverage and services · last 14 days"
          action={
            <Link href={hrefFor('revenue')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Revenue report <ArrowUpRight size={13} aria-hidden />
            </Link>
          }
        >
          {revenueChart.length > 0 ? (
            <TrendChart
              data={revenueChart}
              series={[
                { key: 'Rooms', name: 'Rooms' },
                { key: 'Food & beverage', name: 'Food & beverage', color: 'var(--sol-chart-2)' },
                { key: 'Services', name: 'Services', color: 'var(--sol-chart-3)' },
              ]}
              height={264}
              money
              yFormat={(v) => compactMoney(v)}
            />
          ) : (
            <div className="sol-muted sol-small" style={{ padding: '48px 0', textAlign: 'center' }}>
              No revenue data yet. Record bookings and payments to see the chart.
            </div>
          )}
          <div className="sol-between sol-mt-3">
            <div className="sol-legend">
              <span className="sol-legend-item">
                <span className="sol-swatch" /> Rooms
              </span>
              <span className="sol-legend-item">
                <span className="sol-swatch" style={{ background: 'var(--sol-chart-2)' }} /> Food & beverage
              </span>
              <span className="sol-legend-item">
                <span className="sol-swatch" style={{ background: 'var(--sol-chart-3)' }} /> Services
              </span>
            </div>
            <span className="sol-small sol-muted">
              ADR <strong className="sol-num">{money(occupancy.adr)}</strong> · RevPAR{' '}
              <strong className="sol-num">{money(occupancy.revpar)}</strong>
            </span>
          </div>
        </Card>

        <Card title="Room status" subtitle="Live housekeeping picture">
          <div className="sol-ring-card">
            <Ring value={occupancy.rate} label={`${occupancy.rate}%`} sub="Occupied" />
            <div className="sol-ring-stats">
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot blue" /> Occupied
                </span>
                <strong>{occupancy.occupied}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot green" /> Available
                </span>
                <strong>{occupancy.available}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot amber" /> Cleaning
                </span>
                <strong>{occupancy.cleaning}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot red" /> Out of order
                </span>
                <strong>{occupancy.outOfOrder}</strong>
              </div>
            </div>
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-row sol-between sol-mt-3">
            <div>
              <div className="sol-kpi-label">Housekeeping progress</div>
              <div className="sol-small sol-muted sol-mt-2">
                {hkDone} of {housekeepingRooms.length} rooms ready
              </div>
            </div>
            <Link href={hrefFor('housekeeping')} className="sol-btn sol-btn-subtle sol-btn-sm">
              Board
            </Link>
          </div>
          <div className="sol-mt-2">
            <Progress value={hkProgress} label="Housekeeping rooms ready" />
          </div>
        </Card>
      </div>

      <div className="sol-grid sol-grid-2">
        <Card
          title="Arrivals today"
          subtitle={`${todaysArrivals.length} expected · ${vipArrivals} priority guests`}
          flush
          action={
            <Link href={hrefFor('checkin')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Open desk <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {todaysArrivals.slice(0, 5).map((b) => (
              <div key={b.id} className="sol-list-row">
                <Avatar name={b.guest_name} />
                <div className="sol-list-main">
                  <div className="sol-list-title">{b.guest_name}</div>
                  <div className="sol-list-sub">
                    Room {b.room_number} · {b.nights} night{b.nights > 1 ? 's' : ''} · {b.adults} adult
                    {b.adults > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="sol-list-side">
                  {b.balance_amount > 0 ? (
                    <span className="sol-badge sol-badge-amber">{money(b.balance_amount)} due</span>
                  ) : (
                    <span className="sol-badge sol-badge-green">Prepaid</span>
                  )}
                  <small>{b.category}</small>
                </div>
              </div>
            ))}
            {!todaysArrivals.length ? (
              <div className="sol-list-row sol-muted sol-small">No arrivals expected today.</div>
            ) : null}
          </div>
        </Card>

        <Card
          title="Departures today"
          subtitle={`${todaysDepartures.length} checking out`}
          flush
          action={
            <Link href={hrefFor('checkin')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Folios <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {todaysDepartures.map((b) => (
              <div key={b.id} className="sol-list-row">
                <Avatar name={b.guest_name} />
                <div className="sol-list-main">
                  <div className="sol-list-title">{b.guest_name}</div>
                  <div className="sol-list-sub">
                    Room {b.room_number} · checked in {fmtDate(b.check_in_date)}
                  </div>
                </div>
                <div className="sol-list-side">
                  {b.balance_amount > 0 ? (
                    <span className="sol-badge sol-badge-red">{money(b.balance_amount)} balance</span>
                  ) : (
                    <span className="sol-badge sol-badge-green">Settled</span>
                  )}
                  <small>{b.category}</small>
                </div>
              </div>
            ))}
            {!todaysDepartures.length ? (
              <div className="sol-list-row sol-muted sol-small">No departures scheduled today.</div>
            ) : (
              <div className="sol-list-row sol-muted sol-small">
                <CheckCircle2 size={15} aria-hidden />
                <div className="sol-list-main">
                  Rooms release to housekeeping as soon as folios are closed.
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="sol-split">
        <Card
          title="Room board"
          subtitle="A quick read of the property — tap a room to manage it"
          action={
            <Link href={hrefFor('rooms')} className="sol-btn sol-btn-ghost sol-btn-sm">
              All {occupancy.total} rooms <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-mini-rooms">
            {highlightRooms.length > 0 ? (
              highlightRooms.map((r) => (
                <Link key={r.id} href={hrefFor('rooms')} className="sol-mini-room" data-status={r.status}>
                  <strong>{r.room_number}</strong>
                  <small>{r.status === 'ooo' ? 'OOO' : r.status}</small>
                </Link>
              ))
            ) : (
              <div className="sol-muted sol-small" style={{ padding: '24px 0' }}>
                No rooms configured yet. Add rooms to see the board.
              </div>
            )}
          </div>
          <div className="sol-legend sol-mt-3">
            <span className="sol-legend-item">
              <span className="sol-dot blue" /> Occupied
            </span>
            <span className="sol-legend-item">
              <span className="sol-dot green" /> Available
            </span>
            <span className="sol-legend-item">
              <span className="sol-dot amber" /> Cleaning
            </span>
            <span className="sol-legend-item">
              <span className="sol-dot red" /> Out of order
            </span>
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-grid sol-grid-3 sol-mt-3">
            <div>
              <div className="sol-kpi-label">In-house guests</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {reservationStats.inHouse}
              </div>
            </div>
            <div>
              <div className="sol-kpi-label">ADR</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {compactMoney(occupancy.adr)}
              </div>
            </div>
            <div>
              <div className="sol-kpi-label">RevPAR</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {compactMoney(occupancy.revpar)}
              </div>
            </div>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card
            title="Housekeeping"
            subtitle={`${housekeepingRooms.length} rooms in today’s list`}
            action={
              <Link href={hrefFor('housekeeping')} className="sol-btn sol-btn-ghost sol-btn-sm">
                Board
              </Link>
            }
          >
            <div className="sol-stack-2">
              {housekeepingRooms.slice(0, 4).map((r) => (
                <div key={r.id} className="sol-between">
                  <div className="sol-row sol-gap-2">
                    <span className="sol-room-num" style={{ fontSize: 13 }}>
                      {r.room_number}
                    </span>
                    <span className="sol-small sol-muted">{r.assignee}</span>
                  </div>
                  <StatusBadge status={r.stage} />
                </div>
              ))}
              {!housekeepingRooms.length ? (
                <div className="sol-small sol-muted">No housekeeping tasks yet.</div>
              ) : null}
            </div>
          </Card>

          <Card title="Recent activity" subtitle="Across the front desk" flush>
            <div className="sol-card-body" style={{ padding: '14px 18px' }}>
              <div className="sol-timeline">
                {activity.slice(0, 5).map((a) => (
                  <div key={a.id} className="sol-timeline-item">
                    <span className="sol-timeline-dot">
                      <Icon name={kindIcon[a.kind] || 'dot'} size={14} />
                    </span>
                    <div className="sol-timeline-body">
                      <strong>{a.title}</strong>
                      <small>{a.detail}</small>
                    </div>
                    <span className="sol-timeline-time">{a.time}</span>
                  </div>
                ))}
                {!activity.length ? (
                  <div className="sol-small sol-muted">No recent activity.</div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
