'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Avatar, Badge, Card, Field, Kpi, PageHeader, Progress, Sheet, useToast } from '../primitives';
import { Icon } from '../icons';
import { classStats, classes, teachers } from './mock';

export function EducationClasses({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    level: 'Primary',
    teacher: teachers[0]?.full_name || '',
    room: '',
    capacity: '30',
  });

  const utilisation = Math.round((classStats.totalStudents / Math.max(1, classStats.totalCapacity)) * 100);

  function set<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function create() {
    if (!form.name.trim()) {
      toast('Enter a class name.');
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setCreateOpen(false);
      toast(`${form.name.trim()} created and ready for enrollment.`);
      setForm({ name: '', level: 'Primary', teacher: teachers[0]?.full_name || '', room: '', capacity: '30' });
    }, 500);
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="layers" size={13} /> Classes
          </>
        }
        title="Classes"
        subtitle="Every teaching group, its room, teacher and current learner performance."
        actions={
          <>
            <Link href={hrefFor('teachers')} className="sol-btn sol-btn-subtle">
              <Icon name="badge" size={15} aria-hidden /> Manage teachers
            </Link>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setCreateOpen(true)}>
              <Icon name="plus" size={15} aria-hidden /> Create class
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Classes"
          value={classStats.total}
          icon="layers"
          foot={`${classStats.totalStudents} learners in total`}
          accent
        />
        <Kpi label="Seats used" value={`${utilisation}%`} icon="checklist" foot={`${classStats.totalStudents} of ${classStats.totalCapacity}`} />
        <Kpi
          label="Average attendance"
          value={`${classStats.averageAttendance}%`}
          icon="checklist"
          delta="Roll"
          deltaDir="flat"
          foot="Across classes"
        />
        <Kpi label="Average score" value={`${classStats.averageScore}%`} icon="chart" foot="Learner average" />
      </div>

      <div className="sol-grid sol-grid-3 sol-mt-3">
        {classes.map((c) => (
          <Card key={c.id} title={c.name} subtitle={`${c.level} · ${c.teacher}`}>
            <div className="sol-row sol-between">
              <span className="sol-muted small">{c.room}</span>
              <Badge tone={c.attendance_rate >= 90 ? 'green' : c.attendance_rate >= 75 ? 'amber' : 'red'}>
                {c.attendance_rate}% attendance
              </Badge>
            </div>
            <div className="sol-mt-3">
              <div className="sol-between sol-small sol-muted">
                <span>Learners</span>
                <span className="sol-num">
                  {c.students}/{c.capacity}
                </span>
              </div>
              <div className="sol-mt-2">
                <Progress value={(c.students / Math.max(1, c.capacity)) * 100} label={`${c.name} enrolment`} />
              </div>
            </div>
            <div className="sol-divider sol-mt-3" />
            <div className="sol-grid sol-grid-2">
              <div>
                <div className="sol-kpi-label">Average score</div>
                <div className="sol-kpi-value" style={{ fontSize: 20 }}>
                  {c.average_score}%
                </div>
              </div>
              <div>
                <div className="sol-kpi-label">Next lesson</div>
                <div className="sol-kpi-value" style={{ fontSize: 20 }}>
                  {c.next_lesson}
                </div>
              </div>
            </div>
            <div className="sol-row sol-gap-2 sol-wrap sol-mt-3">
              <Link href={hrefFor('attendance')} className="sol-btn sol-btn-ghost sol-btn-sm">
                Take attendance <ArrowRight size={13} aria-hidden />
              </Link>
              <Link href={hrefFor('fees')} className="sol-btn sol-btn-ghost sol-btn-sm">
                Fee register <ArrowRight size={13} aria-hidden />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a class"
        subtitle="Set the group, room and lead teacher. Learners can be enrolled next."
        width={460}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={create} disabled={saving}>
              <Icon name="plus" size={15} /> {saving ? 'Creating…' : 'Create class'}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Class name" className="full">
            <input className="sol-input" value={form.name} onChange={set('name')} placeholder="e.g. Primary 4B" />
          </Field>
          <Field label="Level">
            <select className="sol-input" value={form.level} onChange={set('level')}>
              <option>Nursery</option>
              <option>Primary</option>
              <option>JSS</option>
              <option>SSS</option>
            </select>
          </Field>
          <Field label="Capacity">
            <input className="sol-input" type="number" min={1} value={form.capacity} onChange={set('capacity')} />
          </Field>
          <Field label="Lead teacher" className="full">
            <select className="sol-input" value={form.teacher} onChange={set('teacher')}>
              {teachers.map((t) => (
                <option key={t.id} value={t.full_name}>
                  {t.full_name} · {t.subject}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Room" className="full">
            <input className="sol-input" value={form.room} onChange={set('room')} placeholder="e.g. Block B · R3" />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
