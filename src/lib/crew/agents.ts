export type CrewAgentId =
  | 'tally'
  | 'bin'
  | 'ledger'
  | 'shift'
  | 'pulse'
  | 'nib'
  | 'brief'
  | 'host'
  | 'mo';

export type CrewAgent = {
  id: CrewAgentId;
  name: string;
  role: string;
  blurb: string;
  color: string;
  avatar: string;
  live: boolean;
  phase: 1 | 2 | 3 | 4;
};

export const CREW_AGENTS: CrewAgent[] = [
  {
    id: 'tally',
    name: 'Tally',
    role: 'Sales & cash',
    blurb: 'Reads sales, profit and expenses from your books.',
    color: '#6B3FE7',
    avatar: '/crew/tally.jpg',
    live: true,
    phase: 1,
  },
  {
    id: 'bin',
    name: 'Bin',
    role: 'Stock & suppliers',
    blurb: 'Watches stock and prepares restock lists for approval.',
    color: '#EA7A2F',
    avatar: '/crew/bin.jpg',
    live: true,
    phase: 1,
  },
  {
    id: 'ledger',
    name: 'Ledger',
    role: 'Credit & debts',
    blurb: 'Tracks who owes you and drafts follow-ups.',
    color: '#0D9488',
    avatar: '/crew/ledger.jpg',
    live: true,
    phase: 1,
  },
  {
    id: 'shift',
    name: 'Shift',
    role: 'Staff & activity',
    blurb: 'Attendance, shifts and cash discrepancies.',
    color: '#16A34A',
    avatar: '/crew/shift.jpg',
    live: false,
    phase: 2,
  },
  {
    id: 'pulse',
    name: 'Pulse',
    role: 'Business health',
    blurb: 'Connects signals across the crew into one health view.',
    color: '#E11D48',
    avatar: '/crew/pulse.jpg',
    live: false,
    phase: 2,
  },
  {
    id: 'nib',
    name: 'Nib',
    role: 'Learning',
    blurb: 'Teaches from your own patterns and goals.',
    color: '#2563EB',
    avatar: '/crew/nib.jpg',
    live: false,
    phase: 4,
  },
  {
    id: 'brief',
    name: 'Brief',
    role: 'Documents',
    blurb: 'Reports, proposals and admin packs.',
    color: '#1D4ED8',
    avatar: '/crew/brief.jpg',
    live: false,
    phase: 3,
  },
  {
    id: 'host',
    name: 'Host',
    role: 'Customers',
    blurb: 'Inquiries, bookings and front-of-house.',
    color: '#D97706',
    avatar: '/crew/host.jpg',
    live: false,
    phase: 3,
  },
];

export function getAgent(id: string): CrewAgent | undefined {
  return CREW_AGENTS.find((a) => a.id === id);
}
