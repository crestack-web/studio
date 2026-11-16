import type { IndustryConfig, IndustryId } from './types';

export const INDUSTRY_IDS = ['hospitality', 'professional', 'healthcare', 'education'] as const;

export function isIndustryId(
  value: string | null | undefined
): value is 'hospitality' | 'professional' | 'healthcare' | 'education' {
  return (
    value === 'hospitality' ||
    value === 'professional' ||
    value === 'healthcare' ||
    value === 'education'
  );
}

export const HOSPITALITY: IndustryConfig = {
  id: 'hospitality',
  productName: 'Busmo Hospitality',
  logoSrc: '/industries/busmo-hospitality-logo.png',
  shortName: 'Hospitality',
  tagline: 'Run your hotel. Stay in control.',
  description:
    'Manage reservations, rooms, guests, housekeeping, staff and hotel finances from one connected platform.',
  welcomePath: '/solutions/hospitality',
  loginPath: '/solutions/hospitality/login',
  signupPath: '/solutions/hospitality/signup',
  dashboardPath: '/solutions/hospitality/dashboard',
  features: [
    'Room and reservation management',
    'Guest management',
    'Check-in and check-out',
    'Room availability',
    'Housekeeping management',
    'Hotel revenue tracking',
    'Staff management',
    'Financial reporting',
  ],
  benefits: [
    'See occupancy and availability at a glance',
    'Keep front desk and housekeeping aligned',
    'Track hotel revenue without leaving Busmo',
    'One workspace for staff and operations',
  ],
  greetingNoun: 'hotel',
  nav: [
    { id: 'overview', label: 'Overview', href: '/solutions/hospitality/dashboard', section: 'main' },
    { id: 'ask-mo', label: 'Ask MO', href: '/solutions/hospitality/dashboard#ask-mo', section: 'main' },
    { id: 'reservations', label: 'Reservations', href: '/solutions/hospitality/dashboard/reservations', section: 'main' },
    { id: 'rooms', label: 'Rooms', href: '/solutions/hospitality/dashboard/rooms', section: 'main' },
    { id: 'guests', label: 'Guests', href: '/solutions/hospitality/dashboard/guests', section: 'main' },
    { id: 'checkin', label: 'Check-in / Check-out', href: '/solutions/hospitality/dashboard/checkin', section: 'main' },
    { id: 'website', label: 'Website (Mo-sell)', href: '/solutions/hospitality/dashboard/website', section: 'main' },
    { id: 'housekeeping', label: 'Housekeeping', href: '/solutions/hospitality/dashboard/housekeeping', section: 'operations' },
    { id: 'room-service', label: 'Room Service', href: '/solutions/hospitality/dashboard/room-service', section: 'operations' },
    { id: 'staff', label: 'Staff', href: '/solutions/hospitality/dashboard/staff', section: 'operations' },
    { id: 'tasks', label: 'Tasks', href: '/solutions/hospitality/dashboard/tasks', section: 'operations' },
    { id: 'revenue', label: 'Revenue', href: '/solutions/hospitality/dashboard/revenue', section: 'finance' },
    { id: 'expenses', label: 'Expenses', href: '/solutions/hospitality/dashboard/expenses', section: 'finance' },
    { id: 'payments', label: 'Payments', href: '/solutions/hospitality/dashboard/payments', section: 'finance' },
    { id: 'reports', label: 'Reports', href: '/solutions/hospitality/dashboard/reports', section: 'finance' },
    { id: 'hotel-settings', label: 'Hotel Settings', href: '/solutions/hospitality/dashboard/settings', section: 'settings' },
    { id: 'account', label: 'Account Settings', href: '/solutions/hospitality/dashboard/account', section: 'settings' },
  ],
  metrics: [
    { id: 'occupancy', label: 'Occupancy Rate', emptyValue: '—', hint: 'Share of rooms occupied' },
    { id: 'available', label: 'Available Rooms', emptyValue: '0' },
    { id: 'reservations_today', label: "Today's Reservations", emptyValue: '0' },
    { id: 'revenue_today', label: "Today's Revenue", emptyValue: '₦0' },
  ],
  quickActions: [
    { id: 'open-front-desk', label: 'Open Front Desk', href: '/solutions/hospitality/front-desk' },
    { id: 'new-reservation', label: 'New Reservation', href: '/solutions/hospitality/dashboard/reservations' },
    { id: 'check-in', label: 'Check In Guest', href: '/solutions/hospitality/dashboard/checkin' },
    { id: 'check-out', label: 'Check Out Guest', href: '/solutions/hospitality/dashboard/checkin' },
    { id: 'add-room', label: 'Add Room', href: '/solutions/hospitality/dashboard/rooms' },
    { id: 'view-rooms', label: 'View Rooms', href: '/solutions/hospitality/dashboard/rooms' },
    { id: 'housekeeping', label: 'Manage Housekeeping', href: '/solutions/hospitality/dashboard/housekeeping' },
  ],
};

export const PROFESSIONAL: IndustryConfig = {
  id: 'professional',
  productName: 'Busmo Professional',
  shortName: 'Professional',
  tagline: 'Manage your work. Grow your business.',
  description:
    'Bring your clients, projects, teams, schedules and business finances together in one connected workspace.',
  welcomePath: '/solutions/professional',
  loginPath: '/solutions/professional/login',
  signupPath: '/solutions/professional/signup',
  dashboardPath: '/solutions/professional/dashboard',
  features: [
    'Client management',
    'Project management',
    'Team management',
    'Task allocation',
    'Scheduling',
    'Timesheets',
    'Invoicing',
    'Revenue and profitability tracking',
  ],
  benefits: [
    'See active projects and deadlines in one place',
    'Keep clients, tasks and team workload connected',
    'Track invoices and revenue without switching tools',
    'Built for agencies, consultancies and service firms',
  ],
  greetingNoun: 'firm',
  nav: [
    { id: 'overview', label: 'Overview', href: '/solutions/professional/dashboard', section: 'main' },
    { id: 'ask-mo', label: 'Ask MO', href: '/solutions/professional/dashboard#ask-mo', section: 'main' },
    { id: 'projects', label: 'Projects', href: '/solutions/professional/dashboard/projects', section: 'main' },
    { id: 'clients', label: 'Clients', href: '/solutions/professional/dashboard/clients', section: 'main' },
    { id: 'tasks', label: 'Tasks', href: '/solutions/professional/dashboard/tasks', section: 'main' },
    { id: 'calendar', label: 'Calendar', href: '/solutions/professional/dashboard/calendar', section: 'main' },
    { id: 'team', label: 'Team', href: '/solutions/professional/dashboard/team', section: 'operations' },
    { id: 'time', label: 'Time Tracking', href: '/solutions/professional/dashboard/time', section: 'operations' },
    { id: 'workload', label: 'Workload', href: '/solutions/professional/dashboard/workload', section: 'operations' },
    { id: 'deliverables', label: 'Deliverables', href: '/solutions/professional/dashboard/deliverables', section: 'operations' },
    { id: 'invoices', label: 'Invoices', href: '/solutions/professional/dashboard/invoices', section: 'finance' },
    { id: 'payments', label: 'Payments', href: '/solutions/professional/dashboard/payments', section: 'finance' },
    { id: 'expenses', label: 'Expenses', href: '/solutions/professional/dashboard/expenses', section: 'finance' },
    { id: 'reports', label: 'Reports', href: '/solutions/professional/dashboard/reports', section: 'finance' },
    { id: 'settings', label: 'Business Settings', href: '/solutions/professional/dashboard/settings', section: 'settings' },
    { id: 'account', label: 'Account Settings', href: '/solutions/professional/dashboard/account', section: 'settings' },
  ],
  metrics: [
    { id: 'active_projects', label: 'Active Projects', emptyValue: '0' },
    { id: 'active_clients', label: 'Active Clients', emptyValue: '0' },
    { id: 'outstanding', label: 'Outstanding Invoices', emptyValue: '₦0' },
    { id: 'monthly_revenue', label: 'Monthly Revenue', emptyValue: '₦0' },
  ],
  quickActions: [
    { id: 'create-project', label: 'Create Project', href: '/solutions/professional/dashboard/projects' },
    { id: 'open-workspace', label: 'Open Staff Workspace', href: '/solutions/professional/front-desk' },
    { id: 'add-client', label: 'Add Client', href: '/solutions/professional/dashboard/clients' },
    { id: 'assign-task', label: 'Assign Task', href: '/solutions/professional/dashboard/tasks' },
    { id: 'log-hours', label: 'Log Hours', href: '/solutions/professional/dashboard/time' },
    { id: 'create-invoice', label: 'Create Invoice', href: '/solutions/professional/dashboard/invoices' },
    { id: 'view-reports', label: 'View Reports', href: '/solutions/professional/dashboard/reports' },
  ],
};


export const HEALTHCARE: IndustryConfig = {
  id: 'healthcare',
  productName: 'Busmo Healthcare',
  logoSrc: '/industries/busmo-healthcare-logo.png',
  shortName: 'Healthcare',
  tagline: 'Care operations. Clearer every day.',
  description:
    'Manage patients, appointments, clinical staff, billing and clinic finances from one connected workspace.',
  welcomePath: '/solutions/healthcare',
  loginPath: '/solutions/healthcare/login',
  signupPath: '/solutions/healthcare/signup',
  dashboardPath: '/solutions/healthcare/dashboard',
  features: [
    'Patient records',
    'Appointments and scheduling',
    'Clinical staff management',
    'Visit and encounter tracking',
    'Billing and payments',
    'Inventory for medical supplies',
    'Clinic revenue reporting',
  ],
  benefits: [
    'See today’s appointments and capacity at a glance',
    'Keep patient history connected to visits and billing',
    'Coordinate clinical and front-desk staff in one place',
    'Track clinic revenue without separate tools',
  ],
  greetingNoun: 'clinic',
  nav: [
    { id: 'overview', label: 'Overview', href: '/solutions/healthcare/dashboard', section: 'main' },
    { id: 'ask-mo', label: 'Ask MO', href: '/solutions/healthcare/dashboard#ask-mo', section: 'main' },
    { id: 'patients', label: 'Patients', href: '/solutions/healthcare/dashboard/patients', section: 'main' },
    { id: 'appointments', label: 'Appointments', href: '/solutions/healthcare/dashboard/appointments', section: 'main' },
    { id: 'visits', label: 'Visits', href: '/solutions/healthcare/dashboard/visits', section: 'main' },
    { id: 'staff', label: 'Clinical Staff', href: '/solutions/healthcare/dashboard/staff', section: 'operations' },
    { id: 'rooms', label: 'Rooms / Beds', href: '/solutions/healthcare/dashboard/rooms', section: 'operations' },
    { id: 'inventory', label: 'Supplies', href: '/solutions/healthcare/dashboard/inventory', section: 'operations' },
    { id: 'billing', label: 'Billing', href: '/solutions/healthcare/dashboard/billing', section: 'finance' },
    { id: 'payments', label: 'Payments', href: '/solutions/healthcare/dashboard/payments', section: 'finance' },
    { id: 'reports', label: 'Reports', href: '/solutions/healthcare/dashboard/reports', section: 'finance' },
    { id: 'settings', label: 'Clinic Settings', href: '/solutions/healthcare/dashboard/settings', section: 'settings' },
    { id: 'account', label: 'Account Settings', href: '/solutions/healthcare/dashboard/account', section: 'settings' },
  ],
  metrics: [
    { id: 'patients_today', label: 'Patients Today', emptyValue: '0' },
    { id: 'appointments', label: 'Appointments', emptyValue: '0' },
    { id: 'open_visits', label: 'Open Visits', emptyValue: '0' },
    { id: 'revenue_today', label: 'Revenue Today', emptyValue: '₦0' },
  ],
  quickActions: [
    { id: 'new-patient', label: 'Add Patient', href: '/solutions/healthcare/dashboard/patients' },
    { id: 'open-reception', label: 'Open Reception', href: '/solutions/healthcare/front-desk' },
    { id: 'book-appointment', label: 'Book Appointment', href: '/solutions/healthcare/dashboard/appointments' },
    { id: 'start-visit', label: 'Start Visit', href: '/solutions/healthcare/dashboard/visits' },
    { id: 'record-payment', label: 'Record Payment', href: '/solutions/healthcare/dashboard/payments' },
  ],
};

export const EDUCATION: IndustryConfig = {
  id: 'education',
  productName: 'Busmo Education',
  shortName: 'Education',
  tagline: 'Schools and training, organized.',
  description:
    'Manage students, classes, enrollment, staff, fees and school operations from one connected platform.',
  welcomePath: '/solutions/education',
  loginPath: '/solutions/education/login',
  signupPath: '/solutions/education/signup',
  dashboardPath: '/solutions/education/dashboard',
  features: [
    'Student records',
    'Classes and timetable',
    'Enrollment and admissions',
    'Attendance tracking',
    'Teachers and staff',
    'Fee collection',
    'Academic reporting',
  ],
  benefits: [
    'See enrollment and class capacity clearly',
    'Track attendance and fees without spreadsheets',
    'Keep teachers, students and parents data connected',
    'One workspace for school operations',
  ],
  greetingNoun: 'school',
  nav: [
    { id: 'overview', label: 'Overview', href: '/solutions/education/dashboard', section: 'main' },
    { id: 'ask-mo', label: 'Ask MO', href: '/solutions/education/dashboard#ask-mo', section: 'main' },
    { id: 'students', label: 'Students', href: '/solutions/education/dashboard/students', section: 'main' },
    { id: 'classes', label: 'Classes', href: '/solutions/education/dashboard/classes', section: 'main' },
    { id: 'enrollment', label: 'Enrollment', href: '/solutions/education/dashboard/enrollment', section: 'main' },
    { id: 'attendance', label: 'Attendance', href: '/solutions/education/dashboard/attendance', section: 'operations' },
    { id: 'teachers', label: 'Teachers', href: '/solutions/education/dashboard/teachers', section: 'operations' },
    { id: 'timetable', label: 'Timetable', href: '/solutions/education/dashboard/timetable', section: 'operations' },
    { id: 'fees', label: 'Fees', href: '/solutions/education/dashboard/fees', section: 'finance' },
    { id: 'payments', label: 'Payments', href: '/solutions/education/dashboard/payments', section: 'finance' },
    { id: 'reports', label: 'Reports', href: '/solutions/education/dashboard/reports', section: 'finance' },
    { id: 'settings', label: 'School Settings', href: '/solutions/education/dashboard/settings', section: 'settings' },
    { id: 'account', label: 'Account Settings', href: '/solutions/education/dashboard/account', section: 'settings' },
  ],
  metrics: [
    { id: 'students', label: 'Active Students', emptyValue: '0' },
    { id: 'classes', label: 'Classes', emptyValue: '0' },
    { id: 'attendance_today', label: 'Attendance Today', emptyValue: '—' },
    { id: 'fees_outstanding', label: 'Fees Outstanding', emptyValue: '₦0' },
  ],
  quickActions: [
    { id: 'open-front-office', label: 'Open Front Office', href: '/solutions/education/front-desk' },
    { id: 'add-student', label: 'Add Student', href: '/solutions/education/dashboard/students' },
    { id: 'enroll', label: 'Enroll Student', href: '/solutions/education/dashboard/enrollment' },
    { id: 'mark-attendance', label: 'Mark Attendance', href: '/solutions/education/dashboard/attendance' },
    { id: 'collect-fee', label: 'Collect Fee', href: '/solutions/education/dashboard/fees' },
  ],
};


export const INDUSTRY_CONFIG: Record<
  'hospitality' | 'professional' | 'healthcare' | 'education',
  IndustryConfig
> = {
  hospitality: HOSPITALITY,
  professional: PROFESSIONAL,
  healthcare: HEALTHCARE,
  education: EDUCATION,
};


export function getIndustryConfig(id: string): IndustryConfig | null {
  if (!isIndustryId(id)) return null;
  return INDUSTRY_CONFIG[id];
}

/** Map stored business category/industry strings to product edition. */
export function resolveProductEdition(opts: {
  category?: string | null;
  industry?: string | null;
  productEdition?: string | null;
  metadata?: Record<string, unknown> | null;
}): IndustryId {
  const raw = String(
    opts.productEdition ||
      opts.metadata?.product_edition ||
      opts.industry ||
      opts.category ||
      ''
  )
    .toLowerCase()
    .trim();
  if (raw === 'hospitality' || raw.includes('hotel') || raw.includes('hospitality')) {
    return 'hospitality';
  }
  if (
    raw === 'professional' ||
    raw.includes('consult') ||
    raw.includes('agency') ||
    raw.includes('professional')
  ) {
    return 'professional';
  }
  if (
    raw === 'healthcare' ||
    raw.includes('clinic') ||
    raw.includes('hospital') ||
    raw.includes('health') ||
    raw.includes('medical')
  ) {
    return 'healthcare';
  }
  if (
    raw === 'education' ||
    raw.includes('school') ||
    raw.includes('university') ||
    raw.includes('college') ||
    raw.includes('training') ||
    raw.includes('education')
  ) {
    return 'education';
  }
  return 'business';
}

export function dashboardPathForEdition(edition: IndustryId): string {
  if (edition === 'hospitality') return HOSPITALITY.dashboardPath;
  if (edition === 'professional') return PROFESSIONAL.dashboardPath;
  if (edition === 'healthcare') return HEALTHCARE.dashboardPath;
  if (edition === 'education') return EDUCATION.dashboardPath;
  return '/owner/dashboard';
}
