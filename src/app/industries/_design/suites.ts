import { SOLUTION_ICONS } from '@/lib/industries/solution-icons';
import type { SolutionsNavItem, SolutionsSuite, SolutionsSuiteId } from './types';

const SECTIONS: { main: string; operations: string; finance: string; settings: string } = {
  main: 'Daily operations',
  operations: 'Team & service',
  finance: 'Finance',
  settings: 'Workspace',
};

export const SOLUTIONS_SECTION_LABELS: Record<string, string> = SECTIONS;

const hospitalityNav: SolutionsNavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard', section: 'main' },
  { id: 'reservations', label: 'Reservations', icon: 'calendar', section: 'main' },
  { id: 'rooms', label: 'Rooms', icon: 'bed', section: 'main' },
  { id: 'guests', label: 'Guests', icon: 'users', section: 'main' },
  { id: 'checkin', label: 'Check-in / Check-out', icon: 'login', section: 'main', badge: true },
  { id: 'housekeeping', label: 'Housekeeping', icon: 'sparkles', section: 'operations' },
  { id: 'room-service', label: 'Room service', icon: 'bell', section: 'operations' },
  { id: 'staff', label: 'Staff', icon: 'badge', section: 'operations' },
  { id: 'tasks', label: 'Tasks', icon: 'checklist', section: 'operations' },
  { id: 'revenue', label: 'Revenue', icon: 'trend', section: 'finance' },
  { id: 'expenses', label: 'Expenses', icon: 'receipt', section: 'finance' },
  { id: 'payments', label: 'Payments', icon: 'card', section: 'finance' },
  { id: 'reports', label: 'Reports', icon: 'chart', section: 'finance' },
  { id: 'website', label: 'Website', icon: 'globe', section: 'settings' },
  { id: 'hotel-settings', label: 'Hotel settings', icon: 'settings', section: 'settings' },
  { id: 'account', label: 'Account', icon: 'user', section: 'settings' },
];

const agricultureNav: SolutionsNavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard', section: 'main' },
  { id: 'farms', label: 'Farms', icon: 'sprout', section: 'main' },
  { id: 'plots', label: 'Plots', icon: 'layers', section: 'main' },
  { id: 'crops', label: 'Crops & cycles', icon: 'activity', section: 'main' },
  { id: 'activities', label: 'Field activities', icon: 'checklist', section: 'main', count: 8 },
  { id: 'harvest', label: 'Harvest & yield', icon: 'sprout', section: 'main', badge: true },
  { id: 'inputs', label: 'Farm inputs', icon: 'box', section: 'operations' },
  { id: 'inventory', label: 'Inventory', icon: 'box', section: 'operations', count: 3 },
  { id: 'processing', label: 'Processing', icon: 'layers', section: 'operations' },
  { id: 'packaging', label: 'Packaging', icon: 'box', section: 'operations' },
  { id: 'warehouse', label: 'Warehouse', icon: 'box', section: 'operations' },
  { id: 'equipment', label: 'Equipment', icon: 'settings', section: 'operations' },
  { id: 'team', label: 'Farm team', icon: 'badge', section: 'operations' },
  { id: 'sales', label: 'Sales orders', icon: 'receipt', section: 'finance' },
  { id: 'exports', label: 'Exports', icon: 'globe', section: 'finance', count: 2 },
  { id: 'finance', label: 'Finance', icon: 'wallet', section: 'finance' },
  { id: 'reports', label: 'Reports', icon: 'chart', section: 'finance' },
  { id: 'settings', label: 'Farm settings', icon: 'settings', section: 'settings' },
  { id: 'account', label: 'Account', icon: 'user', section: 'settings' },
];

export const SOLUTIONS_SUITES: Record<SolutionsSuiteId, SolutionsSuite> = {
  hospitality: {
    id: 'hospitality',
    name: 'Busmo Hospitality',
    shortName: 'Hospitality',
    edition: 'Hospitality',
    tagline: 'Run your hotel. Stay in control.',
    description:
      'Reservations, rooms, guests, housekeeping and revenue in one connected workspace.',
    logo: SOLUTION_ICONS.hospitality,
    greetingNoun: 'hotel',
    workspace: {
      name: 'Your hotel',
      location: '',
      plan: 'Suite plan',
      currency: 'NGN',
      ownerName: '',
      ownerEmail: '',
    },
    nav: hospitalityNav,
  },
  healthcare: {
    id: 'healthcare',
    name: 'Busmo Healthcare',
    shortName: 'Healthcare',
    edition: 'Healthcare',
    tagline: 'Care operations. Clearer every day.',
    description: 'Patients, appointments, visits, clinical staff and billing in one workspace.',
    logo: SOLUTION_ICONS.healthcare,
    greetingNoun: 'clinic',
    workspace: {
      name: 'Your clinic',
      location: '',
      plan: 'Suite plan',
      currency: 'NGN',
      ownerName: '',
      ownerEmail: '',
    },
    nav: [
      { id: 'overview', label: 'Overview', icon: 'dashboard', section: 'main' },
      { id: 'patients', label: 'Patients', icon: 'users', section: 'main' },
      { id: 'appointments', label: 'Appointments', icon: 'calendar', section: 'main' },
      { id: 'visits', label: 'Visits', icon: 'stethoscope', section: 'main' },
      { id: 'staff', label: 'Clinical staff', icon: 'badge', section: 'operations' },
      { id: 'rooms', label: 'Rooms / beds', icon: 'bed', section: 'operations' },
      { id: 'inventory', label: 'Supplies', icon: 'box', section: 'operations' },
      { id: 'billing', label: 'Billing', icon: 'receipt', section: 'finance' },
      { id: 'payments', label: 'Payments', icon: 'card', section: 'finance' },
      { id: 'reports', label: 'Reports', icon: 'chart', section: 'finance' },
      { id: 'settings', label: 'Clinic settings', icon: 'settings', section: 'settings' },
      { id: 'account', label: 'Account', icon: 'user', section: 'settings' },
    ],
  },
  professional: {
    id: 'professional',
    name: 'Busmo Professional',
    shortName: 'Professional',
    edition: 'Professional',
    tagline: 'Manage your work. Grow your business.',
    description: 'Clients, projects, tasks, time and invoices for agencies and consultancies.',
    logo: SOLUTION_ICONS.professional,
    greetingNoun: 'firm',
    workspace: {
      name: 'Your firm',
      location: '',
      plan: 'Suite plan',
      currency: 'NGN',
      ownerName: '',
      ownerEmail: '',
    },
    nav: [
      { id: 'overview', label: 'Overview', icon: 'dashboard', section: 'main' },
      { id: 'projects', label: 'Projects', icon: 'layers', section: 'main' },
      { id: 'clients', label: 'Clients', icon: 'users', section: 'main' },
      { id: 'tasks', label: 'Tasks', icon: 'checklist', section: 'main' },
      { id: 'calendar', label: 'Calendar', icon: 'calendar', section: 'main' },
      { id: 'team', label: 'Team', icon: 'badge', section: 'operations' },
      { id: 'time', label: 'Time tracking', icon: 'clock', section: 'operations' },
      { id: 'invoices', label: 'Invoices', icon: 'receipt', section: 'finance' },
      { id: 'expenses', label: 'Expenses', icon: 'wallet', section: 'finance' },
      { id: 'reports', label: 'Reports', icon: 'chart', section: 'finance' },
      { id: 'settings', label: 'Business settings', icon: 'settings', section: 'settings' },
      { id: 'account', label: 'Account', icon: 'user', section: 'settings' },
    ],
  },
  education: {
    id: 'education',
    name: 'Busmo Education',
    shortName: 'Education',
    edition: 'Education',
    tagline: 'Schools and training, organized.',
    description: 'Students, classes, attendance, teachers and fees in one workspace.',
    logo: SOLUTION_ICONS.education,
    greetingNoun: 'school',
    workspace: {
      name: 'Your school',
      location: '',
      plan: 'Suite plan',
      currency: 'NGN',
      ownerName: '',
      ownerEmail: '',
    },
    nav: [
      { id: 'overview', label: 'Overview', icon: 'dashboard', section: 'main' },
      { id: 'students', label: 'Students', icon: 'users', section: 'main' },
      { id: 'classes', label: 'Classes', icon: 'layers', section: 'main' },
      { id: 'enrollment', label: 'Enrollment', icon: 'sparkles', section: 'main' },
      { id: 'attendance', label: 'Attendance', icon: 'checklist', section: 'operations' },
      { id: 'teachers', label: 'Teachers', icon: 'badge', section: 'operations' },
      { id: 'timetable', label: 'Timetable', icon: 'calendar', section: 'operations' },
      { id: 'fees', label: 'Fees', icon: 'receipt', section: 'finance' },
      { id: 'payments', label: 'Payments', icon: 'card', section: 'finance' },
      { id: 'reports', label: 'Reports', icon: 'chart', section: 'finance' },
      { id: 'settings', label: 'School settings', icon: 'settings', section: 'settings' },
      { id: 'account', label: 'Account', icon: 'user', section: 'settings' },
    ],
  },
  agriculture: {
    id: 'agriculture',
    name: 'Busmo Agriculture',
    shortName: 'Agriculture',
    edition: 'Agriculture',
    tagline: 'From the field to the final sale.',
    description:
      'Farms, plots, crops, field work, harvests, processing, packaging, stock, sales and exports in one workspace.',
    logo: SOLUTION_ICONS.agriculture,
    greetingNoun: 'farm',
    workspace: {
      name: 'Greenfield Farms Ltd',
      location: 'Ibadan, Oyo',
      plan: 'Suite plan',
      currency: 'NGN',
      ownerName: 'Mrs. Folake Adeyemi',
      ownerEmail: 'folake@greenfieldfarms.ng',
    },
    nav: agricultureNav,
  },
};

export const SOLUTIONS_SUITE_IDS = Object.keys(SOLUTIONS_SUITES) as SolutionsSuiteId[];

export function isSolutionsSuiteId(value: unknown): value is SolutionsSuiteId {
  return (
    value === 'hospitality' ||
    value === 'healthcare' ||
    value === 'professional' ||
    value === 'education' ||
    value === 'agriculture'
  );
}

export function getSolutionsSuite(id: string): SolutionsSuite {
  return isSolutionsSuiteId(id) ? SOLUTIONS_SUITES[id] : SOLUTIONS_SUITES.hospitality;
}

export function sectionLabel(id: string): string {
  for (const suite of Object.values(SOLUTIONS_SUITES)) {
    const item = suite.nav.find((n) => n.id === id);
    if (item) return item.label;
  }
  return id.replace(/-/g, ' ');
}
