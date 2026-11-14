'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  Avatar,
  AvatarStack,
  Badge,
  Card,
  Field,
  Kpi,
  PageHeader,
  Sheet,
  StatusBadge,
  Tabs,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { addDays, fmtDate, todayISO, toISODate } from '../format';
import { events, tasks } from './mock';
import type { ProEvent, ProEventType } from '../types';

type View = 'month' | 'agenda';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TYPE_TONE: Record<ProEventType, 'blue' | 'red' | 'violet' | 'gray' | 'green'> = {
  meeting: 'blue',
  deadline: 'red',
  review: 'violet',
  focus: 'gray',
  call: 'green',
};

const TYPE_LABEL: Record<ProEventType, string> = {
  meeting: 'Meeting',
  deadline: 'Deadline',
  review: 'Review',
  focus: 'Focus block',
  call: 'Call',
};

function monthLabel(cursor: Date) {
  return cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function ProfessionalCalendar() {
  const { toast } = useToast();
  const today = todayISO();
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => {
    const now = new Date(`${today}T12:00:00`);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<ProEvent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'meeting' as ProEventType,
    date: today,
    start: '10:00',
    end: '11:00',
    location: 'Studio · Room A',
    attendees: '',
  });

  const byDate = useMemo(() => {
    const map: Record<string, ProEvent[]> = {};
    for (const e of events) {
      map[e.date] = map[e.date] || [];
      map[e.date].push(e);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.start.localeCompare(b.start));
    }
    return map;
  }, []);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const dayNum = i - offset + 1;
      const d = new Date(year, month, dayNum);
      const iso = toISODate(d);
      return {
        iso,
        dayNum: d.getDate(),
        outside: dayNum < 1 || dayNum > daysInMonth,
        isToday: iso === today,
      };
    });
  }, [cursor, today]);

  const upcoming = useMemo(() => {
    const from = today;
    const to = addDays(today, 7);
    return events
      .filter((e) => e.date >= from && e.date <= to)
      .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  }, [today]);

  const agendaDays = useMemo(() => {
    const groups: { date: string; items: ProEvent[] }[] = [];
    for (const e of upcoming) {
      const last = groups[groups.length - 1];
      if (last && last.date === e.date) last.items.push(e);
      else groups.push({ date: e.date, items: [e] });
    }
    return groups;
  }, [upcoming]);

  const todayEvents = byDate[today] || [];
  const deadlines = tasks
    .filter((t) => t.status !== 'done' && t.due >= today && t.due <= addDays(today, 7))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);

  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const create = () => {
    if (!form.title.trim()) {
      toast('Give the event a title to continue.');
      return;
    }
    toast(`${form.title.trim()} added to ${fmtDate(form.date)}.`);
    setCreateOpen(false);
    setForm({ ...form, title: '', attendees: '' });
  };

  const eventRow = (e: ProEvent, showDate?: boolean) => (
    <button
      key={e.id}
      type="button"
      className="sol-list-row"
      style={{ width: '100%', background: 'none', border: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
      onClick={() => setSelected(e)}
    >
      <span
        className="sol-kpi-icon"
        style={{ flex: '0 0 auto', width: 30, height: 30 }}
        aria-hidden
      >
        <Icon name={e.type === 'deadline' ? 'clock' : e.type === 'review' ? 'checkCircle' : 'calendar'} size={14} />
      </span>
      <div className="sol-list-main">
        <div className="sol-list-title">{e.title}</div>
        <div className="sol-list-sub">
          {showDate ? `${fmtDate(e.date)} · ` : ''}
          {e.start} – {e.end} · {e.location}
        </div>
      </div>
      <div className="sol-list-side">
        <Badge tone={TYPE_TONE[e.type]}>{TYPE_LABEL[e.type]}</Badge>
      </div>
    </button>
  );

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="calendar" size={13} /> Schedule
          </>
        }
        title="Calendar"
        subtitle="Studio meetings, client calls, focus blocks and delivery deadlines in one view."
        meta={
          <>
            <Badge tone="accent" dot>
              {todayEvents.length} events today
            </Badge>
            <span className="sol-small sol-muted">
              {upcoming.length} in the next seven days
            </span>
          </>
        }
        actions={
          <button
            type="button"
            className="sol-btn sol-btn-primary"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={15} aria-hidden /> New event
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Events today" value={todayEvents.length} icon="calendar" foot="Studio hours 09:00 – 18:00" accent />
        <Kpi label="Next seven days" value={upcoming.length} icon="clock" foot={`${events.filter((e) => e.type === 'meeting').length} meetings this week`} />
        <Kpi
          label="Deadlines"
          value={events.filter((e) => e.type === 'deadline').length}
          icon="trend"
          foot="Client and billing deadlines"
        />
        <Kpi
          label="Focus blocks"
          value={events.filter((e) => e.type === 'focus').length}
          icon="sparkles"
          foot="Protected deep-work time"
        />
      </div>

      <div className="sol-split sol-mt-3">
        <Card
          flush
          title={view === 'month' ? monthLabel(cursor) : 'Next seven days'}
          subtitle={
            view === 'month'
              ? 'Click any event to see the agenda and attendees'
              : `${upcoming.length} scheduled across the studio`
          }
          action={
            <div className="sol-row sol-gap-2">
              <Tabs
                items={[
                  { id: 'month', label: 'Month' },
                  { id: 'agenda', label: 'Agenda' },
                ]}
                value={view}
                onChange={setView}
                ariaLabel="Calendar view"
              />
            </div>
          }
        >
          <div className="sol-card-body">
            {view === 'month' ? (
              <>
                <div className="sol-toolbar" style={{ marginBottom: 12 }}>
                  <div className="sol-row sol-gap-2">
                    <button
                      type="button"
                      className="sol-icon-btn"
                      onClick={() => shiftMonth(-1)}
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="sol-icon-btn"
                      onClick={() => shiftMonth(1)}
                      aria-label="Next month"
                    >
                      <ChevronRight size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="sol-btn sol-btn-ghost sol-btn-sm"
                      onClick={() => {
                        const now = new Date(`${today}T12:00:00`);
                        setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                      }}
                    >
                      Today
                    </button>
                  </div>
                  <div className="sol-toolbar-spacer" />
                  <span className="sol-small sol-muted">
                    {events.length} events this month · {todayEvents.length} today
                  </span>
                </div>

                <div className="sol-month-wrap">
                  <div className="sol-month">
                    <div className="sol-month-head">
                      {WEEKDAYS.map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>
                    <div className="sol-month-grid">
                      {cells.map((cell) => {
                        const dayEvents = byDate[cell.iso] || [];
                        return (
                          <div
                            key={cell.iso}
                            className="sol-month-cell"
                            data-outside={cell.outside ? 'true' : undefined}
                            data-today={cell.isToday ? 'true' : undefined}
                          >
                            <div className="sol-month-day">
                              {cell.isToday ? <strong>{cell.dayNum}</strong> : <span>{cell.dayNum}</span>}
                              {dayEvents.length ? (
                                <span className="sol-month-more">{dayEvents.length}</span>
                              ) : null}
                            </div>
                            {dayEvents.slice(0, 2).map((e) => (
                              <button
                                key={e.id}
                                type="button"
                                className="sol-month-chip"
                                data-type={e.type}
                                onClick={() => setSelected(e)}
                                title={`${e.start} ${e.title}`}
                              >
                                {e.start} {e.title}
                              </button>
                            ))}
                            {dayEvents.length > 2 ? (
                              <span className="sol-month-more">+{dayEvents.length - 2} more</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="sol-stack-3">
                {agendaDays.map((group) => (
                  <div key={group.date}>
                    <div className="sol-between">
                      <div className="sol-label">
                        {fmtDate(group.date, { weekday: true })}
                        {group.date === today ? ' · Today' : ''}
                      </div>
                      <span className="sol-small sol-muted">{group.items.length} events</span>
                    </div>
                    <div className="sol-list sol-mt-2">
                      {group.items.map((e) => eventRow(e))}
                    </div>
                  </div>
                ))}
                {!agendaDays.length ? (
                  <div className="sol-empty">
                    <span className="sol-empty-icon">
                      <Icon name="calendar" size={20} />
                    </span>
                    <h4>Nothing scheduled this week</h4>
                    <p>Create an event to start filling the studio calendar.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Today" subtitle={`${todayEvents.length} events · ${fmtDate(today, { weekday: true })}`}>
            <div className="sol-timeline">
              {todayEvents.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="sol-timeline-item"
                  style={{ width: '100%', background: 'none', border: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => setSelected(e)}
                >
                  <span className="sol-timeline-dot">
                    <Icon name={e.type === 'deadline' ? 'clock' : 'calendar'} size={14} />
                  </span>
                  <div className="sol-timeline-body">
                    <strong>{e.title}</strong>
                    <small>
                      {e.start} – {e.end} · {e.location}
                    </small>
                  </div>
                  <span className="sol-timeline-time">{e.start}</span>
                </button>
              ))}
              {!todayEvents.length ? (
                <div className="sol-small sol-muted">No events today — a clear focus day.</div>
              ) : null}
            </div>
          </Card>

          <Card title="Due this week" subtitle={`${deadlines.length} tasks with upcoming dates`} flush>
            <div className="sol-list">
              {deadlines.map((t) => (
                <div key={t.id} className="sol-list-row">
                  <Avatar name={t.assignee} size="sm" />
                  <div className="sol-list-main">
                    <div className="sol-list-title">{t.title}</div>
                    <div className="sol-list-sub">{t.project_name}</div>
                  </div>
                  <div className="sol-list-side">
                    <small>{fmtDate(t.due)}</small>
                    <StatusBadge status={t.priority} />
                  </div>
                </div>
              ))}
              {!deadlines.length ? (
                <div className="sol-list-row sol-small sol-muted">
                  <Icon name="checkCircle" size={15} /> Nothing due this week.
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Event'}
        subtitle={selected ? `${fmtDate(selected.date, { weekday: true, year: true })} · ${selected.start} – ${selected.end}` : undefined}
        width={450}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast(`Joining ${selected?.title}.`);
                setSelected(null);
              }}
            >
              <Icon name="calendar" size={15} /> Add to calendar
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <Badge tone={TYPE_TONE[selected.type]} dot>
                {TYPE_LABEL[selected.type]}
              </Badge>
              <span className="sol-small sol-muted">{selected.attendees.length} attendees</span>
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Date</span>
                <strong>{fmtDate(selected.date, { weekday: true, year: true })}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Time</span>
                <strong>
                  {selected.start} – {selected.end}
                </strong>
              </div>
              <div className="sol-kv-row">
                <span>Location</span>
                <strong>{selected.location}</strong>
              </div>
              {selected.project_name ? (
                <div className="sol-kv-row">
                  <span>Project</span>
                  <strong>{selected.project_name}</strong>
                </div>
              ) : null}
            </div>

            <div>
              <div className="sol-label">Attendees</div>
              <div className="sol-row sol-gap-2 sol-wrap sol-mt-2">
                <AvatarStack names={selected.attendees} max={6} />
                <span className="sol-small sol-muted">{selected.attendees.join(', ')}</span>
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Event notes opened for ${selected.title}.`)}
              >
                <Icon name="clipboard" size={14} /> Add notes
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => {
                  toast(`${selected.title} rescheduled.`);
                  setSelected(null);
                }}
              >
                Reschedule
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New event"
        subtitle="Book studio time, a client call or a delivery deadline."
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={create}>
              <Icon name="plus" size={15} /> Create event
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Event title" className="full">
            <input
              className="sol-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Aura stakeholder sync"
            />
          </Field>
          <Field label="Type">
            <select
              className="sol-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ProEventType })}
            >
              <option value="meeting">Meeting</option>
              <option value="call">Call</option>
              <option value="review">Review</option>
              <option value="deadline">Deadline</option>
              <option value="focus">Focus block</option>
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="sol-input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Starts">
            <input
              type="time"
              className="sol-input"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
            />
          </Field>
          <Field label="Ends">
            <input
              type="time"
              className="sol-input"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
            />
          </Field>
          <Field label="Location" className="full">
            <input
              className="sol-input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Studio, Google Meet or client office"
            />
          </Field>
          <Field label="Attendees" className="full" hint="Separate names with commas.">
            <input
              className="sol-input"
              value={form.attendees}
              onChange={(e) => setForm({ ...form, attendees: e.target.value })}
              placeholder="e.g. Zainab Bello, Tobi Adeyemi"
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
