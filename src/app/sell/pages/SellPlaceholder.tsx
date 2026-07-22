'use client';

import React from 'react';
import type { SellPageId } from '../context/SellContext';

interface Props {
  page: SellPageId;
  label: string;
  icon: string;
}

export function SellPlaceholder({ label, icon }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 16,
        textAlign: 'center',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: '3rem',
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--sell-primary-lt, #E0F2FE)',
          borderRadius: 20,
        }}
      >
        {icon}
      </div>
      <div>
        <h2
          style={{
            fontFamily: 'Clash Display, Plus Jakarta Sans, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--sell-text-1, #0C1A2E)',
            marginBottom: 8,
          }}
        >
          {label}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--sell-text-3, #8AAABF)', maxWidth: 280 }}>
          This section is coming soon. We&apos;re building it now.
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          background: 'var(--sell-accent-lt, #EEF2FF)',
          borderRadius: 8,
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--sell-accent, #6366F1)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        In development
      </div>
    </div>
  );
}
