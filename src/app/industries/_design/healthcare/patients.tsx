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
import { fmtDate, money } from '../format';
import { patients } from './mock';
import type { Patient, PatientStatus } from '../types';

type Filter = 'all' | PatientStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'new', label: 'New' },
  { id: 'chronic', label: 'Chronic' },
  { id: 'inactive', label: 'Inactive' },
];

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  dob: '',
  sex: 'Female',
  blood: 'O+',
  conditions: '',
};

export function HealthcarePatients({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients
      .filter((p) => (filter === 'all' ? true : p.status === filter))
      .filter((p) =>
        q
          ? p.full_name.toLowerCase().includes(q) ||
            p.mrn.toLowerCase().includes(q) ||
            p.phone.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [filter, query]);

  const outstanding = patients.reduce((sum, p) => sum + p.balance, 0);

  const register = () => {
    if (!form.name.trim()) {
      toast('Enter the patient’s full name to continue.');
      return;
    }
    toast(`${form.name.trim()} added to the patient register.`);
    setForm(emptyForm);
    setRegisterOpen(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Patient register"
        title="Patients"
        subtitle="Every registered patient, their care history and outstanding balances."
        meta={
          <>
            <Badge tone="accent" dot>
              {patients.length} registered
            </Badge>
            <span className="sol-small sol-muted">
              {patients.filter((p) => p.status === 'chronic').length} on chronic care
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => toast('Patient register exported as CSV.')}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => setRegisterOpen(true)}
            >
              <Plus size={15} aria-hidden /> Register patient
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Total patients" value={patients.length} icon="users" foot="Across all departments" accent />
        <Kpi
          label="Active care"
          value={patients.filter((p) => p.status === 'active' || p.status === 'chronic').length}
          icon="heartPulse"
          foot={`${patients.filter((p) => p.status === 'new').length} new this week`}
        />
        <Kpi
          label="Chronic care"
          value={patients.filter((p) => p.status === 'chronic').length}
          icon="activity"
          foot="On structured follow-up"
        />
        <Kpi
          label="Outstanding balances"
          value={money(outstanding)}
          icon="wallet"
          foot={`${patients.filter((p) => p.balance > 0).length} patients owing`}
        />
      </div>

      <Card flush>
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by name, MRN or phone…"
              ariaLabel="Search patients"
            />
            <Chips
              items={FILTERS.map((f) => ({
                ...f,
                count:
                  f.id === 'all'
                    ? patients.length
                    : patients.filter((p) => p.status === f.id).length,
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
                <Th>Patient</Th>
                <Th>Contact</Th>
                <Th>Conditions</Th>
                <Th>Last visit</Th>
                <Th align="right">Balance</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} data-clickable="true" onClick={() => setSelected(p)}>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={p.full_name} />
                      <div>
                        <div className="sol-list-title">{p.full_name}</div>
                        <div className="sol-list-sub">
                          {p.mrn} · {p.age}y · {p.sex}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="sol-list-title" style={{ fontSize: 12 }}>
                      {p.phone}
                    </div>
                    <div className="sol-list-sub">{p.email}</div>
                  </Td>
                  <Td>
                    <div className="sol-row sol-gap-2 sol-wrap">
                      {p.conditions.slice(0, 2).map((c) => (
                        <Tag key={c}>{c}</Tag>
                      ))}
                    </div>
                  </Td>
                  <Td className="muted">{fmtDate(p.last_visit)}</Td>
                  <Td align="right" className={p.balance > 0 ? 'strong' : 'muted'}>
                    {p.balance > 0 ? money(p.balance) : '—'}
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
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
                      <h4>No patients match “{query}”</h4>
                      <p>Try a different name, MRN or phone number.</p>
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
        title={selected?.full_name || 'Patient'}
        subtitle={selected ? `${selected.mrn} · ${selected.age}y · ${selected.sex} · ${selected.blood_group}` : undefined}
        width={460}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast(`Appointment draft started for ${selected?.full_name}.`);
                setSelected(null);
              }}
            >
              <Icon name="calendar" size={15} /> Book appointment
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

            {selected.allergies?.length ? (
              <div className="sol-banner red">
                <span className="sol-banner-icon">
                  <Icon name="alert" size={17} />
                </span>
                <div className="sol-banner-body">
                  <strong>Allergies</strong>
                  <div>{selected.allergies.join(' · ')}</div>
                </div>
              </div>
            ) : null}

            <div>
              <div className="sol-label">Conditions</div>
              <div className="sol-row sol-gap-2 sol-wrap sol-mt-2">
                {selected.conditions.map((c) => (
                  <Tag key={c}>{c}</Tag>
                ))}
              </div>
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Phone</span>
                <strong>{selected.phone}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Date of birth</span>
                <strong>{fmtDate(selected.date_of_birth, { year: true })}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Visits</span>
                <strong>{selected.visits}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Last visit</span>
                <strong>{fmtDate(selected.last_visit)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Outstanding balance</span>
                <strong>{selected.balance > 0 ? money(selected.balance) : 'Settled'}</strong>
              </div>
            </div>

            {selected.notes ? (
              <div>
                <div className="sol-label">Clinical notes</div>
                <p className="sol-small sol-muted sol-mt-2" style={{ lineHeight: 1.6 }}>
                  {selected.notes}
                </p>
              </div>
            ) : null}

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => {
                  toast(`Visit note opened for ${selected.full_name}.`);
                  setSelected(null);
                }}
              >
                <Icon name="clipboard" size={14} /> Add visit note
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Payment link sent to ${selected.full_name}.`)}
              >
                <Icon name="card" size={14} /> Request payment
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => {
                  toast(`Care history for ${selected.full_name} opened.`);
                  setSelected(null);
                }}
              >
                View history
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register a patient"
        subtitle="Create a new patient record at the front desk."
        width={480}
        footer={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => setRegisterOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={register}>
              <Icon name="plus" size={15} /> Register patient
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
              placeholder="e.g. Amina Yusuf"
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
          <Field label="Email">
            <input
              className="sol-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="patient@email.com"
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              className="sol-input"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
          </Field>
          <Field label="Sex">
            <select
              className="sol-select"
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value })}
            >
              <option>Female</option>
              <option>Male</option>
            </select>
          </Field>
          <Field label="Blood group">
            <select
              className="sol-select"
              value={form.blood}
              onChange={(e) => setForm({ ...form, blood: e.target.value })}
            >
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Known conditions" className="full" hint="Separate multiple conditions with commas.">
            <input
              className="sol-input"
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              placeholder="e.g. Hypertension, Type 2 diabetes"
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
