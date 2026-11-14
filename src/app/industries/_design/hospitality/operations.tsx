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
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HousekeepingRoom | null>(null);

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
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('New housekeeping task created.')}>
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
              onClick={() => { toast(`Room ${selected?.room_number} marked ready.`); setSelected(null); }}
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
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Reassigned to Ruth Okoro.')}>
                Reassign
              </button>
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Marked inspected.')}>
                Mark inspected
              </button>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Maintenance ticket opened.')}>
                Report issue
              </button>
            </div>
          </>
        ) : null}
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
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RoomServiceOrder | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roomServiceOrders;
    return roomServiceOrders.filter((o) => `${o.code} ${o.room_number} ${o.guest_name}`.toLowerCase().includes(q));
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
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('New room service order started.')}>
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
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => { toast('Order advanced to the next stage.'); setSelected(null); }}>
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
            <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Posted to guest folio.')}>
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
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('all');
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const departments = useMemo(() => Array.from(new Set(staff.map((s) => s.department))), []);

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
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => { toast('Invitation sent.'); setAddOpen(false); }}>Send invite</button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Full name" className="full"><input className="sol-input" placeholder="e.g. Tolu Ade" /></Field>
          <Field label="Email" className="full"><input className="sol-input" placeholder="name@hotel.com" /></Field>
          <Field label="Department">
            <select className="sol-select">
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Shift">
            <select className="sol-select"><option>Morning</option><option>Evening</option><option>Night</option></select>
          </Field>
        </div>
      </Sheet>
    </>
  );
}

/* ── Tasks ────────────────────────────────────────────────────────── */

export function HospitalityTasks({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'today' | 'upcoming' | 'done'>('today');
  const [done, setDone] = useState<Record<string, boolean>>(
    () => Object.fromEntries(tasks.map((t) => [t.id, t.done]))
  );
  const [selected, setSelected] = useState<HotelTask | null>(null);

  const rows = tasks.filter((t) => (tab === 'done' ? done[t.id] : t.group === tab && !done[t.id]));
  const openCount = tasks.filter((t) => !done[t.id]).length;
  const urgent = tasks.filter((t) => t.priority === 'urgent' && !done[t.id]).length;

  const toggle = (id: string) => {
    setDone((d) => {
      const next = { ...d, [id]: !d[id] };
      toast(next[id] ? 'Task completed.' : 'Task reopened.');
      return next;
    });
  };

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="checklist" size={13} /> Operations</>}
        title="Tasks"
        subtitle="Everything the team needs to action today — assigned, prioritised and visible to all."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('New task created.')}>
            <Plus size={15} aria-hidden /> New task
          </button>
        }
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {openCount} open</span>
            <span className="sol-stat-line"><span className="sol-dot red" /> {urgent} urgent</span>
            <span className="sol-stat-line"><span className="sol-dot green" /> {tasks.filter((t) => done[t.id]).length} completed</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Open tasks" value={openCount} icon="checklist" foot="across the property" accent />
        <Kpi label="Urgent" value={urgent} icon="bell" foot="needs attention now" />
        <Kpi label="Due today" value={tasks.filter((t) => t.group === 'today' && !done[t.id]).length} icon="clock" foot="before close" />
        <Kpi label="Completed" value={tasks.filter((t) => done[t.id]).length} icon="checkCircle" delta="On track" deltaDir="up" foot="today" />
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
              <div key={t.id} className="sol-check-row" data-done={done[t.id] ? 'true' : 'false'}>
                <button
                  type="button"
                  className="sol-check"
                  role="checkbox"
                  aria-checked={Boolean(done[t.id])}
                  aria-label={`Mark ${t.title} complete`}
                  onClick={() => toggle(t.id)}
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
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => { if (selected) toggle(selected.id); setSelected(null); }}>
              <Check size={15} /> {selected && done[selected.id] ? 'Reopen task' : 'Complete task'}
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
              <div className="sol-kv-row"><span>Status</span><strong>{done[selected.id] ? 'Completed' : 'Open'}</strong></div>
            </div>
            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Task reassigned.')}>Reassign</button>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => toast('Due date updated.')}>Change due date</button>
            </div>
          </>
        ) : null}
      </Sheet>
    </>
  );
}
