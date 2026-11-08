import type { IndustryConfig, IndustryId } from './types';

export const INDUSTRY_IDS = ['hospitality', 'professional'] as const;

export function isIndustryId(value: string | null | undefined): value is 'hospitality' | 'professional' {
  return value === 'hospitality' || value === 'professional';
}

export const HOSPITALITY: IndustryConfig = {
  id: 'hospitality',
  productName: 'Busmo Hospitality',
  shortName: 'Hospitality',
  tagline: 'Run your hotel. Stay in control.',
  description:
    'Manage reservations, rooms, guests, housekeeping, staff and hotel finances from one connected platform.',
  welcomePath: '/industries/hospitality',
  loginPath: '/industries/hospitality/login',
  signupPath: '/industries/hospitality/signup',
  dashboardPath: '/industries/hospitality/dashboard',
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
    { id: 'overview', label: 'Overview', href: '/industries/hospitality/dashboard', section: 'main' },
    { id: 'reservations', label: 'Reservations', href: '/industries/hospitality/dashboard/reservations', section: 'main' },
    { id: 'rooms', label: 'Rooms', href: '/industries/hospitality/dashboard/rooms', section: 'main' },
    { id: 'guests', label: 'Guests', href: '/industries/hospitality/dashboard/guests', section: 'main' },
    { id: 'checkin', label: 'Check-in / Check-out', href: '/industries/hospitality/dashboard/checkin', section: 'main' },
    { id: 'housekeeping', label: 'Housekeeping', href: '/industries/hospitality/dashboard/housekeeping', section: 'operations' },
    { id: 'room-service', label: 'Room Service', href: '/industries/hospitality/dashboard/room-service', section: 'operations' },
    { id: 'staff', label: 'Staff', href: '/industries/hospitality/dashboard/staff', section: 'operations' },
    { id: 'tasks', label: 'Tasks', href: '/industries/hospitality/dashboard/tasks', section: 'operations' },
    { id: 'revenue', label: 'Revenue', href: '/industries/hospitality/dashboard/revenue', section: 'finance' },
    { id: 'expenses', label: 'Expenses', href: '/industries/hospitality/dashboard/expenses', section: 'finance' },
    { id: 'payments', label: 'Payments', href: '/industries/hospitality/dashboard/payments', section: 'finance' },
    { id: 'reports', label: 'Reports', href: '/industries/hospitality/dashboard/reports', section: 'finance' },
    { id: 'hotel-settings', label: 'Hotel Settings', href: '/industries/hospitality/dashboard/settings', section: 'settings' },
    { id: 'account', label: 'Account Settings', href: '/industries/hospitality/dashboard/account', section: 'settings' },
  ],
  metrics: [
    { id: 'occupancy', label: 'Occupancy Rate', emptyValue: '—', hint: 'Share of rooms occupied' },
    { id: 'available', label: 'Available Rooms', emptyValue: '0' },
    { id: 'reservations_today', label: "Today's Reservations", emptyValue: '0' },
    { id: 'revenue_today', label: "Today's Revenue", emptyValue: '₦0' },
  ],
  quickActions: [
    { id: 'new-reservation', label: 'New Reservation', href: '/industries/hospitality/dashboard/reservations' },
    { id: 'check-in', label: 'Check In Guest', href: '/industries/hospitality/dashboard/checkin' },
    { id: 'check-out', label: 'Check Out Guest', href: '/industries/hospitality/dashboard/checkin' },
    { id: 'add-room', label: 'Add Room', href: '/industries/hospitality/dashboard/rooms' },
    { id: 'view-rooms', label: 'View Rooms', href: '/industries/hospitality/dashboard/rooms' },
    { id: 'housekeeping', label: 'Manage Housekeeping', href: '/industries/hospitality/dashboard/housekeeping' },
  ],
};

export const PROFESSIONAL: IndustryConfig = {
  id: 'professional',
  productName: 'Busmo Professional',
  shortName: 'Professional',
  tagline: 'Manage your work. Grow your business.',
  description:
    'Bring your clients, projects, teams, schedules and business finances together in one connected workspace.',
  welcomePath: '/industries/professional',
  loginPath: '/industries/professional/login',
  signupPath: '/industries/professional/signup',
  dashboardPath: '/industries/professional/dashboard',
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
    { id: 'overview', label: 'Overview', href: '/industries/professional/dashboard', section: 'main' },
    { id: 'projects', label: 'Projects', href: '/industries/professional/dashboard/projects', section: 'main' },
    { id: 'clients', label: 'Clients', href: '/industries/professional/dashboard/clients', section: 'main' },
    { id: 'tasks', label: 'Tasks', href: '/industries/professional/dashboard/tasks', section: 'main' },
    { id: 'calendar', label: 'Calendar', href: '/industries/professional/dashboard/calendar', section: 'main' },
    { id: 'team', label: 'Team', href: '/industries/professional/dashboard/team', section: 'operations' },
    { id: 'time', label: 'Time Tracking', href: '/industries/professional/dashboard/time', section: 'operations' },
    { id: 'workload', label: 'Workload', href: '/industries/professional/dashboard/workload', section: 'operations' },
    { id: 'deliverables', label: 'Deliverables', href: '/industries/professional/dashboard/deliverables', section: 'operations' },
    { id: 'invoices', label: 'Invoices', href: '/industries/professional/dashboard/invoices', section: 'finance' },
    { id: 'payments', label: 'Payments', href: '/industries/professional/dashboard/payments', section: 'finance' },
    { id: 'expenses', label: 'Expenses', href: '/industries/professional/dashboard/expenses', section: 'finance' },
    { id: 'reports', label: 'Reports', href: '/industries/professional/dashboard/reports', section: 'finance' },
    { id: 'settings', label: 'Business Settings', href: '/industries/professional/dashboard/settings', section: 'settings' },
    { id: 'account', label: 'Account Settings', href: '/industries/professional/dashboard/account', section: 'settings' },
  ],
  metrics: [
    { id: 'active_projects', label: 'Active Projects', emptyValue: '0' },
    { id: 'active_clients', label: 'Active Clients', emptyValue: '0' },
    { id: 'outstanding', label: 'Outstanding Invoices', emptyValue: '₦0' },
    { id: 'monthly_revenue', label: 'Monthly Revenue', emptyValue: '₦0' },
  ],
  quickActions: [
    { id: 'create-project', label: 'Create Project', href: '/industries/professional/dashboard/projects' },
    { id: 'add-client', label: 'Add Client', href: '/industries/professional/dashboard/clients' },
    { id: 'assign-task', label: 'Assign Task', href: '/industries/professional/dashboard/tasks' },
    { id: 'log-hours', label: 'Log Hours', href: '/industries/professional/dashboard/time' },
    { id: 'create-invoice', label: 'Create Invoice', href: '/industries/professional/dashboard/invoices' },
    { id: 'view-reports', label: 'View Reports', href: '/industries/professional/dashboard/reports' },
  ],
};

export const INDUSTRY_CONFIG: Record<'hospitality' | 'professional', IndustryConfig> = {
  hospitality: HOSPITALITY,
  professional: PROFESSIONAL,
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
  return 'business';
}

export function dashboardPathForEdition(edition: IndustryId): string {
  if (edition === 'hospitality') return HOSPITALITY.dashboardPath;
  if (edition === 'professional') return PROFESSIONAL.dashboardPath;
  return '/owner/dashboard';
}
