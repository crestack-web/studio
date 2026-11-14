'use client';

import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  Kpi,
  PageHeader,
  SearchInput,
  Sheet,
  StatusBadge,
  Tabs,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { fmtDate, money } from '../format';
import { bookings, hotel, todaysArrivals, todaysDepartures } from './mock';
import type { Booking } from '../types';

type TabId = 'arrivals' | 'departures' | 'in_house';

export function HospitalityCheckin({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('arrivals');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [action, setAction] = useState<'check_in' | 'check_out'>('check_in');

  const inHouse = useMemo(() => bookings.filter((b) => b.status === 'checked_in'), []);

  const list = tab === 'arrivals' ? todaysArrivals : tab === 'departures' ? todaysDepartures : inHouse;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => `${b.guest_name} ${b.room_number} ${b.guest_phone}`.toLowerCase().includes(q));
  }, [list, query]);

  const openCheckIn = (b: Booking) => {
    setAction('check_in');
    setSelected(b);
  };
  const openCheckOut = (b: Booking) => {
    setAction('check_out');
    setSelected(b);
  };

  const arriveValue = todaysArrivals.reduce((a, b) => a + b.balance_amount, 0);
  const departValue = todaysDepartures.reduce((a, b) => a + b.balance_amount, 0);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="login" size={13} /> Front desk
          </>
        }
        title="Check-in & check-out"
        subtitle="Move guests through arrival and departure in a few taps. Folios, balances and room status update together."
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot green" /> {todaysArrivals.length} arrivals</span>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {todaysDepartures.length} departures</span>
            <span className="sol-stat-line"><span className="sol-dot blue" /> {inHouse.length} in-house</span>
            <span className="sol-stat-line">Check-in {hotel.checkIn} · check-out {hotel.checkOut}</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Arrivals today" value={todaysArrivals.length} icon="login" delta="First at 13:00" deltaDir="flat" foot="expected" accent />
        <Kpi label="Departures today" value={todaysDepartures.length} icon="logout" foot="before 11:00" />
        <Kpi label="Arrival balances" value={money(arriveValue)} icon="wallet" foot="to collect at desk" />
        <Kpi label="Departure balances" value={money(departValue)} icon="receipt" foot="to settle before release" />
      </div>

      <Card>
        <div className="sol-toolbar">
          <Tabs<TabId>
            value={tab}
            onChange={setTab}
            ariaLabel="Front desk lists"
            items={[
              { id: 'arrivals', label: 'Arrivals', count: todaysArrivals.length },
              { id: 'departures', label: 'Departures', count: todaysDepartures.length },
              { id: 'in_house', label: 'In-house', count: inHouse.length },
            ]}
          />
          <div className="sol-toolbar-spacer" />
          <SearchInput value={query} onChange={setQuery} placeholder="Search guest or room…" />
        </div>

        <div className="sol-mt-3">
          {filtered.length ? (
            <div className="sol-desk-grid">
              {filtered.map((b) => (
                <div key={b.id} className="sol-desk-card">
                  <div className="sol-desk-top">
                    <div className="sol-person">
                      <Avatar name={b.guest_name} />
                      <div className="sol-person-text">
                        <div className="sol-person-name">{b.guest_name}</div>
                        <div className="sol-person-sub">
                          Room {b.room_number} · {b.category}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="sol-desk-meta">
                    <span><Icon name="calendar" size={13} /> {fmtDate(b.check_in_date)} → {fmtDate(b.check_out_date)}</span>
                    <span><Icon name="users" size={13} /> {b.adults + b.children} guest{b.adults + b.children > 1 ? 's' : ''}</span>
                    <span><Icon name="phone" size={13} /> {b.guest_phone}</span>
                  </div>

                  {b.special_requests ? (
                    <div className="sol-help"><Icon name="bell" size={13} /> {b.special_requests}</div>
                  ) : null}

                  <div className="sol-desk-foot">
                    <div>
                      <div className="sol-small sol-muted">Balance</div>
                      <strong className={b.balance_amount > 0 ? '' : 'sol-muted'}>
                        {b.balance_amount > 0 ? money(b.balance_amount) : 'Settled'}
                      </strong>
                    </div>
                    {tab === 'arrivals' ? (
                      <button type="button" className="sol-btn sol-btn-primary sol-btn-sm" onClick={() => openCheckIn(b)}>
                        <Icon name="login" size={14} /> Check in
                      </button>
                    ) : tab === 'departures' ? (
                      <button type="button" className="sol-btn sol-btn-primary sol-btn-sm" onClick={() => openCheckOut(b)}>
                        <Icon name="logout" size={14} /> Check out
                      </button>
                    ) : (
                      <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => openCheckOut(b)}>
                        <Icon name="logout" size={14} /> Check out
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={tab === 'arrivals' ? 'login' : 'logout'}
              title={query ? 'No guests match your search' : 'Nothing left on this list'}
              message={
                query
                  ? 'Try another name or room number.'
                  : tab === 'arrivals'
                    ? 'Every expected arrival is already checked in.'
                    : tab === 'departures'
                      ? 'All departures are settled for today.'
                      : 'No guests are currently in-house.'
              }
            />
          )}
        </div>
      </Card>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={480}
        title={selected ? `${action === 'check_in' ? 'Check in' : 'Check out'} ${selected.guest_name}` : ''}
        subtitle={selected ? `Room ${selected.room_number} · ${selected.category}` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast(
                  action === 'check_in'
                    ? `${selected?.guest_name} checked into room ${selected?.room_number}.`
                    : `${selected?.guest_name} checked out — room released to housekeeping.`
                );
                setSelected(null);
              }}
            >
              <Icon name={action === 'check_in' ? 'login' : 'logout'} size={15} />
              {action === 'check_in' ? 'Complete check-in' : 'Complete check-out'}
            </button>
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-row sol-between">
              <div className="sol-person">
                <Avatar name={selected.guest_name} size="lg" />
                <div className="sol-person-text">
                  <div className="sol-person-name">{selected.guest_name}</div>
                  <div className="sol-person-sub">{selected.guest_email}</div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row"><span>Stay</span><strong>{fmtDate(selected.check_in_date)} → {fmtDate(selected.check_out_date)}</strong></div>
              <div className="sol-kv-row"><span>Nights</span><strong>{selected.nights}</strong></div>
              <div className="sol-kv-row"><span>Guests</span><strong>{selected.adults} adult{selected.adults > 1 ? 's' : ''}{selected.children ? `, ${selected.children} child` : ''}</strong></div>
              <div className="sol-kv-row"><span>Rate</span><strong>{money(selected.rate_per_night)} / night</strong></div>
              <div className="sol-kv-row"><span>Room total</span><strong>{money(selected.amount)}</strong></div>
              <div className="sol-kv-row"><span>Deposit paid</span><strong>−{money(selected.deposit_amount)}</strong></div>
              <div className="sol-kv-row total"><span>Balance due</span><strong>{money(selected.balance_amount)}</strong></div>
            </div>

            {action === 'check_in' ? (
              <div className="sol-banner green">
                <span className="sol-banner-icon"><Icon name="checkCircle" size={16} /></span>
                <div className="sol-banner-body">
                  <strong>Room is clean and ready</strong>
                  <div>Issue keys, confirm ID and collect the deposit if outstanding.</div>
                </div>
              </div>
            ) : (
              <div className="sol-banner amber">
                <span className="sol-banner-icon"><Icon name="receipt" size={16} /></span>
                <div className="sol-banner-body">
                  <strong>Folio will be closed</strong>
                  <div>Collect {money(selected.balance_amount)} balance and email the final folio.</div>
                </div>
              </div>
            )}

            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Payment recorded.')}>
                Take payment
              </button>
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Folio sent to guest email.')}>
                Email folio
              </button>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Room moved — update the board.')}>
                Change room
              </button>
            </div>
          </>
        ) : null}
      </Sheet>
    </>
  );
}
