import React from 'react';
import { PageId } from './types';

// ═══════════════════════════════════════════
//  NavIcons
//  Centralised icon map for navigation items.
//  Add new page icons here.
// ═══════════════════════════════════════════

interface NavIconsProps {
  id: PageId | string;
  size?: number;
}
/*
  Additional icons:
  - add-product
  - add-expense
  - statement
*/
export function NavIcons({ id, size = 14 }: NavIconsProps) {
  const s = { width: size, height: size };
  const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };

  switch (id) {
    case 'home':
      return <svg {...base} style={s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'sale':
      return <svg {...base} style={s}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>;
    case 'sales':
      return <svg {...base} style={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case 'inventory':
      return <svg {...base} style={s}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>;
    case 'add-product':
      // Plus in a box (add product)
      return <svg {...base} style={s}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
    case 'add-expense':
      // Minus in a box (add expense)
      return <svg {...base} style={s}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
    case 'statement':
      // Document with lines (statement)
      return <svg {...base} style={s}><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>;
    case 'reports':
      // Chart icon (P&L reports)
      return <svg {...base} style={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case 'bank-reconciliation':
      // Bank/building icon
      return <svg {...base} style={s}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;
    case 'expenses':
      return <svg {...base} style={s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
    case 'cashflow':
      return <svg {...base} style={s}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;
    case 'market':
      return <svg {...base} style={s}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
    case 'pay':
      return <svg {...base} style={s}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case 'go':
      return <svg {...base} style={s}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    case 'capital':
      return <svg {...base} style={s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'referrals':
      return <svg {...base} style={s}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>;
    case 'mo':
      // Increase icon size and ensure no stroke/fill props are passed from base
      return (
        <svg width={size * 4} height={size * 4} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" fill="#162334"></circle>
          <circle cx="40" cy="40" r="36" fill="none" stroke="#1DB954" strokeWidth="1.5"></circle>
          <circle cx="40" cy="37" r="21" fill="#F5C9A0"></circle>
          <path d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z" fill="#2C1A0E"></path>
          <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C"></ellipse>
          <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C"></ellipse>
          <circle cx="32.5" cy="34.5" r="1.5" fill="white"></circle>
          <circle cx="50.5" cy="34.5" r="1.5" fill="white"></circle>
          <path d="M30 43 Q40 50 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="none"></path>
          <ellipse cx="23" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"></ellipse>
          <ellipse cx="57" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"></ellipse>
          <ellipse cx="40" cy="65" rx="16" ry="7" fill="#1DB954" opacity="0.9"></ellipse>
          <rect x="32" y="58" width="16" height="9" rx="5" fill="#F5C9A0"></rect>
          <polygon points="36,58 44,58 42,66 38,66" fill="#1DB954"></polygon>
        </svg>
      );
    case 'services':
      return <svg {...base} style={s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
    case 'staff':
      return <svg {...base} style={s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
    case 'settings':
      return <svg {...base} style={s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case 'money-control':
      return <svg {...base} style={s}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
    case 'email-campaigns':
      return <svg {...base} style={s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
    case 'branches':
      return <svg {...base} style={s}><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>;
    default:
      return <svg {...base} style={s}><circle cx="12" cy="12" r="5"/></svg>;
  }
}

// ── Stand-alone icon helpers ──────────────────
export function MoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size * 2.5} height={size * 2.5} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="37" r="21" fill="#F5C9A0"></circle>
      <path d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z" fill="#2C1A0E"></path>
      <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C"></ellipse>
      <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C"></ellipse>
      <circle cx="32.5" cy="34.5" r="1.5" fill="white"></circle>
      <circle cx="50.5" cy="34.5" r="1.5" fill="white"></circle>
      <path d="M30 43 Q40 50 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="none"></path>
      <ellipse cx="23" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"></ellipse>
      <ellipse cx="57" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"></ellipse>
      <ellipse cx="40" cy="65" rx="16" ry="7" fill="#1DB954" opacity="0.9"></ellipse>
      <rect x="32" y="58" width="16" height="9" rx="5" fill="#F5C9A0"></rect>
      <polygon points="36,58 44,58 42,66 38,66" fill="#1DB954"></polygon>
    </svg>
  );
}
