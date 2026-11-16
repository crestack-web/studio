'use client';

import React, { useState } from 'react';
import { Field, Sheet, useToast } from '../primitives';
import { Icon } from '../icons';
import { classes, students } from './mock';

export function NewFeeInvoiceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: students[0]?.id || '',
    term: 'Current term',
    tuition: '',
    books: '',
    transport: '',
    due: '',
  });

  function submit() {
    const student = students.find((s) => s.id === form.student_id);
    if (!student) {
      toast('Choose a student.');
      return;
    }
    const total = (Number(form.tuition) || 0) + (Number(form.books) || 0) + (Number(form.transport) || 0);
    if (!total) {
      toast('Enter at least one fee line amount.');
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      onClose();
      toast(`Invoice created for ${student.full_name} · ₦${total.toLocaleString()}.`);
      setForm({ student_id: students[0]?.id || '', term: 'Current term', tuition: '', books: '', transport: '', due: '' });
    }, 500);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New fee invoice"
      subtitle="Bill tuition, books and transport for a learner this term."
      width={480}
      footer={
        <>
          <button type="button" className="sol-btn sol-btn-subtle" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="sol-btn sol-btn-primary" onClick={submit} disabled={saving}>
            <Icon name="plus" size={15} /> {saving ? 'Creating…' : 'Create invoice'}
          </button>
        </>
      }
    >
      <div className="sol-form-grid">
        <Field label="Student" className="full">
          <select
            className="sol-input"
            value={form.student_id}
            onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} · {s.class_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Term" className="full">
          <input className="sol-input" value={form.term} onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))} />
        </Field>
        <Field label="Tuition (₦)">
          <input className="sol-input" type="number" min={0} value={form.tuition} onChange={(e) => setForm((f) => ({ ...f, tuition: e.target.value }))} placeholder="0" />
        </Field>
        <Field label="Books (₦)">
          <input className="sol-input" type="number" min={0} value={form.books} onChange={(e) => setForm((f) => ({ ...f, books: e.target.value }))} placeholder="0" />
        </Field>
        <Field label="Transport (₦)">
          <input className="sol-input" type="number" min={0} value={form.transport} onChange={(e) => setForm((f) => ({ ...f, transport: e.target.value }))} placeholder="0" />
        </Field>
        <Field label="Due date">
          <input className="sol-input" type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} />
        </Field>
      </div>
    </Sheet>
  );
}

export function TakeAttendanceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    class_name: classes[0]?.name || '',
    present: '',
    absent: '',
    late: '',
    note: '',
  });

  function submit() {
    if (!form.class_name) {
      toast('Choose a class.');
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      onClose();
      toast(`Attendance saved for ${form.class_name}.`);
      setForm({ class_name: classes[0]?.name || '', present: '', absent: '', late: '', note: '' });
    }, 500);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Take attendance"
      subtitle="Record today’s register for a class."
      width={460}
      footer={
        <>
          <button type="button" className="sol-btn sol-btn-subtle" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="sol-btn sol-btn-primary" onClick={submit} disabled={saving}>
            <Icon name="checkCircle" size={15} /> {saving ? 'Saving…' : 'Save register'}
          </button>
        </>
      }
    >
      <div className="sol-form-grid">
        <Field label="Class" className="full">
          <select
            className="sol-input"
            value={form.class_name}
            onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} · {c.students} learners
              </option>
            ))}
          </select>
        </Field>
        <Field label="Present">
          <input className="sol-input" type="number" min={0} value={form.present} onChange={(e) => setForm((f) => ({ ...f, present: e.target.value }))} placeholder="0" />
        </Field>
        <Field label="Absent">
          <input className="sol-input" type="number" min={0} value={form.absent} onChange={(e) => setForm((f) => ({ ...f, absent: e.target.value }))} placeholder="0" />
        </Field>
        <Field label="Late">
          <input className="sol-input" type="number" min={0} value={form.late} onChange={(e) => setForm((f) => ({ ...f, late: e.target.value }))} placeholder="0" />
        </Field>
        <Field label="Note" className="full">
          <input className="sol-input" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional" />
        </Field>
      </div>
    </Sheet>
  );
}
