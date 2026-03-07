import React from 'react';
import type { StaffUser } from '../types';

interface TopbarProps {
  staff: StaffUser;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export function Topbar({ staff, onLogout, onToggleSidebar }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="ham" aria-label="Toggle menu" onClick={onToggleSidebar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div className="tb-ttl">
        <h1>Welcome back, {staff.firstName || staff.name}</h1>
        <p>{staff.role}</p>
      </div>
      <div className="tb-acts">
        {onLogout && (
          <button className="ib" onClick={onLogout} aria-label="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
