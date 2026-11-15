'use client';

import React, { useMemo, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Field,
  Kpi,
  PageHeader,
  Sheet,
  StatusBadge,
  TableWrap,
  Tabs,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { fmtDate, todayISO } from '../format';
import {
  appointmentStats,
  appointments,
  clinicians,
  clinic,
  patients,
  todaysAppointments,
  upcomingAppointments,
} from './mock';
import { useSolutionsLive } from '../live';
import type { Appointment } from '../types';

type TabId = 'today' | 'upcoming' | 'cancelled' | 'all';

const HOURS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];

export function HealthcareAppointments() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const today = todayISO();
  const [tab, setTab] = useState<TabId>('today');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [form, setForm] = useState({
    patient: patients[0]?.full_name || '',
    clinician: clinicians[0]?.full_name || '',
    date: today,
    time: '09:00',
    reason: '',
    mode: 'in_person',
  });

  const cancelled = appointments.filter(
    (a) => a.status === 'cancelled' || a.status === 'no_show',
  );

  const list = useMemo(() => {
    const base =
      tab === 'today'
        ? todaysAppointments
        : tab === 'upcoming'
          ? upcomingAppointments
          : tab === 'cancelled'
            ? cancelled
            : appointments;
    return [...base].sort((a, b) =>
      a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
    );
  }, [tab, cancelled]);

  const book = async () => {
    if (!form.reason.trim()) {
      toast('Add a reason for the visit to book the appointment.');
      return;
    }
    const patient = patients.find((p) => p.full_name === form.patient);
    const res = await mutate({
      action: 'appointment_create',
      patientId: patient?.id,
      patientName: form.patient,
      clinicianName: form.clinician,
      date: form.date,
      time: form.time,
      reason: form.reason.trim(),
      mode: form.mode,
      department: clinicians.find((c) => c.full_name === form.clinician)?.department,
    });
    if (!res.ok) {
      toast(res.error || 'Could not book the appointment.');
      return;
    }
    toast(`Appointment booked for ${form.patient} on ${fmtDate(form.date)} at ${form.time}.`);
    setBookingOpen(false);
    setForm({ ...form, reason: '' });
  };

  const updateStatus = async (appointment: Appointment, status: string, message: string) => {
    const res = await mutate({ action: 'appointment_update', id: appointment.id, status });
    if (!res.ok) {
      toast(res.error || 'Could not update the appointment.');
      return;
    }
    toast(message);
    setSelected(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Appointments"
        subtitle="Today’s clinic schedule, upcoming bookings and teleconsults."
        meta={
          <>
            <Badge tone="accent" dot>
              {ClinicToday(today)}
            </Badge>
            <span className="sol-small sol-muted">{clinic.opening} – {clinic.closing} · {clinic.timezone}</span>
          </>
        }
        actions={
          <button
            type="button"
            className="sol-btn sol-btn-primary"
            onClick={() => setBookingOpen(true)}
          >
            <Plus size={15} aria-hidden /> Book appointment
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Booked today" value={appointmentStats.today} icon="calendar" foot={`${appointmentStats.upcoming} upcoming`} accent />
        <Kpi
          label="In the queue"
          value={appointmentStats.waiting}
          icon="users"
          foot="Checked in and waiting"
        />
        <Kpi
          label="In consultation"
          value={appointmentStats.inConsultation}
          icon="stethoscope"
          foot="With a clinician now"
        />
        <Kpi
          label="Completed"
          value={appointmentStats.completed}
          icon="checkCircle"
          foot={`${appointmentStats.cancelled} cancelled today`}
        />
      </div>

      <Card
        flush
        title="Schedule"
        subtitle={`${list.length} appointments in view`}
        action={
          <Tabs
            ariaLabel="Appointment filters"
            items={[
              { id: 'today', label: 'Today', count: todaysAppointments.length },
              { id: 'upcoming', label: 'Upcoming', count: upcomingAppointments.length },
              { id: 'cancelled', label: 'Cancelled', count: cancelled.length },
              { id: 'all', label: 'All', count: appointments.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        }
      >
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Time</Th>
                <Th>Patient</Th>
                <Th>Clinician</Th>
                <Th>Type</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} data-clickable="true" onClick={() => setSelected(a)}>
                  <Td className="muted">
                    {a.date === today ? 'Today' : fmtDate(a.date, { weekday: true })}
                  </Td>
                  <Td>
                    <strong className="sol-num">{a.time}</strong>
                  </Td>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={a.patient_name} size="sm" />
                      <div>
                        <div className="sol-list-title">{a.patient_name}</div>
                        <div className="sol-list-sub">{a.reason}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="sol-list-title" style={{ fontSize: 12 }}>
                      {a.clinician}
                    </div>
                    <div className="sol-list-sub">{a.department}</div>
                  </Td>
                  <Td>
                    <Badge tone={a.mode === 'teleconsult' ? 'violet' : 'gray'}>
                      {a.mode === 'teleconsult' ? 'Teleconsult' : a.room || 'In person'}
                    </Badge>
                  </Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <Td colSpan={6}>
                    <div className="sol-empty">
                      <span className="sol-empty-icon">
                        <CalendarDays size={20} />
                      </span>
                      <h4>Nothing scheduled here</h4>
                      <p>Book an appointment to fill this view.</p>
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
        title={selected?.patient_name || 'Appointment'}
        subtitle={
          selected
            ? `${fmtDate(selected.date, { weekday: true, year: true })} · ${selected.time} · ${selected.duration} min`
            : undefined
        }
        width={440}
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
                updateStatus(
                  selected,
                  'checked_in',
                  `${selected.patient_name} checked in for ${selected.time}.`,
                )
              }
            >
              <Icon name="login" size={15} /> Check in patient
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
                  <div className="sol-person-sub">{selected.department}</div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Clinician</span>
                <strong>{selected.clinician}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Reason</span>
                <strong>{selected.reason}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Mode</span>
                <strong>{selected.mode === 'teleconsult' ? 'Teleconsult' : 'In person'}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Room</span>
                <strong>{selected.room || '—'}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Duration</span>
                <strong>{selected.duration} minutes</strong>
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() =>
                  updateStatus(
                    selected,
                    'waiting',
                    `${selected.patient_name} moved to the waiting queue.`,
                  )
                }
              >
                <Icon name="users" size={14} /> Move to queue
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() =>
                  updateStatus(
                    selected,
                    'in_consultation',
                    `Consultation started with ${selected.patient_name}.`,
                  )
                }
              >
                <Icon name="stethoscope" size={14} /> Start consultation
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() =>
                  updateStatus(
                    selected,
                    'cancelled',
                    `Appointment for ${selected.patient_name} cancelled.`,
                  )
                }
              >
                Cancel appointment
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        title="Book an appointment"
        subtitle="Reserve a slot with a clinician."
        width={480}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setBookingOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={book}>
              <Icon name="calendar" size={15} /> Book appointment
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
          <Field label="Mode">
            <select
              className="sol-select"
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value })}
            >
              <option value="in_person">In person</option>
              <option value="teleconsult">Teleconsult</option>
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="sol-input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Time">
            <select
              className="sol-select"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            >
              {HOURS.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </Field>
          <Field label="Reason for visit" className="full">
            <input
              className="sol-input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Blood pressure review"
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}

function ClinicToday(today: string) {
  return `${fmtDate(today, { weekday: true, year: true })} · clinic open`;
}
