'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Mail, Plus } from 'lucide-react';
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
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import { clients, invoices, projects } from './mock';
import { useSolutionsLive } from '../live';
import type { Client, ClientStatus } from '../types';
import { downloadCsv } from '../action-helpers';

type Filter = 'all' | ClientStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'closed', label: 'Closed' },
];

const INDUSTRIES = [
  'Financial services',
  'Consumer goods',
  'Energy',
  'Logistics',
  'Hospitality',
  'Healthcare',
  'Mobility',
  'Education',
  'Media',
  'Technology',
];

const emptyForm = {
  company: '',
  name: '',
  email: '',
  phone: '',
  industry: INDUSTRIES[0],
  status: 'active' as ClientStatus,
  retainer: '500000',
};

function outstandingFor(clientId: string) {
  return invoices
    .filter((i) => i.client_id === clientId && (i.status === 'sent' || i.status === 'overdue'))
    .reduce((sum, i) => sum + Math.max(0, i.amount - i.paid), 0);
}

export function ProfessionalClients({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((c) => (filter === 'all' ? true : c.status === filter))
      .filter((c) =>
        q
          ? c.company.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.industry.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.billed - a.billed);
  }, [filter, query]);

  const active = clients.filter((c) => c.status === 'active');
  const retainerTotal = active.reduce((s, c) => s + c.retainer, 0);
  const outstanding = clients.reduce((s, c) => s + outstandingFor(c.id), 0);
  const billed = clients.reduce((s, c) => s + c.billed, 0);

  const clientProjects = selected
    ? projects.filter((p) => p.client_id === selected.id)
    : [];

  const create = async () => {
    if (!form.company.trim() || !form.name.trim()) {
      toast('Add the company and a contact name to continue.');
      return;
    }
    const res = await mutate({
      action: 'client_create',
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      industry: form.industry,
      retainer: Number(form.retainer) || 0,
      status: form.status,
    });
    if (!res.ok) {
      toast(res.error || 'Could not add the client.');
      return;
    }
    toast(`${form.company.trim()} added as a client.`);
    setForm(emptyForm);
    setCreateOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="users" size={13} /> Client relationships
          </>
        }
        title="Clients"
        subtitle="Every client on the books — retainers, active engagements and what they owe."
        meta={
          <>
            <Badge tone="accent" dot>
              {active.length} active
            </Badge>
            <span className="sol-small sol-muted">
              {compactMoney(retainerTotal)} in monthly retainers
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => { downloadCsv('clients.csv', list); toast('Client list exported as CSV.'); }}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={15} aria-hidden /> Add client
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Active clients"
          value={active.length}
          icon="users"
          foot={`${clients.length} total accounts`}
          accent
        />
        <Kpi
          label="Monthly retainers"
          value={compactMoney(retainerTotal)}
          icon="wallet"
          foot="Recurring revenue"
        />
        <Kpi
          label="Billed to date"
          value={compactMoney(billed)}
          icon="trend"
          foot="Across all engagements"
        />
        <Kpi
          label="Outstanding"
          value={compactMoney(outstanding)}
          icon="receipt"
          delta={`${clients.filter((c) => outstandingFor(c.id) > 0).length} owing`}
          deltaDir="down"
          foot="Awaiting collection"
        />
      </div>

      <Card flush>
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search clients, contacts or industries…"
              ariaLabel="Search clients"
            />
            <div className="sol-toolbar-spacer" />
            <Chips
              items={FILTERS.map((f) => ({
                ...f,
                count:
                  f.id === 'all'
                    ? clients.length
                    : clients.filter((c) => c.status === f.id).length,
              }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Industry</Th>
                <Th align="right">Retainer</Th>
                <Th align="right">Projects</Th>
                <Th align="right">Billed</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} data-clickable="true" onClick={() => setSelected(c)}>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={c.company} />
                      <div>
                        <div className="sol-list-title">{c.company}</div>
                        <div className="sol-list-sub">{c.name}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="muted">{c.industry}</Td>
                  <Td align="right" className={c.retainer ? 'strong' : 'muted'}>
                    {c.retainer ? `${money(c.retainer)}/mo` : '—'}
                  </Td>
                  <Td align="right" className="num">
                    {c.projects}
                  </Td>
                  <Td align="right" className="num">
                    {compactMoney(c.billed)}
                  </Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <Td colSpan={6}>
                    <div className="sol-empty">
                      <span className="sol-empty-icon">
                        <Icon name="users" size={20} />
                      </span>
                      <h4>No clients match “{query}”</h4>
                      <p>Try a different company, contact or industry.</p>
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
        title={selected?.company || 'Client'}
        subtitle={selected ? `${selected.name} · client since ${fmtDate(selected.since, { year: true })}` : undefined}
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
                toast(`New project draft started for ${selected?.company}.`);
                setSelected(null);
              }}
            >
              <Icon name="plus" size={15} /> New project
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div className="sol-row sol-gap-2">
                <Avatar name={selected.company} size="lg" />
                <div>
                  <div className="sol-person-name">{selected.company}</div>
                  <div className="sol-person-sub">{selected.industry}</div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Primary contact</span>
                <strong>{selected.name}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Email</span>
                <strong>{selected.email}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Phone</span>
                <strong>{selected.phone}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Monthly retainer</span>
                <strong>{selected.retainer ? money(selected.retainer) : 'None'}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Billed to date</span>
                <strong>{money(selected.billed)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Outstanding</span>
                <strong>{outstandingFor(selected.id) ? money(outstandingFor(selected.id)) : 'Settled'}</strong>
              </div>
            </div>

            {selected.notes ? (
              <div>
                <div className="sol-label">Relationship notes</div>
                <p className="sol-small sol-muted sol-mt-2" style={{ lineHeight: 1.6 }}>
                  {selected.notes}
                </p>
              </div>
            ) : null}

            <div>
              <div className="sol-between">
                <div className="sol-label">Engagements</div>
                <span className="sol-small sol-muted">{clientProjects.length} projects</span>
              </div>
              <div className="sol-mt-2">
                {clientProjects.length ? (
                  clientProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={hrefFor('projects')}
                      className="sol-list-row"
                      style={{ paddingLeft: 0, paddingRight: 0 }}
                    >
                      <span className="sol-room-num" style={{ fontSize: 11, minWidth: 48 }}>
                        {p.code}
                      </span>
                      <div className="sol-list-main">
                        <div className="sol-list-title">{p.name}</div>
                        <div className="sol-list-sub">
                          {p.progress}% · due {fmtDate(p.due)}
                        </div>
                      </div>
                      <StatusBadge status={p.status} />
                    </Link>
                  ))
                ) : (
                  <div className="sol-small sol-muted">No engagements yet.</div>
                )}
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Invoice draft created for ${selected.company}.`)}
              >
                <Icon name="receipt" size={14} /> Raise invoice
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`New email to ${selected.email} opened.`)}
              >
                <Mail size={14} aria-hidden /> Email contact
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => toast(`${selected.company} timeline opened.`)}
              >
                View timeline
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add a client"
        subtitle="Create the account and set the retainer."
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={create}>
              <Icon name="plus" size={15} /> Add client
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Company" className="full">
            <input
              className="sol-input"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. Aura Financial"
            />
          </Field>
          <Field label="Primary contact" className="full">
            <input
              className="sol-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Adekunle Ajayi"
            />
          </Field>
          <Field label="Email">
            <input
              className="sol-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@company.com"
            />
          </Field>
          <Field label="Phone">
            <input
              className="sol-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+234 800 000 0000"
            />
          </Field>
          <Field label="Industry">
            <select
              className="sol-select"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            >
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className="sol-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </Field>
          <Field label="Monthly retainer" className="full" hint="Leave empty if this is project-based.">
            <input
              type="number"
              min={0}
              className="sol-input"
              value={form.retainer}
              onChange={(e) => setForm({ ...form, retainer: e.target.value })}
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
