'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, CloudUpload } from 'lucide-react';
import { offlineManager, type NetworkStatus as NetStatus } from '@/lib/offline/offline-manager';

export function NetworkStatus() {
  const [status, setStatus] = useState<NetStatus>('online');
  const [pending, setPending] = useState(0);
  const [toast, setToast] = useState<'online' | 'offline' | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    offlineManager.init();

    const unsubStatus = offlineManager.subscribe((s) => {
      setStatus(s);
      setToast(s);
      if (s === 'online') {
        const t = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(t);
      }
    });

    const unsubPending = offlineManager.subscribePendingCount(setPending);

    return () => {
      unsubStatus();
      unsubPending();
    };
  }, []);

  useEffect(() => {
    if (status !== 'online' || pending <= 0) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        await offlineManager.syncPendingSales();
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, pending]);

  if (!isClient) return null;

  const showOfflineBar = status === 'offline';
  const showToast = toast !== null && (toast === 'offline' || toast === 'online');

  return (
    <>
      {showOfflineBar && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            background: 'linear-gradient(90deg, #7c2d12 0%, #991b1b 100%)',
            color: '#fff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          <WifiOff size={16} />
          <span>
            Offline mode — sales will queue and sync when you reconnect
            {pending > 0 ? ` · ${pending} pending` : ''}
          </span>
        </div>
      )}

      {status === 'online' && pending > 0 && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: 'linear-gradient(135deg, #4c1d95 0%, #5717ee 100%)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(87, 23, 238, 0.35)',
          }}
        >
          <CloudUpload size={16} className={syncing ? 'animate-spin' : undefined} />
          <span>
            {syncing
              ? `Syncing ${pending} offline sale${pending === 1 ? '' : 's'}…`
              : `${pending} offline sale${pending === 1 ? '' : 's'} waiting to sync`}
          </span>
        </div>
      )}

      {showToast && toast === 'online' && !showOfflineBar && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 10001,
            animation: 'busmoSlideInRight 0.3s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
              fontSize: '0.95rem',
              fontWeight: 500,
              minWidth: 200,
            }}
          >
            <Wifi size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>You're back online</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {pending > 0 ? 'Syncing offline sales…' : 'Connection restored'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const NetworkStatusStyles = () => (
  <style>{`
    @keyframes busmoSlideInRight {
      from { opacity: 0; transform: translateX(100px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `}</style>
);
