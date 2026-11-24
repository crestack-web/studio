'use client';

import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
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
import { Icon } from '../icons';
import { useSolutionsLive } from '../live';
import { toastInviteResult } from '../invite-feedback';
import { teacherStats, teachers } from './mock';

export function EducationTeachers() {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    subject: '',
    qualification: '',
  });

  const list = useMemo(
    () =>
      teachers
        .filter((t) => (status === 'all' ? true : t.status === status))
        .filter(
          (t) =>
            !query.trim() ||
            t.full_name.toLowerCase().includes(query.trim().toLowerCase()) ||
            t.subject.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    [query, status],
  );

  const active = teachers.filter((t) => t.status === 'active');

  function set<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function addTeacher() {
    const name = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !form.subject.trim()) {
      toast('Enter the teacher name and subject.');
      return;
    }
    if (!email || !email.includes('@')) {
      toast('Enter a valid email so we can send the invitation.');
      return;
    }
    setSaving(true);
    const res = await mutate({
      action: 'record_create',
      module: 'teachers',
      title: name,
      status: 'active',
      meta: {
        email,
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        qualification: form.qualification.trim(),
      },
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the teacher.');
      return;
    }
    toastInviteResult(toast, { staffName: name, email, result: res, addedLabel: 'added to the faculty roster' });
    setAddOpen(false);
    setForm({ full_name: '', email: '', phone: '', subject: '', qualification: '' });
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="badge" size={13} /> Teachers
          </>
        }
        title="Teachers"
        subtitle="Faculty roster, subject load and attendance across the staff."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => { const { downloadCsv } = require('../action-helpers'); downloadCsv('teachers.csv', list.map((t) => ({ name: t.full_name, email: t.email, subject: t.subject, classes: t.classes, students: t.students, status: t.status, attendance: t.attendance_rate, qualification: t.qualification }))); toast('Staff register exported as CSV.'); }}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={15} aria-hidden /> Add teacher
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Teachers" value={teacherStats.total} icon="badge" foot={`${teacherStats.active} active`} accent />
        <Kpi label="On leave" value={teacherStats.onLeave} icon="heartPulse" foot="Away this term" />
        <Kpi label="Students taught" value={teacherStats.students} icon="graduation" foot="Across all assignments" />
        <Kpi label="Avg attendance" value={`${teacherStats.averageAttendance}%`} icon="checklist" foot="Staff roll" />
      </div>

      <Card flush className="sol-mt-3">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput value={query} onChange={setQuery} placeholder="Search teacher or subject…" ariaLabel="Search teachers" />
            <div className="sol-toolbar-spacer" />
            <div className="sol-chips" style={{ flexWrap: 'wrap' }}>
              {['all', 'active', 'on_leave', 'inactive'].map((s) => (
                <button key={s} type="button" className="sol-chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
                  {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Teacher</Th>
                <Th>Subject</Th>
                <Th align="right">Classes</Th>
                <Th align="right">Students</Th>
                <Th>Status</Th>
                <Th>Attendance</Th>
                <Th>Qualification</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={t.full_name} size="sm" />
                      <div>
                        <div className="sol-list-title">{t.full_name}</div>
                        <div className="sol-list-sub">{t.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="muted">{t.subject}</Td>
                  <Td align="right" className="num">{t.classes}</Td>
                  <Td align="right" className="num">{t.students}</Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td>
                    <div className="sol-meter-row">
                      <span className="sol-meter-main">
                        <span className={`sol-progress ${t.attendance_rate >= 95 ? 'green' : 'amber'}`} style={{ width: `${t.attendance_rate}%` }} />
                      </span>
                      <small className="sol-num">{t.attendance_rate}%</small>
                    </div>
                  </Td>
                  <Td className="muted">{t.qualification}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <div className="sol-grid sol-grid-3 sol-mt-3">
        {active.slice(0, 3).map((t) => (
          <Card key={t.id} tight>
            <div className="sol-card-body tight">
              <div className="sol-row sol-between">
                <div className="sol-row sol-gap-2">
                  <Avatar name={t.full_name} />
                  <div>
                    <div className="sol-list-title">{t.full_name}</div>
                    <div className="sol-list-sub">{t.subject}</div>
                  </div>
                </div>
                <Badge tone={t.attendance_rate >= 95 ? 'green' : 'amber'}>{t.attendance_rate}%</Badge>
              </div>
              <div className="sol-mt-3">
                <Progress value={t.attendance_rate} tone={t.attendance_rate >= 95 ? 'green' : 'amber'} label={`${t.full_name} attendance`} />
              </div>
              <div className="sol-small sol-muted sol-mt-2">
                {t.classes} classes · {t.students} students
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a teacher"
        subtitle="Onboard faculty with subject load and contact details."
        width={480}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={addTeacher} disabled={saving}>
              <Icon name="plus" size={15} /> {saving ? 'Saving…' : 'Add teacher'}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Full name" className="full">
            <input className="sol-input" value={form.full_name} onChange={set('full_name')} placeholder="e.g. Mrs. Kemi Ojo" />
          </Field>
          <Field label="Email">
            <input className="sol-input" type="email" value={form.email} onChange={set('email')} placeholder="name@school.edu.ng" />
          </Field>
          <Field label="Phone">
            <input className="sol-input" value={form.phone} onChange={set('phone')} placeholder="+234 …" />
          </Field>
          <Field label="Subject" className="full">
            <input className="sol-input" value={form.subject} onChange={set('subject')} placeholder="e.g. Mathematics" />
          </Field>
          <Field label="Qualification" className="full">
            <input className="sol-input" value={form.qualification} onChange={set('qualification')} placeholder="e.g. B.Sc Mathematics, PGDE" />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
