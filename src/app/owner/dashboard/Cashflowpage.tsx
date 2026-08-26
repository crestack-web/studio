'use client';

import React from 'react';

/**
 * Temporary stub while the full Cashflowpage is restored.
 * AppContext user-wipe fix is already on main.
 * Bank-account is_active filter fix is applied in local commit; will re-ship full page.
 */
export default function Cashflowpage() {
  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Cashflow</h1>
      <p style={{ color: '#666', lineHeight: 1.5 }}>
        This page is being restored after a deploy glitch. Please refresh in a minute,
        or use <strong>Bank Accounts</strong> from the sidebar in the meantime.
      </p>
    </div>
  );
}
