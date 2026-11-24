'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Send, Sparkles, X } from 'lucide-react';
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
import { conditionLog, patients } from './mock';
import { useSolutionsLive } from '../live';
import { moReply } from '../ai';
import type { ConditionLogEntry, Patient, PatientStatus } from '../types';

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

type ChatMessage = { id: string; role: 'user' | 'mo'; text: string };

/** Keeps the open patient across live-data remounts. */
let rememberedPatientId: string | null = null;

const SEVERITY_TONE: Record<string, 'gray' | 'amber' | 'red'> = {
  mild: 'gray',
  moderate: 'amber',
  severe: 'red',
};

export function HealthcarePatients({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate, status: liveStatus } = useSolutionsLive();

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(rememberedPatientId);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [conditionDraft, setConditionDraft] = useState({ condition: '', severity: 'moderate', note: '' });
  const [conditionBusy, setConditionBusy] = useState(false);

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const selected = selectedId ? patients.find((p) => p.id === selectedId) || null : null;

  const selectPatient = (p: Patient | null) => {
    rememberedPatientId = p?.id || null;
    setSelectedId(p?.id || null);
  };

  useEffect(() => {
    setConditionDraft({ condition: '', severity: 'moderate', note: '' });
    setChat([]);
    setChatInput('');
  }, [selectedId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

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

  const patientLog = useMemo(
    () =>
      selected
        ? conditionLog
            .filter((l) => l.patient_id === selected.id || l.patient_name === selected.full_name)
            .sort((a, b) => String(b.recorded_at).localeCompare(String(a.recorded_at)))
        : [],
    [selected],
  );

  const register = async () => {
    if (!form.name.trim()) {
      toast('Enter the patient’s full name to continue.');
      return;
    }
    setSaving(true);
    const res = await mutate({
      action: 'patient_create',
      fullName: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      dateOfBirth: form.dob,
      sex: form.sex,
      bloodGroup: form.blood,
      conditions: form.conditions
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      status: 'new',
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not register the patient.');
      return;
    }
    toast(
      res.preview
        ? `${form.name.trim()} added to the preview register.`
        : `${form.name.trim()} added to the patient register.`,
    );
    setForm(emptyForm);
    setRegisterOpen(false);
  };

  const addCondition = async () => {
    if (!selected) return;
    const condition = conditionDraft.condition.trim();
    if (!condition) {
      toast('Enter the condition to add.');
      return;
    }
    setConditionBusy(true);
    const res = await mutate({
      action: 'condition_update',
      patientId: selected.id,
      condition,
      mode: 'add',
      severity: conditionDraft.severity,
      note: conditionDraft.note.trim() || undefined,
      patientName: selected.full_name,
    });
    setConditionBusy(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the condition.');
      return;
    }
    toast(`“${condition}” added to ${selected.full_name}’s record.`);
    setConditionDraft({ condition: '', severity: 'moderate', note: '' });
  };

  const resolveCondition = async (condition: string) => {
    if (!selected) return;
    setConditionBusy(true);
    const res = await mutate({
      action: 'condition_update',
      patientId: selected.id,
      condition,
      mode: 'resolve',
      patientName: selected.full_name,
    });
    setConditionBusy(false);
    if (!res.ok) {
      toast(res.error || 'Could not resolve the condition.');
      return;
    }
    toast(`“${condition}” marked resolved.`);
  };

  const addConditionNote = async () => {
    if (!selected) return;
    const condition = conditionDraft.condition.trim();
    if (!condition) {
      toast('Enter which condition the note refers to.');
      return;
    }
    if (!conditionDraft.note.trim()) {
      toast('Write the note first.');
      return;
    }
    setConditionBusy(true);
    const res = await mutate({
      action: 'record_create',
      module: 'condition-log',
      title: condition,
      status: 'note',
      notes: conditionDraft.note.trim(),
      meta: {
        patient_id: selected.id,
        patient_name: selected.full_name,
        condition,
        action: 'note',
        severity: conditionDraft.severity,
      },
    });
    setConditionBusy(false);
    if (!res.ok) {
      toast(res.error || 'Could not save the note.');
      return;
    }
    toast(`Progress note saved for ${selected.full_name}.`);
    setConditionDraft({ condition: '', severity: 'moderate', note: '' });
  };

  const sendChat = async (raw?: string) => {
    const text = (raw ?? chatInput).trim();
    if (!text || chatBusy || !selected) return;
    setChat((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    setChatInput('');
    setChatBusy(true);

    const patientContext = {
      name: selected.full_name,
      age: selected.age,
      sex: selected.sex,
      mrn: selected.mrn,
      blood_group: selected.blood_group,
      conditions: selected.conditions,
      allergies: selected.allergies || [],
      last_visit: selected.last_visit,
      balance: selected.balance,
      notes: selected.notes || '',
      conditionLog: patientLog.map((l: ConditionLogEntry) => ({
        condition: l.condition,
        status: l.status,
        severity: l.severity,
        note: l.note,
        recorded_at: l.recorded_at,
      })),
    };

    let reply = '';
    try {
      const res = await fetch('/api/industries/mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          industry: 'healthcare',
          patientContext,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.reply) reply = String(json.reply);
    } catch {
      reply = '';
    }

    if (!reply) {
      reply = moReply('healthcare', text, { patientName: selected.full_name }).text;
    }

    setChat((prev) => [...prev, { id: `m-${Date.now()}`, role: 'mo', text: reply }]);
    setChatBusy(false);
  };

  const quickPrompts = [
    'Summarise this patient',
    'Check allergies',
    'What should we follow up?',
  ];

  const logBadge = (entry: ConditionLogEntry) => {
    if (entry.status === 'resolved') return <Badge tone="green">Resolved</Badge>;
    if (entry.status === 'note') return <Badge tone="blue">Note</Badge>;
    return <Badge tone={SEVERITY_TONE[entry.severity || 'moderate'] || 'amber'}>Active</Badge>;
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
            {liveStatus === 'live' ? (
              <Badge tone="green" dot>
                Live
              </Badge>
            ) : null}
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => { const { downloadCsv } = require('../action-helpers'); downloadCsv('patients.csv', list.map((p) => ({ name: p.full_name, mrn: p.mrn, phone: p.phone, email: p.email, status: p.status, last_visit: p.last_visit }))); toast('Patient register exported as CSV.'); }}
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
                <tr key={p.id} data-clickable="true" onClick={() => selectPatient(p)}>
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
                      {p.conditions.length > 2 ? (
                        <span className="sol-small sol-muted">+{p.conditions.length - 2}</span>
                      ) : null}
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
        onClose={() => selectPatient(null)}
        title={selected?.full_name || 'Patient'}
        subtitle={
          selected
            ? `${selected.mrn} · ${selected.age}y · ${selected.sex} · ${selected.blood_group}`
            : undefined
        }
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => selectPatient(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast(`Appointment draft started for ${selected?.full_name}.`);
                selectPatient(null);
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
              <div className="sol-row sol-between" style={{ marginBottom: 8 }}>
                <div className="sol-label" style={{ margin: 0 }}>
                  Conditions {selected.conditions.length ? `(${selected.conditions.length})` : ''}
                </div>
              </div>
              <div className="sol-row sol-gap-2 sol-wrap">
                {selected.conditions.map((c) => (
                  <span key={c} className="sol-tag sol-row sol-gap-2" style={{ alignItems: 'center' }}>
                    {c}
                    <button
                      type="button"
                      aria-label={`Resolve ${c}`}
                      title="Mark resolved"
                      className="sol-icon-btn"
                      style={{ width: 18, height: 18, padding: 0, border: 'none', background: 'transparent' }}
                      disabled={conditionBusy}
                      onClick={() => resolveCondition(c)}
                    >
                      <X size={12} aria-hidden />
                    </button>
                  </span>
                ))}
                {!selected.conditions.length ? (
                  <span className="sol-small sol-muted">No conditions recorded.</span>
                ) : null}
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

            <Card title="Update condition" subtitle="Track what changed and why">
              <div className="sol-form-grid">
                <Field label="Condition" className="full">
                  <input
                    className="sol-input"
                    value={conditionDraft.condition}
                    onChange={(e) =>
                      setConditionDraft({ ...conditionDraft, condition: e.target.value })
                    }
                    placeholder="e.g. Hypertension"
                  />
                </Field>
                <Field label="Severity">
                  <select
                    className="sol-select"
                    value={conditionDraft.severity}
                    onChange={(e) =>
                      setConditionDraft({ ...conditionDraft, severity: e.target.value })
                    }
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </Field>
                <Field label="Note / observation" className="full">
                  <input
                    className="sol-input"
                    value={conditionDraft.note}
                    onChange={(e) => setConditionDraft({ ...conditionDraft, note: e.target.value })}
                    placeholder="e.g. BP 158/96 — started amlodipine 5mg"
                  />
                </Field>
              </div>
              <div className="sol-row sol-gap-2 sol-wrap" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="sol-btn sol-btn-primary sol-btn-sm"
                  onClick={addCondition}
                  disabled={conditionBusy}
                >
                  <Plus size={13} aria-hidden /> {conditionBusy ? 'Saving…' : 'Add condition'}
                </button>
                <button
                  type="button"
                  className="sol-btn sol-btn-subtle sol-btn-sm"
                  onClick={addConditionNote}
                  disabled={conditionBusy}
                >
                  <Icon name="clipboard" size={13} /> Save progress note
                </button>
              </div>
            </Card>

            <Card title="Condition timeline" subtitle="Every recorded change and note">
              <div className="sol-list">
                {patientLog.map((entry) => (
                  <div key={entry.id} className="sol-list-row" style={{ alignItems: 'flex-start' }}>
                    <div className="sol-list-main">
                      <div className="sol-row sol-gap-2" style={{ alignItems: 'center' }}>
                        <div className="sol-list-title">{entry.condition}</div>
                        {logBadge(entry)}
                      </div>
                      {entry.note ? (
                        <div className="sol-small" style={{ marginTop: 4, lineHeight: 1.5 }}>
                          {entry.note}
                        </div>
                      ) : null}
                      <div className="sol-list-sub" style={{ marginTop: 4 }}>
                        {fmtDate(entry.recorded_at)}
                        {entry.recorded_by ? ` · ${entry.recorded_by}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {!patientLog.length ? (
                  <div className="sol-small sol-muted">
                    No condition updates recorded yet. Add the first one above.
                  </div>
                ) : null}
              </div>
            </Card>

            <Card
              title={
                <span className="sol-row sol-gap-2" style={{ alignItems: 'center' }}>
                  <Icon name="mo" size={15} /> Ask MO about {selected.full_name.split(' ')[0]}
                </span>
              }
              subtitle="Clinical briefing from this patient’s record — MO supports, never replaces, your judgement."
            >
              <div
                ref={chatRef}
                style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}
              >
                {chat.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        background: 'var(--sol-accent-soft)',
                        color: 'var(--sol-accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                      }}
                    >
                      <Icon name={m.role === 'mo' ? 'mo' : 'user'} size={13} />
                    </span>
                    <div
                      style={{
                        background: m.role === 'user' ? 'var(--sol-accent-soft)' : 'var(--sol-surface-2)',
                        border: '1px solid var(--sol-border)',
                        borderRadius: 12,
                        padding: '9px 11px',
                        fontSize: 12.5,
                        lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {!chat.length ? (
                  <div className="sol-small sol-muted">
                    Ask about this patient’s conditions, allergies or follow-up plan.
                  </div>
                ) : null}
                {chatBusy ? (
                  <div className="sol-small sol-muted">MO is reviewing the record…</div>
                ) : null}
              </div>

              <div className="sol-row sol-gap-2 sol-wrap" style={{ marginTop: 10 }}>
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="sol-chip"
                    onClick={() => sendChat(p)}
                    disabled={chatBusy}
                  >
                    <Sparkles size={12} aria-hidden /> {p}
                  </button>
                ))}
              </div>

              <form
                style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChat();
                }}
              >
                <input
                  className="sol-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask MO about this patient…"
                  aria-label="Ask MO about this patient"
                />
                <button
                  type="submit"
                  className="sol-btn sol-btn-primary sol-btn-sm"
                  aria-label="Send to MO"
                  disabled={chatBusy}
                >
                  <Send size={14} aria-hidden />
                </button>
              </form>
            </Card>

            <div className="sol-row sol-gap-2 sol-wrap">
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
                onClick={() => toast(`Care history for ${selected.full_name} opened.`)}
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
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={register}
              disabled={saving}
            >
              <Icon name="plus" size={15} /> {saving ? 'Saving…' : 'Register patient'}
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
