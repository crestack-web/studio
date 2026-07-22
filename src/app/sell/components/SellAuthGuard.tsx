'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSell } from '../context/SellContext';

interface Props { children: React.ReactNode; }

export function SellAuthGuard({ children }: Props) {
  const router = useRouter();
  const { user, userLoading } = useSell();

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace('/sell-login');
    }
  }, [user, userLoading, router]);

  // Loading spinner
  if (userLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#F0F9FF', gap: 16,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(14,165,233,0.30)',
          animation: 'sellPulse 1.4s ease-in-out infinite',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3D5A7A' }}>
          Loading MO Sell…
        </p>
        <style>{`
          @keyframes sellPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.75; transform: scale(0.96); }
          }
        `}</style>
      </div>
    );
  }

  // Not signed in — redirecting (render nothing)
  if (!user) return null;

  return <>{children}</>;
}
