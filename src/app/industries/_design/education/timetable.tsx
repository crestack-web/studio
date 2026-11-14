'use client';

import React from 'react';
import { Avatar, Card, Kpi, PageHeader } from '../primitives';
import { Icon } from '../icons';
import { classes, timetable } from './mock';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

export function EducationTimetable() {
  const byDay = DAYS.map((day) => ({
    day,
    slots: timetable
      .filter((s) => s.day === day)
      .sort((a, b) => a.start.localeCompare(b.start)),
  }));

  const totalSlots = timetable.length;
  const teachersUsed = new Set(timetable.map((s) => s.teacher)).size;

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="calendar" size={13} /> Timetable
          </>
        }
        title="Timetable"
        subtitle="Weekly teaching schedule across every class and teacher."
        meta={
          <>
            <span className="sol-small sol-muted">{totalSlots} lessons scheduled</span>
            <span className="sol-small sol-muted">{teachersUsed} teachers on the board</span>
          </>
        }
      />

      <div className="sol-grid sol-grid-main">
        <Card title="Weekly board" subtitle="Mon – Fri · 45-minute periods">
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
                    </div>
                  ))}
                  {!slots.length ? <div className="sol-small sol-muted">No lessons.</div> : null}
                </div>
              </div>
            ))}
          </div>
          <style>{`@media (max-width: 1024px) { .sol-timetable-board { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } } @media (max-width: 640px) { .sol-timetable-board { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
        </Card>

        <Card title="Teachers on the board" subtitle="Weekly load per teacher">
          <div className="sol-stack-2">
            {Object.entries(
              timetable.reduce<Record<string, (typeof timetable)[number][]>>((acc, s) => {
                if (!acc[s.teacher]) acc[s.teacher] = [];
                acc[s.teacher].push(s);
                return acc;
              }, {}),
            ).map(([teacher, items]) => (
              <div key={teacher} className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                <Avatar name={teacher} size="sm" />
                <div className="sol-list-main">
                  <div className="sol-list-title">{teacher}</div>
                  <div className="sol-list-sub">
                    {items.length} lessons · {new Set(items.map((i) => i.class_name)).size} classes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card flush className="sol-mt-3">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <span className="sol-kpi-label">Classes covered</span>
            <div className="sol-toolbar-spacer" />
            <span className="sol-small sol-muted">{classes.length} classes · {classes.reduce((s, c) => s + c.students, 0)} learners</span>
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
    </>
  );
}
