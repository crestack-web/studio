'use client';

import React from 'react';

/** Same character mark as owner Ask MO (NavIcons.MoIcon). */
export function MoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size * 2.5}
      height={size * 2.5}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="40" cy="37" r="21" fill="#F5C9A0" />
      <path d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z" fill="#2C1A0E" />
      <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C" />
      <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C" />
      <circle cx="32.5" cy="34.5" r="1.5" fill="white" />
      <circle cx="50.5" cy="34.5" r="1.5" fill="white" />
      <path d="M30 43 Q40 50 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="23" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35" />
      <ellipse cx="57" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35" />
      <ellipse cx="40" cy="65" rx="16" ry="7" fill="#1DB954" opacity="0.9" />
      <rect x="32" y="58" width="16" height="9" rx="5" fill="#F5C9A0" />
      <polygon points="36,58 44,58 42,66 38,66" fill="#1DB954" />
    </svg>
  );
}
