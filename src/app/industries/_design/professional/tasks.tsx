'use client';

import React, { useMemo, useState } from 'react';
import { Download, LayoutGrid, List, Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Chips,
  Field,
  Kpi,
  PageHeader,
  SearchInput,
  Sheet,
  StatusBadge,
  TableWrap,
  Tag,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { addDays, fmtDate, todayISO } from '../format';
import { projects, tasks, team } from './mock';
import type { ProTask, ProTaskStatus, TaskPriority } from '../types';
import { useSolutionsLive } from '../live';

type View = 'board' | 'list';
type Filter = 'all' | 'today' | 'week' | 'overdue' | 'urgent' | 'done';

const COLUMNS: { id: ProTaskStatus; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'review', label: 'In review' },
  { id: 'done', label: 'Done' },
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All open' },
  { id: 'today', label: 'Due today' },
  { id: 'week', label: 'This week' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'done', label: 'Completed' },
];

const emptyForm = {
  title: '',
  project: projects[0]?.id || '',
  assignee: team[0]?.full_name || '',
  priority: 'medium' as TaskPriority,
  due: addDays(todayISO(), 3),
  estimate: '4',
};

export function ProfessionalTasks() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const today = todayISO();
  const weekEnd = addDays(today, 7);
  const [view, setView] = useState<View>('board');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ProTask | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const matchesFilter = (t: ProTask, f: Filter) => {
    if (f === 'all') return t.status !== 'done';
    if (f === 'done') return t.status === 'done';
    if (f === 'today') return t.status !== 'done' && t.due === today;
    if (f === 'week') return t.status !== 'done' && t.due >= today && t.due <= weekEnd;
    if (f === 'overdue') return t.status !== 'done' && t.due < today;
    if (f === 'urgent') return t.status !== 'done' && t.priority === 'urgent';
    return true;
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => matchesFilter(t, filter))
      .filter((t) =>
        q
          ? t.title.toLowerCase().includes(q) ||
            t.project_name.toLowerCase().includes(q) ||
            t.assignee.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [filter, query]);

  const open = tasks.filter((t) => t.status !== 'done');
  const overdue = open.filter((t) => t.due < today);
  const create = async () => {
    if (!form.title.trim()) {
      toast('Give the task a title to continue.');
      return;
    }
    const project = projects.find((p) => p.id === form.project);
    const res = await mutate({
      action: 'task_create',
      title: form.title.trim(),
      clientName: project?.client_name,
      assignee: form.assignee,
      priority: form.priority,
      dueDate: form.due,
      status: 'todo',
    });
    if (!res.ok) {
      toast(res.error || 'Could not create the task.');
      return;
    }
    toast(`${form.title.trim()} assigned to ${form.assignee}.`);
    setCreateOpen(false);
    setForm({ ...emptyForm, title: '' });
  };

  const updateStatus = async (task: ProTask, status: ProTaskStatus, message: string) => {
    const res = await mutate({ action: 'task_update', id: task.id, status });
    if (!res.ok) {
      toast(res.error || 'Could not update the task.');
      return;
    }
    toast(message);
    setSelected(null);
  };

  const card = (t: ProTask) => {
    const late = t.status !== 'done' && t.due < today;
    return (
      <button
        key={t.id}
        type="button"
        className="sol-board-card"
        style={{ textAlign: 'left', cursor: 'pointer' }}
        onClick={() => setSelected(t)}
      >
        <div className="sol-board-card-top">
          <StatusBadge status={t.priority} />
          <span className="sol-small sol-muted">{t.estimate}h</span>
        </div>
        <strong>{t.title}</strong>
        <div className="sol-board-desc">{t.project_name}</div>
        <div className="sol-row sol-gap-2 sol-wrap">
          {t.labels.map((l) => (
            <Tag key={l}>{l}</Tag>
          ))}
        </div>
        <div className="sol-board-foot">
          <span className="sol-row sol-gap-2">
            <Avatar name={t.assignee} size="sm" />
            <span className="sol-small sol-muted">{t.assignee.split(' ')[0]}</span>
          </span>
          <span
            className="sol-small"
            style={{ color: late ? 'var(--sol-red)' : undefined, fontWeight: 700 }}
          >
            {late ? 'Overdue' : fmtDate(t.due)}
          </span>
        </div>
      </button>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="checklist" size={13} /> Delivery
          </>
        }
        title="Tasks"
        subtitle="Everything assigned across the studio, grouped by where it sits in the workflow."
        meta={
          <>
            <Badge tone="accent" dot>
              {open.length} open
            </Badge>
            <span className="sol-small sol-muted">
              {overdue.length} overdue · {open.filter((t) => t.priority === 'urgent').length} urgent
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => toast('Task list exported as CSV.')}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={15} aria-hidden /> New task
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Open tasks" value={open.length} icon="checklist" foot="Across every project" accent />
        <Kpi
          label="Due today"
          value={open.filter((t) => t.due === today).length}
          icon="calendar"
          foot={`${open.filter((t) => t.due > today && t.due <= weekEnd).length} more this week`}
        />
        <Kpi label="In review" value={tasks.filter((t) => t.status === 'review').length} icon="checkCircle" foot="Waiting on sign-off" />
        <Kpi
          label="Overdue"
          value={overdue.length}
          icon="clock"
          delta={overdue.length ? 'Needs attention' : 'All clear'}
          deltaDir={overdue.length ? 'down' : 'flat'}
          foot="Past the due date"
        />
      </div>

      <Card flush className="sol-mt-4">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search tasks, projects or people…"
              ariaLabel="Search tasks"
            />
            <div className="sol-toolbar-spacer" />
            <div className="sol-seg">
              <button
                type="button"
                className={view === 'board' ? 'active' : ''}
                onClick={() => setView('board')}
                aria-pressed={view === 'board'}
              >
                <LayoutGrid size={14} aria-hidden /> Board
              </button>
              <button
                type="button"
                className={view === 'list' ? 'active' : ''}
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
              >
                <List size={14} aria-hidden /> List
              </button>
            </div>
          </div>
          <div className="sol-mt-3">
            <Chips
              items={FILTERS.map((f) => ({
                ...f,
                count: tasks.filter((t) => matchesFilter(t, f.id)).length,
              }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        {view === 'board' ? (
          <div className="sol-card-body">
            <div className="sol-board">
              {COLUMNS.map((col) => {
                const items = list.filter((t) => t.status === col.id);
                return (
                  <div key={col.id} className="sol-board-col">
                    <div className="sol-board-head">
                      <span>{col.label}</span>
                      <span className="sol-board-count">{items.length}</span>
                    </div>
                    {items.map(card)}
                    {!items.length ? (
                      <div className="sol-small sol-muted" style={{ padding: '10px 4px' }}>
                        Nothing here right now.
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Task</Th>
                  <Th>Project</Th>
                  <Th>Assignee</Th>
                  <Th>Due</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} data-clickable="true" onClick={() => setSelected(t)}>
                    <Td>
                      <div className="sol-list-title">{t.title}</div>
                      <div className="sol-list-sub">{t.labels.join(' · ')}</div>
                    </Td>
                    <Td className="muted">{t.project_name}</Td>
                    <Td>
                      <div className="sol-row sol-gap-2">
                        <Avatar name={t.assignee} size="sm" />
                        <span className="sol-small">{t.assignee}</span>
                      </div>
                    </Td>
                    <Td className={t.status !== 'done' && t.due < today ? 'strong' : 'muted'}>
                      {fmtDate(t.due)}
                    </Td>
                    <Td>
                      <StatusBadge status={t.priority} />
                    </Td>
                    <Td>
                      <StatusBadge status={t.status} />
                    </Td>
                  </tr>
                ))}
                {!list.length ? (
                  <tr>
                    <Td colSpan={6}>
                      <div className="sol-empty">
                        <span className="sol-empty-icon">
                          <Icon name="checklist" size={20} />
                        </span>
                        <h4>No tasks match this view</h4>
                        <p>Try a different search or filter.</p>
                      </div>
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Task'}
        subtitle={selected ? `${selected.project_name} · ${selected.client_name}` : undefined}
        width={480}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() =>
                selected &&
                updateStatus(selected, 'done', `${selected.title} marked complete.`)
              }
            >
              <Icon name="checkCircle" size={15} /> Mark complete
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div className="sol-row sol-gap-2 sol-wrap">
                <StatusBadge status={selected.status} />
                <StatusBadge status={selected.priority} />
              </div>
              <span className="sol-small sol-muted">{selected.estimate}h estimate</span>
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Project</span>
                <strong>{selected.project_name}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Client</span>
                <strong>{selected.client_name}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Assignee</span>
                <strong>{selected.assignee}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Due</span>
                <strong>{fmtDate(selected.due, { year: true })}</strong>
              </div>
            </div>

            <div>
              <div className="sol-label">Labels</div>
              <div className="sol-row sol-gap-2 sol-wrap sol-mt-2">
                {selected.labels.map((l) => (
                  <Tag key={l}>{l}</Tag>
                ))}
              </div>
            </div>

            <div>
              <div className="sol-label">Notes</div>
              <p className="sol-small sol-muted sol-mt-2" style={{ lineHeight: 1.6 }}>
                {selected.description ||
                  'No notes yet. Use the activity feed below to add context, link files or @mention a teammate.'}
              </p>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() =>
                  updateStatus(selected, 'in_progress', `${selected.title} moved to in progress.`)
                }
              >
                <Icon name="layers" size={14} /> Start task
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Reassign flow opened for ${selected.title}.`)}
              >
                <Icon name="user" size={14} /> Reassign
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => {
                  toast(`${selected.title} archived.`);
                  setSelected(null);
                }}
              >
                Archive
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a task"
        subtitle="Assign the work and set a realistic due date."
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={create}>
              <Icon name="plus" size={15} /> Create task
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Task title" className="full">
            <input
              className="sol-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Finalise packaging print files"
            />
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
          <Field label="Assignee">
            <select
              className="sol-select"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            >
              {team.map((m) => (
                <option key={m.id}>{m.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className="sol-select"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="sol-input"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
          </Field>
          <Field label="Estimate (hours)">
            <input
              type="number"
              min={0}
              className="sol-input"
              value={form.estimate}
              onChange={(e) => setForm({ ...form, estimate: e.target.value })}
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
