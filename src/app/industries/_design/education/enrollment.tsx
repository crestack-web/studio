'use client';

import React, { useMemo, useState } from 'react';
import { Avatar, Badge, Card, Chips, Field, Kpi, PageHeader, Progress, Sheet, StatusBadge, useToast } from '../primitives';
import { Icon } from '../icons';
import { classes, enrollmentStats, enrollments } from './mock';
import type { EnrollmentStage } from '../types';

const STAGES: { id: EnrollmentStage; label: string }[] = [
  { id: 'inquiry', label: 'Inquiry' },
  { id: 'applied', label: 'Applied' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'offered', label: 'Offered' },
  { id: 'enrolled', label: 'Enrolled' },
  { id: 'declined', label: 'Declined' },
];

type EnrollmentFilter = EnrollmentStage | 'all';

export function EducationEnrollment() {
  const { toast } = useToast();
  const [stage, setStage] = useState<EnrollmentFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    applicant: '',
    class_name: classes[0]?.name || '',
    guardian: '',
    phone: '',
    email: '',
    source: 'website',
    notes: '',
  });

  const list = useMemo(
    () =>
      enrollments
        .filter((e) => (stage === 'all' ? true : e.stage === stage))
        .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)),
    [stage],
  );

  const counts = Object.fromEntries(STAGES.map((s) => [s.id, enrollments.filter((e) => e.stage === s.id).length]));

  const chips = [
    { id: 'all' as EnrollmentFilter, label: 'All', count: enrollments.length },
    ...STAGES.map((s) => ({ id: s.id, label: s.label, count: counts[s.id] })),
  ];

  function set<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function create() {
    if (!form.applicant.trim() || !form.guardian.trim()) {
      toast('Enter the applicant and guardian names.');
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setCreateOpen(false);
      toast(`Application for ${form.applicant.trim()} added to the pipeline.`);
      setForm({
        applicant: '',
        class_name: classes[0]?.name || '',
        guardian: '',
        phone: '',
        email: '',
        source: 'website',
        notes: '',
      });
    }, 500);
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="sparkles" size={13} /> Admissions
          </>
        }
        title="Enrollment"
        subtitle="Applications from inquiry to enrollment, with offers and assessments tracked end to end."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={15} aria-hidden /> New application
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Open applications" value={enrollmentStats.open} icon="sparkles" foot="In pipeline" accent />
        <Kpi label="Offers made" value={enrollmentStats.offered} icon="badge" foot={`${enrollmentStats.offered} awaiting response`} />
        <Kpi label="Enrolled" value={enrollmentStats.enrolled} icon="graduation" foot="Joined this term" />
        <Kpi
          label="Conversion"
          value={`${enrollmentStats.conversion}%`}
          icon="trend"
          delta={enrollmentStats.seatsAvailable > 0 ? `${enrollmentStats.seatsAvailable} seats open` : 'Roll full'}
          deltaDir={enrollmentStats.seatsAvailable > 0 ? 'up' : 'down'}
          foot="Seats available"
        />
      </div>

      <div className="sol-grid sol-grid-3 sol-mt-3">
        {STAGES.map((s) => (
          <Card key={s.id} tight>
            <div className="sol-card-body tight">
              <div className="sol-between sol-small">
                <span className="sol-muted">{s.label}</span>
                <Badge tone={s.id === 'enrolled' ? 'green' : s.id === 'declined' ? 'red' : s.id === 'offered' ? 'amber' : 'blue'}>
                  {counts[s.id]}
                </Badge>
              </div>
              <div className="sol-mt-2">
                <Progress
                  value={(counts[s.id] / Math.max(1, enrollments.length)) * 100}
                  tone={s.id === 'enrolled' ? 'green' : s.id === 'declined' ? 'red' : 'amber'}
                  label={`${s.label} applications`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card flush className="sol-mt-3">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <Chips<EnrollmentFilter> items={chips} value={stage} onChange={setStage} />
            <div className="sol-toolbar-spacer" />
            <span className="sol-small sol-muted">{list.length} applications</span>
          </div>
        </div>

        <div className="sol-list sol-card-body" style={{ paddingTop: 0 }}>
          {list.map((e) => (
            <div key={e.id} className="sol-list-row">
              <Avatar name={e.applicant} size="sm" />
              <div className="sol-list-main">
                <div className="sol-list-title">{e.applicant}</div>
                <div className="sol-list-sub">
                  {e.class_name} · guardian {e.guardian} · {e.source.replace(/_/g, ' ')}
                </div>
              </div>
              <div className="sol-list-side">
                <StatusBadge status={e.stage} />
                <small>{e.submitted_at ? e.submitted_at.slice(0, 10) : ''}</small>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New application"
        subtitle="Capture an inquiry or full application into the admissions pipeline."
        width={480}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={create} disabled={saving}>
              <Icon name="plus" size={15} /> {saving ? 'Saving…' : 'Add application'}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Applicant name" className="full">
            <input className="sol-input" value={form.applicant} onChange={set('applicant')} placeholder="e.g. Oluwaseun Ajayi" />
          </Field>
          <Field label="Class applied for" className="full">
            <select className="sol-input" value={form.class_name} onChange={set('class_name')}>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Guardian name">
            <input className="sol-input" value={form.guardian} onChange={set('guardian')} placeholder="Parent or guardian" />
          </Field>
          <Field label="Phone">
            <input className="sol-input" value={form.phone} onChange={set('phone')} placeholder="+234 …" />
          </Field>
          <Field label="Email" className="full">
            <input className="sol-input" type="email" value={form.email} onChange={set('email')} placeholder="guardian@email.com" />
          </Field>
          <Field label="Source">
            <select className="sol-input" value={form.source} onChange={set('source')}>
              <option value="website">Website</option>
              <option value="walk_in">Walk-in</option>
              <option value="referral">Referral</option>
              <option value="open_day">Open day</option>
            </select>
          </Field>
          <Field label="Notes" className="full">
            <textarea className="sol-textarea" value={form.notes} onChange={set('notes')} placeholder="Assessment notes, preferences…" />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
