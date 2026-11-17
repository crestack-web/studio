import { addDays, todayISO } from '../format';
import type {
  AttendanceDay,
  AttendanceRecord,
  EduActivity,
  EduPayment,
  EduRevenuePoint,
  Enrollment,
  FeeInvoice,
  SchoolClass,
  Student,
  Teacher,
  TeachingTopic,
  TimetableSlot,
} from '../types';

const TODAY = todayISO();
const CUR = 'NGN';
const TERM = 'First term · 2026/2027';

/** Saved workspace preferences from the live `settings` record. */
export const orgSettings: Record<string, any> = {};

export const school = {
  name: 'Your school',
  legalName: '',
  location: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  currency: CUR,
  term: TERM,
  session: '2026/2027',
  ownerName: '',
  ownerEmail: '',
  principal: '',
  motto: '',
  founded: '',
  resumption: TODAY,
  termEnds: TODAY,
};

export const TERM_LABEL = TERM;

/* ── Students ─────────────────────────────────────────────────────── */

export const students: Student[] = [];

/* ── Classes ──────────────────────────────────────────────────────── */

export const classes: SchoolClass[] = [];

/* ── Enrollment pipeline ──────────────────────────────────────────── */

export const enrollments: Enrollment[] = [];

/* ── Attendance ───────────────────────────────────────────────────── */

export const attendanceDays: AttendanceDay[] = [];

export const attendanceRecords: AttendanceRecord[] = [];

/* ── Teachers ─────────────────────────────────────────────────────── */

export const teachers: Teacher[] = [];

/* ── Timetable ────────────────────────────────────────────────────── */

const SLOTS: { start: string; end: string }[] = [
  { start: '08:00', end: '08:45' },
  { start: '09:00', end: '09:45' },
  { start: '10:00', end: '10:45' },
  { start: '11:00', end: '11:45' },
];

const SUBJECTS: Record<string, { subject: string; teacher: string; room: string }> = {
  'JSS 1A': { subject: 'Basic science', teacher: 'Mr. Victor Eze', room: 'Block C · R1' },
  'JSS 2B': { subject: 'Civic education', teacher: 'Mrs. Bola Salami', room: 'Block C · R4' },
  'JSS 3A': { subject: 'Mathematics', teacher: 'Mr. Chinedu Nwosu', room: 'Block C · R5' },
  'SS 1 Science': { subject: 'Chemistry', teacher: 'Mr. Kola Bankole', room: 'Block D · Lab 1' },
  'SS 2 Arts': { subject: 'Literature', teacher: 'Mrs. Ify Okafor', room: 'Block D · R4' },
  'SS 3 Science': { subject: 'Physics', teacher: 'Dr. Moses Akin', room: 'Block D · Lab 3' },
  'Primary 5': { subject: 'Mathematics', teacher: 'Mr. Femi Akande', room: 'Block B · R4' },
  'Nursery 2': { subject: 'Phonics', teacher: 'Mrs. Kemi Ojo', room: 'Block A · R1' },
};

const DAYS: TimetableSlot['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const timetable: TimetableSlot[] = DAYS.flatMap((day, dayIndex) =>
  Object.entries(SUBJECTS).map(([className, meta], classIndex) => {
    const slot = SLOTS[(dayIndex + classIndex) % SLOTS.length];
    return {
      id: `tt-${day.toLowerCase()}-${classIndex}`,
      day,
      start: slot.start,
      end: slot.end,
      class_name: className,
      subject: meta.subject,
      teacher: meta.teacher,
      room: meta.room,
    };
  }),
);

/* ── Teaching topics ──────────────────────────────────────────────── */

export const teachingTopics: TeachingTopic[] = [];

/* ── Fees ─────────────────────────────────────────────────────────── */

const feeItems = (tuition: number, books: number, transport: number): { name: string; amount: number }[] => [
  { name: 'Tuition', amount: tuition },
  { name: 'Books & materials', amount: books },
  { name: 'Transport (term)', amount: transport },
];

export const feeInvoices: FeeInvoice[] = [];

/* ── Payments ─────────────────────────────────────────────────────── */

export const payments: EduPayment[] = [];

/* ── Revenue series ───────────────────────────────────────────────── */

export const revenueSeries: EduRevenuePoint[] = [];

/* ── Summaries ────────────────────────────────────────────────────── */

const activeStudents = students.filter((s) => s.status === 'active');

export const studentStats = {
  total: 342,
  active: activeStudents.length,
  newThisTerm: 18,
  onHold: students.filter((s) => s.status === 'on_hold').length,
  graduated: students.filter((s) => s.status === 'graduated').length,
  byLevel: {
    Nursery: classes.filter((c) => c.level === 'Nursery').reduce((s, c) => s + c.students, 0),
    Primary: classes.filter((c) => c.level === 'Primary').reduce((s, c) => s + c.students, 0),
    Junior: classes.filter((c) => c.level === 'Junior').reduce((s, c) => s + c.students, 0),
    Senior: classes.filter((c) => c.level === 'Senior').reduce((s, c) => s + c.students, 0),
  },
  averageAttendance: Math.round(
    activeStudents.reduce((s, st) => s + st.attendance_rate, 0) / Math.max(1, activeStudents.length),
  ),
  averageScore: Math.round(
    activeStudents.reduce((s, st) => s + st.average_score, 0) / Math.max(1, activeStudents.length),
  ),
};

export const classStats = {
  total: classes.length,
  totalStudents: classes.reduce((s, c) => s + c.students, 0),
  totalCapacity: classes.reduce((s, c) => s + c.capacity, 0),
  averageAttendance: Math.round(
    classes.reduce((s, c) => s + c.attendance_rate, 0) / Math.max(1, classes.length),
  ),
  averageScore: Math.round(
    classes.reduce((s, c) => s + c.average_score, 0) / Math.max(1, classes.length),
  ),
};

export const enrollmentStats = {
  open: enrollments.filter((e) => e.stage !== 'enrolled' && e.stage !== 'declined').length,
  applied: enrollments.filter((e) => e.stage === 'applied').length,
  assessment: enrollments.filter((e) => e.stage === 'assessment').length,
  offered: enrollments.filter((e) => e.stage === 'offered').length,
  enrolled: enrollments.filter((e) => e.stage === 'enrolled').length,
  declined: enrollments.filter((e) => e.stage === 'declined').length,
  seatsAvailable: classStats.totalCapacity - classStats.totalStudents,
  conversion: Math.round(
    (enrollments.filter((e) => e.stage === 'enrolled').length /
      Math.max(1, enrollments.filter((e) => e.stage !== 'declined').length)) *
      100,
  ),
};

export const attendanceStats = {
  today: attendanceDays[attendanceDays.length - 1],
  average: Math.round(
    attendanceDays.reduce((s, d) => s + d.rate, 0) / Math.max(1, attendanceDays.length),
  ),
  present: attendanceDays[attendanceDays.length - 1].present,
  absent: attendanceDays[attendanceDays.length - 1].absent,
  late: attendanceDays[attendanceDays.length - 1].late,
  excused: attendanceRecords.filter((r) => r.status === 'excused').length,
};

export const feeSummary = {
  billed: feeInvoices.reduce((s, f) => s + f.amount, 0),
  collected: feeInvoices.reduce((s, f) => s + f.paid, 0),
  outstanding: feeInvoices.reduce((s, f) => s + Math.max(0, f.amount - f.paid), 0),
  overdue: feeInvoices
    .filter((f) => f.status === 'overdue')
    .reduce((s, f) => s + Math.max(0, f.amount - f.paid), 0),
  paidInvoices: feeInvoices.filter((f) => f.status === 'paid').length,
  overdueInvoices: feeInvoices.filter((f) => f.status === 'overdue').length,
  partiallyPaid: feeInvoices.filter((f) => f.status === 'partially_paid').length,
  collectionRate: Math.round(
    (feeInvoices.reduce((s, f) => s + f.paid, 0) /
      Math.max(1, feeInvoices.reduce((s, f) => s + f.amount, 0))) *
      100,
  ),
};

export const paymentSummary = {
  settled: payments.filter((p) => p.status === 'settled').reduce((s, p) => s + p.amount, 0),
  pending: payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
  today: payments.filter((p) => p.date === TODAY).reduce((s, p) => s + p.amount, 0),
  count: payments.length,
};

export const teacherStats = {
  total: teachers.length,
  active: teachers.filter((t) => t.status === 'active').length,
  onLeave: teachers.filter((t) => t.status === 'on_leave').length,
  students: teachers.reduce((s, t) => s + t.students, 0),
  averageAttendance: Math.round(
    teachers.reduce((s, t) => s + t.attendance_rate, 0) / Math.max(1, teachers.length),
  ),
};

/* ── Mixes ────────────────────────────────────────────────────────── */

export const levelMix: { name: string; value: number; color?: string }[] = [];

export const classMix = classes.map((c) => ({ name: c.name, value: c.students, color: 'var(--sol-chart-1)' }));

/* ── Activity ─────────────────────────────────────────────────────── */

export const activity: EduActivity[] = [];

/* ── Reports ──────────────────────────────────────────────────────── */

export const reports: { id: string; name: string; description?: string; icon?: string; lastRun?: string; cadence?: string }[] = [];

/* ── Notifications ────────────────────────────────────────────────── */

export const notifications: { id: string; title: string; detail: string; time: string; unread: boolean }[] = [];

/* ── Live hydration ───────────────────────────────────────────────────
 * The dashboard screens import the arrays and summary objects below by
 * live binding. Mutating them in place lets a single fetch replace the
 * demo snapshot without remounting the whole module graph.
 */

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

function normStudentStatus(value: unknown): Student['status'] {
  const v = String(value || '').toLowerCase();
  if (v === 'graduated' || v === 'withdrawn' || v === 'on_hold') return v;
  return 'active';
}

function ageFromDob(dob: string | undefined | null): number {
  if (!dob) return 0;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 86_400_000)));
}

function levelFor(className: string): SchoolClass['level'] {
  if (/^nursery/i.test(className)) return 'Nursery';
  if (/^primary/i.test(className)) return 'Primary';
  if (/^jss/i.test(className)) return 'Junior';
  return 'Senior';
}

function recalcEducationSummaries() {
  const active = students.filter((s) => s.status === 'active');
  const byLevel = {
    Nursery: classes.filter((c) => c.level === 'Nursery').reduce((s, c) => s + c.students, 0),
    Primary: classes.filter((c) => c.level === 'Primary').reduce((s, c) => s + c.students, 0),
    Junior: classes.filter((c) => c.level === 'Junior').reduce((s, c) => s + c.students, 0),
    Senior: classes.filter((c) => c.level === 'Senior').reduce((s, c) => s + c.students, 0),
  };
  Object.assign(studentStats, {
    total: students.length,
    active: active.length,
    newThisTerm: students.filter((s) => {
      if (!s.enrolled_at) return false;
      const d = new Date(s.enrolled_at);
      return !Number.isNaN(d.getTime()) && Date.now() - d.getTime() < 120 * 86_400_000;
    }).length,
    onHold: students.filter((s) => s.status === 'on_hold').length,
    graduated: students.filter((s) => s.status === 'graduated').length,
    byLevel,
    averageAttendance: Math.round(
      active.reduce((s, st) => s + st.attendance_rate, 0) / Math.max(1, active.length),
    ),
    averageScore: Math.round(
      active.reduce((s, st) => s + st.average_score, 0) / Math.max(1, active.length),
    ),
  });

  Object.assign(classStats, {
    total: classes.length,
    totalStudents: classes.reduce((s, c) => s + c.students, 0),
    totalCapacity: classes.reduce((s, c) => s + c.capacity, 0),
    averageAttendance: Math.round(
      classes.reduce((s, c) => s + c.attendance_rate, 0) / Math.max(1, classes.length),
    ),
    averageScore: Math.round(
      classes.reduce((s, c) => s + c.average_score, 0) / Math.max(1, classes.length),
    ),
  });

  Object.assign(enrollmentStats, {
    open: enrollments.filter((e) => e.stage !== 'enrolled' && e.stage !== 'declined').length,
    applied: enrollments.filter((e) => e.stage === 'applied').length,
    assessment: enrollments.filter((e) => e.stage === 'assessment').length,
    offered: enrollments.filter((e) => e.stage === 'offered').length,
    enrolled: enrollments.filter((e) => e.stage === 'enrolled').length,
    declined: enrollments.filter((e) => e.stage === 'declined').length,
    seatsAvailable: classStats.totalCapacity - classStats.totalStudents,
    conversion: Math.round(
      (enrollments.filter((e) => e.stage === 'enrolled').length /
        Math.max(1, enrollments.filter((e) => e.stage !== 'declined').length)) *
        100,
    ),
  });

  const latest =
    attendanceDays[attendanceDays.length - 1] ||
    ({ date: TODAY, present: 0, absent: 0, late: 0, rate: 0 } as AttendanceDay);
  Object.assign(attendanceStats, {
    today: latest,
    average: Math.round(
      attendanceDays.reduce((s, d) => s + d.rate, 0) / Math.max(1, attendanceDays.length),
    ),
    present: latest.present,
    absent: latest.absent,
    late: latest.late,
    excused: attendanceRecords.filter((r) => r.status === 'excused').length,
  });

  const billed = feeInvoices.reduce((s, f) => s + f.amount, 0);
  const collected = feeInvoices.reduce((s, f) => s + f.paid, 0);
  Object.assign(feeSummary, {
    billed,
    collected,
    outstanding: feeInvoices.reduce((s, f) => s + Math.max(0, f.amount - f.paid), 0),
    overdue: feeInvoices
      .filter((f) => f.status === 'overdue')
      .reduce((s, f) => s + Math.max(0, f.amount - f.paid), 0),
    paidInvoices: feeInvoices.filter((f) => f.status === 'paid').length,
    overdueInvoices: feeInvoices.filter((f) => f.status === 'overdue').length,
    partiallyPaid: feeInvoices.filter((f) => f.status === 'partially_paid').length,
    collectionRate: Math.round((collected / Math.max(1, billed)) * 100),
  });

  Object.assign(paymentSummary, {
    settled: payments.filter((p) => p.status === 'settled').reduce((s, p) => s + p.amount, 0),
    pending: payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    today: payments.filter((p) => p.date === TODAY).reduce((s, p) => s + p.amount, 0),
    count: payments.length,
  });

  Object.assign(teacherStats, {
    total: teachers.length,
    active: teachers.filter((t) => t.status === 'active').length,
    onLeave: teachers.filter((t) => t.status === 'on_leave').length,
    students: teachers.reduce((s, t) => s + t.students, 0),
    averageAttendance: Math.round(
      teachers.reduce((s, t) => s + t.attendance_rate, 0) / Math.max(1, teachers.length),
    ),
  });

  replaceArray(levelMix, [
    { name: 'Nursery', value: byLevel.Nursery, color: 'var(--sol-chart-1)' },
    { name: 'Primary', value: byLevel.Primary, color: 'var(--sol-chart-2)' },
    { name: 'Junior', value: byLevel.Junior, color: 'var(--sol-chart-3)' },
    { name: 'Senior', value: byLevel.Senior, color: 'var(--sol-chart-4)' },
  ]);
  replaceArray(
    classMix,
    classes.map((c) => ({ name: c.name, value: c.students, color: 'var(--sol-chart-1)' })),
  );
}

export function hydrateEducation(payload: any): boolean {
  if (!payload) return false;

  const liveStudents: Student[] = asArray(payload.students).map((r: any) => {
    const className = String(r.class_name || '');
    return {
      id: String(r.id),
      admission_no: String(r.admission_no || ''),
      full_name: String(r.full_name || r.name || 'Student'),
      class_name: className,
      gender: String(r.gender || '').toLowerCase() === 'male' ? 'Male' : 'Female',
      date_of_birth: String(r.date_of_birth || ''),
      age: ageFromDob(r.date_of_birth),
      guardian: String(r.guardian || ''),
      guardian_phone: String(r.guardian_phone || ''),
      email: r.email ? String(r.email) : undefined,
      status: normStudentStatus(r.status),
      enrolled_at: String(r.enrolled_at || r.created_at || ''),
      fees_billed: 0,
      fees_paid: 0,
      balance: 0,
      attendance_rate: 0,
      average_score: 0,
      notes: r.notes ? String(r.notes) : undefined,
    };
  });

  const liveInvoices: FeeInvoice[] = asArray(payload.feeInvoices).map((r: any) => {
    const meta = r.meta || {};
    const amount = Number(r.amount || meta.amount || 0);
    const paid = Number(meta.paid ?? meta.paid_amount ?? (r.status === 'paid' ? amount : 0));
    return {
      id: String(r.id),
      number: String(meta.number || r.invoice_number || r.title || 'INV'),
      student_id: String(meta.student_id || ''),
      student_name: String(meta.student_name || meta.studentName || r.title || 'Student'),
      class_name: String(meta.class_name || ''),
      term: String(meta.term || TERM_LABEL),
      items: asArray(meta.items),
      amount,
      paid,
      status: (['paid', 'partially_paid', 'pending', 'overdue'].includes(String(r.status))
        ? r.status
        : paid >= amount && amount > 0
          ? 'paid'
          : paid > 0
            ? 'partially_paid'
            : 'pending') as FeeInvoice['status'],
      date: String(r.occurred_at || r.created_at || TODAY).slice(0, 10),
      due: String(meta.due || meta.due_date || r.due_date || '').slice(0, 10),
    };
  });

  const livePayments: EduPayment[] = asArray(payload.fees).map((r: any) => ({
    id: String(r.id),
    reference: String(r.invoice_number || r.reference || `FEE-${String(r.id).slice(0, 6)}`),
    student_name: String(r.student_name || 'Student'),
    invoice_number: String(r.invoice_number || ''),
    amount: Number(r.amount || 0),
    method: (['cash', 'transfer', 'card', 'pos'].includes(String(r.method))
      ? r.method
      : 'cash') as EduPayment['method'],
    status: (String(r.status) === 'pending'
      ? 'pending'
      : String(r.status) === 'reversed' || String(r.status) === 'refunded'
        ? 'refunded'
        : 'settled') as EduPayment['status'],
    date: String(r.created_at || r.due_date || TODAY).slice(0, 10),
  }));

  const liveClasses: SchoolClass[] = asArray(payload.classes).map((r: any) => {
    const meta = r.meta || {};
    const name = String(meta.name || r.title || 'Class');
    const studentsInClass = liveStudents.filter((s) => s.class_name === name).length;
    return {
      id: String(r.id),
      name,
      level: (meta.level || levelFor(name)) as SchoolClass['level'],
      teacher: String(meta.teacher || ''),
      room: String(meta.room || ''),
      students: Number(meta.students ?? studentsInClass),
      capacity: Number(meta.capacity ?? 0),
      attendance_rate: Number(meta.attendance_rate ?? 0),
      average_score: Number(meta.average_score ?? 0),
      fee_amount: Number(meta.fee_amount ?? 0),
      next_lesson: String(meta.next_lesson || ''),
    };
  });

  const liveTeachers: Teacher[] = asArray(payload.teachers).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      full_name: String(meta.full_name || r.title || 'Teacher'),
      email: String(meta.email || ''),
      phone: String(meta.phone || ''),
      subject: String(meta.subject || ''),
      classes: Number(meta.classes ?? 0),
      students: Number(meta.students ?? 0),
      status: (['active', 'on_leave', 'inactive'].includes(String(r.status))
        ? r.status
        : 'active') as Teacher['status'],
      qualification: String(meta.qualification || ''),
      started: String(meta.started || ''),
      attendance_rate: Number(meta.attendance_rate ?? 0),
    };
  });

  const liveTimetable: TimetableSlot[] = asArray(payload.timetable).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      day: (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(String(meta.day)) ? meta.day : 'Mon') as TimetableSlot['day'],
      start: String(meta.start || '08:00'),
      end: String(meta.end || '08:45'),
      class_name: String(meta.class_name || meta.className || ''),
      subject: String(meta.subject || r.title || ''),
      teacher: String(meta.teacher || ''),
      room: String(meta.room || ''),
    };
  });

  const liveTopics: TeachingTopic[] = asArray(payload.topics).map((r: any) => {
    const meta = r.meta || {};
    const planned = Number(meta.lessons_planned ?? meta.lessonsPlanned ?? 0);
    const done = Number(meta.lessons_done ?? meta.lessonsDone ?? 0);
    return {
      id: String(r.id),
      class_name: String(meta.class_name || meta.className || ''),
      subject: String(meta.subject || ''),
      title: String(r.title || meta.topic || 'Topic'),
      teacher: String(meta.teacher || ''),
      status: (['planned', 'in_progress', 'covered'].includes(String(r.status))
        ? r.status
        : 'planned') as TeachingTopic['status'],
      lessons_planned: planned,
      lessons_done: done,
      term: String(meta.term || TERM),
      notes: r.notes ? String(r.notes) : meta.notes ? String(meta.notes) : undefined,
    };
  });

  const liveEnrollments: Enrollment[] = asArray(payload.enrollments).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      applicant: String(meta.applicant || r.title || 'Applicant'),
      class_name: String(meta.class_name || ''),
      guardian: String(meta.guardian || ''),
      phone: String(meta.phone || ''),
      email: String(meta.email || ''),
      stage: (['inquiry', 'applied', 'assessment', 'offered', 'enrolled', 'declined'].includes(String(r.status))
        ? r.status
        : 'applied') as Enrollment['stage'],
      submitted_at: String(r.occurred_at || r.created_at || TODAY).slice(0, 10),
      source: (['website', 'referral', 'walk_in', 'phone'].includes(String(meta.source))
        ? meta.source
        : 'website') as Enrollment['source'],
      notes: r.notes ? String(r.notes) : undefined,
    };
  });

  const liveAttendanceDays: AttendanceDay[] = asArray(payload.attendanceDays).map((r: any) => {
    const meta = r.meta || {};
    const present = Number(meta.present ?? 0);
    const absent = Number(meta.absent ?? 0);
    const late = Number(meta.late ?? 0);
    const total = present + absent + late;
    return {
      date: String(meta.date || r.occurred_at || r.created_at || TODAY).slice(0, 10),
      present,
      absent,
      late,
      rate: Number(meta.rate ?? (total ? Math.round(((present + late) / total) * 100) : 0)),
    };
  });

  const liveAttendanceRecords: AttendanceRecord[] = asArray(payload.attendanceRecords).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      student_name: String(meta.student_name || r.title || ''),
      class_name: String(meta.class_name || ''),
      status: (['present', 'absent', 'late', 'excused'].includes(String(r.status))
        ? r.status
        : 'present') as AttendanceRecord['status'],
      date: String(meta.date || r.occurred_at || r.created_at || TODAY).slice(0, 10),
      note: r.notes ? String(r.notes) : undefined,
    };
  });

  const settingsRow =
    payload.settings && typeof payload.settings === 'object' ? payload.settings : null;
  const settingsMeta =
    settingsRow && settingsRow.meta && typeof settingsRow.meta === 'object'
      ? (settingsRow.meta as Record<string, any>)
      : null;


  if (settingsMeta) {
    Object.assign(orgSettings, settingsMeta);
    const s = settingsMeta;
    if (s.name) school.name = String(s.name);
    if (s.legal) school.legalName = String(s.legal);
    if (s.principal) school.principal = String(s.principal);
    if (s.location) school.location = String(s.location);
    if (s.address) school.address = String(s.address);
    if (s.phone) school.phone = String(s.phone);
    if (s.email) school.email = String(s.email);
    if (s.website) school.website = String(s.website);
    if (s.motto) school.motto = String(s.motto);
    if (s.session) school.session = String(s.session);
    if (s.currency) school.currency = String(s.currency);
  }

  replaceArray(students, liveStudents);
  replaceArray(feeInvoices, liveInvoices);
  replaceArray(payments, livePayments);
  replaceArray(classes, liveClasses);
  replaceArray(teachers, liveTeachers);
  replaceArray(timetable, liveTimetable);
  replaceArray(teachingTopics, liveTopics);
  replaceArray(enrollments, liveEnrollments);
  replaceArray(attendanceDays, liveAttendanceDays);
  replaceArray(attendanceRecords, liveAttendanceRecords);

  // Roll fee balances + attendance back onto each student for tracking screens.
  for (const student of students) {
    const invoices = feeInvoices.filter(
      (f) => f.student_id === student.id || (f.student_name && f.student_name === student.full_name),
    );
    student.fees_billed = invoices.reduce((s, f) => s + f.amount, 0);
    student.fees_paid = invoices.reduce((s, f) => s + f.paid, 0);
    student.balance = Math.max(0, student.fees_billed - student.fees_paid);
    const records = attendanceRecords.filter((r) => r.student_name === student.full_name);
    if (records.length) {
      const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
      student.attendance_rate = Math.round((present / records.length) * 100);
    } else {
      const cls = classes.find((c) => c.name === student.class_name);
      student.attendance_rate = cls?.attendance_rate || 0;
    }
  }

  recalcEducationSummaries();
  return true;
}
