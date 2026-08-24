import React from 'react';
import type { StaffUser } from '../types';

interface TopbarProps {
  staff: StaffUser;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  /** Owner business name — makes scope visible */
  businessName?: string;
}

export function Topbar({
  staff,
  onLogout,
  onToggleSidebar,
  businessName,
}: TopbarProps) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="ham"
        aria-label="Toggle menu"
        onClick={onToggleSidebar}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="tb-ttl" style={{ minWidth: 0, flex: 1 }}>
        <h1
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {staff.firstName || staff.name}
        </h1>
        <p
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {staff.role}
          {businessName ? ` · ${businessName}` : ''}
        </p>
      </div>
      <div className="tb-acts" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {businessName ? (
          <span
            title={`All data is scoped to ${businessName}`}
            style={{
              maxWidth: 160,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--brand-lt, #dcfce7)',
              color: 'var(--brand, #16A34A)',
              border: '1px solid var(--brand, #16A34A)',
            }}
          >
            {businessName}
          </span>
        ) : null}
        {onLogout && (
          <button type="button" className="ib" onClick={onLogout} aria-label="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
