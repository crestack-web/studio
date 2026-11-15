'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import {
  Badge,
  Card,
  Chips,
  EmptyState,
  Field,
  Kpi,
  Menu,
  MenuItem,
  PageHeader,
  Progress,
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
import { compactMoney, fmtDate, money } from '../format';
import { bookings, occupancy, roomTypeStats, rooms } from './mock';
import { useSolutionsLive } from '../live';
import type { Room, RoomStatus } from '../types';

type StatusTab = 'all' | RoomStatus;
type ViewId = 'grid' | 'list';

const STATUS_LABEL: Record<string, string> = {
  occupied: 'Occupied',
  available: 'Available',
  cleaning: 'Cleaning',
  ooo: 'Out of order',
  inspected: 'Inspected',
  reserved: 'Reserved',
};

export function HospitalityRooms({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [tab, setTab] = useState<StatusTab>('all');
  const [view, setView] = useState<ViewId>('grid');
  const [query, setQuery] = useState('');
  const [floor, setFloor] = useState('all');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<Room | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: rooms.length,
      occupied: rooms.filter((r) => r.status === 'occupied').length,
      available: rooms.filter((r) => r.status === 'available').length,
      cleaning: rooms.filter((r) => r.status === 'cleaning').length,
      ooo: rooms.filter((r) => r.status === 'ooo').length,
    }),
    []
  );

  const floors = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floor))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms.filter((r) => {
      if (tab !== 'all' && r.status !== tab) return false;
      if (floor !== 'all' && r.floor !== floor) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (!q) return true;
      return `${r.room_number} ${r.category} ${r.guest_name || ''}`.toLowerCase().includes(q);
    });
  }, [tab, floor, category, query]);

  const selectedBooking = selected?.guest_name
    ? bookings.find((b) => b.guest_name === selected.guest_name && b.room_number === selected.room_number)
    : undefined;

  const setRoomStatus = async (room: Room, status: RoomStatus, message: string) => {
    const res = await mutate({ action: 'room_update', id: room.id, status });
    if (!res.ok) {
      toast(res.error || 'Could not update the room.');
      return;
    }
    toast(message);
    setSelected(null);
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="bed" size={13} /> Rooms
          </>
        }
        title="Rooms & suites"
        subtitle="The live state of every room in the property. Availability syncs to reservations, housekeeping and your website."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Room list exported as CSV.')}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} aria-hidden /> Add room
            </button>
          </>
        }
        meta={
          <>
            <span className="sol-stat-line">
              <span className="sol-dot green" /> {counts.available} available
            </span>
            <span className="sol-stat-line">
              <span className="sol-dot blue" /> {counts.occupied} occupied
            </span>
            <span className="sol-stat-line">
              <span className="sol-dot amber" /> {counts.cleaning} cleaning
            </span>
            <span className="sol-stat-line">
              <span className="sol-dot red" /> {counts.ooo} out of order
            </span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Occupancy" value={`${occupancy.rate}%`} icon="trend" delta="+4.2%" deltaDir="up" foot="vs last week" accent />
        <Kpi label="Sellable tonight" value={counts.available} icon="bed" foot={`${counts.cleaning} turning over`} />
        <Kpi label="Average daily rate" value={compactMoney(occupancy.adr)} icon="wallet" delta="+2.1%" deltaDir="up" foot="7-day average" />
        <Kpi label="RevPAR" value={compactMoney(occupancy.revpar)} icon="chart" foot="per available room" />
      </div>

      <Card>
        <div className="sol-toolbar">
          <Tabs<StatusTab>
            value={tab}
            onChange={setTab}
            ariaLabel="Filter rooms by status"
            items={[
              { id: 'all', label: 'All rooms', count: counts.all },
              { id: 'available', label: 'Available', count: counts.available },
              { id: 'occupied', label: 'Occupied', count: counts.occupied },
              { id: 'cleaning', label: 'Cleaning', count: counts.cleaning },
              { id: 'ooo', label: 'Out of order', count: counts.ooo },
            ]}
          />
          <div className="sol-toolbar-spacer" />
          <SearchInput value={query} onChange={setQuery} placeholder="Search room or guest…" />
          <div className="sol-tabs">
            <button type="button" className="sol-tab" aria-selected={view === 'grid'} onClick={() => setView('grid')}>
              Grid
            </button>
            <button type="button" className="sol-tab" aria-selected={view === 'list'} onClick={() => setView('list')}>
              List
            </button>
          </div>
        </div>

        <div className="sol-row sol-gap-2 sol-wrap sol-mt-3">
          <Chips
            value={floor}
            onChange={setFloor}
            items={[{ id: 'all', label: 'All floors' }, ...floors.map((f) => ({ id: f, label: f }))]}
          />
          <Chips
            value={category}
            onChange={setCategory}
            items={[{ id: 'all', label: 'All types' }, ...roomTypeStats.map((t) => ({ id: t.category, label: t.category }))]}
          />
        </div>

        {!filtered.length ? (
          <div className="sol-mt-3">
            <EmptyState
              icon="bed"
              title="No rooms match"
              message="Change the status, floor or room type filter."
              action={
                <button
                  type="button"
                  className="sol-btn sol-btn-subtle sol-btn-sm"
                  onClick={() => {
                    setTab('all');
                    setFloor('all');
                    setCategory('all');
                    setQuery('');
                  }}
                >
                  Reset filters
                </button>
              }
            />
          </div>
        ) : view === 'grid' ? (
          <div className="sol-room-grid sol-mt-3">
            {filtered.map((room) => (
              <button
                key={room.id}
                type="button"
                className="sol-room"
                data-status={room.status}
                onClick={() => setSelected(room)}
              >
                <div className="sol-room-top">
                  <span className="sol-room-num">{room.room_number}</span>
                  <span className={`sol-dot ${room.status === 'occupied' ? 'blue' : room.status === 'available' ? 'green' : room.status === 'cleaning' ? 'amber' : 'red'}`} />
                </div>
                <span className="sol-room-type">{room.category}</span>
                <span className="sol-room-meta">
                  {room.guest_name ? room.guest_name : STATUS_LABEL[room.status]}
                </span>
                <span className="sol-room-meta">
                  {room.guest_name
                    ? `Out ${room.check_out_date ? fmtDate(room.check_out_date) : '—'}`
                    : `${money(room.rate_amount)} / night`}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="sol-mt-3">
            <div className="sol-card" style={{ boxShadow: 'none' }}>
              <TableWrap>
                <table className="sol-table">
                  <thead>
                    <tr>
                      <Th>Room</Th>
                      <Th>Type</Th>
                      <Th>Floor</Th>
                      <Th>Status</Th>
                      <Th>Guest</Th>
                      <Th align="right">Rate</Th>
                      <Th align="right" width={44} />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((room) => (
                      <tr key={room.id} data-clickable="true" onClick={() => setSelected(room)}>
                        <Td><span className="strong">{room.room_number}</span></Td>
                        <Td>{room.category}</Td>
                        <Td className="muted">{room.floor}</Td>
                        <Td><StatusBadge status={room.status} /></Td>
                        <Td>{room.guest_name || <span className="muted">—</span>}</Td>
                        <Td align="right"><span className="num">{money(room.rate_amount)}</span></Td>
                        <Td align="right">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Menu label={`Room ${room.room_number} actions`}>
                              {(close) => (
                                <>
                                  <MenuItem onClick={() => { close(); setSelected(room); }}>View room</MenuItem>
                                  <MenuItem onClick={() => { close(); toast(`Housekeeping notified for room ${room.room_number}.`); }}>
                                    Send to housekeeping
                                  </MenuItem>
                                  <MenuItem onClick={() => { close(); toast(`Room ${room.room_number} marked out of order.`); }}>
                                    Mark out of order
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
          </div>
        )}
      </Card>

      <div className="sol-grid sol-grid-2">
        <Card title="Room type performance" subtitle="Occupancy and revenue by category" flush>
          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Room type</Th>
                  <Th align="right">Rooms</Th>
                  <Th align="right">Occupied</Th>
                  <Th>Occupancy</Th>
                  <Th align="right">Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {roomTypeStats.map((t) => (
                  <tr key={t.category}>
                    <Td>
                      <div className="sol-person-name">{t.category}</div>
                      <div className="sol-person-sub">{money(t.rate_amount)} / night · {t.capacity} guests</div>
                    </Td>
                    <Td align="right" className="num">{t.total}</Td>
                    <Td align="right" className="num">{t.occupied}</Td>
                    <Td>
                      <div className="sol-row sol-gap-2">
                        <Progress value={t.total ? (t.occupied / t.total) * 100 : 0} label={`${t.category} occupancy`} />
                        <span className="sol-small sol-muted sol-nowrap">
                          {t.total ? Math.round((t.occupied / t.total) * 100) : 0}%
                        </span>
                      </div>
                    </Td>
                    <Td align="right" className="num strong">{compactMoney(t.revenue)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <Card title="Out of order & maintenance" subtitle={`${counts.ooo} rooms blocked from sale`}>
          <div className="sol-stack-3">
            {rooms
              .filter((r) => r.status === 'ooo')
              .map((r) => (
                <div key={r.id} className="sol-between">
                  <div>
                    <div className="sol-person-name">Room {r.room_number}</div>
                    <div className="sol-person-sub">{r.notes || r.category}</div>
                  </div>
                  <Badge tone="red" dot>Blocked</Badge>
                </div>
              ))}
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-row sol-between sol-mt-3">
            <span className="sol-small sol-muted">Maintenance assigned to Musa Garba</span>
            <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Maintenance schedule opened.')}>
              View schedule
            </button>
          </div>
        </Card>
      </div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={480}
        title={selected ? `Room ${selected.room_number}` : ''}
        subtitle={selected ? `${selected.category} · ${selected.floor}` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>
              Close
            </button>
            {selected?.status === 'available' ? (
              <button type="button" className="sol-btn sol-btn-primary" onClick={() => setRoomStatus(selected, 'reserved', `Room ${selected.room_number} is now reserved.`)}>
                <Icon name="calendar" size={15} /> Reserve room
              </button>
            ) : (
              <button type="button" className="sol-btn sol-btn-primary" onClick={() => setRoomStatus(selected as Room, 'available', `Room ${selected?.room_number} released.`)}>
                <Icon name="check" size={15} /> Mark ready
              </button>
            )}
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-row sol-between">
              <div className="sol-row sol-gap-2">
                <StatusBadge status={selected.status} />
                <Badge tone="gray">{selected.bed_type}</Badge>
              </div>
              <span className="sol-small sol-muted">{selected.size_sqm} m² · {selected.capacity} guests</span>
            </div>

            {selected.guest_name ? (
              <div className="sol-banner">
                <span className="sol-banner-icon"><Icon name="user" size={16} /></span>
                <div className="sol-banner-body">
                  <strong>{selected.guest_name}</strong>
                  <div>
                    {selectedBooking ? `${selectedBooking.nights} nights · ${selectedBooking.adults + selectedBooking.children} guests` : 'In-house guest'}
                    {selected.check_out_date ? ` · departure ${fmtDate(selected.check_out_date)}` : ''}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="sol-kv">
              <div className="sol-kv-row"><span>Nightly rate</span><strong>{money(selected.rate_amount)}</strong></div>
              <div className="sol-kv-row"><span>Housekeeper</span><strong>{selected.housekeeper || 'Unassigned'}</strong></div>
              <div className="sol-kv-row"><span>Floor</span><strong>{selected.floor}</strong></div>
              <div className="sol-kv-row"><span>Notes</span><strong>{selected.notes || '—'}</strong></div>
            </div>

            <div>
              <div className="sol-section-title"><h2>Amenities</h2></div>
              <div className="sol-row sol-gap-2 sol-wrap">
                {selected.amenities.map((a) => (
                  <span key={a} className="sol-tag">{a}</span>
                ))}
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast(`Room ${selected.room_number} sent to housekeeping.`)}>
                Send to housekeeping
              </button>
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast(`Maintenance ticket opened for room ${selected.room_number}.`)}>
                Log maintenance
              </button>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Room history opened.')}>
                View history
              </button>
            </div>
          </>
        ) : null}
      </Sheet>

      <AddRoomSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function AddRoomSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ number: '', floor: 'Floor 1', category: 'Deluxe King', rate: '95000', capacity: '2' });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const addRoom = async () => {
    setSaving(true);
    const res = await mutate({
      action: 'room_create',
      roomNumber: form.number.trim(),
      floor: form.floor,
      category: form.category,
      rateAmount: Number(form.rate) || 0,
      capacity: Number(form.capacity) || 2,
      status: 'available',
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the room.');
      return;
    }
    toast(`Room ${form.number.trim()} added as ${form.category}.`);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={460}
      title="Add a room"
      subtitle="New rooms become available for booking immediately"
      footer={
        <>
          <button type="button" className="sol-btn sol-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="sol-btn sol-btn-primary"
            disabled={!form.number.trim() || saving}
            onClick={addRoom}
          >
            {saving ? 'Adding…' : 'Add room'}
          </button>
        </>
      }
    >
      <div className="sol-form-grid">
        <Field label="Room number">
          <input className="sol-input" value={form.number} onChange={set('number')} placeholder="e.g. 512" />
        </Field>
        <Field label="Floor">
          <input className="sol-input" value={form.floor} onChange={set('floor')} placeholder="Floor 5" />
        </Field>
        <Field label="Room type" className="full">
          <select className="sol-select" value={form.category} onChange={set('category')}>
            {roomTypeStats.map((t) => (
              <option key={t.category} value={t.category}>{t.category}</option>
            ))}
          </select>
        </Field>
        <Field label="Nightly rate">
          <input className="sol-input" value={form.rate} onChange={set('rate')} inputMode="numeric" />
        </Field>
        <Field label="Capacity">
          <select className="sol-select" value={form.capacity} onChange={set('capacity')}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={String(n)}>{n} guests</option>)}
          </select>
        </Field>
      </div>
    </Sheet>
  );
}
