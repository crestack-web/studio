'use client';

import React, { useState } from 'react';
import { Badge, Card, Field, Kpi, PageHeader, Progress, Sheet, useToast } from '../primitives';
import { Icon } from '../icons';
import { classes, teachers, teachingTopics, timetable } from './mock';
import { useSolutionsLive } from '../live';
import type { TeachingTopic, TimetableSlot, TopicStatus } from '../types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

const PERIODS = [
  { start: '08:00', end: '08:45' },
  { start: '09:00', end: '09:45' },
  { start: '10:00', end: '10:45' },
  { start: '11:00', end: '11:45' },
  { start: '12:00', end: '12:45' },
  { start: '14:00', end: '14:45' },
];

const TOPIC_TONE: Record<TopicStatus, 'gray' | 'blue' | 'green'> = {
  planned: 'gray',
  in_progress: 'blue',
  covered: 'green',
};

const TOPIC_LABEL: Record<TopicStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  covered: 'Covered',
};

const emptyLesson = {
  day: 'Mon' as TimetableSlot['day'],
  start: '08:00',
  end: '08:45',
  className: '',
  subject: '',
  teacher: '',
  room: '',
};

const emptyTopic = {
  className: '',
  subject: '',
  title: '',
  teacher: '',
  lessonsPlanned: '4',
};

export function EducationTimetable() {
  const { toast } = useToast();
  const { mutate, status: liveStatus } = useSolutionsLive();

  const [lessonOpen, setLessonOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [saving, setSaving] = useState(false);

  const [swapSlot, setSwapSlot] = useState<TimetableSlot | null>(null);
  const [swapTeacher, setSwapTeacher] = useState('');

  const [topicOpen, setTopicOpen] = useState(false);
  const [topicForm, setTopicForm] = useState(emptyTopic);

  const classNames = classes.map((c) => c.name);
  const teacherNames = teachers.map((t) => t.full_name);

  const byDay = DAYS.map((day) => ({
    day,
    slots: timetable
      .filter((s) => s.day === day)
      .sort((a, b) => a.start.localeCompare(b.start)),
  }));

  const totalSlots = timetable.length;
  const teachersUsed = new Set(timetable.map((s) => s.teacher)).size;
  const covered = teachingTopics.filter((t) => t.status === 'covered').length;
  const inProgress = teachingTopics.filter((t) => t.status === 'in_progress').length;
  const coverage = teachingTopics.length ? Math.round((covered / teachingTopics.length) * 100) : 0;

  const openNewLesson = () => {
    setLessonForm({
      ...emptyLesson,
      className: classNames[0] || '',
      teacher: teacherNames[0] || '',
    });
    setLessonOpen(true);
  };

  const createLesson = async () => {
    if (!lessonForm.subject.trim() || !lessonForm.className) {
      toast('Choose a class and enter the subject.');
      return;
    }
    if (lessonForm.end <= lessonForm.start) {
      toast('End time must be after the start time.');
      return;
    }
    setSaving(true);
    const res = await mutate({
      action: 'record_create',
      module: 'timetable',
      title: lessonForm.subject,
      status: 'scheduled',
      meta: {
        day: lessonForm.day,
        start: lessonForm.start,
        end: lessonForm.end,
        class_name: lessonForm.className,
        subject: lessonForm.subject,
        teacher: lessonForm.teacher,
        room: lessonForm.room,
      },
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the lesson.');
      return;
    }
    setLessonOpen(false);
    toast('Lesson added to the timetable.');
  };

  const openSwap = (slot: TimetableSlot) => {
    setSwapSlot(slot);
    setSwapTeacher(slot.teacher);
  };

  const saveSwap = async () => {
    if (!swapSlot) return;
    setSaving(true);
    const res = await mutate({
      action: 'record_update',
      id: swapSlot.id,
      meta: { teacher: swapTeacher },
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not update the lesson.');
      return;
    }
    setSwapSlot(null);
    toast(`Teacher updated to ${swapTeacher || 'unassigned'}.`);
  };

  const openNewTopic = () => {
    setTopicForm({
      ...emptyTopic,
      className: classNames[0] || '',
      teacher: teacherNames[0] || '',
    });
    setTopicOpen(true);
  };

  const createTopic = async () => {
    if (!topicForm.title.trim() || !topicForm.className) {
      toast('Choose a class and name the topic.');
      return;
    }
    setSaving(true);
    const res = await mutate({
      action: 'record_create',
      module: 'topics',
      title: topicForm.title,
      status: 'planned',
      meta: {
        class_name: topicForm.className,
        subject: topicForm.subject,
        teacher: topicForm.teacher,
        lessons_planned: Number(topicForm.lessonsPlanned) || 1,
        lessons_done: 0,
      },
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || 'Could not add the topic.');
      return;
    }
    setTopicOpen(false);
    toast('Teaching topic added to the tracker.');
  };

  const advanceTopic = async (topic: TeachingTopic, next: TopicStatus) => {
    const lessonsDone =
      next === 'covered'
        ? topic.lessons_planned || topic.lessons_done
        : next === 'in_progress'
          ? Math.max(topic.lessons_done, 1)
          : topic.lessons_done;
    const res = await mutate({
      action: 'record_update',
      id: topic.id,
      status: next,
      meta: { lessons_done: lessonsDone },
    });
    if (!res.ok) {
      toast(res.error || 'Could not update the topic.');
      return;
    }
    toast(`“${topic.title}” marked ${TOPIC_LABEL[next].toLowerCase()}.`);
  };

  const addLessonNote = async (slot: TimetableSlot) => {
    if (typeof window === 'undefined') return;
    const note = window.prompt(`Teaching note for ${slot.subject} (${slot.class_name})`, '');
    if (note == null) return;
    const trimmed = note.trim();
    if (!trimmed) return;
    const res = await mutate({
      action: 'record_create',
      module: 'topics',
      title: `${slot.subject} — lesson note`,
      status: 'covered',
      notes: trimmed,
      meta: {
        class_name: slot.class_name,
        subject: slot.subject,
        teacher: slot.teacher,
        lessons_planned: 1,
        lessons_done: 1,
      },
    });
    if (!res.ok) {
      toast(res.error || 'Could not save the note.');
      return;
    }
    toast('Lesson note saved to topic tracking.');
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="calendar" size={13} /> Timetable
          </>
        }
        title="Timetable"
        subtitle="Weekly teaching schedule, teacher assignments and topic coverage in one board."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={openNewLesson}>
            <Icon name="plus" size={15} /> New lesson
          </button>
        }
        meta={
          <>
            <span className="sol-small sol-muted">{totalSlots} lessons scheduled</span>
            <span className="sol-small sol-muted">{teachersUsed} teachers on the board</span>
            {liveStatus === 'live' ? <Badge tone="green" dot>Live</Badge> : null}
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Lessons this week" value={totalSlots} icon="calendar" foot="Mon – Fri" accent />
        <Kpi label="Teachers on board" value={teachersUsed} icon="staff" foot={`${teachers.length} on staff`} />
        <Kpi label="Topics in progress" value={inProgress} icon="book" foot={`${teachingTopics.length} tracked`} />
        <Kpi label="Topic coverage" value={`${coverage}%`} icon="checkCircle" foot={`${covered} covered`} />
      </div>

      <div className="sol-grid sol-grid-main">
        <Card
          title="Weekly board"
          subtitle="Mon – Fri · 45-minute periods · click a lesson to swap the teacher"
          action={
            <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={openNewLesson}>
              <Icon name="plus" size={13} /> Add lesson
            </button>
          }
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: '14px',
            }}
            className="sol-timetable-board"
          >
            {byDay.map(({ day, slots }) => (
              <div
                key={day}
                style={{
                  border: '1px solid var(--sol-border)',
                  borderRadius: 'var(--sol-r-md, 14px)',
                  padding: '12px',
                  background: 'var(--sol-bg)',
                  minWidth: 0,
                }}
              >
                <div className="sol-row sol-between" style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 12.5 }}>{day}</strong>
                  <span className="sol-kpi-label">{slots.length} lessons</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        border: '1px solid var(--sol-border)',
                        borderRadius: 10,
                        padding: '8px 10px',
                        background: 'var(--sol-surface)',
                      }}
                    >
                      <div className="sol-between sol-small">
                        <strong>{slot.start}</strong>
                        <span className="sol-muted">{slot.end}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 12.5, marginTop: 4 }}>{slot.subject}</div>
                      <div className="sol-small sol-muted">{slot.class_name}</div>
                      <div className="sol-small sol-muted">{slot.teacher}</div>
                      <div className="sol-small sol-muted">{slot.room}</div>
                      <div className="sol-row sol-gap-2" style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="sol-btn sol-btn-ghost sol-btn-sm"
                          onClick={() => openSwap(slot)}
                        >
                          <Icon name="refresh" size={12} /> Swap
                        </button>
                        <button
                          type="button"
                          className="sol-btn sol-btn-subtle sol-btn-sm"
                          onClick={() => addLessonNote(slot)}
                        >
                          <Icon name="book" size={12} /> Note
                        </button>
                      </div>
                    </div>
                  ))}
                  {!slots.length ? <div className="sol-small sol-muted">No lessons.</div> : null}
                </div>
              </div>
            ))}
          </div>
          <style>{`@media (max-width: 1024px) { .sol-timetable-board { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } } @media (max-width: 640px) { .sol-timetable-board { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
        </Card>

        <Card
          title="Teachers on the board"
          subtitle="Weekly load per teacher"
          action={<Badge tone="gray">{teachersUsed} active</Badge>}
        >
          <div className="sol-stack-2">
            {Object.entries(
              timetable.reduce<Record<string, TimetableSlot[]>>((acc, s) => {
                const key = s.teacher || 'Unassigned';
                if (!acc[key]) acc[key] = [];
                acc[key].push(s);
                return acc;
              }, {}),
            )
              .sort((a, b) => b[1].length - a[1].length)
              .map(([teacher, items]) => (
                <div key={teacher} className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                  <div className="sol-list-main">
                    <div className="sol-list-title">{teacher}</div>
                    <div className="sol-list-sub">
                      {items.length} lessons · {new Set(items.map((i) => i.class_name)).size} classes
                    </div>
                  </div>
                  <div className="sol-list-side">
                    <Badge tone={items.length > 5 ? 'amber' : 'green'}>{items.length}</Badge>
                  </div>
                </div>
              ))}
            {!timetable.length ? <div className="sol-small sol-muted">No lessons scheduled yet.</div> : null}
          </div>
        </Card>
      </div>

      <Card
        className="sol-mt-3"
        title="Teaching topics"
        subtitle="Track what has been taught and what still needs a lesson — feeds future planning"
        action={
          <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={openNewTopic}>
            <Icon name="plus" size={13} /> Track topic
          </button>
        }
      >
        <div className="sol-stack-2">
          {teachingTopics.map((topic) => {
            const pct = topic.lessons_planned
              ? Math.min(100, Math.round((topic.lessons_done / topic.lessons_planned) * 100))
              : 0;
            return (
              <div key={topic.id} className="sol-list-row" style={{ alignItems: 'flex-start' }}>
                <div className="sol-list-main">
                  <div className="sol-row sol-gap-2" style={{ alignItems: 'center' }}>
                    <div className="sol-list-title">{topic.title}</div>
                    <Badge tone={TOPIC_TONE[topic.status]}>{TOPIC_LABEL[topic.status]}</Badge>
                  </div>
                  <div className="sol-list-sub">
                    {topic.class_name} · {topic.subject} · {topic.teacher}
                  </div>
                  <div style={{ marginTop: 8, maxWidth: 420 }}>
                    <Progress
                      value={pct}
                      tone={topic.status === 'covered' ? 'green' : 'amber'}
                      label={`${topic.lessons_done} of ${topic.lessons_planned} lessons`}
                    />
                  </div>
                  {topic.notes ? (
                    <div className="sol-small sol-muted" style={{ marginTop: 6 }}>
                      {topic.notes}
                    </div>
                  ) : null}
                </div>
                <div className="sol-list-side">
                  <select
                    className="sol-select"
                    value={topic.status}
                    aria-label={`Status for ${topic.title}`}
                    onChange={(e) => advanceTopic(topic, e.target.value as TopicStatus)}
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In progress</option>
                    <option value="covered">Covered</option>
                  </select>
                </div>
              </div>
            );
          })}
          {!teachingTopics.length ? (
            <div className="sol-small sol-muted">No topics tracked yet. Add the first teaching topic.</div>
          ) : null}
        </div>
      </Card>

      <Card flush className="sol-mt-3">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <span className="sol-kpi-label">Classes covered</span>
            <div className="sol-toolbar-spacer" />
            <span className="sol-small sol-muted">
              {classes.length} classes · {classes.reduce((s, c) => s + c.students, 0)} learners
            </span>
          </div>
        </div>
        <div className="sol-card-body">
          <div className="sol-list">
            {classes.map((c) => (
              <div key={c.id} className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                <div className="sol-list-main">
                  <div className="sol-list-title">{c.name}</div>
                  <div className="sol-list-sub">
                    {c.teacher} · {c.room}
                  </div>
                </div>
                <div className="sol-list-side">
                  <span className="sol-small">{c.next_lesson}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Sheet
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        title="New lesson"
        subtitle="Add a period to the weekly timetable"
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setLessonOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={createLesson} disabled={saving}>
              {saving ? 'Saving…' : 'Add lesson'}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Day">
            <select
              className="sol-select"
              value={lessonForm.day}
              onChange={(e) => setLessonForm({ ...lessonForm, day: e.target.value as TimetableSlot['day'] })}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Class">
            <select
              className="sol-select"
              value={lessonForm.className}
              onChange={(e) => setLessonForm({ ...lessonForm, className: e.target.value })}
            >
              {classNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="Start">
            <select
              className="sol-select"
              value={lessonForm.start}
              onChange={(e) => {
                const period = PERIODS.find((p) => p.start === e.target.value);
                setLessonForm({ ...lessonForm, start: e.target.value, end: period?.end || lessonForm.end });
              }}
            >
              {PERIODS.map((p) => (
                <option key={p.start} value={p.start}>
                  {p.start}
                </option>
              ))}
            </select>
          </Field>
          <Field label="End">
            <select
              className="sol-select"
              value={lessonForm.end}
              onChange={(e) => setLessonForm({ ...lessonForm, end: e.target.value })}
            >
              {PERIODS.map((p) => (
                <option key={p.end} value={p.end}>
                  {p.end}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subject" className="full">
            <input
              className="sol-input"
              value={lessonForm.subject}
              onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })}
              placeholder="e.g. Mathematics"
            />
          </Field>
          <Field label="Teacher">
            <select
              className="sol-select"
              value={lessonForm.teacher}
              onChange={(e) => setLessonForm({ ...lessonForm, teacher: e.target.value })}
            >
              {teacherNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="Room">
            <input
              className="sol-input"
              value={lessonForm.room}
              onChange={(e) => setLessonForm({ ...lessonForm, room: e.target.value })}
              placeholder="Block C · R1"
            />
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={Boolean(swapSlot)}
        onClose={() => setSwapSlot(null)}
        title="Swap teacher"
        subtitle={swapSlot ? `${swapSlot.subject} · ${swapSlot.class_name} · ${swapSlot.day} ${swapSlot.start}` : ''}
        width={480}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSwapSlot(null)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={saveSwap} disabled={saving}>
              {saving ? 'Saving…' : 'Save assignment'}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Current teacher">
            <input className="sol-input" value={swapSlot?.teacher || 'Unassigned'} readOnly />
          </Field>
          <Field label="Assign to">
            <select className="sol-select" value={swapTeacher} onChange={(e) => setSwapTeacher(e.target.value)}>
              <option value="">Unassigned</option>
              {teacherNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="sol-small sol-muted" style={{ marginTop: 12 }}>
          The weekly board and teacher load update immediately after saving.
        </p>
      </Sheet>

      <Sheet
        open={topicOpen}
        onClose={() => setTopicOpen(false)}
        title="Track a teaching topic"
        subtitle="Plan coverage and record progress over the term"
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setTopicOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={createTopic} disabled={saving}>
              {saving ? 'Saving…' : 'Add topic'}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Class">
            <select
              className="sol-select"
              value={topicForm.className}
              onChange={(e) => setTopicForm({ ...topicForm, className: e.target.value })}
            >
              {classNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <input
              className="sol-input"
              value={topicForm.subject}
              onChange={(e) => setTopicForm({ ...topicForm, subject: e.target.value })}
              placeholder="e.g. Mathematics"
            />
          </Field>
          <Field label="Topic" className="full">
            <input
              className="sol-input"
              value={topicForm.title}
              onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              placeholder="e.g. Quadratic equations"
            />
          </Field>
          <Field label="Teacher">
            <select
              className="sol-select"
              value={topicForm.teacher}
              onChange={(e) => setTopicForm({ ...topicForm, teacher: e.target.value })}
            >
              {teacherNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label="Lessons planned">
            <input
              className="sol-input"
              type="number"
              min={1}
              value={topicForm.lessonsPlanned}
              onChange={(e) => setTopicForm({ ...topicForm, lessonsPlanned: e.target.value })}
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
