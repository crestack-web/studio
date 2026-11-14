'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Banner,
  Card,
  Field,
  Kpi,
  PageHeader,
  Sheet,
  StatusBadge,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { secondsLabel } from '../format';
import { clinicians, patients, visitStats, visits } from './mock';
import type { Visit } from '../types';

const COLUMNS: { id: Visit['status']; label: string }[] = [
  { id: 'waiting', label: 'Waiting' },
  { id: 'in_consultation', label: 'In consultation' },
  { id: 'completed', label: 'Completed' },
];

export function HealthcareVisits() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Visit | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [form, setForm] = useState({
    patient: patients[0]?.full_name || '',
    clinician: clinicians[0]?.full_name || '',
    reason: '',
    room: 'Consult 1',
  });

  const fever = visits.filter((v) => v.vitals.temperature >= 38);

  const submit = () => {
    if (!form.reason.trim()) {
      toast('Add a reason for the visit before checking the patient in.');
      return;
    }
    toast(`${form.patient} checked in and added to the waiting queue.`);
    setCheckInOpen(false);
    setForm({ ...form, reason: '' });
  };

  return (
    <>
      <PageHeader
        eyebrow="Care delivery"
        title="Visits"
        subtitle="The live care queue — from check-in through consultation to completion."
        meta={
          <>
            <Badge tone="amber" dot>
              {visitStats.queue} waiting
            </Badge>
            <span className="sol-small sol-muted">Average wait {visitStats.avgWait} minutes</span>
          </>
        }
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setCheckInOpen(true)}>
            <Plus size={15} aria-hidden /> Check in patient
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Waiting" value={visitStats.queue} icon="clock" foot="Checked in, not yet seen" accent />
        <Kpi
          label="In consultation"
          value={visitStats.inConsultation}
          icon="stethoscope"
          foot="With a clinician now"
        />
        <Kpi label="Completed" value={visitStats.completed} icon="checkCircle" foot="Consultations closed today" />
        <Kpi
          label="Average wait"
          value={`${visitStats.avgWait}m`}
          icon="activity"
          delta="-4m"
          deltaDir="down"
          foot="vs last week"
        />
      </div>

      {fever.length ? (
        <div className="sol-mt-3">
          <Banner tone="amber" icon="alert" title={`${fever.length} patient with a fever flag`}>
            {fever.map((v) => v.patient_name).join(', ')} · temperature at or above 38°C. Review before
            the consultation starts.
          </Banner>
        </div>
      ) : null}

      <div className="sol-grid sol-grid-3 sol-mt-4">
        {COLUMNS.map((col) => {
          const items = visits.filter((v) => v.status === col.id);
          return (
            <div key={col.id} className="sol-board-col">
              <div className="sol-board-head">
                <span>{col.label}</span>
                <span className="sol-board-count">{items.length}</span>
              </div>
              {items.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="sol-board-card"
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => setSelected(v)}
                >
                  <div className="sol-board-card-top">
                    <span className="sol-board-person">
                      <Avatar name={v.patient_name} size="sm" />
                      {v.patient_name}
                    </span>
                    {v.vitals.temperature >= 38 ? <Badge tone="red">Fever</Badge> : null}
                  </div>
                  <strong>{v.reason}</strong>
                  <small>
                    {v.clinician} · {v.room}
                  </small>
                  <div className="sol-board-foot">
                    <span className="sol-small sol-muted">{secondsLabel(v.checked_in_at)}</span>
                    <StatusBadge status={v.status} />
                  </div>
                </button>
              ))}
              {!items.length ? (
                <div className="sol-small sol-muted" style={{ padding: '10px 4px' }}>
                  Nothing here right now.
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.patient_name || 'Visit'}
        subtitle={selected ? `${selected.reason} · ${selected.department}` : undefined}
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
                toast(
                  selected?.status === 'completed'
                    ? `Visit summary for ${selected.patient_name} opened.`
                    : `${selected?.patient_name} consultation completed.`,
                );
                setSelected(null);
              }}
            >
              {selected?.status === 'completed' ? 'View summary' : 'Complete visit'}
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div className="sol-row sol-gap-2">
                <Avatar name={selected.patient_name} size="lg" />
                <div>
                  <div className="sol-person-name">{selected.patient_name}</div>
                  <div className="sol-person-sub">
                    {selected.clinician} · {selected.room}
                  </div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Checked in</span>
                <strong>{secondsLabel(selected.checked_in_at)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Visit type</span>
                <strong>{selected.type.replace(/_/g, ' ')}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Department</span>
                <strong>{selected.department}</strong>
              </div>
            </div>

            <div>
              <div className="sol-label">Vitals</div>
              <div className="sol-grid sol-grid-3 sol-mt-2">
                <div className="sol-kpi" style={{ padding: 12 }}>
                  <div className="sol-kpi-label">BP</div>
                  <div className="sol-kpi-value" style={{ fontSize: 18 }}>
                    {selected.vitals.blood_pressure}
                  </div>
                </div>
                <div className="sol-kpi" style={{ padding: 12 }}>
                  <div className="sol-kpi-label">Temp</div>
                  <div className="sol-kpi-value" style={{ fontSize: 18 }}>
                    {selected.vitals.temperature}°C
                  </div>
                </div>
                <div className="sol-kpi" style={{ padding: 12 }}>
                  <div className="sol-kpi-label">Pulse</div>
                  <div className="sol-kpi-value" style={{ fontSize: 18 }}>
                    {selected.vitals.pulse}
                  </div>
                </div>
                <div className="sol-kpi" style={{ padding: 12 }}>
                  <div className="sol-kpi-label">Weight</div>
                  <div className="sol-kpi-value" style={{ fontSize: 18 }}>
                    {selected.vitals.weight}kg
                  </div>
                </div>
                <div className="sol-kpi" style={{ padding: 12 }}>
                  <div className="sol-kpi-label">Oxygen</div>
                  <div className="sol-kpi-value" style={{ fontSize: 18 }}>
                    {selected.vitals.oxygen}%
                  </div>
                </div>
                <div className="sol-kpi" style={{ padding: 12 }}>
                  <div className="sol-kpi-label">Room</div>
                  <div className="sol-kpi-value" style={{ fontSize: 18 }}>
                    {selected.room.replace('Consult ', 'C')}
                  </div>
                </div>
              </div>
            </div>

            {selected.diagnosis ? (
              <div>
                <div className="sol-label">Diagnosis</div>
                <p className="sol-small sol-mt-2" style={{ lineHeight: 1.6 }}>
                  {selected.diagnosis}
                </p>
              </div>
            ) : null}

            {selected.note ? (
              <div>
                <div className="sol-label">Clinical note</div>
                <p className="sol-small sol-muted sol-mt-2" style={{ lineHeight: 1.6 }}>
                  {selected.note}
                </p>
              </div>
            ) : null}

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => {
                  toast(`Vitals recorded for ${selected.patient_name}.`);
                  setSelected(null);
                }}
              >
                <Icon name="activity" size={14} /> Record vitals
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => {
                  toast(`Lab request created for ${selected.patient_name}.`);
                  setSelected(null);
                }}
              >
                <Icon name="flask" size={14} /> Request lab
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => {
                  toast(`Prescription drafted for ${selected.patient_name}.`);
                  setSelected(null);
                }}
              >
                <Icon name="pill" size={14} /> Prescribe
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        title="Check in a patient"
        subtitle="Add a walk-in or booked patient to the care queue."
        width={460}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCheckInOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={submit}>
              <Icon name="login" size={15} /> Check in
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Patient" className="full">
            <select
              className="sol-select"
              value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
            >
              {patients.map((p) => (
                <option key={p.id}>{p.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Clinician">
            <select
              className="sol-select"
              value={form.clinician}
              onChange={(e) => setForm({ ...form, clinician: e.target.value })}
            >
              {clinicians.map((c) => (
                <option key={c.id}>{c.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Room">
            <select
              className="sol-select"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            >
              {['Consult 1', 'Consult 2', 'Consult 3', 'Consult 4', 'Consult 5', 'Consult 6'].map(
                (r) => (
                  <option key={r}>{r}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Reason for visit" className="full">
            <input
              className="sol-input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Fever and chills"
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
