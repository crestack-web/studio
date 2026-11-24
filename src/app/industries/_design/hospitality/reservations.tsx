'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, Filter, Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Chips,
  EmptyState,
  Field,
  Menu,
  MenuItem,
  PageHeader,
  SearchInput,
  Sheet,
  StatusBadge,
  Tabs,
  Td,
  Th,
  TableWrap,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { addDays, fmtDate, money, nightsBetween, todayISO } from '../format';
import { bookings, folioLines, hotel, roomTypeStats, rooms } from './mock';
import { useSolutionsLive } from '../live';
import { copyText, downloadCsv, mailto } from '../action-helpers';
import type { Booking } from '../types';

type TabId = 'all' | 'arriving' | 'in_house' | 'departing' | 'cancelled';
type ViewId = 'list' | 'calendar';

const SOURCE_LABEL: Record<string, string> = {
  website: 'Website',
  ota: 'OTA',
  corporate: 'Corporate',
  front_desk: 'Front desk',
  phone: 'Phone',
  walk_in: 'Walk-in',
};

const SOURCE_TONE: Record<string, 'green' | 'blue' | 'violet' | 'amber' | 'gray'> = {
  website: 'green',
  ota: 'violet',
  corporate: 'blue',
  front_desk: 'gray',
  phone: 'amber',
  walk_in: 'gray',
};

export function HospitalityReservations({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const today = todayISO();
  const [tab, setTab] = useState<TabId>('all');
  const [view, setView] = useState<ViewId>('list');
  const [query, setQuery] = useState('');
  const [roomType, setRoomType] = useState('all');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: bookings.length,
      arriving: bookings.filter((b) => b.check_in_date === today && ['confirmed', 'pending'].includes(b.status)).length,
      in_house: bookings.filter((b) => b.status === 'checked_in').length,
      departing: bookings.filter((b) => b.check_out_date === today && b.status === 'checked_in').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    }),
    [today]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (tab === 'arriving' && !(b.check_in_date === today && ['confirmed', 'pending'].includes(b.status))) return false;
      if (tab === 'in_house' && b.status !== 'checked_in') return false;
      if (tab === 'departing' && !(b.check_out_date === today && b.status === 'checked_in')) return false;
      if (tab === 'cancelled' && b.status !== 'cancelled') return false;
      if (roomType !== 'all' && b.category !== roomType) return false;
      if (!q) return true;
      return `${b.guest_name} ${b.room_number} ${b.guest_email} ${b.category}`.toLowerCase().includes(q);
    });
  }, [tab, query, roomType, today]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const calRooms = rooms.slice(0, 12);

  const updateBooking = async (booking: Booking, status: string, message: string) => {
    const res = await mutate({
      action: 'booking_update',
      id: booking.id,
      status,
      roomId: rooms.find((r) => r.room_number === booking.room_number)?.id,
    });
    if (!res.ok) {
      toast(res.error || 'Could not update the reservation.');
      return;
    }
    toast(message);
    setSelected(null);
  };

  const mailtoGuest = (email: string, confirmation: string) => {
    const ok = mailto(email, `Your reservation ${confirmation}`);
    toast(ok ? 'Email draft opened.' : 'No guest email available.');
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="calendar" size={13} /> Reservations
          </>
        }
        title="Reservations"
        subtitle="Every booking, arrival and departure in one place. Changes sync to the front desk and housekeeping instantly."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => { downloadCsv('reservations.csv', filtered.map((r) => ({ confirmation: r.id, guest: r.guest_name, room: r.room_number, check_in: r.check_in_date, check_out: r.check_out_date, status: r.status, amount: r.amount }))); toast('Reservation list exported as CSV.'); }}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setNewOpen(true)}>
              <Plus size={15} aria-hidden /> New reservation
            </button>
          </>
        }
        meta={
          <>
            <span className="sol-stat-line">
              <span className="sol-dot blue" /> {counts.in_house} in-house
            </span>
            <span className="sol-stat-line">
              <span className="sol-dot green" /> {counts.arriving} arriving
            </span>
            <span className="sol-stat-line">
              <span className="sol-dot amber" /> {counts.departing} departing
            </span>
          </>
        }
      />

      <Card>
        <div className="sol-toolbar">
          <Tabs<TabId>
            value={tab}
            onChange={setTab}
            ariaLabel="Filter reservations"
            items={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'arriving', label: 'Arriving', count: counts.arriving },
              { id: 'in_house', label: 'In-house', count: counts.in_house },
              { id: 'departing', label: 'Departing', count: counts.departing },
              { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
            ]}
          />
          <div className="sol-toolbar-spacer" />
          <SearchInput value={query} onChange={setQuery} placeholder="Search guest, room or email…" />
          <div className="sol-tabs">
            <button type="button" className="sol-tab" aria-selected={view === 'list'} onClick={() => setView('list')}>
              List
            </button>
            <button type="button" className="sol-tab" aria-selected={view === 'calendar'} onClick={() => setView('calendar')}>
              7-day view
            </button>
          </div>
        </div>

        <div className="sol-mt-3">
          <Chips
            value={roomType}
            onChange={setRoomType}
            items={[
              { id: 'all', label: 'All room types' },
              ...roomTypeStats.map((t) => ({ id: t.category, label: t.category })),
            ]}
          />
        </div>

        {view === 'list' ? (
          <div className="sol-mt-3">
            {filtered.length ? (
              <div className="sol-card" style={{ boxShadow: 'none' }}>
                <TableWrap>
                  <table className="sol-table">
                    <thead>
                      <tr>
                        <Th>Guest</Th>
                        <Th>Room</Th>
                        <Th>Stay</Th>
                        <Th>Status</Th>
                        <Th align="right">Balance</Th>
                        <Th>Source</Th>
                        <Th align="right" width={44} />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((b) => (
                        <tr key={b.id} data-clickable="true" onClick={() => setSelected(b)}>
                          <Td>
                            <div className="sol-person">
                              <Avatar name={b.guest_name} />
                              <div className="sol-person-text">
                                <div className="sol-person-name">{b.guest_name}</div>
                                <div className="sol-person-sub">{b.guest_phone}</div>
                              </div>
                            </div>
                          </Td>
                          <Td>
                            <div className="sol-person-name">Room {b.room_number}</div>
                            <div className="sol-person-sub">{b.category}</div>
                          </Td>
                          <Td>
                            <div className="sol-person-name">
                              {fmtDate(b.check_in_date)} → {fmtDate(b.check_out_date)}
                            </div>
                            <div className="sol-person-sub">
                              {b.nights} night{b.nights > 1 ? 's' : ''} · {b.adults + b.children} guest
                              {b.adults + b.children > 1 ? 's' : ''}
                            </div>
                          </Td>
                          <Td>
                            <StatusBadge status={b.status} />
                          </Td>
                          <Td align="right">
                            <span className={b.balance_amount > 0 ? 'strong' : 'muted'}>
                              {b.balance_amount > 0 ? money(b.balance_amount) : money(b.amount)}
                            </span>
                          </Td>
                          <Td>
                            <Badge tone={SOURCE_TONE[b.source] || 'gray'}>{SOURCE_LABEL[b.source]}</Badge>
                          </Td>
                          <Td align="right">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Menu label="Reservation actions">
                                {(close) => (
                                  <>
                                    <MenuItem
                                      onClick={() => {
                                        close();
                                        setSelected(b);
                                      }}
                                    >
                                      View reservation
                                    </MenuItem>
                                    <MenuItem
                                      onClick={() => {
                                        close();
                                        void updateBooking(
                                          b,
                                          'checked_in',
                                          `Check-in started for ${b.guest_name}.`,
                                        );
                                      }}
                                    >
                                      Check in guest
                                    </MenuItem>
                                    <MenuItem onClick={() => close()}>Copy confirmation</MenuItem>
                                    <div className="sol-menu-sep" />
                                    <MenuItem
                                      destructive
                                      onClick={() => {
                                        close();
                                        void updateBooking(
                                          b,
                                          'cancelled',
                                          `Reservation for ${b.guest_name} cancelled.`,
                                        );
                                      }}
                                    >
                                      Cancel reservation
                                    </MenuItem>
                                  </>
                                )}
                              </Menu>
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              </div>
            ) : (
              <EmptyState
                icon="calendar"
                title="No reservations match"
                message="Try a different tab, room type or search term."
                action={
                  <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => { setTab('all'); setRoomType('all'); setQuery(''); }}>
                    Reset filters
                  </button>
                }
              />
            )}
          </div>
        ) : (
          <div className="sol-mt-3">
            <div className="sol-cal-wrap sol-card" style={{ boxShadow: 'none' }}>
              <div className="sol-cal">
                <div className="sol-cal-head">
                  <div>Room</div>
                  {days.map((d) => (
                    <div key={d} className={d === today ? 'today' : ''}>
                      {fmtDate(d, { weekday: true })}
                    </div>
                  ))}
                </div>
                {calRooms.map((room) => {
                  const roomBookings = bookings.filter(
                    (b) => b.room_number === room.room_number && b.status !== 'cancelled'
                  );
                  return (
                    <div key={room.id} className="sol-cal-row">
                      <div className="sol-cal-room">
                        <strong>{room.room_number}</strong>
                        <small>{room.category}</small>
                      </div>
                      <div className="sol-cal-cells">
                        {days.map((day) => {
                          const booking = roomBookings.find(
                            (b) => b.check_in_date <= day && b.check_out_date > day
                          );
                          if (!booking) return <div key={day} className={`sol-cal-cell ${day === today ? 'today' : ''}`} />;
                          const isStart = booking.check_in_date === day;
                          return (
                            <div key={day} className={`sol-cal-cell ${day === today ? 'today' : ''}`}>
                              <div
                                className={`sol-cal-bar status-${booking.status}`}
                                title={`${booking.guest_name} · ${fmtDate(booking.check_in_date)} → ${fmtDate(booking.check_out_date)}`}
                                onClick={() => setSelected(booking)}
                                style={{
                                  borderTopLeftRadius: isStart ? 6 : 0,
                                  borderBottomLeftRadius: isStart ? 6 : 0,
                                }}
                              >
                                {isStart ? (
                                  <>
                                    {booking.guest_name.split(' ')[0]}
                                    <small>
                                      {booking.nights}n · {booking.adults + booking.children} guest
                                    </small>
                                  </>
                                ) : (
                                  <span aria-hidden>·</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="sol-legend sol-mt-3">
              <span className="sol-legend-item"><span className="sol-dot green" /> Checked in</span>
              <span className="sol-legend-item"><span className="sol-dot blue" /> Confirmed</span>
              <span className="sol-legend-item"><span className="sol-dot amber" /> Pending</span>
              <span className="sol-small sol-dim">Showing first 12 rooms · scroll for the rest</span>
            </div>
          </div>
        )}
      </Card>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.guest_name : ''}
        subtitle={selected ? `${selected.category} · Room ${selected.room_number}` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() =>
                selected &&
                updateBooking(selected, 'checked_in', `Check-in started for ${selected.guest_name}.`)
              }
            >
              <Icon name="login" size={15} /> Check in guest
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
                  <div className="sol-person-sub">
                    {selected.guest_phone} · {selected.guest_email}
                  </div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-grid sol-grid-2">
              <div className="sol-kv">
                <div className="sol-kv-row"><span>Check-in</span><strong>{fmtDate(selected.check_in_date, { weekday: true })} · {hotel.checkIn}</strong></div>
                <div className="sol-kv-row"><span>Check-out</span><strong>{fmtDate(selected.check_out_date, { weekday: true })} · {hotel.checkOut}</strong></div>
                <div className="sol-kv-row"><span>Nights</span><strong>{selected.nights}</strong></div>
                <div className="sol-kv-row"><span>Guests</span><strong>{selected.adults} adult{selected.adults > 1 ? 's' : ''}{selected.children ? `, ${selected.children} child` : ''}</strong></div>
              </div>
              <div className="sol-kv">
                <div className="sol-kv-row"><span>Room</span><strong>{selected.room_number}</strong></div>
                <div className="sol-kv-row"><span>Rate</span><strong>{money(selected.rate_per_night)}/night</strong></div>
                <div className="sol-kv-row"><span>Source</span><strong>{SOURCE_LABEL[selected.source]}</strong></div>
                <div className="sol-kv-row"><span>Booked</span><strong>{fmtDate(selected.created_at.slice(0, 10))}</strong></div>
              </div>
            </div>

            {selected.special_requests ? (
              <div className="sol-banner">
                <span className="sol-banner-icon"><Icon name="bell" size={16} /></span>
                <div className="sol-banner-body">
                  <strong>Special requests</strong>
                  <div>{selected.special_requests}</div>
                </div>
              </div>
            ) : null}

            <div>
              <div className="sol-section-title">
                <h2>Folio</h2>
                <Badge tone={selected.balance_amount > 0 ? 'amber' : 'green'}>
                  {selected.balance_amount > 0 ? `${money(selected.balance_amount)} due` : 'Settled'}
                </Badge>
              </div>
              <div className="sol-kv">
                <div className="sol-kv-row"><span>Room charges · {selected.nights} nights</span><strong>{money(selected.amount)}</strong></div>
                <div className="sol-kv-row"><span>Food & beverage</span><strong>{money(24_000)}</strong></div>
                <div className="sol-kv-row"><span>Services</span><strong>{money(18_000)}</strong></div>
                <div className="sol-kv-row"><span>VAT 7.5%</span><strong>{money(24_375)}</strong></div>
                <div className="sol-kv-row"><span>Deposit paid</span><strong>−{money(selected.deposit_amount)}</strong></div>
                <div className="sol-kv-row total"><span>Balance due</span><strong>{money(selected.balance_amount || 0)}</strong></div>
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={async () => { const ok = await copyText(selected.id); toast(ok ? 'Confirmation copied to clipboard.' : 'Could not copy confirmation.'); }}>
                Copy confirmation
              </button>
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => mailtoGuest(selected.guest_email, selected.id)}>
                Email folio
              </button>
            </div>

            {selected.id === 'bk-1000' ? (
              <div className="sol-help">
                {folioLines.length} folio lines synced from the front desk.
              </div>
            ) : null}
          </>
        ) : null}
      </Sheet>

      <NewReservationSheet open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  );
}

function NewReservationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const today = todayISO();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    guest: '',
    phone: '',
    email: '',
    checkIn: today,
    checkOut: addDays(today, 1),
    category: 'Deluxe King',
    room: '',
    adults: '2',
    children: '0',
    requests: '',
  });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const nights = nightsBetween(form.checkIn, form.checkOut);
  const rate = roomTypeStats.find((t) => t.category === form.category)?.rate_amount || 65000;
  const available = rooms.filter((r) => r.category === form.category && r.status === 'available');

  const createReservation = async () => {
    const room = rooms.find((r) => r.room_number === form.room);
    setSaving(true);
    const res = await mutate({
      action: 'booking_create',
      guestName: form.guest.trim(),
      guestPhone: form.phone.trim() || undefined,
      guestEmail: form.email.trim() || undefined,
      checkInDate: form.checkIn,
      checkOutDate: form.checkOut,
      roomId: room?.id,
      roomNumber: room?.room_number,
      category: form.category,
      ratePerNight: room?.rate_amount || rate,
      adults: Number(form.adults) || 1,
      children: Number(form.children) || 0,
      specialRequests: form.requests.trim() || undefined,
      status: 'confirmed',
      source: 'front_desk',
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not create the reservation.');
      return;
    }
    toast(`Reservation created for ${form.guest.trim()} · ${nights} night${nights > 1 ? 's' : ''}.`);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={520}
      title="New reservation"
      subtitle="Book a stay and hold the room instantly"
      footer={
        <>
          <button type="button" className="sol-btn sol-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="sol-btn sol-btn-primary"
            disabled={!form.guest.trim() || nights < 1 || saving}
            onClick={createReservation}
          >
            {saving ? 'Creating…' : 'Create reservation'}
          </button>
        </>
      }
    >
      <div className="sol-form-grid">
        <Field label="Guest name" className="full">
          <input className="sol-input" value={form.guest} onChange={set('guest')} placeholder="e.g. Ada Nwosu" />
        </Field>
        <Field label="Phone">
          <input className="sol-input" value={form.phone} onChange={set('phone')} placeholder="+234 …" />
        </Field>
        <Field label="Email">
          <input className="sol-input" value={form.email} onChange={set('email')} placeholder="guest@email.com" />
        </Field>
        <Field label="Check-in">
          <input className="sol-input" type="date" value={form.checkIn} onChange={set('checkIn')} />
        </Field>
        <Field label="Check-out">
          <input className="sol-input" type="date" value={form.checkOut} onChange={set('checkOut')} />
        </Field>
        <Field label="Room type">
          <select className="sol-select" value={form.category} onChange={set('category')}>
            {roomTypeStats.map((t) => (
              <option key={t.category} value={t.category}>
                {t.category} · {money(t.rate_amount)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room">
          <select className="sol-select" value={form.room} onChange={set('room')}>
            <option value="">Assign on arrival</option>
            {available.map((r) => (
              <option key={r.id} value={r.room_number}>
                Room {r.room_number} · {r.floor}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Adults">
          <select className="sol-select" value={form.adults} onChange={set('adults')}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={String(n)}>{n}</option>)}
          </select>
        </Field>
        <Field label="Children">
          <select className="sol-select" value={form.children} onChange={set('children')}>
            {[0, 1, 2, 3].map((n) => <option key={n} value={String(n)}>{n}</option>)}
          </select>
        </Field>
        <Field label="Special requests" className="full" hint="Allergies, arrival time, transfers or anything the team should know.">
          <textarea className="sol-textarea" value={form.requests} onChange={set('requests')} placeholder="Optional" />
        </Field>
      </div>

      <div className="sol-banner green">
        <span className="sol-banner-icon"><Icon name="calendar" size={16} /></span>
        <div className="sol-banner-body">
          <strong>{nights || 0} night{nights === 1 ? '' : 's'} · {form.category}</strong>
          <div>
            {money(rate)} per night · estimated total {money(rate * nights)} · {available.length} rooms available
          </div>
        </div>
      </div>
    </Sheet>
  );
}
