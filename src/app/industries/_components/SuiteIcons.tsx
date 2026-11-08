import React from 'react';

type IconProps = { size?: number };

const stroke = 1.75;

/** Soft rounded tile behind each icon */
export function IconTile({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 12,
        background: bg,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function Svg({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const SuiteIcons: Record<string, React.FC<IconProps>> = {
  sales: () => (
    <IconTile bg="#EDE9FE">
      <Svg color="#6B3FE7">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6L5 3H2" />
        <circle cx="9" cy="20" r="1.2" fill="#6B3FE7" stroke="none" />
        <circle cx="17" cy="20" r="1.2" fill="#6B3FE7" stroke="none" />
      </Svg>
    </IconTile>
  ),
  cashflow: () => (
    <IconTile bg="#DCFCE7">
      <Svg color="#16A34A">
        <path d="M12 3v18" />
        <path d="M16 7H10.5a2.5 2.5 0 000 5H13.5a2.5 2.5 0 010 5H8" />
      </Svg>
    </IconTile>
  ),
  inventory: () => (
    <IconTile bg="#FEF3C7">
      <Svg color="#D97706">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 12l9 4 9-4" />
        <path d="M3 17l9 4 9-4" />
      </Svg>
    </IconTile>
  ),
  mo: () => (
    <IconTile bg="#F3E8FF">
      <Svg color="#7C3AED">
        <path d="M12 3a6 6 0 016 6c0 4-6 9-6 9S6 13 6 9a6 6 0 016-6z" />
        <circle cx="12" cy="9" r="1.5" fill="#7C3AED" stroke="none" />
      </Svg>
    </IconTile>
  ),
  staff: () => (
    <IconTile bg="#E0F2FE">
      <Svg color="#0284C7">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
        <path d="M15 19c0-1.8 1.3-3.3 3.2-3.8" />
      </Svg>
    </IconTile>
  ),
  builder: () => (
    <IconTile bg="#FCE7F3">
      <Svg color="#DB2777">
        <path d="M12 3l2 4.5L19 9l-4 3.2L16 18l-4-2.5L8 18l1-5.8L5 9l5-.5L12 3z" />
      </Svg>
    </IconTile>
  ),
  reservations: () => (
    <IconTile bg="#E0E7FF">
      <Svg color="#4F46E5">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M9 14h2M13 14h2M9 17h2" />
      </Svg>
    </IconTile>
  ),
  rooms: () => (
    <IconTile bg="#CCFBF1">
      <Svg color="#0D9488">
        <path d="M3 20V9l9-5 9 5v11" />
        <path d="M9 20v-6h6v6" />
      </Svg>
    </IconTile>
  ),
  guests: () => (
    <IconTile bg="#FFE4E6">
      <Svg color="#E11D48">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      </Svg>
    </IconTile>
  ),
  checkin: () => (
    <IconTile bg="#D1FAE5">
      <Svg color="#059669">
        <path d="M9 11l3 3 7-7" />
        <path d="M4 12a8 8 0 101.3-4.4" />
      </Svg>
    </IconTile>
  ),
  housekeeping: () => (
    <IconTile bg="#FEF9C3">
      <Svg color="#CA8A04">
        <path d="M4 20h16" />
        <path d="M8 20V10l4-4 4 4v10" />
        <path d="M10 13h4" />
      </Svg>
    </IconTile>
  ),
  revenue: () => (
    <IconTile bg="#DCFCE7">
      <Svg color="#16A34A">
        <path d="M4 19V9M9 19V5M14 19v-7M19 19V8" />
      </Svg>
    </IconTile>
  ),
  projects: () => (
    <IconTile bg="#EDE9FE">
      <Svg color="#6B3FE7">
        <rect x="3" y="4" width="7" height="7" rx="1.5" />
        <rect x="14" y="4" width="7" height="7" rx="1.5" />
        <rect x="3" y="13" width="7" height="7" rx="1.5" />
        <rect x="14" y="13" width="7" height="7" rx="1.5" />
      </Svg>
    </IconTile>
  ),
  clients: () => (
    <IconTile bg="#DBEAFE">
      <Svg color="#2563EB">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
        <path d="M15 19c0-1.8 1.3-3.3 3.2-3.8" />
      </Svg>
    </IconTile>
  ),
  tasks: () => (
    <IconTile bg="#FFEDD5">
      <Svg color="#EA580C">
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </Svg>
    </IconTile>
  ),
  time: () => (
    <IconTile bg="#E0F2FE">
      <Svg color="#0284C7">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </Svg>
    </IconTile>
  ),
  invoices: () => (
    <IconTile bg="#F3E8FF">
      <Svg color="#7C3AED">
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4" />
        <path d="M10 12h6M10 16h4" />
      </Svg>
    </IconTile>
  ),
  team: () => (
    <IconTile bg="#FCE7F3">
      <Svg color="#DB2777">
        <circle cx="8" cy="9" r="2.5" />
        <circle cx="16" cy="9" r="2.5" />
        <circle cx="12" cy="15" r="2.2" />
        <path d="M3 19c.5-2 2.5-3.5 5-3.5M16 15.5c2.5 0 4.5 1.5 5 3.5" />
      </Svg>
    </IconTile>
  ),

  patients: () => (
    <IconTile bg="#DBEAFE">
      <Svg color="#2563EB">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      </Svg>
    </IconTile>
  ),
  appointments: () => (
    <IconTile bg="#E0E7FF">
      <Svg color="#4F46E5">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </Svg>
    </IconTile>
  ),
  visits: () => (
    <IconTile bg="#D1FAE5">
      <Svg color="#059669">
        <path d="M12 3v18" />
        <path d="M5 9h14" />
        <path d="M7 15h10" />
      </Svg>
    </IconTile>
  ),
  billing: () => (
    <IconTile bg="#F3E8FF">
      <Svg color="#7C3AED">
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4" />
        <path d="M10 12h6M10 16h4" />
      </Svg>
    </IconTile>
  ),
  supplies: () => (
    <IconTile bg="#FEF3C7">
      <Svg color="#D97706">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 12l9 4 9-4" />
        <path d="M3 17l9 4 9-4" />
      </Svg>
    </IconTile>
  ),
  'clinical-staff': () => (
    <IconTile bg="#FCE7F3">
      <Svg color="#DB2777">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
        <path d="M15 19c0-1.8 1.3-3.3 3.2-3.8" />
      </Svg>
    </IconTile>
  ),
  students: () => (
    <IconTile bg="#E0F2FE">
      <Svg color="#0284C7">
        <path d="M12 4l9 4-9 4-9-4 9-4z" />
        <path d="M5 12v4c0 1.5 3.1 3 7 3s7-1.5 7-3v-4" />
      </Svg>
    </IconTile>
  ),
  classes: () => (
    <IconTile bg="#EDE9FE">
      <Svg color="#6B3FE7">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 18v2" />
      </Svg>
    </IconTile>
  ),
  enrollment: () => (
    <IconTile bg="#DCFCE7">
      <Svg color="#16A34A">
        <path d="M9 11l3 3 7-7" />
        <path d="M4 12a8 8 0 101.3-4.4" />
      </Svg>
    </IconTile>
  ),
  attendance: () => (
    <IconTile bg="#FFEDD5">
      <Svg color="#EA580C">
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </Svg>
    </IconTile>
  ),
  fees: () => (
    <IconTile bg="#DCFCE7">
      <Svg color="#16A34A">
        <path d="M12 3v18" />
        <path d="M16 7H10.5a2.5 2.5 0 000 5H13.5a2.5 2.5 0 010 5H8" />
      </Svg>
    </IconTile>
  ),
  teachers: () => (
    <IconTile bg="#FCE7F3">
      <Svg color="#DB2777">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      </Svg>
    </IconTile>
  ),
  default: () => (
    <IconTile bg="#F3F4F6">
      <Svg color="#6B7280">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 12h6" />
      </Svg>
    </IconTile>
  ),
};

export function SuiteProductIcon({ id }: { id: string }) {
  const Icon = SuiteIcons[id] || SuiteIcons.default;
  return <Icon />;
}
