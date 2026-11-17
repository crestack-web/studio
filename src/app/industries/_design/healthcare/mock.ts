import { addDays, todayISO } from '../format';
import type {
  Appointment,
  Bed,
  Clinician,
  ClinicalActivity,
  ConditionLogEntry,
  HealthPayment,
  Invoice,
  Patient,
  SupplyItem,
  Visit,
} from '../types';

const TODAY = todayISO();
const CUR = 'NGN';

/** Saved workspace preferences from the live `settings` record. */
export const orgSettings: Record<string, any> = {};

export const clinic = {
  name: 'Your clinic',
  legalName: '',
  location: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  currency: CUR,
  opening: '08:00',
  closing: '18:00',
  timezone: 'Africa/Lagos',
  taxRate: 7.5,
  totalBeds: 0,
  ownerName: '',
  ownerEmail: '',
  rating: 0,
};

/* ── Patients ─────────────────────────────────────────────────────── */

type PatientSeed = {
  name: string;
  sex: 'Female' | 'Male';
  age: number;
  dob: string;
  phone: string;
  email: string;
  blood: string;
  conditions: string[];
  allergies?: string[];
  status: Patient['status'];
  visits: number;
  last: number;
  balance?: number;
  notes?: string;
};

const patientSeeds: PatientSeed[] = [
  { name: 'Ngozi Okafor', sex: 'Female', age: 34, dob: '1992-03-14', phone: '+234 803 421 8890', email: 'ngozi.okafor@gmail.com', blood: 'O+', conditions: ['Hypertension'], allergies: ['Penicillin'], status: 'chronic', visits: 12, last: -3, notes: 'Blood pressure stable on amlodipine 5mg. Review every 8 weeks.' },
  { name: 'Emeka Obi', sex: 'Male', age: 45, dob: '1981-07-02', phone: '+234 805 118 2043', email: 'emeka.obi@outfit.ng', blood: 'A+', conditions: ['Type 2 diabetes', 'Hypertension'], allergies: ['Sulfonamides'], status: 'chronic', visits: 9, last: -6, balance: 0, notes: 'HbA1c trending down. Dietitian referral completed.' },
  { name: 'Aisha Bello', sex: 'Female', age: 29, dob: '1997-01-22', phone: '+234 810 772 3311', email: 'aisha.bello@yahoo.com', blood: 'B+', conditions: ['Antenatal care · 24 weeks'], status: 'active', visits: 6, last: -1, balance: 60000, notes: 'First pregnancy. Low-risk pathway, next scan at 28 weeks.' },
  { name: 'Tunde Balogun', sex: 'Male', age: 52, dob: '1974-09-30', phone: '+234 802 909 4471', email: 'tunde.balogun@zenith.co', blood: 'O-', conditions: ['Post-op recovery'], status: 'active', visits: 4, last: -8, notes: 'Appendectomy 12 days ago. Wound healing well.' },
  { name: 'Chiamaka Eze', sex: 'Female', age: 8, dob: '2018-05-11', phone: '+234 803 114 2299', email: 'eze.family@gmail.com', blood: 'A+', conditions: ['Asthma'], status: 'active', visits: 3, last: -14, notes: 'Using salbutamol inhaler with spacer. Mother reports night cough.' },
  { name: 'Ibrahim Musa', sex: 'Male', age: 61, dob: '1965-02-18', phone: '+234 805 660 7781', email: 'ibrahim.musa@gmail.com', blood: 'AB+', conditions: ['Cardiac arrhythmia'], allergies: ['Aspirin'], status: 'chronic', visits: 14, last: -2, notes: 'On bisoprolol. ECG due today, palpitations reported.' },
  { name: 'Funmi Adeyemi', sex: 'Female', age: 41, dob: '1985-11-04', phone: '+234 809 221 5540', email: 'funmi.adeyemi@mail.com', blood: 'O+', conditions: ['Migraine'], status: 'active', visits: 5, last: -9 },
  { name: 'Samuel Nnamdi', sex: 'Male', age: 37, dob: '1989-06-25', phone: '+234 810 998 3321', email: 'samuel.nnamdi@gmail.com', blood: 'B-', conditions: ['Malaria'], status: 'new', visits: 1, last: 0, notes: 'Presented with fever and chills. Malaria RDT positive.' },
  { name: 'Halima Sani', sex: 'Female', age: 26, dob: '2000-08-17', phone: '+234 802 111 4478', email: 'halima.sani@gmail.com', blood: 'A-', conditions: ['Antenatal care · 32 weeks'], status: 'active', visits: 7, last: -4, balance: 80000 },
  { name: 'David Okon', sex: 'Male', age: 58, dob: '1968-04-09', phone: '+234 807 332 9910', email: 'david.okon@bluewave.co', blood: 'O+', conditions: ['Hypertension', 'High cholesterol'], status: 'chronic', visits: 11, last: -7, balance: 55000, notes: 'Admitted for hypertensive urgency. Monitoring hourly.' },
  { name: 'Grace Mensah', sex: 'Female', age: 31, dob: '1995-12-01', phone: '+233 244 118 902', email: 'grace.mensah@gmail.com', blood: 'A+', conditions: ['Dermatitis'], status: 'active', visits: 2, last: -12 },
  { name: 'Yusuf Danladi', sex: 'Male', age: 12, dob: '2014-03-28', phone: '+234 813 776 2204', email: 'danladi.family@gmail.com', blood: 'B+', conditions: ['Tonsillitis'], status: 'active', visits: 3, last: -5 },
  { name: 'Kemi Alabi', sex: 'Female', age: 47, dob: '1979-10-19', phone: '+234 805 991 7723', email: 'kemi.alabi@gmail.com', blood: 'O+', conditions: ['Type 2 diabetes'], allergies: ['Latex'], status: 'chronic', visits: 8, last: -3, balance: 22000 },
  { name: 'Peter Okoye', sex: 'Male', age: 39, dob: '1987-01-07', phone: '+234 811 220 3377', email: 'peter.okoye@mail.com', blood: 'A+', conditions: ['Lower back pain'], status: 'active', visits: 2, last: 0, balance: 32000 },
  { name: 'Zainab Ahmed', sex: 'Female', age: 23, dob: '2003-06-15', phone: '+234 806 447 1120', email: 'zainab.ahmed@gmail.com', blood: 'AB-', conditions: ['Routine check-up'], status: 'new', visits: 1, last: 0 },
  { name: 'Chuka Mba', sex: 'Male', age: 44, dob: '1982-02-23', phone: '+234 809 118 7742', email: 'chuka.mba@gmail.com', blood: 'O+', conditions: ['Gastritis'], status: 'inactive', visits: 4, last: -45 },
  { name: 'Bisi Lawal', sex: 'Female', age: 36, dob: '1990-09-12', phone: '+234 805 990 3317', email: 'bisi.lawal@gmail.com', blood: 'A+', conditions: ['Hypothyroidism'], status: 'chronic', visits: 6, last: -10 },
  { name: 'Musa Garba', sex: 'Male', age: 66, dob: '1960-07-21', phone: '+234 802 671 2200', email: 'musa.garba@mail.com', blood: 'B+', conditions: ['Osteoarthritis'], status: 'chronic', visits: 15, last: -2 },
  { name: 'Rita Ekong', sex: 'Female', age: 30, dob: '1996-04-03', phone: '+234 810 224 9908', email: 'rita.ekong@gmail.com', blood: 'O-', conditions: ['Antenatal care · 18 weeks'], status: 'active', visits: 5, last: -6 },
  { name: 'Femi Oladipo', sex: 'Male', age: 49, dob: '1977-11-26', phone: '+234 803 551 4402', email: 'femi.oladipo@gmail.com', blood: 'A+', conditions: ['Hypertension'], status: 'chronic', visits: 10, last: -8, balance: 8500 },
  { name: 'Joy Ebere', sex: 'Female', age: 28, dob: '1998-08-30', phone: '+234 807 884 1120', email: 'joy.ebere@gmail.com', blood: 'B+', conditions: ['Antenatal care · 38 weeks'], status: 'active', visits: 9, last: -1, notes: 'Admitted for observation ahead of delivery.' },
  { name: 'Sade Williams', sex: 'Female', age: 32, dob: '1994-01-16', phone: '+234 809 662 3341', email: 'sade.williams@gmail.com', blood: 'O+', conditions: ['Postnatal care'], status: 'active', visits: 4, last: -2 },
  { name: 'Ada Obi', sex: 'Female', age: 6, dob: '2020-06-08', phone: '+234 805 330 9912', email: 'obi.family@gmail.com', blood: 'A+', conditions: ['Malaria'], status: 'active', visits: 2, last: -1 },
];

export const patients: Patient[] = [];

export const todaysAppointments = appointments.filter((a) => a.date === TODAY);
export const upcomingAppointments = appointments.filter((a) => a.date > TODAY);

export const appointmentStats = {
  today: todaysAppointments.length,
  waiting: todaysAppointments.filter((a) => a.status === 'waiting' || a.status === 'checked_in').length,
  inConsultation: todaysAppointments.filter((a) => a.status === 'in_consultation').length,
  completed: todaysAppointments.filter((a) => a.status === 'completed').length,
  cancelled: todaysAppointments.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length,
  upcoming: upcomingAppointments.length,
};

/* ── Visits (today's care queue) ──────────────────────────────────── */

export const visits: Visit[] = [];

export const visitStats = {
  queue: visits.filter((v) => v.status === 'waiting').length,
  inConsultation: visits.filter((v) => v.status === 'in_consultation').length,
  completed: visits.filter((v) => v.status === 'completed').length,
  avgWait: 18,
};

/* ── Beds ─────────────────────────────────────────────────────────── */

type BedSeed = { label: string; ward: string; status: Bed['status']; patient?: string; days?: number; nurse: string; note?: string };

const bedSeeds: BedSeed[] = [
  { label: 'MW-01', ward: 'Medical ward', status: 'occupied', patient: 'Tunde Balogun', days: -3, nurse: 'Nurse Ruth Okoro' },
  { label: 'MW-02', ward: 'Medical ward', status: 'occupied', patient: 'Emeka Obi', days: -1, nurse: 'Nurse Ruth Okoro' },
  { label: 'MW-03', ward: 'Medical ward', status: 'occupied', patient: 'Musa Garba', days: -5, nurse: 'Nurse Blessing Ibe' },
  { label: 'MW-04', ward: 'Medical ward', status: 'occupied', patient: 'Bisi Lawal', days: -2, nurse: 'Nurse Ruth Okoro' },
  { label: 'MW-05', ward: 'Medical ward', status: 'occupied', patient: 'Funmi Adeyemi', days: -1, nurse: 'Nurse Blessing Ibe', note: 'Migraine protocol' },
  { label: 'MW-06', ward: 'Medical ward', status: 'available', nurse: 'Nurse Blessing Ibe' },
  { label: 'MW-07', ward: 'Medical ward', status: 'available', nurse: 'Nurse Blessing Ibe' },
  { label: 'MW-08', ward: 'Medical ward', status: 'cleaning', nurse: 'Housekeeping', note: 'Terminal clean in progress' },
  { label: 'MAT-01', ward: 'Maternity', status: 'occupied', patient: 'Aisha Bello', days: -1, nurse: 'Nurse Ruth Okoro' },
  { label: 'MAT-02', ward: 'Maternity', status: 'occupied', patient: 'Halima Sani', days: -2, nurse: 'Nurse Ruth Okoro' },
  { label: 'MAT-03', ward: 'Maternity', status: 'occupied', patient: 'Rita Ekong', days: -1, nurse: 'Nurse Blessing Ibe' },
  { label: 'MAT-04', ward: 'Maternity', status: 'occupied', patient: 'Joy Ebere', days: 0, nurse: 'Nurse Blessing Ibe', note: 'Observation · 38 weeks' },
  { label: 'MAT-05', ward: 'Maternity', status: 'available', nurse: 'Nurse Ruth Okoro' },
  { label: 'MAT-06', ward: 'Maternity', status: 'reserved', nurse: 'Nurse Blessing Ibe', note: 'Elective section · tomorrow 08:00' },
  { label: 'PAED-01', ward: 'Paediatrics', status: 'occupied', patient: 'Chiamaka Eze', days: -1, nurse: 'Nurse Ruth Okoro' },
  { label: 'PAED-02', ward: 'Paediatrics', status: 'occupied', patient: 'Yusuf Danladi', days: 0, nurse: 'Nurse Blessing Ibe' },
  { label: 'PAED-03', ward: 'Paediatrics', status: 'occupied', patient: 'Ada Obi', days: -1, nurse: 'Nurse Ruth Okoro' },
  { label: 'PAED-04', ward: 'Paediatrics', status: 'available', nurse: 'Nurse Blessing Ibe' },
  { label: 'PAED-05', ward: 'Paediatrics', status: 'available', nurse: 'Nurse Ruth Okoro' },
  { label: 'PAED-06', ward: 'Paediatrics', status: 'cleaning', nurse: 'Housekeeping' },
  { label: 'ICU-01', ward: 'ICU', status: 'occupied', patient: 'David Okon', days: 0, nurse: 'Nurse Blessing Ibe', note: 'Hourly BP monitoring' },
  { label: 'ICU-02', ward: 'ICU', status: 'occupied', patient: 'Femi Oladipo', days: -1, nurse: 'Nurse Ruth Okoro', note: 'Cardiac telemetry' },
  { label: 'ICU-03', ward: 'ICU', status: 'available', nurse: 'Nurse Blessing Ibe' },
  { label: 'ICU-04', ward: 'ICU', status: 'available', nurse: 'Nurse Ruth Okoro' },
];

export const beds: Bed[] = [];

export const wards = Array.from(new Set(beds.map((b) => b.ward)));

export const bedOccupancy = {
  total: beds.length,
  occupied: beds.filter((b) => b.status === 'occupied').length,
  available: beds.filter((b) => b.status === 'available').length,
  cleaning: beds.filter((b) => b.status === 'cleaning').length,
  reserved: beds.filter((b) => b.status === 'reserved').length,
};

/* ── Supplies ─────────────────────────────────────────────────────── */

export const supplies: SupplyItem[] = [];

export const supplyStats = {
  items: supplies.length,
  low: supplies.filter((s) => s.status === 'low_stock').length,
  out: supplies.filter((s) => s.status === 'out_of_stock').length,
  value: supplies.reduce((a, s) => a + s.stock * s.unit_cost, 0),
};

/* ── Billing ──────────────────────────────────────────────────────── */

export const invoices: Invoice[] = [];

export const billingSummary = {
  billedMTD: 0,
  collectedMTD: 0,
  outstanding: 0,
  overdue: 0,
  invoices: invoices.length,
  target: 0,
};

/* ── Payments ─────────────────────────────────────────────────────── */

export const payments: HealthPayment[] = [];

export const paymentSummary = {
  collectedToday: 0,
  pending: 0,
  refunds: 0,
  settled: payments.filter((p) => p.status === 'settled').length,
};

/* ── Revenue ──────────────────────────────────────────────────────── */

const revenueSeed: any[] = [];

export const revenueSeries: any[] = [];

export const revenueSummary = {
  today: 900_000,
  monthToDate: 0,
  lastMonth: 13_240_000,
  outstanding: 0,
  target: 0,
};

export const payerMix = [];

export const departmentMix = [];

/* ── Activity ─────────────────────────────────────────────────────── */

export const activity: ClinicalActivity[] = [];

/* ── Reports ──────────────────────────────────────────────────────── */

export const reports = [];

/* ── Notifications ────────────────────────────────────────────────── */

export const notifications = [];

/* ── Live hydration ───────────────────────────────────────────────── */

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

function ageFromDob(dob: string | undefined | null): number {
  if (!dob) return 0;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 86_400_000)));
}

function recalcHealthcareSummaries() {
  replaceArray(todaysAppointments, appointments.filter((a) => a.date === TODAY));
  replaceArray(upcomingAppointments, appointments.filter((a) => a.date > TODAY));

  Object.assign(appointmentStats, {
    today: todaysAppointments.length,
    waiting: todaysAppointments.filter((a) => a.status === 'waiting' || a.status === 'checked_in').length,
    inConsultation: todaysAppointments.filter((a) => a.status === 'in_consultation').length,
    completed: todaysAppointments.filter((a) => a.status === 'completed').length,
    cancelled: todaysAppointments.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length,
    upcoming: upcomingAppointments.length,
  });

  Object.assign(visitStats, {
    queue: visits.filter((v) => v.status === 'waiting').length,
    inConsultation: visits.filter((v) => v.status === 'in_consultation').length,
    completed: visits.filter((v) => v.status === 'completed').length,
    avgWait: 18,
  });

  replaceArray(wards, Array.from(new Set(beds.map((b) => b.ward))));
  Object.assign(bedOccupancy, {
    total: beds.length,
    occupied: beds.filter((b) => b.status === 'occupied').length,
    available: beds.filter((b) => b.status === 'available').length,
    cleaning: beds.filter((b) => b.status === 'cleaning').length,
    reserved: beds.filter((b) => b.status === 'reserved').length,
  });

  Object.assign(supplyStats, {
    items: supplies.length,
    low: supplies.filter((s) => s.status === 'low_stock').length,
    out: supplies.filter((s) => s.status === 'out_of_stock').length,
    value: supplies.reduce((a, s) => a + s.stock * s.unit_cost, 0),
  });

  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  Object.assign(billingSummary, {
    billedMTD: billed,
    collectedMTD: collected,
    outstanding: invoices.reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
    overdue: invoices
      .filter((i) => i.status === 'overdue')
      .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
    invoices: invoices.length,
    target: Math.max(20_000_000, Math.round(billed * 1.2)),
  });

  Object.assign(paymentSummary, {
    collectedToday: payments
      .filter((p) => p.status === 'settled' && p.date === TODAY)
      .reduce((s, p) => s + p.amount, 0),
    pending: payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    refunds: payments.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0),
    settled: payments.filter((p) => p.status === 'settled').length,
  });

  const byDay = new Map<string, { billed: number; count: number }>();
  for (const invoice of invoices) {
    const key = invoice.date || TODAY;
    const row = byDay.get(key) || { billed: 0, count: 0 };
    row.billed += invoice.amount;
    row.count += 1;
    byDay.set(key, row);
  }
  const days = Array.from(byDay.keys()).sort().slice(-14);
  replaceArray(
    revenueSeries,
    days.length > 1
      ? days.map((date) => {
          const row = byDay.get(date) as { billed: number; count: number };
          return {
            date,
            consultations: row.billed,
            procedures: 0,
            laboratory: 0,
            pharmacy: 0,
            patients: row.count,
          };
        })
      : revenueSeries,
  );

  const payerCounts = new Map<string, number>();
  for (const invoice of invoices) payerCounts.set(invoice.payer, (payerCounts.get(invoice.payer) || 0) + 1);
  const payerTotal = Math.max(1, invoices.length);
  replaceArray(
    payerMix,
    Array.from(payerCounts.entries()).map(([name, count], i) => ({
      name,
      value: Math.round((count / payerTotal) * 100),
      color: `var(--sol-chart-${(i % 4) + 1})`,
    })),
  );

  const deptCounts = new Map<string, number>();
  for (const appt of appointments) {
    if (!appt.department) continue;
    deptCounts.set(appt.department, (deptCounts.get(appt.department) || 0) + 1);
  }
  replaceArray(
    departmentMix,
    Array.from(deptCounts.entries()).map(([name, value]) => ({ name, value })),
  );
}

export function hydrateHealthcare(payload: any): boolean {
  if (!payload) return false;

  const livePatients: Patient[] = asArray(payload.patients).map((r: any) => ({
    id: String(r.id),
    mrn: String(r.patient_code || r.mrn || `MRC-${String(r.id).slice(0, 4)}`),
    full_name: String(r.full_name || r.name || 'Patient'),
    phone: String(r.phone || ''),
    email: String(r.email || ''),
    date_of_birth: String(r.date_of_birth || ''),
    age: ageFromDob(r.date_of_birth),
    sex: String(r.sex || '').toLowerCase() === 'male' ? 'Male' : 'Female',
    blood_group: String(r.blood_group || ''),
    conditions: asArray(r.conditions).map(String),
    allergies: asArray(r.allergies).map(String),
    status: (['active', 'new', 'chronic', 'inactive'].includes(String(r.status))
      ? r.status
      : 'active') as Patient['status'],
    visits: 0,
    last_visit: String(r.updated_at || r.created_at || TODAY).slice(0, 10),
    balance: 0,
    notes: r.notes ? String(r.notes) : undefined,
  }));

  const liveAppointments: Appointment[] = asArray(payload.appointments).map((r: any) => {
    const when = r.scheduled_at ? new Date(r.scheduled_at) : new Date();
    const valid = !Number.isNaN(when.getTime());
    return {
      id: String(r.id),
      patient_id: String(r.patient_id || ''),
      patient_name: String(r.patient_name || 'Patient'),
      clinician: String(r.clinician_name || 'Unassigned'),
      department: String(r.department || 'General medicine'),
      date: valid ? when.toISOString().slice(0, 10) : TODAY,
      time: valid ? when.toTimeString().slice(0, 5) : '09:00',
      duration: Number(r.duration_minutes || 20),
      reason: String(r.reason || 'Consultation'),
      status: (['scheduled', 'checked_in', 'waiting', 'in_consultation', 'completed', 'cancelled', 'no_show'].includes(
        String(r.status),
      )
        ? r.status
        : 'scheduled') as Appointment['status'],
      mode: String(r.mode) === 'teleconsult' ? 'teleconsult' : 'in_person',
      room: r.room ? String(r.room) : undefined,
    };
  });

  const liveVisits: Visit[] = asArray(payload.visits).map((r: any) => ({
    id: String(r.id),
    patient_id: String(r.patient_id || ''),
    patient_name: String(r.patient_name || 'Patient'),
    clinician: String(r.clinician_name || 'Unassigned'),
    department: String(r.department || 'General medicine'),
    type: (['consultation', 'follow_up', 'procedure', 'lab'].includes(String(r.visit_type))
      ? r.visit_type
      : 'consultation') as Visit['type'],
    status:
      String(r.status) === 'completed'
        ? 'completed'
        : String(r.status) === 'in_progress' || String(r.status) === 'open'
          ? 'in_consultation'
          : 'waiting',
    checked_in_at: String(r.created_at || new Date().toISOString()),
    room: String(r.room || ''),
    reason: String(r.chief_complaint || ''),
    vitals: {
      blood_pressure: String(r.vitals?.blood_pressure || ''),
      temperature: Number(r.vitals?.temperature || 0),
      pulse: Number(r.vitals?.pulse || 0),
      weight: Number(r.vitals?.weight || 0),
      oxygen: Number(r.vitals?.oxygen || 0),
    },
    diagnosis: r.diagnosis ? String(r.diagnosis) : undefined,
    note: r.notes ? String(r.notes) : undefined,
  }));

  const liveClinicians: Clinician[] = asArray(payload.staff).map((r: any) => ({
    id: String(r.id),
    full_name: String(r.full_name || 'Clinician'),
    email: String(r.email || ''),
    phone: String(r.phone || ''),
    role: String(r.role || 'Clinician'),
    department: String(r.department || 'General medicine'),
    shift: (['Morning', 'Afternoon', 'Night', 'Off duty'].includes(String(r.shift))
      ? r.shift
      : 'Morning') as Clinician['shift'],
    status:
      String(r.status) === 'on_leave'
        ? 'on_leave'
        : String(r.status) === 'inactive'
          ? 'off_duty'
          : 'on_duty',
    appointments_today: liveAppointments.filter(
      (a) => a.date === TODAY && a.clinician === String(r.full_name),
    ).length,
    license: String(r.license_number || ''),
  }));

  const liveInvoices: Invoice[] = asArray(payload.billing).map((r: any) => {
    const amount = Number(r.amount || 0);
    const paid = Number(r.paid_amount || 0);
    const raw = String(r.status || '');
    const status: Invoice['status'] =
      raw === 'paid' || (amount > 0 && paid >= amount)
        ? 'paid'
        : paid > 0
          ? 'partially_paid'
          : raw === 'overdue'
            ? 'overdue'
            : 'pending';
    return {
      id: String(r.id),
      number: String(r.invoice_number || `INV-${String(r.id).slice(0, 4)}`),
      patient_id: String(r.patient_id || ''),
      patient_name: String(r.patient_name || 'Patient'),
      services: asArray(r.meta?.services).length
        ? asArray(r.meta.services)
        : [{ name: String(r.description || 'Care services'), amount }],
      amount,
      paid,
      status,
      date: String(r.created_at || TODAY).slice(0, 10),
      due_date: String(r.due_date || TODAY).slice(0, 10),
      payer: (['Self-pay', 'HMO', 'Corporate', 'Insurance'].includes(String(r.payer))
        ? r.payer
        : 'Self-pay') as Invoice['payer'],
    };
  });

  const livePayments: HealthPayment[] = asArray(payload.payments).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      reference: String(meta.reference || r.reference || `MER-${String(r.id).slice(0, 4)}`),
      patient_name: String(meta.patient_name || r.title || 'Patient'),
      invoice_number: String(meta.invoice_number || ''),
      amount: Number(r.amount || 0),
      method: (['card', 'transfer', 'cash', 'pos', 'insurance'].includes(String(meta.method))
        ? meta.method
        : 'cash') as HealthPayment['method'],
      status: (String(r.status) === 'pending'
        ? 'pending'
        : String(r.status) === 'refunded' || String(r.status) === 'reversed'
          ? 'refunded'
          : 'settled') as HealthPayment['status'],
      date: String(r.occurred_at || r.created_at || TODAY).slice(0, 10),
    };
  });

  const liveBeds: Bed[] = asArray(payload.beds).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      label: String(meta.label || r.title || 'Bed'),
      ward: String(meta.ward || 'Medical ward'),
      status: (['occupied', 'available', 'cleaning', 'reserved'].includes(String(r.status))
        ? r.status
        : 'available') as Bed['status'],
      patient_name: meta.patient_name ? String(meta.patient_name) : undefined,
      admitted_at: meta.admitted_at ? String(meta.admitted_at) : undefined,
      nurse: String(meta.nurse || 'Unassigned'),
      note: meta.note ? String(meta.note) : undefined,
    };
  });

  const liveSupplies: SupplyItem[] = asArray(payload.supplies).map((r: any) => {
    const meta = r.meta || {};
    const stock = Number(meta.stock ?? 0);
    const reorder = Number(meta.reorder_level ?? 0);
    return {
      id: String(r.id),
      name: String(r.title || meta.name || 'Supply'),
      category: String(meta.category || 'Consumables'),
      unit: String(meta.unit || 'unit'),
      stock,
      reorder_level: reorder,
      supplier: String(meta.supplier || ''),
      last_restock: String(meta.last_restock || r.occurred_at || TODAY).slice(0, 10),
      unit_cost: Number(meta.unit_cost ?? 0),
      status:
        stock <= 0 ? 'out_of_stock' : stock <= reorder ? 'low_stock' : 'in_stock',
    };
  });

  const liveConditionLog: ConditionLogEntry[] = asArray(payload.conditionLog).map((r: any) => {
    const meta = r.meta || {};
    const status = ['active', 'resolved', 'note'].includes(String(r.status))
      ? (String(r.status) as ConditionLogEntry['status'])
      : 'active';
    return {
      id: String(r.id),
      patient_id: String(meta.patient_id || ''),
      patient_name: String(meta.patient_name || ''),
      condition: String(r.title || meta.condition || ''),
      action: (['add', 'resolve', 'note'].includes(String(meta.action))
        ? meta.action
        : status === 'resolved'
          ? 'resolve'
          : status === 'note'
            ? 'note'
            : 'add') as ConditionLogEntry['action'],
      status,
      severity: (['mild', 'moderate', 'severe'].includes(String(meta.severity))
        ? meta.severity
        : undefined) as ConditionLogEntry['severity'],
      note: r.notes ? String(r.notes) : meta.note ? String(meta.note) : undefined,
      recorded_by: meta.recorded_by ? String(meta.recorded_by) : undefined,
      recorded_at: String(r.occurred_at || r.created_at || TODAY),
    };
  });

  for (const log of liveConditionLog) {
    if (log.status !== 'active') continue;
    const patient = livePatients.find(
      (p) => p.id === log.patient_id || p.full_name === log.patient_name,
    );
    const title = log.condition;
    if (patient && title && !patient.conditions.some((c) => c.toLowerCase() === title.toLowerCase())) {
      patient.conditions.push(title);
    }
  }

  // Roll billing + visit activity onto patients
  for (const patient of livePatients) {
    const bill = liveInvoices.filter(
      (i) => i.patient_id === patient.id || i.patient_name === patient.full_name,
    );
    patient.balance = bill.reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0);
    const patientVisits = liveVisits.filter(
      (v) => v.patient_id === patient.id || v.patient_name === patient.full_name,
    );
    patient.visits = patientVisits.length;
    if (patientVisits.length) {
      patient.last_visit = patientVisits
        .map((v) => v.checked_in_at.slice(0, 10))
        .sort()
        .pop() as string;
    }
    if (!patient.status || patient.status === 'active') {
      if (patient.conditions.length >= 2) patient.status = 'chronic';
    }
  }

  const settingsRow =
    payload.settings && typeof payload.settings === 'object' ? payload.settings : null;
  const settingsMeta =
    settingsRow && settingsRow.meta && typeof settingsRow.meta === 'object'
      ? (settingsRow.meta as Record<string, any>)
      : null;


  if (settingsMeta) {
    Object.assign(orgSettings, settingsMeta);
    const s = settingsMeta;
    if (s.name) clinic.name = String(s.name);
    if (s.legal) clinic.legalName = String(s.legal);
    if (s.location) clinic.location = String(s.location);
    if (s.address) clinic.address = String(s.address);
    if (s.phone) clinic.phone = String(s.phone);
    if (s.email) clinic.email = String(s.email);
    if (s.website) clinic.website = String(s.website);
    if (s.opening) clinic.opening = String(s.opening);
    if (s.closing) clinic.closing = String(s.closing);
    if (s.tax != null && s.tax !== '') clinic.taxRate = Number(s.tax);
    if (s.beds != null && s.beds !== '') clinic.totalBeds = Number(s.beds);
    if (s.currency) clinic.currency = String(s.currency);
  }

  replaceArray(patients, livePatients);
  replaceArray(conditionLog, liveConditionLog);
  replaceArray(appointments, liveAppointments);
  replaceArray(visits, liveVisits);
  replaceArray(clinicians, liveClinicians);
  replaceArray(invoices, liveInvoices);
  replaceArray(payments, livePayments);
  replaceArray(beds, liveBeds);
  replaceArray(supplies, liveSupplies);

  recalcHealthcareSummaries();
  return true;
}
