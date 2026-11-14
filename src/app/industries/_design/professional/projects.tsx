'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, LayoutGrid, List, Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Chips,
  Field,
  Kpi,
  PageHeader,
  Progress,
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
import { addDays, compactMoney, fmtDate, money, todayISO } from '../format';
import { clients, deliveryStats, projects, team } from './mock';
import type { Project, ProjectStatus } from '../types';

type View = 'board' | 'list';
type Filter = 'all' | ProjectStatus;

const BOARD_STATUSES: ProjectStatus[] = ['active', 'review', 'on_hold', 'done'];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'review', label: 'In review' },
  { id: 'on_hold', label: 'On hold' },
  { id: 'done', label: 'Done' },
  { id: 'draft', label: 'Draft' },
];

export function ProfessionalProjects() {
  const { toast } = useToast();
  const today = todayISO();
  const [view, setView] = useState<View>('board');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Project | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    client: clients[0]?.company || '',
    budget: '2500000',
    due: addDays(today, 30),
    lead: team[0]?.full_name || '',
    description: '',
  });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => (filter === 'all' ? true : p.status === filter))
      .filter((p) =>
        q
          ? p.name.toLowerCase().includes(q) ||
            p.client_name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.due.localeCompare(b.due));
  }, [filter, query]);

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);

  const create = () => {
    if (!form.name.trim()) {
      toast('Name the project to continue.');
      return;
    }
    toast(`${form.name.trim()} created under ${form.client}.`);
    setCreateOpen(false);
    setForm({ ...form, name: '', description: '' });
  };

  const renderCard = (p: Project) => {
    const spentPct = Math.round((p.spent / Math.max(1, p.budget)) * 100);
    const overdue = p.status !== 'done' && p.due < today;
    return (
      <button
        key={p.id}
        type="button"
        className="sol-board-card"
        style={{ textAlign: 'left', cursor: 'pointer' }}
        onClick={() => setSelected(p)}
      >
        <div className="sol-board-card-top">
          <span className="sol-small sol-muted">{p.code}</span>
          <StatusBadge status={p.priority} />
        </div>
        <strong>{p.name}</strong>
        <div className="sol-board-desc">{p.client_name}</div>
        <div className="sol-mt-2">
          <div className="sol-between sol-small">
            <span className="sol-muted">{p.progress}% complete</span>
            <span className="sol-muted">{p.tasks_done}/{p.tasks_total} tasks</span>
          </div>
          <div className="sol-mt-2">
            <Progress value={p.progress} label={`${p.name} progress`} />
          </div>
        </div>
        <div className="sol-board-foot">
          <span className={overdue ? 'sol-small' : 'sol-small sol-muted'} style={overdue ? { color: 'var(--sol-red)' } : undefined}>
            <Icon name="calendar" size={12} /> {overdue ? 'Overdue' : 'Due'} {fmtDate(p.due)}
          </span>
          <span className="sol-small sol-muted">{compactMoney(p.budget)}</span>
        </div>
        <div className="sol-board-foot">
          <span className="sol-small sol-muted">
            <Icon name="user" size={12} /> {p.lead}
          </span>
          <Badge tone={spentPct > 80 ? 'amber' : 'gray'}>{spentPct}% spent</Badge>
        </div>
      </button>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        subtitle="Every engagement in the studio — scope, progress, budget and who is leading it."
        meta={
          <>
            <Badge tone="accent" dot>
              {deliveryStats.activeProjects} active
            </Badge>
            <span className="sol-small sol-muted">
              {deliveryStats.atRisk} at risk · {money(totalBudget)} in contracted work
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => toast('Project register exported as CSV.')}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={15} aria-hidden /> New project
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Active projects" value={deliveryStats.activeProjects} icon="layers" foot={`${deliveryStats.onHold} on hold`} accent />
        <Kpi
          label="At risk"
          value={deliveryStats.atRisk}
          icon="alert"
          foot="Urgent priority or under 35%"
        />
        <Kpi label="Contracted value" value={compactMoney(totalBudget)} icon="wallet" foot={`${compactMoney(totalSpent)} spent to date`} />
        <Kpi
          label="Average progress"
          value={`${Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)}%`}
          icon="trend"
          foot="Across all projects"
        />
      </div>

      <Card flush className="sol-mt-4">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search projects, clients or codes…"
              ariaLabel="Search projects"
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
                count: f.id === 'all' ? projects.length : projects.filter((p) => p.status === f.id).length,
              }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        {view === 'board' ? (
          <div className="sol-card-body">
            {filter === 'all' ? (
              <div className="sol-board">
                {BOARD_STATUSES.map((status) => {
                  const items = list.filter((p) => p.status === status);
                  return (
                    <div key={status} className="sol-board-col">
                      <div className="sol-board-head">
                        <span>{status === 'on_hold' ? 'On hold' : status === 'active' ? 'Active' : status === 'done' ? 'Done' : 'In review'}</span>
                        <span className="sol-board-count">{items.length}</span>
                      </div>
                      {items.map(renderCard)}
                      {!items.length ? (
                        <div className="sol-small sol-muted" style={{ padding: '10px 4px' }}>
                          Nothing here right now.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="sol-board" style={{ gridTemplateColumns: 'minmax(240px, 1fr)' }}>
                <div className="sol-board-col">
                  <div className="sol-board-head">
                    <span>{FILTERS.find((f) => f.id === filter)?.label}</span>
                    <span className="sol-board-count">{list.length}</span>
                  </div>
                  {list.map(renderCard)}
                  {!list.length ? (
                    <div className="sol-small sol-muted" style={{ padding: '10px 4px' }}>
                      No projects match this view.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ) : (
          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Project</Th>
                  <Th>Client</Th>
                  <Th>Status</Th>
                  <Th align="right">Progress</Th>
                  <Th align="right">Budget</Th>
                  <Th>Due</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} data-clickable="true" onClick={() => setSelected(p)}>
                    <Td>
                      <div className="sol-list-title">{p.name}</div>
                      <div className="sol-list-sub">
                        {p.code} · {p.lead}
                      </div>
                    </Td>
                    <Td>
                      <div className="sol-list-title" style={{ fontSize: 12 }}>
                        {p.client_name}
                      </div>
                      <div className="sol-list-sub">{p.tags.join(' · ')}</div>
                    </Td>
                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                    <Td align="right" className="num">
                      {p.progress}%
                    </Td>
                    <Td align="right" className="strong">
                      {money(p.budget)}
                    </Td>
                    <Td className="muted">{fmtDate(p.due)}</Td>
                  </tr>
                ))}
                {!list.length ? (
                  <tr>
                    <Td colSpan={6}>
                      <div className="sol-empty">
                        <span className="sol-empty-icon">
                          <Icon name="layers" size={20} />
                        </span>
                        <h4>No projects match this view</h4>
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
        title={selected?.name || 'Project'}
        subtitle={selected ? `${selected.code} · ${selected.client_name}` : undefined}
        width={480}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast(`${selected?.name} opened in the delivery workspace.`);
                setSelected(null);
              }}
            >
              <Icon name="layers" size={15} /> Open project
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div className="sol-row sol-gap-2">
                <Avatar name={selected.client_name} size="lg" />
                <div>
                  <div className="sol-person-name">{selected.name}</div>
                  <div className="sol-person-sub">{selected.client_name}</div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <p className="sol-small sol-muted" style={{ lineHeight: 1.6 }}>
              {selected.description}
            </p>

            <div>
              <div className="sol-between sol-small sol-muted">
                <span>Delivery progress</span>
                <strong className="sol-num">{selected.progress}%</strong>
              </div>
              <div className="sol-mt-2">
                <Progress value={selected.progress} label={`${selected.name} progress`} />
              </div>
              <div className="sol-small sol-muted sol-mt-2">
                {selected.tasks_done} of {selected.tasks_total} tasks complete
              </div>
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Budget</span>
                <strong>{money(selected.budget)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Spent</span>
                <strong>{money(selected.spent)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Remaining</span>
                <strong>{money(Math.max(0, selected.budget - selected.spent))}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Lead</span>
                <strong>{selected.lead}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Timeline</span>
                <strong>
                  {fmtDate(selected.start)} → {fmtDate(selected.due, { year: true })}
                </strong>
              </div>
              <div className="sol-kv-row">
                <span>Priority</span>
                <strong>{selected.priority}</strong>
              </div>
            </div>

            <div>
              <div className="sol-label">Team</div>
              <div className="sol-row sol-gap-2 sol-wrap sol-mt-2">
                {selected.team.map((name) => (
                  <span key={name} className="sol-row sol-gap-2">
                    <Avatar name={name} size="sm" />
                    <span className="sol-small">{name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="sol-label">Tags</div>
              <div className="sol-row sol-gap-2 sol-wrap sol-mt-2">
                {selected.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => {
                  toast(`Status update started for ${selected.name}.`);
                  setSelected(null);
                }}
              >
                <Icon name="checklist" size={14} /> Update status
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => {
                  toast(`Invoice draft created for ${selected.client_name}.`);
                  setSelected(null);
                }}
              >
                <Icon name="receipt" size={14} /> Raise invoice
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => {
                  toast(`${selected.name} archived.`);
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
        title="Create a project"
        subtitle="Scope the engagement and set the budget and owner."
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={create}>
              <Icon name="plus" size={15} /> Create project
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Project name" className="full">
            <input
              className="sol-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Kite & Co campaign toolkit"
            />
          </Field>
          <Field label="Client" className="full">
            <select
              className="sol-select"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
            >
              {clients.map((c) => (
                <option key={c.id}>{c.company}</option>
              ))}
            </select>
          </Field>
          <Field label="Budget">
            <input
              type="number"
              min={0}
              className="sol-input"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="sol-input"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
          </Field>
          <Field label="Project lead" className="full">
            <select
              className="sol-select"
              value={form.lead}
              onChange={(e) => setForm({ ...form, lead: e.target.value })}
            >
              {team.map((m) => (
                <option key={m.id}>{m.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Scope summary" className="full" hint="What is included in this engagement?">
            <textarea
              className="sol-textarea"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deliverables, milestones and any exclusions."
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
