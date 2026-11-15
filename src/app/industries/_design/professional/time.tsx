'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Field,
  Kpi,
  PageHeader,
  Progress,
  SearchInput,
  Sheet,
  StatusBadge,
  Switch,
  TableWrap,
  Tabs,
  Td,
  Th,
  useToast,
} from '../primitives';
import { BarsChart } from '../charts';
import { Icon } from '../icons';
import { addDays, compactMoney, fmtDate, money, todayISO } from '../format';
import { projects, team, timeEntries } from './mock';
import type { TimeEntry } from '../types';

type TabId = 'today' | 'week' | 'all';

export function ProfessionalTime() {
  const { toast } = useToast();
  const today = todayISO();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, -6 + i));

  const hoursByDay = week.map((date) => ({
    label: fmtDate(date),
    Hours: timeEntries.filter((t) => t.date === date).reduce((s, t) => s + t.hours, 0),
  }));

  const [tab, setTab] = useState<TabId>('week');
  const [query, setQuery] = useState('');
  const [member, setMember] = useState('all');
  const [selected, setSelected] = useState<TimeEntry | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [form, setForm] = useState({
    date: today,
    member: team[0]?.full_name || '',
    project: projects[0]?.id || '',
    task: '',
    hours: '2',
    billable: true,
    notes: '',
  });

  const weekEntries = timeEntries.filter((t) => t.date >= addDays(today, -6));
  const billedValue = timeEntries
    .filter((t) => t.billable)
    .reduce((s, t) => s + t.hours * t.rate, 0);
  const billableHours = timeEntries.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0);
  const totalHours = timeEntries.reduce((s, t) => s + t.hours, 0);
  const unbilled = timeEntries
    .filter((t) => t.billable)
    .reduce((s, t) => s + t.hours * t.rate, 0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return timeEntries
      .filter((t) => {
        if (tab === 'today') return t.date === today;
        if (tab === 'week') return t.date >= addDays(today, -6);
        return true;
      })
      .filter((t) => (member === 'all' ? true : t.member === member))
      .filter((t) =>
        q
          ? t.project_name.toLowerCase().includes(q) ||
            t.task.toLowerCase().includes(q) ||
            t.member.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => `${b.date}`.localeCompare(`${a.date}`));
  }, [tab, query, member]);

  const byMember = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of weekEntries) map[t.member] = (map[t.member] || 0) + t.hours;
    return Object.entries(map)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours);
  }, [weekEntries]);

  const log = () => {
    if (!form.task.trim()) {
      toast('Add a short note about the work to continue.');
      return;
    }
    toast(`${form.hours}h logged against ${projects.find((p) => p.id === form.project)?.name}.`);
    setLogOpen(false);
    setForm({ ...form, task: '', notes: '' });
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="clock" size={13} /> Operations
          </>
        }
        title="Time tracking"
        subtitle="Every hour logged against a project, who did the work and what it is worth."
        meta={
          <>
            <Badge tone="accent" dot>
              {totalHours.toFixed(1)}h recorded
            </Badge>
            <span className="sol-small sol-muted">
              {Math.round((billableHours / Math.max(1, totalHours)) * 100)}% billable
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => toast('Timesheet exported as CSV.')}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => setLogOpen(true)}
            >
              <Plus size={15} aria-hidden /> Log time
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Logged today"
          value={`${timeEntries.filter((t) => t.date === today).reduce((s, t) => s + t.hours, 0).toFixed(1)}h`}
          icon="clock"
          foot={`${timeEntries.filter((t) => t.date === today).length} entries`}
          accent
        />
        <Kpi
          label="This week"
          value={`${weekEntries.reduce((s, t) => s + t.hours, 0).toFixed(1)}h`}
          icon="calendar"
          foot={`${weekEntries.filter((t) => t.billable).length} billable entries`}
        />
        <Kpi
          label="Billable"
          value={`${Math.round((billableHours / Math.max(1, totalHours)) * 100)}%`}
          icon="trend"
          foot={`${billableHours.toFixed(1)}h of ${totalHours.toFixed(1)}h`}
        />
        <Kpi
          label="Unbilled value"
          value={compactMoney(unbilled)}
          icon="wallet"
          foot={`${compactMoney(billedValue)} billable in total`}
        />
      </div>

      <div className="sol-grid sol-grid-main sol-mt-3">
        <Card title="Hours logged" subtitle="Studio hours for the last seven days">
          <BarsChart
            data={hoursByDay}
            series={[{ key: 'Hours', name: 'Hours' }]}
            height={250}
            yFormat={(v) => `${v}h`}
          />
        </Card>

        <Card title="By person" subtitle={`${byMember.length} people logged time this week`}>
          <div className="sol-stack-2">
            {byMember.map((m) => (
              <div key={m.name} className="sol-meter-row">
                <div className="sol-meter-main">
                  <div className="sol-meter-head">
                    <strong>{m.name}</strong>
                    <span>{m.hours.toFixed(1)}h</span>
                  </div>
                  <Progress value={(m.hours / 36) * 100} label={`${m.name} hours this week`} />
                </div>
                <span className="sol-small sol-muted sol-num">
                  {Math.round((m.hours / 36) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card flush className="sol-mt-4">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by project, task or person…"
              ariaLabel="Search time entries"
            />
            <div className="sol-toolbar-spacer" />
            <select
              className="sol-select"
              value={member}
              onChange={(e) => setMember(e.target.value)}
              aria-label="Filter by team member"
              style={{ maxWidth: 200 }}
            >
              <option value="all">Everyone</option>
              {team.map((m) => (
                <option key={m.id}>{m.full_name}</option>
              ))}
            </select>
            <Tabs
              items={[
                { id: 'today', label: 'Today', count: timeEntries.filter((t) => t.date === today).length },
                { id: 'week', label: 'This week', count: weekEntries.length },
                { id: 'all', label: 'All', count: timeEntries.length },
              ]}
              value={tab}
              onChange={setTab}
              ariaLabel="Time entry range"
            />
          </div>
        </div>

        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Member</Th>
                <Th>Project</Th>
                <Th>Task</Th>
                <Th align="right">Hours</Th>
                <Th>Type</Th>
                <Th align="right">Value</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} data-clickable="true" onClick={() => setSelected(t)}>
                  <Td className="muted">{fmtDate(t.date, { weekday: true })}</Td>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={t.member} size="sm" />
                      <span className="sol-small">{t.member}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="sol-list-title" style={{ fontSize: 12 }}>
                      {t.project_name}
                    </div>
                    <div className="sol-list-sub">{t.client_name}</div>
                  </Td>
                  <Td className="muted">{t.task}</Td>
                  <Td align="right" className="num strong">
                    {t.hours.toFixed(1)}h
                  </Td>
                  <Td>
                    <StatusBadge status={t.billable ? 'billable' : 'recorded'} label={t.billable ? 'Billable' : 'Internal'} />
                  </Td>
                  <Td align="right" className={t.billable ? 'num' : 'num muted'}>
                    {t.billable ? money(t.hours * t.rate) : '—'}
                  </Td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <Td colSpan={7}>
                    <div className="sol-empty">
                      <span className="sol-empty-icon">
                        <Icon name="clock" size={20} />
                      </span>
                      <h4>No time entries in this view</h4>
                      <p>Try a different range, person or search.</p>
                    </div>
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.task || 'Time entry'}
        subtitle={selected ? `${selected.project_name} · ${selected.member}` : undefined}
        width={440}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast('Time entry added to the next invoice.');
                setSelected(null);
              }}
            >
              <Icon name="receipt" size={15} /> Add to invoice
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <StatusBadge
                status={selected.billable ? 'billable' : 'recorded'}
                label={selected.billable ? 'Billable' : 'Internal'}
              />
              <span className="sol-h1" style={{ fontSize: 22 }}>
                {selected.hours.toFixed(1)}h
              </span>
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Date</span>
                <strong>{fmtDate(selected.date, { weekday: true, year: true })}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Client</span>
                <strong>{selected.client_name}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Project</span>
                <strong>{selected.project_name}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Member</span>
                <strong>{selected.member}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Rate</span>
                <strong>{money(selected.rate)}/hr</strong>
              </div>
              <div className="sol-kv-row total">
                <span>Value</span>
                <strong>{selected.billable ? money(selected.hours * selected.rate) : 'Internal'}</strong>
              </div>
            </div>

            <div>
              <div className="sol-label">Notes</div>
              <p className="sol-small sol-muted sol-mt-2" style={{ lineHeight: 1.6 }}>
                {selected.notes || 'No notes were added to this entry.'}
              </p>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => {
                  toast('Time entry marked as internal.');
                  setSelected(null);
                }}
              >
                Mark internal
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => {
                  toast('Time entry editor opened.');
                  setSelected(null);
                }}
              >
                Edit entry
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log time"
        subtitle="Record hours against a project. Billable time flows into invoices."
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setLogOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={log}>
              <Icon name="clock" size={15} /> Save entry
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Date">
            <input
              type="date"
              className="sol-input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Hours">
            <input
              type="number"
              min={0}
              step="0.5"
              className="sol-input"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            />
          </Field>
          <Field label="Team member" className="full">
            <select
              className="sol-select"
              value={form.member}
              onChange={(e) => setForm({ ...form, member: e.target.value })}
            >
              {team.map((m) => (
                <option key={m.id}>{m.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Project" className="full">
            <select
              className="sol-select"
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="What did you work on?" className="full">
            <input
              className="sol-input"
              value={form.task}
              onChange={(e) => setForm({ ...form, task: e.target.value })}
              placeholder="e.g. Finalised logo lock-ups"
            />
          </Field>
          <Field label="Notes" className="full" hint="Optional context for the client or the team.">
            <textarea
              className="sol-textarea"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="full sol-settings-row" style={{ paddingTop: 4, borderBottom: 0 }}>
            <div className="sol-settings-row-text">
              <strong>Billable time</strong>
              <small>Count this entry toward client invoices.</small>
            </div>
            <Switch
              checked={form.billable}
              onChange={(v) => setForm({ ...form, billable: v })}
              label="Billable time"
            />
          </div>
        </div>
      </Sheet>
    </>
  );
}
