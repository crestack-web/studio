'use client';

import React, { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  Avatar,
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
import { compactMoney, fmtDate, money, secondsLabel } from '../format';
import {
  housekeepingRooms,
  roomServiceOrders,
  rooms,
  staff,
  tasks,
} from './mock';
import { useSolutionsLive } from '../live';
import { toastInviteResult } from '../invite-feedback';
import type { HousekeepingRoom, HotelTask, RoomServiceOrder, StaffMember } from '../types';

/* ── Housekeeping ─────────────────────────────────────────────────── */

const STAGES: { id: HousekeepingRoom['stage']; label: string }[] = [
  { id: 'dirty', label: 'Dirty' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'inspected', label: 'Inspected' },
  { id: 'ready', label: 'Ready' },
];

export function HospitalityHousekeeping({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HousekeepingRoom | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assign, setAssign] = useState({ room: '', assignee: '', priority: 'medium', note: '' });

  const attendants = staff.filter((s) => s.department === 'Housekeeping');

  const openAssign = () => {
    setAssign({
      room: housekeepingRooms[0]?.room_number || '',
      assignee: attendants[0]?.full_name || '',
      priority: 'medium',
      note: '',
    });
    setAssignOpen(true);
  };

  const assignTask = async () => {
    if (!assign.room || !assign.assignee) {
      toast('Choose a room and an attendant.');
      return;
    }
    const room = housekeepingRooms.find((r) => r.room_number === assign.room);
    const res = await mutate({
      action: 'record_create',
      module: 'housekeeping',
      title: `Room ${assign.room}`,
      status: 'dirty',
      meta: {
        room_number: assign.room,
        category: room?.category || '',
        assignee: assign.assignee,
        priority: assign.priority,
        note: assign.note.trim() || undefined,
      },
    });
    if (!res.ok) {
      toast(res.error || 'Could not assign the task.');
      return;
    }
    toast(`Room ${assign.room} assigned to ${assign.assignee}.`);
    setAssignOpen(false);
  };

  const updateStage = async (room: HousekeepingRoom, stage: HousekeepingRoom['stage'], message: string) => {
    const res = await mutate({
      action: 'housekeeping_set_stage',
      id: room.id,
      roomId: room.id,
      roomNumber: room.room_number,
      stage,
      meta: {
        room_number: room.room_number,
        category: room.category,
        assignee: room.assignee,
        priority: room.priority,
        stage,
      },
    });
    if (!res.ok) {
      toast(res.error || 'Could not update the room.');
      return;
    }
    toast(message);
    setSelected(null);
  };

  const reassign = async (room: HousekeepingRoom) => {
    if (!attendants.length) return;
    const index = attendants.findIndex((s) => s.full_name === room.assignee);
    const next = attendants[(index + 1) % attendants.length];
    const res = await mutate({
      action: 'housekeeping_set_stage',
      id: room.id,
      roomId: room.id,
      roomNumber: room.room_number,
      stage: room.stage,
      assignee: next.full_name,
      meta: {
        room_number: room.room_number,
        category: room.category,
        assignee: next.full_name,
        priority: room.priority,
        stage: room.stage,
      },
    });
    if (!res.ok) {
      toast(res.error || 'Could not reassign the room.');
      return;
    }
    toast(`Room ${room.room_number} reassigned to ${next.full_name}.`);
    setSelected(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return housekeepingRooms;
    return housekeepingRooms.filter((r) => `${r.room_number} ${r.assignee} ${r.category}`.toLowerCase().includes(q));
  }, [query]);

  const ready = housekeepingRooms.filter((r) => r.stage === 'ready' || r.stage === 'inspected').length;

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="sparkles" size={13} /> Operations</>}
        title="Housekeeping"
        subtitle="Today's cleaning board. Drag-free flow: each room moves from dirty to ready as the team works."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={openAssign}>
            <Plus size={15} aria-hidden /> Assign task
          </button>
        }
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {housekeepingRooms.filter((r) => r.stage === 'dirty').length} dirty</span>
            <span className="sol-stat-line"><span className="sol-dot blue" /> {housekeepingRooms.filter((r) => r.stage === 'in_progress').length} in progress</span>
            <span className="sol-stat-line"><span className="sol-dot green" /> {ready} ready</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Rooms to clean" value={housekeepingRooms.length} icon="sparkles" foot="today's list" accent />
        <Kpi label="Ready to sell" value={ready} icon="checkCircle" delta={`${Math.round((ready / housekeepingRooms.length) * 100)}%`} deltaDir="up" foot="of today's list" />
        <Kpi label="Attendants on shift" value={staff.filter((s) => s.department === 'Housekeeping').length} icon="users" foot="morning + evening" />
        <Kpi label="Avg turnaround" value="38 min" icon="clock" delta="−6 min" deltaDir="down" foot="vs last week" />
      </div>

      <Card
        title="Cleaning board"
        subtitle="Tap a room to reassign or update its stage"
        action={<SearchInput value={query} onChange={setQuery} placeholder="Search room or attendant…" />}
      >
        <div className="sol-board">
          {STAGES.map((stage) => {
            const items = filtered.filter((r) => r.stage === stage.id);
            return (
              <div key={stage.id} className="sol-board-col">
                <div className="sol-board-head">
                  <span>{stage.label}</span>
                  <span className="sol-board-count">{items.length}</span>
                </div>
                {items.map((r) => (
                  <button key={r.id} type="button" className="sol-board-card" onClick={() => setSelected(r)}>
                    <div className="sol-board-card-top">
                      <strong>Room {r.room_number}</strong>
                      <span className={`sol-dot ${stage.id === 'ready' || stage.id === 'inspected' ? 'green' : stage.id === 'in_progress' ? 'blue' : 'amber'}`} />
                    </div>
                    <small className="sol-board-desc">{r.category}</small>
                    {r.note ? <small className="sol-board-desc">{r.note}</small> : null}
                    <div className="sol-board-foot">
                      <span className="sol-board-person">
                        <Avatar name={r.assignee} size="sm" /> {r.assignee.split(' ')[0]}
                      </span>
                      <Badge tone={r.priority === 'urgent' ? 'red' : r.priority === 'high' ? 'amber' : 'gray'}>
                        {r.priority}
                      </Badge>
                    </div>
                    <div className="sol-board-actions">
                      <small className="sol-muted">{secondsLabel(r.updated_at)}</small>
                    </div>
                  </button>
                ))}
                {!items.length ? (
                  <div className="sol-help">No rooms in this stage.</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="sol-grid sol-grid-2">
        <Card title="Team workload" subtitle="Rooms assigned per attendant">
          <div className="sol-stack-3">
            {staff
              .filter((s) => s.department === 'Housekeeping')
              .map((s) => {
                const assigned = housekeepingRooms.filter((r) => r.assignee === s.full_name).length;
                return (
                  <div key={s.id}>
                    <div className="sol-between" style={{ marginBottom: 6 }}>
                      <div className="sol-person">
                        <Avatar name={s.full_name} size="sm" />
                        <div className="sol-person-text">
                          <span className="sol-person-name">{s.full_name}</span>
                          <span className="sol-person-sub">{s.shift} shift</span>
                        </div>
                      </div>
                      <span className="sol-small sol-muted">{assigned} rooms</span>
                    </div>
                    <Progress value={Math.min(100, (assigned / 12) * 100)} tone={assigned > 9 ? 'amber' : 'green'} label={`${s.full_name} workload`} />
                  </div>
                );
              })}
          </div>
        </Card>

        <Card title="Maintenance queue" subtitle="Rooms blocked from sale">
          <div className="sol-stack-3">
            {rooms.filter((r) => r.status === 'ooo').map((r) => (
              <div key={r.id} className="sol-between">
                <div className="sol-row sol-gap-2">
                  <span className="sol-room-num" style={{ fontSize: 13 }}>{r.room_number}</span>
                  <div>
                    <div className="sol-person-name">Out of order</div>
                    <div className="sol-person-sub">{r.notes}</div>
                  </div>
                </div>
                <Badge tone="red">Blocked</Badge>
              </div>
            ))}
          </div>
          <div className="sol-divider sol-mt-3" />
          <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm sol-mt-3 sol-full" onClick={() => toast('Maintenance schedule opened.')}>
            View maintenance schedule
          </button>
        </Card>
      </div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={440}
        title={selected ? `Room ${selected.room_number}` : ''}
        subtitle={selected ? `${selected.category} · ${selected.assignee}` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => selected && updateStage(selected, 'ready', `Room ${selected.room_number} marked ready.`)}
            >
              <Check size={15} /> Mark ready
            </button>
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-row sol-between">
              <StatusBadge status={selected.stage} />
              <Badge tone={selected.priority === 'urgent' ? 'red' : selected.priority === 'high' ? 'amber' : 'gray'}>
                {selected.priority} priority
              </Badge>
            </div>
            <div className="sol-kv">
              <div className="sol-kv-row"><span>Assigned to</span><strong>{selected.assignee}</strong></div>
              <div className="sol-kv-row"><span>Last update</span><strong>{secondsLabel(selected.updated_at)}</strong></div>
              <div className="sol-kv-row"><span>Room type</span><strong>{selected.category}</strong></div>
              <div className="sol-kv-row"><span>Note</span><strong>{selected.note || '—'}</strong></div>
            </div>
            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => reassign(selected)}>
                Reassign
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => updateStage(selected, 'inspected', 'Marked inspected.')}
              >
                Mark inspected
              </button>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Maintenance ticket opened.')}>
                Report issue
              </button>
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign a housekeeping task"
        subtitle="Put a room on the cleaning board with an owner and priority."
        width={440}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setAssignOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={assignTask}>
              <Plus size={15} /> Assign task
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Room">
            <select
              className="sol-select"
              value={assign.room}
              onChange={(e) => setAssign({ ...assign, room: e.target.value })}
            >
              {housekeepingRooms.map((r) => (
                <option key={r.id} value={r.room_number}>
                  Room {r.room_number} · {r.category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Attendant">
            <select
              className="sol-select"
              value={assign.assignee}
              onChange={(e) => setAssign({ ...assign, assignee: e.target.value })}
            >
              {attendants.map((s) => (
                <option key={s.id} value={s.full_name}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className="sol-select"
              value={assign.priority}
              onChange={(e) => setAssign({ ...assign, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Note" className="full">
            <input
              className="sol-input"
              value={assign.note}
              onChange={(e) => setAssign({ ...assign, note: e.target.value })}
              placeholder="e.g. Deep clean after late checkout"
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}

/* ── Room service ─────────────────────────────────────────────────── */

const ORDER_FLOW: { id: RoomServiceOrder['status']; label: string }[] = [
  { id: 'new', label: 'New orders' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'on_the_way', label: 'On the way' },
  { id: 'delivered', label: 'Delivered' },
];

export function HospitalityRoomService({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate, version } = useSolutionsLive();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RoomServiceOrder | null>(null);

  const orders = useMemo(() => [...roomServiceOrders], [version, roomServiceOrders.length]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => `${o.code} ${o.room_number} ${o.guest_name}`.toLowerCase().includes(q));
  }, [query]);

  const activeOrders = roomServiceOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const openValue = activeOrders.reduce((a, o) => a + o.total, 0);

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="bell" size={13} /> Operations</>}
        title="Room service"
        subtitle="Every in-room order from kitchen to door. Charges post straight to the guest folio."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={async () => {
            const inHouseRoom = rooms.find((r) => String((r as any).status) === 'occupied') || rooms[0];
            const res = await mutate({
              action: 'room_service_create',
              title: `RS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
              status: 'new',
              amount: 0,
              meta: {
                code: `RS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
                room_number: inHouseRoom?.room_number || '',
                guest_name: 'Guest',
                items: [{ name: 'Custom order', qty: 1, price: 0 }],
              },
            });
            if (!res.ok) { toast(res.error || 'Could not create order'); return; }
            toast('Room service order created — open it from the board to edit.');
          }}>
            <Plus size={15} aria-hidden /> New order
          </button>
        }
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {roomServiceOrders.filter((o) => o.status === 'new').length} new</span>
            <span className="sol-stat-line"><span className="sol-dot blue" /> {roomServiceOrders.filter((o) => o.status === 'preparing').length} preparing</span>
            <span className="sol-stat-line"><span className="sol-dot violet" /> {roomServiceOrders.filter((o) => o.status === 'on_the_way').length} on the way</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Active orders" value={activeOrders.length} icon="bell" foot="in the kitchen" accent />
        <Kpi label="Open value" value={compactMoney(openValue)} icon="wallet" foot="not yet delivered" />
        <Kpi label="Delivered today" value={roomServiceOrders.filter((o) => o.status === 'delivered').length} icon="checkCircle" foot="orders closed" />
        <Kpi label="Avg delivery" value="24 min" icon="clock" delta="−3 min" deltaDir="down" foot="vs last week" />
      </div>

      <Card
        title="Order board"
        subtitle="Kitchen, runner and front desk see the same status"
        action={<SearchInput value={query} onChange={setQuery} placeholder="Search order, room or guest…" />}
      >
        <div className="sol-board">
          {ORDER_FLOW.map((col) => {
            const items = filtered.filter((o) => o.status === col.id);
            return (
              <div key={col.id} className="sol-board-col">
                <div className="sol-board-head">
                  <span>{col.label}</span>
                  <span className="sol-board-count">{items.length}</span>
                </div>
                {items.map((o) => (
                  <button key={o.id} type="button" className="sol-board-card" onClick={() => setSelected(o)}>
                    <div className="sol-board-card-top">
                      <strong>{o.code}</strong>
                      <Badge tone="gray">Room {o.room_number}</Badge>
                    </div>
                    <small className="sol-board-desc">{o.guest_name}</small>
                    <small className="sol-board-desc">
                      {o.items.map((i) => `${i.qty}× ${i.name}`).join(' · ')}
                    </small>
                    <div className="sol-board-foot">
                      <span className="sol-board-person">{money(o.total)}</span>
                      <span className="sol-small sol-muted">{secondsLabel(o.placed_at)}</span>
                    </div>
                  </button>
                ))}
                {!items.length ? <div className="sol-help">No orders here.</div> : null}
              </div>
            );
          })}
        </div>
      </Card>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={440}
        title={selected ? `Order ${selected.code}` : ''}
        subtitle={selected ? `Room ${selected.room_number} · ${selected.guest_name}` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={async () => {
                if (!selected) return;
                const flow = ['new', 'preparing', 'on_the_way', 'delivered'] as const;
                const idx = Math.max(0, flow.indexOf(selected.status as any));
                const next = flow[Math.min(idx + 1, flow.length - 1)];
                const res = await mutate({
                  action: 'room_service_update',
                  id: selected.id,
                  status: next,
                  meta: { advanced_at: new Date().toISOString() },
                });
                if (!res.ok) {
                  toast(res.error || 'Could not advance order.');
                  return;
                }
                toast(`Order ${selected.code} → ${next.replace(/_/g, ' ')}`);
                setSelected(null);
              }}
            >
              Advance status
            </button>
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-row sol-between">
              <StatusBadge status={selected.status} />
              <span className="sol-small sol-muted">{secondsLabel(selected.placed_at)}</span>
            </div>
            <TableWrap>
              <table className="sol-table">
                <thead>
                  <tr><Th>Item</Th><Th align="right">Qty</Th><Th align="right">Price</Th><Th align="right">Total</Th></tr>
                </thead>
                <tbody>
                  {selected.items.map((i) => (
                    <tr key={i.name}>
                      <Td>{i.name}</Td>
                      <Td align="right" className="num">{i.qty}</Td>
                      <Td align="right" className="num">{money(i.price)}</Td>
                      <Td align="right" className="num strong">{money(i.price * i.qty)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="sol-kv">
              <div className="sol-kv-row total"><span>Order total</span><strong>{money(selected.total)}</strong></div>
            </div>
            {selected.note ? (
              <div className="sol-banner amber">
                <span className="sol-banner-icon"><Icon name="bell" size={16} /></span>
                <div className="sol-banner-body"><strong>Kitchen note</strong><div>{selected.note}</div></div>
              </div>
            ) : null}
            <button
              type="button"
              className="sol-btn sol-btn-subtle sol-btn-sm"
              onClick={async () => {
                if (!selected) return;
                const bookingId = (selected as any).booking_id;
                if (!bookingId) {
                  toast('Link this order to an in-house booking to post to folio.');
                  return;
                }
                const res = await mutate({
                  action: 'folio_add',
                  bookingId,
                  lineType: 'charge',
                  description: `Room service ${selected.code}`,
                  amount: selected.total,
                });
                if (!res.ok) {
                  toast(res.error || 'Could not post to folio.');
                  return;
                }
                toast(`₦${selected.total.toLocaleString()} posted to guest folio.`);
              }}
            >
              Post to folio
            </button>
          </>
        ) : null}
      </Sheet>
    </>
  );
}

/* ── Staff ────────────────────────────────────────────────────────── */

export function HospitalityStaff({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('all');
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: 'Front office',
    shift: 'Morning',
  });

  const departments = Array.from(
    new Set([
      ...staff.map((s) => s.department),
      'Front office',
      'Housekeeping',
      'Food & beverage',
      'Maintenance',
    ])
  ).filter(Boolean);

  const invite = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name) {
      toast('Enter the staff member’s name to continue.');
      return;
    }
    if (!email || !email.includes('@')) {
      toast('Enter a valid work email so we can send the invitation.');
      return;
    }
    setSaving(true);
    const res = await mutate({
      action: 'staff_create',
      fullName: name,
      email,
      role: 'Team member',
      department: form.department,
      shift: form.shift,
      status: 'invited',
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not invite the staff member.');
      return;
    }
    toastInviteResult(toast, { staffName: name, email, result: res });
    setForm({ name: '', email: '', department: departments[0] || 'Front office', shift: 'Morning' });
    setAddOpen(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((s) => {
      if (dept !== 'all' && s.department !== dept) return false;
      if (!q) return true;
      return `${s.full_name} ${s.email} ${s.role}`.toLowerCase().includes(q);
    });
  }, [dept, query]);

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="badge" size={13} /> Team</>}
        title="Staff"
        subtitle="Everyone who keeps the property running — roles, shifts and access in one roster."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={15} aria-hidden /> Invite staff
          </button>
        }
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot green" /> {staff.filter((s) => s.status === 'active').length} active</span>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {staff.filter((s) => s.status === 'invited').length} invited</span>
            <span className="sol-stat-line">{departments.length} departments</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Team members" value={staff.length} icon="users" foot="on the roster" accent />
        <Kpi label="On shift now" value={staff.filter((s) => s.shift !== 'Off duty').length} icon="clock" foot="across all departments" />
        <Kpi label="Departments" value={departments.length} icon="layers" foot="front desk to maintenance" />
        <Kpi label="Pending invites" value={staff.filter((s) => s.status === 'invited').length} icon="mail" foot="awaiting acceptance" />
      </div>

      <Card
        title="Team directory"
        subtitle="Filter by department to see who is on the floor"
        action={<SearchInput value={query} onChange={setQuery} placeholder="Search name, role or email…" />}
      >
        <div className="sol-mt-3">
          <Chips
            value={dept}
            onChange={setDept}
            items={[{ id: 'all', label: 'All departments' }, ...departments.map((d) => ({ id: d, label: d }))]}
          />
        </div>
        <div className="sol-mt-3">
          {filtered.length ? (
            <div className="sol-card" style={{ boxShadow: 'none' }}>
              <TableWrap>
                <table className="sol-table">
                  <thead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Role</Th>
                      <Th>Department</Th>
                      <Th>Shift</Th>
                      <Th>Status</Th>
                      <Th align="right" width={44} />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} data-clickable="true" onClick={() => setSelected(s)}>
                        <Td>
                          <div className="sol-person">
                            <Avatar name={s.full_name} />
                            <div className="sol-person-text">
                              <div className="sol-person-name">{s.full_name}</div>
                              <div className="sol-person-sub">{s.email}</div>
                            </div>
                          </div>
                        </Td>
                        <Td>{s.role}</Td>
                        <Td className="muted">{s.department}</Td>
                        <Td><Badge tone={s.shift === 'Night' ? 'violet' : s.shift === 'Off duty' ? 'gray' : 'blue'}>{s.shift}</Badge></Td>
                        <Td><StatusBadge status={s.status} /></Td>
                        <Td align="right">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Menu label={`${s.full_name} actions`}>
                              {(close) => (
                                <>
                                  <MenuItem onClick={() => { close(); setSelected(s); }}>View profile</MenuItem>
                                  <MenuItem onClick={() => { close(); toast(`Shift updated for ${s.full_name}.`); }}>Change shift</MenuItem>
                                  <MenuItem onClick={() => { close(); toast(`Message sent to ${s.full_name}.`); }}>Send message</MenuItem>
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
            <EmptyState icon="users" title="No staff match" message="Try a different department or search term." />
          )}
        </div>
      </Card>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={440}
        title={selected?.full_name || ''}
        subtitle={selected ? `${selected.role} · ${selected.department}` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => { toast('Staff profile updated.'); setSelected(null); }}>
              Save changes
            </button>
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-row sol-between">
              <div className="sol-person">
                <Avatar name={selected.full_name} size="lg" />
                <div className="sol-person-text">
                  <div className="sol-person-name">{selected.full_name}</div>
                  <div className="sol-person-sub">{selected.email}</div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div className="sol-kv">
              <div className="sol-kv-row"><span>Phone</span><strong>{selected.phone}</strong></div>
              <div className="sol-kv-row"><span>Department</span><strong>{selected.department}</strong></div>
              <div className="sol-kv-row"><span>Shift</span><strong>{selected.shift}</strong></div>
              {selected.rooms_assigned != null ? (
                <div className="sol-kv-row"><span>Rooms assigned</span><strong>{selected.rooms_assigned}</strong></div>
              ) : null}
            </div>
            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Message sent.')}>Send message</button>
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Shift updated.')}>Update shift</button>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Access settings opened.')}>Manage access</button>
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        width={440}
        title="Invite staff"
        subtitle="They'll get an email to join the workspace"
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={invite}
              disabled={saving}
            >
              {saving ? 'Sending…' : 'Send invite'}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Full name" className="full">
            <input
              className="sol-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Tolu Ade"
            />
          </Field>
          <Field label="Email" className="full">
            <input
              type="email"
              className="sol-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@hotel.com"
            />
          </Field>
          <Field label="Department">
            <select
              className="sol-select"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Shift">
            <select
              className="sol-select"
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
            >
              {['Morning', 'Evening', 'Night'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </Sheet>
    </>
  );
}

/* ── Tasks ────────────────────────────────────────────────────────── */

export function HospitalityTasks({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [tab, setTab] = useState<'today' | 'upcoming' | 'done'>('today');
  const [selected, setSelected] = useState<HotelTask | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    room: '',
    assignee: staff[0]?.full_name || '',
    priority: 'medium',
    due: 'Today · 12:00',
    group: 'today',
  });

  const rows = tasks.filter((t) => (tab === 'done' ? t.done : t.group === tab && !t.done));
  const openCount = tasks.filter((t) => !t.done).length;
  const urgent = tasks.filter((t) => t.priority === 'urgent' && !t.done).length;

  const toggle = async (task: HotelTask) => {
    const next = !task.done;
    const res = await mutate({
      action: 'record_update',
      id: task.id,
      status: next ? 'done' : 'open',
      meta: { done: next },
    });
    if (!res.ok) {
      toast(res.error || 'Could not update the task.');
      return;
    }
    toast(next ? 'Task completed.' : 'Task reopened.');
    setSelected(null);
  };

  const createTask = async () => {
    if (!form.title.trim()) {
      toast('Give the task a title to continue.');
      return;
    }
    const res = await mutate({
      action: 'record_create',
      module: 'tasks',
      title: form.title.trim(),
      status: 'open',
      meta: {
        room: form.room.trim() || undefined,
        assignee: form.assignee,
        priority: form.priority,
        due: form.due,
        group: form.group,
      },
    });
    if (!res.ok) {
      toast(res.error || 'Could not create the task.');
      return;
    }
    toast(`${form.title.trim()} added to ${form.group === 'today' ? 'today' : 'upcoming'}.`);
    setForm({ ...form, title: '', room: '' });
    setCreateOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="checklist" size={13} /> Operations</>}
        title="Tasks"
        subtitle="Everything the team needs to action today — assigned, prioritised and visible to all."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={15} aria-hidden /> New task
          </button>
        }
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {openCount} open</span>
            <span className="sol-stat-line"><span className="sol-dot red" /> {urgent} urgent</span>
            <span className="sol-stat-line"><span className="sol-dot green" /> {tasks.filter((t) => t.done).length} completed</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Open tasks" value={openCount} icon="checklist" foot="across the property" accent />
        <Kpi label="Urgent" value={urgent} icon="bell" foot="needs attention now" />
        <Kpi label="Due today" value={tasks.filter((t) => t.group === 'today' && !t.done).length} icon="clock" foot="before close" />
        <Kpi label="Completed" value={tasks.filter((t) => t.done).length} icon="checkCircle" delta="On track" deltaDir="up" foot="today" />
      </div>

      <Card
        title="Task list"
        subtitle="Check items off as they are finished"
        action={
          <Tabs<'today' | 'upcoming' | 'done'>
            value={tab}
            onChange={setTab}
            items={[
              { id: 'today', label: 'Today' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'done', label: 'Done' },
            ]}
          />
        }
        flush
      >
        {rows.length ? (
          <div>
            {rows.map((t) => (
              <div key={t.id} className="sol-check-row" data-done={t.done ? 'true' : 'false'}>
                <button
                  type="button"
                  className="sol-check"
                  role="checkbox"
                  aria-checked={Boolean(t.done)}
                  aria-label={`Mark ${t.title} complete`}
                  onClick={() => toggle(t)}
                >
                  <Check size={13} aria-hidden />
                </button>
                <div className="sol-grow" onClick={() => setSelected(t)} style={{ cursor: 'pointer' }}>
                  <div className="sol-check-title">{t.title}</div>
                  <div className="sol-check-sub">
                    {t.room ? `Room ${t.room} · ` : ''}{t.assignee} · {t.due}
                  </div>
                </div>
                <Badge tone={t.priority === 'urgent' ? 'red' : t.priority === 'high' ? 'amber' : t.priority === 'medium' ? 'blue' : 'gray'}>
                  {t.priority}
                </Badge>
                <Avatar name={t.assignee} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          <div className="sol-card-body">
            <EmptyState
              icon="checkCircle"
              title={tab === 'done' ? 'Nothing completed yet' : 'All clear'}
              message={tab === 'done' ? 'Finished tasks will appear here.' : 'No open tasks in this group.'}
            />
          </div>
        )}
      </Card>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={420}
        title={selected?.title || ''}
        subtitle={selected ? `${selected.assignee} · ${selected.due}` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => { if (selected) toggle(selected); setSelected(null); }}>
              <Check size={15} /> {selected && selected.done ? 'Reopen task' : 'Complete task'}
            </button>
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-row sol-between">
              <Badge tone={selected.priority === 'urgent' ? 'red' : selected.priority === 'high' ? 'amber' : 'blue'}>
                {selected.priority} priority
              </Badge>
              <span className="sol-small sol-muted">{selected.group === 'today' ? 'Today' : 'Upcoming'}</span>
            </div>
            <div className="sol-kv">
              <div className="sol-kv-row"><span>Assigned to</span><strong>{selected.assignee}</strong></div>
              <div className="sol-kv-row"><span>Due</span><strong>{selected.due}</strong></div>
              {selected.room ? <div className="sol-kv-row"><span>Room</span><strong>{selected.room}</strong></div> : null}
              <div className="sol-kv-row"><span>Status</span><strong>{selected.done ? 'Completed' : 'Open'}</strong></div>
            </div>
            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Task reassigned.')}>Reassign</button>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Due date updated.')}>Change due date</button>
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New task"
        subtitle="Add an operational item to today's or the upcoming list."
        width={440}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={createTask}>
              <Plus size={15} /> Create task
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Task" className="full">
            <input
              className="sol-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Restock minibar on floor 3"
            />
          </Field>
          <Field label="Room (optional)">
            <input
              className="sol-input"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="e.g. 204"
            />
          </Field>
          <Field label="Assignee">
            <select
              className="sol-select"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            >
              {staff.map((s) => (
                <option key={s.id} value={s.full_name}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className="sol-select"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Due">
            <input
              className="sol-input"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
          </Field>
          <Field label="List">
            <select
              className="sol-select"
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
            >
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </Field>
        </div>
      </Sheet>
    </>
  );
}
