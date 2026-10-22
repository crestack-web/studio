'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTrialInfo } from './TrialGuard';

/**
 * Persistent trial/grace countdown on the owner dashboard.
 * Non-dismissible in the last 3 days.
 */
export function TrialBanner() {
  const info = useTrialInfo();
  const router = useRouter();

  if (!info || info.isExpired) return null;

  const days = info.daysRemaining;
  const urgent = days <= 3;
  const isGrace = info.isGrace;

  let message: string;
  if (isGrace) {
    if (days <= 0) message = 'Grace period ends today — subscribe to keep access.';
    else if (days === 1) message = 'Grace period ends tomorrow — subscribe to keep access.';
    else message = `Grace period: ${days} days left — subscribe to keep full access.`;
  } else {
    if (days <= 0) message = 'Trial ends today — subscribe to keep access after today.';
    else if (days === 1) message = 'Trial ends tomorrow — subscribe to keep access.';
    else message = `Free trial: ${days} days remaining.`;
  }

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '10px 16px',
        background: urgent ? '#FEF3C7' : '#EDE9FE',
        borderBottom: `1px solid ${urgent ? '#F59E0B' : '#C4B5FD'}`,
        color: urgent ? '#92400E' : '#4C1D95',
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={() => router.push('/subscribe')}
        style={{
          background: urgent ? '#D97706' : '#6B3FE7',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '6px 14px',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {isGrace ? 'Subscribe now' : 'Upgrade'}
      </button>
    </div>
  );
}
