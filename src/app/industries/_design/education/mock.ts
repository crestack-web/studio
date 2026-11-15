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
  name: 'Crescent Academy',
  legalName: 'Crescent Academy Schools Ltd',
  location: 'Ikeja, Lagos',
  address: '12 Oduduwa Crescent, Ikeja GRA, Lagos',
  phone: '+234 802 441 9070',
  email: 'office@crescentacademy.edu.ng',
  website: 'crescentacademy.edu.ng',
  currency: CUR,
  term: TERM,
  session: '2026/2027',
  ownerName: 'Mrs. Bisi Lawal',
  ownerEmail: 'bisi@crescentacademy.edu.ng',
  principal: 'Mrs. Bisi Lawal',
  motto: 'Knowledge, character, service',
  founded: '2004',
  resumption: addDays(TODAY, -52),
  termEnds: addDays(TODAY, 34),
};

export const TERM_LABEL = TERM;

/* ── Students ─────────────────────────────────────────────────────── */

export const students: Student[] = [
  {
    id: 'stu-amara',
    admission_no: 'CA/2021/0148',
    full_name: 'Amara Nwosu',
    class_name: 'JSS 3A',
    gender: 'Female',
    date_of_birth: '2012-03-18',
    age: 14,
    guardian: 'Chinedu Nwosu',
    guardian_phone: '+234 803 220 4411',
    email: 'chinedu.nwosu@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1420),
    fees_billed: 720_000,
    fees_paid: 720_000,
    balance: 0,
    attendance_rate: 98,
    average_score: 88,
    notes: 'Head of the debate club. Strong in mathematics and literature.',
  },
  {
    id: 'stu-tobi',
    admission_no: 'CA/2022/0331',
    full_name: 'Tobi Balogun',
    class_name: 'SS 2 Science',
    gender: 'Male',
    date_of_birth: '2010-07-02',
    age: 16,
    guardian: 'Funke Balogun',
    guardian_phone: '+234 805 771 2034',
    email: 'funke.balogun@yahoo.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1280),
    fees_billed: 890_000,
    fees_paid: 500_000,
    balance: 390_000,
    attendance_rate: 92,
    average_score: 81,
    notes: 'Assessment balance due before the mid-term break.',
  },
  {
    id: 'stu-zainab',
    admission_no: 'CA/2020/0092',
    full_name: 'Zainab Yusuf',
    class_name: 'SS 3 Science',
    gender: 'Female',
    date_of_birth: '2009-11-21',
    age: 17,
    guardian: 'Ibrahim Yusuf',
    guardian_phone: '+234 802 664 1180',
    email: 'ibrahim.yusuf@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1770),
    fees_billed: 950_000,
    fees_paid: 950_000,
    balance: 0,
    attendance_rate: 99,
    average_score: 94,
    notes: 'Top of the graduating class. Applying to medicine at UI and LASU.',
  },
  {
    id: 'stu-emeka',
    admission_no: 'CA/2023/0412',
    full_name: 'Emeka Okafor',
    class_name: 'JSS 1A',
    gender: 'Male',
    date_of_birth: '2014-01-09',
    age: 12,
    guardian: 'Ngozi Okafor',
    guardian_phone: '+234 806 330 8892',
    email: 'ngozi.okafor@outlook.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -430),
    fees_billed: 640_000,
    fees_paid: 640_000,
    balance: 0,
    attendance_rate: 96,
    average_score: 78,
  },
  {
    id: 'stu-fatima',
    admission_no: 'CA/2019/0057',
    full_name: 'Fatima Bello',
    class_name: 'SS 3 Arts',
    gender: 'Female',
    date_of_birth: '2009-05-14',
    age: 17,
    guardian: 'Aisha Bello',
    guardian_phone: '+234 809 118 4420',
    email: 'aisha.bello@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1950),
    fees_billed: 910_000,
    fees_paid: 410_000,
    balance: 500_000,
    attendance_rate: 88,
    average_score: 85,
    notes: 'Guardian requested a payment plan across two instalments.',
  },
  {
    id: 'stu-david',
    admission_no: 'CA/2024/0501',
    full_name: 'David Adeleke',
    class_name: 'Primary 5',
    gender: 'Male',
    date_of_birth: '2016-09-30',
    age: 10,
    guardian: 'Kemi Adeleke',
    guardian_phone: '+234 803 556 7721',
    email: 'kemi.adeleke@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -260),
    fees_billed: 480_000,
    fees_paid: 480_000,
    balance: 0,
    attendance_rate: 97,
    average_score: 82,
  },
  {
    id: 'stu-halima',
    admission_no: 'CA/2022/0298',
    full_name: 'Halima Sani',
    class_name: 'JSS 2B',
    gender: 'Female',
    date_of_birth: '2012-12-05',
    age: 13,
    guardian: 'Musa Sani',
    guardian_phone: '+234 805 990 3314',
    email: 'musa.sani@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1150),
    fees_billed: 690_000,
    fees_paid: 300_000,
    balance: 390_000,
    attendance_rate: 90,
    average_score: 74,
  },
  {
    id: 'stu-chuka',
    admission_no: 'CA/2023/0388',
    full_name: 'Chuka Eze',
    class_name: 'SS 1 Science',
    gender: 'Male',
    date_of_birth: '2011-04-27',
    age: 15,
    guardian: 'Ada Eze',
    guardian_phone: '+234 807 442 6600',
    email: 'ada.eze@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -500),
    fees_billed: 820_000,
    fees_paid: 820_000,
    balance: 0,
    attendance_rate: 94,
    average_score: 79,
  },
  {
    id: 'stu-ifeoma',
    admission_no: 'CA/2020/0114',
    full_name: 'Ifeoma Obi',
    class_name: 'SS 2 Arts',
    gender: 'Female',
    date_of_birth: '2010-02-11',
    age: 16,
    guardian: 'Patrick Obi',
    guardian_phone: '+234 802 887 1104',
    email: 'patrick.obi@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1600),
    fees_billed: 860_000,
    fees_paid: 860_000,
    balance: 0,
    attendance_rate: 95,
    average_score: 87,
    notes: 'Deputy head girl. Leads the school choir.',
  },
  {
    id: 'stu-samuel',
    admission_no: 'CA/2024/0477',
    full_name: 'Samuel Adeyinka',
    class_name: 'Primary 6',
    gender: 'Male',
    date_of_birth: '2015-06-08',
    age: 11,
    guardian: 'Bola Adeyinka',
    guardian_phone: '+234 806 220 7755',
    email: 'bola.adeyinka@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -300),
    fees_billed: 520_000,
    fees_paid: 200_000,
    balance: 320_000,
    attendance_rate: 84,
    average_score: 71,
    notes: 'Repeated absences in October; guardian meeting scheduled.',
  },
  {
    id: 'stu-aisha',
    admission_no: 'CA/2021/0206',
    full_name: 'Aisha Mohammed',
    class_name: 'JSS 1B',
    gender: 'Female',
    date_of_birth: '2014-08-19',
    age: 12,
    guardian: 'Sadiq Mohammed',
    guardian_phone: '+234 803 441 2298',
    email: 'sadiq.mohammed@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -400),
    fees_billed: 640_000,
    fees_paid: 640_000,
    balance: 0,
    attendance_rate: 98,
    average_score: 83,
  },
  {
    id: 'stu-jide',
    admission_no: 'CA/2022/0350',
    full_name: 'Jide Olatunji',
    class_name: 'SS 1 Arts',
    gender: 'Male',
    date_of_birth: '2011-10-03',
    age: 15,
    guardian: 'Yemi Olatunji',
    guardian_phone: '+234 805 660 8810',
    email: 'yemi.olatunji@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -470),
    fees_billed: 800_000,
    fees_paid: 800_000,
    balance: 0,
    attendance_rate: 91,
    average_score: 76,
  },
  {
    id: 'stu-grace',
    admission_no: 'CA/2019/0071',
    full_name: 'Grace Udo',
    class_name: 'SS 3 Arts',
    gender: 'Female',
    date_of_birth: '2009-09-12',
    age: 17,
    guardian: 'Emmanuel Udo',
    guardian_phone: '+234 802 334 5567',
    email: 'emmanuel.udo@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1900),
    fees_billed: 910_000,
    fees_paid: 910_000,
    balance: 0,
    attendance_rate: 96,
    average_score: 90,
  },
  {
    id: 'stu-ibrahim',
    admission_no: 'CA/2023/0402',
    full_name: 'Ibrahim Suleiman',
    class_name: 'JSS 3B',
    gender: 'Male',
    date_of_birth: '2012-01-25',
    age: 14,
    guardian: 'Hauwa Suleiman',
    guardian_phone: '+234 807 551 9923',
    email: 'hauwa.suleiman@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1100),
    fees_billed: 720_000,
    fees_paid: 360_000,
    balance: 360_000,
    attendance_rate: 87,
    average_score: 72,
  },
  {
    id: 'stu-nneka',
    admission_no: 'CA/2024/0533',
    full_name: 'Nneka Obiora',
    class_name: 'Nursery 2',
    gender: 'Female',
    date_of_birth: '2018-11-16',
    age: 8,
    guardian: 'Chika Obiora',
    guardian_phone: '+234 803 990 4477',
    email: 'chika.obiora@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -190),
    fees_billed: 380_000,
    fees_paid: 380_000,
    balance: 0,
    attendance_rate: 93,
    average_score: 80,
  },
  {
    id: 'stu-femi',
    admission_no: 'CA/2020/0103',
    full_name: 'Femi Ajayi',
    class_name: 'SS 2 Science',
    gender: 'Male',
    date_of_birth: '2010-03-29',
    age: 16,
    guardian: 'Tunde Ajayi',
    guardian_phone: '+234 806 112 3390',
    email: 'tunde.ajayi@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1500),
    fees_billed: 890_000,
    fees_paid: 890_000,
    balance: 0,
    attendance_rate: 89,
    average_score: 77,
  },
  {
    id: 'stu-blessing',
    admission_no: 'CA/2022/0315',
    full_name: 'Blessing Etim',
    class_name: 'JSS 2A',
    gender: 'Female',
    date_of_birth: '2012-07-07',
    age: 14,
    guardian: 'Daniel Etim',
    guardian_phone: '+234 805 228 6641',
    email: 'daniel.etim@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -1050),
    fees_billed: 690_000,
    fees_paid: 690_000,
    balance: 0,
    attendance_rate: 97,
    average_score: 84,
  },
  {
    id: 'stu-kunle',
    admission_no: 'CA/2025/0571',
    full_name: 'Kunle Adebisi',
    class_name: 'Primary 5',
    gender: 'Male',
    date_of_birth: '2016-02-20',
    age: 10,
    guardian: 'Dupe Adebisi',
    guardian_phone: '+234 802 700 5512',
    email: 'dupe.adebisi@gmail.com',
    status: 'active',
    enrolled_at: addDays(TODAY, -120),
    fees_billed: 480_000,
    fees_paid: 240_000,
    balance: 240_000,
    attendance_rate: 86,
    average_score: 68,
    notes: 'New intake. Guardian on a two-instalment plan.',
  },
  {
    id: 'stu-ngozi',
    admission_no: 'CA/2021/0176',
    full_name: 'Ngozi Ibe',
    class_name: 'JSS 3A',
    gender: 'Female',
    date_of_birth: '2012-05-23',
    age: 14,
    guardian: 'Uche Ibe',
    guardian_phone: '+234 803 889 0032',
    email: 'uche.ibe@gmail.com',
    status: 'on_hold',
    enrolled_at: addDays(TODAY, -1380),
    fees_billed: 720_000,
    fees_paid: 720_000,
    balance: 0,
    attendance_rate: 62,
    average_score: 74,
    notes: 'On medical leave until the end of the month.',
  },
];

/* ── Classes ──────────────────────────────────────────────────────── */

export const classes: SchoolClass[] = [
  { id: 'cls-n2', name: 'Nursery 2', level: 'Nursery', teacher: 'Mrs. Kemi Ojo', room: 'Block A · R1', students: 24, capacity: 30, attendance_rate: 93, average_score: 80, fee_amount: 380_000, next_lesson: 'Phonics · 09:00' },
  { id: 'cls-p5', name: 'Primary 5', level: 'Primary', teacher: 'Mr. Femi Akande', room: 'Block B · R4', students: 28, capacity: 32, attendance_rate: 95, average_score: 78, fee_amount: 480_000, next_lesson: 'Mathematics · 10:00' },
  { id: 'cls-p6', name: 'Primary 6', level: 'Primary', teacher: 'Mrs. Ada Nnadi', room: 'Block B · R5', students: 30, capacity: 32, attendance_rate: 91, average_score: 76, fee_amount: 520_000, next_lesson: 'English studies · 11:00' },
  { id: 'cls-j1a', name: 'JSS 1A', level: 'Junior', teacher: 'Mr. Paul Osei', room: 'Block C · R1', students: 26, capacity: 34, attendance_rate: 96, average_score: 79, fee_amount: 640_000, next_lesson: 'Basic science · 09:00' },
  { id: 'cls-j1b', name: 'JSS 1B', level: 'Junior', teacher: 'Mrs. Halima Idris', room: 'Block C · R2', students: 25, capacity: 34, attendance_rate: 94, average_score: 81, fee_amount: 640_000, next_lesson: 'Social studies · 09:00' },
  { id: 'cls-j2a', name: 'JSS 2A', level: 'Junior', teacher: 'Mr. Victor Eze', room: 'Block C · R3', students: 27, capacity: 34, attendance_rate: 95, average_score: 82, fee_amount: 690_000, next_lesson: 'Computer studies · 10:00' },
  { id: 'cls-j2b', name: 'JSS 2B', level: 'Junior', teacher: 'Mrs. Bola Salami', room: 'Block C · R4', students: 24, capacity: 34, attendance_rate: 90, average_score: 75, fee_amount: 690_000, next_lesson: 'Civic education · 10:00' },
  { id: 'cls-j3a', name: 'JSS 3A', level: 'Junior', teacher: 'Mr. Chinedu Nwosu', room: 'Block C · R5', students: 29, capacity: 34, attendance_rate: 97, average_score: 86, fee_amount: 720_000, next_lesson: 'Mathematics · 11:00' },
  { id: 'cls-j3b', name: 'JSS 3B', level: 'Junior', teacher: 'Mrs. Tolu Ade', room: 'Block C · R6', students: 26, capacity: 34, attendance_rate: 89, average_score: 73, fee_amount: 720_000, next_lesson: 'Business studies · 11:00' },
  { id: 'cls-s1s', name: 'SS 1 Science', level: 'Senior', teacher: 'Mr. Kola Bankole', room: 'Block D · Lab 1', students: 31, capacity: 36, attendance_rate: 94, average_score: 80, fee_amount: 820_000, next_lesson: 'Chemistry · 09:00' },
  { id: 'cls-s1a', name: 'SS 1 Arts', level: 'Senior', teacher: 'Mrs. Ify Okafor', room: 'Block D · R2', students: 28, capacity: 36, attendance_rate: 92, average_score: 78, fee_amount: 800_000, next_lesson: 'Literature · 09:00' },
  { id: 'cls-s2s', name: 'SS 2 Science', level: 'Senior', teacher: 'Mr. Segun Fashola', room: 'Block D · Lab 2', students: 30, capacity: 36, attendance_rate: 93, average_score: 82, fee_amount: 890_000, next_lesson: 'Physics · 10:00' },
  { id: 'cls-s2a', name: 'SS 2 Arts', level: 'Senior', teacher: 'Mrs. Ngozi Umeh', room: 'Block D · R4', students: 27, capacity: 36, attendance_rate: 94, average_score: 84, fee_amount: 860_000, next_lesson: 'Government · 10:00' },
  { id: 'cls-s3s', name: 'SS 3 Science', level: 'Senior', teacher: 'Dr. Moses Akin', room: 'Block D · Lab 3', students: 24, capacity: 30, attendance_rate: 98, average_score: 90, fee_amount: 950_000, next_lesson: 'Further mathematics · 11:00' },
  { id: 'cls-s3a', name: 'SS 3 Arts', level: 'Senior', teacher: 'Mrs. Yemi Sowande', room: 'Block D · R6', students: 22, capacity: 30, attendance_rate: 96, average_score: 88, fee_amount: 910_000, next_lesson: 'History · 11:00' },
];

/* ── Enrollment pipeline ──────────────────────────────────────────── */

export const enrollments: Enrollment[] = [
  { id: 'enr-1', applicant: 'Oluwaseun Ajayi', class_name: 'JSS 1A', guardian: 'Tunde Ajayi', phone: '+234 806 112 3390', email: 'tunde.ajayi@gmail.com', stage: 'offered', submitted_at: addDays(TODAY, -3), source: 'website', notes: 'Entrance assessment scored 84%. Offer valid for 14 days.' },
  { id: 'enr-2', applicant: 'Maryam Sani', class_name: 'Nursery 2', guardian: 'Musa Sani', phone: '+234 805 990 3314', email: 'musa.sani@gmail.com', stage: 'applied', submitted_at: addDays(TODAY, -1), source: 'referral' },
  { id: 'enr-3', applicant: 'Daniel Okoro', class_name: 'Primary 5', guardian: 'Chika Okoro', phone: '+234 803 661 2201', email: 'chika.okoro@gmail.com', stage: 'assessment', submitted_at: addDays(TODAY, -6), source: 'walk_in', notes: 'Assessment booked for Friday 10:00.' },
  { id: 'enr-4', applicant: 'Zara Bello', class_name: 'SS 1 Science', guardian: 'Aisha Bello', phone: '+234 809 118 4420', email: 'aisha.bello@gmail.com', stage: 'enrolled', submitted_at: addDays(TODAY, -14), source: 'website', notes: 'Fees deposited. Resumes Monday.' },
  { id: 'enr-5', applicant: 'Peter Ude', class_name: 'JSS 2B', guardian: 'Grace Ude', phone: '+234 807 552 9981', email: 'grace.ude@gmail.com', stage: 'inquiry', submitted_at: addDays(TODAY, -2), source: 'phone' },
  { id: 'enr-6', applicant: 'Hauwa Garba', class_name: 'Primary 6', guardian: 'Sani Garba', phone: '+234 805 330 1176', email: 'sani.garba@gmail.com', stage: 'applied', submitted_at: addDays(TODAY, -4), source: 'website' },
  { id: 'enr-7', applicant: 'Chinelo Obi', class_name: 'SS 2 Arts', guardian: 'Patrick Obi', phone: '+234 802 887 1104', email: 'patrick.obi@gmail.com', stage: 'assessment', submitted_at: addDays(TODAY, -8), source: 'referral' },
  { id: 'enr-8', applicant: 'Bode Akinyemi', class_name: 'JSS 3A', guardian: 'Kemi Akinyemi', phone: '+234 803 445 6620', email: 'kemi.akinyemi@gmail.com', stage: 'offered', submitted_at: addDays(TODAY, -5), source: 'walk_in' },
  { id: 'enr-9', applicant: 'Simi Adeoye', class_name: 'Nursery 2', guardian: 'Laide Adeoye', phone: '+234 806 778 4402', email: 'laide.adeoye@gmail.com', stage: 'enrolled', submitted_at: addDays(TODAY, -11), source: 'referral' },
  { id: 'enr-10', applicant: 'Yusuf Lawal', class_name: 'SS 1 Arts', guardian: 'Bisi Lawal', phone: '+234 802 441 9070', email: 'bisi@crescentacademy.edu.ng', stage: 'declined', submitted_at: addDays(TODAY, -20), source: 'phone', notes: 'Family relocated to Abuja.' },
  { id: 'enr-11', applicant: 'Nneoma Eze', class_name: 'Primary 5', guardian: 'Ada Eze', phone: '+234 807 442 6600', email: 'ada.eze@gmail.com', stage: 'inquiry', submitted_at: addDays(TODAY, -1), source: 'website' },
  { id: 'enr-12', applicant: 'Kelechi Umeh', class_name: 'JSS 1B', guardian: 'Ngozi Umeh', phone: '+234 803 220 9987', email: 'ngozi.umeh@gmail.com', stage: 'applied', submitted_at: addDays(TODAY, -7), source: 'walk_in' },
];

/* ── Attendance ───────────────────────────────────────────────────── */

export const attendanceDays: AttendanceDay[] = [
  { date: addDays(TODAY, -9), present: 318, absent: 18, late: 6, rate: 95 },
  { date: addDays(TODAY, -8), present: 312, absent: 24, late: 6, rate: 93 },
  { date: addDays(TODAY, -7), present: 321, absent: 15, late: 6, rate: 96 },
  { date: addDays(TODAY, -6), present: 316, absent: 20, late: 6, rate: 94 },
  { date: addDays(TODAY, -5), present: 309, absent: 27, late: 6, rate: 92 },
  { date: addDays(TODAY, -4), present: 324, absent: 12, late: 6, rate: 97 },
  { date: addDays(TODAY, -3), present: 320, absent: 16, late: 6, rate: 95 },
  { date: addDays(TODAY, -2), present: 315, absent: 21, late: 6, rate: 94 },
  { date: addDays(TODAY, -1), present: 322, absent: 14, late: 6, rate: 96 },
  { date: TODAY, present: 327, absent: 9, late: 6, rate: 98 },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: 'att-1', student_name: 'Amara Nwosu', class_name: 'JSS 3A', status: 'present', date: TODAY },
  { id: 'att-2', student_name: 'Tobi Balogun', class_name: 'SS 2 Science', status: 'late', date: TODAY, note: 'Arrived 08:24 — traffic on Obafemi Awolowo Way.' },
  { id: 'att-3', student_name: 'Zainab Yusuf', class_name: 'SS 3 Science', status: 'present', date: TODAY },
  { id: 'att-4', student_name: 'Emeka Okafor', class_name: 'JSS 1A', status: 'present', date: TODAY },
  { id: 'att-5', student_name: 'Fatima Bello', class_name: 'SS 3 Arts', status: 'excused', date: TODAY, note: 'Excused for a university entrance examination.' },
  { id: 'att-6', student_name: 'David Adeleke', class_name: 'Primary 5', status: 'present', date: TODAY },
  { id: 'att-7', student_name: 'Halima Sani', class_name: 'JSS 2B', status: 'present', date: TODAY },
  { id: 'att-8', student_name: 'Samuel Adeyinka', class_name: 'Primary 6', status: 'absent', date: TODAY, note: 'Third absence this week — guardian called.' },
  { id: 'att-9', student_name: 'Ngozi Ibe', class_name: 'JSS 3A', status: 'excused', date: TODAY, note: 'Medical leave on file.' },
  { id: 'att-10', student_name: 'Kunle Adebisi', class_name: 'Primary 5', status: 'late', date: TODAY, note: 'Arrived 08:31.' },
  { id: 'att-11', student_name: 'Aisha Mohammed', class_name: 'JSS 1B', status: 'present', date: TODAY },
  { id: 'att-12', student_name: 'Ibrahim Suleiman', class_name: 'JSS 3B', status: 'absent', date: TODAY, note: 'No call from guardian yet.' },
];

/* ── Teachers ─────────────────────────────────────────────────────── */

export const teachers: Teacher[] = [
  { id: 'tch-1', full_name: 'Mr. Chinedu Nwosu', email: 'chinedu.nwosu@crescentacademy.edu.ng', phone: '+234 803 220 4411', subject: 'Mathematics', classes: 3, students: 82, status: 'active', qualification: 'B.Sc Mathematics, PGDE', started: addDays(TODAY, -2200), attendance_rate: 98 },
  { id: 'tch-2', full_name: 'Mrs. Ify Okafor', email: 'ify.okafor@crescentacademy.edu.ng', phone: '+234 805 771 2034', subject: 'Literature & English', classes: 2, students: 55, status: 'active', qualification: 'B.A English, M.Ed', started: addDays(TODAY, -1800), attendance_rate: 96 },
  { id: 'tch-3', full_name: 'Mr. Kola Bankole', email: 'kola.bankole@crescentacademy.edu.ng', phone: '+234 806 330 8892', subject: 'Chemistry', classes: 3, students: 88, status: 'active', qualification: 'B.Sc Chemistry, M.Sc', started: addDays(TODAY, -1400), attendance_rate: 94 },
  { id: 'tch-4', full_name: 'Mrs. Halima Idris', email: 'halima.idris@crescentacademy.edu.ng', phone: '+234 807 442 6600', subject: 'Social studies', classes: 2, students: 51, status: 'active', qualification: 'B.Ed Social Studies', started: addDays(TODAY, -900), attendance_rate: 97 },
  { id: 'tch-5', full_name: 'Dr. Moses Akin', email: 'moses.akin@crescentacademy.edu.ng', phone: '+234 809 118 4420', subject: 'Physics', classes: 2, students: 54, status: 'active', qualification: 'B.Sc Physics, Ph.D', started: addDays(TODAY, -2600), attendance_rate: 99 },
  { id: 'tch-6', full_name: 'Mrs. Bola Salami', email: 'bola.salami@crescentacademy.edu.ng', phone: '+234 803 556 7721', subject: 'Civic education', classes: 2, students: 49, status: 'on_leave', qualification: 'B.Ed Civics', started: addDays(TODAY, -700), attendance_rate: 88 },
  { id: 'tch-7', full_name: 'Mr. Victor Eze', email: 'victor.eze@crescentacademy.edu.ng', phone: '+234 805 228 6641', subject: 'Computer studies', classes: 3, students: 79, status: 'active', qualification: 'B.Sc Computer Science', started: addDays(TODAY, -500), attendance_rate: 95 },
  { id: 'tch-8', full_name: 'Mrs. Kemi Ojo', email: 'kemi.ojo@crescentacademy.edu.ng', phone: '+234 802 700 5512', subject: 'Early years', classes: 1, students: 24, status: 'active', qualification: 'B.Ed Early Childhood', started: addDays(TODAY, -1200), attendance_rate: 98 },
  { id: 'tch-9', full_name: 'Mr. Femi Akande', email: 'femi.akande@crescentacademy.edu.ng', phone: '+234 806 112 3390', subject: 'Primary mathematics', classes: 2, students: 58, status: 'active', qualification: 'B.Ed Primary Education', started: addDays(TODAY, -1000), attendance_rate: 93 },
  { id: 'tch-10', full_name: 'Mrs. Yemi Sowande', email: 'yemi.sowande@crescentacademy.edu.ng', phone: '+234 805 990 3314', subject: 'History', classes: 2, students: 46, status: 'active', qualification: 'B.A History, PGDE', started: addDays(TODAY, -1600), attendance_rate: 92 },
];

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

export const teachingTopics: TeachingTopic[] = [
  { id: 'top-1', class_name: 'JSS 3A', subject: 'Mathematics', title: 'Quadratic equations', teacher: 'Mr. Chinedu Nwosu', status: 'in_progress', lessons_planned: 6, lessons_done: 4, term: TERM, notes: 'Factorisation is secure; word problems need another lesson.' },
  { id: 'top-2', class_name: 'JSS 3A', subject: 'Mathematics', title: 'Simultaneous equations', teacher: 'Mr. Chinedu Nwosu', status: 'planned', lessons_planned: 5, lessons_done: 0, term: TERM },
  { id: 'top-3', class_name: 'SS 1 Science', subject: 'Chemistry', title: 'Periodic table trends', teacher: 'Mr. Kola Bankole', status: 'covered', lessons_planned: 4, lessons_done: 4, term: TERM, notes: 'Assessment average 78%.' },
  { id: 'top-4', class_name: 'SS 2 Arts', subject: 'Literature', title: 'Things Fall Apart — themes', teacher: 'Mrs. Ify Okafor', status: 'in_progress', lessons_planned: 8, lessons_done: 5, term: TERM },
  { id: 'top-5', class_name: 'SS 3 Science', subject: 'Physics', title: 'Electromagnetic induction', teacher: 'Dr. Moses Akin', status: 'planned', lessons_planned: 6, lessons_done: 0, term: TERM },
  { id: 'top-6', class_name: 'Primary 5', subject: 'Mathematics', title: 'Fractions and decimals', teacher: 'Mr. Femi Akande', status: 'covered', lessons_planned: 5, lessons_done: 5, term: TERM },
  { id: 'top-7', class_name: 'Nursery 2', subject: 'Phonics', title: 'Blends and digraphs', teacher: 'Mrs. Kemi Ojo', status: 'in_progress', lessons_planned: 7, lessons_done: 3, term: TERM },
  { id: 'top-8', class_name: 'JSS 1A', subject: 'Basic science', title: 'Living and non-living things', teacher: 'Mr. Victor Eze', status: 'planned', lessons_planned: 4, lessons_done: 0, term: TERM },
];

/* ── Fees ─────────────────────────────────────────────────────────── */

const feeItems = (tuition: number, books: number, transport: number): { name: string; amount: number }[] => [
  { name: 'Tuition', amount: tuition },
  { name: 'Books & materials', amount: books },
  { name: 'Transport (term)', amount: transport },
];

export const feeInvoices: FeeInvoice[] = [
  { id: 'fee-1', number: 'CA-FEE-2601', student_id: 'stu-amara', student_name: 'Amara Nwosu', class_name: 'JSS 3A', term: TERM, items: feeItems(540_000, 90_000, 90_000), amount: 720_000, paid: 720_000, status: 'paid', date: addDays(TODAY, -48), due: addDays(TODAY, -18) },
  { id: 'fee-2', number: 'CA-FEE-2602', student_id: 'stu-tobi', student_name: 'Tobi Balogun', class_name: 'SS 2 Science', term: TERM, items: feeItems(680_000, 110_000, 100_000), amount: 890_000, paid: 500_000, status: 'partially_paid', date: addDays(TODAY, -48), due: addDays(TODAY, -4) },
  { id: 'fee-3', number: 'CA-FEE-2603', student_id: 'stu-zainab', student_name: 'Zainab Yusuf', class_name: 'SS 3 Science', term: TERM, items: feeItems(740_000, 120_000, 90_000), amount: 950_000, paid: 950_000, status: 'paid', date: addDays(TODAY, -48), due: addDays(TODAY, -18) },
  { id: 'fee-4', number: 'CA-FEE-2604', student_id: 'stu-emeka', student_name: 'Emeka Okafor', class_name: 'JSS 1A', term: TERM, items: feeItems(480_000, 80_000, 80_000), amount: 640_000, paid: 640_000, status: 'paid', date: addDays(TODAY, -47), due: addDays(TODAY, -17) },
  { id: 'fee-5', number: 'CA-FEE-2605', student_id: 'stu-fatima', student_name: 'Fatima Bello', class_name: 'SS 3 Arts', term: TERM, items: feeItems(710_000, 110_000, 90_000), amount: 910_000, paid: 410_000, status: 'overdue', date: addDays(TODAY, -48), due: addDays(TODAY, -21) },
  { id: 'fee-6', number: 'CA-FEE-2606', student_id: 'stu-david', student_name: 'David Adeleke', class_name: 'Primary 5', term: TERM, items: feeItems(360_000, 60_000, 60_000), amount: 480_000, paid: 480_000, status: 'paid', date: addDays(TODAY, -46), due: addDays(TODAY, -16) },
  { id: 'fee-7', number: 'CA-FEE-2607', student_id: 'stu-halima', student_name: 'Halima Sani', class_name: 'JSS 2B', term: TERM, items: feeItems(520_000, 90_000, 80_000), amount: 690_000, paid: 300_000, status: 'partially_paid', date: addDays(TODAY, -46), due: addDays(TODAY, -2) },
  { id: 'fee-8', number: 'CA-FEE-2608', student_id: 'stu-chuka', student_name: 'Chuka Eze', class_name: 'SS 1 Science', term: TERM, items: feeItems(630_000, 100_000, 90_000), amount: 820_000, paid: 820_000, status: 'paid', date: addDays(TODAY, -45), due: addDays(TODAY, -15) },
  { id: 'fee-9', number: 'CA-FEE-2609', student_id: 'stu-ifeoma', student_name: 'Ifeoma Obi', class_name: 'SS 2 Arts', term: TERM, items: feeItems(660_000, 110_000, 90_000), amount: 860_000, paid: 860_000, status: 'paid', date: addDays(TODAY, -45), due: addDays(TODAY, -15) },
  { id: 'fee-10', number: 'CA-FEE-2610', student_id: 'stu-samuel', student_name: 'Samuel Adeyinka', class_name: 'Primary 6', term: TERM, items: feeItems(400_000, 60_000, 60_000), amount: 520_000, paid: 200_000, status: 'overdue', date: addDays(TODAY, -44), due: addDays(TODAY, -24) },
  { id: 'fee-11', number: 'CA-FEE-2611', student_id: 'stu-aisha', student_name: 'Aisha Mohammed', class_name: 'JSS 1B', term: TERM, items: feeItems(480_000, 80_000, 80_000), amount: 640_000, paid: 640_000, status: 'paid', date: addDays(TODAY, -44), due: addDays(TODAY, -14) },
  { id: 'fee-12', number: 'CA-FEE-2612', student_id: 'stu-ibrahim', student_name: 'Ibrahim Suleiman', class_name: 'JSS 3B', term: TERM, items: feeItems(540_000, 90_000, 90_000), amount: 720_000, paid: 360_000, status: 'pending', date: addDays(TODAY, -10), due: addDays(TODAY, 11) },
  { id: 'fee-13', number: 'CA-FEE-2613', student_id: 'stu-nneka', student_name: 'Nneka Obiora', class_name: 'Nursery 2', term: TERM, items: feeItems(280_000, 50_000, 50_000), amount: 380_000, paid: 380_000, status: 'paid', date: addDays(TODAY, -9), due: addDays(TODAY, 12) },
  { id: 'fee-14', number: 'CA-FEE-2614', student_id: 'stu-kunle', student_name: 'Kunle Adebisi', class_name: 'Primary 5', term: TERM, items: feeItems(360_000, 60_000, 60_000), amount: 480_000, paid: 240_000, status: 'partially_paid', date: addDays(TODAY, -8), due: addDays(TODAY, 9) },
];

/* ── Payments ─────────────────────────────────────────────────────── */

export const payments: EduPayment[] = [
  { id: 'pay-1', reference: 'PSK-880124', student_name: 'Zainab Yusuf', invoice_number: 'CA-FEE-2603', amount: 950_000, method: 'transfer', status: 'settled', date: addDays(TODAY, -1) },
  { id: 'pay-2', reference: 'PSK-880119', student_name: 'Amara Nwosu', invoice_number: 'CA-FEE-2601', amount: 720_000, method: 'card', status: 'settled', date: addDays(TODAY, -1) },
  { id: 'pay-3', reference: 'PSK-880113', student_name: 'David Adeleke', invoice_number: 'CA-FEE-2606', amount: 480_000, method: 'pos', status: 'settled', date: addDays(TODAY, -2) },
  { id: 'pay-4', reference: 'PSK-880108', student_name: 'Tobi Balogun', invoice_number: 'CA-FEE-2602', amount: 300_000, method: 'transfer', status: 'settled', date: addDays(TODAY, -3) },
  { id: 'pay-5', reference: 'PSK-880097', student_name: 'Ifeoma Obi', invoice_number: 'CA-FEE-2609', amount: 860_000, method: 'transfer', status: 'settled', date: addDays(TODAY, -4) },
  { id: 'pay-6', reference: 'PSK-880090', student_name: 'Chuka Eze', invoice_number: 'CA-FEE-2608', amount: 820_000, method: 'card', status: 'settled', date: addDays(TODAY, -4) },
  { id: 'pay-7', reference: 'PSK-880084', student_name: 'Halima Sani', invoice_number: 'CA-FEE-2607', amount: 300_000, method: 'cash', status: 'settled', date: addDays(TODAY, -5) },
  { id: 'pay-8', reference: 'PSK-880079', student_name: 'Fatima Bello', invoice_number: 'CA-FEE-2605', amount: 210_000, method: 'transfer', status: 'settled', date: addDays(TODAY, -6) },
  { id: 'pay-9', reference: 'PSK-880072', student_name: 'Aisha Mohammed', invoice_number: 'CA-FEE-2611', amount: 640_000, method: 'pos', status: 'settled', date: addDays(TODAY, -7) },
  { id: 'pay-10', reference: 'PSK-880064', student_name: 'Samuel Adeyinka', invoice_number: 'CA-FEE-2610', amount: 200_000, method: 'cash', status: 'settled', date: addDays(TODAY, -8) },
  { id: 'pay-11', reference: 'PSK-880058', student_name: 'Kunle Adebisi', invoice_number: 'CA-FEE-2614', amount: 240_000, method: 'transfer', status: 'pending', date: addDays(TODAY, -1) },
  { id: 'pay-12', reference: 'PSK-880051', student_name: 'Nneka Obiora', invoice_number: 'CA-FEE-2613', amount: 380_000, method: 'card', status: 'settled', date: addDays(TODAY, -9) },
];

/* ── Revenue series ───────────────────────────────────────────────── */

export const revenueSeries: EduRevenuePoint[] = [
  { date: addDays(TODAY, -13), billed: 1_820_000, collected: 1_410_000, enrollment: 46 },
  { date: addDays(TODAY, -12), billed: 640_000, collected: 380_000, enrollment: 48 },
  { date: addDays(TODAY, -11), billed: 720_000, collected: 690_000, enrollment: 47 },
  { date: addDays(TODAY, -10), billed: 480_000, collected: 480_000, enrollment: 49 },
  { date: addDays(TODAY, -9), billed: 910_000, collected: 610_000, enrollment: 52 },
  { date: addDays(TODAY, -8), billed: 520_000, collected: 200_000, enrollment: 54 },
  { date: addDays(TODAY, -7), billed: 640_000, collected: 640_000, enrollment: 53 },
  { date: addDays(TODAY, -6), billed: 910_000, collected: 210_000, enrollment: 56 },
  { date: addDays(TODAY, -5), billed: 690_000, collected: 300_000, enrollment: 58 },
  { date: addDays(TODAY, -4), billed: 1_680_000, collected: 1_680_000, enrollment: 59 },
  { date: addDays(TODAY, -3), billed: 890_000, collected: 300_000, enrollment: 61 },
  { date: addDays(TODAY, -2), billed: 480_000, collected: 480_000, enrollment: 60 },
  { date: addDays(TODAY, -1), billed: 1_670_000, collected: 1_670_000, enrollment: 62 },
  { date: TODAY, billed: 480_000, collected: 240_000, enrollment: 63 },
];

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

export const levelMix = [
  { name: 'Nursery', value: studentStats.byLevel.Nursery, color: 'var(--sol-chart-1)' },
  { name: 'Primary', value: studentStats.byLevel.Primary, color: 'var(--sol-chart-2)' },
  { name: 'Junior', value: studentStats.byLevel.Junior, color: 'var(--sol-chart-3)' },
  { name: 'Senior', value: studentStats.byLevel.Senior, color: 'var(--sol-chart-4)' },
];

export const classMix = classes.map((c) => ({ name: c.name, value: c.students, color: 'var(--sol-chart-1)' }));

/* ── Activity ─────────────────────────────────────────────────────── */

export const activity: EduActivity[] = [
  { id: 'act-1', title: 'Fee payment received', detail: '₦950,000 from Zainab Yusuf · SS 3 Science', time: '08:12', kind: 'fees' },
  { id: 'act-2', title: 'Attendance submitted', detail: 'SS 2 Science marked 28 present, 2 late', time: '07:58', kind: 'attendance' },
  { id: 'act-3', title: 'New application', detail: 'Maryam Sani applied for Nursery 2', time: '07:44', kind: 'enrollment' },
  { id: 'act-4', title: 'Offer accepted', detail: 'Zara Bello enrolled in SS 1 Science', time: 'Yesterday', kind: 'enrollment' },
  { id: 'act-5', title: 'Teacher on leave', detail: 'Mrs. Bola Salami (Civic education) until Friday', time: 'Yesterday', kind: 'teacher' },
  { id: 'act-6', title: 'Overdue fees flagged', detail: '2 guardians past the 14-day window', time: 'Yesterday', kind: 'alert' },
  { id: 'act-7', title: 'Timetable updated', detail: 'SS 3 Science physics moved to Lab 3', time: '2 days ago', kind: 'class' },
  { id: 'act-8', title: 'Guardian meeting booked', detail: 'Samuel Adeyinka · Friday 15:00', time: '2 days ago', kind: 'alert' },
];

/* ── Reports ──────────────────────────────────────────────────────── */

export const reports = [
  { id: 'rep-1', name: 'Enrollment summary', description: 'Applications, offers and conversion by class for the current term.', cadence: 'Weekly', lastRun: '2 days ago', icon: 'graduation' },
  { id: 'rep-2', name: 'Fees collection', description: 'Billed, collected and outstanding balances by class and guardian.', cadence: 'Daily', lastRun: 'Today', icon: 'receipt' },
  { id: 'rep-3', name: 'Attendance register', description: 'Daily attendance rates with absence and lateness patterns.', cadence: 'Weekly', lastRun: 'Yesterday', icon: 'checklist' },
  { id: 'rep-4', name: 'Academic performance', description: 'Average scores and subject strengths across every class.', cadence: 'Monthly', lastRun: 'Last week', icon: 'chart' },
  { id: 'rep-5', name: 'Teacher workload', description: 'Class load, student counts and attendance by teacher.', cadence: 'Monthly', lastRun: 'Last week', icon: 'badge' },
];

/* ── Notifications ────────────────────────────────────────────────── */

export const notifications = [
  { id: 'not-1', title: '2 fee invoices are overdue', detail: 'Fatima Bello and Samuel Adeyinka are past due.', time: '12m ago', kind: 'alert' as const, unread: true },
  { id: 'not-2', title: 'Fee payment received', detail: '₦950,000 from Zainab Yusuf settled today.', time: '1h ago', kind: 'payment' as const, unread: true },
  { id: 'not-3', title: 'New enrollment application', detail: 'Maryam Sani applied for Nursery 2.', time: '2h ago', kind: 'enrollment' as const, unread: true },
  { id: 'not-4', title: 'Attendance below target', detail: 'JSS 3B dropped to 89% this week.', time: '4h ago', kind: 'alert' as const, unread: false },
  { id: 'not-5', title: 'Offer expiring', detail: 'Oluwaseun Ajayi’s JSS 1A offer expires in 3 days.', time: 'Yesterday', kind: 'enrollment' as const, unread: false },
  { id: 'not-6', title: 'Term calendar update', detail: 'Mid-term break now starts 4 December.', time: '2 days ago', kind: 'class' as const, unread: false },
];

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

  const anyLive =
    liveStudents.length +
      liveInvoices.length +
      livePayments.length +
      liveClasses.length +
      liveTeachers.length +
      liveTimetable.length +
      liveTopics.length +
      liveEnrollments.length +
      liveAttendanceDays.length +
      (settingsMeta ? 1 : 0) >
    0;
  if (!anyLive) return false;

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
