export type SolutionsSuiteId = 'hospitality' | 'healthcare' | 'professional' | 'education';

export type SolutionsNavSection = 'main' | 'operations' | 'finance' | 'settings';

export type SolutionsNavItem = {
  id: string;
  label: string;
  icon: string;
  section: SolutionsNavSection;
  count?: number;
  badge?: boolean;
};

export type SolutionsSuite = {
  id: SolutionsSuiteId;
  name: string;
  shortName: string;
  edition: string;
  tagline: string;
  description: string;
  logo?: string;
  greetingNoun: string;
  workspace: {
    name: string;
    location: string;
    plan: string;
    currency: string;
    ownerName: string;
    ownerEmail: string;
  };
  nav: SolutionsNavItem[];
};

/* ── Hospitality domain types (mirror the PMS API shapes) ─────────── */

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'inspected' | 'ooo' | 'reserved';

export type Room = {
  id: string;
  room_number: string;
  floor: string;
  category: string;
  bed_type: string;
  rate_amount: number;
  capacity: number;
  size_sqm: number;
  status: RoomStatus;
  amenities: string[];
  guest_name?: string;
  guest_id?: string;
  check_out_date?: string;
  housekeeper?: string;
  notes?: string;
};

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type Booking = {
  id: string;
  guest_id?: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  room_number: string;
  category: string;
  status: BookingStatus;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  children: number;
  rate_per_night: number;
  amount: number;
  balance_amount: number;
  deposit_amount: number;
  source: 'front_desk' | 'website' | 'phone' | 'ota' | 'corporate' | 'walk_in';
  special_requests?: string;
  created_at: string;
};

export type Guest = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  id_number?: string;
  country: string;
  stays: number;
  total_spend: number;
  last_stay: string;
  vip?: boolean;
  notes?: string;
};

export type FolioLine = {
  id: string;
  booking_id: string;
  line_type: 'room' | 'food' | 'service' | 'tax' | 'discount' | 'payment';
  description: string;
  amount: number;
  created_at: string;
};

export type StaffMember = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  department: 'Front desk' | 'Housekeeping' | 'Food & beverage' | 'Management' | 'Maintenance';
  shift: 'Morning' | 'Evening' | 'Night' | 'Off duty';
  status: 'active' | 'invited' | 'suspended';
  rooms_assigned?: number;
};

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type HotelTask = {
  id: string;
  title: string;
  room?: string;
  assignee: string;
  priority: TaskPriority;
  due: string;
  done: boolean;
  group: 'today' | 'upcoming';
};

export type HousekeepingRoom = {
  id: string;
  room_number: string;
  category: string;
  stage: 'dirty' | 'in_progress' | 'inspected' | 'ready';
  assignee: string;
  priority: TaskPriority;
  updated_at: string;
  note?: string;
};

export type RoomServiceOrder = {
  id: string;
  code: string;
  room_number: string;
  guest_name: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: 'new' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  placed_at: string;
  note?: string;
};

export type RevenuePoint = {
  date: string;
  rooms: number;
  food: number;
  other: number;
  target: number;
  occupancy: number;
  adr: number;
};

export type Expense = {
  id: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
  method: string;
};

export type Payment = {
  id: string;
  reference: string;
  guest_name: string;
  room_number: string;
  amount: number;
  method: 'card' | 'transfer' | 'cash' | 'pos';
  status: 'settled' | 'pending' | 'refunded';
  date: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: 'check_in' | 'check_out' | 'booking' | 'payment' | 'housekeeping' | 'alert';
};

export type WebsiteSection = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type WebsiteInquiry = {
  id: string;
  name: string;
  email: string;
  dates: string;
  guests: number;
  status: 'new' | 'responded' | 'converted';
  received_at: string;
};

/* ── Healthcare domain types (mirror the clinic API shapes) ───────── */

export type PatientStatus = 'active' | 'new' | 'chronic' | 'inactive';

export type Patient = {
  id: string;
  mrn: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  age: number;
  sex: 'Female' | 'Male';
  blood_group: string;
  conditions: string[];
  allergies?: string[];
  status: PatientStatus;
  visits: number;
  last_visit: string;
  balance: number;
  notes?: string;
};

/** A single entry in a patient's condition timeline (add / resolve / note). */
export type ConditionLogEntry = {
  id: string;
  patient_id: string;
  patient_name: string;
  condition: string;
  action: 'add' | 'resolve' | 'note';
  status: 'active' | 'resolved' | 'note';
  severity?: 'mild' | 'moderate' | 'severe';
  note?: string;
  recorded_by?: string;
  recorded_at: string;
};

export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'waiting'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type Appointment = {
  id: string;
  patient_id: string;
  patient_name: string;
  clinician: string;
  department: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  status: AppointmentStatus;
  mode: 'in_person' | 'teleconsult';
  room?: string;
};

export type VisitStatus = 'waiting' | 'in_consultation' | 'completed';

export type Vitals = {
  blood_pressure: string;
  temperature: number;
  pulse: number;
  weight: number;
  oxygen: number;
};

export type Visit = {
  id: string;
  patient_id: string;
  patient_name: string;
  clinician: string;
  department: string;
  type: 'consultation' | 'follow_up' | 'procedure' | 'lab';
  status: VisitStatus;
  checked_in_at: string;
  room: string;
  reason: string;
  vitals: Vitals;
  diagnosis?: string;
  note?: string;
};

export type ClinicianStatus = 'on_duty' | 'off_duty' | 'on_leave';

export type Clinician = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  shift: 'Morning' | 'Afternoon' | 'Night' | 'Off duty';
  status: ClinicianStatus;
  appointments_today: number;
  license: string;
};

export type BedStatus = 'occupied' | 'available' | 'cleaning' | 'reserved';

export type Bed = {
  id: string;
  label: string;
  ward: string;
  status: BedStatus;
  patient_name?: string;
  admitted_at?: string;
  nurse: string;
  note?: string;
};

export type SupplyStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type SupplyItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  reorder_level: number;
  supplier: string;
  last_restock: string;
  unit_cost: number;
  status: SupplyStatus;
};

export type InvoiceStatus = 'paid' | 'partially_paid' | 'pending' | 'overdue';

export type Invoice = {
  id: string;
  number: string;
  patient_id: string;
  patient_name: string;
  services: { name: string; amount: number }[];
  amount: number;
  paid: number;
  status: InvoiceStatus;
  date: string;
  due_date: string;
  payer: 'Self-pay' | 'HMO' | 'Corporate' | 'Insurance';
};

export type HealthPayment = {
  id: string;
  reference: string;
  patient_name: string;
  invoice_number: string;
  amount: number;
  method: 'card' | 'transfer' | 'cash' | 'pos' | 'insurance';
  status: 'settled' | 'pending' | 'refunded';
  date: string;
};

export type ClinicalActivity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: 'check_in' | 'appointment' | 'payment' | 'lab' | 'admission' | 'alert';
};

/* ── Professional domain types (mirror the firm API shapes) ───────── */

export type ClientStatus = 'active' | 'paused' | 'closed';

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  status: ClientStatus;
  retainer: number;
  since: string;
  projects: number;
  billed: number;
  notes?: string;
};

export type ProjectStatus = 'active' | 'on_hold' | 'review' | 'done' | 'draft';

export type Project = {
  id: string;
  name: string;
  code: string;
  client_id: string;
  client_name: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  spent: number;
  start: string;
  due: string;
  lead: string;
  team: string[];
  priority: TaskPriority;
  tasks_done: number;
  tasks_total: number;
  description: string;
  tags: string[];
};

export type ProTaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type ProTask = {
  id: string;
  title: string;
  project_id: string;
  project_name: string;
  client_name: string;
  assignee: string;
  status: ProTaskStatus;
  priority: TaskPriority;
  due: string;
  estimate: number;
  labels: string[];
  description?: string;
};

export type ProEventType = 'meeting' | 'deadline' | 'review' | 'focus' | 'call';

export type ProEvent = {
  id: string;
  title: string;
  type: ProEventType;
  date: string;
  start: string;
  end: string;
  location: string;
  attendees: string[];
  project_id?: string;
  project_name?: string;
};

export type ProMemberStatus = 'active' | 'on_leave';

export type ProMember = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  discipline: 'Design' | 'Strategy' | 'Engineering' | 'Content' | 'Operations';
  status: ProMemberStatus;
  utilisation: number;
  billable_hours: number;
  capacity: number;
  rate: number;
  projects: number;
  started: string;
};

export type TimeEntry = {
  id: string;
  date: string;
  project_id: string;
  project_name: string;
  client_name: string;
  task: string;
  member: string;
  hours: number;
  billable: boolean;
  rate: number;
  notes?: string;
};

export type ProInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type ProInvoice = {
  id: string;
  number: string;
  client_id: string;
  client_name: string;
  project_id?: string;
  project_name?: string;
  items: { name: string; qty: number; rate: number }[];
  amount: number;
  paid: number;
  status: ProInvoiceStatus;
  issued: string;
  due: string;
};

export type ProExpenseStatus = 'recorded' | 'pending' | 'approved';

export type ProExpense = {
  id: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  status: ProExpenseStatus;
  date: string;
  project_name?: string;
  member: string;
  billable: boolean;
};

export type ProRevenuePoint = {
  date: string;
  billed: number;
  collected: number;
  hours: number;
  utilisation: number;
};

export type ProActivity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: 'project' | 'task' | 'invoice' | 'payment' | 'time' | 'client';
};

/* ── Education domain types (mirror the school API shapes) ────────── */

export type StudentStatus = 'active' | 'graduated' | 'withdrawn' | 'on_hold';

export type Student = {
  id: string;
  admission_no: string;
  full_name: string;
  class_name: string;
  gender: 'Female' | 'Male';
  date_of_birth: string;
  age: number;
  guardian: string;
  guardian_phone: string;
  email?: string;
  status: StudentStatus;
  enrolled_at: string;
  fees_billed: number;
  fees_paid: number;
  balance: number;
  attendance_rate: number;
  average_score: number;
  notes?: string;
};

export type SchoolClass = {
  id: string;
  name: string;
  level: 'Nursery' | 'Primary' | 'Junior' | 'Senior';
  teacher: string;
  room: string;
  students: number;
  capacity: number;
  attendance_rate: number;
  average_score: number;
  fee_amount: number;
  next_lesson: string;
};

export type EnrollmentStage =
  | 'inquiry'
  | 'applied'
  | 'assessment'
  | 'offered'
  | 'enrolled'
  | 'declined';

export type Enrollment = {
  id: string;
  applicant: string;
  class_name: string;
  guardian: string;
  phone: string;
  email: string;
  stage: EnrollmentStage;
  submitted_at: string;
  source: 'website' | 'referral' | 'walk_in' | 'phone';
  notes?: string;
};

export type AttendanceDay = {
  date: string;
  present: number;
  absent: number;
  late: number;
  rate: number;
};

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AttendanceRecord = {
  id: string;
  student_name: string;
  class_name: string;
  status: AttendanceStatus;
  date: string;
  note?: string;
};

export type TeacherStatus = 'active' | 'on_leave' | 'inactive';

export type Teacher = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  classes: number;
  students: number;
  status: TeacherStatus;
  qualification: string;
  started: string;
  attendance_rate: number;
};

export type TimetableSlot = {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  start: string;
  end: string;
  class_name: string;
  subject: string;
  teacher: string;
  room: string;
};

export type TopicStatus = 'planned' | 'in_progress' | 'covered';

export type TeachingTopic = {
  id: string;
  class_name: string;
  subject: string;
  title: string;
  teacher: string;
  status: TopicStatus;
  lessons_planned: number;
  lessons_done: number;
  term: string;
  notes?: string;
};

export type FeeStatus = 'paid' | 'partially_paid' | 'pending' | 'overdue';

export type FeeInvoice = {
  id: string;
  number: string;
  student_id: string;
  student_name: string;
  class_name: string;
  term: string;
  items: { name: string; amount: number }[];
  amount: number;
  paid: number;
  status: FeeStatus;
  date: string;
  due: string;
};

export type EduPayment = {
  id: string;
  reference: string;
  student_name: string;
  invoice_number: string;
  amount: number;
  method: 'cash' | 'transfer' | 'card' | 'pos';
  status: 'settled' | 'pending' | 'refunded';
  date: string;
};

export type EduRevenuePoint = {
  date: string;
  billed: number;
  collected: number;
  enrollment: number;
};

export type EduActivity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: 'enrollment' | 'fees' | 'attendance' | 'class' | 'teacher' | 'alert';
};
