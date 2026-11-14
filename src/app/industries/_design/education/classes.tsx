'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Avatar, Badge, Card, Kpi, PageHeader, Progress } from '../primitives';
import { Icon } from '../icons';
import { classStats, classes } from './mock';

export function EducationClasses({ hrefFor }: { hrefFor: (s: string) => string }) {
  const utilisation = Math.round((classStats.totalStudents / Math.max(1, classStats.totalCapacity)) * 100);

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
          <Link href={hrefFor('teachers')} className="sol-btn sol-btn-subtle">
            <Icon name="badge" size={15} aria-hidden /> Manage teachers
          </Link>
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
        <Kpi
          label="Average score"
          value={`${classStats.averageScore}%`}
          icon="chart"
          foot="Learner average"
        />
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
    </>
  );
}
