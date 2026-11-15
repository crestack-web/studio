'use client';

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Chips,
  Field,
  Kpi,
  PageHeader,
  Sheet,
  StatusBadge,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { clinicians, clinic } from './mock';
import { useSolutionsLive } from '../live';
import type { Clinician, ClinicianStatus } from '../types';

type Filter = 'all' | ClinicianStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All staff' },
  { id: 'on_duty', label: 'On duty' },
  { id: 'off_duty', label: 'Off duty' },
  { id: 'on_leave', label: 'On leave' },
];

export function HealthcareStaff() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Clinician | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'Staff nurse', department: 'Nursing', shift: 'Morning' });

  const invite = async () => {
    if (!form.name.trim()) {
      toast('Enter the staff member’s name to continue.');
      return;
    }
    setSaving(true);
    const res = await mutate({
      action: 'staff_create',
      fullName: form.name.trim(),
      role: form.role,
      department: form.department,
      shift: form.shift,
      status: 'off_duty',
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the staff member.');
      return;
    }
    toast(`${form.name.trim()} added to ${clinic.name}.`);
    setForm({ ...form, name: '' });
    setInviteOpen(false);
  };

  const cycleShift = async (person: Clinician) => {
    const order = ['Morning', 'Afternoon', 'Night'];
    const next = order[(order.indexOf(person.shift) + 1) % order.length] || 'Morning';
    const res = await mutate({ action: 'staff_update', id: person.id, shift: next });
    if (!res.ok) {
      toast(res.error || 'Could not update the shift.');
      return;
    }
    toast(`${person.full_name} moved to the ${next.toLowerCase()} shift.`);
    setSelected(null);
  };

  const list = useMemo(
    () => clinicians.filter((c) => (filter === 'all' ? true : c.status === filter)),
    [filter],
  );

  const onDuty = clinicians.filter((c) => c.status === 'on_duty');
  const appointmentsToday = clinicians.reduce((sum, c) => sum + c.appointments_today, 0);

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Clinical staff"
        subtitle="Clinicians, nurses and specialists — shifts, duty status and today’s caseload."
        meta={
          <>
            <Badge tone="green" dot>
              {onDuty.length} on duty
            </Badge>
            <span className="sol-small sol-muted">{clinic.name}</span>
          </>
        }
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setInviteOpen(true)}>
            <Plus size={15} aria-hidden /> Add staff
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="On duty" value={onDuty.length} icon="badge" foot={`of ${clinicians.length} staff`} accent />
        <Kpi
          label="Clinicians"
          value={clinicians.filter((c) => c.full_name.startsWith('Dr.')).length}
          icon="stethoscope"
          foot="Doctors and specialists"
        />
        <Kpi
          label="Nursing team"
          value={clinicians.filter((c) => c.department === 'Nursing').length}
          icon="heartPulse"
          foot="On the wards today"
        />
        <Kpi
          label="Appointments covered"
          value={appointmentsToday}
          icon="calendar"
          foot="Across all clinicians"
        />
      </div>

      <div className="sol-toolbar sol-mt-4">
        <Chips
          items={FILTERS.map((f) => ({
            ...f,
            count: f.id === 'all' ? clinicians.length : clinicians.filter((c) => c.status === f.id).length,
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="sol-desk-grid sol-mt-3">
        {list.map((c) => (
          <button
            key={c.id}
            type="button"
            className="sol-desk-card"
            style={{ textAlign: 'left', cursor: 'pointer' }}
            onClick={() => setSelected(c)}
          >
            <div className="sol-desk-top">
              <div className="sol-row sol-gap-2">
                <Avatar name={c.full_name} />
                <div>
                  <div className="sol-list-title">{c.full_name}</div>
                  <div className="sol-list-sub">{c.role}</div>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="sol-desk-meta">
              <span>
                <Icon name="layers" size={13} /> {c.department}
              </span>
              <span>
                <Icon name="clock" size={13} /> {c.shift} shift
              </span>
              <span>
                <Icon name="calendar" size={13} /> {c.appointments_today} today
              </span>
            </div>
            <div className="sol-desk-foot">
              <span className="sol-small sol-muted">{c.license === '—' ? 'Non-clinical' : c.license}</span>
              {c.appointments_today > 0 ? (
                <Badge tone="accent">{c.appointments_today} appointments</Badge>
              ) : (
                <Badge tone="gray">No clinic list</Badge>
              )}
            </div>
          </button>
        ))}
        {!list.length ? (
          <Card>
            <div className="sol-empty">
              <span className="sol-empty-icon">
                <Icon name="badge" size={20} />
              </span>
              <h4>No staff in this view</h4>
              <p>Change the filter to see the rest of the team.</p>
            </div>
          </Card>
        ) : null}
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name || 'Staff member'}
        subtitle={selected ? `${selected.role} · ${selected.department}` : undefined}
        width={440}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => selected && cycleShift(selected)}
            >
              <Icon name="clock" size={15} /> Update shift
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
                  <div className="sol-person-sub">{selected.role}</div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Department</span>
                <strong>{selected.department}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Shift</span>
                <strong>{selected.shift}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Appointments today</span>
                <strong>{selected.appointments_today}</strong>
              </div>
              <div className="sol-kv-row">
                <span>License</span>
                <strong>{selected.license}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Phone</span>
                <strong>{selected.phone}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Email</span>
                <strong>{selected.email}</strong>
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Message sent to ${selected.full_name}.`)}
              >
                <Icon name="mail" size={14} /> Message
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Clinic list opened for ${selected.full_name}.`)}
              >
                <Icon name="calendar" size={14} /> Clinic list
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => toast(`On-call schedule opened for ${selected.department}.`)}
              >
                On-call rota
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Add a staff member"
        subtitle="Invite a clinician or nurse to the clinic workspace."
        width={460}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setInviteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={invite}
              disabled={saving}
            >
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
              placeholder="e.g. Dr. Amina Sule"
            />
          </Field>
          <Field label="Role">
            <input
              className="sol-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </Field>
          <Field label="Department">
            <select
              className="sol-select"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              {[
                'General medicine',
                'Paediatrics',
                'Cardiology',
                'Obstetrics',
                'Dermatology',
                'Nursing',
                'Laboratory',
                'Pharmacy',
                'Front desk',
              ].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Shift">
            <select
              className="sol-select"
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
            >
              {['Morning', 'Afternoon', 'Night'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </Sheet>
    </>
  );
}
