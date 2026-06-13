'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    const handleOnline = () => {
      if (!isOnline) {
        setStatus('online');
        setShowNotification(true);
        setIsOnline(true);
        // Hide after 3 seconds
        setTimeout(() => setShowNotification(false), 3000);
      }
    };

    const handleOffline = () => {
      setStatus('offline');
      setShowNotification(true);
      setIsOnline(false);
    };

    // Check initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  if (!showNotification) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: status === 'online' 
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          boxShadow: status === 'online'
            ? '0 4px 20px rgba(34, 197, 94, 0.3)'
            : '0 4px 20px rgba(239, 68, 68, 0.3)',
          fontSize: '1rem',
          fontWeight: 500,
          minWidth: '200px',
        }}
      >
        {status === 'online' ? (
          <>
            <Wifi size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>You're back online</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Connection restored</div>
            </div>
          </>
        ) : (
          <>
            <WifiOff size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>You're offline</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Check your connection</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Global style for animation
export const NetworkStatusStyles = () => (
  <style>{`
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `}</style>
);
