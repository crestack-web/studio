'use client';

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Badge,
  Card,
  Chips,
  Field,
  Kpi,
  PageHeader,
  Progress,
  Sheet,
  StatusBadge,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { fmtDate } from '../format';
import { bedOccupancy, beds, clinicians, patients, wards } from './mock';
import type { Bed } from '../types';

type Filter = 'all' | string;

export function HealthcareRooms() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Bed | null>(null);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [form, setForm] = useState({
    patient: patients[0]?.full_name || '',
    ward: wards[0] || 'Medical ward',
    bed: '',
    note: '',
  });

  const list = useMemo(
    () => beds.filter((b) => (filter === 'all' ? true : b.ward === filter)),
    [filter],
  );

  const occupancyRate = Math.round((bedOccupancy.occupied / bedOccupancy.total) * 100);

  const grouped = useMemo(() => {
    const map = new Map<string, Bed[]>();
    for (const bed of list) {
      const arr = map.get(bed.ward) || [];
      arr.push(bed);
      map.set(bed.ward, arr);
    }
    return Array.from(map.entries());
  }, [list]);

  return (
    <>
      <PageHeader
        eyebrow="Inpatient"
        title="Wards & beds"
        subtitle="Live bed status across every ward — admissions, cleaning turns and reservations."
        meta={
          <>
            <Badge tone="accent" dot>
              {occupancyRate}% occupancy
            </Badge>
            <span className="sol-small sol-muted">
              {bedOccupancy.occupied} of {bedOccupancy.total} beds in use
            </span>
          </>
        }
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setAdmitOpen(true)}>
            <Plus size={15} aria-hidden /> Admit patient
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Occupancy" value={`${occupancyRate}%`} icon="bed" foot={`${bedOccupancy.total} beds total`} accent />
        <Kpi label="Available" value={bedOccupancy.available} icon="checkCircle" foot="Ready for admission" />
        <Kpi label="Reserved" value={bedOccupancy.reserved} icon="calendar" foot="Held for planned stays" />
        <Kpi label="Cleaning" value={bedOccupancy.cleaning} icon="sparkles" foot="Turnaround in progress" />
      </div>

      <Card className="sol-mt-4">
        <div className="sol-toolbar">
          <Chips
            items={[
              { id: 'all', label: 'All wards', count: beds.length },
              ...wards.map((w) => ({
                id: w,
                label: w,
                count: beds.filter((b) => b.ward === w).length,
              })),
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <div className="sol-mt-3">
          <div className="sol-between">
            <span className="sol-small sol-muted">Ward occupancy</span>
            <strong className="sol-num">{occupancyRate}%</strong>
          </div>
          <div className="sol-mt-2">
            <Progress value={occupancyRate} label="Ward occupancy" />
          </div>
        </div>
        <div className="sol-legend sol-mt-3">
          <span className="sol-legend-item">
            <span className="sol-dot blue" /> Occupied
          </span>
          <span className="sol-legend-item">
            <span className="sol-dot green" /> Available
          </span>
          <span className="sol-legend-item">
            <span className="sol-dot amber" /> Cleaning
          </span>
          <span className="sol-legend-item">
            <span className="sol-dot violet" /> Reserved
          </span>
        </div>
      </Card>

      {grouped.map(([ward, wardBeds]) => {
        const occupied = wardBeds.filter((b) => b.status === 'occupied').length;
        return (
          <Card
            key={ward}
            className="sol-mt-3"
            title={ward}
            subtitle={`${occupied} of ${wardBeds.length} beds occupied`}
            action={<Badge tone="gray">{wardBeds.length} beds</Badge>}
          >
            <div className="sol-room-grid">
              {wardBeds.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="sol-room"
                  data-status={b.status}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => setSelected(b)}
                >
                  <div className="sol-room-top">
                    <span className="sol-room-num">{b.label}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <span className="sol-room-type">{b.patient_name || 'Unoccupied'}</span>
                  <div className="sol-room-meta">
                    <span>
                      <Icon name="user" size={12} /> {b.nurse}
                    </span>
                    {b.admitted_at ? <span>Since {fmtDate(b.admitted_at)}</span> : null}
                  </div>
                  {b.note ? <div className="sol-small sol-muted">{b.note}</div> : null}
                </button>
              ))}
            </div>
          </Card>
        );
      })}

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Bed ${selected.label}` : 'Bed'}
        subtitle={selected ? `${selected.ward} · ${selected.nurse}` : undefined}
        width={420}
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
                  selected?.patient_name
                    ? `Discharge started for ${selected.patient_name}.`
                    : `Bed ${selected?.label} marked ready for admission.`,
                );
                setSelected(null);
              }}
            >
              {selected?.patient_name ? 'Start discharge' : 'Mark available'}
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div>
                <div className="sol-person-name">{selected.label}</div>
                <div className="sol-person-sub">{selected.ward}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Patient</span>
                <strong>{selected.patient_name || '—'}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Admitted</span>
                <strong>{selected.admitted_at ? fmtDate(selected.admitted_at, { year: true }) : '—'}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Nurse</span>
                <strong>{selected.nurse}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Status</span>
                <strong>{selected.status}</strong>
              </div>
            </div>

            {selected.note ? (
              <div>
                <div className="sol-label">Bed note</div>
                <p className="sol-small sol-muted sol-mt-2" style={{ lineHeight: 1.6 }}>
                  {selected.note}
                </p>
              </div>
            ) : null}

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Bed ${selected.label} assigned to the nursing board.`)}
              >
                <Icon name="clipboard" size={14} /> Nursing board
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Handover note opened for bed ${selected.label}.`)}
              >
                <Icon name="activity" size={14} /> Handover note
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={admitOpen}
        onClose={() => setAdmitOpen(false)}
        title="Admit a patient"
        subtitle="Assign an available bed and record the admission."
        width={460}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setAdmitOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                if (!form.bed) {
                  toast('Select an available bed to complete the admission.');
                  return;
                }
                toast(`${form.patient} admitted to ${form.bed}.`);
                setForm({ ...form, bed: '', note: '' });
                setAdmitOpen(false);
              }}
            >
              <Icon name="bed" size={15} /> Admit patient
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
          <Field label="Ward">
            <select
              className="sol-select"
              value={form.ward}
              onChange={(e) => setForm({ ...form, ward: e.target.value, bed: '' })}
            >
              {wards.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </Field>
          <Field label="Available bed">
            <select
              className="sol-select"
              value={form.bed}
              onChange={(e) => setForm({ ...form, bed: e.target.value })}
            >
              <option value="">Select a bed</option>
              {beds
                .filter((b) => b.ward === form.ward && b.status === 'available')
                .map((b) => (
                  <option key={b.id} value={b.label}>
                    {b.label}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Attending nurse">
            <select className="sol-select" defaultValue={clinicians[6]?.full_name}>
              {clinicians
                .filter((c) => c.department === 'Nursing')
                .map((c) => (
                  <option key={c.id}>{c.full_name}</option>
                ))}
            </select>
          </Field>
          <Field label="Admission note" className="full">
            <textarea
              className="sol-textarea"
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Reason for admission, care plan and monitoring instructions."
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
