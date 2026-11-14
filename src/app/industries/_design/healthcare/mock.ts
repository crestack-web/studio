import { addDays, todayISO } from '../format';
import type {
  Appointment,
  Bed,
  Clinician,
  ClinicalActivity,
  HealthPayment,
  Invoice,
  Patient,
  SupplyItem,
  Visit,
} from '../types';

const TODAY = todayISO();
const CUR = 'NGN';

export const clinic = {
  name: 'Meridian Health Clinic',
  legalName: 'Meridian Health Services Ltd',
  location: 'Wuse 2, Abuja',
  address: '12 Aminu Kano Crescent, Wuse 2, Abuja',
  phone: '+234 809 552 1180',
  email: 'care@meridian.health',
  website: 'meridian.health',
  currency: CUR,
  opening: '08:00',
  closing: '18:00',
  timezone: 'Africa/Lagos',
  taxRate: 7.5,
  totalBeds: 24,
  ownerName: 'Dr. Ifeoma Nnaji',
  ownerEmail: 'ifeoma@meridian.health',
  rating: 4.9,
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

export const patients: Patient[] = patientSeeds.map((seed, i) => ({
  id: `patient-${200 + i}`,
  mrn: `MRC-${4200 + i}`,
  full_name: seed.name,
  phone: seed.phone,
  email: seed.email,
  date_of_birth: seed.dob,
  age: seed.age,
  sex: seed.sex,
  blood_group: seed.blood,
  conditions: seed.conditions,
  allergies: seed.allergies,
  status: seed.status,
  visits: seed.visits,
  last_visit: addDays(TODAY, seed.last),
  balance: seed.balance ?? 0,
  notes: seed.notes,
}));

const patientByName = new Map(patients.map((p) => [p.full_name, p]));

/* ── Clinicians ───────────────────────────────────────────────────── */

export const clinicians: Clinician[] = [
  { id: 'cl-1', full_name: 'Dr. Ifeoma Nnaji', email: 'ifeoma@meridian.health', phone: '+234 809 552 1180', role: 'Consultant physician', department: 'General medicine', shift: 'Morning', status: 'on_duty', appointments_today: 5, license: 'MDCN 48120' },
  { id: 'cl-2', full_name: 'Dr. Adaeze Nwosu', email: 'adaeze@meridian.health', phone: '+234 803 771 2290', role: 'Paediatrician', department: 'Paediatrics', shift: 'Morning', status: 'on_duty', appointments_today: 3, license: 'MDCN 39277' },
  { id: 'cl-3', full_name: 'Dr. Bashir Lawal', email: 'bashir@meridian.health', phone: '+234 805 118 7745', role: 'Cardiologist', department: 'Cardiology', shift: 'Morning', status: 'on_duty', appointments_today: 4, license: 'MDCN 51004' },
  { id: 'cl-4', full_name: 'Dr. Chidinma Obiora', email: 'chidinma@meridian.health', phone: '+234 810 660 8821', role: 'Obstetrician', department: 'Obstetrics', shift: 'Morning', status: 'on_duty', appointments_today: 3, license: 'MDCN 44818' },
  { id: 'cl-5', full_name: 'Dr. Kunle Adebayo', email: 'kunle@meridian.health', phone: '+234 802 994 1103', role: 'Dermatologist', department: 'Dermatology', shift: 'Afternoon', status: 'on_duty', appointments_today: 2, license: 'MDCN 47660' },
  { id: 'cl-6', full_name: 'Dr. Maryam Isa', email: 'maryam@meridian.health', phone: '+234 807 220 5561', role: 'General practitioner', department: 'General medicine', shift: 'Afternoon', status: 'on_duty', appointments_today: 4, license: 'MDCN 52991' },
  { id: 'cl-7', full_name: 'Nurse Blessing Ibe', email: 'blessing@meridian.health', phone: '+234 809 221 5540', role: 'Head nurse', department: 'Nursing', shift: 'Morning', status: 'on_duty', appointments_today: 0, license: 'NMCN 22104' },
  { id: 'cl-8', full_name: 'Nurse Ruth Okoro', email: 'ruth@meridian.health', phone: '+234 810 998 3321', role: 'Staff nurse', department: 'Nursing', shift: 'Morning', status: 'on_duty', appointments_today: 0, license: 'NMCN 30881' },
  { id: 'cl-9', full_name: 'Tolu Bakare', email: 'tolu@meridian.health', phone: '+234 813 776 2204', role: 'Laboratory scientist', department: 'Laboratory', shift: 'Morning', status: 'on_duty', appointments_today: 0, license: 'MLSCN 11802' },
  { id: 'cl-10', full_name: 'Esther Nwosu', email: 'esther@meridian.health', phone: '+234 811 220 3377', role: 'Pharmacist', department: 'Pharmacy', shift: 'Afternoon', status: 'on_duty', appointments_today: 0, license: 'PCN 70231' },
  { id: 'cl-11', full_name: 'Daniel Eze', email: 'daniel@meridian.health', phone: '+234 803 114 2299', role: 'Front desk lead', department: 'Front desk', shift: 'Morning', status: 'on_duty', appointments_today: 0, license: '—' },
  { id: 'cl-12', full_name: 'Dr. Suleiman Bako', email: 'suleiman@meridian.health', phone: '+234 805 441 9082', role: 'Radiologist', department: 'Radiology', shift: 'Off duty', status: 'off_duty', appointments_today: 0, license: 'MDCN 36110' },
  { id: 'cl-13', full_name: 'Nurse Halima Bello', email: 'halima.b@meridian.health', phone: '+234 802 663 4480', role: 'Staff nurse', department: 'Nursing', shift: 'Night', status: 'on_leave', appointments_today: 0, license: 'NMCN 41230' },
];

/* ── Appointments ─────────────────────────────────────────────────── */

type AppointmentSeed = {
  patient: string;
  clinician: string;
  department: string;
  day: number;
  time: string;
  reason: string;
  status: Appointment['status'];
  mode?: Appointment['mode'];
  room?: string;
};

const appointmentSeeds: AppointmentSeed[] = [
  { patient: 'Ngozi Okafor', clinician: 'Dr. Ifeoma Nnaji', department: 'General medicine', day: 0, time: '08:00', reason: 'Blood pressure review', status: 'completed', room: 'Consult 1' },
  { patient: 'Chiamaka Eze', clinician: 'Dr. Adaeze Nwosu', department: 'Paediatrics', day: 0, time: '08:30', reason: 'Asthma follow-up', status: 'completed', room: 'Consult 4' },
  { patient: 'Emeka Obi', clinician: 'Dr. Ifeoma Nnaji', department: 'General medicine', day: 0, time: '09:00', reason: 'Diabetes review', status: 'completed', room: 'Consult 1' },
  { patient: 'Tunde Balogun', clinician: 'Dr. Ifeoma Nnaji', department: 'General medicine', day: 0, time: '09:30', reason: 'Wound review', status: 'completed', room: 'Consult 1' },
  { patient: 'Aisha Bello', clinician: 'Dr. Chidinma Obiora', department: 'Obstetrics', day: 0, time: '10:00', reason: 'Antenatal · 24 weeks', status: 'in_consultation', room: 'Consult 3' },
  { patient: 'Ibrahim Musa', clinician: 'Dr. Bashir Lawal', department: 'Cardiology', day: 0, time: '10:30', reason: 'Palpitations and ECG', status: 'in_consultation', room: 'Consult 5' },
  { patient: 'Grace Mensah', clinician: 'Dr. Kunle Adebayo', department: 'Dermatology', day: 0, time: '10:45', reason: 'Eczema flare', status: 'waiting', room: 'Consult 2' },
  { patient: 'Samuel Nnamdi', clinician: 'Dr. Maryam Isa', department: 'General medicine', day: 0, time: '11:00', reason: 'Fever and chills', status: 'waiting', room: 'Consult 6' },
  { patient: 'Yusuf Danladi', clinician: 'Dr. Adaeze Nwosu', department: 'Paediatrics', day: 0, time: '11:30', reason: 'Sore throat', status: 'checked_in', room: 'Consult 4' },
  { patient: 'Kemi Alabi', clinician: 'Dr. Bashir Lawal', department: 'Cardiology', day: 0, time: '12:00', reason: 'BP and lipid review', status: 'scheduled', room: 'Consult 5' },
  { patient: 'Funmi Adeyemi', clinician: 'Dr. Maryam Isa', department: 'General medicine', day: 0, time: '13:30', reason: 'Recurring migraine', status: 'scheduled', room: 'Consult 6' },
  { patient: 'Halima Sani', clinician: 'Dr. Chidinma Obiora', department: 'Obstetrics', day: 0, time: '14:00', reason: 'Antenatal · 32 weeks', status: 'scheduled', room: 'Consult 3' },
  { patient: 'David Okon', clinician: 'Dr. Bashir Lawal', department: 'Cardiology', day: 0, time: '15:00', reason: 'Hypertension review', status: 'scheduled', mode: 'teleconsult' },
  { patient: 'Chuka Mba', clinician: 'Dr. Maryam Isa', department: 'General medicine', day: 0, time: '16:00', reason: 'Gastritis follow-up', status: 'cancelled', room: 'Consult 6' },
  { patient: 'Zainab Ahmed', clinician: 'Dr. Ifeoma Nnaji', department: 'General medicine', day: 1, time: '09:00', reason: 'Routine check-up', status: 'scheduled', room: 'Consult 1' },
  { patient: 'Musa Garba', clinician: 'Dr. Maryam Isa', department: 'General medicine', day: 1, time: '10:30', reason: 'Arthritis review', status: 'scheduled', room: 'Consult 6' },
  { patient: 'Rita Ekong', clinician: 'Dr. Chidinma Obiora', department: 'Obstetrics', day: 1, time: '12:00', reason: 'Antenatal · 18 weeks', status: 'scheduled', room: 'Consult 3' },
  { patient: 'Peter Okoye', clinician: 'Dr. Maryam Isa', department: 'General medicine', day: 2, time: '09:30', reason: 'Physiotherapy review', status: 'scheduled', mode: 'teleconsult' },
  { patient: 'Femi Oladipo', clinician: 'Dr. Bashir Lawal', department: 'Cardiology', day: 2, time: '11:00', reason: 'Hypertension review', status: 'scheduled', room: 'Consult 5' },
];

export const appointments: Appointment[] = appointmentSeeds.map((seed, i) => {
  const patient = patientByName.get(seed.patient);
  return {
    id: `ap-${300 + i}`,
    patient_id: patient?.id || `patient-${200 + i}`,
    patient_name: seed.patient,
    clinician: seed.clinician,
    department: seed.department,
    date: addDays(TODAY, seed.day),
    time: seed.time,
    duration: 20,
    reason: seed.reason,
    status: seed.status,
    mode: seed.mode || 'in_person',
    room: seed.room,
  };
});

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

export const visits: Visit[] = [
  {
    id: 'vs-1', patient_id: 'patient-202', patient_name: 'Aisha Bello', clinician: 'Dr. Chidinma Obiora',
    department: 'Obstetrics', type: 'consultation', status: 'in_consultation', checked_in_at: `${TODAY}T09:42:00`,
    room: 'Consult 3', reason: 'Antenatal · 24 weeks',
    vitals: { blood_pressure: '112/72', temperature: 36.7, pulse: 82, weight: 68.4, oxygen: 99 },
    diagnosis: 'Normal antenatal progress', note: 'Fundal height consistent with dates. Next scan at 28 weeks.',
  },
  {
    id: 'vs-2', patient_id: 'patient-205', patient_name: 'Ibrahim Musa', clinician: 'Dr. Bashir Lawal',
    department: 'Cardiology', type: 'consultation', status: 'in_consultation', checked_in_at: `${TODAY}T10:02:00`,
    room: 'Consult 5', reason: 'Palpitations and ECG',
    vitals: { blood_pressure: '148/92', temperature: 36.5, pulse: 104, weight: 79.1, oxygen: 97 },
    note: 'Irregular rhythm on examination. ECG running now.',
  },
  {
    id: 'vs-3', patient_id: 'patient-210', patient_name: 'Grace Mensah', clinician: 'Dr. Kunle Adebayo',
    department: 'Dermatology', type: 'consultation', status: 'waiting', checked_in_at: `${TODAY}T10:11:00`,
    room: 'Consult 2', reason: 'Eczema flare',
    vitals: { blood_pressure: '118/76', temperature: 36.6, pulse: 74, weight: 61.2, oxygen: 99 },
  },
  {
    id: 'vs-4', patient_id: 'patient-207', patient_name: 'Samuel Nnamdi', clinician: 'Dr. Maryam Isa',
    department: 'General medicine', type: 'consultation', status: 'waiting', checked_in_at: `${TODAY}T10:24:00`,
    room: 'Consult 6', reason: 'Fever and chills',
    vitals: { blood_pressure: '106/68', temperature: 38.9, pulse: 96, weight: 72.5, oxygen: 98 },
    note: 'Malaria RDT positive. Awaiting clinician review.',
  },
  {
    id: 'vs-5', patient_id: 'patient-200', patient_name: 'Ngozi Okafor', clinician: 'Dr. Ifeoma Nnaji',
    department: 'General medicine', type: 'follow_up', status: 'completed', checked_in_at: `${TODAY}T08:02:00`,
    room: 'Consult 1', reason: 'Blood pressure review',
    vitals: { blood_pressure: '128/82', temperature: 36.4, pulse: 78, weight: 70.2, oxygen: 99 },
    diagnosis: 'Hypertension — controlled', note: 'Continue amlodipine 5mg. Review in 8 weeks.',
  },
  {
    id: 'vs-6', patient_id: 'patient-204', patient_name: 'Chiamaka Eze', clinician: 'Dr. Adaeze Nwosu',
    department: 'Paediatrics', type: 'follow_up', status: 'completed', checked_in_at: `${TODAY}T08:34:00`,
    room: 'Consult 4', reason: 'Asthma follow-up',
    vitals: { blood_pressure: '96/62', temperature: 36.8, pulse: 92, weight: 26.4, oxygen: 98 },
    diagnosis: 'Mild persistent asthma', note: 'Continue inhaler with spacer. Mother to track night cough.',
  },
  {
    id: 'vs-7', patient_id: 'patient-201', patient_name: 'Emeka Obi', clinician: 'Dr. Ifeoma Nnaji',
    department: 'General medicine', type: 'follow_up', status: 'completed', checked_in_at: `${TODAY}T09:05:00`,
    room: 'Consult 1', reason: 'Diabetes review',
    vitals: { blood_pressure: '132/84', temperature: 36.5, pulse: 76, weight: 84.6, oxygen: 98 },
    diagnosis: 'Type 2 diabetes — improving', note: 'HbA1c 7.1%. Continue metformin; repeat in 3 months.',
  },
  {
    id: 'vs-8', patient_id: 'patient-203', patient_name: 'Tunde Balogun', clinician: 'Dr. Ifeoma Nnaji',
    department: 'General medicine', type: 'procedure', status: 'completed', checked_in_at: `${TODAY}T09:36:00`,
    room: 'Treatment room', reason: 'Wound review',
    vitals: { blood_pressure: '124/80', temperature: 36.6, pulse: 72, weight: 77.8, oxygen: 99 },
    diagnosis: 'Post-op wound healing well', note: 'Dressing changed. No signs of infection.',
  },
];

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

export const beds: Bed[] = bedSeeds.map((seed, i) => ({
  id: `bed-${i + 1}`,
  label: seed.label,
  ward: seed.ward,
  status: seed.status,
  patient_name: seed.patient,
  admitted_at: seed.days != null ? addDays(TODAY, seed.days) : undefined,
  nurse: seed.nurse,
  note: seed.note,
}));

export const wards = Array.from(new Set(beds.map((b) => b.ward)));

export const bedOccupancy = {
  total: beds.length,
  occupied: beds.filter((b) => b.status === 'occupied').length,
  available: beds.filter((b) => b.status === 'available').length,
  cleaning: beds.filter((b) => b.status === 'cleaning').length,
  reserved: beds.filter((b) => b.status === 'reserved').length,
};

/* ── Supplies ─────────────────────────────────────────────────────── */

export const supplies: SupplyItem[] = [
  { id: 'sp-1', name: 'Paracetamol 500mg', category: 'Pharmacy', unit: 'pack of 100', stock: 42, reorder_level: 20, supplier: 'Emzor Pharma', last_restock: addDays(TODAY, -6), unit_cost: 3200, status: 'in_stock' },
  { id: 'sp-2', name: 'Amoxicillin 250mg', category: 'Pharmacy', unit: 'pack of 100', stock: 8, reorder_level: 15, supplier: 'GSK Nigeria', last_restock: addDays(TODAY, -12), unit_cost: 5400, status: 'low_stock' },
  { id: 'sp-3', name: 'IV normal saline', category: 'Fluids', unit: '1L bag', stock: 96, reorder_level: 40, supplier: 'Dana Pharmaceuticals', last_restock: addDays(TODAY, -3), unit_cost: 1800, status: 'in_stock' },
  { id: 'sp-4', name: 'Surgical gloves (M)', category: 'Consumables', unit: 'box of 100', stock: 6, reorder_level: 12, supplier: 'MedSupply NG', last_restock: addDays(TODAY, -9), unit_cost: 7800, status: 'low_stock' },
  { id: 'sp-5', name: 'Syringes 5ml', category: 'Consumables', unit: 'box of 100', stock: 0, reorder_level: 10, supplier: 'MedSupply NG', last_restock: addDays(TODAY, -18), unit_cost: 4200, status: 'out_of_stock' },
  { id: 'sp-6', name: 'Face masks', category: 'Consumables', unit: 'box of 50', stock: 18, reorder_level: 15, supplier: 'MedSupply NG', last_restock: addDays(TODAY, -5), unit_cost: 3500, status: 'in_stock' },
  { id: 'sp-7', name: 'Blood collection tubes', category: 'Laboratory', unit: 'pack of 100', stock: 24, reorder_level: 20, supplier: 'LabEquip Ltd', last_restock: addDays(TODAY, -7), unit_cost: 6200, status: 'in_stock' },
  { id: 'sp-8', name: 'Malaria test kits', category: 'Laboratory', unit: 'kit of 25', stock: 0, reorder_level: 25, supplier: 'LabEquip Ltd', last_restock: addDays(TODAY, -21), unit_cost: 11500, status: 'out_of_stock' },
  { id: 'sp-9', name: 'Hand sanitizer', category: 'Consumables', unit: '500ml bottle', stock: 34, reorder_level: 12, supplier: 'CleanCare', last_restock: addDays(TODAY, -4), unit_cost: 2400, status: 'in_stock' },
  { id: 'sp-10', name: 'Gauze rolls', category: 'Consumables', unit: 'pack of 12', stock: 11, reorder_level: 10, supplier: 'MedSupply NG', last_restock: addDays(TODAY, -8), unit_cost: 2900, status: 'in_stock' },
  { id: 'sp-11', name: 'Insulin 100IU', category: 'Pharmacy', unit: 'vial', stock: 7, reorder_level: 20, supplier: 'Sanofi Nigeria', last_restock: addDays(TODAY, -14), unit_cost: 8900, status: 'low_stock' },
  { id: 'sp-12', name: 'Oxygen cylinders', category: 'Equipment', unit: 'cylinder', stock: 4, reorder_level: 3, supplier: 'AirCare Medical', last_restock: addDays(TODAY, -2), unit_cost: 42000, status: 'in_stock' },
];

export const supplyStats = {
  items: supplies.length,
  low: supplies.filter((s) => s.status === 'low_stock').length,
  out: supplies.filter((s) => s.status === 'out_of_stock').length,
  value: supplies.reduce((a, s) => a + s.stock * s.unit_cost, 0),
};

/* ── Billing ──────────────────────────────────────────────────────── */

export const invoices: Invoice[] = [
  { id: 'in-1', number: 'INV-2041', patient_id: 'patient-200', patient_name: 'Ngozi Okafor', services: [{ name: 'Consultation', amount: 22000 }, { name: 'Full blood count', amount: 23000 }], amount: 45000, paid: 45000, status: 'paid', date: addDays(TODAY, -3), due_date: addDays(TODAY, 4), payer: 'HMO' },
  { id: 'in-2', number: 'INV-2042', patient_id: 'patient-201', patient_name: 'Emeka Obi', services: [{ name: 'Consultation', amount: 22000 }, { name: 'HbA1c', amount: 16000 }], amount: 38000, paid: 38000, status: 'paid', date: addDays(TODAY, -6), due_date: addDays(TODAY, 1), payer: 'Self-pay' },
  { id: 'in-3', number: 'INV-2043', patient_id: 'patient-202', patient_name: 'Aisha Bello', services: [{ name: 'Antenatal package', amount: 120000 }], amount: 120000, paid: 60000, status: 'partially_paid', date: addDays(TODAY, -8), due_date: addDays(TODAY, 12), payer: 'HMO' },
  { id: 'in-4', number: 'INV-2044', patient_id: 'patient-203', patient_name: 'Tunde Balogun', services: [{ name: 'Wound dressing x3', amount: 24000 }, { name: 'Consultation', amount: 30000 }], amount: 54000, paid: 54000, status: 'paid', date: addDays(TODAY, -8), due_date: addDays(TODAY, -1), payer: 'Corporate' },
  { id: 'in-5', number: 'INV-2045', patient_id: 'patient-204', patient_name: 'Chiamaka Eze', services: [{ name: 'Paediatric consultation', amount: 18000 }, { name: 'Nebulisation', amount: 14000 }], amount: 32000, paid: 32000, status: 'paid', date: TODAY, due_date: addDays(TODAY, 7), payer: 'Self-pay' },
  { id: 'in-6', number: 'INV-2046', patient_id: 'patient-205', patient_name: 'Ibrahim Musa', services: [{ name: 'Cardiology consultation', amount: 35000 }, { name: 'ECG', amount: 33000 }], amount: 68000, paid: 0, status: 'pending', date: TODAY, due_date: addDays(TODAY, 7), payer: 'Insurance' },
  { id: 'in-7', number: 'INV-2047', patient_id: 'patient-206', patient_name: 'Funmi Adeyemi', services: [{ name: 'Consultation', amount: 22000 }], amount: 22000, paid: 22000, status: 'paid', date: TODAY, due_date: addDays(TODAY, 7), payer: 'Self-pay' },
  { id: 'in-8', number: 'INV-2048', patient_id: 'patient-207', patient_name: 'Samuel Nnamdi', services: [{ name: 'Malaria RDT', amount: 8500 }, { name: 'Artemether course', amount: 18000 }], amount: 26500, paid: 0, status: 'overdue', date: addDays(TODAY, -12), due_date: addDays(TODAY, -2), payer: 'Self-pay' },
  { id: 'in-9', number: 'INV-2049', patient_id: 'patient-208', patient_name: 'Halima Sani', services: [{ name: 'Antenatal package', amount: 120000 }], amount: 120000, paid: 40000, status: 'partially_paid', date: addDays(TODAY, -4), due_date: addDays(TODAY, 16), payer: 'HMO' },
  { id: 'in-10', number: 'INV-2050', patient_id: 'patient-209', patient_name: 'David Okon', services: [{ name: 'Cardiology review', amount: 35000 }, { name: 'Lipid profile', amount: 20000 }], amount: 55000, paid: 0, status: 'overdue', date: addDays(TODAY, -14), due_date: addDays(TODAY, -5), payer: 'Corporate' },
  { id: 'in-11', number: 'INV-2051', patient_id: 'patient-210', patient_name: 'Grace Mensah', services: [{ name: 'Dermatology consultation', amount: 24000 }], amount: 24000, paid: 24000, status: 'paid', date: TODAY, due_date: addDays(TODAY, 7), payer: 'Self-pay' },
  { id: 'in-12', number: 'INV-2052', patient_id: 'patient-211', patient_name: 'Yusuf Danladi', services: [{ name: 'Paediatric consultation', amount: 18000 }], amount: 18000, paid: 18000, status: 'paid', date: addDays(TODAY, -5), due_date: addDays(TODAY, 2), payer: 'Self-pay' },
  { id: 'in-13', number: 'INV-2053', patient_id: 'patient-212', patient_name: 'Kemi Alabi', services: [{ name: 'Lipid profile', amount: 20000 }, { name: 'Fasting glucose', amount: 12000 }, { name: 'Consultation', amount: 10000 }], amount: 42000, paid: 20000, status: 'partially_paid', date: addDays(TODAY, -3), due_date: addDays(TODAY, 4), payer: 'HMO' },
  { id: 'in-14', number: 'INV-2054', patient_id: 'patient-213', patient_name: 'Peter Okoye', services: [{ name: 'Physiotherapy x4', amount: 48000 }], amount: 48000, paid: 0, status: 'pending', date: TODAY, due_date: addDays(TODAY, 10), payer: 'Corporate' },
];

export const billingSummary = {
  billedMTD: 14_860_000,
  collectedMTD: 11_440_000,
  outstanding: 343_500,
  overdue: 81_500,
  invoices: invoices.length,
  target: 20_000_000,
};

/* ── Payments ─────────────────────────────────────────────────────── */

export const payments: HealthPayment[] = [
  { id: 'hp-1', reference: 'MER-7781', patient_name: 'Emeka Obi', invoice_number: 'INV-2042', amount: 38000, method: 'transfer', status: 'settled', date: addDays(TODAY, -1) },
  { id: 'hp-2', reference: 'MER-7782', patient_name: 'Ngozi Okafor', invoice_number: 'INV-2041', amount: 45000, method: 'card', status: 'settled', date: addDays(TODAY, -1) },
  { id: 'hp-3', reference: 'MER-7783', patient_name: 'Chiamaka Eze', invoice_number: 'INV-2045', amount: 32000, method: 'pos', status: 'settled', date: TODAY },
  { id: 'hp-4', reference: 'MER-7784', patient_name: 'Aisha Bello', invoice_number: 'INV-2043', amount: 60000, method: 'insurance', status: 'settled', date: addDays(TODAY, -2) },
  { id: 'hp-5', reference: 'MER-7785', patient_name: 'Halima Sani', invoice_number: 'INV-2049', amount: 40000, method: 'transfer', status: 'settled', date: addDays(TODAY, -3) },
  { id: 'hp-6', reference: 'MER-7786', patient_name: 'Funmi Adeyemi', invoice_number: 'INV-2047', amount: 22000, method: 'cash', status: 'settled', date: TODAY },
  { id: 'hp-7', reference: 'MER-7787', patient_name: 'Kemi Alabi', invoice_number: 'INV-2053', amount: 20000, method: 'card', status: 'settled', date: addDays(TODAY, -2) },
  { id: 'hp-8', reference: 'MER-7788', patient_name: 'Peter Okoye', invoice_number: 'INV-2054', amount: 16000, method: 'transfer', status: 'pending', date: TODAY },
  { id: 'hp-9', reference: 'MER-7789', patient_name: 'Grace Mensah', invoice_number: 'INV-2051', amount: 24000, method: 'card', status: 'settled', date: TODAY },
  { id: 'hp-10', reference: 'MER-7790', patient_name: 'Yusuf Danladi', invoice_number: 'INV-2052', amount: 18000, method: 'pos', status: 'refunded', date: addDays(TODAY, -1) },
];

export const paymentSummary = {
  collectedToday: 418_000,
  pending: 16_000,
  refunds: 18_000,
  settled: payments.filter((p) => p.status === 'settled').length,
};

/* ── Revenue ──────────────────────────────────────────────────────── */

const revenueSeed = [
  { consultations: 268_000, procedures: 142_000, laboratory: 86_000, pharmacy: 118_000, patients: 38 },
  { consultations: 294_000, procedures: 158_000, laboratory: 92_000, pharmacy: 126_000, patients: 41 },
  { consultations: 252_000, procedures: 134_000, laboratory: 78_000, pharmacy: 109_000, patients: 35 },
  { consultations: 312_000, procedures: 176_000, laboratory: 104_000, pharmacy: 138_000, patients: 44 },
  { consultations: 326_000, procedures: 188_000, laboratory: 112_000, pharmacy: 144_000, patients: 46 },
  { consultations: 286_000, procedures: 152_000, laboratory: 88_000, pharmacy: 122_000, patients: 39 },
  { consultations: 344_000, procedures: 202_000, laboratory: 121_000, pharmacy: 152_000, patients: 48 },
  { consultations: 368_000, procedures: 218_000, laboratory: 132_000, pharmacy: 164_000, patients: 51 },
  { consultations: 352_000, procedures: 206_000, laboratory: 126_000, pharmacy: 158_000, patients: 49 },
  { consultations: 318_000, procedures: 172_000, laboratory: 101_000, pharmacy: 136_000, patients: 43 },
  { consultations: 298_000, procedures: 160_000, laboratory: 94_000, pharmacy: 128_000, patients: 40 },
  { consultations: 332_000, procedures: 190_000, laboratory: 114_000, pharmacy: 146_000, patients: 45 },
  { consultations: 356_000, procedures: 212_000, laboratory: 128_000, pharmacy: 160_000, patients: 50 },
  { consultations: 372_000, procedures: 224_000, laboratory: 136_000, pharmacy: 168_000, patients: 52 },
];

export const revenueSeries = revenueSeed.map((row, i) => ({
  date: addDays(TODAY, i - (revenueSeed.length - 1)),
  consultations: row.consultations,
  procedures: row.procedures,
  laboratory: row.laboratory,
  pharmacy: row.pharmacy,
  patients: row.patients,
}));

export const revenueSummary = {
  today: 900_000,
  monthToDate: 14_860_000,
  lastMonth: 13_240_000,
  outstanding: 343_500,
  target: 20_000_000,
};

export const payerMix = [
  { name: 'HMO', value: 42, color: 'var(--sol-chart-1)' },
  { name: 'Self-pay', value: 33, color: 'var(--sol-chart-2)' },
  { name: 'Corporate', value: 15, color: 'var(--sol-chart-3)' },
  { name: 'Insurance', value: 10, color: 'var(--sol-chart-4)' },
];

export const departmentMix = [
  { name: 'General medicine', value: 36 },
  { name: 'Paediatrics', value: 18 },
  { name: 'Obstetrics', value: 16 },
  { name: 'Cardiology', value: 14 },
  { name: 'Dermatology', value: 9 },
  { name: 'Laboratory', value: 7 },
];

/* ── Activity ─────────────────────────────────────────────────────── */

export const activity: ClinicalActivity[] = [
  { id: 'ca-1', title: 'Aisha Bello checked in', detail: 'Antenatal review · Consult 3', time: '6 min ago', kind: 'check_in' },
  { id: 'ca-2', title: 'Payment received', detail: '₦32,000 POS · Chiamaka Eze', time: '12 min ago', kind: 'payment' },
  { id: 'ca-3', title: 'Lab result ready', detail: 'Malaria RDT positive · Samuel Nnamdi', time: '25 min ago', kind: 'lab' },
  { id: 'ca-4', title: 'Appointment booked', detail: 'Zainab Ahmed · tomorrow 09:00', time: '40 min ago', kind: 'appointment' },
  { id: 'ca-5', title: 'Admission recorded', detail: 'David Okon → ICU-01', time: '1h 05m ago', kind: 'admission' },
  { id: 'ca-6', title: 'Stock alert', detail: 'Malaria test kits are out of stock', time: '1h 20m ago', kind: 'alert' },
];

/* ── Reports ──────────────────────────────────────────────────────── */

export const reports = [
  { id: 'clinic-summary', name: 'Daily clinic summary', description: 'Patients seen, waiting times, admissions and revenue for today.', icon: 'chart', lastRun: 'Today · 07:00', cadence: 'Daily' },
  { id: 'revenue-collections', name: 'Revenue & collections', description: 'Billed, collected and outstanding by payer and service line.', icon: 'wallet', lastRun: 'Yesterday', cadence: 'Weekly' },
  { id: 'patient-demographics', name: 'Patient demographics', description: 'Age, sex, condition and payer mix across the patient base.', icon: 'users', lastRun: '2 days ago', cadence: 'Monthly' },
  { id: 'appointment-attendance', name: 'Appointment attendance', description: 'Show rate, no-shows and average wait by department.', icon: 'calendar', lastRun: 'Yesterday', cadence: 'Weekly' },
  { id: 'stock-levels', name: 'Stock levels', description: 'Supplies below reorder level with recommended quantities.', icon: 'box', lastRun: 'Today · 06:30', cadence: 'Daily' },
  { id: 'clinician-productivity', name: 'Clinician productivity', description: 'Consultations per clinician, average duration and follow-ups.', icon: 'stethoscope', lastRun: '2 days ago', cadence: 'Weekly' },
];

/* ── Notifications ────────────────────────────────────────────────── */

export const notifications = [
  { id: 'hn-1', title: '3 patients waiting over 20 minutes', detail: 'Cardiology and Dermatology queues', time: '5m', unread: true },
  { id: 'hn-2', title: 'Malaria test kits out of stock', detail: '5 kits used today · reorder 25', time: '18m', unread: true },
  { id: 'hn-3', title: '2 invoices are overdue', detail: '₦81,500 past due date', time: '1h', unread: true },
  { id: 'hn-4', title: 'Dr. Lawal running 22 minutes late', detail: '3 appointments affected', time: '1h', unread: false },
];
