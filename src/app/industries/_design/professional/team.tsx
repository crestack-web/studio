'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
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
  Td,
  Th,
  useToast,
} from '../primitives';
import { BarsChart } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import { useSolutionsLive } from '../live';
import { toastInviteResult } from '../invite-feedback';
import { projects, team, timeStats } from './mock';
import type { ProMember } from '../types';

type Discipline = 'all' | ProMember['discipline'];

const DISCIPLINES: { id: Discipline; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'Design', label: 'Design' },
  { id: 'Engineering', label: 'Engineering' },
  { id: 'Strategy', label: 'Strategy' },
  { id: 'Content', label: 'Content' },
  { id: 'Operations', label: 'Operations' },
];

export function ProfessionalTeam() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Discipline>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ProMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    discipline: 'Design' as ProMember['discipline'],
    rate: '45000',
  });

  const utilisationChart = team
    .filter((m) => m.status === 'active')
    .map((m) => ({ label: m.full_name.split(' ')[0], Utilisation: m.utilisation }));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return team
      .filter((m) => (filter === 'all' ? true : m.discipline === filter))
      .filter((m) =>
        q
          ? m.full_name.toLowerCase().includes(q) ||
            m.role.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
          : true,
      );
  }, [filter, query]);

  const active = team.filter((m) => m.status === 'active');
  const totalCapacity = active.reduce((s, m) => s + m.capacity, 0);
  const billable = active.reduce((s, m) => s + m.billable_hours, 0);
  const monthlyCost = active.reduce((s, m) => s + m.rate * m.billable_hours, 0);

  const memberProjects = selected
    ? projects.filter((p) => p.team.includes(selected.full_name))
    : [];

  const invite = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email || !email.includes('@')) {
      toast('Add a name and valid email to send the invite.');
      return;
    }
    setSaving(true);
    const res = await mutate({
      action: 'record_create',
      module: 'team',
      title: name,
      status: 'active',
      amount: Number(form.rate) || 0,
      meta: {
        email,
        role: form.role.trim(),
        discipline: form.discipline,
        rate: Number(form.rate) || 0,
      },
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the team member.');
      return;
    }
    toastInviteResult(toast, { staffName: name, email, result: res });
    setInviteOpen(false);
    setForm({ name: '', email: '', role: '', discipline: 'Design', rate: '45000' });
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="badge" size={13} /> Studio
          </>
        }
        title="Team"
        subtitle="Who is on the team, what they are working on and how their billable load looks."
        meta={
          <>
            <Badge tone="accent" dot>
              {active.length} active
            </Badge>
            <span className="sol-small sol-muted">
              {team.filter((m) => m.status === 'on_leave').length} on leave ·{' '}
              {timeStats.avgUtilisation}% average utilisation
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => toast('Team directory exported as CSV.')}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => setInviteOpen(true)}
            >
              <Plus size={15} aria-hidden /> Invite member
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Headcount"
          value={team.length}
          icon="users"
          foot={`${team.filter((m) => m.discipline === 'Design').length} in design`}
          accent
        />
        <Kpi
          label="Average utilisation"
          value={`${timeStats.avgUtilisation}%`}
          icon="trend"
          foot="Billable hours against capacity"
        />
        <Kpi
          label="Billable hours"
          value={`${billable.toFixed(0)}h`}
          icon="clock"
          foot={`of ${totalCapacity}h monthly capacity`}
        />
        <Kpi
          label="Monthly team cost"
          value={compactMoney(monthlyCost)}
          icon="wallet"
          foot="Based on recorded billable hours"
        />
      </div>

      <div className="sol-grid sol-grid-main sol-mt-3">
        <Card title="Utilisation by person" subtitle="Billable load this month, highest first">
          <BarsChart
            data={[...utilisationChart].sort((a, b) => b.Utilisation - a.Utilisation)}
            series={[{ key: 'Utilisation', name: 'Utilisation' }]}
            height={250}
            yFormat={(v) => `${v}%`}
          />
          <div className="sol-legend sol-mt-3">
            <span className="sol-legend-item">
              <span className="sol-swatch" /> Billable utilisation
            </span>
            <span className="sol-legend-item sol-muted">Target 75 – 85%</span>
          </div>
        </Card>

        <Card title="Workload" subtitle="Where the team is stretched">
          <div className="sol-stack-2">
            {[...active]
              .sort((a, b) => b.utilisation - a.utilisation)
              .slice(0, 5)
              .map((m) => (
                <div key={m.id}>
                  <div className="sol-meter-head">
                    <strong>{m.full_name}</strong>
                    <span>{m.utilisation}%</span>
                  </div>
                  <Progress
                    value={m.utilisation}
                    tone={m.utilisation >= 90 ? 'red' : m.utilisation >= 80 ? 'amber' : 'green'}
                    label={`${m.full_name} utilisation`}
                  />
                </div>
              ))}
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-small sol-muted sol-mt-2" style={{ lineHeight: 1.6 }}>
            Anyone above 90% is at capacity. Move work from Zainab and Emeka before taking on new
            briefs.
          </div>
        </Card>
      </div>

      <Card flush className="sol-mt-4">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by name, role or email…"
              ariaLabel="Search team"
            />
            <div className="sol-toolbar-spacer" />
            <Chips
              items={DISCIPLINES.map((d) => ({
                ...d,
                count: d.id === 'all' ? team.length : team.filter((m) => m.discipline === d.id).length,
              }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        <div className="sol-card-body">
          <div className="sol-desk-grid">
            {list.map((m) => (
              <article key={m.id} className="sol-desk-card">
                <div className="sol-desk-top">
                  <div className="sol-row sol-gap-2">
                    <Avatar name={m.full_name} size="lg" />
                    <div>
                      <div className="sol-list-title">{m.full_name}</div>
                      <div className="sol-list-sub">{m.role}</div>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                <div className="sol-row sol-gap-2 sol-wrap">
                  <Badge tone="gray">{m.discipline}</Badge>
                  <Badge tone={m.utilisation >= 90 ? 'red' : m.utilisation >= 80 ? 'amber' : 'green'}>
                    {m.utilisation}% utilised
                  </Badge>
                  <Badge tone="gray">{m.projects} projects</Badge>
                </div>

                <div>
                  <div className="sol-meter-head">
                    <strong>Billable hours</strong>
                    <span>
                      {m.billable_hours}h / {m.capacity}h
                    </span>
                  </div>
                  <Progress
                    value={m.capacity ? (m.billable_hours / m.capacity) * 100 : 0}
                    tone={m.utilisation >= 90 ? 'amber' : 'green'}
                    label={`${m.full_name} billable hours`}
                  />
                </div>

                <div className="sol-between sol-small sol-muted">
                  <span>{money(m.rate)}/hr</span>
                  <span>Since {fmtDate(m.started, { year: true })}</span>
                </div>

                <div className="sol-desk-foot">
                  <button
                    type="button"
                    className="sol-btn sol-btn-ghost sol-btn-sm"
                    onClick={() => setSelected(m)}
                  >
                    View profile
                  </button>
                  <button
                    type="button"
                    className="sol-btn sol-btn-subtle sol-btn-sm"
                    onClick={() => toast(`Workload plan opened for ${m.full_name}.`)}
                  >
                    Plan workload
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!list.length ? (
            <div className="sol-empty">
              <span className="sol-empty-icon">
                <Icon name="users" size={20} />
              </span>
              <h4>No team members match this view</h4>
              <p>Try a different name or discipline.</p>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Access & roles" subtitle="Everyone with a seat in the workspace" flush className="sol-mt-3">
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Discipline</Th>
                <Th>Role</Th>
                <Th align="right">Rate</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id} data-clickable="true" onClick={() => setSelected(m)}>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={m.full_name} size="sm" />
                      <span className="sol-list-title">{m.full_name}</span>
                    </div>
                  </Td>
                  <Td className="muted">{m.discipline}</Td>
                  <Td className="muted">{m.role}</Td>
                  <Td align="right" className="num">
                    {money(m.rate)}
                  </Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name || 'Team member'}
        subtitle={selected ? `${selected.role} · ${selected.discipline}` : undefined}
        width={470}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast(`Workload plan opened for ${selected?.full_name}.`);
                setSelected(null);
              }}
            >
              <Icon name="layers" size={15} /> Plan workload
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div className="sol-row sol-gap-2">
                <Avatar name={selected.full_name} size="lg" />
                <div>
                  <div className="sol-person-name">{selected.full_name}</div>
                  <div className="sol-person-sub">{selected.email}</div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Discipline</span>
                <strong>{selected.discipline}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Phone</span>
                <strong>{selected.phone}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Hourly rate</span>
                <strong>{money(selected.rate)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Utilisation</span>
                <strong>{selected.utilisation}%</strong>
              </div>
              <div className="sol-kv-row">
                <span>Billable hours</span>
                <strong>
                  {selected.billable_hours}h of {selected.capacity}h
                </strong>
              </div>
              <div className="sol-kv-row">
                <span>Joined</span>
                <strong>{fmtDate(selected.started, { year: true })}</strong>
              </div>
            </div>

            <div>
              <div className="sol-between">
                <div className="sol-label">Current projects</div>
                <span className="sol-small sol-muted">{memberProjects.length}</span>
              </div>
              <div className="sol-mt-2">
                {memberProjects.length ? (
                  memberProjects.map((p) => (
                    <div key={p.id} className="sol-list-row" style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <span className="sol-room-num" style={{ fontSize: 11, minWidth: 48 }}>
                        {p.code}
                      </span>
                      <div className="sol-list-main">
                        <div className="sol-list-title">{p.name}</div>
                        <div className="sol-list-sub">
                          {p.client_name} · {p.progress}% complete
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))
                ) : (
                  <div className="sol-small sol-muted">
                    Not assigned to a project right now.
                  </div>
                )}
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Time entries for ${selected.full_name} opened.`)}
              >
                <Icon name="clock" size={14} /> View time
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Message draft started for ${selected.full_name}.`)}
              >
                <Icon name="mail" size={14} /> Message
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => toast(`${selected.full_name} access settings opened.`)}
              >
                Access
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a team member"
        subtitle="They will get an email to join the studio workspace."
        width={480}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setInviteOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={invite} disabled={saving}>
              <Icon name="mail" size={15} /> {saving ? 'Sending…' : 'Send invite'}
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
              placeholder="e.g. Tola Adeyinka"
            />
          </Field>
          <Field label="Work email" className="full">
            <input
              className="sol-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@northwind.studio"
            />
          </Field>
          <Field label="Role">
            <input
              className="sol-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Product designer"
            />
          </Field>
          <Field label="Discipline">
            <select
              className="sol-select"
              value={form.discipline}
              onChange={(e) =>
                setForm({ ...form, discipline: e.target.value as ProMember['discipline'] })
              }
            >
              <option>Design</option>
              <option>Engineering</option>
              <option>Strategy</option>
              <option>Content</option>
              <option>Operations</option>
            </select>
          </Field>
          <Field label="Hourly rate" className="full" hint="Used for billable time and project costing.">
            <input
              type="number"
              min={0}
              className="sol-input"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
